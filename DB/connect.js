var mysql = require('mysql');

const DBname = "firmware_update";
const device_table = "device_data";
const firmware_update_transactions_table = "firmware_update_transactions";

var self = module.exports = {

    connectDB: function() {
        var con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: DBname
        });

        con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        });
    },

    //insert to device table
    saveDeviceInfo: function(Mid,fv,dtype,uri) {
        var sql = "INSERT INTO " + device_table + " (manufacturer_id, firmware_version, device_type, URI) VALUES ("+Mid+","+fv+",'"+dtype+"','"+uri+"');";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    },

    //insert to firmware update transactions table
    saveFirmwareUpdateTransactions: function(device_id,manufacturer_id,metadata_id,old_fv,new_fv) {
        var sql = "INSERT INTO " + firmware_update_transactions_table + " (device_id,manufacturer_id,metadata_id, old_firmware_version, new_firmware_version) VALUES ("+device_id+","+manufacturer_id+","+metadata_id+","+old_fv+","+new_fv+");";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    },

    //check if data exist
    checkDeviceExist: function(Mid,uri) {
        var sql = "SELECT COUNT(*) FROM " + device_table + "WHERE manufacturer_id=" + Mid + " and uri='" + uri + "';";
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            return result;
        });
    }
}