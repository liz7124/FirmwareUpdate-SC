pragma solidity >=0.4.23 <0.7.0;

contract FirmwareUpdate {
    struct firmware {
        bytes signature; //manufacturer address
        int firmware_version; //newest firmware version
        int manufacturer_id;
        bytes32 release_date; //Month-year: mm-yyyy
        bytes32 dtype; //device type
        bytes32 url; //url to download binary file. Need or not ?
    }

    //key: hash of binary firmware update file, value firmware struct
    mapping (bytes32 => firmware) public firmwareMetadata;
    //string public signedPrefix = "NewFirmwareUpdate:";

    event NewFirmwareStored(address sender, bytes32 Uid);
    event VerificationFailed();

    function storeFirmwareMetadata(bytes32 Uid, int fv, int Mid, bytes32 date, bytes32 _dtype, bytes32 _url, bytes memory signature) public {
        bytes32 hash = keccak256(abi.encodePacked(Uid,fv,Mid,date,_dtype,_url));
        //bytes32 messageHash = keccak256(abi.encodePacked(signedPrefix,hash));
        address signer = recover(hash, signature);
        if (signer == msg.sender) {
            firmware storage p = firmwareMetadata[Uid];
            p.firmware_version = fv;
            p.manufacturer_id = Mid;
            p.release_date = date;
            p.dtype = _dtype;
            p.url = _url;
            p.signature = signature;
            //p.isVerified = true;

            emit NewFirmwareStored(msg.sender, Uid);
        } else {
            emit VerificationFailed();
        }
    }

    function getFirmwareUpdate(bytes32 Uid) public view returns(int, int, bytes32, bytes32, bytes32, bytes memory){
        return (firmwareMetadata[Uid].firmware_version,
        firmwareMetadata[Uid].manufacturer_id,
        firmwareMetadata[Uid].release_date,
        firmwareMetadata[Uid].dtype,
        firmwareMetadata[Uid].url,
        firmwareMetadata[Uid].signature);
    }

    /**
    * @dev Recover signer address from a message by using their signature
    * @param hash bytes32 message, the hash is the signed message. What is recovered is the signer address.
    * @param signature bytes signature, the signature is generated using web3.eth.sign()
    */
    function recover(bytes32 hash, bytes memory signature) public pure returns (address) {
        bytes32 r;
        bytes32 s;
        uint8 v;

        // Check the signature length
        if (signature.length != 65) {
            return (address(0));
        }

        // Divide the signature in r, s and v variables
        // ecrecover takes the signature parameters, and the only way to get them
        // currently is to use assembly.
        // solium-disable-next-line security/no-inline-assembly
        assembly {
            r := mload(add(signature, 0x20))
            s := mload(add(signature, 0x40))
            v := byte(0, mload(add(signature, 0x60)))
        }

        // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
        if (v < 27) {
            v += 27;
        }

        // If the version is correct return the signer address
        if (v != 27 && v != 28) {
            return (address(0));
        } else {
            // solium-disable-next-line arg-overflow
            return ecrecover(hash, v, r, s);
        }
    }
}