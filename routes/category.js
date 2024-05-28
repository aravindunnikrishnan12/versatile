
const express = require('express');
const router = express.Router();

//get



const { 
    getCategorys,
    getaddCategory,
    getEditCategory,
    

} = require("../controller/categorycontroller");

router.get("/admin/category", getCategorys);


router.get("/admin/addCategory",getaddCategory)


router.get("/admin/editCategory/:id",getEditCategory);



///////






//post


const {
    postEditCategory,
    postAddCategory,
    deleteCategory,
    visiblepost,
}= require("../controller/categorycontroller");

router.post("/visiblep/:id",visiblepost);

router.post("/category", postAddCategory);
router.post("/posteditcategory/:id",postEditCategory);
router.post("/deleteCategory/:categoryId", deleteCategory);




module.exports = router;