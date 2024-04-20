const express= require("express");
const router= express();
const bcrypt= require("bcrypt");
const mongoose= require("../config/dbConnect");
const Admin=require("../model/adminModel");
const userData=require("../model/userModel");
const fs = require('fs');
const CouponCollection = require('../model/couponModel');
const Cart = require("../model/cartmodel");
const Product  = require("../model/addproductModel");
const Order=require("../model/orderModel");
const excel = require('exceljs');
const PDFDocument = require('pdfkit');
const User = require("../model/userModel")

const moment = require('moment');


//get
exports.getAdminLogin=(req,res)=>{
    
    res.render("adminlogin",{ message: undefined })
}




//post


exports.AdminPostLogin = async (req, res) => {
    try {
        const data = {
            email: req.body.email,
            password: req.body.password,
        };

        

        const admin = await Admin.findOne({
            email: data.email,
            password: data.password,
        });

        console.log("Admin:", admin);

        if (!admin) {
            res.render("adminlogin", { message: "Wrong email or password. Please try again." });
            console.log("Admin login failed");
        } else {
              req.session.admin=admin;
            res.redirect("/Insite");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal server error");
    }
};


//usermanage
//get
exports.userManage = async (req,res)=>{
    try{
       userFind = await userData.find();
       console.log(userFind);
       res.render("userManage",{ userFind});

    }
    catch(error){

        console.log("Error While users find in adminctrl", error)
    }
};

//block User

exports.blockUser = async (req,res) =>{
    try {
        const userId = req.params.userId;
        const user = await userData.findById(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
    
        // Toggle the isBlocked status
        user.isBlocked = !user.isBlocked;
        const updatedUser = await user.save();
    
        // Update session with the new blocked status
        req.session.blockedUsers = req.session.blockedUsers || {};
        req.session.blockedUsers[userId] = updatedUser.isBlocked;
    
        console.log('Updated user:', updatedUser);
    
        // Respond with updated user data
        res.status(200).json({ isBlocked: updatedUser.isBlocked });
      } catch (error) {
        console.error('Error blocking/unblocking user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}


// 




//coupon management 
exports.getcoupon = async (req, res) => {
    try {
        const coupondata = await CouponCollection.find();
        console.log("coupon data is found");
        res.render("coupon", { coupondata });
    } catch (error) {
        console.log("Error while rendering coupon page:", error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};
 






//addcoupon
//get
exports.addcoupon=(req,res)=>{
res.render("addcoupon")

}


exports.postAddCoupon = async (req, res) => {
    try {
        console.log("postcoupon");
        console.log("Request body:", req.body);

        const data = {
            couponCode: req.body.couponCode,
            discount: req.body.discount,
            expiryDate: req.body.expiryDate,
            minAmount: req.body.minAmount,
            maxAmount: req.body.maxAmount,
        };

        console.log("postcoupon data:", data);

        // Check if a coupon with the same code already exists
        const existingCoupon = await CouponCollection.findOne({
            couponCode: data.couponCode,
         
        });

        console.log("Existing coupon:", existingCoupon);

        if (existingCoupon) {
            console.log("Coupon already exists");
            return res.render("addcoupon", { message: "Coupon already exists" });
        } else {
            console.log("Creating new coupon");
            const dataCreated = await CouponCollection.create(data);
            console.log("New coupon created:", dataCreated);
        }

        res.redirect("/couponmanageadmin");
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).render('error', { message: 'Internal server error' });
    }
};


//getedit
exports.editcoupon=async(req,res)=>{

const id =req.params.id;
console.log("id is getting in the editcoupon",id);
try{
const data = await CouponCollection.findById(id)
console.log("data is getting in the data",data);

res.render("editcoupon",{id,data});

}
catch(error){
    console.log("Error While getEdit editcoupon");
    res.status(500).render('error500'); 
}
};


//postedit

exports.posteditcoupon = async (req, res) => {
    console.log("POST EDIT COUPON IS WORKING ");
    try {
        const couponID = req.params.id;
        console.log("Coupon ID being edited:", couponID);
        console.log("Request body:", req.body);

        // Fetch the existing coupon by ID
        const existingCoupon = await CouponCollection.findById(couponID);
        console.log("Existing coupon:", existingCoupon);

        if (!existingCoupon) {
            console.log("Coupon not found");
            return res.status(404).send("Coupon not found");
        }

        // Check if a coupon with the same code already exists and it's not the same coupon being edited
        const duplicateCoupon = await CouponCollection.findOne({
            couponCode: req.body.couponCode,
            _id: { $ne: couponID } // Exclude the current coupon being edited
        });

        if (duplicateCoupon) {
            console.log("Duplicate coupon code found");
            return res.render("editcoupon", { id: couponID, message: "Coupon code already exists", data: existingCoupon }); // Pass existingCoupon as data
        }

        // Update the coupon data
        existingCoupon.couponCode = req.body.couponCode;
        existingCoupon.discount = req.body.discount;
        existingCoupon.expiryDate = req.body.expiryDate;
        existingCoupon.minAmount = req.body.minAmount;
        existingCoupon.maxAmount = req.body.maxAmount;

        // Save the updated coupon data
        const updatedCoupon = await existingCoupon.save();
        console.log("Updated coupon:", updatedCoupon);

        res.redirect("/couponmanageadmin");
    } catch (error) {
        console.error("Error editing coupon:", error);
        res.status(500).render("error500", { message: "Internal server error" });
    }
};


//delete coupon

exports.deletecoupon=async(req,res)=>{
console.log("delete coupon router working");


try{
    const id = req.params.id;

    const result = await CouponCollection.findByIdAndDelete(id);

    if(!result){
        return res.status(404).send("coupon not found");

       }

       res.redirect("/couponmanageadmin")
}
catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).send("Internal Server Error");
  }

}



//get sales report
exports.salesReport = async (req, res) => {
    console.log("Sales report requested from admin side");

    try {
        let startDate;
        let orders;
        let filterOption = req.query.filterOption; // Get filter option from query parameter
        console.log("Filter Option:", filterOption);

        if (filterOption === 'daily') {
            startDate = new Date(); // Today's date
            orders = await Order.find({
                orderDate: { $gte: startDate }
            });
        } else if (filterOption === 'weekly') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7); // Go back 7 days
            orders = await Order.find({
                orderDate: { $gte: startDate }
            });
        } else if (filterOption === 'monthly') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // Go back 1 month
            orders = await Order.find({
                orderDate: { $gte: startDate }
            });
        } else {
            // Fetch all orders if no filters are provided
            orders = await Order.find();
        }

        console.log("Filtered orders by duration:", orders);

        // Fetch user data based on userId for each order
      for (const order of orders) {
    const user = await User.findById(order.userId);
    order.user = user; // Attach user data to each order object
}

        const salesCount = orders.length;
        console.log("Sales count:", salesCount);

        const orderCount = orders.reduce((total, order) => total + (order.totalPrice || 0), 0);
        console.log("Order count:", orderCount);

        const discountCount = orders.filter(order => order.discountPrice > 0).length;
        console.log("Discount count:", discountCount);

        // Render the sales report template with data
        res.render("salesreport", {
            salesCount,
            orderCount,
            discountCount,
            orders
        });
    } catch (error) {
        console.error("Error fetching sales report:", error);
        res.status(500).send("Internal server error");
    }
};

exports.downloadPDF = async (req, res) => {
    console.log("pdf download is working")
    try {
        const orders = await Order.find(); 
console.log("orders is getting in the orders",orders)
        // Create a new PDF document
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream('sales_report.pdf')); 

        // Write content to the PDF
        doc.fontSize(16).text('Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
        doc.moveDown();

        // Loop through orders and add details to the PDF
        orders.forEach((order, index) => {
            doc.fontSize(12).text(`Order Number: ${order.orderNumber}`);
            doc.fontSize(10).text(`Username: ${order.user ? order.user.name : 'User not found'}`);
            doc.fontSize(10).text(`Address: ${order.address.address1}, ${order.address.street}, ${order.address.country}, ${order.address.pincode}`);
            doc.fontSize(10).text(`Total Quantity: ${order.totalQuantity}`);
            doc.fontSize(10).text(`Total Price: ${order.totalPrice}`);
            doc.fontSize(10).text(`Discount Price: ${order.discountPrice}`);
            doc.fontSize(10).text(`Payment Method: ${order.paymentMethod}`);
            doc.moveDown();
        });

        doc.end(); // End PDF document

        setTimeout(() => {
            res.download('sales_report.pdf', 'sales_report.pdf', (err) => {
                if (err) {
                    console.error('Error downloading PDF:', err);
                    res.status(500).send('Internal server error');
                } else {
                    console.log('PDF file downloaded successfully');
                    // Delete the generated PDF file after download
                    fs.unlink('sales_report.pdf', (unlinkErr) => {
                        if (unlinkErr) {
                            console.error('Error deleting PDF file:', unlinkErr);
                        } else {
                            console.log('PDF file deleted successfully');
                        }
                    });
                }
            });
        }, 1000); // Delay 
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Internal server error');
    }
};


exports.downloadExcel = async (req, res) => {
    console.log("download Excel is woking")
    try {
        // Fetch orders data from the database
        const orders = await Order.find();
        console.log("orders is getting",orders);

        // Create a new workbook and worksheet
        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define worksheet columns
        worksheet.columns = [
            { header: 'Order Number', key: 'orderNumber', width: 15 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Address', key: 'address', width: 40 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Price', key: 'price', width: 15 },
            { header: 'Discounted', key: 'discounted', width: 15 },
            { header: 'Coupon', key: 'coupon', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 },
            { header: 'Order Date', key: 'orderDate', width: 20 },
        ];

        // Add data to the worksheet
        orders.forEach((order, index) => {
            worksheet.addRow({
                orderNumber: order.orderNumber,
                username: order.user ? order.user.name : 'User not found',
                address: `${order.address.address1}, ${order.address.street}, ${order.address.country}, ${order.address.pincode}`,
                quantity: order.totalQuantity,
                price: order.totalPrice,
                discounted: order.discountPrice,
                coupon: order.coupon,
                paymentMethod: order.paymentMethod,
                orderDate: new Date(order.orderDate).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
            });
        });

        // Set response headers for download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

        // Generate Excel file and send as download
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating Excel file:', error);
        res.status(500).send('Internal server error');
    }
};







//dashboard

exports.getInsite = async (req, res) => {
    try {
        const orders = await Order.find();
        console.log("orders is getting in the insite", orders);

        for (const order of orders) {
            const user = await User.findById(order.userId);
            order.user = user;
        }

        orders.forEach(order => {
            console.log("Order:", order);
        });

        const salesCount = orders.length;
        const orderCount = orders.reduce((total, order) => total + (order.totalPrice || 0), 0);
        const discountCount = orders.filter(order => order.discountPrice > 0).length;

        const yearlyCounts = calculateOrderCounts(orders, 'year');
        const monthlyCounts = calculateOrderCounts(orders, 'month');
        const weeklyCounts = calculateOrderCounts(orders, 'week');


        const productCategories = await Product.distinct('productCategory');

        const productSalesMap = new Map();

        orders.forEach(order => {
            order.products.forEach(product => {
                // Check if product and productId are defined
                if (product && product.productId && product.productId.toString) {
                    const productIdString = product.productId.toString();
                    if (productSalesMap.has(productIdString)) {
                        productSalesMap.set(productIdString, productSalesMap.get(productIdString) + product.quantity);
                    } else {
                        productSalesMap.set(productIdString, product.quantity);
                    }
                } else {
                    console.error('Encountered undefined product or productId:', product);
                }
            });
        });
        
        const sortedProducts = [...productSalesMap.entries()].sort((a, b) => b[1] - a[1]);
        const topProducts = sortedProducts.slice(0, 10);
        
        const groupedProducts = topProducts.reduce((acc, [productId, salesCount]) => {
            if (!productId) {
                console.error('Undefined productId encountered:', productId);
                return acc;
            }
        
            if (!acc[productId]) {
                acc[productId] = { productId, salesCount, totalPrice: 0 };
            } else {
                acc[productId].salesCount += salesCount;
            }
            return acc;
        }, {});
                                                                                         

        const groupedTopProductDetails = await Promise.all(
            Object.values(groupedProducts).map(async ({ productId, salesCount }) => {
                const order = await Order.findOne({ 'products.productId': productId }, { 'products.$': 1 });
                if (!order) {
                    throw new Error(`Product with ID ${productId} not found in orders.`);
                }

                const product = order.products[0];
                const totalPrice = salesCount * product.price;
                groupedProducts[productId].totalPrice = totalPrice;

                return { product, salesCount, totalPrice };
            })
        );

        console.log(groupedTopProductDetails);

        const dailyCounts = calculateOrderCounts(orders, 'day');
        const paymentMethodCounts = calculatePaymentMethodCounts(orders);
        res.render("adminInsite", {
            yearlyCounts,
            monthlyCounts,
            weeklyCounts,
            salesCount,
            orderCount,
            discountCount,
            dailyCounts,
            paymentMethodCounts,
            orders,
            productCategories,
            topProducts: groupedTopProductDetails,
            groupedTopProductDetails,
        });
    } catch (error) {
        console.error('admin dashboard error:', error);
        res.status(500).send('Internal server error');
    }
};


// Helper function to calculate payment method counts
function calculatePaymentMethodCounts(orders) {
    const paymentMethodCounts = {
        Wallet: 0,
        CashOnDelivery: 0,
        Razorpay: 0,
        CreditCard: 0
    };

    orders.forEach(order => {
        switch (order.paymentMethod) {
            case 'Wallet':
                paymentMethodCounts.Wallet++;
                break;
            case 'CashOnDelivery':
                paymentMethodCounts.CashOnDelivery++;
                break;
            case 'razorpay':
                paymentMethodCounts.Razorpay++;
                break;
            case 'creditCard':
                paymentMethodCounts.CreditCard++;
                break;
            default:
                break;
        }
    });

    return paymentMethodCounts;
}

function calculateOrderCounts(orders, interval) {
    const counts = {};
    const groupedOrders = groupOrdersByInterval(orders, interval);

    for (const key in groupedOrders) {
        counts[key] = groupedOrders[key].length;
    }

    return counts;
}

// Helper function to group orders by a specific time interval
function groupOrdersByInterval(orders, interval) {
    return orders.reduce((acc, order) => {
        const key = moment(order.orderDate).startOf(interval).format('YYYY-MM-DD');
        acc[key] = acc[key] || [];
        acc[key].push(order);
        return acc;
    }, {});
}