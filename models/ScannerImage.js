var mongoose = require('mongoose');

var imageSchema = mongoose.Schema({
    time: Date,
    scanner: String,
    installation: Number,
    path: String,
    timelineId: String,
    cameraId: String,
    order: Number
});

imageSchema.methods.dump = function() {
    var output = "Time: " + this.time + " installation:" + this.installation + " scanner:" + this.scanner+ " timelineId:" + this.timelineId;
    console.log(output);
}

var ScannerImage = mongoose.model('ScannerImage', imageSchema);

module.exports = ScannerImage;