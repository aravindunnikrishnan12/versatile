const express = require("express");
const router = express();
const mongoose = require("../config/dbConnect");
const address = require("../model/addressModel");
const collection = require("../model/userModel");
const Cart = require("../model/cartmodel");
const Product  = require("../model/addproductModel");
const Order=require("../model/orderModel");
const Coupon = require('../model/couponModel')
const Swal = require('sweetalert2');


const Razorpay = require('razorpay');
const { validationResult } = require('express-validator');

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });



//get 

//checkout
exports.getcheckout = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("User ID in the getcheckout", userId);
   
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const cart = await Cart.find({ userid: userId });
    console.log("Cart items: ", cart);

    if (!cart || cart.length === 0) {
      return res.status(404).json({ message: 'Cart not found or empty' });
    }

    const useraddress = await address.find({ userId });
    let totalPrice = 0;
    let discountedPrice = 0; // Initialize discountedPrice variable

    for (const item of cart) {
      console.log("Processing item:", item);
      const product = await Product.findById(item.productid);
      console.log("Product details:", product);

      if (!product) {
        console.log(`Product with id ${item.productid} not found`);
        continue; // Skip this item and move to the next one
      }

      let itemPrice = product.productPrice;
      let itemDiscountedPrice = itemPrice; // Initialize item's discounted price

      console.log("Item Price before discount:", itemPrice);
      if (product.productOffer) {
        const discountPercentage = product.productOffer;
        const discountAmount = (itemPrice * discountPercentage) / 100;
        itemDiscountedPrice = itemPrice - discountAmount; // Calculate discounted price
        console.log("Discounted Price:", itemDiscountedPrice);
      }

      let itemTotalPrice = item.quantity * itemPrice; // Calculate total price without discount
      totalPrice += itemTotalPrice; // Add total price to totalPrice

      let itemTotalDiscountedPrice = item.quantity * itemDiscountedPrice; // Calculate total discounted price
      discountedPrice += itemTotalDiscountedPrice; // Add discounted price to discountedPrice

      console.log("Item Total Price:", itemTotalPrice);
      console.log("Item Total Discounted Price:", itemTotalDiscountedPrice);
      console.log("Total Price:", totalPrice);
      console.log("Discounted Price:", discountedPrice);
    }

    res.render("checkout", { cart, useraddress, totalPrice, discountedPrice });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};






  

//success
exports.getsuccess =(req,res)=>{
  res.render("success")
}


//get orderdetails

exports.getorderdetails=async(req,res)=>{
  try{
    const timestamp = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
    console.log("Timestamp: in the get order details ", timestamp);

    const userId = req.session.user;
    console.log("userId is getting on the get order detais ",userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
        

    const orders = await Order.find({ userId }).sort({_id:-1}).limit(1);
    console.log("order is getting on the get order  ",orders);

   


    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'No orders found for the user' });
    }
    const orderDetails = orders.map(order => ({
      orderNumber: order.orderNumber,
      orderDate: order.orderDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
      totalPrice: order.totalPrice,
      discountPrice:order.discountPrice,
      totalQuantity:order.totalQuantity,
      paymentMethod: order.paymentMethod,
      orderedDetails: order.products,
      address: order.address,
      userDetails: userId, 
    }));
    console.log("order is founded in the orderdetilas ",orderDetails);
    res.render('orderdetail', { orderDetails});

  }catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
}

}



