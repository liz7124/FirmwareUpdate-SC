const express = require('express');
const tools = require('./tools');
const rp = require('request-promise-native');
const Web3 = require('web3');
const net = require("net");

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

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
    const Mid = parseInt(request.body.payload.Mid,10);
    const current_firmware_version = parseInt(request.body.payload.fv,10);
    const dtype = request.body.payload.dtype;
    const uri = request.body.payload.uri;

    //hash + signing
    var payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["int", "int", "bytes32"],[Mid,current_firmware_version,firmware_metadata.dtype]));
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
            let options = {
                method: 'POST',
                uri: 'http://localhost:4000/gwchecknewfirmware',
                body: {payload},
                resolveWithFullResponse: true,
                json: true
            };
            rp(options).then(function (res) {
                console.log('Response status code: ', res.statusCode)
                console.log('Response body: ', res.body);
                //If HAS --> Verify Response
                Uid = res.body.Uid;
                fv = res.body.fv;
                Mid = res.body.Mid;
                release_date = res.body.release_date;
                dtype = res.body.dtype;
                url = res.body.url;
                manufacturer_signature = res.body.manufacturer_signature;
                c = res.body.c;

                var res_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32","int"],[Uid, c]));
                var res_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32", "bytes32","int"],[Uid,fv,Mid,release_date,dtype,url,manufacturer_signature, c]));
                var addrRecover = tools.recoverAddress(res.body.sign,res_payload_hash);

                if (addrRecover == gatewayAddress) {
                    //Check getMetadata to FirmwareUpdate Smart Contract
                    const metadata = await RC.methods.getFirmwareUpdate(Uid).call({
                        from: gatewayBAddress
                    });

                    //Verify metadata from SmartContract and from gateway 01
                    var gw_metadata_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32", "bytes32"],[Uid,fv,Mid,release_date,dtype,url]));
                    var gwAddrRecover = tools.recoverAddress(manufacturer_signature, gw_metadata_payload_hash);

                    var sc_metadata_payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32", "bytes32"],[Uid,metadata[0],metadata[1],metadata[2],metadata[3],metadata[4]]));
                    var scAddrRecover = tools.recoverAddress(metadata[5], sc_metadata_payload_hash);

                    if (gwAddrRecover == manufacturerAddress && scAddrRecover == manufacturerAddress) {
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
                            if (hash_metadata == res[i]['hash']) {
                                console.log("Verified!")
                                response.send("true");
                            } else {
                                response.send("false");
                            }
                        });
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