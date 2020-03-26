const EthCrypto = require('eth-crypto');
const crypto = require('crypto');
const fs = require('fs');
const Web3 = require('web3');

//path
const gatewayPath = './assets/gateway.json';
const manufacturerPath = './assets/manufacturer.json';
const contractPath = './assets/contract.json';
const contractABIPath = '../build/contracts/FirmwareUpdate.json';

//endpoints
const gatewayEndpoint = 'http://localhost:4000/newfirmwareupdate';

// for symmetric encryption and decryption
const algorithm = 'aes256';
const inputEncoding = 'utf8';
const outputEncoding = 'hex';

//web3
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));

var self = module.exports = {
    /**
     * Read JSON file and return the contents of the file in object.
     * Also convert the address of Ethereum (if any) to checksum format.
     * @param {string} path     path to the JSON file.
     */
    readFile: function (path) {
        let data = fs.readFileSync(path, 'utf8');
        return JSON.parse(data);
    },
    /**
     * Construct a web3 object of the smart contract.
     * @param {string} abi       the ABI of the contract.
     * @param {string} address   the address of the deployed contract.
     */
    constructSmartContract: function (abi, address) {
        return new web3.eth.Contract(abi, address);
    },
    /**
     * Hash the payload.
     * @param {string} payload  the payload to be hashed.
     */
    hashPayload: function (payload) {
        return EthCrypto.hash.keccak256(payload);
    },
    /**
     * Encrypt the payload with destination public key.
     * @param {string} payloadHash      Hash of payload to be signed.
     * @param {hex} sourcePrivateKey    Key used to sign.
     */
    signPayload: function (payloadHash, sourcePrivateKey) {
        return EthCrypto.sign(sourcePrivateKey, payloadHash);
    },
    /**
     * Convert string to byte (for smart contract).
     * We can store more efficiently in bytes rather than in string
     * @param {*} string    string to be converted.
     */
    convertStringToByte: function (string) {
        return web3.utils.fromAscii(string);
    },
    /**
     * Convert byte to string (for smart contract).
     * @param {*} byte      byte to be converted.
     */
    convertByteToString: function (byte) {
        return web3.utils.toAscii(byte);
    },
    /**
     * Encrypt the payload with destination public key.
     * @param {string} payload          Payload to be encrypted.
     * @param {hex} destPublicKey       Key used to encrypt.
     */
    encryptPayload: async function (payload, destPublicKey) {
        const encryptedPayload = await EthCrypto.encryptWithPublicKey(destPublicKey, payload);
        return EthCrypto.cipher.stringify(encryptedPayload);
    },
    /**
     * Decrypt payload using source private key.
     * @param {string} encryptedPayload the encrypted payload to be decrypted.
     * @param {hex} privateKey          the key used to decrypt.
     */
    decryptPayload: async function (encryptedPayload, privateKey) {
        const encrypted = EthCrypto.cipher.parse(encryptedPayload);
        return await EthCrypto.decryptWithPrivateKey(privateKey, encrypted);
    },
    /**
     * Encrypt the message using symmetric encryption.
     * @param {hex} key         Key used to encrypt.
     * @param {string} data     Payload to be encrypted.
     */
    encryptSymmetrically(key, data) {
        let cipher = crypto.createCipher(algorithm, key);
        let ciphered = cipher.update(data, inputEncoding, outputEncoding);
        ciphered += cipher.final(outputEncoding);
        return ciphered;
    },
    /**
     * Decrypt the message using symmetric encryption.
     * @param {hex} key             Key used to decrypt.
     * @param {string} ciphered     Payload to be decrypted.
     */
    decryptSymmetrically(key, ciphered) {
        let decipher = crypto.createDecipher(algorithm, key);
        let deciphered = decipher.update(ciphered, outputEncoding, inputEncoding);
        deciphered += decipher.final(inputEncoding);
        return deciphered;
    },
//add verify

//-------------------GET---------------------------------------//
    /**
     * Get gateway private key from ganache configuration.
     */
    getGatewayPrivateKey: function () {
        let obj = self.readFile(gatewayPath);
        return obj.privateKey;
    },
    /**
     * Get gateway public key from ganache configuration.
     */
    getGatewayPublicKey: function () {
        let obj = self.readFile(gatewayPath);
        return EthCrypto.publicKeyByPrivateKey(obj.privateKey);
    },
    /**
     * Get gateway address from ganache configuration.
     */
    getGatewayAddress: function() {
        let obj = self.readFile(gatewayPath);
        return web3.utils.toChecksumAddress(obj.address);
    },

    /**
     * Get manufacturer private key from ganache configuration.
     */
    getManufacturerPrivateKey: function () {
        let obj = self.readFile(manufacturerPath);
        return obj.privateKey;
    },
    /**
     * Get manufacturer public key from ganache configuration.
     */
    getManufacturerPublicKey: function () {
        let obj = self.readFile(manufacturerPath);
        return EthCrypto.publicKeyByPrivateKey(obj.privateKey);
    },
    /**
     * Get manufacturer address from ganache configuration.
     */
    getManufacturerAddress: function() {
        let obj = self.readFile(manufacturerPath);
        return web3.utils.toChecksumAddress(obj.address);
    },
    /**
     * Get contract address from ganache after 'truffle deploy'.
     */
    getContractAddress: function () {
        let obj = self.readFile(contractPath);
        return web3.utils.toChecksumAddress(obj.address);
    },
    /**
     * Parsing the local contract ABI from truffle.
     * in live network, the ABI can be queried from etherscan.io
     */
    getContractABI: function () {
        let obj = self.readFile(contractABIPath);
        return obj.abi;
    },
    /**
     * Get Gateway URL endpoint for manufacturer send the firmware metadata
     */
    getGatewayEnpoint: function () {
        return gatewayEndpoint;
    }

}


