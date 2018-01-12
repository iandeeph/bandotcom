var express     = require('express');
var router      = express.Router();
var _           = require('lodash');
var mysql       = require('promise-mysql');
var Promise     = require('bluebird');
var moment      = require('moment');
var randomize   = require('randomatic');

//source : http://stackoverflow.com/questions/20210522/nodejs-mysql-error-connection-lost-the-server-closed-the-connection
var db_config = {
    host         : 'localhost',
    user         : 'root',
    password     : 'c3rmat',
    insecureAuth : 'true',
    database     : 'db_bandotcom'
};

var bandotcomConn;

function handleDisconnect() {
    bandotcomConn = mysql.createPool(db_config,{
        multipleStatements: true //for multiple update. Source : https://stackoverflow.com/questions/25552115/updating-multiple-rows-with-node-mysql-nodejs-and-q
    }); // Recreate the connection, since
    // the old one cannot be reused.

    bandotcomConn.getConnection(function(err) {              // The server is either down
        if(err) {                                     // or restarting (takes a while sometimes).
            console.log('error when connecting to db:', err);
            setTimeout(handleDisconnect, 2000); // We introduce a delay before attempting to reconnect,
        }                                     // to avoid a hot loop, and to allow our node script to
    });                                     // process asynchronous requests in the meantime.
                                            // If you're also serving http, display a 503 error.
    bandotcomConn.on('error', function(err) {
        console.log('db error', err);
        if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
            handleDisconnect();                         // lost due to either server restart, or a
        } else {                                      // connnection idle timeout (the wait_timeout
            throw err;                                  // server variable configures this)
        }
    });
}

handleDisconnect();

/* GET home page. */
router.get('/', function(req, res, next) {
    var passedVariable = req.query.respost;
    var message = {"text":"","color":""};
    switch (passedVariable){
        case '1':
            message = {"text":"Transaksi Berhasil..", "color":"green"};
            break;
        case '2':
            message = {"text":"Transaksi Gagal..!!", "color":"red"};
            break;
        default :
            message = {"text":"","color":""};
            break;
    }
    res.render('index',{
        message : message
    });
});

