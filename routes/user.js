const express = require("express");
const router = express.Router();
const userController=require("../middleware/sessioncntrl")



const { getLogin } = require("../controller/userController");


const {
    getHome,
    getSignup,
    getOtp,
    landingpage,
    Getlogout,
    resendotp,
   
} = require("../controller/userController");


router.get("/login",getLogin);
router.get("/signup", getSignup);
router.get("/", landingpage);
router.get("/home", userController,getHome);
router.get('/getOtp',getOtp);

router.get("/home", userController,getHome);
router.get('/logout',userController,Getlogout);
router.get('/resendotp',resendotp);



////////////
// post

const {
    postLogin,
    postSignup,
    postOtp,
    resendOtp,

} = require("../controller/userController");


router.post("/signup",postSignup);
router.post("/signin",postLogin);
router.post("/verifyotp", postOtp);
router.post('/resendOtp',resendOtp);

///

module.exports = router;
