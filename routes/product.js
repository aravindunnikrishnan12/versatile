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

router.get("/admin/products",getProducts);
router.get("/admin/Addproduct",addproduct);
router.get("/admin/editproduct/:id",getedit);



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
router.delete('/deleteImage/:productId/:index',deleteImage);


//post Routes


module.exports=router;