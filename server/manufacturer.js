const tools = require('./tools');
const fs = require('fs');
const Web3 = require('web3');
//const rp = require('request-promise-native');

const web3 = new Web3(new Web3.providers.HttpProvider('http://192.168.0.30:8545'));

const manufacturerPrivateKey = tools.getManufacturerPrivateKey();
const manufacturerAddress = tools.getManufacturerAddress();

//deploy firmware update smart contract
// creating RegistryContract from deployed contract at the given address
const RC = tools.constructSmartContract(tools.getContractABI(), tools.getContractAddress());

async function main() {
    try {
        var fu_file = fs.readFileSync('/home/lizz/MyProjects/test-fu/server/downloads/newfirmware.zip','utf8');
    } catch(e) {
        console.log('Error:',e.stack);
    }

    const firmware_metadata = {
        Uid: tools.hashPayload(fu_file), //hash of new firmware update's binary file
        firmware_version: 2,
        Mid: 1,
        release_date: tools.convertStringToByte("March-2020"),
        dtype: tools.convertStringToByte("temperature_sensor"),
        url: tools.convertStringToByte("http://192.168.0.30/downloads")
    }
    //console.log(firmware_metadata.Uid);
    //console.log(firmware_metadata.release_date);
    
    //hash + signing
    var metadata_payload = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int", "int", "bytes32", "bytes32", "bytes32"],[firmware_metadata.Uid,firmware_metadata.firmware_version,firmware_metadata.Mid,firmware_metadata.release_date,firmware_metadata.dtype,firmware_metadata.url]));
    const metadata_signature = tools.signPayload(metadata_payload, manufacturerPrivateKey);

    // sending transaction to register payload to the smart contract
    let tx = await RC.methods.storeFirmwareMetadata(firmware_metadata.Uid, firmware_metadata.firmware_version, firmware_metadata.Mid, firmware_metadata.release_date, firmware_metadata.dtype, firmware_metadata.url, metadata_signature).send({
        from: manufacturerAddress,
        gas: 1000000
    });
    
    console.log(tx);
}

main();



/*const metadata_payload = JSON.stringify(firmware_metadata);
    const metadata_payload_hash = tools.hashPayload(metadata_payload);
    const metadata_signature = tools.signPayload(metadata_payload_hash, manufacturerPrivateKey);
    const payloadForGateway = {
        metadataPayload: metadata_payload,
        metadataSign: metadata_signature
    }
    const offChainPayload = await tools.encryptPayload(JSON.stringify(payloadForGateway), gatewayPublicKey);
    */