var mongoose = require('mongoose');

var timelineSchema = mongoose.Schema({
    id: String,
    time: Number
});

timelineSchema.methods.dump = function() {
    var output = "Time: " + this.time + " id:" + this.id;
    console.log(output);
}

var ScannerTimeline = mongoose.model('ScannerTimeline', timelineSchema);

module.exports = ScannerTimeline;