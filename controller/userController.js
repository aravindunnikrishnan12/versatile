
const express=require("express");
const router=express();
const mongoose=require("../config/dbConnect");
const nodemailer=require("nodemailer");
const bcrypt=require("bcrypt");
const otp=require("../model/otpModel");
const collection =require('../model/userModel');
const productData = require("../model/addproductModel")
const otpgenerator =require('otp-generator')
const randomstring = require('randomstring');
require('dotenv').config()
const transporter = nodemailer.createTransport({
   service : 'Gmail',
   auth: {
       user : process.env.EMAIL_ADDRESS,
       pass : process.env.EMAIL_PASSWORD
 }
 });




exports.getSignup = (req, res) => {
  try {
    res.render("userlogin");
  } catch (error) {
    
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


//////////////
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
    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      console.log("Incorrect password");
      return res.render("userlogin", { errorMessage: "Incorrect password" });
    }

    req.session.user = user._id;
    console.log("session", req.session.user);
    res.redirect("/books");
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
        return res.render("userlogin", { errorMessage: "User already exists, please choose a different email." });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      req.session.signupData = {
        name,
        email,
        password: hashedPassword,
        referredCode: req.body.referralCode,
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
  

  exports.postOtp = async (req, res) => {
      try {
        const signupData = req.session.signupData;
        console.log('signupData',signupData)
        if (!signupData) {
          return res.json({ error: 'User data not found. Please sign up again.' });
      }

      const x = await otp.findOne({}).sort({ _id: -1 }).limit(1);   
      const  otpvalue = req.body; 
      if (x.otp == otpvalue.otp) {  

const newUser=new collection({
  name:signupData.name,
  email:signupData.email,
  password:signupData.password,
  referredCode: signupData.referredCode,
})

      // Conditionally add 50 to the wallet balance if referredCode is not empty
      if (signupData.referredCode) {
        newUser.wallet.balance += 50;
        newUser.wallet.transactions.push({
          amount: 50,
          description: 'Added 50 rupees to wallet balance',
          type: 'deposit',
      });
      }
const savedUser=await newUser.save();


  
       
         res.json({ success: true, message: 'OTP verification successful' });  
         
         

      } else {
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
    const newOtp = generateNewOtp();
    await otp.updateOne({ email: signupData.email }, { otp: newOtp });
    res.json({ success: true, message: "OTP resent successfully" });
  } catch (error) {
  
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.getforget =(req,res)=>{
  try{
    res.render("forget")
  }catch(error){
    res.status(500).json({ error: "Internal Server Error" });
  }
}



exports.postforget =async(req,res)=>{
  try{
    const email =req.body.email;
    const userData = await collection.findOne({email:email})
  if(userData){
 const randomStringdata= randomstring.generate();
 const updatedData= await collection.updateOne({email:email},{$set:{token:randomStringdata}});
 sendResetPasswordMail(userData.name,userData.email,randomStringdata)
 res.render("forget",{message:"check your email"})
  }else{
    res.render("forget",{message:"user no found"});
  }
  }catch(error){
    res.status(500).json({ error: "Internal Server Error" });
  }
}


// for rest password sewnd mail
const sendResetPasswordMail = async (name, email,token) => {
  console.log("sendResetPasswordMail")
  try {
    const resetLink = `http://localhost:4200/newpassword?token=${token}`;
    const mailOptions = {
      from: 'process.env.EMAIL_ADDRESS',
      to: email,
      subject: 'Reset Password Request',
      html: `
      <html>
        <body>
          <p>Hello ${name},</p>
          <p>You have requested to reset your password. Please click the link below to reset your password:</p>
          <p><a href="${resetLink}">Reset Password</a></p>
          <p>Thank you.</p>
        </body>
      </html>
    `,
    };
    await transporter.sendMail(mailOptions);
    console.log('Reset password email sent successfully.');
  } catch (error) {
    console.error('Error occurred while sending reset password email:', error);
  }
};


exports.newpasswordsetting= async(req,res)=>{
  try{
const token =req.query.token;
const tokendata = await collection.findOne({token:token})
if(tokendata)
{
  res.render("newpassword",{user_id:tokendata._id});
}
else{
  res.render('404',{message:"invalid link"})
}
  }
  catch(error){
   
    res.render('500', { message: "Internal Server Error" });
  }
}


exports.postRestpassword=async(req,res)=>{
  try{
   const password =req.body.newPassword;
   const userId =req.body.user_id
const securepass= await securePassword(password)
const newdata= await collection.findByIdAndUpdate({_id:userId},{$set:{password:securepass,token:''}})
res.redirect("/login");
  }
  catch(error){
    res.render('500', { message: "Internal Server Error" });
  }
}

const securePassword =async(password)=>{
  try{
    const passwordhash= await bcrypt.hash(password,10);
    return passwordhash;
  }
  catch(error){
    console.log("Error",error);
    res.render('500',{message:"internal server issue "});
  }
}


exports.checkReferralCode=async(req,res)=>{
  console.log("checkReferralCode");

  const { referralCode } = req.body;
  console.log("checkReferralCode",req.body);

 
    if (!referralCode) {
        return res.status(400).json({ isValid: false, message: 'Referral code is required.' });
    }
  
    try {
      
        const userDetails = await collection.findOne({ referralCode: referralCode });
  console.log("user is getting in  the checkReferralCode", userDetails);
        if (userDetails) {
            return res.json({ isValid: true, message: 'Referral code is valid.' });
        } else {
            return res.json({ isValid: false, message: 'Invalid referral code.' });
        }
    } catch (error) {
        console.error('Error checking referral code:', error);
        return res.status(500).json({ isValid: false, message: 'Internal server error.'});
  }

}




// gust 
exports.userGuest = async(req, res) => {
  try {
    const { category: categoryFilter, page: currentPage = 1 } = req.query;
    const pageSize = 12;
    let productQuery;
    if (categoryFilter && categoryFilter !== 'All') {
      productQuery = productData.find({ productCategory: categoryFilter, isvisible: false});
    } else {
      productQuery = productData.find({ isvisible: false });
    }
    const [totalProducts, productCategories] = await Promise.all([
      productData.countDocuments({ isvisible: false }),
      productData.distinct('productCategory')
    ]);
    const totalPages = Math.ceil(totalProducts / pageSize);
    const products = await productQuery.skip((currentPage - 1) * pageSize).limit(pageSize).exec();
    const selectedCategory = categoryFilter || 'All';
   
    res.render("userguest", { products, productCategories, selectedCategory, page: currentPage, totalPages});
  } catch (error) {
    
    res.status(500).json({ error: 'Internal server error occurred' });
  }
};




exports.Getlogout = (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        res.status(500).json({ error: 'Internal server error occurred' });
      } else {
        res.redirect('/login');
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Unexpected error occurred' });
  }
};










































