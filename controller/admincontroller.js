const express = require("express");
const router = express();
const bcrypt = require("bcrypt");
const mongoose = require("../config/dbConnect");
const Admin = require("../model/adminModel");
const userData = require("../model/userModel");
const fs = require("fs");
const CouponCollection = require("../model/couponModel");
const Cart = require("../model/cartmodel");
const Product = require("../model/addproductModel");
const Order = require("../model/orderModel");
const excel = require("exceljs");
const PDFDocument = require("pdfkit");
const User = require("../model/userModel");
const moment = require("moment");


//get

exports.getAdminLogin = (req, res) => {

  if(req.session.admin){
   return res.redirect('/admin/Insite')
  }else{
    
    res.render("adminlogin", { message: undefined });
  }
 
};



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

    if (!admin) {
      res.render("adminlogin", {
        message: "Wrong email or password. Please try again.",
      });
    } else {
      req.session.admin = admin;
      res.redirect("/admin/Insite");
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
};

//usermanage
//get
exports.userManage = async (req, res) => {
  try {
    userFind = await userData.find();

    res.render("userManage", { userFind });
  } catch (error) {
    console.log("Error While users find in adminctrl", error);
  }
};

//block User

exports.blockUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const user = await userData.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.isBlocked = !user.isBlocked;
    const updatedUser = await user.save();

    req.session.blockedUsers = req.session.blockedUsers || {};
    req.session.blockedUsers[userId] = updatedUser.isBlocked;

    res.status(200).json({ isBlocked: updatedUser.isBlocked });
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//

//coupon management
exports.getcoupon = async (req, res) => {
  try {
    const coupondata = await CouponCollection.find();

    res.render("coupon", { coupondata });
  } catch (error) {
    console.log("Error while rendering coupon page:", error);
    res.status(500).render("error", { message: "Internal server error" });
  }
};

//addcoupon
//get
exports.addcoupon = (req, res) => {
  res.render("addcoupon");
};

exports.postAddCoupon = async (req, res) => {
  try {
  

    const data = {
      couponCode: req.body.couponCode,
      discount: req.body.discount,
      expiryDate: req.body.expiryDate,
      minAmount: req.body.minAmount,
      maxAmount: req.body.maxAmount,
    };

    const existingCoupon = await CouponCollection.findOne({
      couponCode: { $regex: new RegExp('^' + data.couponCode + '$', 'i') },
    });    
    if (existingCoupon) {
      return res.render("addcoupon", { message: "Coupon already exists" });
    } else {
      const dataCreated = await CouponCollection.create(data);
    }
    res.redirect("/admin/couponmanageadmin");
  } catch (error) {
    res.status(500).render("error", { message: "Internal server error" });
  }
};

//getedit
exports.editcoupon = async (req, res) => {
  const id = req.params.id;

  try {
    const data = await CouponCollection.findById(id);

    res.render("editcoupon", { id, data });
  } catch (error) {
    res.status(500).render("error500");
  }
};

//postedit

exports.posteditcoupon = async (req, res) => {
  try {
    const couponID = req.params.id;
    const existingCoupon = await CouponCollection.findById(couponID);

    if (!existingCoupon) {
      return res.status(404).send("Coupon not found");
    }

    // Check if a coupon with the same code already exists 
    const duplicateCoupon = await CouponCollection.findOne({
      couponCode: { $regex: new RegExp('^' + req.body.couponCode + '$', 'i') },
      _id: { $ne: couponID }, // Exclude the current coupon being edited
    });

    if (duplicateCoupon) {
      return res.render("editcoupon", {
        id: couponID,
        message: "Coupon code already exists",
        data: existingCoupon,
      }); 
    }

    existingCoupon.couponCode = req.body.couponCode;
    existingCoupon.discount = req.body.discount;
    existingCoupon.expiryDate = req.body.expiryDate;
    existingCoupon.minAmount = req.body.minAmount;
    existingCoupon.maxAmount = req.body.maxAmount;

    const updatedCoupon = await existingCoupon.save();
    res.redirect("/admin/couponmanageadmin");
  } catch (error) {
    console.error("Error editing coupon:", error);
    res.status(500).render("error500", { message: "Internal server error" });
  }
};

