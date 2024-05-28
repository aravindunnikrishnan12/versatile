const express = require("express");
const router = express.Router();
const userController=require("../middleware/sessioncntrl")



const { getLogin } = require("../controller/userController");


const {

    getSignup,
    getOtp,
    Getlogout,
    resendotp,
    getforget,
    newpasswordsetting,
    userGuest
} = require("../controller/userController");


router.get("/login",getLogin);
router.get("/signup", getSignup);
router.get('/getOtp',getOtp);
router.get('/logout',userController,Getlogout);
router.get('/resendotp',resendotp);
router.get('/forgetpassword',getforget)
router.get('/newpassword',newpasswordsetting)
router.get('/',userGuest)
////////////
// post

const {
    postLogin,
    postSignup,
    postOtp,
    resendOtp,
    postforget,
    postRestpassword,
    checkReferralCode
} = require("../controller/userController");


router.post("/signup",postSignup);
router.post("/signin",postLogin);
router.post("/verifyotp", postOtp);
router.post('/resendOtp',resendOtp);
router.post('/postforgetpassword',postforget)
router.post('/postRestpassword',postRestpassword)
router.post('/checkReferralCode',checkReferralCode);

module.exports = router;
