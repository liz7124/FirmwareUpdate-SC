const express = require('express');
const tools = require('./tools');
const Web3 = require('web3');
const fs = require('fs');
const dbTools = require('../DB/connect.js');
const net = require("net");
const rp = require('request-promise-native');
const NodeCache = require( "node-cache" );

const myCache = new NodeCache();

//dbTools.connectDB();

const web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.0.30:8545'));

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const gatewayAddress = tools.getGatewayAddress();
const gatewayAddressB = tools.getGatewayBAddress();
const gatewayPrivateKey = tools.getGatewayPrivateKey();
const manufacturerAddress = tools.getManufacturerAddress();

const manufacturerMapping = {
    '1': {
        'name': 'Dallas',
        'address': tools.getManufacturerAddress()
    }
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//check new firmware update available
app.post('/checknewfirmware', async (request, response) => {
    //receive request from client (iotivity device)
    console.log("Receive POST request--Check\n");
    console.log(request.body);
    const Mid = request.body.deviceInfo.Mid;
    const current_firmware_version = request.body.deviceInfo.fv;
    const dtype = request.body.deviceInfo.dtype;
    const uri = request.body.deviceInfo.uri;
    
    //store device info if not exist
    try {
        console.log("CHECK DEVICE EXIST");
        var count = dbTools.checkDeviceExist(Mid,uri);
        count.then(function(result) {
            console.log(result);
            if (result == 0) {
                console.log("Save Device Info to DB");
                dbTools.saveDeviceInfo(Mid,current_firmware_version,dtype,uri);
            } else {
                console.log("Device exist");
            }

            //check FU smart contract that compatible to device
            try {
                console.log("CHECK METADATA");
                var metadata = dbTools.checkMetadata(Mid,dtype,current_firmware_version);
                metadata.then(function(res) {
                    console.log(res);
                    //compare the new and current version
                    for (const i in res) {
                        if (res[i]['firmware_version'] > current_firmware_version) {
                            console.log("FOUND METADATA EXIST");
                            //download new firmware update in the manufacturer's server
                            console.log("Downloading from manufacturer's server...");
                            
                            const payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int"],[res[i]['hash'],res[i]['firmware_version']]));
                            var payload_signature = tools.signPayload(payload_hash, gatewayPrivateKey);

                            var payload = {
                                Uid: res[i]['hash'],
                                fv: res[i]['firmware_version'],
                                signature: payload_signature
                            }
                            console.log(payload);
                            let options = {
                                method: "POST",
                                uri: "http://192.168.0.30:5500/downloadnewfirmware",
                                body: {payload},
                                resolveWithFullResponse: true,
                                json: true
                            };
                            rp(options).then(function(download_response) {
                                console.log('Response status code: ', download_response.statusCode);
                                console.log('Response body: ', download_response.body);
                        
                                //if (download_response.body == "true") {
                                    let socket;
                                    socket = net.connect(5000, '192.168.0.30');

                                    let ostream = fs.createWriteStream("./downloads/newfirmware.zip");
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
                                        //process.exit();
                                        //verify binary file (compare hash)
                                        console.log("Verifying...");
                                        try {
                                            var fu_file = fs.readFileSync('/home/pi/MyProjects/FirmwareUpdate-SC/server/downloads/newfirmware.zip','utf8');
                                        } catch(e) {
                                            console.log('Error:',e.stack);
                                        }
                                        var hash_metadata = tools.hashPayload(fu_file)
                                        if (hash_metadata == res[i]['hash']) {
                                            console.log("Verified!")
                                            response.send("true");
                                        } else {
                                            response.send("false");
                                        }
                                    });
                                //}
                            }).catch(function(err) {
                                console.log(err);
                            });
                        } else {
                            console.log("NOT FOUND METADATA");
                        }
                    }
                });
            } catch (err) {
                console.log(err);
            }
        });
    } catch (err) {
        console.log(err);
    }
});

app.post('/savefirmwaretransaction', async (request, response) => {
    //update firmware version in DB
    //insert firmware update transaction to DB
});