//delete coupon

exports.deletecoupon = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await CouponCollection.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send("coupon not found");
    }

    res.redirect("/admin/couponmanageadmin");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

//get sales report
exports.salesReport = async (req, res) => {
  try {
    let startDate;
    let orders;
    let filterOption = req.query.filterOption;
    

    if (filterOption === "daily") {
      startDate = new Date();
      orders = await Order.find({
        orderDate: { $gte: startDate },
      });
    } else if (filterOption === "weekly") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      orders = await Order.find({
        orderDate: { $gte: startDate },
      });
    } else if (filterOption === "monthly") {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      orders = await Order.find({
        orderDate: { $gte: startDate },
      });
    } else {
      orders = await Order.find();
    }

  

    for (const order of orders) {
      const user = await User.findById(order.userId);
      order.user = user;
    }

    const salesCount = orders.length;

    const orderCount = orders.reduce(
      (total, order) => total + (order.totalPrice || 0),
      0
    );

    const discountCount = orders.filter(
      (order) => order.discountPrice > 0
    ).length;

    // Render the sales report template with data
    res.render("salesreport", {
      salesCount,
      orderCount,
      discountCount,
      orders,
    });
  } catch (error) {
    console.error("Error fetching sales report:", error);
    res.status(500).send("Internal server error");
  }
};

exports.downloadPDF = async (req, res) => {
  try {
    const orders = await Order.find().populate("userId");
    for (const order of orders) {
      const user = await User.findById(order.userId);
      order.user = user;
    }

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream("sales_report.pdf");
    doc.pipe(writeStream);

    doc.fontSize(16).text("Sales Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleString()}`);
    doc.moveDown();

    const tableHeaders = [
      "Order Number",
      "Username",
      "Address",
      "Total Quantity",
      "Total Price",
      "Discount Price",
      "Payment Method",
    ];

    let currentY = doc.y + 10;
    let startX = 30;

    const columnWidth = 82;
    const columnSpacing = 0;
    const cellHeight = 55;

    doc.font("Helvetica-Bold").fontSize(12);
    tableHeaders.forEach((header, index) => {
      doc.rect(startX, currentY, columnWidth, cellHeight).stroke();
      doc.text(header, startX + 5, currentY + 5, {
        width: columnWidth - 10,
        align: "center",
      });
      startX += columnWidth + columnSpacing;
    });
    currentY += cellHeight;
    doc.font("Helvetica").fontSize(10);
    orders.forEach((order, index) => {
      startX = 30;
      const rowData = [
        order.orderNumber || "",
        order.user ? order.user.name : "User not found",
        order.address
          ? `${order.address.address1 || ""}, ${order.address.country || ""}, ${
              order.address.pincode || ""
            }`
          : "",
        order.totalQuantity || "",
        order.totalPrice || "",
        order.discountPrice ? order.discountPrice : "No Offer",
        order.paymentMethod || "",
      ];

      rowData.forEach((data, dataIndex) => {
        doc.rect(startX, currentY, columnWidth, cellHeight).stroke(); // Add border for each cell
        doc.text(data.toString(), startX + 5, currentY + 10, {
          width: columnWidth - 10,
          align: "left",
        });
        startX += columnWidth + columnSpacing;
      });

      currentY += cellHeight;
    });
    doc.moveDown();
    doc.end();

    writeStream.on("finish", () => {
      res.download("sales_report.pdf", "sales_report.pdf", (err) => {
        if (err) {
          console.error("Error downloading PDF:", err);
          res.status(500).send("Internal server error");
        } else {
          fs.unlink("sales_report.pdf", (unlinkErr) => {
            if (unlinkErr) {
              console.error("Error deleting PDF file:", unlinkErr);
            } else {
              console.log("PDF file deleted successfully");
            }
          });
        }
      });
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).send("Internal server error");
  }
};

exports.downloadExcel = async (req, res) => {
  try {
    const orders = await Order.find();

    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Order Number", key: "orderNumber", width: 15 },
      { header: "Username", key: "username", width: 20 },
      { header: "Address", key: "address", width: 40 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Price", key: "price", width: 15 },
      { header: "Discounted", key: "discounted", width: 15 },
      { header: "Coupon", key: "coupon", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 20 },
      { header: "Order Date", key: "orderDate", width: 20 },
    ];

    orders.forEach((order, index) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        username: order.user ? order.user.name : "User not found",
        address: `${order.address.address1}, ${order.address.street}, ${order.address.country}, ${order.address.pincode}`,
        quantity: order.totalQuantity,
        price: order.totalPrice,
        discounted: order.discountPrice,
        coupon: order.coupon,
        paymentMethod: order.paymentMethod,
        orderDate: new Date(order.orderDate).toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
        }),
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="sales_report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel file:", error);
    res.status(500).send("Internal server error");
  }
};

