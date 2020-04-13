const express = require('express');
const tools = require('./tools');
const rp = require('request-promise-native');
const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const gatewayAddress = tools.getGatewayAddress();
const gatewayBPK = tools.getGatewayBPrivateKey();

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
            rp(options).then(function (response) {
                console.log('Response status code: ', response.statusCode)
                console.log('Response body: ', response.body);
                //If HAS --> Verify Metadata
                
                //Check getMetadata to FirmwareUpdate Smart Contract
                const metadata = await RC.methods.getFirmwareUpdate(Uid).call({
                    from: gatewayAddress
                });

                //Verify metadata from SmartContract and from gateway 01
                
                //Request Download binary file
                
                //Verify binary file
                
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