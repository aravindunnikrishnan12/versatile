const mongoose = require("../config/dbConnect.js");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
  },
  isBlocked: {
    type: Boolean,
    default:false,
  },
  token:{
    type: String,
    default:''
  },
  wallet: {
    balance: { type: Number, default: 0 },
    transactions: [{
        amount: { type: Number, required: true },
        description: { type: String, required: true },
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['deposit', 'withdrawal', 'transfer', 'purchase', 'refund'], required: true },
    }],
  },
});

const userCollection = mongoose.model("User", userSchema);

module.exports = userCollection;