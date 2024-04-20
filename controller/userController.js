
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



 exports.landingpage = (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.error("Error rendering landing page", error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};

exports.getHome = (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.error("Error rendering home page", error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};

exports.getSignup = (req, res) => {
  try {
    res.render("userlogin");
  } catch (error) {
    console.error("Error rendering signup page", error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};

exports.getLogin = (req, res) => {
  try {
    res.render("userlogin");
  } catch (error) {
    console.error("Error rendering login page", error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};



exports.getOtp = (req, res) => {
  try {
    const message = req.session.message;
    res.render("otp", { message });
  } catch (error) {
    console.error("Error rendering OTP page", error);
    res.status(500).json({ error: 'Internal server error occurred' });
  }
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
    if (user.isBlocked) {
      console.log("User is blocked");
      return res.render("userlogin", { errorMessage: "User is blocked" });
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
  exports.resendotp = async (req, res) => {
    try {
      await mailsender(req.session.signupData);
      res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
      console.error("Error sending OTP email", error);
      res.status(500).json({ error: 'Internal server error occurred while resending OTP' });
    }
  };
  
// 

  exports.postOtp = async (req, res) => {
   
      try {
      const x = await otp.findOne({}).sort({ _id: -1 }).limit(1);
    
      const  otpvalue = req.body;
    
      console.log(otpvalue);
  
      if (x.otp == otpvalue.otp) {
    
        console.log(req.session.signupData);
        const newuser = await new collection(req.session.signupData).save();
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



exports.Getlogout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying the session", err);
        res.status(500).json({ error: 'Internal server error occurred' });
      } else {
        res.redirect('/login');
      }
    });
  } catch (error) {
    console.error("Unexpected error occurred", error);
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
};










































