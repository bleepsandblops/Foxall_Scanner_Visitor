var _ = require('lodash');
var async = require('async');
var fs = require('fs');
var mongoose = require('mongoose');

exports.getHome = function(req, res, next) {
    request = require('request');


    var ScannerImage = require('../models/ScannerImage');
    var ScannerTimeline = require('../models/ScannerTimeline');


    ScannerTimeline.find().sort({
        time: -1
    }).exec(function(err, timelines) {
        if (err) return console.error(err);
        console.log(timelines);
        timelines.forEach(function(timeline) {
            ScannerImage.find().sort({
                time: -1
            }).exec(function(err, images) {
                if (err) return console.error(err);
                console.log(images);
                res.render('foxall/home', {
                    timeline: timeline,
                    images: images
                })
            })
        })
        //        res.json(images);

    })


    ScannerImage.find().sort({
        time: -1
    }).exec(function(err, images) {
        if (err) return console.error(err);
        console.log(images);

        res.render('foxall/home', {
            images: images
        })
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

    scanners.forEach(function(scanner) {
        setTimeout(function() {
            doSingleScan(scanner);
        }, scanner.delay);
    });

    function doSingleScan(scanner) {
        var scannerTime = Date.now();
        var finished = _.after(2, function() {
            console.log("RENDERING");
            res.json({

            });
        });

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
        console.log(images);

        res.json(images);
    })
}