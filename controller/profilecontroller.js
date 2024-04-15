const express=require("express");
const router=express();
const mongoose=require("../config/dbConnect");
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






exports.getprofile = async (req,res)=>{
   try{
    const userId=req.session.user;
     const userDatas =await userData.findById({_id:userId}); 
     console.log("user is is",userDatas);
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
        console.log("req body is getting ", req.body);

        console.log("create payment is working ");

        // Create a Razorpay order
        const options = {
            amount: amount, // Already in paise format (if multiplied by 100 in client-side)
            currency: "INR",
            receipt: "receipt_order_" + Math.floor(Math.random() * 1000),
            payment_capture: 1,
        };

        console.log("Options:", options);

        const order = await instance.orders.create(options); // Use instance here
        console.log("Order:", order);
        res.json(order);
    } catch (error) {
        console.error("Error generating Razorpay order:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.walletAddAmount = async (req, res) => { 
    console.log("wallet add amount is working ");
    const paymentId = req.body.paymentId;
    const amount = parseFloat(req.body.amount);
    console.log("amount add is working ", amount);
    console.log("wallet add amount is working ", paymentId);
    
    // Verify the payment with Razorpay API
    try {
        const payment = await instance.payments.fetch(paymentId); // Use instance here
        console.log("payment");
        console.log(payment);
        // Check if the payment amount and currency match the expected values
        if (payment.amount === amount && payment.currency === "INR") {
            const userId = req.session.user; // Assuming you have user authentication middleware setting req.session.user

            try {
                const user = await userData.findOne({ _id: userId });
                console.log("user is getting", user);
                if (user) {
                    // If user exists, update the wallet balance and add a new deposit transaction
                    const updatedBalance = user.wallet.balance + amount;

                    user.wallet.transactions.push({
                        type: "deposit",
                        amount: amount,
                        description: "Added balance via Razorpay",
                    });

                    user.wallet.balance = updatedBalance;

                    await user.save();
                    res.json({ success: true });
                } else {
                    res.json({ success: false, error: "User not found" });
                }
            } catch (error) {
                console.error("Error updating wallet balance:", error);
                res.json({ success: false, error: "Error updating wallet balance" });
            }
        } else {
            res.json({ success: false, error: "Invalid payment amount or currency" });
        }
    } catch (error) {
        console.error("Error verifying Razorpay payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.history =async(req,res)=>{
    console.log("hitory router is working ")
    try {
        const userId = req.session.user;
        console.log("user id is getting in the history",userId)
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
      
    try{
        const userId = req.params.userID;
        console.log("re name ",userId);
        const { newName } = req.body;
        
        console.log("eee",newName);
            await userData.findByIdAndUpdate(userId, { name: newName });

        res.redirect('/profile');

    }
    catch(error){
        console.error(error);
        res.status(500).send("Internal server error");
    }

}


exports.postaddress = async(req,res)=>{
   
   try {

    const userId = req.session.user;
  
    const {
       address1,
       street,
       country,
       pincode,
       phone,
       additionalInfo,
    } = req.body;
  
    
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

      res.json({ success: true, message: 'Address added Successfully' });
      


   } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
   }
  
}









exports.posteditaddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const { address1, street, country, pincode, phone, additionalInfo } = req.body.updatedAddress;

        // Find the address by ID
        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ success: false, message: 'Address not found' });
        }

        // Update address fields
        address.address1 = address1;
        address.street = street;
        address.country = country;
        address.pincode = pincode;
        address.phone = phone;
        address.additionalInfo = additionalInfo;

        // Save the updated address
        const updatedAddress = await address.save();

        // Respond with the updated address
        res.status(200).json({ success: true, message: 'Address updated successfully', data: updatedAddress });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
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
                return res.render('password', { errorMessage: 'User not found' });
            }
    
            const isPasswordMatch = await bcrypt.compare(currentpassword, user.password);
    
            if (!isPasswordMatch) {
                return res.render('password', { errorMessage: 'Incorrect current password' });
            }
    
            if (password !== confirmPassword) {
                return res.render('password', { errorMessage: 'New password and confirm password do not match' });
            }
    
            // Add password complexity validation here if needed
    
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
            await user.save();
    
            return res.redirect('/profile');
    
        } catch (error) {
            console.error(error);
            return res.status(500).send('Internal Server Error');
        }
    };




