const port = process.env.PORT || 1488;
const express = require("express");
const app = express();
const path = require('path');
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));


let current_link = 'undefined';


app.get('/test', (req, res) => {
    res.end('hello');
});

app.post('/link_up', (rq, rs) => {
    let q = rq.body;
    let link = q.link;
    console.log('req', q);

    current_link = link;
    console.log('cur link updated', current_link);

    rs.end('success');
});

app.get('/link_down', (rq, rs) => {
    console.log('cur link sent to client', current_link);
    rs.end(current_link);
});


let server = app.listen(port, () => {
    console.log("Server started...");
});
