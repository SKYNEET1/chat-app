const { User, Private } = require('../models/schema')
module.exports = function (io) {
    socket.data.roomNM = ''
    socket.data.userIdForDis;
    socket.data.roomIdForDis; 
    socket.data.role;
    
    const customLimit = io.of('/customLimit');
    customLimit.on('connection', (socket) => {
        console.log(`user conected with socket id: ${socket.id}`)

        socket.on('createUser', async ({ Username, id, roomName, roomId, limit }) => {

            try {
                socket.data.userIdForDis = id;
                socket.data.roomIdForDis = roomId
                const isRoom = await User.findOne({ id: roomId });
                const isUser = await Private.findOne({ id });

                if (isUser?.inRoom === true) {
                    socket.emit('error', 'User already present with this Userid');
                    return
                }

                if (isRoom && isRoom.noOfSocket >= isRoom.limit) {
                    socket.emit('error', `User Exceeded, total limit is ${isRoom.limit}`)
                }

                if (!isRoom) {
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    socket.data.role = 'admin';
                    await User.create({ roomName, id: roomId, noOfSocket: 1, limit });
                    await Private.create({ userName: Username, id, inRoom: true })
                    socket.join(`${roomName}-${roomId}`);
                    socket.emit('roomJoined', `user-${Username} has joined ${socket.data.roomNM}`)
                } else {
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    socket.data.role = 'user';
                    await Private.create({ userName: Username, id, inRoom: true })
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    socket.join(`${roomName}-${roomId}`);
                    socket.emit('roomJoined', `user-${Username} has joined existing room- ${socket.data.roomNM}`)
                }
            } catch (error) {
                console.log(error, 'error in finding from db')
            }
        })
        if (!socket.data.roomNM) {
            console.log('No room name to create a room')
        } else {
            socket.on('message', (msg) => {
                console.log(msg)
                customLimit.in(socket.data.roomNM).emit('message', msg);
            });
        }


        socket.on('disconnect', async () => {
            if (socket.data.roomIdForDis && socket.data.userIdForDis) {
                const room = await User.findOne({ id: socket.data.roomIdForDis });
                if (room && room.noOfSocket > 0) {
                    room.noOfSocket -= 1;
                    await room.save();
                }
                await Private.updateOne({ id: socket.data.userIdForDis }, { inRoom: false })
            }
            console.log(`Socket is disconnected`);
            socket.to(socket.data.roomNM).emit('message', 'user Disconected')
        })
    })
}