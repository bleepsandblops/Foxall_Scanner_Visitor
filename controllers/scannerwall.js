var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');
var unique = require('array-unique');

var finished;
var finishedHome;
var timelinesArray = new Array();
var daysArray = new Array();

var io = require('../server/io');

var AWS = require('aws-sdk');
var s3 = new AWS.S3();

var Jimp = require("jimp");



/*var express = require('express');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);
                io.emit('image', 'test');
*/


exports.getHome = function(req, res, next) {
    request = require('request');

    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');


    ScannerTimeline.find().sort({
        time: -1
    }).limit(1).exec(function(err, timelines) {
        if (err) {
            res.json({})
        };
        if (timelines.length == 0) {
            res.render('foxall/wall-home--empty', {
                pageClass: "wall",
                env: process.env.FOXALL_ENV
            })
        } else {
            timelinesArray = new Array();
            latestImages = new Array();
            console.log('walllll');
            console.log(timelines[0].id);
            finishedHome = _.after(timelines.length, function() {
                console.log("Finished.");
                var uniqueDays = unique(daysArray);
                res.render('foxall/wall-home', {
                    timelines: timelinesArray,
                    days: uniqueDays,
                    latestImages: latestImages,
                    pageClass: "wall",
                    time: friendlyTime(timelines[0].time),
                    env: process.env.FOXALL_ENV
                })
            });



            timelines.forEach(function(timeline) {
                ScannerImage.find({
                    "timelineId": timeline.id
                }).sort({
                    time: -1
                }).exec(function(err, images) {
                    if (err) return console.error(err);
                    /* Latest Timeline */

                    var date = new Date(timeline.time);
                    var day = date.toDateString();

                    daysArray.push(day);

                    timeline.unixDate = date;
                    timeline.friendlyTimeline = friendlyTime(date);
                    timeline.images = images;

                    timelinesArray.push(timeline);
                    finishedHome();
                })

            })
            //        res.json(images);
        }
    })
};

function friendlyTime(date) {
    /*var day = date.getDate();
    var hours = date.getHours();
    var minutes = "0" + date.getMinutes();
    var seconds = "0" + date.getSeconds();
    var friendlyTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);*/
    return date.toLocaleString();
}

