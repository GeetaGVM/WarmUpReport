require('dotenv').config(); 
const fs = require('fs');

const { MongoClient } = require('mongodb');


const uri = 'mongodb+srv://shprodmongo:sgohUAADlkABqT6D@saleshive-prod-cluster.gf6uf.mongodb.net/?retryWrites=true&w=majority';


const dbName = 'SalesHive_Live';


const collectionName = 'accountwarmupmailhistories';

async function generateCsv(req, res) {
    try {
        const results = [];
        const startDate = process.env.START_DATE;
        const endDate = process.env.END_DATE;

        console.log('Start Date:', startDate);
        console.log('End Date:', endDate);

        if (!startDate || !endDate || isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
            console.log('Invalid or missing date parameters');
            return res.status(400).json({ error: 'Invalid or missing date parameters' });
        }

        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        // Connect to the MongoDB database
        const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();

   
        const db = client.db(dbName);

       
        const collection = db.collection(collectionName);

        let currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
            const loopDate = new Date(currentDate);

         
            console.log('Loop Date:', loopDate.toISOString());

            const pipeline = [
                {
                    $match: {
                        MailSentDate: {
                            $gte: loopDate,
                            $lt: new Date(loopDate.getTime() + 24 * 60 * 60 * 1000) // Add 1 day to loopDate
                        }
                        // IsDeleted: 0
                    }
                },
                {
                    $lookup: {
                        from: 'accounts',
                        localField: 'SenderAccountID',
                        foreignField: '_id',
                        as: 'A'
                    }
                },
                {
                    $unwind: "$A" 
                },
                {
                    $lookup: {
                        from: 'clientaccounts',
                        localField: 'SenderAccountID',
                        foreignField: 'AccountID',
                        as: 'CA'
                    }
                },
                {
                    $unwind: "$CA" 
                },
                {
                    $lookup: {
                        from: 'clients',
                        localField: 'CA.ClientID',
                        foreignField: '_id',
                        as: 'C'
                    }
                },
                {
                    $unwind: "$C" 
                },
                {
                    $lookup: {
                        from: 'accountwarmups',
                        localField: 'SenderAccountID',
                        foreignField: 'AccountID',
                        as: 'AW'
                    }
                },
                {
                    $unwind: "$AW" 
                },
                {
                    $project: {
                        "ClientName": "$C.Name",
                        "SMTPFromEmail": "$A.SMTPFromEmail",
                        // "ClientID": "$CA.ClientID",
                        
                        "TodayVolume":"$AW.TodayVolume",
                        "ReplyPercentage":"$AW.ReplyPercentage",
                        "IsReplied": 1 



                    }
                },
                
                {
                    $group: {
                        _id: null,
                        // Count: { $sum: 1 },
                        
                        WarmDate: { $push: loopDate },
                        ClientNames: { $push: '$ClientName' },
                        // SenderAccountIDs: { $push: '$SenderAccountID' },
                        SMTPFromEmails: { $push: '$SMTPFromEmail' },
                        // ClientID: { $push: '$ClientID' },
                        SentCount: { $sum: 1 },
                        
                        TodayVolume: { $push: '$TodayVolume' },
                        ReplyCount: {
                            $sum: {
                                $cond: [
                                    { $eq: ['$IsReplied', true] },
                                    1,
                                    0
                                ]
                            }
                        },
                        ReplyPercentage: { $max: '$ReplyPercentage' },

                        
                    }
                }
            ];

            const result = await collection.aggregate(pipeline).toArray();
            results.push(...result);

            console.log('Result:', result);

            currentDate.setDate(currentDate.getDate() + 1);
        }
        const csvStream = fs.createWriteStream('query_results.csv');

      
        csvStream.write('WarmDate,ClientNames,Email,SentCount,TodayVolume,ReplyCount,ReplyPercentage\n');

        results.forEach(result => {
            const { WarmDate, ClientNames, SMTPFromEmails, SentCount, TodayVolume, ReplyCount, ReplyPercentage } = result;

            for (let i = 0; i < WarmDate.length; i++) {
                const row = `${WarmDate[i]},${ClientNames[i]},${SMTPFromEmails[i]},${SentCount},${TodayVolume[i]},${ReplyCount},${ReplyPercentage}\n`;
                csvStream.write(row);
            }
        });

        csvStream.end();

        console.log('CSV file generated successfully');
        // const csvWriter = createCsvWriter({
        //     path: 'query_results.csv',
        //     header: [
        //         { id: 'WarmDate', title: 'WarmDate' },
        //         { id: 'ClientNames', title: 'ClientName' },
        //         { id: 'SMTPFromEmails', title: 'Email' },
        //         { id: 'SentCount', title: 'SentCount' },
        //         { id: 'TodayVolume', title: 'TodayVolume' },
        //         { id: 'ReplyCount', title: 'ReplyCount' },
        //         { id: 'ReplyPercentage', title: 'ReplyPercentage' },
        //     ],
        // });

        // await csvWriter.writeRecords(results);
        

        return res.status(200).json({ success: true, message: 'Data queried successfully' });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = { generateCsv };






