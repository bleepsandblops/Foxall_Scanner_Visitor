var mongoose = require('mongoose');

var cameraSchema = mongoose.Schema({
    id: String,
    name: String,
    time: Number
});

cameraSchema.methods.dump = function() {
    var output = "Time: " + this.time + " id:" + this.id;
    console.log(output);
}

var ScannerCamera = mongoose.model('ScannerCamera', cameraSchema);

module.exports = ScannerCamera;