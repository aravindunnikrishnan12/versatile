
const express = require('express');
const router = express.Router();
const usersession = require("../middleware/sessioncntrl");
const noache=require("nocache")
const userController=require("../middleware/sessioncntrl")



//get

const {
   

    cartdisplay,
    getcheckout,
    getsuccess,
    getorderdetails,
}=require("../controller/cartmanage");

    
     router.get("/cartdisplay",noache(),userController,cartdisplay);
     router.get("/checkout",noache(),userController,getcheckout);
     router.get("/ordersucces",userController,getsuccess)
     router.get("/orderdetails",userController,getorderdetails)
    //post

    const {

        addtocart,
        deletecart,
        updateQuantity,
        addAddres,
        postCheckout,
        handlePayment,
        createOrder,
        validateCoupon,
        handleFailedPayment,
    }=require("../controller/cartmanage");

    
router.post("/deleteCart/:itemId",deletecart);
router.post("/cart/:id", addtocart);
router.post('/updateQuantity/:itemId',updateQuantity);
router.post("/AddAddress",addAddres);
router.post("/checkoutpost/:Totalprice",postCheckout);
router.post("/validateCoupon",validateCoupon)

router.post('/order2ForRazorPay',handlePayment);
router.post('/create/orderId',createOrder);

router.post('/handleFailedPayment',handleFailedPayment)
module.exports = router;
