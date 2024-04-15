const express = require("express");
const path = require("path");
const app = express();
const cookieParser = require('cookie-parser');
const bodyparser=require("body-parser");
const session= require("express-session");
const multer = require('multer');


app.use(session({ 
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
 
}));

// Middleware
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "view/user"), path.join(__dirname, "view/admin")]);
app.use('/uploads',express.static(__dirname+"/uploads"));
app.use(bodyparser.urlencoded({ extended: true }));
// app.use('/upload', express.static('upload'));

// Routers

const userRouter = require("./routes/user");
const adminRouter = require("./routes/admin");
const productmanage= require("./routes/product");
const categorymanage= require("./routes/category");
const shopmanage = require("./routes/shop");
const profile = require("./routes/profile");
const cart = require("./routes/orderdetails");
const order =require("./routes/afterorder")



// Routes
app.use("/", userRouter);
app.use("/", adminRouter); 
app.use("/",productmanage);
app.use("/",categorymanage);
app.use("/",shopmanage);
app.use("/",profile)
app.use("/",cart)
app.use("/",order)
// Server
const port = 4200;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
