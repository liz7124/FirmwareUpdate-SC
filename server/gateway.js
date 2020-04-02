const express = require('express');
const tools = require('./tools');
const rp = require('request-promise-native');
const Web3 = require('web3');
const dbTools = require('../DB/connect.js');

dbTools.connectDB();

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const gatewayAddress = tools.getGatewayAddress();
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

//store device info

//check new firmware update available
app.post('/checknewfirmware', async (request, response) => {
    //receive request from client (iotivity device)
    console.log("Receive POST request--Check\n");
    console.log(request.body);
    const Mid = request.body.Mid;
    const current_firmware_version = request.body.fv;
    
    //store device info
    //check FU smart contract that compatible to device

    response.send("true");
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
            console.log(events);
            console.log(events.length);
            Uid = events[0]['returnValues']['Uid'];
        }
    )
    console.log(Uid);
    const metadata = await RC.methods.getFirmwareUpdate(Uid).call({
        from: gatewayAddress
    });

    console.log(metadata);
    
    var new_firmware_version = metadata[0];
    var Mid = metadata[1];
    var release_date = metadata[2];
    var dtype = metadata[3];
    var url = metadata[4];
    var signature = metadata[5];

 /*   console.log("Manufacturer ID: ", Mid);
    console.log("Release Date: ", release_date);
    console.log("Device Type: ",dtype);
    console.log("URL: ",url);
*/
    //verify signature
    var metadata_payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32"],[Uid,new_firmware_version,Mid,release_date,dtype,url]));
    const addrRecover = tools.recoverAddress(signature,metadata_payload);
    console.log(manufacturerAddress);
    console.log(addrRecover);

    //store the metadata to DB
    //dbTools.saveMetadataFirmwareUpdate(Uid,Mid,new_firmware_version,dtype,release_date,url);    

    /*
    RC.events.NewFirmwareStored()
    .on('data', (event) => {
        console.log(event);
    })
    .on('error', console.error);
    */
});