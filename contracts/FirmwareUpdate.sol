pragma solidity >=0.4.25 <0.7.0;

contract FirmwareUpdate {
    struct firmware {
        int firmware_version; //newest firmware version
        int manufacturer_id;
        bytes32 release_date; //Month-year: mm-yyyy
        bytes32 dtype; //device type
        bytes32 url; //url to download binary file. Need or not ?
    }

    //key: hash of binary firmware update file, value firmware struct
    mapping (bytes32 => firmware) public firmwareMetadata;

    event NewFirmwareStored(address sender, bytes32 Uid);

    function storeFirmwareMetadata(bytes32 Uid, int fv, int Mid, bytes32 release_date, bytes32 _dtype, bytes32 _url) public {
        firmware storage p = firmwareMetadata[Uid];
        p.firmware_version = fv;
        p.manufacturer_id = Mid;
        p.release_date = release_date;
        p.dtype = _dtype;
        p.url = _url;

        emit NewFirmwareStored(msg.sender, Uid);
    }

    function getFirmwareUpdate(bytes32 Uid) public view returns(int, int, bytes32, bytes32, bytes32){
        return (firmwareMetadata[Uid].firmware_version,
        firmwareMetadata[Uid].manufacturer_id,
        firmwareMetadata[Uid].release_date,
        firmwareMetadata[Uid].dtype,
        firmwareMetadata[Uid].url);
    }
}