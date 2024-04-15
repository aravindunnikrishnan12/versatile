const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const couponSchema = new Schema({
    couponCode: {
        type: String,
    },
    discount: {
        type: Number,
    },
    expiryDate: {
        type: Date,
    },
    minAmount: {
        type: Number,
       
    },
    maxAmount: {
        type: Number,
     
    },
});

const CouponCollection = mongoose.model("Coupon", couponSchema);
module.exports = CouponCollection;
