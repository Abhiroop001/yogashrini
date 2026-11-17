const mongoose = require("mongoose");

const rs = mongoose.Schema({
    rname: String,       // Retreat Name
    rdate: String,       // Retreat Date
    rlocation: String,   // Retreat Location
    ractivities: String, // Retreat Activities
    rcost: String        // Retreat Cost
});

module.exports = mongoose.model("Retreat", rs);
