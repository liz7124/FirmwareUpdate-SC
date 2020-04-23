const express = require('express');
const tools = require('./tools');
const rp = require('request-promise-native');
const Web3 = require('web3');
const net = require("net");
const dbTools = require('../DB/connect.js');
const fs = require('fs');

const web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.0.30:8545'));

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const gatewayAddress = tools.getGatewayAddress();
const gatewayBAddress = tools.getGatewayBAddress();
const gatewayBPK = tools.getGatewayBPrivateKey();
const manufacturerAddress = tools.getManufacturerAddress();

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
    const dtype_byte = tools.convertStringToByte(dtype);
    const uri = request.body.deviceInfo.uri;
    const uri_byte = tools.convertStringToByte(uri);

    //hash + signing
    var payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["int", "int", "bytes32"],[Mid,current_firmware_version,dtype_byte]));
    const signature = tools.signPayload(payload, gatewayBPK);

    //payload + signature
    payload = {
        Mid: Mid,
        fv: current_firmware_version,
        dtype: dtype,
        signature: signature
    }
    
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
            //check gateway 01 has new firmware update or not
            console.log("Check to gateway...");
            let options = {
                method: 'POST',
                uri: 'http://192.168.0.32:4000/gwchecknewfirmware',
                body: {payload},
                resolveWithFullResponse: true,
                json: true
            };
            rp(options).then(function (res) {
                console.log('Response status code: ', res.statusCode)
                console.log('Response body: ', res.body);
                console.log("Gateway has metadata!");
                //If HAS --> Verify Response
                var _Uid = res.body.Uid;
                var _fv = res.body.fv;
                var _Mid = res.body.Mid;
                var _release_date = tools.convertStringToByte(res.body.release_date);
                var _dtype = tools.convertStringToByte(res.body.dtype);
                var _url = tools.convertStringToByte(res.body.url);
                var manufacturer_signature = res.body.manufacturer_signature;
                var c = res.body.c;

                console.log("Verifying begin...");
                var res_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32", "bytes","int"],[_Uid,_fv,_Mid,_release_date,_dtype,_url,manufacturer_signature, c]));
                var addrRecover = tools.recoverAddress(res.body.sign,res_payload_hash);

                if (addrRecover == gatewayAddress) {
                    console.log("Verification success!");
                    console.log("Get metadata from Smart contract...");
                    
                    try {
                        //Check getMetadata to FirmwareUpdate Smart Contract
                        RC.methods.getFirmwareUpdate(_Uid).call({from: gatewayBAddress}).then(function(meta) {
                            console.log(meta);
                            //Verify metadata from SmartContract and from gateway 01
                            console.log("Verify metadata from Smart contract and gateway...");
                            var gw_metadata_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32"],[_Uid,_fv,_Mid,_release_date,_dtype,_url]));
                            var gwAddrRecover = tools.recoverAddress(manufacturer_signature, gw_metadata_payload_hash);

                            var sc_metadata_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32"],[_Uid,meta[0],meta[1],meta[2],meta[3],meta[4]]));
                            var scAddrRecover = tools.recoverAddress(meta[5], sc_metadata_payload_hash);

                            if (gwAddrRecover == manufacturerAddress && scAddrRecover == manufacturerAddress) {
                                console.log("Verification success");
                                //Request Download binary file
                                let socket;
                                socket = net.connect(5000, '192.168.0.32');

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
                                    if (hash_metadata == _Uid) {
                                        console.log("Verified!")
                                        response.send("true");
                                    } else {
                                        response.send("false");
                                    }
                                });
                            }
                        });
                    } catch (err) {
                        console.log(err);
                    }
                }
            }).catch(function (err) {
                console.log(err);
            });
        });
    } catch (err) {
        console.log(err);
    }
    
    //If HASn't
    //Check getMetadata to SC
    //Download to manufacturer
    //Verify binary file
});

app.listen(4000, async(request, response) => {

});