/* POST home page. */
router.post('/', function(req, res, next) {
    var dateNow = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    var lists = Array.prototype.slice.call(req.body.listTrx);
    var other = req.body.other;
    var user = "";
    var orderid = randomize('?Aa0',10,dateNow);
    var newStock = 0;

    var arrayTrxQuery = [];
    var arrayLogQuery = [];

    var queryStr = "select * from tb_kode " +
        "LEFT JOIN tb_item ON tb_kode.idkode = tb_item.idkode " +
        "order by tb_kode.kode";
    return bandotcomConn.query(queryStr)
        .then(function(rowItem) {
            return Promise.each(lists, function (listStock) {
                var cekKodePromise = new Promise(function (resolve, reject) {
                    resolve(_.find(rowItem, {'kode' : listStock.kode}));
                });
                cekKodePromise.then(function(resRows) {
                    //`db_bandotcom`.`tb_trx` (`orderid`, `idkode`, `hargabeli`, `hargajual`, `tanggal`, `jenistrx`, `jumlah`, `ongkos`, `lain`)
                    //`db_bandotcom`.`tb_log` (`user`, `aksi`, `detail`, `tanggal`)
                    newStock = (parseInt(resRows.jumlah) - listStock.jumlah);
                    var logString = "Order ID : "+ orderid +"\n" +
                        "ID Kode : "+ resRows.idkode +"\n" +
                        "Kode Barang : "+ resRows.kode +"\n" +
                        "Merek Barang : "+ resRows.merek +"\n" +
                        "Nama Barang : "+ resRows.nama +"\n" +
                        "Jenis Barang : "+ resRows.jenis +"\n" +
                        "Deskripsi Barang : "+ resRows.deskripsi +"\n" +
                        "Catatan Barang : "+ resRows.catatan +"\n" +
                        "Harga Jual : "+ resRows.hargajual +"\n" +
                        "Jumlah : "+ listStock.jumlah +"\n" +
                        "Ongkos : "+ parseInt(other.ongkos.replace(/[^0-9]/gi, '')) +"\n" +
                        "Biaya Lain : "+ parseInt(other.lain.replace(/[^0-9]/gi, ''));
                    arrayLogQuery.push([user, "Transaksi Kasir", logString, dateNow]);
                    arrayTrxQuery.push([orderid, resRows.idkode, resRows.hargabeli, resRows.hargajual, dateNow, '2', listStock.jumlah, parseInt(other.ongkos.replace(/[^0-9]/gi, '')), parseInt(other.lain.replace(/[^0-9]/gi, ''))]);

                    var queryItemString = "UPDATE db_bandotcom.tb_item SET " +
                        "jumlah = '"+ newStock  +"' " +
                        "where idkode = '"+ resRows.idkode +"' ";
                    return bandotcomConn.query(queryItemString)
                        .then(function() {
                        }).catch(function (error) {
                            //logs out the error
                            console.error(error);
                            var string = encodeURIComponent("2");
                            res.redirect('/?respost='+ string);
                        });
                });
            }).then(function () {
                Promise.all([arrayLogQuery, arrayTrxQuery])
                    .then(function () {
                        var queryTrxString = "INSERT INTO db_bandotcom.tb_trx (orderid, idkode, hargabeli, hargajual, tanggal, jenistrx, jumlah, ongkos, lain) VALUES?";
                        var queryLogString = "INSERT INTO db_bandotcom.tb_log (user, aksi, detail, tanggal) VALUES?";

                        var pushTrx = bandotcomConn.query(queryTrxString, [arrayTrxQuery]);
                        var pushLog = bandotcomConn.query(queryLogString, [arrayLogQuery]);

                        Promise.all([pushTrx, pushLog])
                            .then(function (results) {
                                var string = encodeURIComponent("1");
                                res.redirect('/?respost='+ string);
                            }).catch(function (error) {
                                //logs out the error
                                console.error(error);
                                var string = encodeURIComponent("2");
                                res.redirect('/?respost='+ string);
                            });
                    });
            });
        });
});

/* GET add-code page. */
router.get('/add-code', function(req, res, next) {
    var passedVariable = req.query.respost;
    var message = {"text":"","color":""};
    switch (passedVariable){
        case '1':
            message = {"text":"Jenis berhasil ditambah..", "color":"green"};
            break;
        case '2':
            message = {"text":"Tambah jenis gagal..!!", "color":"red"};
            break;
        default :
            message = {"text":"","color":""};
            break;
    }
    res.render('add-code',{
        message : message
    });
});

