import mongoose from 'mongoose'
import dbgr from 'debug'
const dbg=dbgr("development:Mongoose");

const mongo=mongoose.connect(`mongodb://127.0.0.1:27017/paymentApp`)
.then(()=>{
    dbg("connected")
}).catch((err)=>{
    console.log(err);
})
export default mongo;