exports.addtocart = async (req, res) => {
  try {
    const productId = req.params.id;
    console.log("productId in the addtocart:",productId)

    const userId = req.session.user;
    console.log("userID is getting",userId)

    const product = await Product.findById(productId);
    console.log("product is getting in the addtocart",product)

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

    console.log("cartdata is getting",cartData)

    //  if product has an offer
    if (product.productOffer) {
      cartData.discountedprice = product.productPrice - (product.productPrice * product.productOffer) / 100;
      cartData.totalPrice = cartData.discountedprice; 
    }


    const cartProduct = await Cart.findOne({ productid: productId, userid: userId });
console.log("cart product is getting in the cartproduct",cartProduct)
    if (cartProduct) {
      const newQuantity = cartProduct.quantity + 1;
      cartData.totalPrice = cartData.totalPrice * newQuantity; //  total price based on quantity
      await Cart.updateOne({ _id: cartProduct._id }, { $set: { quantity: newQuantity, totalPrice: cartData.totalPrice } });
    } else {
      await Cart.create(cartData);
    }


    res.redirect("/cartdisplay");
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.cartdisplay = async (req, res) => {
  try {
    const userId = req.session.user;
    console.log("User ID:", userId);

    const cart = await Cart.find({ userid: userId });
    console.log("Cart items:", cart);

    let total = 0;
    let totalPrice = 0;
    let allItemsInStock = true;

    for (const item of cart) {
      console.log("Processing item:", item);
      const product = await Product.findById(item.productid);
      console.log("Product details:", product);

      if (!product) {
        console.log(`Product with id ${item.productid} not found`);
        continue; // Skip this item and move to the next one
      }

      let itemPrice = product.productPrice;
      console.log("Item Price before discount:", itemPrice);
      if (product.productOffer) {
        const discountPercentage = product.productOffer;
        const discountAmount = (itemPrice * discountPercentage) / 100;
        itemPrice -= discountAmount;
        item.discountedprice = itemPrice; // Add discounted price to item object
        console.log("itemPrice", itemPrice);
        console.log("item.discountedprice", item.discountedprice);
        console.log("discountAmount", discountAmount);
        console.log("discountAmount", discountPercentage);
      }

      if (itemPrice && product.StockCount >= item.quantity) {
        let itemTotalPrice = itemPrice * item.quantity;
        totalPrice += itemTotalPrice;
        console.log("Item Total Price:", itemTotalPrice);
        console.log("Total Price:", totalPrice);

      } else {
        allItemsInStock = false;
        console.log("Item out of stock or invalid price");
      }
    }

    console.log("Total Price:", totalPrice);
    console.log("All Items In Stock:", allItemsInStock);

    res.render('cart', { cart, totalPrice, allItemsInStock, total });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};





  //quantity update 

  exports.updateQuantity = async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const { quantity: newQuantity } = req.body;
        const userId = req.session.user;

        const cartItem = await Cart.findOne({ _id: itemId, userid: userId });

        if (!cartItem) {
            return res.status(404).json({ success: false, message: "Item not found in the cart" });
            
        }


         // Check if the updated quantity exceeds the stock count
         const product = await Product.findById(cartItem.productid);
         
         if (newQuantity > product.StockCount) {
        
             return res.status(400).json({

                 success: false, 
                 message: "Quantity exceeds available stock" 
                 
                });
         }


        // Update the quantity of the item in the cart
        cartItem.quantity = newQuantity;
        await cartItem.save();

        // Retrieve the entire cart for the user
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

      // Calculate the total price for each item in the cart
      let itemTotalPrice = itemPrice * item.quantity;
      totalPrice += itemTotalPrice;
    }

        return res.status(200).json({ success: true, message: "Quantity updated successfully", totalPrice });
    } catch (error) {
        console.error("Error updating quantity:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};









  //delete cart 

  exports.deletecart = async(req,res)=>{


    const id =req.params.itemId;
    console.log("delete the cart",id);

    try{
     const result = await Cart.findByIdAndDelete(id);
     console.log(" cart deleted ");

  if(!result){
          return res.status(404).send("cart not found");
         }


         res.redirect("/cartdisplay")
    }

    catch(error){
        console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");
    }

  }




  exports.addAddres =async(req,res)=>{

    try{
        const userId= req.session.user;
      console.log("user id ",userId)

      const {
        address1,
        street,
        country,
        pincode,
        phone,
        additionalInfo,
     } = req.body;

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

        res.json({ success: true, message: 'Address added Successfully' });
    }
  catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Internal Server Error' });
   }

  }


  // /////////////////////////////////////////////

  
// post checkout 

exports.postCheckout = async (req, res) => {

  try {
      const userId = req.session.user; 
      const discountedPrice =req.params.Totalprice;
      const addressId =req.body.address;
      const couponCode = req.body.couponCode;    
      const paymentMethod = req.body.paymentMethod;

   
      if (!userId) {
          return res.status(400).json({ message: 'User ID is required' });
      }

      const cart = await Cart.find({ userid: userId });
      if (!addressId || addressId.trim() === '') {
        return res.status(400).json({ message: 'Address ID is required' });
    }

    // Validate that addressId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(addressId)) {
        return res.status(400).json({ message: 'Invalid address ID' });
    }
      const useraddress = await address.findOne({ _id:addressId});

      if (!useraddress) {
        return res.status(400).json({ message: 'Invalid address ID' });
      }

  

      let totalPrice = 0;
      for (const item of cart) {
          let itemTotalPrice = item.quantity * item.price;
          totalPrice += itemTotalPrice;
      }
      console.log("totalprice is getting ",totalPrice);


 // Fetching user data
      const userData = await collection.findById(userId);
      console.log("userdata is getting in the userdata",userData);
     if (!userData) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (paymentMethod === 'Wallet') {
          if (userData.wallet.balance < totalPrice) {
              return res.status(400).json({ message: 'Insufficient wallet balance' });
          }
          userData.wallet.balance -= totalPrice;
          userData.wallet.transactions.push({
            amount: totalPrice,
            type: 'purchase',
            description: 'purchased amount ', // Add a description field
        })
          await userData.save();
      }
      
 
      // Create a new order
      const order = new Order({
          orderNumber: generateOrderNumber(), 
          userId: userId,
          products: cart.map(item => ({
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
          discountPrice:discountedPrice,
      });
console.log("order  detils in geting in 367",order)
      
      await order.save();
       
      
      const productDataInCollection = await Product.find();
      const minusQuantityPromises = cart.map(async (item) => {
        const productToUpdate = productDataInCollection.find(product => product._id.toString() === item.productid.toString());
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

      
      const cartDelete=await Cart.deleteMany({userid: userId})
      console.log("cart deleted sdfsd ",cartDelete);
     
      res.redirect('/ordersucces');
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};


function generateOrderNumber() {
  
  return 'ORD' + Date.now() + Math.floor(1000 + Math.random() * 9000);
}





//razorpay

exports.createOrder = async (req, res) => {
  
  try {
    const { amount } = req.body;
    console.log("req body is getting ", req.body);

    // Convert the amount to paise (smallest currency unit)
    const amountInPaise = Math.round(parseFloat(amount) * 100);

    // Create order using Razorpay API
    const Razorpay = require('razorpay');
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: 'receipt_id', // You can generate a unique receipt ID here
    };

    // Creating the order
    instance.orders.create(options, function (err, order) {
      if (err) {
        console.error("Error creating order:", err);
        res.status(500).send("Error creating order");
        return;
      }

      console.log("Order created successfully:", order);
      res.send({ orderId: order.id });
    });
  } catch (error) {
    console.error("Error in createOrder function:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}





exports.handlePayment = async (req, res) => {
  console.log("handlepayment is working ")
  try {
    const { razorpay_payment_id, orderId, addressId, paymentMethod, discountprice } = req.body;
    console.log("Request body received from handlePayment:", req.body);

    const userId = req.session.user; // Fetch userId from session or request

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const cart = await Cart.find({ userid: userId });
    console.log("useraddress",cart);
    const userAddress = await address.findOne({ _id: addressId }); // Use Address model to find the address

    console.log("useraddress",userAddress);
    let totalPrice = 0;
    for (const item of cart) {
      let itemTotalPrice = item.quantity * item.price;
      totalPrice += itemTotalPrice;
    }
    console.log("totalprice is getting ", totalPrice);

   
    const order = new Order({
      orderNumber: generateOrderNumber(),
      userId: userId,
      products: cart.map(item => ({
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
      discountPrice:discountprice,
      
      totalPrice: totalPrice,
      address: userAddress, 
      paymentMethod:'razorpay',
    });

    await order.save();

   
    const productDataInCollection = await Product.find();
    const minusQuantityPromises = cart.map(async (item) => {
      const productToUpdate = productDataInCollection.find(product => product._id.toString() === item.productid.toString());
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

    // Clear user's cart after placing the order
    const cartDelete = await Cart.deleteMany({ userid: userId });
    console.log("cart deleted: ", cartDelete);

    res.redirect('/ordersucces');
  } catch (error) {
    console.error("Error in handlePayment function:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

//payment failure



exports.handleFailedPayment = async (req, res) => {
  console.log("Handling failed payment");

  try {
    const { error, orderId, addressId, paymentMethod, discountprice } = req.body;

    console.log("Error details:", error);
    console.log("orderId is getting ",req.body.orderId);
    console.log("addressIdis getting ", addressId);
    console.log("paymentMethod is getting ", paymentMethod);
    console.log("discountprice is getting ", discountprice);

    
    const userId = req.session.user; 
    console.log("userId is getting ", userId);

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
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
      
      products: cart.map(item => ({
        productId: item.productid,
        productName: item.product,
        productDescription: item.productDescription,
        productRating: item.productRating,
        StockCount: item.StockCount,
        productImage: item.image,
        quantity: item.quantity,
        price: item.price,
        status: 'failed',
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
    console.log("cart deleted: ", cartDelete);
    res.status(200).json({ message: 'Redirecting to /getorders' });

   
  } catch (error) {
    console.error("Error in handleFailedPayment function:", error);
    res.status(500).json({ message: 'Internal Server Error' });
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
    try {
      const userId = req.session.user;
      console.log('userId:', userId);
  
      const useraddress = await address.find({ userId });
      console.log('useraddress:', useraddress);
  
      const couponCode = req.body.couponCode.trim();
      console.log('couponCode:', couponCode);
  
      if (!couponCode || couponCode.includes(' ')) {
        console.log('Invalid coupon code:', couponCode);
        return res.render("checkout", { error: 'Invalid coupon code' });
      }
  
      const currentDate = new Date();
      console.log('currentDate:', currentDate);
  
      const coupon = await Coupon.findOne({ couponCode });
      console.log('coupon:', coupon);
  
      if (!coupon) {
        console.log('Coupon not found:', couponCode);
        return res.render("checkout", { error: 'Coupon not found' });
      } else if (currentDate > coupon.expiryDate) {
        console.log('Coupon is expired:', couponCode);
        return res.render("checkout", { error: 'Coupon is expired' });
      }
  
      //the coupon has already 
      const isCouponUsed = await Order.findOne({ userId, couponCode });
      console.log('isCouponUsed:', isCouponUsed);
  
      if (isCouponUsed) {
        console.log('Coupon has already been used by this user:', couponCode);
        return res.render("checkout", { error: 'Coupon has already been used' });
      }
  
      // If the coupon is valid and not used, continue with the checkout process
      const cart = await Cart.find({ userid: userId });
      console.log('cart:', cart);
  
      let totalPrice = 0;
      for (const item of cart) {
        let itemTotalPrice = item.quantity * item.price;
        totalPrice += itemTotalPrice;
      }
      console.log('totalPrice:', totalPrice);
  
      const discountedPrice = totalPrice - (totalPrice * (coupon.discount / 100));
      console.log('discountedPrice:', discountedPrice);
  
      return res.render('checkout', { cart, useraddress, totalPrice, discountedPrice });
    } catch (error) {
      console.error('Error validating coupon:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };