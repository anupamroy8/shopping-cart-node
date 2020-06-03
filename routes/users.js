var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Cart = require('../models/cart');
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
    html: `<h2>Kindly verify you mail id, with verifcation code: ${verificationCode}<h2>`
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


router.get("/logout", (req, res, next)=>{
  req.session.destroy();
  res.clearCookie("connect.sid");
  res.redirect("/");
})

router.post("/:email/verify", (req,res, next)=>{
  User.findOne({email: req.params.email}, (err,user)=>{
    if(err) return next(err);
    if(user.verificationCode === req.body.verificationCode){
      User.findOneAndUpdate({email: req.params.email}, {isVerified: true}, {new:true}, (err, user)=>{
        if(err) return next(err);
        res.redirect("/products");
      })
    } else {
      res.send("Wrong code. Please check your verification code")
    }
  });

})

module.exports = router;
