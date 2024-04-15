const express = require('express');
const mongoose1 = require('mongoose');
const mongoose = require("../config/dbConnect");
const { ObjectId } = mongoose.Types; 



const cartSchema = new mongoose.Schema({
    userid: {
        type: ObjectId
    },
    productid: {
        type: ObjectId
    },
    product: {
        type: String
    },
    price: {
        type: Number
    },
   description:{
    type: String
  },
    quantity: {
        type: Number
    },
    image: {
        type: [String]
    },
    totalPrice: {
      type: Number
    },
    discountedprice: {
      type: Number
    },
    category:{
      type: String
    },
    stock:{
      type: Number,
      default: 0
    },

})


const cartCollection = mongoose.model('cart', cartSchema);

module.exports = cartCollection

// const cartSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'user',
//     required: true,
//   },
//   items: [
//     {
//       product: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Product',
//         required: true,
//       },
//       quantity: {
//         type: Number,
//         required: true,
//         default: 1,
//       },
//     },
//   ],
// });

// const Cart = mongoose.model('Cart', cartSchema);

  
//   module.exports = Cart;

