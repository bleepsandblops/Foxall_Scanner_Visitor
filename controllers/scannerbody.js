var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var finished;
var finishedHome;
var timelinesArray = new Array();

var io = require('../server/io');

var sendgrid = require('sendgrid')(process.env.SENDGRID);

var Jimp = require("jimp");


exports.getHome = function(req, res, next) {
    request = require('request');

    res.render('foxall/body-scan', {

    })

};

function friendlyTime(date) {
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var friendlyTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return friendlyTime;
}





exports.doScan = function(req, res, next) {
    request = require('request');
    var ScannerImage = require('../models/ScannerImage');
    var ScannerCamera = require('../models/ScannerCamera');


    //var name = 'testname';

    var scanners = JSON.parse(fs.readFileSync('scanners/scannersBody' + '.json', 'utf8'));



    var download = function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            //console.log('content-type:', res.headers['content-type']);
            //console.log('content-length:', res.headers['content-length']);

            if (err) {
                console.log("----------------------------------------");
                console.log("A scanner didn't reply, details below");
                console.log(err);
                console.log("----------------------------------------");
                //res.end('error');
                scanFailed();
            } else {
                request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
            }
        });
    };

    var scanFailed = function() {
        finished(0);
    }

    var timelineId = Date.now();

    var camera = new ScannerCamera({
        time: timelineId,
        id: timelineId
    });

    camera.save(function(err, fluffy) {
        console.log('saving camera');
        console.log(fluffy);
        if (err) return console.error(err);
    });


    scanners.forEach(function(scanner) {
        console.log('in for each');
        setTimeout(function() {
            console.log("before single scsn" + scanner);
            doSingleScan(scanner);
        }, scanner.delay);
    });

    finished = _.after(scanners.length, function(scannerTime) {
        io.emit('bodyImageFinished', {
            friendlyTime: friendlyTime(new Date(timelineId)),
            scannerTime: timelineId
        });
        res.json({});
    });

    function doSingleScan(scanner) {
        var scannerTime = Date.now();

        download(scanner.url, 'images/' + scanner.id + '-' + scannerTime + '.jpg', function() {


  Jimp.read('images/' + scanner.id + '-' + scannerTime + '.jpg', function(err, image) {
                if (err) throw err;
                image.rotate(scanner.rotate) // resize
                .write('images/' + scanner.id + '-' + scannerTime + '.jpg'); // save


                //var body = fs.createReadStream(filename).pipe(zlib.createGzip());
                var body = fs.createReadStream('images/' + scanner.id + '-' + scannerTime + '.jpg');
                //var s3obj = new AWS.S3({params: {Bucket: 'foxall-publishing-rooms', Key: filename}});
                console.log('------');
                console.log('KICKING OFF UPLOAD TO AMAZON ' + scanner.id + '-' + scannerTime);
                console.log('------');
                s3.upload({
                    ACL: "public-read",
                    Body: body,
                    Bucket: 'foxall-publishing-rooms',
                    Key: 'images/' + scanner.id + '-' + scannerTime + '.jpg'
                }).
                on('httpUploadProgress', function(evt) {
                    if (evt.loaded == evt.total) {
                        console.log('------');
                        console.log('UPLOAD FOR ' + scanner.id + '-' + scannerTime + ' FINISHED');
                        console.log('------');
                    }
                }).
                send(function(err, data) {
                    console.log(err, data)
                });


                var image = new ScannerImage({
                    time: scannerTime,
                    scanner: scanner.url,
                    installation: 2,
                    cameraId: timelineId,
                    order: scanner.order,
                    path: 'images/' + scanner.id + '-' + scannerTime + '.jpg'
                });

                image.save(function(err, fluffy) {
                    if (err) return console.error(err);

                    req.io.emit('bodyImage', {
                        path: image.path,
                        order: scanner.order
                    });
                    finished(scannerTime);
                });
            });
        });

    }
}
/*

exports.getScans = function(req, res, next) {
    request = require('request');
    var ScannerImage = require('../models/ScannerImage');

    ScannerImage.find().sort({
        time: -1
    }).exec(function(err, images) {
        if (err) return console.error(err);
        res.json(images);
    })
}


exports.getCameraScan = function(req, res, next) {
    request = require('request');
    var ScannerCamera = require('../models/ScannerCamera');
    var ScannerImage = require('../models/ScannerImage');

    ScannerCamera.find({
        id: req.params.cameraid
    }).sort({
        time: -1
    }).exec(function(err, camera) {

        if (err) return console.error(err);

        camera.forEach(function(camera) {

            ScannerImage.find({
                "cameraId": camera.id
            }).sort({
                time: -1
            }).exec(function(err, images) {
                if (err) return console.error(err);

                var date = new Date(camera.time);
                camera.friendlyTimeline = friendlyTime(date);
                camera.images = images;
                res.render('foxall/camera-item', {
                    camera: camera,
                    env: process.env.FOXALL_ENV
                })
            })
        })
    })


};

exports.getCameras = function(req, res, next) {
    request = require('request');
    var ScannerCamera = require('../models/ScannerCamera');
    var ScannerImage = require('../models/ScannerImage');



    ScannerCamera.find().sort({
        time: -1
    }).exec(function(err, cameras) {
        if (err) return console.error(err);
        res.render('foxall/camera-home', {
            cameras: cameras,
            env: process.env.FOXALL_ENV
        })

    })


};

exports.sendEmail = function(req, res, next) {
    var camera = req.params.camera;
    var name = req.params.name;
    var type = req.params.type;
    if (type == 'publish') {
        var email = new sendgrid.Email({
            to: 'andrew@foxallstudio.com',
            from: 'info@foxallstudio.com',
            subject: 'New camera scan to be published for ' + name,
            text: 'http://publishingrooms.com/camera/' + camera
        });
    } else {
        var destination = req.params.destination;
        var email = new sendgrid.Email({
            to: destination,
            from: 'info@foxallstudio.com',
            subject: 'Your camera scan: ' + name,
            text: 'http://publishingrooms.com/camera/' + camera
        });
    }

    sendgrid.send(email, function(err, json) {
        if (err) {
            return console.error(err);
        }
        console.log(json);
        res.json({
            "message": "done",
            "type":type
        });
    });

}
*/