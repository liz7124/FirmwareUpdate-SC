const express = require('express');
const tools = require('./tools');

const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

const gatewayAddress = tools.getGatewayAddress();

const manufacturerMapping = {
    '1': {
        'name': 'Dallas',
        'address': tools.getManufacturerAddress()
    }
};

const app = express();
app.use(express.json());

app.post('/checknewfirmware', async (request, response) => {
    //receive request from client (iotivity device)
    const Mid = request.body.Mid;
    const current_firmware_version = request.body.current_firmware_version;
    
    //store device info
    //check FU smart contract that compatible to device
});

//verify the response from smart contract
//download update from manufacturer server
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
    var release_date = tools.convertByteToString(metadata[2]);
    var dtype = tools.convertByteToString(metadata[3]);
    var url = tools.convertByteToString(metadata[4]);

    console.log("Manufacturer ID: ", Mid);
    console.log("Release Date: ", release_date);
    console.log("Device Type: ",dtype);
    console.log("URL: ",url);

    //store the metadata to DB
    

    /*
    RC.events.NewFirmwareStored()
    .on('data', (event) => {
        console.log(event);
    })
    .on('error', console.error);
    */
});