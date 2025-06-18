import 'dotenv/config'
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from "fs";
import { vl } from "moondream";
import mongodb from './config/mongoose-connection.js'
import express from 'express';
import queries from './dbQuery/query.js'
import cors from "cors";
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log(__dirname)
const app = express();
const port = process.env.PORT || 3000;
const chatID = process.env.CHATID


app.use(cors({
    origin: ["http://localhost:5173",],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

const Mongo = mongodb
Mongo.then(() => {
    console.log("mongodb connected")

}).catch(err => {
    console.error("Mongodb connection error", err)
})

app.use(express.json());

app.use('/db', queries)

// async function textToJson(plainText) {
//     const apptoken = process.env.APPLICATION_TOKEN
//     const payload = {
//         "input_value": plainText,
//         "output_type": "chat",
//         "input_type": "chat",
//     };

//     const options = {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${apptoken}`
//         },
//         body: JSON.stringify(payload)
//     };

//     const op = await getAns();

//     async function getAns() {
//         const response = await fetch('https://api.langflow.astra.datastax.com/lf/6dc7c9fb-7064-4e14-9d1f-9931bf384276/api/v1/run/e493149c-829f-46a0-a585-44f4f6eba9ed'
//             , options)
//         const data = await response.json()
//         return data.outputs[0].outputs[0].results.message.data.text;
//     }
//     return op;
// }


const VENV_DIR = path.join(__dirname, 'pythonScripts/venv'); // Name of your virtual environment directory
let pythonExecutable;
if (process.platform === 'win32') {
    pythonExecutable = path.join(VENV_DIR, 'Scripts', 'python.exe');
} else {
    pythonExecutable = path.join(VENV_DIR, 'bin', 'python');
}

const pythonScriptPath = path.join(__dirname, "pythonScripts/main.py");

async function runScript(text){
    return new Promise((resolve, reject) => {
        const messagePackage = JSON.stringify(text);
        const pythonProcess = spawn(pythonExecutable, [pythonScriptPath, messagePackage]);
        let scriptOutput = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            scriptOutput += data.toString();
            console.log("script raw output:", data.toString().trim()); // Log raw data to see if it's coming in chunks
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`Python stderr: ${data.toString().trim()}`); // For debugging
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) { // Python script exited successfully
                try {
                    // Attempt to parse the JSON output from the Python script
                    const parsedOutput = JSON.parse(scriptOutput);
                    console.log("Parsed Output:", parsedOutput);
                    resolve(parsedOutput); // Resolve the promise with the parsed output
                } catch (e) {
                    console.error("Error parsing Python JSON output:", e);
                    reject(new Error("Error parsing Python JSON output: " + e.message)); // Reject on parsing error
                }
            } else { // Python script exited with an error
                const errorMessage = `Python script exited with code ${code}. Error: ${errorOutput}`;
                console.error(errorMessage);
                reject(new Error(errorMessage)); // Reject the promise with an error
            }
        });

        pythonProcess.on('error', (err) => {
            console.error('Failed to start python subprocess.', err);
            reject(new Error('Failed to start python subprocess: ' + err.message));
        });
    });
}



async function addDates(JSONobject){
    const curDate = new Date()
    const day = curDate.getDate();
    console.log(day)
    const month = curDate.getMonth() + 1; // Months are 0-based in JavaScript
    const year = curDate.getFullYear();
    JSONobject["transactDay"] = day;
    JSONobject["transactMonth"] = month
    JSONobject["transactYear"] = year;
    return JSONobject;
}


async function updateDB_amount(obj, msg){
    let prevID
    if(msg.reply_to_message){
        prevID = msg.reply_to_message.message_id - 1;
    } else {
        prevID = msg.message_id - 2;
    }
    obj['messageID'] = prevID;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
    };
    const response = await fetch('http://localhost:3000/db/amount-update'
        , options)
    if (response.ok) {
        const returnData = "Amount updated to " + obj.transaction;
        return returnData
    }
    else {
        const data = "Amount not updated. Please try again in some time";
        return data;
    }
}

async function updateDB_remark(obj, msg){
    let prevID
    if(msg.reply_to_message){
        prevID = msg.reply_to_message.message_id - 1;
    } else {
        prevID = msg.message_id - 2;
    }
    obj['messageID'] = prevID;
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(obj)
    };
    const response = await fetch('http://localhost:3000/db/remark-update'
        , options)
    if (response.ok) {
        const returnData = "Remark updated to " + obj.remark;
        return returnData
    }
    else {
        const data = "Remark not updated. Please try again in some time";
        return data;
    }
}


