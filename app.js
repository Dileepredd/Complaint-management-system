const express = require('express'),
    app = express(),
    bodyParser = require("body-parser"),
    session = require("express-session"),
    cookieParser = require("cookie-parser"),
    fs = require('fs-extra'),
    complaintdb = require("./database/complaintdatabase");

app.set('view engine',"ejs");
app.use(express.static("./public"));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(session({secret:"hello world its a secret",resave: true,saveUninitialized: true}));

// path to display default page.
app.get("/",function(req,res,next){
    res.render("ui");
    next();
});

app.get("/Block/:Block/complaint/next/",function(req,res,next){ 
    console.log(req.params.Block);
    complaintdb.findOne({
        block : req.params.Block,
        status : "pending"
        },
        function(err,result){
            if(err) throw new Error("error at line 28");
            if(result == null){
                res.json({
                    status : "null"
                });//update the send
                next();
            }
            else{
                result.status = "processing";
                result.lastupdatetime = Date.now();
                result.save(function(err){
                    if(err)throw new Error("error while saving at 36 line");
                    console.log("saved ", result);
                    require("ejs").renderFile("./views/complaint.ejs",{object:result},function(err,html){
                        if(err) throw new Error("err");
                        console.log(html);
                        res.json({
                            status : "ok",
                            id : result._id,
                            html : html
                        });
                        next();
                    });
                });
            }
        }
    );
});// path to read a complaint by block.returns a next complaint.

// path to classify a complaint by department.
app.get("/complaint/:complaintid/department/:dep",function(req,res,next){
    complaintdb.findOne({
            _id:req.params.complaintid
        },
        function(err,result){
            if(err) throw new Error("error at 54");
            if(result == null){
                res.send("error");
                next();
            }
            else{
                result.department = req.params.dep;
                result.status = "processed";
                result.lastupdatetime = Date.now();
                if(result.department === "Deleted")
                {
                    result.status = "Deleted";
                    result.department = "not classified";
                }
                result.save(function(err){
                    if(err)throw new Error("hello");
                    console.log("saved");
                    res.send("done");
                    next();
                });
            }
        }
    );
});

//path to read complaint by department.
app.get("/department/:dep/:status/complaint/next",function(req,res,next){
    // console.log();
    complaintdb.findOne({
        status : req.params.status,
        department : req.params.dep
        },
        function(err,result){
            if(err) throw new Error("err at 58");
            if(result == null){
                res.json({status:"null"});
                next();
            }
            else{
                require("ejs").renderFile("./views/complaint.ejs",{object:result},function(err,html){
                    if(err) throw new Error("err");
                    res.json({
                        status : "ok",
                        id : result._id,
                        html : html
                    });
                    next();
                });
            }
        }
    );
});

app.listen(4000,function(err){
    if(!err){
        console.log("server succesfully started at port 4000!!!!");
    }
});