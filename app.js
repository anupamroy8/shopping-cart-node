var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var session = require("express-session");
const MongoStore = require("connect-mongo")(session);
var auth = require("./middlewares/auth");
var passport = require("passport");
var flash = require("connect-flash");
var stripe = require("stripe")(
  "sk_test_51GqjRpIOBWTLG7Fdo9VtAyWRnmUY3JB4s07BhpEzWBsiw3G8aH2aCtL7sADAkZTK7THOeiYAdcl2aZSooDvK8RCM00tonaKCnH"
);

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var shopsrouter = require("./routes/shops");
var productsrouter = require("./routes/products");

// DB connect
mongoose.connect(
  "mongodb+srv://admin:myadmin@123@cluster0.h5oil.mongodb.net/shopping-cart?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    console.log("connected", err ? err : true);
  }
);

// dotenv & passport
require("dotenv").config();
require("./modules/passport");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// SESSION
app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

// passport initialize
app.use(passport.initialize());
// passport session
app.use(passport.session());

// routers
app.use(flash());
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use(auth.checkUserLogged);
app.use(auth.UserInfo);
app.use("/shops", shopsrouter);
app.use("/products", productsrouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
