var express = require('express');
var router = express.Router();
var passport = require("passport");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// GitHub

router.get("https://shopping-cart-node-anupam.herokuapp.com/auth/github", passport.authenticate("github"));

router.get(
  "https://shopping-cart-node-anupam.herokuapp.com/auth/github/callback", 
  passport.authenticate("github",{failureRedirect: "/failure"}),
  (req, res)=>{
    console.log(req.user);
    res.redirect("/products");
  }
);


module.exports = router;
