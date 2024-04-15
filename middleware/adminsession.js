const ADMINDATA =require("../model/adminModel");




async function  checkadminSession(req, res, next) {
 

    const Auth = await ADMINDATA.find({_id:req.session.admin});

      if ( req.session.admin) {

    next();

  } else {

    res.redirect("/adminlogin");

  }
  
}





module.exports = checkadminSession;