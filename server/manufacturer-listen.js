const express = require('express');
const tools = require('./tools');

const app = express();

//download new firmware
app.get('/', function(request, response){
    response.sendFile('home/MyProjects/test-fu/server/download/newfirmware.zip');
});

app.listen(5000, async(request, response) => {
    console.log("I'm listening");
});