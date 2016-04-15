$(document).ready(function() {

    var socket = io();
    /*
    socket.on('image', function(path) {
        console.log('receiving image');
        console.log(path);
        console.log('<img src="' + path + '/>');
        //$('.js--current-scan-images').prepend('<img src="' + path + '"/>');
        $('.js--current-scan').append('1 done... ');
    });


*/

$('.js--info ').click(function(e) {
    e.preventDefault();
    $('.modal-info').fadeIn();
})
$('.modal-info').click(function(e) {
    e.preventDefault();
    $(this).fadeOut();
})

    if ($('body').hasClass('bodyscan')) {

        socket.on('bodyImage', function(image) {
            console.log('receiving image');
            console.log(image);

            $('.js--body-image-' + image.order).html('<img class="body-image js--body-image" src="/' + image.path + '"/>');

            //console.log('<img src="' + path + '/>');
            //$('.js--current-scan-images').prepend('<img src="/' + path + '"/>');
        });


        socket.on('bodyImageFinished', function(camera, image) {
            console.log('body finished');
            //  console.log(image);
            $('.wall-message--body').hide();
            //    $('.js--body-image-'+image.order).attr('src', image.path);
            //console.log('<img src="' + path + '/>');
            //$('.js--current-scan-images').prepend('<img src="/' + path + '"/>');
        });

    }

    if ($('body').hasClass('camerascan')) {

        socket.on('cameraImage', function(data) {
            var path = data.path;
            var cameraSocket = data.cameraSocket;
            var camera = $('.js--camera-scan').data('camera');
            if (camera == cameraSocket) {

                console.log('receiving image');
                console.log('<img src="' + path + '/>');
                $('.js--current-scan-images').prepend('<img src="/' + path + '"/>');
                //$('.js--current-scan').append('1 done... ');
            }
        });

        socket.on('cameraImageFinished', function(data) {
            var times = data;
            var cameraSocket = data.cameraSocket;

            var camera = $('.js--camera-scan').data('camera');
            if (camera == cameraSocket) {

                var time = 15;
                var timeInterval = setInterval(function() {
                    $('.js--current-scan').html(time);
                    time--;
                    if (time == -1) {
                        clearInterval(timeInterval);

                        $('.js--current-scan').html('Scanning completed. ');

                        $('.js--camera-publish').data('link', times.scannerTime);
                        $('.js--camera-publish').data('name', $('.js--camera-name').val());

                        $('.js--current-scan').append('<a data-scan="' + times.scannerTime + '" class="button button--yellow scan-validation-link js--reject-camera-scan" data-camera="' + camera + '" href="#">Re-Scan</a>');
                        $('.js--current-scan').append('<a href="/camera/' + times.scannerTime + '" class="js--accept-camera-scan button scan-validation-link">Publish</a>');
                        bindScanControls();

                    }
                }, 1000);
            }
        });
    }

    if ($('body').hasClass('wall')) {


        socket.on('wallMessage', function(message) {
            console.log(message);
            //$('.message').append(message);
            $('.wall-message').show();
        });
        socket.on('wallSingleImage', function(path) {
            if ($('.js--wall-images').data('status') == 'done') {

                $('.js--wall-images').empty();
                $('.js--wall-images').data('status', 'doing');
            }
            console.log('received image single wall with path ' + path);
            $('.js--wall-images').append('<img onerror="this.style.display=\'none\'" src="/' + path + '"/>');

        });

        socket.on('scannerWallFinished', function(times) {
            console.log(times);
            $('.wall-message').hide();
            $('.js--wall-images').data('status', 'done');
            $('.scan-time').html('Scanning completed at ' + times.friendlyTime);
        });
    }


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
                }, 100) //NASTY

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

    $('.js--body-scan').click(function(e) {
        e.preventDefault();
        console.log('body starting');
        $('.wall-message--body').show();
        $.get("/bodyScan/doscan", function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
        })
            .fail(function() {
                console.log('error');
            });

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
        $(this).fadeOut(function() {
            $('.js--current-scan').html('Scanning...')
            $('.js--current-scan').fadeIn();
        });
        var camera = $(this).data('camera');

        doCameraScan(camera);
    })

    function doCameraScan(camera) {
        var name = $('.js--camera-name').val();


        $.get("/camera/" + camera + "/doscan/" + name, function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
        })
            .fail(function() {
                console.log('error');
            });
    }

    $('.js--camera-email-init').click(function(e) {
        e.preventDefault();
        $('.email-controls').fadeIn();
    })
    $('.js--camera-publish').click(function(e) {
        e.preventDefault();
        var camera = $(this).data('link');
        var name = $(this).data('name');
        var type = $(this).data('type');
        if (type == 'email') {
            var destination = $('.js--camera-email').val();
        }
        $(this).fadeOut();

        $.get("/camera/sendemail/" + camera + '/' + name + '/' + type + '/' + destination, function(data) {

            if (data.message == 'done' && data.type == 'publish') {
                $('.js--email-message').html("Thank you - your scan will be printed within 2 hours.");

            }
            if (data.message == 'done' && data.type == 'email') {
                $('.js--email-message').html("Thank you - your scan has been sent by email.");
                $('.email-controls').fadeOut();
            }
        })
            .fail(function() {
                console.log('error');
            });

    });



    function bindScanControls() {

        $('.js--reject-camera-scan').click(function(e) {
            var scan = $(this).data('scan');
            var camera = $(this).data('camera');
            console.log('rejecting');
            $.get("/camera/deletescan/" + scan, function(data) {
                console.log(data);
                $('.js--current-scan-images').empty()
                $('.js--camera-name').val('');
                $('.js--current-scan').fadeOut(function() {
                    $('.js--camera-scan').fadeIn();
                });

                //doCameraScan(camera);

            })
                .fail(function() {
                    console.log('error');
                });

        });




        $('.js--accept-camera-scan').click(function(e) {
            e.preventDefault();
            var scan = $(this).data('scan');
            var camera = $(this).data('camera');

            console.log('accepting');
            $('.send-modal').fadeIn();
            setTimeout(function() {
                location.reload();
            }, 5000);
        });

        $('.js--camera-rescan').click(function(e) {
            location.reload();
        })


    }


});