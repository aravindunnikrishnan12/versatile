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
    getforget,
    newpasswordsetting
} = require("../controller/userController");


router.get("/login",getLogin);
router.get("/signup", getSignup);
router.get("/", landingpage);
router.get("/home", userController,getHome);
router.get('/getOtp',getOtp);

router.get("/home", userController,getHome);
router.get('/logout',userController,Getlogout);
router.get('/resendotp',resendotp);
router.get('/forgetpassword',getforget)
router.get('/newpassword',newpasswordsetting)

////////////
// post

const {
    postLogin,
    postSignup,
    postOtp,
    resendOtp,
    postforget,
    postRestpassword
} = require("../controller/userController");


router.post("/signup",postSignup);
router.post("/signin",postLogin);
router.post("/verifyotp", postOtp);
router.post('/resendOtp',resendOtp);
router.post('/postforgetpassword',postforget)
router.post('/postRestpassword',postRestpassword)


module.exports = router;
