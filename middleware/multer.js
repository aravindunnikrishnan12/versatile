


const fs = require("fs");


const multer = require("multer");
const path = require("path");

const fileFilter = function (req, file, callback) {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    console.log("Only image files supported");
    callback(null, false);
  }
};


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/";
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    let ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});

const limits = {
  fileSize: 1024 * 1024 * 100,
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,  // Make sure fileFilter is defined before it's used
  limits: limits,
}).array("productImages", 5);

module.exports = upload;