const mongoose = require('mongoose');


const productSchema = new mongoose.Schema({

  productName: {
    type: String,
  },
  productDescription: {
    type: String,
},
  productCategory: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'category', 
  },
  productPrice: {
    type: Number,
    
  },
  productRating: {
    type: Number,
    default:0,  
    
  },
  StockCount: {
    type: Number,
    
  },
  productOffer:{
 type: Number,
  },
  isvisible: {
    type:Boolean,
    default:false,
  },
  productImages: {
    type: [String], 
  }
,

});

// Create a model using the schema
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
