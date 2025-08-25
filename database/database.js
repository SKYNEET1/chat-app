const mongoose = require('mongoose');

const dbConnect = () =>{
    mongoose.connect(process.env.DATABASE_URL)
    .then(()=>console.log('mongodb connected successfully'))
    .catch((error)=>console.log('Error in connecting db',error))
} 

module.exports = dbConnect
