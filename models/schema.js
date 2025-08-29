const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName: {
        type: String
    },
    id: {
        type: Number,
        unique: true
    },
    noOfSocket: {
        type: Number,
        default: 0
    },
    idOfTheParicipent: [{
        type: Number
    }],
    limit: {
        type: Number,
        default: 0
    }
})





const userSchema = new mongoose.Schema({
    userName: {
        type: String
    },
    id: {
        type: Number,
        unique: true
    },
    inRoom: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'promoted'],
        default: 'user'
    }
})




const chatSchema = new mongoose.Schema({
    roomId: Number,
    senderId: Number,
    senderName: String,
    text: String,
    timestamp: { type: Date, default: Date.now }
})





const Room = mongoose.model('Room', roomSchema);
const User = mongoose.model('User', userSchema);
const Chat = mongoose.model('Chat', chatSchema)
module.exports = { Room, User, Chat }