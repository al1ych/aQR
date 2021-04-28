const port = process.env.PORT || 1488;
const express = require("express");
const app = express();
const path = require('path');

// app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));


let current_link = 'undefined';


let server = app.listen(port, () => {
    console.log("Server started...");
});


const { Server } = require("socket.io");
const io = new Server(server);
// let socket = require("socket.io");
// let io = socket(server);
io.sockets.on('connection', (socket) => {
    console.log('new connection:', socket.id);
    socket.on('link', d => {
        console.log('info received:', d);
        if (d['link'] !== 'undefined' &&
            d['link'] !== undefined) {
            current_link = d['link'];
        }
        socket.emit('link', {
            current_link: current_link,
        });
    });
});

// app.get('/test', (req, res) => {
//     res.end('hello');
// });
//
// app.post('/link_up', (rq, rs) => {
//     let q = rq.body;
//     let link = q.link;
//     console.log('req', q);
//
//     current_link = link;
//     console.log('cur link updated', current_link);
//
//     rs.end('success');
// });
//
// app.get('/link_down', (rq, rs) => {
//     console.log('cur link sent to client', current_link);
//     rs.end(current_link);
// });

