const express = require("express");
const router= express.Router();
// const AddProduct= require("../model/addProductModel");
const uploads = require("../middleware/multer");


//get Routes

const{

    getProducts,
    addproduct,
    getedit,
 
}= require("../controller/productcontroller");

router.get("/products",getProducts);
router.get("/Addproduct",addproduct);
router.get("/editproduct/:id",getedit);



const {
    postAddProduct,
    editproduct,
    visiblepost,
    deleteproduct,
    deleteImage,
}=require("../controller/productcontroller");



router.post("/AddProduct/:productid",uploads,postAddProduct);
router.post("/editproduct/:id",uploads,editproduct);
router.post("/visible/:id",visiblepost);
router.post("/deleteproduct/:id",deleteproduct);
router.post('/deleteImage/:id',deleteImage);

//post Routes


module.exports=router;