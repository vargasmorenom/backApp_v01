const mongose = require("mongoose");
class Database{

    dbUri = process.env.MONGODB_URI || "mongodb://localhost/ListyFybd1";

    constructor(){
        this.connect();
    }

    connect(){
        mongose.connect(this.dbUri,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
           
        })
        .then(()=>{
        console.log("conexcion OK");
        })
        .catch((err) =>{
        console.log("conexcion " + err);
        })

    }
}
module.exports = new Database();