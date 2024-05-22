
const express=require("express");
const router=express();
const mongoose=require("..");
const nodemailer=require("nodemailer");
const bcrypt=require("bcrypt");
const Cart = require("../model/cartmodel");
const Product  = require("../model/addproductModel");
const collection =require('../model/userModel');
const productData = require("../model/addproductModel");
const Wishlist = require('../model/whishlistmodel');
const Category =require('../model/categoryModel')

//get book
exports.getbook = async (req, res) => {
  try {
    const { category: categoryFilter, page: currentPage = 1 } = req.query;
    const pageSize = 12;
    let productQuery;
    if (categoryFilter && categoryFilter !== 'All') {
      productQuery = Product.find({ productCategory: categoryFilter, isvisible: false});
    } else {
      productQuery = Product.find({ isvisible: false });
    }
    const [totalProducts, productCategories] = await Promise.all([
      Product.countDocuments({ isvisible: false }),
      Product.distinct('productCategory')
    ]);
    const totalPages = Math.ceil(totalProducts / pageSize);
    const products = await productQuery.skip((currentPage - 1) * pageSize).limit(pageSize).exec();
    const selectedCategory = categoryFilter || 'All';
    res.render("Book", { products, productCategories, selectedCategory, page: currentPage, totalPages });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


  
  exports.getdisplay= async (req,res)=>{
    try{
      const id = req.params.id;
      const products = await productData.findOne({ _id: id });
      res.render("display",{products})
    }
    catch(error){
      console.error("error");
      res.status(500).send("Internal Server Error")
    }
  }


exports.searchmen = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    let products;
    if (searchQuery) {
    
      products = await productData.find({
        productName: { $regex: new RegExp(searchQuery, 'i') }
      });
    } else {
      products = await productData.find();
    }
    const productCategories = ['Category1', 'Category2', 'Category3']; 
    const currentPage = 1;
    const totalPages = 10;
    let selectedCategory = req.query.category || ''; 
    res.render("Book", { products, selectedCategory, productCategories, page: currentPage, totalPages });
  } catch (error) {
    console.error("Error in search:", error);
    res.status(500).json({ message: 'An error occurred in the search.' });
  }
};



// ADDtocart in the bookpage popup message 

exports.addToCart = async (req, res) => {
  try {

    let productId = req.params.id;
      const userId = req.session.user;
      const product = await Product.findOne({_id:productId});  
     if(product.StockCount<=0){
    return res.status(400).send('out of stock')
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
      };
      const cartProduct = await Cart.findOne({ productid: productId, userid: userId });
      if (cartProduct) {
        const newQuantity = cartProduct.quantity + 1;
        await Cart.updateOne({ _id: cartProduct._id }, { $set: { quantity: newQuantity } });
      } else {
        await Cart.create(cartData);  
      }
      res.status(200).send('Product added to cart successfully');
  } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).send('An error occurred while adding the product to the cart');
  }
};

//get whislist
exports.wishlist = async (req, res) => {
  try {
    const userId = req.session.user;
    const wishlistItems = await Wishlist.find({ userId: userId });
    res.render("whishlist", { wishlistItems }); 
  } catch (error) {
    console.error('Error retrieving wishlist items:', error);
    res.status(500).send('An error occurred while fetching the wishlist.');
  }
};

// wishlist 
exports.postwishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.user;
  const existingItem = await Wishlist.findOne({ productId, userId });
  if (existingItem) {
      return res.json({ message: 'Product already in wishlist' });
    }
  const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const newItem = new Wishlist({
     userId,
      productId,
      productName: product.productName,
     productImage: product.productImages,
      price: product.productPrice,
    });
  await newItem.save(); 
    res.status(201).json({ message: 'Product added to wishlist successfully' });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    // Send an error response
    res.status(500).send('An error occurred while adding the product to the wishlist');
  }
};

//remove wishlist
  exports.removewishlist = async (req, res) => {
    try {
      const id =req.params.id; 
      const result = await Wishlist.findByIdAndDelete(id);  
      if(!result){
      return res.status(404).send("cart not found");
      }   
      res.redirect('/wishlist');
    }
    catch (error) {
      console.error('Error removing product from wishlist:', error);
      res.status(500).send('Error removing product from wishlist');
    }
  };
  


//wishlit to addcart


exports.wishtoaddcart = async (req, res) => {
  try {
    const productId = req.body.productId;

    const userId = req.session.user;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const product = await Product.findOne({ _id: productId });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
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
    };

    const cartProduct = await Cart.findOne({
      productid: productId,
      userid: userId,
    });

    if (cartProduct) {
      const newQuantity = cartProduct.quantity + 1;
      await Cart.updateOne(
        { _id: cartProduct._id },
        { $set: { quantity: newQuantity } }
      );
    } else {
      await Cart.create(cartData);
    }

    res.redirect("/cartdisplay");
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.sortProduct = async (req, res) => {
  try {
      const { user: userid } = req.session; 
      const { sortBy } = req.params; 
      let categories;
      let products;
      switch (sortBy) {
          case 'popularity':
              products = await productData.find().sort({ popularity: -1 });
              break;
          case 'priceLowToHigh':
              products = await productData.find().sort({ productPrice: 1 });
              break;
          case 'priceHighToLow':
              products = await productData.find().sort({ productPrice: -1 });
              break;
          case 'newArrivals':
              products = await productData.find().sort({ createdAt: -1 });
              break;
          case 'aAZ':
              products = await productData.find().sort({ productName: 1 });
              break;
          case 'zZA':
              products = await productData.find().sort({ productName: -1 });
              break;
          default:
              products = await productData.find();
              break;
      }
      const productCategories = ['Category1', 'Category2', 'Category3'];
      const currentPage = 1; 
      const totalPages = 10; 
      const { category: selectedCategory = '' } = req.query; 
      res.render("Book", { products, categories, selectedCategory, productCategories, page: currentPage, totalPages });
  } catch (error) {
   
      res.status(500).json({ message: 'An error occurred while sorting products.' });
  }
};





























// for testing
exports.filterproduct = async (req, res) => {
  console.log("filterproduct")
  try {
      const { query: { category } } = req; 

      console.log("Category:", category);

      const products = await Product.find({ isvisible: false }).populate('category');
      console.log("products vdf:", products);

      const categories = await Category.find({ isvisible: false });
      console.log("categories vdf:", categories);

      const filteredProducts = products.filter(product => {
          const matchingCategory = categories.find(cat => cat.categoryName === product.category);
          return matchingCategory;
      });

      console.log("filteredProducts vdf:", filteredProducts);

      res.render("Book", { products: filteredProducts, categories });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};
