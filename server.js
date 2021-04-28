const port = process.env.PORT || 1488;
const express = require("express");
const app = express();
const path = require('path');
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));


let current_link = 'undefined';

let socket = require("socket.io");

let io = socket(server);
io.sockets.on('connection', new_con);

function new_con(socket)
{
    console.log('new connection:', socket.id);

    socket.on('link', on_link);

    function on_link(d)
    {
        // console.log('info received:', udata);
        socket.emit('echo', 'echo');

            socket.emit('link', {
                nick: nick,
                active: active[room],
                timecode: timecode_shared[room],
                player_state: player_state_shared[room],
                player_type: player_type_shared[room],
                video_id: video_id_shared[room] || "no_id",
                there_is_king: there_is_king[room],
                chat: chat[room] || "",
                restrict: restrict[nick]
            });
        }
        else
        {
            socket.emit('uinfo', {
                nick: nick,
                active: active[room] || {},
                timecode: timecode,
                player_state: local_player_state,
                player_type: local_player_type,
                video_id: local_video_id,
                there_is_king: there_is_king[room] || false,
                chat: chat[room] || "",
                restrict: undefined
            });
        }

        // set restrict for this user back to undefined
        restrict[nick] = undefined;
    }
}


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




let server = app.listen(port, () => {
    console.log("Server started...");
});
