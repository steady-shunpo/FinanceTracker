import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    messageID: {
        type: String,
    },
    transaction: {
        type: Number,
    },
    remark: {
        type: String,
    },
    transactDay:{
        type: Number
    },
    transactMonth: {
        type: Number,
    },
    transactYear: {
        type: Number,
    },
});


  

const transactionModel = mongoose.model("transactions", userSchema);
export default transactionModel;