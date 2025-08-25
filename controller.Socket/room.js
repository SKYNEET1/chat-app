const {User, Private} = require('../models/schema')

module.exports = function(io){
const room = io.of('/room')
room.on('connection', (socket) => {
    console.log(`${socket.id} - is connected`);
    socket.data.roomNM = []

    socket.on('createRoom', async ({ roomName, id }) => {
        try {

            const isRoom = await User.findOne({ id });

            console.log(isRoom)
            if (isRoom) {
                console.log('isRoom', isRoom.roomName, isRoom.id)
                if (isRoom.roomName === roomName) {
                    const fullRoomName = `${roomName}-${id}`
                    socket.data.roomNM.push(fullRoomName) 
                    console.log(`${socket.id} has joined existing room ${roomName}-${id}`);
                    socket.join(`${roomName}-${id}`);
                } else {
                    socket.emit('alert', `room with this ${id} already exists with name ${isRoom.roomName}`)
                }

            } else {

                await User.create({ roomName, id });
                const fullRoomName = `${roomName}-${id}`
                socket.data.roomNM.push(fullRoomName) 
                console.log(`${socket.id} created and joined room ${roomName}-${id}`);
                socket.join(`${roomName}-${id}`);
            }


            if (socket.data.roomNM.length === 0) {
                console.log('No room name to create a room')
            } else {
                socket.on('message', ({msg}) => {
                    console.log(msg)
                    socket.data.roomNM.forEach(r => {
                        room.in(r).emit('message',msg);
                    });
                });
            }
        } catch (error) {
            console.error("Error in createRoom:", error);
        }
    })

    socket.on('leave', (roomName) => {
        if (socket.data.roomNM.includes(roomName)) {
            socket.leave(roomName);
            socket.to(roomName).emit("message", `${socket.id} left ${roomName}`);
            console.log(`${socket.id} left room ${roomName}`);
            socket.data.roomNM = socket.data.roomNM.filter(r=> r!==roomName)
        }
    })
})
}
