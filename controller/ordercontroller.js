const express = require("express");
const router = express();
const mongoose = require("../config/dbConnect");
const address = require("../model/addressModel");
const collection = require("../model/userModel");
const Cart = require("../model/cartmodel");
const Product = require("../model/addproductModel");
const Order = require("../model/orderModel");
const User = require("../model/userModel");

//get

exports.getorderdetails = async (req, res) => {
  try {
    const orders = await Order.find().lean();

    for (const order of orders) {
      const user = await User.findById(order.userId).lean();
      order.user = user;
    }

    res.render("ordermanage", { orders });
  } catch (error) {
    console.error(error);
    res.status(500).send("internal server error");
  }
};


exports.details = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    const orders = await Order.findById(orderId);
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.detailspage = async (req, res) => {
  res.render("details");
};

//post admin order details

exports.adminapproval = async (req, res) => {
  const { orderId, adminApproval } = req.body;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { adminApproval },
      { new: true }
    );

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (updatedOrder.paymentMethod === "razorpay") {
      const user = await User.findOne({ _id: updatedOrder.userId });

      const refundedAmount = updatedOrder.discountPrice;

      user.wallet.balance += refundedAmount;
      user.wallet.transactions.push({
        amount: refundedAmount,
        description: `Return refunded`,
        type: "refund",
      });

      await user.save();
    }

    if (adminApproval === "Approved") {
      updatedOrder.products.forEach((product) => {
        product.status = "Returned";
      });
    }

    await updatedOrder.save();

    res.status(200).json({
      success: true,
      message: "Admin approval status updated successfully",
      order: updatedOrder,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId, productId, newStatus } = req.body;

    const updatedOrder = await Order.findOneAndUpdate(
      {
        _id: orderId,
        "products.productId": productId,
      },
      {
        $set: {
          "products.$.status": newStatus,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found or product not updated",
      });
    }

    // Send the updated order details back to the client
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