exports.doWallScan = function(callbackImage, callbackFinished) {

    request = require('request');
    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');

    var scanners = JSON.parse(fs.readFileSync('scanners/scannersWall.json', 'utf8'));

    var download = function(uri, filename, callback) {
        request.head(uri, function(err, res, body) {
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
    var timeline = new ScannerTimeline({
        time: timelineId,
        id: timelineId
    });

    timeline.save(function(err, fluffy) {
        if (err) return console.error(err);
        console.log('timeline finished');
    });


    scanners.forEach(function(scanner) {
        setTimeout(function() {
            doSingleScan(scanner);
        }, scanner.delay);
    });

    finished = _.after(scanners.length, function(scannerTime) {
        console.log("RENDERING");
        io.emit('scannerWallFinished', {
            friendlyTime: friendlyTime(new Date(timelineId)),
            scannerTime: timelineId
        });
        callbackFinished(scannerTime);
    });

    function doSingleScan(scanner) {
        var scannerTime = Date.now();

        download(scanner.url, 'images/' + scanner.id + '-' + scannerTime + '.jpg', function() {

            /*gm('images/' + scanner.id + '-' + scannerTime + '.jpg').rotate(45).write(fs.createWriteStream, function (err) {
  if (!err) console.log(' hooray! ');
});*/


            //var writeStream = fs.createWriteStream( 'images/' + scanner.id + '-' + scannerTime + '-resized.jpg');

            Jimp.read('images/' + scanner.id + '-' + scannerTime + '.jpg', function(err, image) {
                if (err) {
                    throw err;
                } else {
                image.rotate(90) // resize
                .write('images/' + scanner.id + '-' + scannerTime + '.jpg'); // save


                var body = fs.createReadStream('images/' + scanner.id + '-' + scannerTime + '.jpg');

                s3.upload({
                    ACL: "public-read",
                    Body: body,
                    Bucket: 'foxall-publishing-rooms',
                    Key: 'images/' + scanner.id + '-' + scannerTime + '.jpg'
                }).
                on('httpUploadProgress', function(evt) {}).
                send(function(err, data) {
                    console.log(err, data)
                });


                var image = new ScannerImage({
                    time: scannerTime,
                    scanner: scanner.url,
                    installation: 1,
                    timelineId: timelineId,
                    path: 'images/' + scanner.id + '-' + scannerTime + '.jpg'
                });

                image.save(function(err, fluffy) {
                    if (err) return console.error(err);
                    console.log('kicking finished');
                    console.log(image.path);
                    io.emit('wallSingleImage', image.path);
                    callbackImage(image.path);
                    finished(scannerTime);
                });
                }
            });







            //pipe(fs.createWriteStream('images/' + scanner.id + '-' + scannerTime + '.jpg'));

        });

    }



}

exports.findDayTimelines = function(req, res, next) {
    request = require('request');

    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');


    ScannerTimeline.find({
        time: {
            $gte: req.params.day + " 00:00:00 +0000 2016",
            $lt: req.params.day + " 23:59:59 +0000 2016"
        }
    }).sort({
        time: -1
    }).exec(function(err, timelines) {
        if (err) return console.error(err);
        console.log(timelines);
        timelinesArray = new Array();
        res.json({
            timelines: timelines
        })
    })
}
/*
exports.doScan = function(req, res, next) {

    exports.doWallScan(
        function(path) {
            req.io.emit('image', path);
        },
        function(scannerTime) {
            req.io.emit('imageFinished', {
                friendlyTime: friendlyTime(new Date(scannerTime)),
                scannerTime: scannerTime
            });
            res.json({});
        })


}
*/

exports.getSearch = function(req, res, next) {
    request = require('request');
    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');
    var daysArray = new Array();

    for(i=0;i<36;i++) {
                    var date = new Date('19 May 2016');
                    date.setDate(date.getDate() - i);
                    var day = date.toDateString();
                    console.log(day);
                                        daysArray.push(day);

}
                res.render('foxall/wall-search', {
                    days: daysArray,
                    pageClass: "wall",
                    env: process.env.FOXALL_ENV
                })    
/*
    ScannerTimeline.find().sort({
        time: -1
    }).exec(function(err, timelines) {
        if (err) {
            res.json({})
        };
        if (timelines.length == 0) {
            res.render('foxall/wall-home--empty', {
                pageClass: "wall",
                env: process.env.FOXALL_ENV
            })
        } else {
            timelinesArray = new Array();
            latestImages = new Array();
            
            console.log(timelines[0].id);
            finishedHome = _.after(timelines.length, function() {
                console.log("Finished.");
                var uniqueDays = unique(daysArray);
                res.render('foxall/wall-search', {
                    timelines: timelinesArray,
                    days: uniqueDays,
                    latestImages: latestImages,
                    pageClass: "wall",
                    time: friendlyTime(timelines[0].time),
                    env: process.env.FOXALL_ENV
                })
            });



            timelines.forEach(function(timeline) {
                ScannerImage.find({
                    "timelineId": timeline.id
                }).sort({
                    time: -1
                }).exec(function(err, images) {
                    if (err) return console.error(err);

                    var date = new Date(timeline.time);
                    var day = date.toDateString();

                    daysArray.push(day);

                    timeline.unixDate = date;
                    timeline.friendlyTimeline = friendlyTime(date);
                    timeline.images = images;

                    timelinesArray.push(timeline);
                    finishedHome();
                })

            })
            //        res.json(images);
        }
    })
    */

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


exports.getTimeline = function(req, res, next) {
    request = require('request');
    var ScannerTimeline = require('../models/ScannerTimeline');

    var ScannerImage = require('../models/ScannerImage');

    //console.log(req);
    ScannerTimeline.find({
        time: req.params.timelineid
    }).sort({
        time: -1
    }).exec(function(err, timeline) {
        console.log(timeline);
        if (err) return console.error(err);

        timeline.forEach(function(timeline) {
            console.log(timeline);
            ScannerImage.find({
                "timelineId": timeline.id
            }).sort({
                time: -1
            }).exec(function(err, images) {
                if (err) return console.error(err);

                var date = new Date(timeline.time);
                timeline.friendlyTimeline = friendlyTime(date);
                timeline.images = images;
                timelinesArray.push(timeline);
                //console.log(timelinesArray);
                //finishedHome();
                res.render('foxall/wall-item', {
                    timeline: timeline,
                    pageClass: "wall",
                    env: process.env.FOXALL_ENV
                })
            })
        })
    })


};