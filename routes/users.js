var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Cart = require('../models/cart');
var Item = require("../models/ItemList");
var Review = require("../models/review");
var nodemailer = require("nodemailer");
var path = require("path");
var smtpTransport = require('nodemailer-smtp-transport');

// multer
var multer  = require('multer');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname,'../public/images/uploads'))
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now()+path.extname(file.originalname))
  }
});
 
var upload = multer({ storage: storage });


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get("/login", (req, res, next)=>{
  console.log(req.body, "bodddyy")
  res.render("login")
})

router.post("/login", (req,res,next)=>{
  let { email, password} = req.body;
  User.findOne({ email}, (err, user)=>{
    if(err) return next (err);
    if(!user) {
      console.log("User not found")
      return res.redirect("/users/login");
    }
    else if(!user.verifyPassword(password)){
      console.log("wrong password");
      return res.redirect("/users/login");
    }
    if(user.isBlocked){
      console.log("User is Blocked");
      res.send('<h1>User is Blocked</h1>');
    }
    req.session.userId = user.id;
    console.log("loggedin");
    res.redirect("/products")
  })
})

// Register
router.get("/register", (req, res, next)=>{
  console.log(req.body, "registerred")
  res.render("register")
})


// Register Post
router.post("/register", upload.single("avatar"), (req, res, next)=>{
  console.log(req.body)
  var verificationCode = Math.floor(Math.random()*100000);
  req.body.verificationCode = verificationCode;
  var transport = nodemailer.createTransport(smtpTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    auth: {
      user: process.env.GMAIL_ID,
      pass: process.env.GMAIL_PASS,
    }
  }))
  var mailOptions = {
    from: process.env.GMAIL_ID,
    to: req.body.email,
    subject: `Verification code ${verificationCode} for Shopping-Cart`,
    html: `<h2>Kindly verify you mail id, with verifcation code: ${verificationCode}<h2> <br> <a href="https://shopping-cart-node-anupam.herokuapp.com/users/login">Click Here to login</a>`
};
  transport.sendMail(mailOptions, function(error, info){
    if(error){
        return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });
  
  //user create
  req.body.avatar = req.file.filename;
  User.create(req.body, (err, user)=>{
    if(err) return next(err);
    console.log(user);
    Cart.create({userId:user._id}, (err, cart)=>{
      if(err) return next(err);
      console.log(cart)
      User.findByIdAndUpdate(user._id, {$set:{cart:cart._id}},(err,user)=>{
        if(err) return next(err);
      })
    });
    res.redirect("/");
  })
})

// Logout

router.get("/logout", (req, res, next)=>{
  req.session.destroy();
  res.clearCookie("connect.sid");
  res.redirect("/");
})


// email verify
router.post("/:email/verify", (req,res, next)=>{
  User.findOne({email: req.params.email}, (err,user)=>{
    if(err) return next(err);
    if(user.verificationCode === req.body.verificationCode){
      User.findOneAndUpdate({email: req.params.email}, {isVerified: true, verificationCode:0000 }, {new:true}, (err, user)=>{
        if(err) return next(err);
        res.redirect("/products");
      })
    } else {
      res.send("<h1>Wrong code. Please check your verification code<h1>")
    }
  });
})

// Block/Unblock a user
router.post("/block/:id", async (req,res, next)=>{
  try {
    var userId = req.params.id;
    var userToBlock = await User.findById(userId);
    console.log(userToBlock, "Blockkk");
    if(!userToBlock.isBlocked){
      var block = await User.findByIdAndUpdate(userId, { isBlocked: true });
    } else {
      var unblock = await User.findByIdAndUpdate(userId, { isBlocked: false });
    }
    res.redirect("/users/all")
  } catch (error) {
    next(error)
  }
})


// Delete a user
router.post("/delete/:id", async (req,res,next)=>{
  var userId = req.params.id;
  var user = await User.findById(userId, "-password");
  var cartId = user.cart;
  console.log(user,"herreeeee");
  // deleting starts here
  var deleteItems = await Item.deleteMany({cart:cartId});
  console.log(deleteItems,"itemsss");
  var deleteCart = await Cart.findByIdAndDelete(cartId);
  console.log(deleteCart,"cartttt");
  var deleteReviews = await Review.deleteMany({ author:userId });
  console.log(deleteReviews,"reviewsss del");
  var deleteuser = await User.findByIdAndDelete(userId);
  console.log(deleteuser,"deletted user");
  res.redirect("/users/all")
});


// get list of all users
router.get("/all", async(req, res, next)=>{
  try {
    var allUser = await User.find({},"-password");
    // console.log(allUser, "usersssss");
    res.render("userList", {allUser})
  } catch (error) {
    next(error)
  }
})




module.exports = router;
