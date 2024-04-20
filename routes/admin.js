const express = require("express");
const router = express.Router();
const admincontroller =require("../middleware/adminsession")

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
} = require("../controller/admincontroller");

//get routers

router.get("/adminLogin", getAdminLogin);
router.get("/Insite",admincontroller,getInsite);
router.get("/UserManage",admincontroller,userManage);
router.get("/couponmanageadmin",admincontroller,getcoupon);
router.get("/getaddcoupon",admincontroller,addcoupon);
router.get("/geteditcoupon/:id",admincontroller,editcoupon);
router.get("/getsalesReport",admincontroller,salesReport);
router.get('/download/pdf',admincontroller, downloadPDF);
router.get('/download/excel',admincontroller,downloadExcel);
//post routers

const { AdminPostLogin, blockUser,postAddCoupon,posteditcoupon,deletecoupon } = require("../controller/admincontroller");

router.post("/adminlogin", AdminPostLogin);
router.post("/blockUser/:userId", blockUser);


router.post('/AddCoupon',postAddCoupon);
router.post('/editCoupon/:id',posteditcoupon);
router.post('/deletecoupon/:id',deletecoupon);


module.exports = router;
