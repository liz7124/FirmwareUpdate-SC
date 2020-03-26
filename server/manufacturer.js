const tools = require('./tools');
//const rp = require('request-promise-native');

// setup parameters that are known by the device.
const manufacturerPrivateKey = tools.getManufacturerPrivateKey();
//const gatewayPublicKey = tools.getGatewayPublicKey();
const manufacturerAddress = tools.getManufacturerAddress();

//deploy firmware update smart contract
// creating RegistryContract from deployed contract at the given address
const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

async function main() {
    const firmware_metadata = {
        Uid: "ABCDEFGHIJKLMNOPQRSTUVWXYZ", //hash of new firmware update's binary file
        firmware_version: 1,
        Mid: 1,
        release_date: tools.convertStringToByte("02-2020"),
        dtype: tools.convertStringToByte("temperature_sensor"),
        url: tools.convertStringToByte("http://127.0.0.1")
    }

    const Uid_hash = tools.hashPayload(firmware_metadata.Uid);
    
    //store firmware update metadata
    // sending transaction to register payload to the smart contract
    let tx = await RC.methods.storeFirmwareMetadata(Uid_hash, firmware_metadata.firmware_version, firmware_metadata.Mid, firmware_metadata.release_date, firmware_metadata.dtype, firmware_metadata.url).send({
        from: manufacturerAddress,
        gas: 1000000
    });
    
    console.log(tx);

    /*const metadata_payload = JSON.stringify(firmware_metadata);
    const metadata_payload_hash = tools.hashPayload(metadata_payload);
    const metadata_signature = tools.signPayload(metadata_payload_hash, manufacturerPrivateKey);
    const payloadForGateway = {
        metadataPayload: metadata_payload,
        metadataSign: metadata_signature
    }
    const offChainPayload = await tools.encryptPayload(JSON.stringify(payloadForGateway), gatewayPublicKey);

    //send metadata to gateway
    let options = {
        method: 'POST',
        uri: tools.getGatewayEnpoint(),
        body: {offChainPayload},
        resolveWithFullResponse: true,
        json: true // Automatically stringifies the body to JSON
    };
    rp(options).then(function (response) {
        console.log('Response status code: ', response.statusCode);
        console.log('Response body: ', response.body);
    }).catch(function (err) {
        console.log(err);
    })
    */


//sign FU metadata
}

main();