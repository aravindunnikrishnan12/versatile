const express = require('express');
const router = express.Router();
const usersession = require("../middleware/sessioncntrl");




const {

    getorderdetails,
detailspage,
    details,
}=require("../controller/ordercontroller")

router.get("/order",getorderdetails);
router.get("/orderdetails/:orderId",details);
router.get("/o",detailspage);
const {
    updateOrderStatus,
}=require("../controller/ordercontroller")

router.post("/OrderStatus",updateOrderStatus);

module.exports = router;