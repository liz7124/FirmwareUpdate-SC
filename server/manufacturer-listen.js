const tools = require('./tools');
const express = require('express');
const net = require('net');
const fs = require('fs');
const Web3 = require('web3');
const {exec} = require("child_process");

const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

const app = express();
app.use(express.json());

const gatewayAddress = tools.getGatewayAddress();

app.post('/downloadnewfirmware', async (request, response) => {
    console.log(request.body);
    const Uid = request.body.payload.Uid;
    const fv = request.body.payload.fv;
    const signature = request.body.payload.signature;

    var payload_hash = web3.utils.keccak256(web3.eth.abi.encodeParameters(["bytes32", "int"],[Uid,fv,]));
    const addrRecover = tools.recoverAddress(signature,payload_hash);
    console.log("Verifying...");
    console.log(addrRecover);
    console.log(gatewayAddress);
    if (addrRecover == gatewayAddress) {
        console.log("Verification success!");
        /*exec("node manufacturer-sender.js", (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            console.log(`stdout: ${stdout}`);
            
        });*/
        response.send("true");
    } else {
        console.log("Verification failed!");
    }

});

app.listen(5500, async(request, response) => {
    console.log("I'm listening");
});