/* POST add-code page. */
router.post('/add-code', function(req, res, next) {
    var dateNow = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    var lists = Array.prototype.slice.call(req.body.listStock);
    var user = "";
    var arrayKodeQuery = [];
    var arrayItemQuery = [];
    var arrayLogQuery = [];
    var num = 1;
    return bandotcomConn.query("select max(idkode) maxid from tb_kode")
        .then(function (maxId) {
            console.log(maxId);
        return Promise.each(lists, function (listStock) {
            //`db_bandotcom`.`tb_kode` (`idkode`, `kode`, `nama`, `merek`, `jenis`, `deskripsi`, `catatan`)
            var maxIdCode = (parseInt(maxId[0].maxid) + num);
            //console.log(maxIdCode);
            arrayKodeQuery.push([maxIdCode, listStock.kode, listStock.nama, listStock.merek, listStock.jenis, listStock.deskripsi, listStock.catatan]);
            arrayItemQuery.push([maxIdCode, "0"]);

            var logString = "ID Kode : "+ maxIdCode +"\n" +
                "Kode Barang : "+ listStock.kode +"\n" +
                "Merek Barang : "+ listStock.merek +"\n" +
                "Nama Barang : "+ listStock.nama +"\n" +
                "Jenis Barang : "+ listStock.jenis +"\n" +
                "Deskripsi Barang : "+ listStock.deskripsi +"\n" +
                "Catatan Barang : "+ listStock.catatan;

            arrayLogQuery.push([user, "Tambah Jenis Barang", logString, dateNow]);
            num++;
        }).then(function () {
            var queryKodeString = "INSERT INTO db_bandotcom.tb_kode (idkode, kode, nama, merek, jenis, deskripsi, catatan) VALUES?";
            var queryItemString = "INSERT INTO db_bandotcom.tb_item (idkode, jumlah) VALUES?";
            var queryLogString = "INSERT INTO db_bandotcom.tb_log (user, aksi, detail, tanggal) VALUES?";

            var pushKode = bandotcomConn.query(queryKodeString, [arrayKodeQuery]);
            var pushItem = bandotcomConn.query(queryItemString, [arrayItemQuery]);
            var pushLog = bandotcomConn.query(queryLogString, [arrayLogQuery]);

            Promise.all([pushKode, pushItem, pushLog])
                .then(function (results) {
                    var string = encodeURIComponent("1");
                    res.redirect('/add-code?respost='+ string);
                }).catch(function (error) {
                    //logs out the error
                    console.error(error);
                    var string = encodeURIComponent("2");
                    res.redirect('/add-code?respost='+ string);
                });
            });
        });

});

