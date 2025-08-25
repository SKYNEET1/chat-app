const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    roomName:{
        type:String
    },
    id:{
        type:Number,
        unique:true
    },
    noOfSocket:{
        type:Number,
        default:0
    },
    limit:{
        type:Number,
        default:0
    }
})

const privateMSGSchema = new mongoose.Schema({
    userName:{
        type:String
    },
    id:{
        type:Number,
        unique:true
    },
    inRoom:{
        type:Boolean,
        default:false
    }
})
const User = mongoose.model('User',userSchema);
const Private = mongoose.model('Private',privateMSGSchema);
module.exports = {User,Private}