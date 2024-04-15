

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



// exports.getbook= async(req,res)=>{

//   try{
//     const products = await productData.find({$and:[{isvisible:false},{productCategory:"MEN"}]});
  
//     console.log("produtcs in men ",products);
//     res.render("book",{products});
//   }
//   catch(error){
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// res.render("book")


// }




exports.getbook = async (req, res) => {
  try {
      const categoryFilter = req.query.category;
      const currentPage = parseInt(req.query.page) || 1; // Parse the current page from the query parameters
      const pageSize = 12; // Number of products per page

      let productQuery;
      if (categoryFilter && categoryFilter !== 'All') {
          productQuery = Product.find({ productCategory: categoryFilter, isvisible: false });
      } else {
          productQuery = Product.find({ isvisible: false });
      }

      const totalProductsPromise = Product.countDocuments({ isvisible: false }); // Count total products in parallel

      const productCategories = await Product.distinct('productCategory');
      const totalProducts = await totalProductsPromise;
      const totalPages = Math.ceil(totalProducts / pageSize);

      const products = await productQuery.skip((currentPage - 1) * pageSize).limit(pageSize).exec(); // Execute the query here

      const selectedCategory = categoryFilter || 'All';

      res.render("book", { products, productCategories, selectedCategory, page: currentPage, totalPages });
  } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
  }
};




  exports.filterproduct = async (req, res) => {
    try {
      const category = req.query.category;
      console.log("Category:", category);
  
      const products = await Product.find({ isvisible: false }).populate('category'); 
      console.log("products vdf:", products);
   const categories = await Category.find({ isvisible: false });
   console.log("categories vdf:", categories);

   const filteredProducts = products.filter(product => {
    const matchingCategory = categories.find(category => category.categoryName === product.category);
    return matchingCategory;

    
});
console.log("filteredProducts vdf:", filteredProducts);

res.render("book", { products:filteredProducts,categories});
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };




  
  exports.getwomen = async (req,res) =>{


  try{
    const products= await productData.find();
    console.log("women products",products);
     res.render("women",{products})
  }
  catch(error){
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
  }
  
  
  
  
  
  exports.getdisplay= async (req,res)=>{
  
    try{
      const id = req.params.id;
      console.log("dfdfd", id);
  
      const products = await productData.findOne({ _id: id });
      
  console.log("products",products)
      res.render("display",{products})
    }
    catch(error){
      console.error("error");
      res.status(500).send("Internal Server Error")
    }
  }





   exports.sortProduct = async (req, res) => {
    
    try {
 
         const userid = req.session.user;
      
        const sortBy = req.params.sortBy;
        
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
           
            default: products = await productData.find();
            break;

             
           return res.status(400).json({ message: 'Invalid sorting criteria' });
        }
       
        res.render("Book",{products,categories});
       
    } catch (error) {
        // Handle any errors that occur during the sorting process
        console.error("Error sorting products:", error);
        res.status(500).json({ message: 'An error occurred while sorting products.' });
    }
}


exports.searchmen = async (req, res) => {
  console.log("Search is working in the men session");
  try {
      const searchQuery = req.query.q;
      let products;

      if (searchQuery) {
          // Perform the search if there's a search query
          products = await productData.find({
              productName: { $regex: new RegExp(searchQuery, 'i') }
          });
      } else {
          // Fetch all products if there's no search query
          products = await productData.find();
      }

      // Render the view with the search results or all products
      res.render("Book", { products });
  } catch (error) {
      console.error("Error in search:", error);
      res.status(500).json({ message: 'An error occurred in the search.' });
  }
};


// ADD TO CART 

exports.addToCart = async (req, res) => {
 

  try {

    let productId = req.params.id;
    console.log("fkjdsfkjnsdkj",productId);

      const userId = req.session.user;
  
      const product = await Product.findOne({_id:productId});
      console.log("pdoducradsadadadadadadadad ",product);
 
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
      console.log("cartData",cartData);
      const cartProduct = await Cart.findOne({ productid: productId, userid: userId });
  
      if (cartProduct) {
        const newQuantity = cartProduct.quantity + 1;
        await Cart.updateOne({ _id: cartProduct._id }, { $set: { quantity: newQuantity } });
        console.log("Cart updated successfully");
      } else {
        await Cart.create(cartData);
        console.log("Cart added successfully");
      }

      res.status(200).send('Product added to cart successfully');
  } catch (error) {
      console.error('Error adding to cart:', error);
      // Respond with error status
      res.status(500).send('An error occurred while adding the product to the cart');
  }
};



//get whislist





exports.wishlist = async (req, res) => {
  try {
    const userId = req.session.user;
  
    
  
    const wishlistItems = await Wishlist.find({ userId: userId });
    console.log("wishlist itesm isjdfds",wishlistItems);
  
    
    if (!wishlistItems) {
      console.log('No wishlist items found for user:', userId);
    }
    
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
  console.log("wishlist to addtocart");
  try {
    const productId = req.body.productId; 
    console.log("Product ID received:", productId);

    const userId = req.session.user;
    console.log("user id is getting in the wishlist", userId);

    // Check if productId is valid
    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    const product = await Product.findOne({ _id: productId });
    console.log("product is found ", product);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    const cartData = {
      userid: userId,
      productid: productId,
      product: product.productName,
      price: product.productPrice,
      description:product.productDescription,
      quantity: 1,
      stock:product.StockCount,
      category:product.productCategory,
      image: product.productImages[0],
     
    };

  
    const cartProduct = await Cart.findOne({ productid: productId, userid: userId });

    if (cartProduct) {
      const newQuantity = cartProduct.quantity + 1;
      await Cart.updateOne({ _id: cartProduct._id }, { $set: { quantity: newQuantity } });
      console.log("Cart updated successfully");

    } else {
      await Cart.create(cartData);

      console.log("Cart added successfully");
    }

    res.redirect("/cartdisplay");
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};