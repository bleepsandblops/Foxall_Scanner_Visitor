$(document).ready(function() {

    var socket = io();
    socket.on('image', function(path) {
        console.log('receiving image');
        console.log(path);
        console.log('<img src="' + path + '/>');
        //$('.js--current-scan-images').prepend('<img src="' + path + '"/>');
        $('.js--current-scan').append('1 done... ');
    });
    socket.on('imageFinished', function(times) {
        console.log(times);
        $('.js--current-scan').html('Scanned at ' + times.friendlyTime);
        var newId = $('.link-timeline').first().data('timelineid') - 1;
        var offset = 40;

        var currentTimeline =  $('.js--timeline-link').data('timeline');
        var newTimeline = currentTimeline - 1;
//        $('.timelines-viewport').css('transform', 'translateY('+ (-offset*newTimeline)+'px)');
        $('.js--timeline-link').data('timeline', newTimeline);
        $('.js--timeline-link').attr('href', $('#timeline-'+newTimeline).data('link'));


        $('.timelines-viewport').prepend('<span id="timeline-'+newId+'" data-timelineid="'+newId+'" data-link="/timeline/'+times.scannerTime+'" class="link-timeline">'+times.friendlyTime+'</span>');
    });


    function doScan() {
        //$('.js--current-scan-images').show();
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

    setTimeout(function() {
        console.log('doing scan');
        doScan();
    },60000);

    $('.js--timelines-arrow').click(function(e) {
        e.preventDefault();
        var currentTimeline =  $('.js--timeline-link').data('timeline');
        var direction = $(this).data('direction');
        var offset = 40;
        if (direction == 'down') {  var newTimeline = currentTimeline + 1;} else {  var newTimeline = currentTimeline - 1;}
        $('.timelines-viewport').css('transform', 'translateY('+ (-offset*newTimeline)+'px)');
        $('.js--timeline-link').data('timeline', newTimeline);
        $('.js--timeline-link').attr('href', $('#timeline-'+newTimeline).data('link'));
    })
});