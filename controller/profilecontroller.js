const express=require("express");
const router=express();
const Address = require("../model/addressModel");
const collection =require('../model/userModel');
const userData = require("../model/userModel")
const adressData = require("../model/addressModel")
const bcrypt = require('bcrypt');
const Order=require("../model/orderModel");
const CouponCollection = require('../model/couponModel');
const Product  = require("../model/addproductModel");
require('dotenv').config();
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;



exports.getprofile = async (req,res)=>{
   try{
    const userId=req.session.user;
     const userDatas =await userData.findById({_id:userId}).lean(); 
    console.log("userDatas",userDatas)
     const addresses = await adressData.find({userId:userId});
     if(!userId){
        return res.status(404).json({ success: false, message: 'user not found' });
     }

       res.render("userprofile2",{addresses,userDatas})    
   }
   catch(error){
    console.error(error);
    res.status(500).send("Internal server error");
   }
}

const Razorpay = require("razorpay");
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createPayment = async (req, res) => {
    try {
        const { amount } = req.body;
      
        const options = {
            amount: amount,
            currency: 'INR',
            receipt: "receipt_order_123",
            payment_capture: 1,
    
        };

      const order = await instance.orders.create(options); 
        res.json(order);
    } catch (error) {
        console.error("Error generating Razorpay order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.walletAddAmount = async (req, res) => {
    const { paymentId, amount } = req.body;
    try {
      const paymentVerified = verifyPayment(paymentId, amount);
      if (!paymentVerified) {
        return res.status(400).json({ success: false, error: "Invalid payment" });
      }
      const userId = req.session.user;
      const user = await userData.findOne({ _id: userId });
      if (!user) {
        return res.status(404).json({ success: false, error: "User not found" });
      }
      user.wallet.balance += amount;
      user.wallet.transactions.push({
        type: "deposit",
        amount: amount,
        description: "Added balance via Razorpay",
      });
  
      await user.save();
  
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding balance to wallet:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  };
  
  const verifyPayment = async (paymentId, amount) => {
    console.log("verify payment is working")
    try {
   
      const payment = await instance.payments.fetch(paymentId);
      console.log("payment is working",)

    
      if (payment.amount === amount && payment.currency === "INR") {
        return true; 
      } else {
        return false; 
      }
    } catch (error) {
      console.error("Error verifying payment with Razorpay API:", error);
      return false; 
    }
  };
exports.history =async(req,res)=>{
    try {
        const userId = req.session.user;
       
        const user = await userData.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        const transactionHistory = user.wallet.transactions;
        res.json(transactionHistory);
    } catch (err) {
        console.error("Error fetching transaction history:", err);
        res.status(500).json({ error: "Server error" });
    }
}



exports.getaddress = async (req, res) => {
    try {
        const userId = req.session.user; 
        const addresses = await Address.find({ userId });
        res.render('address', { addresses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

//get  
exports.getpassword=(req,res)=>{
    res.render("password");
}

//post 

exports.editprofile = async (req, res) => {
  console.log("editprofile")
  try {
    const userId = req.params.userID;
console.log("userId is geting profile",userId);
    const { newName } = req.body;
    console.log("userId is geting profile",req.body);

    console.log("eee", newName);
    await userData.findByIdAndUpdate(userId, { name: newName });

    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error");
  }
};


exports.postaddress = async (req, res) => {
  try {
    const userId = req.session.user;

    const { address1, street, country, pincode, phone, additionalInfo } =
      req.body;

    const newAddress = new Address({
      userId: userId,
      address1,
      street,
      country,
      pincode,
      phone,
      additionalInfo,
    });

    await newAddress.save();

    res.json({ success: true, message: "Address added Successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};



exports.posteditaddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { address1, street, country, pincode, phone, additionalInfo } =
      req.body.updatedAddress;

    const address = await Address.findById(addressId);

    if (!address) {
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });
    }

    address.address1 = address1;
    address.street = street;
    address.country = country;
    address.pincode = pincode;
    address.phone = phone;
    address.additionalInfo = additionalInfo;

    const updatedAddress = await address.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Address updated successfully",
        data: updatedAddress,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




//delete

exports.deleteaddress = async (req,res)=>{
    const id = req.params.id;
    console.log("delete ad",id);
    try{
       const result = await Address.findByIdAndDelete(id);
       console.log ("Deleted");
       if(!result){
        return res.status(404).send("product not found");
       }
       res.redirect("/address")

    }
    catch(error){
        console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");  
    }
}

//passwords post 
exports.postPasswordChange = async (req, res) => {
  const { currentpassword, password, confirmPassword } = req.body;
  const userId = req.session.user;

  try {
    const user = await userData.findById(userId);

    if (!user) {
      return res.render("password", { errorMessage: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(
      currentpassword,
      user.password
    );

    if (!isPasswordMatch) {
      return res.render("password", {
        errorMessage: "Incorrect current password",
      });
    }

    if (password !== confirmPassword) {
      return res.render("password", {
        errorMessage: "New password and confirm password do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    return res.redirect("/profile");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Internal Server Error");
  }
};

//get order in profile 
exports.getorder = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(404).send("user not found");
    }

    const orders = await Order.find({ userId: userId });

    res.render("ordershow", { orders });
  } catch (error) {
    return res.status(500).send("Internal Server Error");
  }
};


// retry order


exports.retryOrder = async (req, res) => {
  try {
    const { orderId, productId, price, discountPrice } = req.body;

    const Razorpay = require("razorpay");
    const instance = new Razorpay({
      key_id: "YOUR_RAZORPAY_KEY_ID",
      key_secret: "YOUR_RAZORPAY_KEY_SECRET",
    });

    console.log("instance is getting ", instance);
    const options = {
      amount: discountPrice * 100,
      currency: "INR",
      receipt: "receipt_id",
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        res.status(500).json({ error: "Error creating order" });
        return;
      }

      res.json({ orderId: order.id });
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.updateOrderStatus = async (req, res) => {
  try {
    const userId = req.session.user;

    const { orderId, productId, status } = req.body;



    const updatedOrder = await Order.findOneAndUpdate(
      { _id: orderId, "products.productId": productId },
      { $set: { "products.$.status": status } },
      { new: true }
    );


    const order=await Order.findById(orderId);
  
      for(let product of order.products){

        let newProduct=await Product.findById(productId)
        newProduct.StockCount-=product.quantity;
        newProduct.save();
      }
    

    
    console.log("updatedOrder retry",updatedOrder)
    if (!updatedOrder) {
      return res
        .status(404)
        .json({ error: "Order not found or product not found in order" });
    }

    res.json({ updatedOrder, message: "Order status updated successfully" });
  } catch (error) {
    console.error("Error updating order status:", error); // Log the actual error message
    res.status(500).json({ error: "Error updating order status" });
  }
};

// pdf download invoice 
exports.downloadinvoice = async (req, res) => {
  try {
    const userId = req.session.user;

    const orderId = req.params.orderId;
    const productId = req.params.productId;

    const order = await Order.findOne({ _id: orderId, userId }).populate(
      "products.productId"
    );

    if (!order) {
      console.log("Order not found");
      return res.status(404).send("Order not found");
    }

    const doc = new PDFDocument();
    const invoiceFileName = `invoice_${order.orderNumber}.pdf`;
    const invoiceFilePath = path.join(__dirname, "invoices", invoiceFileName);

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add Company Information
    doc.fontSize(16).text("Company: Versatile", { align: "center" });
    doc.moveDown(1);

    // Add Billing Details Section
    doc.fontSize(16).text("INVOICE", { align: "center" });
    doc.moveDown(1);
    doc.fontSize(12).text("Customer Details", { align: "center" });
    doc.text(`Order ID: ${orderId}`);
    doc.moveDown(2);
    doc.text(
      `Address: ${order.address.address1}, ${order.address.street}, ${order.address.country}, ${order.address.pincode}`
    );
    doc.text(`Order Date: ${order.orderDate}`);
    doc.moveDown(2);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.moveDown(5);

    // Add Table Header
    const headerY = doc.y;
    doc.font("Helvetica-Bold");
    doc.text("Index", 70, headerY, { width: 40, lineGap: 10 });
    doc.text("Name", 120, headerY, { width: 150, lineGap: 10 });
    doc.text("Quantity", 420, headerY, { width: 50, lineGap: 10 });
    doc.text("Price", 500, headerY, { width: 80, lineGap: 10 });
    doc.font("Helvetica");

    // Table Rows
    const contentStartY = headerY + 40;
    let currentY = contentStartY;

    order.products.forEach((product, index) => {
      doc.text(`${index + 1}`, 70, currentY, { width: 40, lineGap: 15 });
      doc.text(`${product.productName}`, 120, currentY, {
        width: 150,
        lineGap: 10,
      });
      doc.text(`${product.quantity}`, 420, currentY, {
        width: 50,
        lineGap: 10,
      });
      doc.text(`${product.price}`, 500, currentY, { width: 80, lineGap: 10 });

      const lineHeight = Math.max(
        doc.heightOfString(product.productName, { width: 150 }),
        doc.heightOfString(product.quantity, { width: 50 }),
        doc.heightOfString(product.price, { width: 80 })
      );
      currentY += lineHeight + 20;
    });

    doc.font("Helvetica-Bold");
    doc.text("Total(after discount)", 70, currentY, {
      width: 150,
      lineGap: 15,
    });
    doc.font("Helvetica");
    doc.text("", 120, currentY, { width: 150, lineGap: 10 });
    doc.text("", 270, currentY, { width: 50, lineGap: 10 });
    doc.text("", 420, currentY, { width: 80, lineGap: 15 });
    doc.text(`${order.totalPrice.toFixed(2)}`, 500, currentY, {
      width: 80,
      lineGap: 10,
    });

    const thankYouY = currentY + 100;
    doc
      .fontSize(14)
      .text("thank you for choosing the versatile brand", 70, thankYouY, {
        width: 500,
        align: "center",
      });

    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Internal Server Error");
  }
};


//postcancel orders 

exports.postcancelorder = async (req, res) => {
  try {
    const { orderId, productId, reason } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      "products.productId": productId,
    });
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const product = order.products.find(
      (product) => String(product.productId) === productId
    );

    const mainProduct = await Product.findOne({
      productName: product.productName,
    });

    mainProduct.StockCount += 1;
    await mainProduct.save();

    if (!product) {
      return res.status(404).json({ error: "Product not found in the order" });
    }

    const productToUpdate = order.products.find(
      (product) => product.productId.toString() === productId
    );
    if (productToUpdate) {
      productToUpdate.status = "Cancelled";
      productToUpdate.reason = reason;
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Product not found in the order" });
    }

    const refundedAmount = Math.min(order.discountPrice);

    if (
      order.paymentMethod === "razorpay" ||
      order.paymentMethod === "Wallet"
    ) {
      const user = await userData.findOne({ _id: order.userId });

      user.wallet.balance += refundedAmount;

      user.wallet.transactions.push({
        amount: refundedAmount,
        description: `Cancellation refund for ${product.productName}`,
        type: "refund",
      });

      await user.save();
    }

    await order.save();

    res.json({
      success: true,
      message: "Product cancelled successfully",
      refundedAmount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




exports.returnOrder = async (req, res) => {
  try {
    const { orderId, productId, reason, adminApproval } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      "products.productId": productId,
    });

    if (adminApproval === "Approved") {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, "products._id": productId },
        {
          $set: {
            "products.$.status": "Returned",
            "products.$.reason": reason,
          },
        },
        { new: true }
      );

      if (!updatedOrder) {
        return res
          .status(404)
          .json({ success: false, message: "Order not found" });
      }

      const product = updatedOrder.products.find(
        (product) => product._id.toString() === productId
      );
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found in the order" });
      }

      const mainProduct = await Product.findOne({
        productName: product.productName,
      });
      if (!mainProduct) {
        return res
          .status(404)
          .json({ success: false, message: "Main product not found" });
      }

      mainProduct.StockCount += 1;
      await mainProduct.save();

      if (
        updatedOrder.paymentMethod === "razorpay" ||
        updatedOrder.paymentMethod === "Wallet"
      ) {
        const user = await userData.findOne({ _id: updatedOrder.userId });

        const refundedAmount = order.discountPrice;

        user.wallet.balance += refundedAmount;

        user.wallet.transactions.push({
          amount: refundedAmount,
          description: `Return refund for ${product.productName}`,
          type: "refund",
        });

        await user.save();
      }

      await updatedOrder.save();

      res
        .status(200)
        .json({
          success: true,
          message: "Order returned successfully",
          updatedOrder,
        });
    } else {
      
      res
        .status(400)
        .json({
          success: false,
          message: "Admin approval is required to return the order",
        });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




//get coupon code in the profile page 
exports.getcoupon = async (req, res) => {
  try {
    const couponData = await CouponCollection.find();

    res.render("couponprofile", { couponData });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};




const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codeLength = 8;
  let referralCode = '';

  for (let i = 0; i < codeLength; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      referralCode += characters.charAt(randomIndex);
  }

  return referralCode;
};

exports.createReferral=async(req,res)=>{
 
  try {
     
      const userId = req.session.user;
    
      const userDetails = await userData.findById({_id:userId});
     
      if (userDetails) {
          // If the user doesn't have a referral code, generate one and update the user document
          if (!userDetails.referralCode) {
              const referralCode = generateReferralCode();
              await userData.findByIdAndUpdate(userId, { referralCode }, { new: true });
              return { status: 'success', message: 'Referral code added successfully', referralCode };
          } else {
              // If the user already has a referral code, return it
              return { status: 'success', message: 'User already has a referral code', referralCode: userDetails.referralCode };
          }
      } else {
          return { status: 'error', message: 'User not found with the provided ID' };
      }
  } catch (error) {
      console.error('Error:', error);
      return { status: 'error', message: 'Internal Server Error'};
}

}