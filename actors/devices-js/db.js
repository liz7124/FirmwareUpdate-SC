var mysql = require('mysql');
var util = require('util');

const DBname = "firmware_update";
const metadata_table = "firmware_update_metadata";
const device_table = "device_data";
const firmware_update_transactions_table = "firmware_update_transactions";

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
}