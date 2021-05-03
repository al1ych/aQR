const port = process.env.PORT || 1488;
const express = require("express");
const app = express();
const path = require('path');

app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));


let current_link = 'undefined';


let server = app.listen(port, () => {
    console.log("Server started...");
});


const {Server} = require("socket.io");
const io = new Server(server);
let qrVisited = {};
io.sockets.on('connection', (socket) => {
    console.log('new connection:', socket.id);
    socket.on('link', link => {
        console.log('info received:', link);
        if (link !== 'undefined' &&
            link !== undefined &&
            qrVisited[link] !== true) {
            current_link = link;
            qrVisited[link] = true;
        }
        socket.broadcast.emit('link', current_link);
    });
});