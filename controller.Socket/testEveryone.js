
module.exports = function(io){
let count = 0;
io.on('connection', (socket) => {
    console.log(`user conected with socket id: ${socket.id}`);
    socket.on("error", (err) => {
        console.error("Socket error:", err);
    })
    count++;
    socket.broadcast.emit('broadcast', { message: count + 'user conected' });

    socket.on('chat', (msg) => {
        const trimmsg = msg.trim();
        if (!trimmsg || trimmsg === '') {
            socket.emit('errorMsg', 'please write something')
        } else {
            io.emit('sendMsg', trimmsg)
        }
    })

    socket.on('disconnect', () => {
        count--;
        console.log(`User-${socket.id} disconnected`)
        io.emit('leftMsg', `User ${socket.id} left the chat`)
        socket.broadcast.emit('broadcast', { message: `${count} user conected` })
    })

})
}