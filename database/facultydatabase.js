const mongoose = require("mongoose");

mongoose.connect(
    'mongodb://localhost:27017/complaintdatabase',
    {useNewUrlParser: true, useUnifiedTopology: true},
    function(err){
        if(err) throw err;
        console.log("Database connected");
});

var facultyschema = mongoose.Schema({
    emails : {
        type : []
    }
});

const Faculty = mongoose.model(
    'faculty', facultyschema
);

module.exports = Faculty;