//get order in profile 

exports.getorder=async(req,res)=>{
    try{
        const userId = req.session.user;

        if(!userId){
            return res.status(404).send("user not found");
           }

        const orders = await Order.find({userId:userId});
        console.log("order is getting in the getorder in line 232",orders);

        res.render("ordershow",{orders})

    }

   catch(error) {
        
        console.error(error);
        return res.status(500).send('Internal Server Error');
    }

}


// retry order


exports.retryOrder = async (req, res) => {
    try {
        const { orderId, productId, price } = req.body;
        console.log("Received retry order request:", { orderId, productId, price });

        // Ensure that your Razorpay API key and secret are correctly set here
        const Razorpay = require('razorpay');
        const instance = new Razorpay({
            key_id: 'YOUR_RAZORPAY_KEY_ID',
            key_secret: 'YOUR_RAZORPAY_KEY_SECRET',
        });

        console.log("instance is getting ",instance)
        const options = {
            amount: price * 100, // Convert price to the smallest currency unit (e.g., paise for INR)
            currency: 'INR',
            receipt: 'receipt_id', // You can generate a unique receipt ID here
        };
console.log("options is alsomos getting ",options)
        // Creating the order
        instance.orders.create(options, function (err, order) {
            if (err) {
                console.error("Error creating order:", err);
                res.status(500).json({ error: "Error creating order" });
                return;
            }

            console.log("Order created successfully:", order);

            // Send the Razorpay order ID back to the client
            res.json({ orderId: order.id });
        });
    } catch (error) {
        console.error("Retry order error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


exports.updateOrderStatus = async (req, res) => {
    console.log('Received update order status request:');
    try {
        const userId = req.session.user;
        console.log('Received status:', userId);

        const { orderId, productId, status } = req.body;

        console.log('Received update order status request for orderId:', orderId);
        console.log('Received update order status request for productId:', productId);
        console.log('Received status:', status);

        // Find the order by orderId and productId
        const updatedOrder = await Order.findOneAndUpdate(
            { _id: orderId, "products.productId": productId },
            { $set: { "products.$.status": status } },
            { new: true }
        );

        if (!updatedOrder) {
            console.log('Order not found or product not found in order.');
            return res.status(404).json({ error: 'Order not found or product not found in order' });
        }

        console.log('Order status updated successfully:', updatedOrder);
       
        // Send the updated order details along with the status update response
        res.json({ updatedOrder, message: 'Order status updated successfully' });
    } catch (error) {
        console.error('Error updating order status:', error); // Log the actual error message
        res.status(500).json({ error: 'Error updating order status' });
    }
};


// pdf download invoice 
exports.downloadinvoice = async (req, res) => {
    console.log("Download invoice is being called");
    try {
        const userId = req.session.user;
        console.log("User ID:", userId);

        const orderId = req.params.orderId;
        const productId = req.params.productId;

        console.log(`Order ID: ${orderId}`);
        console.log(`Product ID: ${productId}`);

        const order = await Order.findOne({ _id: orderId, userId }).populate('products.productId');

        console.log("Order:", order);

        if (!order) {
            console.log('Order not found');
            return res.status(404).send('Order not found');
        }

        const doc = new PDFDocument();
        const invoiceFileName = `invoice_${order.orderNumber}.pdf`;
        const invoiceFilePath = path.join(__dirname, 'invoices', invoiceFileName);

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
        doc.text(`Address: ${order.address.address1}, ${order.address.street}, ${order.address.country}, ${order.address.pincode}`);
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
        const contentStartY = headerY + 40; // Increased the spacing
        let currentY = contentStartY;

        order.products.forEach((product, index) => {
            doc.text(`${index + 1}`, 70, currentY, { width: 40, lineGap: 15 });
            doc.text(`${product.productName}`, 120, currentY, { width: 150, lineGap: 10 });
            doc.text(`${product.quantity}`, 420, currentY, { width: 50, lineGap: 10 });
            doc.text(`${product.price}`, 500, currentY, { width: 80, lineGap: 10 }); // Adjusted the position

            // Calculate the height of the current row and add some padding
            const lineHeight = Math.max(
                doc.heightOfString(product.productName, { width: 150 }),
                doc.heightOfString(product.quantity, { width: 50 }),
                doc.heightOfString(product.price, { width: 80 })
            );
            currentY += lineHeight + 20; // Increased the spacing
        });

        // Add Total Price within the table
        doc.font("Helvetica-Bold");
        doc.text("Total(after discount)", 70, currentY, { width: 150, lineGap: 15 });
        doc.font("Helvetica");
        doc.text("", 120, currentY, { width: 150, lineGap: 10 });
        doc.text("", 270, currentY, { width: 50, lineGap: 10 });
        doc.text("", 420, currentY, { width: 80, lineGap: 15 }); // Adjusted the position
        doc.text(`${order.totalPrice.toFixed(2)}`, 500, currentY, { width: 80, lineGap: 10 });

        // Add Thank You message
        const thankYouY = currentY + 100;
        doc.fontSize(14).text(
            "thank you for choosing the versatile brand",
            70,
            thankYouY,
            { width: 500, align: "center" }
        );

        // Finalize the PDF
        doc.end();

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal Server Error');
    }
};


//postcancel orders 

exports.postcancelorder = async (req, res) => {
    
    try {
        const {orderId, productId, reason } = req.body;orderId
        console.log("Product ID received from the postcancelorder", productId);
        console.log("Product ID received from the postcancelorder", orderId);

        const order = await Order.findOne({  _id: orderId, 'products.productId': productId });
        console.log("Order found in the orderCart", order);

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const product = order.products.find(product => String(product.productId) === productId);
        console.log("product in the cancel order", product);

        const mainProduct = await Product.findOne({ productName: product.productName });
        console.log("Main product is", mainProduct);

        // Increase the stock count of the main product
        mainProduct.StockCount += 1;
        await mainProduct.save();

        if (!product) {
            return res.status(404).json({ error: 'Product not found in the order' });
        }

        const productToUpdate = order.products.find(product => product.productId.toString() === productId);
        if (productToUpdate) {
            productToUpdate.status = "Cancelled";
            productToUpdate.reason = reason;
        } else {
            return res.status(404).json({ success: false, message: "Product not found in the order" });
        }

        // Calculate the refunded amount based on totalPrice or the original price
        const refundedAmount = Math.min(product.price, order.totalPrice);

        // Check if the payment method is Razorpay
        if (order.paymentMethod === 'razorpay'||order.paymentMethod === 'Wallet') {
            // Find the user associated with the order
            const user = await userData.findOne({ _id: order.userId });


            // Add the refunded amount to the user's wallet balance
            user.wallet.balance += refundedAmount;

            // Add a transaction record to the user's wallet
            user.wallet.transactions.push({
                amount: refundedAmount,
                description: `Cancellation refund for ${product.productName}`,
                type: 'refund',
            });

            // Save the updated user data
            await user.save();
        }

        // Save the updated order
        await order.save();

        res.json({ success: true, message: "Product cancelled successfully", refundedAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}



exports.returnOrder = async (req, res) => {
    try {
        const { orderId, productId, reason } = req.body;

      console.log("req body is getting in the return order in line 281",req.body)
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, "products._id": productId },
        { 
            $set: { 
                "products.$.status": "Returned",
                "products.$.reason": reason 
            } 
        },
        { new: true }
    );

        console.log("updatedOrders is getting in the return order in line 292",updatedOrder)
        // Handle updatedOrder and send response
        res.status(200).json({ success: true, message: "Order returned successfully", updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};





//get coupon code in the profile page 

exports.getcoupon=async(req,res)=>{
try{

    const couponData = await CouponCollection.find();
    console.log("coupon data is founded")

    res.render("couponprofile",{couponData})
}
catch(error){
    console.log("Error while rendering coupon page:", error);
    res.status(500).send("Internal server error");
}


}