var express = require('express');
var router = express.Router();
var Product = require("../models/product");
var path = require('path');
var Cart = require("../models/cart");
var Item = require("../models/ItemList");

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

// Products List
router.get("/", async (req, res, next)=>{
  try {
  if(!req.UserInfo.isVerified && !req.UserInfo.isAdmin){
      console.log("User not verified")
      return res.render("verifyForm", {email: req.UserInfo.email})
  }
  let products = await Product.find();
  console.log(products);
  if(req.UserInfo){
    var cartid = req.UserInfo.cart;
    var item = await Item.find({cart: cartid});
    console.log(item)
  }
  res.render("product", {products, email:req.UserInfo.email, item})
  } catch (error) {
    next (error);
  }
})





// GET Cart 
router.get("/:id/mycart", async(req, res, next)=>{
  var cart = await Cart.findOne({userId: req.UserInfo.id});
  var displayCart = await Item.find({cart: cart.id}).populate(
    "item",
    "title price category description imagePath"
  ).exec();
  console.log(displayCart,"displayCart")
  res.render("displayCart", {displayCart})
})

// Delete Item from Cart
router.get("/:id/deleteCart", async(req, res, next)=>{
  var item = await Item.findById(req.params.id);
  console.log(item, req.params, "delete item");
  var product = await Product.findByIdAndUpdate(item.item, {
    $inc: {quantity: item.quantity},

  })
  var cart = await Cart.findByIdAndUpdate(item.cart, {
    $pull: {itemList: item.id},
  });
  var deleteItem =  await Item.findByIdAndDelete(req.params.id);
  res.redirect(`/products/${req.UserInfo.id}/mycart`);
})

// Product add to cart
router.post("/addToCart/:pid", async (req, res, next)=>{

  try {
    var product = await Product.findById(req.params.pid);
    // console.log(product, req.UserInfo, "inside carts");
    if(product.quantity >= req.body.quantity); {
      req.body.item = product._id;
      req.body.cart = req.UserInfo.cart;
      console.log(req.body,"cart");
      var item = await Item.findOne({item: product._id});
      console.log(item, "inside item");
      
      if(!item){
        var item = await Item.create(req.body);
        console.log(item, "create item");
      } else {
        var updatedItem = await Item.findByIdAndUpdate(item.id,{$inc: {quantity: req.body.quantity}}, {new:true});
        console.log(updatedItem, "updated");
      }
      var cart = await Cart.findOneAndUpdate(
        { userId: req.UserInfo.id},
        { $addToSet: {itemList: item.id}},
        { new:true}
      );
      console.log(cart, "inside cart");
    } 
    res.redirect("/products")
  } catch (error) {
    next (error)
  }
})

// Add product
router.get("/add", (req, res, next)=>{
    res.render("addProduct");
})
// Add product Post
router.post("/add", upload.single("imagePath"), async (req, res, next)=>{
    try {
        req.body.category = req.body.category.split(",").map(el => el.trim());
        // console.log(req.file);
        req.body.imagePath = req.file.filename;
        let product = await Product.create(req.body);
        console.log(product);
        res.redirect("/products")
    } catch (error) {
        next (error);
    }
});

// View single Product
router.get("/:id/view", async (req, res, next)=>{
  let product = await Product.findById(req.params.id);
  console.log(product);
  res.render("singleProduct", {product})
})

// Edit single Product
router.get("/:id/edit", async (req, res, next)=>{
  let product = await Product.findById(req.params.id);
  console.log(product);
  res.render("editProduct", {product});
});

// Update product
router.post("/:id/edit", upload.single("imagePath"), async (req, res, next)=>{
  try {
    console.log(req.body,"inside update")
    req.body.category = req.body.category.split(",").map(el => el.trim());
    req.body.imagePath = req.file.filename;
    let product = await Product.findByIdAndUpdate(req.params.id, req.body, {new: true});
    console.log(product);
    res.render("singleProduct", {product});
  } catch (error) {
    next (error)
  }
});

// Delete product
router.get("/:id/delete", async (req, res, next)=>{
  try {
    console.log(req.body,"delete")
    let deletedProduct = await Product.findByIdAndDelete(req.params.id);
    console.log(deletedProduct);
    res.redirect("/products");
  } catch (error) {
    next (error)
  }
});



module.exports = router;