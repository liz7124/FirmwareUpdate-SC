const express = require('express');
const fs = require('fs');
const rp = require('request-promise-native');
var AdmZip = require('adm-zip');
const net = require("net");
const { exec } = require("child_process");

var deviceInfo = {
    Mid: 1,
    fv: 1,
    dtype: "temperature_sensor",
    uri: "/temperature2"
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.get('/checknewfirmware', async(request, response) => {
    //send request to check new firmware available
    let options = {
        method: "POST",
        uri: "http://192.168.0.33:4000/checknewfirmware",
        body: {deviceInfo},
        resolveWithFullResponse: true,
        json: true
    };
    rp(options).then(function(res) {
        console.log('Response status code: ', res.statusCode);
        console.log('Response body: ', res.body);

        //if (res.body == "true") {
            response.send(res.body);
        //}
    }).catch(function(err) {
        console.log(err);
    });
});

app.get('/downloadnewfirmware', async(request, response) => {
    //download new FU
    console.log("Downloading...");
    
    let socket;

    socket = net.connect(5000, '192.168.0.32');

    let ostream = fs.createWriteStream("./patches/newfirmware.zip");
    let date = new Date(), size = 0, elapsed;
    socket.on('data', chunk => {
        size += chunk.length;
        elapsed = new Date() - date;
        socket.write(`\r${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`)
        process.stdout.write(`\r${(size / (1024 * 1024)).toFixed(2)} MB of data was sent. Total elapsed time is ${elapsed / 1000} s`);
        ostream.write(chunk);
    });
    socket.on("end", () => {
        console.log(`\nFinished getting file. speed was: ${((size / (1024 * 1024)) / (elapsed / 1000)).toFixed(2)} MB/s`);
        //extract new FU
        console.log("Extracting...");
        var zip = new AdmZip("./patches/newfirmware.zip");

        /*
        var zipEntries = zip.getEntries(); // an array of ZipEntry records
        zipEntries.forEach(function(zipEntry) {
            console.log(zipEntry.toString()); // outputs zip entries information
            //if (zipEntry.entryName == "my_file.txt") {
                console.log(zipEntry.getData().toString('utf8')); 
            //}
        });*/

        // outputs the content of some_folder/my_file.txt
        //console.log(zip.readAsText("some_folder/my_file.txt")); 
        // extracts the specified file to the specified location
        //zip.extractEntryTo(/*entry name*/"some_folder/my_file.txt", /*target path*/"/home/me/tempfolder", /*maintainEntryPath*/false, /*overwrite*/true);
        // extracts everything
        zip.extractAllTo(/*target path*/"./patches/", /*overwrite*/true);

        response.send("true");
        //process.exit();
    });
});

app.get('/upgradefirmware', async(request, response) => {
    console.log("Upgrade Firmware...");
    //run make file
    exec("cd patches && make", (error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);

        /*let options = {
            method: "POST",
            uri: "http://192.168.0.32:4000/savefirmwaretransaction",
            body: {deviceInfoJSON},
            resolveWithFullResponse: true,
            json: true
        };
        rp(options).then(function(res) {
            console.log('Response status code: ', res.statusCode);
            console.log('Response body: ', res.body);
        }).catch(function(err) {
            console.log(err);
        });*/
        
        response.send("true");
    });
});

app.listen(8000, async(request, response) => {
    console.log("Listening...");
});