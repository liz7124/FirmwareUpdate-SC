var mysql = require('mysql');
var util = require('util');

const DBname = "firmware_update";
const metadata_table = "firmware_update_metadata";
const device_table = "device_data";
const firmware_update_transactions_table = "firmware_update_transactions";
//var con;

var self = module.exports = {

    connectDB: function() {
        con = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "",
            database: DBname
        });

        /*con.connect(function(err) {
            if (err) throw err;
            console.log("Connected!");
        });*/

        return {
            query(sql, args) {
                return util.promisify(con.query)
                .call(con,sql,args);
            },
            close() {
                return util.promisify(con.end).call(con);
            }
        };
    },

    //insert to device table
    saveDeviceInfo: function(Mid,fv,dtype,uri) {
        var sql = "INSERT INTO " + device_table + " (manufacturer_id, firmware_version, device_type, URI) VALUES ("+Mid+","+fv+",'"+dtype+"','"+uri+"');";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    },

    //check if data exist
    checkDeviceExist: async function(Mid,uri) {
        var con = this.connectDB();
        var sql = "SELECT COUNT(*) as count FROM " + device_table + " WHERE manufacturer_id=" + Mid + " and uri='" + uri + "';";
        const result = await con.query(sql);
        return result[0]['count'];
        
        /*
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            return result;
        });*/
    },

    //insert to firmware update transactions table
    saveFirmwareUpdateTransactions: function(device_id,manufacturer_id,metadata_id,old_fv,new_fv) {
        var sql = "INSERT INTO " + firmware_update_transactions_table + " (device_id,manufacturer_id,metadata_id, old_firmware_version, new_firmware_version) VALUES ("+device_id+","+manufacturer_id+","+metadata_id+","+old_fv+","+new_fv+");";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    },

    //insert metadata to metadata table
    saveMetadataFirmwareUpdate: function(hash,manufacturer_id,firmware_version,dtype,release_date,url,signature) {
        var sql = "INSERT INTO " + metadata_table + " (hash,manufacturer_id,firmware_version,device_type,release_date,url,signature) VALUES ('"+hash+"',"+manufacturer_id+","+firmware_version+",'"+dtype+"','"+release_date+"','"+url+"','"+signature+"');";
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    },

    //check FU metadata compatibility
    checkMetadata: async function(Mid, dtype, fv) {
        var con = this.connectDB();
        var sql = "SELECT * FROM " + metadata_table + " WHERE manufacturer_id=" + Mid + " and device_type like '%" + dtype + "%' and firmware_version > " + fv + ";";
        const result = await con.query(sql);
        return result;
        /*
        con.query(sql, function (err, result, fields) {
            if (err) throw err;
            console.log(result);
            return result;
        });*/
    },

    //check metadata exist
    checkMetadataExist: async function(Uid) {
        var con = this.connectDB();
        var sql = "SELECT COUNT(*) as count FROM " + metadata_table + " WHERE hash='" + Uid + "';";
        const result = await con.query(sql);
        //console.log(result);
        return result[0]['count'];

        /*con.query(sql, function (err, result, fields) {
            if (err) {throw err;}
            //console.log(result[0]['count']);
            res = result[0]['count'];
            console.log(res);
            return res;
        });*/
    }

    
}