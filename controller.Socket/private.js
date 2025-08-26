const { Room, User } = require('../models/schema')

module.exports = function (io) {
    const privateMsg = io.of('/private')

    privateMsg.on('connection', (socket) => {
        socket.data.roomNM;
        socket.data.userIdForDis;
        socket.data.roomIdForDis
        console.log(`user conected with socket id: ${socket.id}`)

        socket.on('createUser', async ({ Username, id, roomName, roomId }) => {
            try {
                socket.data.userIdForDis = id;
                socket.data.roomIdForDis = roomId
                const isUser = await User.findOne({ id })
                const isRoom = await Room.findOne({ id: roomId })
                if (isUser?.inRoom === true) {
                    socket.emit('error', 'User already present with this Userid');
                    return
                }

                if (isRoom && isRoom.noOfSocket >= 2) {
                    socket.emit('error', 'already 2 user present');
                    return
                }
                if (!isRoom) {
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    await Room.create({ roomName: socket.data.roomNM, id: roomId, noOfSocket: 1 })
                    await User.create({ userName: Username, id, inRoom: true })
                    socket.join(`${roomName}-${roomId}`);
                    socket.emit('roomJoined', `user-${Username} has joined ${socket.data.roomNM}`)
                } else if (isRoom && isRoom.noOfSocket < 2) {
                    isRoom.noOfSocket += 1;
                    await isRoom.save();
                    await User.create({ userName: Username, id, inRoom: true })
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    socket.join(`${roomName}-${roomId}`);
                    socket.emit('roomJoined', `user-${Username} has joined existing room- ${socket.data.roomNM}`)
                }

                if (!socket.data.roomNM) {
                    console.log('No room name to create a room')
                } else {
                    socket.on('message', (msg) => {
                        console.log(msg)
                        privateMsg.in(socket.data.roomNM).emit('message', msg);
                    });
                }

            } catch (error) {
                console.log(error, 'error in finding from db');
            }
        })



        socket.on('disconnect', async () => {
            if (socket.data.roomIdForDis && socket.data.userIdForDis) {
                const room = await Room.findOne({ id: socket.data.roomIdForDis });
                if (room && room.noOfSocket > 0) {
                    room.noOfSocket -= 1;
                    await room.save();
                }
                await User.updateOne({ id: socket.data.userIdForDis }, { inRoom: false })
            }
            console.log(`Socket is disconnected`);
            socket.to(socket.data.roomNM).emit('message', 'user Disconected')
        })

    })
}