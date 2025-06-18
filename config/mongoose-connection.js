import mongoose from 'mongoose'
import dbgr from 'debug'
const dbg=dbgr("development:Mongoose");

const mongo=mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7ojpowz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
.then(()=>{
    dbg("connected")
}).catch((err)=>{
    console.log(err);
})
export default mongo;