//dashboard

exports.getInsite = async (req, res) => {
  try {
    const orders = await Order.find();

    for (const order of orders) {
      const user = await User.findById(order.userId);
      order.user = user;
    }

    orders.forEach((order) => {});

    const salesCount = orders.length;
    const orderCount = orders.reduce(
      (total, order) => total + (order.totalPrice || 0),
      0
    );
    const discountCount = orders.filter(
      (order) => order.discountPrice > 0
    ).length;

    const yearlyCounts = calculateOrderCounts(orders, "year");
    const monthlyCounts = calculateOrderCounts(orders, "month");
    const weeklyCounts = calculateOrderCounts(orders, "week");

    const productCategories = await Product.distinct("productCategory");

    const productSalesMap = new Map();

    orders.forEach((order) => {
      order.products.forEach((product) => {
        if (product && product.productId && product.productId.toString) {
          const productIdString = product.productId.toString();
          if (productSalesMap.has(productIdString)) {
            productSalesMap.set(
              productIdString,
              productSalesMap.get(productIdString) + product.quantity
            );
          } else {
            productSalesMap.set(productIdString, product.quantity);
          }
        } else {
          console.error("Encountered undefined product or productId:", product);
        }
      });
    });

    const sortedProducts = [...productSalesMap.entries()].sort(
      (a, b) => b[1] - a[1]
    );
    const topProducts = sortedProducts.slice(0, 10);

    const groupedProducts = topProducts.reduce(
      (acc, [productId, salesCount]) => {
        if (!productId) {
          console.error("Undefined productId encountered:", productId);
          return acc;
        }

        if (!acc[productId]) {
          acc[productId] = { productId, salesCount, totalPrice: 0 };
        } else {
          acc[productId].salesCount += salesCount;
        }
        return acc;
      },
      {}
    );

    const groupedTopProductDetails = await Promise.all(
      Object.values(groupedProducts).map(async ({ productId, salesCount }) => {
        const order = await Order.findOne(
          { "products.productId": productId },
          { "products.$": 1 }
        );
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

    const dailyCounts = calculateOrderCounts(orders, "day");
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
    console.error("admin dashboard error:", error);
    res.status(500).send("Internal server error");
  }
};

function calculatePaymentMethodCounts(orders) {
  const paymentMethodCounts = {
    Wallet: 0,
    CashOnDelivery: 0,
    Razorpay: 0,
    CreditCard: 0,
  };

  orders.forEach((order) => {
    switch (order.paymentMethod) {
      case "Wallet":
        paymentMethodCounts.Wallet++;
        break;
      case "CashOnDelivery":
        paymentMethodCounts.CashOnDelivery++;
        break;
      case "razorpay":
        paymentMethodCounts.Razorpay++;
        break;
      case "creditCard":
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

function groupOrdersByInterval(orders, interval) {
  return orders.reduce((acc, order) => {
    const key = moment(order.orderDate).startOf(interval).format("YYYY-MM-DD");
    acc[key] = acc[key] || [];
    acc[key].push(order);
    return acc;
  }, {});
}



exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Could not log out. Please try again.');
    }
    res.redirect('/admin/adminLogin');
    console.log("admin loggedout")
  });
};