async function monthStart(year, month) {
    const payload = {
        'month': month,
        'year': year,
    };

    const sendData = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    }
    const reply = await fetch('http://localhost:3000/db/transaction-total', sendData)
    const replied = await reply.json()
    return replied
}

async function checkMonth() {
    const date = new Date();
    if (date.getDate() === 1) return true;
    return false;
}


async function insertInDB(JSONobject) {

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(JSONobject)
    };
    const response = await fetch('http://localhost:3000/db/transaction-add'
        , options)
    if (response.ok) {
        const returnData = "Transaction of " + JSONobject.transaction + " for " + JSONobject.remark + " was added.";
        return returnData
    }
    else {
        const data = "transaction not added. please try again in some time";
        return data;
    }

}

function test() {
    const temp = ```json
    {
        "messageID": "1234567890",
        "transaction": 1000,
        "remark": "Test transaction",
        "transactDate": "2023-10-01T00:00:00Z"
    }
    ```
    console.log(temp.slice(6));

}

// test();

const token = process.env.TELE_TOKEN
const moondrem = process.env.MOONDREAM_KEY
const bot = new TelegramBot(token, { polling: true });
const model = new vl({ apiKey: `${moondrem}` });


// setInterval(async () => {
//     try {
//         const test = await runScript("paid 30 to x");
//         await addDates(test)
//     } catch (error) {
//         console.error("Error in addTransact call:", error);
//     }
// }, 100000000);


setInterval(async () => {
    const condition = await checkMonth(); // Your condition check function
    if (condition) {
        let month;
        const date = new Date();
        if (date.getMonth() == 0) {
            month = 12;
            //year = date.getFullYear - 1;
        }
        else month = date.getMonth();
        const year = date.getFullYear();
        const data = await monthStart(year, month);
        // const data = await monthStart(year, month);

        // const keys = Object.keys(data);
        // for (const key of keys) {
        //     console.log(key)
        //     const toSend = key + ": " + data[key];
        //     console.log("to Send", toSend);
        //     await bot.sendMessage(chatID, toSend);
        // }
        data.forEach(async item => {
            await bot.sendMessage(chatID, '--- Item ---');
            await bot.sendMessage(chatID, `Remark: ${item.remark}`);
            await bot.sendMessage(chatID, `Transaction: ${item.transaction}`);

        });

    }
}, 72000000)


bot.on("message", async (msg) => {
    const tempID = msg.chat.id;
    console.log(tempID)

    if (msg.photo) {
        const pic = msg.photo[msg.photo.length - 1]
        const fileID = pic.file_id

        const fileLink = await bot.getFileLink(fileID)
        const response = await axios.get(fileLink, { responseType: 'arraybuffer' })
        const imgpath = "./data/screenshot.jpg"
        fs.writeFileSync(imgpath, response.data)
        const image = response.data
        const queryResponse = await model.query({
            image,
            question: "What is the transaction amount and what was the remark (the remark is either mentioned explicitly or it is present directly under the transaction amount)?",
            stream: false,
        });
        console.log(queryResponse.answer);

        let obj
        try {
            const scriptop = await runScript(queryResponse.answer);
            obj = await addDates(scriptop);
        } catch (error) {
            console.error("Error in addTransact call:", error);
        }
        obj['messageID'] = msg.message_id;
        let mess
        if(obj.action === "add_transaction"){
            obj.remark = obj.remark.toLowerCase();
            console.log(obj);
            mess = await insertInDB(obj);
        }
        bot.sendMessage(tempID, mess);
        
    }

    if (msg.text) {
        let obj
        try {
            const scriptop = await runScript(msg.text);
            obj = await addDates(scriptop);
        } catch (error) {
            console.error("Error in script call:", error);
        }
        let mess
        if(obj.action === "add_transaction"){
            obj['messageID'] = msg.message_id;
            mess = await insertInDB(obj);
            obj.remark = obj.remark.toLowerCase();
        } else if(obj.action === "update_amount"){
            mess = await updateDB_amount(obj, msg);
        } else if(obj.action === "update_remark"){
            mess = await updateDB_remark(obj, msg); 
            obj.remark = obj.remark.toLowerCase();
        }
        console.log(obj);
        bot.sendMessage(tempID, mess);
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})