import transactionModel from '../models/dbModel.js'
import express from 'express';
import { Router } from 'express';
import { v4 } from 'uuid';

const router = Router();

router.post('/transaction-add', async (req, res) => {
    const { messageID, transaction, remark, transactMonth, transactYear, transactDay } = req.body;
    const newTransaction = new transactionModel({
        messageID,
        transaction,
        remark,
        transactDay,
        transactMonth,
        transactYear,
    });

    try {
        await newTransaction.save();
        res.status(201).json({ message: 'Transaction added successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error adding transaction' });
    }
})


router.post('/transaction-update', async (req, res) => {
    const { messageID, transaction, remark, transactMonth, transactYear, transactDay } = req.body;
    try {
        const updatedTransaction = await transactionModel.findOneAndUpdate(
            { messageID },
            { transaction, remark },
            { new: true }
        );

        if (!updatedTransaction) {
            const newTransaction = new transactionModel({
                messageID,
                transaction,
                remark,
                transactDay,
                transactMonth,
                transactYear,
            });
            try {
                await newTransaction.save();
                res.status(201).json({ message: 'Transaction added successfully' });
            } catch (error) {
                res.status(500).json({ error: 'Error adding transaction' });
            }
        }
        res.status(200).json({ message: 'Transaction updated successfully', updatedTransaction });
    } catch (error) {
        res.status(500).json({ error: 'Error updating transaction' });
    }

})

// router.post('/transaction-total', async (req, res) => { 
//     const { month, year } = req.body;
//     console.log(month, year);
    
//     // Create dates using month-1 since JavaScript months are 0-based
//     const startOfMonth = new Date(year, month-1, 1);
//     const endOfMonth = new Date(year, month, 0); // Last day of the month
//     const currentDate = new Date(2025,  11, 5);
//     const currentdate1 = new Date(2025, 11, 5);
//     currentDate.setUTCHours(0, 0, 0, 0);
//     currentDate.setMonth(month-1);

//     currentdate1.setUTCHours(23, 59, 59, 999);
//     currentdate1.setMonth(month-1);
//     // Set time to start and end of day
//     startOfMonth.setUTCHours(0, 0, 0, 0);
//     endOfMonth.setUTCHours(23, 59, 59, 999);
    
//     const tempstart = startOfMonth.toISOString();
//     const tempend = endOfMonth.toISOString();
    
//     console.log('Date range:', tempstart, tempend);
//     console.log('Current date:', currentdate1.toISOString());
    
//     try {
//         const month_transactions = await transactionModel.find({
//             // transactDate: { 
//             //     $gte: tempstart, 
//             //     $lte: tempend 
//             // }
//             transactDate: {
//                 $gte: currentDate,
//                 $lte: currentdate1
//             }
//         });
        
//         console.log('Found transactions:', month_transactions);
//         res.json(month_transactions);
//     } catch (error) {
//         console.error('Error fetching transactions:', error);
//         res.status(500).json({ error: 'Error fetching transactions' });
//     }
// });


router.post('/transaction-total', async (req, res) => {
    const { month, year } = req.body;
    const transacs = await transactionModel.find({transactYear:year, transactMonth: month})
    const mp = new Map();

    for (let index = 0; index < transacs.length; index++) {
        const transacObj = transacs[index];
        const remark = transacObj.remark;
        mp.set(remark, (mp.get(remark) || 0) + transacObj.transaction)
    }
    const mapObject = Object.fromEntries(mp);
    res.status(200).send(mapObject)
})


export default router;