var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');

var AWS = require('aws-sdk'); 

var finished;
var finishedHome;
var timelinesArray = new Array();

var s3 = new AWS.S3();


exports.getHome = function(req, res, next) {
    request = require('request');

            res.render('foxall/cameraScan', {
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

    var name = req.params.name;
    console.log('name'+name);
    //var name = 'testname';

    var scanners =
        [{
            'id': 'raspberrypi',
            'url': 'https://source.unsplash.com/random/400x500',
            'delay': 0
        }, {
            'id': 'scanner2',
            'url': 'https://source.unsplash.com/random/400x500',
            'delay': 1000
        }, {
            'id': 'scanner3',
            'url': 'https://source.unsplash.com/random/400x500',
            'delay': 1500
        },
         {
            'id': 'scanner4',
            'url': 'https://source.unsplash.com/random/400x500',
            'delay': 1500
        }];


    var download = function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
            console.log('content-type:', res.headers['content-type']);
            console.log('content-length:', res.headers['content-length']);
            request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);


        });
    };

    var timelineId = Date.now();

    var camera = new ScannerCamera({
        time: timelineId,
        id: timelineId,
        name: name
    });

    camera.save(function(err, fluffy) {
        if (err) return console.error(err);
        console.log('camera finished');
    });


    scanners.forEach(function(scanner) {
        setTimeout(function() {
            doSingleScan(scanner);
        }, scanner.delay);
    });

    finished = _.after(4, function(scannerTime) {
        req.io.emit('cameraImageFinished', {friendlyTime: friendlyTime(new Date(timelineId)), scannerTime: timelineId});
        res.json({});
    });

    function doSingleScan(scanner) {
        var scannerTime = Date.now();

        download(scanner.url, 'images/' + scanner.id + '-' + scannerTime + '.jpg', function() {

            //var body = fs.createReadStream(filename).pipe(zlib.createGzip());
            var body = fs.createReadStream('images/' + scanner.id + '-' + scannerTime + '.jpg');
            //var s3obj = new AWS.S3({params: {Bucket: 'foxall-publishing-rooms', Key: filename}});
            s3.upload({Body: body, Bucket: 'foxall-publishing-rooms', Key:  'images/'+scanner.id + '-' + scannerTime + '.jpg'}).
            on('httpUploadProgress', function(evt) { console.log(evt); }).
            send(function(err, data) { console.log(err, data) });


            var image = new ScannerImage({
                time: scannerTime,
                scanner: scanner.url,
                installation: 2,
                cameraId: timelineId,
                path: 'images/' + scanner.id + '-' + scannerTime + '.jpg'
            });

            image.save(function(err, fluffy) {
                if (err) return console.error(err);
                console.log('kicking finished');
                console.log(image.path);
                req.io.emit('cameraImage', image.path);
                finished(scannerTime);
            });
        });

    }
}

exports.deleteScan = function(req, res, next) {
    request = require('request');
    var ScannerCamera = require('../models/ScannerCamera');
    var ScannerImage = require('../models/ScannerImage');

    var scan = req.params.name;
    console.log('deleting');
    console.log(scan);
    ScannerCamera.find({
        time: scan
    }).remove().exec();
    ScannerImage.find({
        cameraId: scan
    }).remove().exec();    
    res.json({});
}

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

    console.log(req);
    ScannerCamera.find({
        time: req.params.cameraid
    }).sort({
        time: -1
    }).exec(function(err, camera) {
        console.log(camera);
        if (err) return console.error(err);

        camera.forEach(function(camera) {
            console.log(camera);
            ScannerImage.find({
                "cameraId": camera.id
            }).sort({
                time: -1
            }).exec(function(err, images) {
                if (err) return console.error(err);

                var date = new Date(camera.time);
                camera.friendlyTimeline = friendlyTime(date);
                camera.images = images;
                res.render('foxall/camera', {camera:camera})
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
        
            res.render('foxall/camerasList', {
                cameras: cameras
            })
        

        /*cameras.forEach(function(camera) {
            ScannerImage.find({
                "timelineId": camera.id
            }).sort({
                time: -1
            }).exec(function(err, images) {
                if (err) return console.error(err);

                var date = new Date(camera.time);
                camera.friendlyTimeline = friendlyTime(date);
                camera.images = images;
                camerasArray.push(camera);
                finishedCamera();
            })
        })*/
        //        res.json(images);
    })


};