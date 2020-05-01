const mongoose = require("mongoose");

mongoose.connect(
    'mongodb://localhost:27017/complaintdatabase',
    {useNewUrlParser: true, useUnifiedTopology: true},
    function(err){
        if(err) throw err;
        console.log("Database connected");
});

var departmentschema = mongoose.Schema({
    department : {
        type : String,required:true
    },
    emails : {
        type : []
    }
});

const Department = mongoose.model(
    'department', departmentschema
);

module.exports = Department;