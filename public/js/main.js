$(document).ready(function() {

    var socket = io();
    socket.on('image', function(path) {
        console.log('receiving image');
        console.log(path);
        console.log('<img src="' + path + '/>');
        //$('.js--current-scan-images').prepend('<img src="' + path + '"/>');
        $('.js--current-scan').append('1 done... ');
    });

    socket.on('message', function(message) {
        console.log(message);
        $('.message').append(message);
    });

    socket.on('imageFinished', function(times) {
        console.log(times);
        $('.js--current-scan').html('Scanned at ' + times.friendlyTime);
        var newId = $('.link-timeline').first().data('timelineid') - 1;
        var offset = 40;

        var currentTimeline = $('.js--timeline-link').data('timeline');
        var newTimeline = currentTimeline - 1;
        //        $('.timelines-viewport').css('transform', 'translateY('+ (-offset*newTimeline)+'px)');
        $('.js--timeline-link').data('timeline', newTimeline);
        $('.js--timeline-link').attr('href', $('#timeline-' + newTimeline).data('link'));

        $('.timelines-viewport').prepend('<span id="timeline-' + newId + '" data-timelineid="' + newId + '" data-link="/timeline/' + times.scannerTime + '" class="link-timeline">' + times.friendlyTime + '</span>');
    });

    $('.js--day-select').niceSelect();

    $('.js--day-select li').click(function(e) {
        var date = $(this).data('value');
        $.get("/scannerwall/findDayTimelines/" + date, function(data) {
            console.log('DAY TIMELINES');
            console.log(data);
            data.timelines.forEach(function(timeline) {
                var friendlyDate = new Date(timeline.time);
                console.log(friendlyDate);
                friendlyDate = friendlyDate.toLocaleTimeString();
                $('.js--time-select').append('<option value="' + timeline.id + '">' + friendlyDate + '</option>');
            })
            $('.js--time-select').niceSelect();
            $('.js--timeline-link').attr('href', '/timeline/' + $('.js--time-select li').first().data('value'));
            
            $('.js--time-select li').click(function(e) {
                setTimeout(function() {
                $('.js--timeline-link').attr('href', '/timeline/' + $('.js--time-select li.selected').data('value'));    
                $('.js--timeline-link').show().css('display', 'inline-block');
            },100) //NASTY
                
            });
            

        })
            .fail(function() {
                console.log('error');
            });
    })


    function doScan() {
        $('.js--current-scan').html('Scanning...')
        $.get("/doscan", function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
        })
            .fail(function() {
                console.log('error');
            });
    }

    $('.js--scan').click(function(e) {
        e.preventDefault();
        doScan();
    })

    /*
    $('.js--timelines-arrow').click(function(e) {
        e.preventDefault();
        var currentTimeline = $('.js--timeline-link').data('timeline');
        var direction = $(this).data('direction');
        var offset = 40;
        if (direction == 'down') {
            var newTimeline = currentTimeline + 1;
        } else {
            var newTimeline = currentTimeline - 1;
        }
        $('.timelines-viewport').css('transform', 'translateY(' + (-offset * newTimeline) + 'px)');
        $('.js--timeline-link').data('timeline', newTimeline);
        $('.js--timeline-link').attr('href', $('#timeline-' + newTimeline).data('link'));
    })
*/
    /* Camera */

    $('.js--camera-scan').click(function(e) {
        e.preventDefault();
        doCameraScan();
    })

    function doCameraScan() {
        var name = $('.js--camera-name').val();
        console.log(name);
        $('.js--current-scan').html('Scanning...')
        $.get("/camera/doscan/" + name, function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
        })
            .fail(function() {
                console.log('error');
            });
    }

    socket.on('cameraImage', function(path) {
        console.log('receiving image');
        console.log('<img src="' + path + '/>');
        $('.js--current-scan-images').prepend('<img src="' + path + '"/>');
        //$('.js--current-scan').append('1 done... ');
    });

    function bindScanControls() {
        $('.js--reject-camera-scan').click(function(e) {
            var scan = $(this).data('scan');
            console.log('rejecting');
            $.get("/camera/deletescan/" + scan, function(data) {
                console.log(data);
                $('.js--current-scan-images').empty()
                doCameraScan();
            })
                .fail(function() {
                    console.log('error');
                });

        });
    }

    socket.on('cameraImageFinished', function(times) {
        console.log(times);
        $('.js--current-scan').html('Scanning completed. ');
        // $('.js--current-scan').append('<a href="/camera/'+times.scannerTime+'">View Scan</a>');
        $('.js--current-scan').append('<a href="/camera/' + times.scannerTime + '" class="scan-validation-link">Accept Scan</a>');
        $('.js--current-scan').append('<a data-scan="' + times.scannerTime + '" class="scan-validation-link js--reject-camera-scan" href="#">Re-scan</a>');
        bindScanControls();
    });

    socket.on('scannerWallFinished', function(times) {
        console.log(times);
        $('.message').html('Scanning completed at '+times.friendlyTime);
    });

    
});