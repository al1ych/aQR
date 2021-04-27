const port = process.env.PORT || 1488;
const express = require("express");
const app = express();
const path = require('path');
app.use(express.urlencoded({extended: true, limit: '128mb'}));
app.use(express.json({strict: false, limit: '128mb'}));

app.use(express.static(path.join(__dirname, 'public')));


let server = app.listen(port, () =>
{
    console.log("Server started...");
});
