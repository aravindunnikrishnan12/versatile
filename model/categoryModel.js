const mongoose = require("../config/dbConnect.js");

const categorySchema = new mongoose.Schema({


    categoryName:{
        type: String,
    },
    descrption:{
        type:String,
    },
    isvisible: {
        type:Boolean,
        default:false,
      }
});

const categoryCollection = mongoose.model("category", categorySchema);
module.exports = categoryCollection;
