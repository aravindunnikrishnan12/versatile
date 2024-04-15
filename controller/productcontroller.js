const express= require("express");
const router= express();
const mongoose= require("../config/dbConnect");
const AddProduct= require("../model/addproductModel");
const { post } = require("../routes/product");
const categoryCollecton = require("../model/categoryModel");
const { ResultWithContextImpl } = require("express-validator/src/chain");
const uploads = require("../middleware/multer")
const { body, validationResult } = require('express-validator');


//get 



exports.getProducts = async (req, res) => {
  try {
      const categoryFilter = req.query.category;
      console.log("categoryFilter",categoryFilter)
      const productCategories = await AddProduct.distinct('productCategory');
      let productQuery;
      if (categoryFilter && categoryFilter !== 'All') {
          productQuery = AddProduct.find({ productCategory: categoryFilter });
      } else {
          productQuery = AddProduct.find();
      }
      const products = await productQuery.exec();
      const selectedCategory = categoryFilter || 'All'; 
      res.render("productManage", { product: products, productCategories, selectedCategory });
  } catch (error) {
      console.error(error);
      res.status(500).send("internal server error");
  }
};





exports.getedit = async (req,res) =>{
    const id = req.params.id;
    console.log(" edit product item 40",id);

try{
  const categories= await categoryCollecton.find();
  const items = await AddProduct.findById(id);
  console.log(" edit categorie line  39 ",categories);
  console.log(" edit product item 40",items);
  

 
  res.render("editproduct",{categories,items});
   

}
catch(error){
    console.error(error);
    res.status(500).send("internal server error");

}
   
}







// get of add product
exports.addproduct = async (req,res)=>{
  console.log("get of addproduct is working ")
    try{

        const categories= await categoryCollecton.find({ isvisible: false });
        const product = await AddProduct.find();
        console.log(categories);
        console.log(product);
        res.render("addproduct",{categories,product});
    }
    catch(error){
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
    

}



//post

exports.postAddProduct = async (req, res) => {
  console.log("postAddProduct is working ");
  try {
       const productId = req.params.productid;
       console.log("Request Parameters:", req.params);
       const {
           productName,
           productDescription,
           productCategory,
           productPrice,
           productRating,
           StockCount,
           productOffer,
           isVisible,
       } = req.body;
       console.log("Request Body:", req.body);
       // Check if a product with the same name already exists
       const existingProduct = await AddProduct.findOne({ productName });
 
       if (existingProduct) {
        console.log("Product with the same name already exists:", existingProduct);
           // Product with the same name already exists
           return res.render('/addproduct');
          
       }
 
       // Check if req.files is defined and contains files
       if (!req.files || req.files.length === 0) {
        console.log("No files were uploaded.");
           return res.status(400).send('No files were uploaded.');
       }
 
       // Check if files are uploaded
       let productImages = [];
 
       if (req.files && req.files.length > 0) {
         const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
         productImages = fileUrls;
       }
 
       // Log each field of the product
       console.log("Product Name:", productName);
       console.log("Product Description:", productDescription);
       console.log("Product Category:", productCategory);
       console.log("Product Price:", productPrice);
       console.log("Product Rating:", productRating);
       console.log("Stock Count:", StockCount);
       console.log("Product Offer:", productOffer);
       console.log("Is Visible:", isVisible);
       console.log("Product Images:", productImages);
 
       const data = {
           productName,
           productPrice,
           productDescription,
           productCategory,
           productImages,
           productRating,
           productOffer,
           StockCount,
           isVisible,
       };
 
       // Create the new product only if it doesn't already exist
       const updatedProduct = await AddProduct.create(data);
       console.log("Product Created:", updatedProduct);

       res.redirect('/products');
 
  } catch (error) {
       console.error(error);
       res.status(500).send('Internal Server Error');
  }
 };
 

//edit post
exports.editproduct = async (req, res) => {
  try {
    const productId = req.params.id.replace(':', '');
    const product = await AddProduct.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    let productImages = [];

    // Handle newly uploaded images
    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
      productImages = [...productImages, ...fileUrls];
    }

    // Handle existing images
    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      productImages = [...productImages, ...existingImages];
    }

    await AddProduct.findByIdAndUpdate(productId, {
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      productDescription: req.body.productDescription,
      selectCategory: req.body.productCategory,
      productImages: productImages,
      productRating: req.body.productRating,
      StockCount: req.body.StockCount,
      productOffer: req.body.productOffer,
    });

    res.redirect("/products");
  } catch (error) {
    console.log("Error occurred in editProduct", error);
    res.status(500).send("Internal Server Error");
  }
};


//delete image 
exports.deleteImage = async (req, res) => {
  console.log("Request received in deleteImage function"); // Log the start of the function
 
  try {
     const id = req.params.id;
     const indexToRemove = req.body.index;
 
     console.log("Request parameters:", { id }); // Log the id from request parameters
     console.log("Request body:", { indexToRemove }); // Log the indexToRemove from request body
 
     const unsetQuery = { $unset: { [`productImages.${indexToRemove}`]: 1 } };
     console.log("Unset query:", unsetQuery); // Log the unset query
 
     await AddProduct.findByIdAndUpdate(id, unsetQuery);
 
     await AddProduct.findByIdAndUpdate(id, { $pull: { productImages: null } });
 
     const updatedProduct = await AddProduct.findById(id);
 
     console.log("Updated product:", updatedProduct); // Log the updated product
 
     if (updatedProduct) {
       console.log("Image deleted successfully"); // Log success message
       res.status(200).json({ success: true, message: 'Image deleted successfully', data: updatedProduct });
     } else {
       console.log("Index not found in productImages array"); // Log error message
       res.status(404).json({ success: false, message: 'Index not found in productImages array' });
     }
  } catch (error) {
     console.error("Error in deleteImage function:", error); // Log the error
     res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
 };
 



  //softdelete
  exports.visiblepost= async (req, res) => {
    try {
      const id= req.params.id;
       
      console.log("dadd", id );
      const product = await AddProduct.findById(id);
     

      if (!product) {
        return res.status(404).send("Product not found");
      }
  
      product.isvisible = !product.isvisible;
  
      await product.save();
  
      res.redirect("/Products");
    } catch (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
  };


  //delete

  exports.deleteproduct = async (req,res)=>{

    const id= req.params.id;
      console.log("idjdfhr",id);
   try{
    
       const result = await AddProduct.findByIdAndDelete(id);
       console.log ("Deleted");

         if(!result){
          return res.status(404).send("product not found");
         }

         res.redirect("/products")
   }
   catch(error){
    console.error("Error deleting product:", error);
        res.status(500).send("Internal Server Error");

   }
             
  }