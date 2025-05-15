import 'dotenv/config'
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import TelegramBot from 'node-telegram-bot-api';
import axios from 'axios';
import fs from "fs";
import { vl } from "moondream";
import mongodb from './config/mongoose-connection.js'
import express from 'express';
import queries from './dbQuery/query.js'
import cors from "cors";


const app = express();
const port = 3000;
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

async function textToJson(plainText) {
    const apptoken = process.env.APPLICATION_TOKEN
    const payload = {
        "input_value": plainText,
        "output_type": "chat",
        "input_type": "chat",
    };

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apptoken}`
        },
        body: JSON.stringify(payload)
    };

    const op = await getAns();

    async function getAns() {
        const response = await fetch('https://api.langflow.astra.datastax.com/lf/6dc7c9fb-7064-4e14-9d1f-9931bf384276/api/v1/run/e493149c-829f-46a0-a585-44f4f6eba9ed'
            , options)
        const data = await response.json()
        return data.outputs[0].outputs[0].results.message.data.text;
    }
    return op;
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
        const op = await textToJson(queryResponse.answer)
        const sliced = op.slice(7, -4);
        const obj = JSON.parse(sliced);
        obj['messageID'] = msg.message_id;
        console.log(obj.remark.toLowerCase());
        console.log(obj);
        const mess = await insertInDB(obj);
        console.log(mess);
        bot.sendMessage(tempID, mess);
        // console.log(JSON.stringify(JSONobject))
    }

    if (msg.text) {
        const op = await textToJson(msg.text)
        const sliced = op.slice(7, -4);
        const obj = JSON.parse(sliced);
        obj['messageID'] = msg.message_id;
        obj.remark = obj.remark.toLowerCase();
        console.log(obj);
        const mess = await insertInDB(obj);
        bot.sendMessage(tempID, mess);
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})