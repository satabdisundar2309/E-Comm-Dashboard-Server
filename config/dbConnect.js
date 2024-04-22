const mongoose = require('mongoose')
require('dotenv').config()

const url = process.env.DB_URL

mongoose.connect(url).then(()=>{
    console.log("DB Connection is successful")
}).catch((e)=>{
    console.log("DB Connection is failed", e)
})