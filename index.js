const express = require('express');
const path = require('path')
const app = express();
require('dotenv').config();
const http = require('http')
const server = http.createServer(app)
const { Server } = require('socket.io')
const dbConnect = require('./database/database')
const io = new Server(server);

const PORT = process.env.PORT || 4000;

app.use(express.static(path.join(__dirname, 'public')))

require('./controller.Socket/room')(io);
require('./controller.Socket/private')(io);
require('./controller.Socket/testEveryone')(io);

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