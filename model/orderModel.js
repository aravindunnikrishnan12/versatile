const mongoose = require('mongoose');



const orderSchema = mongoose.Schema({
    orderNumber: { type: String},
    userId: { type: String },
    products: [{
        productId: { type: mongoose.Schema.Types.ObjectId},
        productName: { type: String},
        productDescription: { type: String,},
        productRating: { type: Number,default:0,},
          StockCount: { type: Number,},
        productImage: { type: [String]},
        quantity: { type: Number,min: 1 },
        price: { type: Number,min: 0 },
        status: { type: String,default:"Pending"},
        reason: { type: String,default: "" },
      
        couponCode: { type: String },
        refferalCode: { type: String },
    }],
    totalQuantity: { type: Number,min: 1 },
    totalPrice: { type: Number,min: 0 },
    address: {
        address1:{type:String},
        street:{type:String},
        country:{type:String},
        pincode: {type:String},
        phone: {type:String},
        additionalInfo:{type:String},
    },
    discountedPrice: { type: Number},
    discountPrice: { type: Number},
    paymentMethod: { type: String},
    orderDate: { type: Date, default: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),},
    adminApproval: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    adminReason: { type: String, default: "" },
});


    
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;