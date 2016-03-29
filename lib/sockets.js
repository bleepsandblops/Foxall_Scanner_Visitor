
module.exports.listen = function(app) {
  var http = require('http').Server(app);
var socketio = require('socket.io')(http);

    io = socketio.listen(app)

    io.on('connection', function(socket) {
        console.log('a user connected');
    });

    return io
}