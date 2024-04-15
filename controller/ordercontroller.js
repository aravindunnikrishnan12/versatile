const express = require("express");
const router = express();
const mongoose = require("../config/dbConnect");
const address = require("../model/addressModel");
const collection = require("../model/userModel");
const Cart = require("../model/cartmodel");
const Product  = require("../model/addproductModel");
const Order=require("../model/orderModel");
const User = require("../model/userModel")

//get


exports.getorderdetails =async(req,res)=>{
    console.log("order finded admin side")

try{
    
    
    
    const orders = await Order.find();
    console.log("order details is getting in the admin side",orders);
     
  // Fetch user data based on userId for each order
  for (const order of orders) {
    const user = await User.findById(order.userId);
    order.user = user; // Attach user data to each order object
}


   
    res.render("ordermanage", { orders });

    
}
catch(error){
    console.error(error);
    res.status(500).send("internal server error")
}
    
    
}


exports.details = async(req, res) => {
    console.log("details page is working ");
   
        try{
            const orderId = req.params.orderId;

            const orders = await Order.findById(orderId)
console.log("order details in the button ",orders)
          
        }
        catch(error) {
            console.error('Error fetching order details:', error);
            res.status(500).json({ error: 'Internal server error' });
        };
}


exports.detailspage=async(req,res)=>{

   
    res.render("details")
}

//post admin order details 


exports.updateOrderStatus = async (req, res) => {

    console.log("updateOrderStatus  is getting in the admin line 42");
    try {
        const { orderId, productId, newStatus } = req.body; 

        console.log("reqbody  is getting in the admin line 42",req.body);
        const updatedOrder = await Order.findOneAndUpdate(
            { 
                _id: orderId, 
                "products.productId": productId 
            },
            { 
                $set: { 
                    "products.$.status": newStatus 
                } 
            },
            { 
                new: true 
            }
        );
        
        console.log("Updated Order:", updatedOrder);

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: "Order not found or product not updated" });
        }

        // Send the updated order details back to the client
        res.status(200).json({ success: true, order: updatedOrder });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};
