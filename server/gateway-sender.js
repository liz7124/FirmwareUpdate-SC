const net = require('net');
const fs = require('fs');
const tools = require('./tools');

let server, istream = fs.createReadStream("./downloads/newfirmware.zip");

server = net.createServer(socket => {
    socket.pipe(process.stdout);
    istream.on("readable", function() {
        let data;
        while (data = this.read()) {
            socket.write(data);
        }
    })
    istream.on("end", function() {
        socket.end();
    })
    socket.on("end", () => {
        server.close(() => {console.log("\nTransfer is done!")});
    })
})

server.listen(5000,'192.168.0.32');