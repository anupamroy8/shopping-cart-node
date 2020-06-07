var express = require("express");
var router = express.Router();
var Product = require("../models/product");
var path = require("path");
var Cart = require("../models/cart");
var Item = require("../models/ItemList");
var Review = require("../models/review");
var auth = require("../middlewares/auth");
var app = express();

// multer
var multer = require("multer");

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/images/uploads"));
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});

var upload = multer({ storage: storage });

// Products List
router.get("/", async (req, res, next) => {
  try {
    if (!req.UserInfo.isVerified && !req.UserInfo.isAdmin) {
      console.log("User not verified");
      return res.render("verifyForm", { email: req.UserInfo.email });
    }
    var filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }
    let products = await Product.find(filter);
    // console.log(products);
    if (req.UserInfo) {
      var cartid = req.UserInfo.cart;
      var item = await Item.find({ cart: cartid });
      // console.log(item)
    }
    let categories = await Product.distinct("category");
    // let categories = await Product.find({},{category:1, _id:0});
    var msg = req.flash("mymsg");
    res.render("product", {
      products,
      email: req.UserInfo.email,
      item,
      categories,
      msg
    });
  } catch (error) {
    next(error);
  }
});

// Search Products

router.post("/search", async (req, res, next) => {
  try {
    console.log(req.body.search, "sssss");
    var search = req.body.search;
    let products = await Product.find({
      title: { $regex: search, $options: "i" },
    });
    console.log(products);
    if (req.UserInfo) {
      var cartid = req.UserInfo.cart;
      var item = await Item.find({ cart: cartid });
      console.log(item);
    }
    let categories = await Product.distinct("category");
    // let categories = await Product.find({},{category:1, _id:0});
    var msg = req.flash("mymsg")
    res.render("product", {
      products,
      email: req.UserInfo.email,
      item,
      categories,
      msg
    });
  } catch (error) {
    next(error);
  }
});

app.use(auth.checkUserLogged);

// GET Cart
router.get("/:id/mycart", async (req, res, next) => {
  var cart = await Cart.findOne({ userId: req.UserInfo.id });
  var displayCart = await Item.find({ cart: cart.id })
    .populate("item", "title price category description imagePath")
    .exec();
  console.log(displayCart, "displayCart");
  res.render("displayCart", { displayCart });
});

// Delete Item from Cart
router.get("/:id/deleteCart", async (req, res, next) => {
  var item = await Item.findById(req.params.id);
  console.log(item, req.params, "delete item");
  var product = await Product.findByIdAndUpdate(item.item, {
    $inc: { quantity: item.quantity },
  });
  var cart = await Cart.findByIdAndUpdate(item.cart, {
    $pull: { itemList: item.id },
  });
  var deleteItem = await Item.findByIdAndDelete(req.params.id);
  res.redirect(`/products/${req.UserInfo.id}/mycart`);
});

// Product add to cart
router.post("/addToCart/:pid", async (req, res, next) => {
  try {
    var product = await Product.findById(req.params.pid);
    var cart = await Cart.findById(req.UserInfo.cart);
    console.log(product, cart, "inside carts");
    if (product.quantity >= req.body.quantity)
    {
      var item = await Item.findOne({ item: product._id, cart: cart.id });
      console.log(item, "inside item");

      if (!item) {
        req.body.item = product.id;
        req.body.cart = cart.id;
        var item = await Item.create(req.body);
        console.log(item, "created item");
      } else {
        var updatedItem = await Item.findByIdAndUpdate(
          item.id,
          {
            $inc: { quantity: req.body.quantity },
          },
          { new: true }
        );
        console.log(updatedItem, "updated");
      }
      var cart = await Cart.findOneAndUpdate(
        { userId: req.UserInfo.id },
        { $addToSet: { itemList: item.id } },
        { new: true }
      );
      var updateProduct = await Product.findByIdAndUpdate(
        product.id,
        { $inc: { quantity: -req.body.quantity } },
        { new: true }
      );
      console.log(updateProduct, "product updateeed");
      req.flash("mymsg", `${updateProduct.title} added to cart successfully`)
      res.redirect("/products");
    } else {
      req.flash("mymsg", "Not enough quantity")
      res.redirect("/products");
    }
  } catch (error) {
    next(error);
  }
});

