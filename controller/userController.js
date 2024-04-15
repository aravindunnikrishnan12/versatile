
const express=require("express");
const router=express();
const mongoose=require("../config/dbConnect");
const nodemailer=require("nodemailer");
const bcrypt=require("bcrypt");
const otp=require("../model/otpModel");
const collection =require('../model/userModel');
const productData = require("../model/addproductModel")
//  const { generateNewOtp } = require('../controller/otputil');
 const otpgenerator =require('otp-generator')


 require('dotenv').config()

 const transporter = nodemailer.createTransport({
   service : 'Gmail',
   auth: {
       user : process.env.EMAIL_ADDRESS,
       pass : process.env.EMAIL_PASSWORD
 }
 });

exports.landingpage=(req,res)=>{
  res.render("home");
}

exports.getHome = (req,res)=>{
    res.render("home");
}

exports.getSignup = (req,res)=>{

    res.render("userlogin")
}


exports.getLogin = (req,res)=>{
    res.render("userlogin")
}


exports.getOtp=(req,res)=>{
  const message =req.session.message;
  res.render("otp",{ message });
};

////////





////////////////////////////////////////////////////////////
///


exports.postLogin = async (req, res) => {
  const data = {
    email: req.body.email,
    password: req.body.password,
  };

  try {
    const user = await collection.findOne({ email: data.email });

    if (!user) {
      console.log("User Not Exists");
      return res.render("userlogin", { errorMessage: "User Not Exists" });
    }

    // Compare the hashed password from the database with the provided password
    const passwordMatch = await bcrypt.compare(data.password, user.password);

    if (!passwordMatch) {
      console.log("Incorrect password");
      return res.render("userlogin", { errorMessage: "Incorrect password" });
    }

    req.session.user = user._id;
    console.log("session", req.session.user);
    res.redirect("/home");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};





  exports.postSignup = async (req, res) => {
    const { name, email, password } = req.body;
    console.log("details", name, email, password);
  
    try {
      const existingUser = await collection.findOne({ email });
  
      if (existingUser) {
        console.log("User Already exists");
        return res.render("userlogin", { errorMessage: "User already exists, please choose a different email." });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      req.session.signupData = {
        name,
        email,
        password: hashedPassword,
      };
  
    
    
      const existingUserByEmail = await collection.findOne({ email: req.session.signupData.email });
  
      if (existingUserByEmail) {
        res.send("This account already exists");
        return;
      }
 
      mailsender(req.session.signupData);
  
      res.render("otp");
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };



  let genotp = () => {
    return otpgenerator.generate(6, { upperCaseAlphabets: false,lowerCaseAlphabets:false, specialChars: false })
  }

  const mailsender = async (data) => {
    const generatedOTP = genotp();
    console.log(generatedOTP)
    const otpDocument = new otp({
        
        email: data.email,
        otp: generatedOTP
    });
  
    try {
        await otpDocument.save();
        // Send the email with the generated OTP
        transporter.sendMail({
            from: process.env.EMAIL_ADDRESS,
            to: data.email,
            subject: "OTP Verification",
            text: "Verify Your Email Using the OTP",
            html: `<h3>Verify Your Email Using this OTP: ${generatedOTP}</h3>`,
        }, (err, info) => {
            if (err) {
                console.log("Error sending email:", err);
            } else {
                console.log("Email sent successfully. Message ID:", info.messageId);
            }
        });
    } catch (error) {
        console.error("Error saving OTP to the database:", error);
    }
    
  }
  // 
 exports.resendotp = (req,res)=>{
    console.log('xxxxxxx')
    mailsender(req.session.signupData)
    console.log('sadsadsd')
  }
// 

  exports.postOtp = async (req, res) => {
   
      try {
        console.log('hizzz')
      const x = await otp.findOne({}).sort({ _id: -1 }).limit(1);
      console.log(x);
      const  otpvalue = req.body;
    
      console.log(otpvalue);
  
      if (x.otp == otpvalue.otp) {
        console.log('zzzzzzz')
        console.log(req.session.signupData);
        const newuser = await new collection(req.session.signupData).save();
        console.log(newuser);
  
        console.log("hi");
        // Send success response
         res.json({ success: true, message: 'OTP verification successful' });
        
       
       
      } else {
        // Send error response
         res.status(400).json({ success: false, message: 'Invalid OTP' });
        
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  };





 
exports.resendOtp = async (req, res) => {
  try {
    const signupData = req.session.signupData;

    if (!signupData) {
      return res.json({ error: "User data not found. Please sign up again." });
    }

    // Generate a new OTP and update the OTP record
    const newOtp = generateNewOtp();
    await otp.updateOne({ email: signupData.email }, { otp: newOtp });
    res.json({ success: true, message: "OTP resent successfully" });np

   
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.Getlogout=(req,res)=>{
  req.session.destroy((err)=>{
      if(err){
          console.error("error destrying the session",err)
          res.status(500).json({error:'internal server error occcurs'})
      }else{
          res.redirect('/login')
      }
  })
}










































