// const otpGenerator=require("otp-generator");
// const OTP=require("../model/otpModel");
// const User=require("../model/userModel");


// exports.sendOTP=async(req,res)=>{
//     try{
//         const {email}=req.body;
//         const checkUSerPrese=await OTP.collection.findOne({email});
//         if (checkUserPresent) {
//           return res.status(401).json({
//             success:false,
//             message:"User is already registered",
//           });
//         }
//         let otp=otpGenerator.generate(6,{
//             upperCaseAlphabets:false,
//             lowerCaseAlphabets:false,
//             specialChars:false,
//         });
//         let result=await OTP.findOne({otp:otp});
//         while(result){
//             otp =otpGenerator.generate(6,{
//                 upperCaseAlphabets:false,
//             });
//             result=await OTP.findOne({otp:otp});
//         }
//         const otppayload={email, otp};
//         const otpBody=await OTP.create(otppayload);
//         res.status(200).json({
//             success:true,
//             message:"OTP sent succesfully",
//             otp,
//         });
//         console.log(otpBody);
//     } catch(error){
//         console.log(error.message);
//         return res.status(500).json({success:false,error:error.message});
//     }
// };