// update cart
router.post("/updateToCart/:pid", async (req, res, next) => {
  try {
    var product = await Product.findById(req.params.pid);
    var cart = await Cart.findById(req.UserInfo.cart);
    console.log(product, cart, "inside carts");
    if (product.quantity >= req.body.quantity)
    {
      var item = await Item.findOne({ item: product._id, cart: cart.id });
      console.log(item, "inside item");

      if (!item) {
        req.body.item = product.id;
        req.body.cart = cart.id;
        var item = await Item.create(req.body);
        console.log(item, "created item");
      } else {
        var updatedItem = await Item.findByIdAndUpdate(
          item.id,
          { quantity: req.body.quantity },
          { new: true }
        );
        console.log(updatedItem, "updated");
      }
      var cart = await Cart.findOneAndUpdate(
        { userId: req.UserInfo.id },
        { $addToSet: { itemList: item.id } },
        { new: true }
      );
      var updateProduct = await Product.findByIdAndUpdate(
        product.id,
        { $inc: { quantity: -req.body.quantity } },
        { new: true }
      );
      console.log(updateProduct, "product updateeed");
      res.redirect(`/products/${req.UserInfo.id}/mycart`);
    } else {
      req.flash("mymsg", "Not enough quantity")
      res.redirect(`/products/${req.UserInfo.id}/mycart`);
    }
  } catch (error) {
    next(error);
  }
});

// Add product
router.get("/add", (req, res, next) => {
  res.render("addProduct");
});
// Add product Post
router.post("/add", upload.single("imagePath"), async (req, res, next) => {
  try {
    req.body.category = req.body.category.split(",").map((el) => el.trim());
    if (req.file) {
      req.body.imagePath = req.file.filename;
    }
    let product = await Product.create(req.body);
    console.log(product);
    res.redirect("/products");
  } catch (error) {
    next(error);
  }
});

// View single Product
router.get("/:id/view", async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);
    console.log(product);
    if (req.UserInfo) {
      var cartid = req.UserInfo.cart;
      var item = await Item.find({ cart: cartid });
      console.log(item);
    }
    let reviews = await Review.find({ productId: product.id }).populate(
      "author"
    );
    console.log(reviews, "test");
    res.render("singleProduct", {
      product,
      email: req.UserInfo.email,
      item,
      reviews,
    });
  } catch (error) {
    next(error);
  }
});

// Review of a Product
router.post("/:id/review", async (req, res, next) => {
  try {
    var productId = req.params.id;
    req.body.productId = productId;
    req.body.author = req.UserInfo.id;
    let reviewCreated = await Review.create(req.body);
    console.log(reviewCreated);
    let updateProduct = await Product.findByIdAndUpdate(productId, {
      $push: { reviews: (await reviewCreated).id },
    });
    res.redirect(`/products/${productId}/view`);
  } catch (error) {
    next(error);
  }
});

// Delete Review
router.get("/:id/deleteReview", async (req, res, next) => {
  var reviewId = req.params.id;
  var deletedReview = await Review.findByIdAndDelete(reviewId);
  var updateProduct = await Product.findByIdAndUpdate(deletedReview.productId, {
    $pull: { reviews: deletedReview.id },
  });
  res.redirect(`/products/${deletedReview.productId}/view`);
});

// Edit Review
router.get("/:id/editReview", async (req, res, next) => {
  try {
    var reviewId = req.params.id;
    var editReview = await Review.findById(reviewId);
    res.render("editReview", { editReview });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/editReview", async (req, res, next) => {
  try {
    var reviewId = req.params.id;
    var editReview = await Review.findByIdAndUpdate(reviewId, req.body);
    res.redirect(`/products/${editReview.productId}/view`);
  } catch (error) {
    next(error);
  }
});

// Edit single Product
router.get("/:id/edit", async (req, res, next) => {
  let product = await Product.findById(req.params.id);
  console.log(product);
  res.render("editProduct", { product });
});

// Update product
router.post("/:id/edit", upload.single("imagePath"), async (req, res, next) => {
  try {
    if (req.file) {
      req.body.imagePath = req.file.filename;
    }
    console.log(req.body, "inside update");
    req.body.category = req.body.category.split(",").map((el) => el.trim());
    let product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    console.log(product);
    // res.render("singleProduct", {product});
    res.redirect("/products");
  } catch (error) {
    next(error);
  }
});

// Delete product
router.get("/:id/delete", async (req, res, next) => {
  try {
    console.log(req.body, "delete");
    let deletedProduct = await Product.findByIdAndDelete(req.params.id);
    console.log(deletedProduct);
    res.redirect("/products");
  } catch (error) {
    next(error);
  }
});

// Checkout
router.get("/checkout", async (req,res,next)=>{
  res.render("checkout");
})


module.exports = router;
