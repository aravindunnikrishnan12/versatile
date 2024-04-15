const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');



const addressSchema = new mongoose.Schema({

    userId:{type:String},
    address1:{type:String},
    street:{type:String},
    country:{type:String},
    pincode: {type:String},
    phone: {type:String},
    additionalInfo:{type:String},
   

  });

  const Address = mongoose.model('Address',addressSchema);
  module.exports=Address;
