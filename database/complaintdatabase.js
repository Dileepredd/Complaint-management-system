const mongoose = require("mongoose");

mongoose.connect(
    'mongodb://localhost:27017/complaintdatabase',
    {useNewUrlParser: true, useUnifiedTopology: true},
    function(err){
        if(err) throw err;
        console.log("Database connected");
});

var complaintschema = mongoose.Schema({
    collegeid : {
        type : String,required:true
    },
    phoneno : {
        type : String
    },
    lastupdatetime:{
        type : Date, required : true
    },
    starttime : {
        type : Date, required : true
    },
    status : {
        type : String,required:true
    },
    block : {
        type : String,required:true
    },
    floorno : {
        type : String
    },
    locationinfloor : {
        type : String
    },
    complaintdiscription : {
        type : String, required : true
    },
    department : {
        type : String
    }
});

const Complaint = mongoose.model(
    'complaint', complaintschema
);

module.exports = Complaint;