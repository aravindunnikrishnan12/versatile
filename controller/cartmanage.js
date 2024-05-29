const express = require("express");
const router = express();
const mongoose = require("../config/dbConnect");
const address = require("../model/addressModel");
const collection = require("../model/userModel");
const Cart = require("../model/cartmodel");
const Product = require("../model/addproductModel");
const Order = require("../model/orderModel");
const Coupon = require("../model/couponModel");
const Swal = require("sweetalert2");
const Razorpay = require("razorpay");
const { validationResult } = require("express-validator");

//get
//checkout
exports.getcheckout = async (req, res) => {
  try {
    const userId = req.session.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.find({ userid: userId });

    if (!cart || cart.length === 0) {
      return res.redirect('/books')
    }

    const useraddress = await address.find({ userId });
    let totalPrice = 0;
    let discountedPrice = 0;

    for (const item of cart) {
      const product = await Product.findById(item.productid);

      if (!product) {
        continue;
      }

      let itemPrice = product.productPrice;
      let itemDiscountedPrice = itemPrice;

      if (product.productOffer) {
        const discountPercentage = product.productOffer;
        const discountAmount = (itemPrice * discountPercentage) / 100;
        itemDiscountedPrice = itemPrice - discountAmount;
      }

      let itemTotalPrice = item.quantity * itemPrice;
      totalPrice += itemTotalPrice;

      let itemTotalDiscountedPrice = item.quantity * itemDiscountedPrice;
      discountedPrice += itemTotalDiscountedPrice;
    }

    res.render("checkout", { cart, useraddress, totalPrice, discountedPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

//success
exports.getsuccess = (req, res) => {

  try{

   
      res.render("success");
  
   
  }catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
  
};

//get orderdetails

exports.getorderdetails = async (req, res) => {
  try {
    const timestamp = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    const userId = req.session.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const orders = await Order.find({ userId }).sort({ _id: -1 }).limit(1);

    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: "No orders found for the user" });
    }
    const orderDetails = orders.map((order) => ({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
      totalPrice: order.totalPrice,
      discountPrice: order.discountPrice,
      totalQuantity: order.totalQuantity,
      paymentMethod: order.paymentMethod,
      orderedDetails: order.products,
      address: order.address,
      userDetails: userId,
    }));

    res.render("orderdetail", { orderDetails });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};


exports.addtocart = async (req, res) => {
  try {
    const productId = req.params.id;

    const userId = req.session.user;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found");
    }
    if (product.StockCount === 0) {
      return res.status(400).send("Product is out of stock");
    }
    const cartData = {
      userid: userId,
      productid: productId,
      product: product.productName,
      price: product.productPrice,
      description: product.productDescription,
      quantity: 1,
      stock: product.StockCount,
      category: product.productCategory,
      image: product.productImages[0],
      totalPrice: product.productPrice,
      discountedprice: 0,
    };

    if (product.productOffer) {
      cartData.discountedprice =
        product.productPrice -
        (product.productPrice * product.productOffer) / 100;
      cartData.totalPrice = cartData.discountedprice;
    }

    const cartProduct = await Cart.findOne({
      productid: productId,
      userid: userId,
    });

    if (cartProduct) {
      const newQuantity = cartProduct.quantity + 1;
      cartData.totalPrice = cartData.totalPrice * newQuantity;
      await Cart.updateOne(
        { _id: cartProduct._id },
        { $set: { quantity: newQuantity, totalPrice: cartData.totalPrice } }
      );
    } else {
      await Cart.create(cartData);
    }

    res.redirect("/cartdisplay");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
exports.cartdisplay = async (req, res) => {
  try {
    const userId = req.session.user;
    
    // Fetch cart items for the user
    const cartItems = await Cart.find({ userid: userId });

    if (!cartItems.length) {
      return res.render('cart', { cart: [], totalPrice: 0, allItemsInStock: true, total: 0 });
    }

    // Extract all product IDs from the cart items
    const productIds = cartItems.map(item => item.productid);

    // Fetch all products in one query
    const products = await Product.find({ _id: { $in: productIds } });

    let totalPrice = 0;
    let allItemsInStock = true;

    // Create a product map for quick lookup
    const productMap = new Map();
    products.forEach(product => {
      productMap.set(product._id.toString(), product);
    });

    // Iterate through cart items to calculate total price and check stock
    for (const item of cartItems) {
      const product = productMap.get(item.productid.toString());

      if (!product) {
        continue;
      }

      let itemPrice = product.productPrice;
      if (product.productOffer) {
        const discountPercentage = product.productOffer;
        const discountAmount = (itemPrice * discountPercentage) / 100;
        itemPrice -= discountAmount;
        item.discountedprice = itemPrice; // Update the item with the discounted price
      } else {
        item.discountedprice = null; // No discount
      }
      item.stock = product.StockCount;
      if (itemPrice && product.StockCount >= item.quantity) {
        let itemTotalPrice = itemPrice * item.quantity;
        totalPrice += itemTotalPrice;
      } else {
        allItemsInStock = false;
      }
    }

    res.render('cart', { cart: cartItems, totalPrice, allItemsInStock, total: cartItems.length });
  } catch (error) {
    res.status(500).send('Internal Server Error');
  }
};

//quantity update
exports.updateQuantity = async (req, res) => {
  try {
    const itemId = req.params.itemId;
    const { quantity: newQuantity } = req.body;

    console.log("quantity",req.body)
    const userId = req.session.user;

    const cartItem = await Cart.findOne({ _id: itemId, userid: userId });

    if (!cartItem) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in the cart" });
    }

    const product = await Product.findById(cartItem.productid);

    if (newQuantity > product.StockCount) {
      return res.status(400).json({
        success: false,
        message: "Quantity exceeds available stock",
      });
    }

    cartItem.quantity = newQuantity;
    await cartItem.save();

    const cart = await Cart.find({ userid: userId });

    let totalPrice = 0;
    for (const item of cart) {
      const product = await Product.findById(item.productid);

      let itemPrice = product.productPrice;

      if (product.productOffer) {
        const discountPercentage = product.productOffer;
        const discountAmount = (itemPrice * discountPercentage) / 100;
        itemPrice -= discountAmount;
      }

      let itemTotalPrice = itemPrice * item.quantity;
      totalPrice += itemTotalPrice;
    }

    return res
      .status(200)
      .json({
        success: true,
        message: "Quantity updated successfully",
        totalPrice,
      });
  } catch (error) {
    console.error("Error updating quantity:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

//delete cart

exports.deletecart = async (req, res) => {
  const id = req.params.itemId;

  try {
    const result = await Cart.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send("cart not found");
    }

    res.redirect("/cartdisplay");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addAddres = async (req, res) => {
  try {
    const userId = req.session.user;

    const { address1, street, country, pincode, phone, additionalInfo } =
      req.body;

    const newAddress = new address({
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

// /////////////////////////////////////////////

// post checkout

exports.postCheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    const discountedPrice = req.params.Totalprice;
    const addressId = req.body.address;
    const couponCode = req.body.couponCode;
    const paymentMethod = req.body.paymentMethod;


   
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.find({ userid: userId });
    if (!addressId || addressId.trim() === "") {
      return res.status(400).json({ message: "Address ID is required" });
    }

    // Validate that addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
      return res.status(400).json({ message: "Invalid address ID" });
    }
    const useraddress = await address.findOne({ _id: addressId });

    if (!useraddress) {
      return res.status(400).json({ message: "Invalid address ID" });
    }

    let totalPrice = 0;
    for (const item of cart) {
      let itemTotalPrice = item.quantity * item.price;
      totalPrice += itemTotalPrice;
    }

    // Fetching user data
    const userData = await collection.findById(userId);
    if (!userData) {
      return res.status(400).json({ message: "User not found" });
    }
    
    if(userData.referredCode){
      const referredUser = await collection.findOne({ referralCode: userData.referredCode });
      if (referredUser && !referredUser.firstOrderCompleted) {
        // Add 100 rupees to the wallet of the referred user
referredUser.wallet.balance += 100;
referredUser.wallet.transactions.push({
  amount: 100,
  description: 'Your friend referred you with a code',
  type: 'deposit',
});
referredUser.firstOrderCompleted = true;
await referredUser.save();
       
 }
    }

    if (paymentMethod === "Wallet") {
      if (userData.wallet.balance < totalPrice) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      userData.wallet.balance -= totalPrice;
      userData.wallet.transactions.push({
        amount: totalPrice,
        type: "purchase",
        description: "purchased amount ",
      });
      await userData.save();
    }

    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId: userId,
      products: cart.map((item) => ({
        productId: item.productid,
        productName: item.product,
        productDescription: item.productDescription,
        productRating: item.productRating,
        StockCount: item.StockCount,
        productImage: item.image,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        reason: item.reason,
        discountPrice: item.discountPrice,
        couponCode: item.couponCode,
        refferalCode: item.refferalCode,
      })),
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0),
      totalPrice: totalPrice,
      address: useraddress,
      paymentMethod: paymentMethod,
      discountPrice: discountedPrice,
    });
    await order.save();

    const productDataInCollection = await Product.find();
    const minusQuantityPromises = cart.map(async (item) => {
      const productToUpdate = productDataInCollection.find(
        (product) => product._id.toString() === item.productid.toString()
      );
      if (productToUpdate && productToUpdate.StockCount >= item.quantity) {
        await Product.updateOne(
          { _id: item.productid },
          { $inc: { StockCount: -item.quantity } }
        );
      } else {
        console.log("Stock decresing not woring");
      }
    });
    await Promise.all(minusQuantityPromises);
    const cartDelete = await Cart.deleteMany({ userid: userId });

    res.redirect("/ordersucces");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

function generateOrderNumber() {
  return "ORD" + Date.now() + Math.floor(1000 + Math.random() * 9000);
}

//razorpay

exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    const amountInPaise = Math.round(parseFloat(amount) * 100);

    const Razorpay = require("razorpay");
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: "receipt_id",
    };

    instance.orders.create(options, function (err, order) {
      if (err) {
        res.status(500).send("Error creating order");
        return;
      }
      res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error in createOrder function:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.handlePayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      orderId,
      addressId,
      paymentMethod,
      discountprice,
    } = req.body;
    const userId = req.session.user;
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }
    const cart = await Cart.find({ userid: userId });
    const userAddress = await address.findOne({ _id: addressId });
    let totalPrice = 0;
    for (const item of cart) {
      let itemTotalPrice = item.quantity * item.price;
      totalPrice += itemTotalPrice;
    }
    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId: userId,
      products: cart.map((item) => ({
        productId: item.productid,
        productName: item.product,
        productDescription: item.productDescription,
        productRating: item.productRating,
        StockCount: item.StockCount,
        productImage: item.image,
        quantity: item.quantity,
        price: item.price,
        status: item.status,
        reason: item.reason,
        couponCode: item.couponCode,
        refferalCode: item.refferalCode,
      })),
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0),
      discountPrice: discountprice,

      totalPrice: totalPrice,
      address: userAddress,
      paymentMethod: "razorpay",
    });
    await order.save();
    const productDataInCollection = await Product.find();
    const minusQuantityPromises = cart.map(async (item) => {
      const productToUpdate = productDataInCollection.find(
        (product) => product._id.toString() === item.productid.toString()
      );
      if (productToUpdate && productToUpdate.StockCount >= item.quantity) {
        await Product.updateOne(
          { _id: item.productid },
          { $inc: { StockCount: -item.quantity } }
        );
      } else {
        console.log("Stock decreasing not working");
      }
    });
    await Promise.all(minusQuantityPromises);

    const cartDelete = await Cart.deleteMany({ userid: userId });
    res.redirect("/ordersucces");
  } catch (error) {
    console.error("Error in handlePayment function:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//payment failure

exports.handleFailedPayment = async (req, res) => {
  try {
    const { error, orderId, addressId, paymentMethod, discountprice } =
      req.body;

    const userId = req.session.user;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const cart = await Cart.find({ userid: userId });
    const userAddress = await address.findOne({ _id: addressId });

    let totalPrice = 0;
    for (const item of cart) {
      let itemTotalPrice = item.quantity * item.price;
      totalPrice += itemTotalPrice;
    }

    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId: userId,

      products: cart.map((item) => ({
        productId: item.productid,
        productName: item.product,
        productDescription: item.productDescription,
        productRating: item.productRating,
        StockCount: item.StockCount,
        productImage: item.image,
        quantity: item.quantity,
        price: item.price,
        status: "failed",
        reason: item.reason,
        couponCode: item.couponCode,
        refferalCode: item.refferalCode,
      })),
      totalQuantity: cart.reduce((total, item) => total + item.quantity, 0),
      discountPrice: discountprice,
      totalPrice: totalPrice,
      address: userAddress,
      paymentMethod: paymentMethod,
    });

    await order.save();

    const cartDelete = await Cart.deleteMany({ userid: userId });

    res.status(200).json({ message: "Redirecting to /getorders" });
  } catch (error) {
    console.error("Error in handleFailedPayment function:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// post for coupon

// exports.validateCoupon = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     const useraddress = await address.find({ userId });
//     const couponCode = req.body.couponCode.trim();

//     if (!couponCode) {

//       return res.render("checkout", {  error: 'Coupon code is required' });

//     }

//     // Check if the coupon code contains spaces
//     if (couponCode.includes(' ')) {

//       return res.render("checkout", {  error: 'Coupon code cannot contain spaces' });
//     }

//     const currentDate = new Date();
//     const coupon = await Coupon.findOne({ couponCode });

//     if (!coupon) {

//       return res.render("checkout", { error: 'Coupon not found'  });

//     }

//     if (currentDate > coupon.expiryDate) {

//       return res.render("checkout", { error: 'Coupon is expired'  });
//     }

//     // Check if the coupon has already been used by the user
//     const isCouponUsed = await Order.findOne({ userId, couponCode });
//     if (isCouponUsed) {

//       return res.render("checkout", { error: 'Coupon has already been used'  });
//     }

//     const cart = await Cart.find({ userid: userId });
//     let totalPrice = 0;
//     for (const item of cart) {
//       let itemTotalPrice = item.quantity * item.price;
//       totalPrice += itemTotalPrice;
//     }

//     const discountedPrice = totalPrice - (totalPrice * (coupon.discount / 100));

//     // Create an order record to mark the coupon as used
//     await Order.create({ userId, couponCode });

//     res.render("checkout", { cart, useraddress, totalPrice, discountedPrice});

//   } catch (error) {
//     console.error('Error validating coupon:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

// exports.validateCoupon = async (req, res) => {
//   try {
//     const userId = req.session.user;
//     console.log("userid is getting ",userId)
//     const useraddress = await address.find({ userId });
//     console.log("useraddress is getting ",useraddress)

//     const couponCode = req.body.couponCode.trim();
//     console.log("couponCode is getting in the validateCOupon ",couponCode)

//     if (!couponCode) {
//       return res.render("checkout", { error: 'Coupon has already been used'  });

//     } else if (couponCode.includes(' ')) {
//       return res.render("checkout", { error: 'Coupon has already been used'  });
//     } else {
//       const currentDate = new Date();
//       const coupon = await Coupon.findOne({ couponCode });

//       if (!coupon) {
//         errorMessages.push('Coupon not found');
//       } else if (currentDate > coupon.expiryDate) {
//         errorMessages.push('Coupon is expired');
//       } else {
//         const isCouponUsed = await Order.findOne({ userId, couponCode });
//         if (isCouponUsed) {
//           return res.render("checkout", { error: 'Coupon has already been used'  });

//         } else {

//           const cart = await Cart.find({ userid: userId });
//           let totalPrice = 0;
//           for (const item of cart) {
//             let itemTotalPrice = item.quantity * item.price;
//             totalPrice += itemTotalPrice;
//           }

//           const discountedPrice = totalPrice - (totalPrice * (coupon.discount / 100));

//          let realTotalPrice;
//           // await Order.create({ userId, couponCode });

//           return res.render('checkout', { cart, useraddress, totalPrice, discountedPrice ,realTotalPrice});
//         }
//       }
//     }

//     // If there are any errors, render the template with the error message(s)
//     return res.render('checkout', { error: errorMessages.join(', ') });
//   } catch (error) {
//     console.error('Error validating coupon:', error);
//     res.status(500).json({ error: 'Internal server error' });
//   }
// };

exports.validateCoupon = async (req, res) => {
  console.log("validateCoupon")
  try {
    const userId = req.session.user;
    const useraddress = await address.find({ userId });

    const couponCode = req.body.couponCode.trim();

    if (!couponCode || couponCode.includes(" ")) {
      return res.status(200).json ({ message: "Invalid coupon code" });
    }

    const currentDate = new Date();

    const coupon = await Coupon.findOne({ couponCode });

    if (!coupon) {
      return res.status(200).json ({ message: "Coupon not found" });
    } else if (currentDate > coupon.expiryDate) {
      return res.status(200).json({ message: "Coupon is expired" });
    }

    //the coupon has already
    const isCouponUsed = await Order.findOne({ userId, couponCode });

    if (isCouponUsed) {
      return res.render("checkout", { error: "Coupon has already been used" });
    }

    const cart = await Cart.find({ userid: userId });

    let totalPrice = 0;
    for (const item of cart) {
      let itemTotalPrice = item.quantity * item.price;
      totalPrice += itemTotalPrice;
    }

    const discountedPrice = totalPrice - totalPrice * (coupon.discount / 100);

    return res.render("checkout", {
      cart,
      useraddress,
      totalPrice,
      discountedPrice,
    });
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
