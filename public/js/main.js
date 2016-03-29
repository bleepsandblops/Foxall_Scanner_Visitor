$(document).ready(function() {

    var socket = io();
    socket.on('image', function(path) {
        console.log('receiving image');
        console.log(path);
        console.log('<img src="' + path + '/>');
        $('.js--current-scan-images').prepend('<img src="' + path + '"/>');
    });
    socket.on('imageFinished', function(scannerTime) {
        $('.js--current-scan').html('Scanned at ' + scannerTime)

    });


    $('.js--scan').click(function(e) {
        e.preventDefault();
        //$('.overlay').show();
        $('.js--current-scan-images').show();
        $('.js--current-scan').html('Scanning...')
        $.get("/doscan", function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
            //$('.images').prepend('<img src="/images/' + time + '.jpg"/>');

            //$('.overlay').hide();
        })
            .fail(function() {
                console.log('error');
            });
    })

});