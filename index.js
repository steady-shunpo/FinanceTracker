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

const app = express();
const port = 3000;


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
    const replied = reply.json()
    console.log(replied)
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
    const data = await response.json()

    return data.message


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
console.log(process.env)
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
        bot.on("message", async(msg) =>{
            const chatID = msg.chat.id
            for (const key of Object.keys(data)){
                const toSend = key + ": " + data.key
                await bot.sendMessage(chatID, toSend)
            }
        })
        
    }
}, 3600000)
bot.on("message", async (msg) => {
    const chatID = msg.chat.id

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
        const obj = JSON.parse(sliced)
        obj['messageID'] = msg.message_id
        console.log(obj)
        const mess = insertInDB(obj)
        bot.sendMessage(chatID, mess)
        // console.log(JSON.stringify(JSONobject))
    }

    if (msg.text) {
        const op = await textToJson(msg.text)
        const sliced = op.slice(7, -4);
        const obj = JSON.parse(sliced)
        obj['messageID'] = msg.message_id
        console.log(obj)
        const mess = insertInDB(obj)
        // bot.sendMessage(chatID, mess)
    }
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})