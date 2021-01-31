const mail = require("nodemailer"),
    complaintdb1 = require("./database/complaintdatabase"),
    complaintdb2 = require("./database/complaintdatabase"),
    complaintdb3 = require("./database/complaintdatabase"),
    complaintdb4 = require("./database/complaintdatabase"),
    facultydb = require("./database/facultydatabase"),
    depdb = require("./database/departmentdatabase"),
    fs = require("fs-extra"),
    {google}        = require('googleapis'),
    {GoogleSpreadsheet} = require("google-spreadsheet"),
    creds             = require('./client_secret.json');

//completed.
//mail to be sent to the respective department regarding complaints.
async function sendmailstodepartment(){
    var tomails = [];
    await depdb.find({},function(err,results){
        if(err) throw new Error("err");
        tomails = results;
    });
    await complaintdb1.find({status : "processed"},function (err,results){
        if(err) throw new Error("error during line 6");
        if(results.length === 0){
            console.log("results 0");
        }
        else{
            results.forEach((result)=>{
                const smtp = mail.createTransport({
                    service : 'gmail',
                    host: 'smtp.gmail.com',
                    port: 465,
                    secure: true,
                    auth : {
                        user : "",
                        pass : ""
                    }
                });
                require('ejs').renderFile("./views/complaint.ejs",function(err,html){
                    if(err)throw new Error("err");
                    const mailoutput = html;
                    const mailopts = {
                        subject : "New Complaint for your Department",
                        html : mailoutput
                    };
                    var tomail = tomails[result.department]; 
                    tomail.forEach((to)=>{
                        mailopts.to = to;
                        smtp.sendMail(
                        mailopts,
                        function (err){
                            if(err) throw new Error("error in sendMail");
                            result.status = sent;
                            result.lastupdatetime = Date.now();
                            result.save(function(err){
                                if(err) throw new Error("error while saving result : ");
                                console.log("saved");
                            });
                        });
                    });
                });
            });
        }
    });
    setTimeout(function(){sendmailstodepartment();},8.64e+7/*1day*/);
};
// write code to reprocess the status of the complaint.
// completed
async function convertstatus(){
    await complaintdb2.find({
            status : "processing",
            lastupdatetime : {
                $lt : Date.now() - 600000
            }
        },
            function(err,results){
                if(err) throw new Error("message");
                if(results.length === 0);
                else{
                    results.forEach(function(result){
                        result.status = "pending";
                        result.lastupdatetime = Date.now();
                        result.save(function(err){
                            if(err) throw new Error("err");
                            console.log("saved ",result);
                        });
                    });
                }
            }
    );
    setTimeout(()=>convertstatus(),600000/*10minutes*/);
}
//completed
// write code to send a summary google document to faculty for every one week.
async function sendsummarytofaculty(){
    var tomails = [];
    await facultydb.find({},function(err,results){
        if (err) throw new Error("err");
        tomails = results[0];
    });
    var listofcsvfiles = [];
    var states = ["Deleted","pending","processing","processed","sent","completed","confirmed"];
    var headers = ["collegeid","block","floorno","locationinfloor","status","starttime","lastupdatetime","department","description"];
    states.forEach(async (state)=>{
        await complaintdb3.find({
                status : state
            },
            function(err,results){
                if(err)throw new Error("err");
                var obj = {};
                obj.path = "./public/csv/"+state+"Complaints.csv";
                listofcsvfiles.push(obj);
                fs.createFileSync(obj.path);
                var str = "";
                headers.forEach((header)=>{
                    str += header + ", ";
                });
                str += "\n";
                results.forEach((result)=>{
                    str += result.collegeid + ", ";
                    str += result.block + ", ";
                    str += result.floorno + ", ";
                    str += result.locationinfloor + ", ";
                    str += result.status + ", ";
                    str += result.starttime + ", ";
                    str += result.lastupdatetime + ", ";
                    str += result.department + ", ";
                    str += result.description + ", ";
                    str += "\n";
                    if(state === "confirmed" || state === "Deleted"){
                        result.status = "facultyconfirmed";
                        result.lastupdatetime = Date.now();
                        result.save(function(err){
                            if(err) throw new Error("err");
                            console.log("saved");
                        });
                    }
                });
                fs.writeFileSync(obj.path,str);
            }
        );
    });
    const smtp = mail.createTransport({
        service : 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth : {
            user : "softwarelab2253@gmail.com",
            pass : "Bg8Yb9zGYyA"
        }
    });

    const mailoutput = "auto generated weekly status report by server based on the status of the complaints received.";

    const mailopts = {
        subject : "weekly status report of complaints",
        html : mailoutput,
        attachments : listofcsvfiles
    };

    tomails.forEach((tomail)=>{
        mailopts.to = tomail;
        smtp.sendMail(
            mailopts,
            function (err){
                if(err) throw new Error("error in sendMail");
                console.log("weekly mail to "+tomail+" is sent");
            }
        );
    });
    setTimeout(()=>{sendsummarytofaculty();},6.048e+8/*7 days*/);
}

// write code to register complaints by fetching details from google form.
//completed.
async function fetchcomplaints(){
    const doc = new GoogleSpreadsheet('1AREBcI7k76hWoBxRw01VfI7tBh-aLiRxb7g3w7aQLbc');

    await doc.useServiceAccountAuth(creds, function (err) {
        if(err) throw new Error("in auth");        
    });

    await doc.loadInfo();
    console.log(doc.title);
    
    const sheet = doc.sheetsByIndex[0];
    console.log(sheet.title);

    const rows = await sheet.getRows();
    for (let i=rows.length-1;i>=0;i--){
        var newcomplaint = new complaintdb4({
            collegeid : rows[i]['Email address'],
            phoneno : rows[0]['phone number'],
            starttime : Date.now(),
            lastupdatetime : Date.now(),
            status : "pending",
            block : String(rows[i].Block),
            floorno : String(rows[i].Floor),
            locationinfloor : String(rows[i].Location),
            complaintdiscription : String (rows[i].Descriptions)
        });
        await newcomplaint.save(function(err){
            if(err)throw new Error("err");
            console.log("saved");
            rows[i].delete();
        });
    }
    setTimeout(()=>fetchcomplaints(),8.64e+7/*1 day*/);
}

setTimeout(()=>sendmailstodepartment(),8.64e+7/*1 day*/);
setTimeout(()=>sendsummarytofaculty(),6.048e+8/*7 days*/);
setTimeout(()=>fetchcomplaints(),8.64e+7/*1 day*/);
setTimeout(()=>convertstatus(),600000/*10 min*/);
