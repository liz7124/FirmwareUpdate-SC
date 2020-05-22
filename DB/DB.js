const Database = require('better-sqlite3');
const db = new Database('firmwareupdate.db', { /*verbose: console.log*/ });

class DB {
    constructor() {
        //this.dropTable();
        //this.clearTable();
        this.createDeviceTable();
        this.createFUmetadataTable();

        this.metadata_table = "firmware_update_metadata";
        this.device_table = "device_data";
    }

    clearTable() {
        var sql = 'DELETE FROM device_data';
        db.prepare(sql).run();
        var sql = 'DELETE FROM firmware_update_metadata';
        db.prepare(sql).run();
    }

    dropTable() {
        var sql = 'DROP table firmware_update_metadata;'
        db.prepare(sql).run();
        var sql = 'DROP table device_data;'
        db.prepare(sql).run();
    }

    createDeviceTable() {
        const sql = ' \
            CREATE TABLE IF NOT EXISTS device_data ( \
                device_id INTEGER NOT NULL PRIMARY KEY, \
                manufacturer_id INTEGER NOT NULL, \
                firmware_version INTEGER NOT NULL, \
                device_type text NOT NULL, \
                URI text NOT NULL, \
                last_update DATETIME DEFAULT CURRENT_TIMESTAMP \
            );';
        db.prepare(sql).run();
    }

    createFUmetadataTable() {
        const sql = ' \
            CREATE TABLE IF NOT EXISTS `firmware_update_metadata` ( \
                `metadata_id` INTEGER NOT NULL PRIMARY KEY, \
                `hash` text NOT NULL, \
                `manufacturer_id` INTEGER NOT NULL, \
                `firmware_version` INTEGER NOT NULL, \
                `device_type` text NOT NULL, \
                `release_date` text NOT NULL, \
                `url` text NOT NULL, \
                `signature` text NOT NULL \
            );';
        db.prepare(sql).run();
    }

    saveDeviceInfo(Mid,fv,dtype,uri) {
        var sql = `INSERT INTO ${this.device_table} (manufacturer_id, firmware_version, device_type, URI) VALUES (${Mid}, ${fv}, '${dtype}', '${uri}');`;
        return db.prepare(sql).run();
    }

    checkDeviceExist(Mid,uri) {
        var sql = "SELECT COUNT(*) as count FROM " + this.device_table + " WHERE manufacturer_id=" + Mid + " and uri like '" + uri + "';";
        return db.prepare(sql).get();
    }

    saveFUMetadata(hash,manufacturer_id,firmware_version,dtype,release_date,url,signature) {
        var sql = `INSERT INTO ${this.metadata_table} (hash,manufacturer_id,firmware_version,device_type,release_date,url,signature) VALUES \
        ('${hash}', ${manufacturer_id}, ${firmware_version}, '${dtype}', '${release_date}', '${url}', '${signature}');`;
        
        
        //('"+hash+"',"+manufacturer_id+","+firmware_version+",'"+dtype+"','"+release_date+"','"+url+"','"+signature+"');";
        console.log(sql);
        return db.prepare(sql).run();
    }

    checkMetadata(Mid, dtype, fv) {
        var sql = "SELECT * FROM " + this.metadata_table + " WHERE manufacturer_id=" + Mid + " and device_type like '%" + dtype + "%' and firmware_version > " + fv + ";";
        return db.prepare(sql).all();
    }

    getMetadataByUid(Uid) {
        var sql = "SELECT * FROM " + this.metadata_table + " WHERE hash=" + Uid + ";";
        return db.prepare(sql).all();
    }

    checkMetadataExist(Uid) {
        var sql = "SELECT COUNT(*) as count FROM " + this.metadata_table + " WHERE hash='" + Uid + "';";
        return db.prepare(sql).get();
    }
}

module.exports = DB;