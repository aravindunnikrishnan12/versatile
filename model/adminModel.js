const mongoose = require("../config/dbConnect.js");


const adminschema= new mongoose.Schema({


    email:{
        type:String,
    },
    password:{
        type:String,
    },

    
});

const Admin=mongoose.model("Admin",adminschema)
module.exports=Admin;