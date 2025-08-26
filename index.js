const express = require('express');
const path = require('path')
const app = express();
require('dotenv').config();
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const dbConnect = require('./database/database')
// const io = new Server(server,{connectionStateRecovery:{}});  // this is for that lets a client resume its session if it gets disconnected unexpectedly (like WiFi off, server restart, etc.). 
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')))

require('./controller.Socket/room')(io);
require('./controller.Socket/private')(io);
require('./controller.Socket/testEveryone')(io);
require('./controller.Socket/customLimit')(io);

server.listen(PORT, () => {
    console.log(
        `server is listening at port ${PORT}`
    )
})

dbConnect()

// limit should be dynamic.
// kick the person from Private room.
// kick or no kick to a specefic user. if admin gives access 
// chat encryption 