const { Room, User, Chat } = require('../models/schema')
module.exports = function (io) {

    const customLimit = io.of('/customLimit');
    customLimit.on('connection', (socket) => {

        socket.data.roomNM = ''
        socket.data.userIdForDis = null;
        socket.data.roomIdForDis = null;
        socket.data.role = null;
        console.log(`user conected with socket id: ${socket.id}`)

        socket.on('createUser', async ({ Username, id, roomName, roomId, limit, roleSelect }) => {

            id = Number(id);
            roomId = Number(roomId);
            limit = Number(limit);

            try {
                socket.data.userIdForDis = id;
                socket.data.roomIdForDis = roomId
                socket.data.role = roleSelect
                const isRoom = await Room.findOne({ id: roomId });
                const isUser = await User.findOne({ id });

                if (isUser?.inRoom === true) {
                    socket.emit('error', 'User already present with this Userid');
                    return
                }


                if (!isRoom) {
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    await Room.create({ roomName, id: roomId, noOfSocket: 1, limit, idOfTheParicipent: id });
                    if (!isUser) {
                        await User.create({ userName: Username, id, inRoom: true, role: roleSelect });
                    } else {
                        await User.updateOne({ id }, { inRoom: true, role: roleSelect });
                    }
                    socket.join(`${roomName}-${roomId}`);
                    socket.emit('roomJoined', `user-${Username} has joined ${socket.data.roomNM}`)
                } else {
                    if (isRoom?.noOfSocket >= isRoom?.limit) {
                        socket.emit('error', `User Exceeded, total limit is ${isRoom.limit}`)
                        return
                    }
                    socket.data.roomNM = `${roomName}-${roomId}`;
                    isRoom.noOfSocket += 1;
                    if (!isUser) {
                        await User.create({ userName: Username, id, inRoom: true, role: roleSelect })
                    } else {
                        await User.updateOne({ id }, { inRoom: true, role: roleSelect });
                    }
                    isRoom.idOfTheParicipent.push(id);
                    await isRoom.save();
                    socket.join(`${roomName}-${roomId}`);
                    const messages = await Chat.find({ roomId }).sort({ timestamp: 1 }).limit(10); 
                    if(!messages){
                        socket.emit('error','no history found');
                        return;
                    }
                    messages.forEach((msg)=>{
                    socket.emit('history', msg.text);
                    })
                    socket.emit('roomJoined', `user-${Username} has joined existing room- ${socket.data.roomNM}`)
                }

                if (!socket.data.roomNM) {
                    console.log('No room name to create a room')
                } else {
                    socket.on('message', async (msg) => {
                        console.log(msg)
                        const sender = await User.findOne({id:socket.data.userIdForDis})
                        await Chat.create({
                            roomId: socket.data.roomIdForDis,
                            senderId: socket.data.userIdForDis,
                            senderName: sender.userName,
                            text: String(msg)
                        })
                        console.log(msg)
                        customLimit.in(socket.data.roomNM).emit('message', msg);
                    });
                }

            } catch (error) {
                console.log(error, 'error in finding from db')
            }
        })


        socket.on('kickUser', async ({ idToBeKicked }) => {
            idToBeKicked = Number(idToBeKicked)
            if (socket.data.role !== 'admin' && socket.data.role !== 'promoted') {
                socket.emit('error', 'Only admin/prometed person can kick users!');
                return;
            }
            const targetedUser = [...customLimit.sockets.values()].find((toBeKickUser) => {
                return toBeKickUser.data.userIdForDis === idToBeKicked && toBeKickUser.data.roomNM === socket.data.roomNM
            })

            if (targetedUser) {
                // console.log(socket.data.roomNM);
                // console.log(targetedUser.data.roomNM)
                targetedUser.leave(socket.data.roomNM)
                targetedUser.emit('kicked', 'You have been kicked by admin');
                customLimit.in(socket.data.roomNM).emit('message', `User ${idToBeKicked} was kicked`);

                await User.updateOne({ id: idToBeKicked }, { inRoom: false });
                const findRoom = await Room.findOne({ id: socket.data.roomIdForDis })
                findRoom.noOfSocket -= 1;
                findRoom.idOfTheParicipent = findRoom.idOfTheParicipent.filter((id) => Number(id) !== Number(idToBeKicked))
                findRoom.save();
            } else {
                socket.emit('error', 'User not found in this room');
            }

        })



        socket.on('changeRole', async ({ newRole, idToBeTargeted }) => {

            if (newRole !== 'user' && newRole !== 'admin' && newRole !== 'promoted') {
                socket.emit('error', 'Please give valid role i.e admin or user or prometed');
                return
            }

            const isRole = await User.findOne({ id: idToBeTargeted })
            if (!isRole) {
                socket.emit('error', 'User Id not found')
            }

            if (socket.data.role !== 'admin') {
                socket.emit('error', 'Only admin can change roles!');
                return;
            }

            let socketObject = [];
            await customLimit.allSockets()
                .then((set) => Array.from(set))
                .then((socketIds) => socketIds.forEach((id) => {
                    const socketObj = customLimit.sockets.get(id);
                    socketObject.push(socketObj)

                }))
                .catch((err) => console.log(err, 'can not fetch the socket objects'))
            console.log(socketObject)

            const foundUser = socketObject.find((s) => s.data.userIdForDis === idToBeTargeted && s.data.roomNM === socket.data.roomNM)

            if (foundUser) {
                await User.updateOne({ id: idToBeTargeted }, { role: newRole }); // update DB
                customLimit.in(socket.data.roomNM).emit('message', `User ${idToBeTargeted} role changed to ${newRole}`);
            } else {
                socket.emit('error', 'User not found in this room');
            }
        });


        socket.on('disconnect', async () => {
            if (socket.data.roomIdForDis && socket.data.userIdForDis) {
                const room = await Room.findOne({ id: socket.data.roomIdForDis });
                if (!room) {
                    socket.emit('error', 'room not found to disconnect')
                }
                if (room && room.noOfSocket > 0) {
                    room.noOfSocket -= 1;
                    room.idOfTheParicipent = room.idOfTheParicipent.filter((id) => Number(id) !== Number(socket.data.userIdForDis))
                    await room.save();
                }
                await User.updateOne({ id: socket.data.userIdForDis }, { inRoom: false })
            }
            console.log(`Socket is disconnected`);
            socket.to(socket.data.roomNM).emit('message', 'user Disconected')
        })
    })
}


// history if socket is disconected
// store the msg..