app.post('/gwchecknewfirmware', async (request, response) => {
    //receive request from client (iotivity device)
    console.log("Receive POST request from Gateway--Check\n");
    console.log(request.body);
    const Mid = request.body.payload.Mid;
    const current_firmware_version = request.body.payload.fv;
    const dtype = request.body.payload.dtype;
    const dtype_byte = tools.convertStringToByte(dtype);
    const gwsign = request.body.payload.signature;

    //verify signature
    console.log("Verifying Signature ...");
    var payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["int","int","bytes32"],[Mid,current_firmware_version,dtype_byte]));
    const addressRecover = tools.recoverAddress(gwsign,payload);

    if (addressRecover == gatewayAddressB) {
        console.log("Verification Success!");
        //getMetadata from local DB that compatible to device
        try {
            console.log("CHECK METADATA");
            var metadata = dbTools.checkMetadata(Mid,dtype,current_firmware_version);
            metadata.then(function(res) {
                console.log(res);
                //compare the new and current version
                for (const i in res) {
                    if (res[i]['firmware_version'] > current_firmware_version) {
                        console.log("FOUND METADATA EXIST");
                        //Uid+c+Sign(Uid,c) send back to gateway02
                        var c = 1;

                         //hash+sign
                        var res_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32", "bytes","int"],[res[i]['hash'],res[i]['firmware_version'],res[i]['manufacturer_id'],tools.convertStringToByte(res[i]['release_date']),tools.convertStringToByte(res[i]['device_type']),tools.convertStringToByte(res[i]['url']),res[i]['signature'], c]));
                        var res_payload_signature = tools.signPayload(res_payload_hash, gatewayPrivateKey);

                        var res_payload = {
                            Uid: res[i]['hash'],
                            fv: res[i]['firmware_version'],
                            Mid: res[i]['manufacturer_id'],
                            release_date: res[i]['release_date'],
                            dtype: res[i]['device_type'],
                            url: res[i]['url'],
                            manufacturer_signature: res[i]['signature'],
                            c: c,
                            sign: res_payload_signature
                        }
                        
                        var nounce = {c:1};
                        var success = myCache.set("nounce",nounce,300);
                        
                        response.send(res_payload);
                    } else {
                        console.log("NOT FOUND METADATA");
                    }
                }
            });
        } catch (err) {
            console.log(err);
        }
    }
});

app.listen(4000, async(request, response) => {
    console.log("I'm listening");

    var Uid = '';
    
    let tx = await RC.getPastEvents(
        'NewFirmwareStored', 
        /*{
            fromBlock: 0,
            toBlock: 'latest'
        },*/
        (err, events) => {
            console.log(err);
            console.log(events.length);
            console.log("Receive Events: NewFirmwareStored!");
            if (events) {
                Uid = events[0]['returnValues']['Uid'];
            }
        }
    )
    //console.log(Uid);
    console.log("Get Metadata from Smart Contract ...");
    if (Uid != '') {
        const metadata = await RC.methods.getFirmwareUpdate(Uid).call({
            from: gatewayAddress
        });
        //console.log(metadata);
    
        var new_firmware_version = metadata[0];
        var Mid = metadata[1];
        var release_date = metadata[2];
        var dtype = metadata[3];
        var url = metadata[4];
        var signature = metadata[5];

        //verify signature
        console.log("Verifying Signature ...");
        var metadata_payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32"],[Uid,new_firmware_version,Mid,release_date,dtype,url]));
        const addrRecover = tools.recoverAddress(signature,metadata_payload);
        console.log(manufacturerAddress);
        console.log(addrRecover);

        if (addrRecover == manufacturerAddress) {
            console.log("Verification Success!");
            //check metadata exist or not
            try {
                var res = dbTools.checkMetadataExist(Uid);
                res.then(function(result) {
                    if (result == 0) {
                        //store the metadata to DB
                        dbTools.saveMetadataFirmwareUpdate(Uid,Mid,new_firmware_version, tools.convertByteToString(dtype), tools.convertByteToString(release_date), tools.convertByteToString(url), signature);
                        console.log("Store metadata to Database");
                    } else {
                        console.log("Metadata Exist");
                    }
                });
            } catch (err) {
                console.log(err);
            }
            
        }
    }
});



/*
    RC.events.NewFirmwareStored()
    .on('data', (event) => {
        console.log(event);
    })
    .on('error', console.error);
    */