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

    const productCategories = await AddProduct.distinct("productCategory");

    let productQuery;

    if (categoryFilter && categoryFilter !== "All") {
      productQuery = AddProduct.find({ productCategory: categoryFilter });
    } else {
      productQuery = AddProduct.find();
    }
    const products = await productQuery.exec();

    const selectedCategory = categoryFilter || "All";
    res.render("productManage", {
      product: products,
      productCategories,
      selectedCategory,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("internal server error");
  }
};





exports.getedit = async (req, res) => {
  const id = req.params.id;

  try {
    const categories = await categoryCollecton.find();

    const items = await AddProduct.findById(id);

    res.render("editproduct", { categories, items });
  } catch (error) {
    res.status(500).send("internal server error");
  }
};







// get of add product
exports.addproduct = async (req, res) => {
  try {
    const categories = await categoryCollecton.find({ isvisible: false });
    const product = await AddProduct.find();
    res.render("addproduct", { categories, product });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};



//post

exports.postAddProduct = async (req, res) => {
  try {
    const productId = req.params.productid;

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

    //exists
    const existingProduct = await AddProduct.findOne({ productName });

    if (existingProduct) {
      return res.status(400).send("product is already exist");
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files were uploaded.");
    }

    // if files are uploaded
    let productImages = [];

    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
      productImages = fileUrls;
    }

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

    const updatedProduct = await AddProduct.create(data);

    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
 

//edit post


exports.editproduct = async (req, res) => {
  try {
    const productId = req.params.id.replace(":", "");

    const product = await AddProduct.findById(productId);

    if (!product) {
      return res.status(404).send("Product not found");
    }
    let productImages = [];

    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map((file) => `/uploads/${file.filename}`);
      productImages = [...productImages, ...fileUrls];
    }

    if (req.body.existingImages) {
      const existingImages = JSON.parse(req.body.existingImages);
      productImages = [...productImages, ...existingImages];
    }

    await AddProduct.findByIdAndUpdate(productId, {
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      productDescription: req.body.productDescription,
      productCategory: req.body.productCategory,
      productImages: productImages,
      productRating: req.body.productRating,
      StockCount: req.body.StockCount,
      productOffer: req.body.productOffer,
    });

    res.redirect("/admin/products");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};





  //softdelete
  exports.visiblepost = async (req, res) => {
    try {
      const id = req.params.id;

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

  exports.deleteproduct = async (req, res) => {
    const id = req.params.id;
    try {
      const result = await AddProduct.findByIdAndDelete(id);
      if (!result) {
        return res.status(404).send("product not found");
      }
      res.redirect("/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      res.status(500).send("Internal Server Error");
    }
  };



  //delete image 
exports.deleteImage = async (req, res) => {
  try {
    const { productId, index } = req.params;

    const existingProduct = await AddProduct.findById(productId);

    if (!existingProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    existingProduct.productImages.splice(index, 1);

    await existingProduct.save();

    res.json({
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

