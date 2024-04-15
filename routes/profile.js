const express = require("express");
const router = express.Router();


//get routes

const {
    getaddress,
    getprofile,
   getpassword,
   getorder,
   getcoupon,
   downloadinvoice,
}=require("../controller/profilecontroller");

router.get("/address",getaddress);
router.get("/profile",getprofile);
router.get("/password",getpassword);
router.get("/getorders",getorder);
router.get("/coupons",getcoupon)

router.get('/download-invoice/:orderId/:productId',downloadinvoice);



//post routes
const {
    postaddress,
    posteditaddress,
    deleteaddress,
    editprofile,
    postPasswordChange,
    postcancelorder,
    returnOrder,
history,
createPayment,
walletAddAmount,
retryOrder,
updateOrderStatus,
}=require("../controller/profilecontroller");

router.post("/Address",postaddress);
router.post("/edit/:id",posteditaddress)
router.post("/delete/:id",deleteaddress)
router.post("/editprofile/:userID",editprofile)
router.post('/password/change',postPasswordChange);
router.post("/cancelOrder",postcancelorder);
router.post("/returnOrder",returnOrder)
router.post("/generate-razorpay-order",createPayment)

router.post('/verify-razorpay-payment',walletAddAmount)


router.post('/retryOrder',retryOrder)
router.post('/updateOrderStatus',updateOrderStatus )

router.get('/api/transactions',history);


module.exports =router;