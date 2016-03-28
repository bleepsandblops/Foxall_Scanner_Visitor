var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');

var finished;
var finishedHome;
var timelinesArray = new Array();

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
                var hours = date.getHours();
                var minutes = "0" + date.getMinutes();
                var seconds = "0" + date.getSeconds();
                var friendlyTimeline = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
                timeline.friendlyTimeline = friendlyTimeline;
                timeline.images = images;
                timelinesArray.push(timeline);
                console.log(timelinesArray);
                finishedHome();
            })
        })
        //        res.json(images);
    })


};


exports.doScan = function(req, res, next) {
    request = require('request');
    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');

    var scanners =
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
            'delay': 3000
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

    finished = _.after(3, function() {
        console.log("RENDERING");
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
                finished();
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