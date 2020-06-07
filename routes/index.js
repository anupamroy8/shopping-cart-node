var express = require('express');
var router = express.Router();
var passport = require("passport");
var Product = require("../models/product");
// var Item = require("../models/ItemList");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

// Unathenticated routes for viewing products withput login
router.get('/viewproducts', async function(req, res, next) {
  try {
    var filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    let products = await Product.find(filter);
    let categories = await Product.distinct("category");
    res.render('viewproducts', { products, categories });
  } catch (error) {
    next(error)
  }
});
// Unathenticated product search
router.post("/viewsearch", async (req, res, next) => {
  try {
    var search = req.body.search;
    let products = await Product.find({
      title: { $regex: search, $options: "i" },
    });
    console.log(products);
    let categories = await Product.distinct("category");
    res.render('viewproducts', { products, categories });
  } catch (error) {
    next(error);
  }
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
