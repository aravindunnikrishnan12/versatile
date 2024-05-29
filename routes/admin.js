const express = require("express");
const router = express.Router();
const admincontroller =require("../middleware/adminsession")
const noache=require("nocache")

const {
  getAdminLogin,
  getInsite,
  userManage,
  getcoupon,
  addcoupon,
  editcoupon,
  salesReport,
  downloadPDF,
  downloadExcel,
  logout
} = require("../controller/admincontroller");

//get routers
router.get("/admin/adminlogin",noache(),getAdminLogin);
router.get("/admin/Insite",admincontroller,getInsite);
router.get("/admin/UserManage",admincontroller,userManage);
router.get("/admin/couponmanageadmin",admincontroller,getcoupon);
router.get("/admin/getaddcoupon",admincontroller,addcoupon);
router.get("/admin/geteditcoupon/:id",admincontroller,editcoupon);
router.get("/admin/getsalesReport",admincontroller,salesReport);
router.get('/download/pdf',admincontroller, downloadPDF);
router.get('/download/excel',admincontroller,downloadExcel);
router.get('/adminlogout',logout);
//post routers

const { AdminPostLogin, blockUser,postAddCoupon,posteditcoupon,deletecoupon } = require("../controller/admincontroller");

router.post("/postadminlogin", AdminPostLogin);
router.post("/blockUser/:userId", blockUser);


router.post('/AddCoupon',postAddCoupon);
router.post('/editCoupon/:id',posteditcoupon);
router.post('/deletecoupon/:id',deletecoupon);


module.exports = router;
