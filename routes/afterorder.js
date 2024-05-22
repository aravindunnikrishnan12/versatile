const express = require('express');
const router = express.Router();
const usersession = require("../middleware/sessioncntrl");




const {

    getorderdetails,
    detailspage,
    details,
    adminapproval,
}=require("../controller/ordercontroller")

router.get("/admin/order",getorderdetails);
router.get("/admin/orderdetails/:orderId",details);
router.get("/admin/o",detailspage);



const {
    updateOrderStatus,
}=require("../controller/ordercontroller")

router.post("/OrderStatus",updateOrderStatus);
router.post('/updateAdminApproval',adminapproval);


module.exports = router;