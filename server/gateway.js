const express = require('express');
const tools = require('./tools');
const rp = require('request-promise-native');
const Web3 = require('web3');
const dbTools = require('../DB/connect.js');

//dbTools.connectDB();

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

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
    const Mid = request.body.payload.Mid;
    const current_firmware_version = request.body.payload.fv;
    const dtype = request.body.payload.dtype;
    const uri = request.body.payload.uri;
    
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
                            //download new firmware update in the manufacturer's server
                            //verify binary file (compare hash)
                            console.log("FOUND METADATA EXIST");
                            response.send("true");
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

app.post('/gwchecknewfirmware', async (request, response) => {
    //receive request from client (iotivity device)
    console.log("Receive POST request from Gateway--Check\n");
    console.log(request.body);
    const Mid = request.body.payload.Mid;
    const current_firmware_version = request.body.payload.fv;
    const dtype = request.body.payload.dtype;
    const gwsign = request.body.payload.signature;

    //verify signature
    console.log("Verifying Signature ...");
    var payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["int","int","bytes32"],[Mid,current_firmware_version,dtype]));
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
                        //U+c+Sign(U,c) send back to gateway02

                        response.send("true");
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

app.post('/downloadnewfirmware', async(request, response) => {
    console.log("Receive POST request--Download\n");
    console.log(request.body);
    const Mid = request.body.Mid;
    const current_firmware_version = request.body.fv;
    
    //get from DB metadata info (URL)

    //get request to manufacturer
    let options = {
        method: 'GET',
        uri: "http://192.168.0.30:5000/",
        body: {},
        resolveWithFullResponse: true,
        json: true
    };
    rp(options).then(function (response) {
        console.log('Response status code: ', response.statusCode)
        console.log('Response body: ', response.body);
    }).catch(function (err) {
        console.log(err);
    });

});

//verify the response from smart contract
//download update from manufacturer server
//verify the hash of the binary--> check in the smart contract exist or not
//send to device

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
            //console.log(events.length);
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