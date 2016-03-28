$(document).ready(function() {

    $('.js--scan').click(function(e) {
        e.preventDefault();
        $('.overlay').show();
        $.get("/doscan", function(data) {
            console.log(data);
            //alert("success");
            var time = data.time;
            $('.images').prepend('<img src="/images/'+time+'.jpg"/>');
            $('.overlay').hide();
        })
            .fail(function() {
                console.log('error');
            });
    })

});