/* GET ajax-sending-code page. */
router.get('/sending-code', function(req, res, next) {
    bandotcomConn.query("select * from tb_kode order by kode")
        .then(function(rowKode) {
            res.json(rowKode);
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* GET ajax-sending-code page. */
router.get('/sending-code-content', function(req, res, next) {
    var passedVariable;
    var queryStr;
    if(!_.isEmpty(req.query.id) || !_.isUndefined(req.query.id)){
        passedVariable = req.query.id;
        queryStr = "select * from tb_kode where idkode = '"+ passedVariable +"'order by kode";
    }else if(!_.isEmpty(req.query.name) || !_.isUndefined(req.query.name)) {
        passedVariable = decodeURI(req.query.name);
        queryStr = "select * from tb_kode where kode = '"+ passedVariable +"'order by kode";
    }
    return bandotcomConn.query(queryStr)
        .then(function(rowItem) {
            res.json(rowItem);
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});


/* GET ajax-sending-code page. */
router.get('/sending-content-by-name', function(req, res, next) {
    var passedVariable;
    var queryStr;
    passedVariable = decodeURI(req.query.name);
    queryStr = "select * from tb_kode " +
        "LEFT JOIN tb_item ON tb_kode.idkode = tb_item.idkode " +
        "WHERE tb_kode.kode = '"+ passedVariable +"'" +
        "order by tb_kode.kode";
    return bandotcomConn.query(queryStr)
        .then(function(rowItem) {
            res.json(rowItem);
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* GET ajax-sending-code page. */
router.get('/sending-full-content', function(req, res, next) {
    var passedVariable;
    var queryStr;
    queryStr = "select * from tb_kode " +
        "LEFT JOIN tb_item ON tb_kode.idkode = tb_item.idkode " +
        "order by tb_kode.kode";
    return bandotcomConn.query(queryStr)
        .then(function(rowItem) {
            res.json(rowItem);
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* GET add-stock page. */
router.get('/add-stock', function(req, res, next) {
    var passedVariable = req.query.respost;
    var message = {"text":"","color":""};
    switch (passedVariable){
        case '1':
            message = {"text":"Stock berhasil ditambah..", "color":"green"};
            break;
        case '2':
            message = {"text":"Tambah stock gagal..!!", "color":"red"};
            break;
        default :
            message = {"text":"","color":""};
            break;
    }

    bandotcomConn.query("select * from tb_kode order by kode")
        .then(function(rowKode) {
            res.render('add-stock',{
                message : message,
                rows : rowKode
            });
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* POST add-stock page. */
router.post('/add-stock', function(req, res, next) {
    //`db_bandotcom`.`tb_item` (`idkode`, `hargabeli`, `hargajual`, `jumlah`)
    //`db_bandotcom`.`tb_kode` (`kode`, `nama`, `jenis`, `deskripsi`, `catatan`)

    var dateNow = moment(Date.now()).format("YYYY-MM-DD HH:mm:ss");
    var lists = Array.prototype.slice.call(req.body.listStock);
    var user;
    var arrayKodeQuery = [];
    var arrayItemQuery = [];
    var arrayLogQuery = [];
    var arrayTrxQuery = [];
    var queryItemString;
    var queryTrxString;
    var queryLogString;
    var logString;
    var string;
    var num = 1;
    return bandotcomConn.query("select * from tb_kode " +
        "LEFT JOIN tb_item ON tb_kode.idkode = tb_item.idkode " +
        "order by tb_kode.kode")
        .then(function (rows) {
            return Promise.each(lists, function (listStock) {
                var cekidPromise = new Promise(function (resolve, reject) {
                    resolve(_.find(rows, {'idkode' : parseInt(listStock.kode)}));
                });

                cekidPromise.then(function(resRows) {
                    var hargaBeli = parseInt(listStock.hargabeli.replace(/[^0-9]/gi, ''));
                    var hargaJual =parseInt(listStock.hargajual.replace(/[^0-9]/gi, ''));
                    var jumlah = parseInt(listStock.jumlah.replace(/[^0-9]/gi, ''));
                    var total;

                    if(!_.isEmpty(resRows) || !_.isUndefined(resRows)){
                        //KALO IDKODE SUDAH ADA
                        queryItemString = "UPDATE db_bandotcom.tb_item SET " +
                            "hargabeli = '"+ hargaBeli +"', " +
                            "hargajual = '"+ hargaJual +"', " +
                            "jumlah = '"+ total  +"' " +
                            "where idkode = '"+ listStock.kode +"' ";

                        queryTrxString = "INSERT INTO db_bandotcom.tb_trx (idkode, hargabeli, hargajual, tanggal, jenistrx, jumlah) VALUES " +
                            "('"+ listStock.kode +"', '"+ hargaBeli +"', '"+ hargaJual +"', '"+ dateNow +"', '1', '"+ jumlah +"')";

                        logString = "Kode Barang : "+ listStock.kode +"\n" +
                            "Harga Beli : "+ hargaBeli +"\n" +
                            "Harga Jual : "+ hargaJual +"\n" +
                            "Jumlah : "+ jumlah;

                        queryLogString = "INSERT INTO db_bandotcom.tb_log (user, aksi, detail, tanggal) VALUES " +
                            "('"+ user +"', 'Tambah Stock','"+ logString +"','"+ dateNow +"')";

                        var itemPush = bandotcomConn.query(queryItemString);
                        var trxPush = bandotcomConn.query(queryTrxString);
                        var logPush = bandotcomConn.query(queryLogString);

                        Promise.all([itemPush, trxPush, logPush])
                            .then(function() {
                                string = encodeURIComponent("1");
                            }).catch(function (error) {
                                //logs out the error
                                string = encodeURIComponent("2");
                                console.error(error);
                            });
                    }else{
                        var cekNamakodePromise = new Promise(function (resolve, reject) {
                            resolve(_.find(rows, {'kode' : parseInt(listStock.kode)}));
                        });

                        cekNamakodePromise.then(function(resRows) {
                            if(!_.isEmpty(resRows) || !_.isUndefined(resRows)){
                                total = (parseInt(listStock.jumlah.replace(/[^0-9]/gi, '')) + parseInt(resRows.jumlah));
                                //KALO NAMA KODE SUDAH ADA
                                queryItemString = "UPDATE db_bandotcom.tb_item SET " +
                                    "hargabeli = '"+ hargaBeli +"', " +
                                    "hargajual = '"+ hargaJual +"', " +
                                    "jumlah = '"+ total  +"' " +
                                    "where kode = '"+ resRows.kode +"' ";


                                queryTrxString = "INSERT INTO db_bandotcom.tb_trx (idkode, hargabeli, hargajual, tanggal, jenistrx, jumlah) VALUES " +
                                    "('"+ listStock.kode +"', '"+ hargaBeli +"', '"+ hargaJual +"', '"+ dateNow +"', '1', '"+ jumlah +"')";

                                logString = "Kode Barang : "+ listStock.kode +"\n" +
                                    "Harga Beli : "+ hargaBeli +"\n" +
                                    "Harga Jual : "+ hargaJual +"\n" +
                                    "Jumlah : "+ jumlah;

                                queryLogString = "INSERT INTO db_bandotcom.tb_log (user, aksi, detail, tanggal) VALUES " +
                                    "('"+ user +"', 'Tambah Stock','"+ logString +"','"+ dateNow +"')";

                                var itemPush = bandotcomConn.query(queryItemString);
                                var trxPush = bandotcomConn.query(queryTrxString);
                                var logPush = bandotcomConn.query(queryLogString);

                                Promise.all([itemPush, trxPush, logPush])
                                    .then(function() {
                                        string = encodeURIComponent("1");
                                    }).catch(function (error) {
                                        //logs out the error
                                        string = encodeURIComponent("2");
                                        console.error(error);
                                    });
                            }else{
                                //KALO KODE BELUM ADA SAMA SEKALI
                                var findMaxIdKodePromise = new Promise(function (resolve, reject) {
                                    resolve(_.maxBy(rows, 'idkode'));
                                });

                                findMaxIdKodePromise.then(function(resMaxId) {
                                    var newIdKode = (parseInt(resMaxId.idkode) + num);
                                    console.log(newIdKode);
                                    var queryKodeString = "INSERT INTO db_bandotcom.tb_kode (idkode, kode, nama, merek, jenis, deskripsi, catatan) VALUES " +
                                        "('"+ newIdKode +"', '"+ listStock.kode +"', '"+ listStock.nama +"', '"+ listStock.merek +"', '"+ listStock.jenis +"', '"+ listStock.deskripsi +"', '"+ listStock.catatan +"')";
                                    var queryItemString = "INSERT INTO db_bandotcom.tb_item (idkode, hargabeli, hargajual, jumlah) VALUES " +
                                        "('"+ newIdKode +"', '"+ hargaBeli +"', '"+ hargaJual +"', '"+ jumlah +"')";

                                    queryTrxString = "INSERT INTO db_bandotcom.tb_trx (idkode, hargabeli, hargajual, tanggal, jenistrx, jumlah) VALUES " +
                                        "('"+ newIdKode +"', '"+ hargaBeli +"', '"+ hargaJual +"', '"+ dateNow +"', '1', '"+ jumlah +"')";

                                    logString = "Kode Barang : "+ listStock.kode +"\n" +
                                        "Merek Barang : "+ listStock.merek +"\n" +
                                        "Nama Barang : "+ listStock.nama +"\n" +
                                        "Jenis Barang : "+ listStock.jenis +"\n" +
                                        "Deskripsi Barang : "+ listStock.deskripsi +"\n" +
                                        "Catatan Barang : "+ listStock.catatan +"\n" +
                                        "Harga Beli : "+ hargaBeli +"\n" +
                                        "Harga Jual : "+ hargaJual +"\n" +
                                        "Jumlah : "+ jumlah;

                                    queryLogString = "INSERT INTO db_bandotcom.tb_log (user, aksi, detail, tanggal) VALUES " +
                                        "('"+ user +"', 'Tambah Stock Jenis Baru','"+ logString +"','"+ dateNow +"')";

                                    var itemPush = bandotcomConn.query(queryItemString);
                                    var kodePush = bandotcomConn.query(queryKodeString);
                                    var trxPush = bandotcomConn.query(queryTrxString);
                                    var logPush = bandotcomConn.query(queryLogString);

                                    Promise.all([itemPush, kodePush, trxPush, logPush])
                                        .then(function () {
                                            string = encodeURIComponent("1");
                                        }).catch(function (error) {
                                            //logs out the error
                                            string = encodeURIComponent("2");
                                            console.error(error);
                                        });
                                });
                                num++;
                            }
                        });
                    }
                });
            }).then(function() {
                res.redirect('/add-stock?respost='+ string);
            }).catch(function (error) {
                //logs out the error
                console.error(error);
            });
    });
});

/* GET recap page. */
router.get('/recap-stock', function(req, res, next) {
    bandotcomConn.query("select * from tb_kode " +
        "LEFT JOIN tb_item ON tb_kode.idkode = tb_item.idkode " +
        "order by tb_kode.kode")
        .then(function(rowItem) {
            res.render('recap-stock',{
                rows : rowItem
            });
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* GET trx-in page. */
router.get('/trxin-report', function(req, res, next) {
    bandotcomConn.query("select *, (hargabeli*jumlah) total from tb_trx " +
        "LEFT JOIN tb_kode ON tb_trx.idkode = tb_kode.idkode " +
        "where jenistrx = '1' " +
        "order by tb_kode.kode")
        .then(function(rowItem) {
            res.render('trxin-report',{
                rows : rowItem,
                grandTotal : _.sumBy(rowItem, 'total')
            });
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

/* GET trx-out page. */
router.get('/trxout-report', function(req, res, next) {
    var template = {};
    bandotcomConn.query("select *, (hargajual*jumlah) total from tb_trx " +
        "LEFT JOIN tb_kode ON tb_trx.idkode = tb_kode.idkode " +
        "where jenistrx = '2' " +
        "order by tb_kode.kode")
        .then(function(rowItem) {
            var groupedOrderid = _.groupBy(rowItem,'orderid');
            var arrOrderid = _.values(groupedOrderid);

            //Object.keys(groupedOrderid).forEach(function (key) {
            //    template[orderid.orderid] = [];
            //        console.log(key);
            //});
            //return Promise.each(arrOrderid, function (orderid) {
            //    var cekOrderid = new Promise(function (resolve, reject) {
            //        resolve(_.find(rowItem, {'orderid' : orderid.orderid}));
            //    });
            //
            //    cekOrderid.then(function(resRows) {
            //        template[orderid][resRow[0].tanggal] = [];
            //        return Promise.each(resRows, function (row) {
            //            template[row.orderid][row.tanggal].push({
            //                "kode" : row.kode,
            //                "merek" : row.merek,
            //                "nama" : row.nama,
            //                "jenis" : row.jenis,
            //                "deskripsi" : row.deskripsi,
            //                "catatan" : row.catatan,
            //                "hargajual" : row.hargajual,
            //                "Jumlah" : row.jumlah,
            //                "Total" : row.total
            //            });
            //
            //        });
            //    });
            //}).then(function(rowItem) {
                res.render('trxout-report',{
                    template : groupedOrderid,
                    rows : rowItem,
                    grandTotal : _.sumBy(rowItem, 'total')
                });

            }).catch(function (error) {
                //logs out the error
                console.error(error);
            });
        //});
});

/* GET log page. */
router.get('/log', function(req, res, next) {
    bandotcomConn.query("select * from tb_log order by tanggal DESC")
        .then(function(rowItem) {
            res.render('log',{
                rows : rowItem
            });
        }).catch(function (error) {
            //logs out the error
            console.error(error);
        });
});

module.exports = router;
