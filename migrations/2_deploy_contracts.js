const FirmwareUpdate = artifacts.require("FirmwareUpdate");

module.exports = function(deployer) {
  deployer.deploy(FirmwareUpdate);
};
