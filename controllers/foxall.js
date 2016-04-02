var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');

var finished;
var finishedHome;
var timelinesArray = new Array();


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
    }).exec(function(err, timelines) {
        if (err) return console.error(err);
        console.log(timelines);
        timelinesArray = new Array();

        finishedHome = _.after(timelines.length, function() {
            console.log("Showing Timelines");
            res.render('foxall/home', {
                timelines: timelinesArray
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
                timeline.friendlyTimeline = friendlyTime(date);
                timeline.images = images;
                timelinesArray.push(timeline);
                console.log(timelinesArray);
                finishedHome();
            })
        })
        //        res.json(images);
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
    var ScannerTimeline = require('../models/ScannerTimeline');

    /*    var scanners =
        [{
            'id': 'raspberrypi',
            'url': 'http://raspberrypi.local/',
            'delay': 0
        }, {
            'id': 'scanner2',
            'url': 'http://scanner2.local/',
            'delay': 2000
        }, {
            'id': 'scanner3',
            'url': 'http://scanner3.local/',
            'delay': 2000
        }];
*/
    var scanners =
        [{
            'id': 'raspberrypi',
            'url': 'https://source.unsplash.com/random/900x600',
            'delay': 0
        }, {
            'id': 'scanner2',
            'url': 'https://source.unsplash.com/random/900x600',
            'delay': 1000
        }, {
            'id': 'scanner3',
            'url': 'https://source.unsplash.com/random/900x600',
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

    finished = _.after(3, function(scannerTime) {
        console.log("RENDERING");
        req.io.emit('imageFinished', {friendlyTime: friendlyTime(new Date(scannerTime)), scannerTime: scannerTime});

        res.json({});
    });

    function doSingleScan(scanner) {
        var scannerTime = Date.now();

        download(scanner.url, 'images/' + scanner.id + '-' + scannerTime + '.jpg', function() {
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
                req.io.emit('image', image.path);
                finished(scannerTime);
            });
        });

    }



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



exports.getPortrait = function(req, res, next) {
    request = require('request');
    res.render('foxall/portrait', {})
};

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
                res.render('foxall/timeline', {timeline:timeline})
            })
        })



    })


};