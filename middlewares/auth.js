var User = require("../models/user");
var Admin = require("../models/admin");

exports.checkUserLogged = (req, res, next)=>{
    console.log(req.session)
    if(req.session.userId || req.session.passport.user)  {  
        next()
    } 
    else {
        res.redirect("/")       
    }
};

exports.UserInfo = (req, res, next)=>{
    if(req.session.userId) {
        User.findById(req.session.userId, "-password", function(err, user) {
            if(err) return next(err);
            req.UserInfo = user;
            res.locals.user = user;
            console.log(req.UserInfo,"userrr infor");
            next()
        })
    } else if(req.session.passport.user) {
        Admin.findById(req.session.passport.user, "-password",function(err, user) {
            if(err) return next(err);
            console.log(user, "user info passsporttt");
            res.locals.user = user;
            req.UserInfo = user;
            next()
        })
    }   
    else {
        req.UserInfo = null;
        res.locals.user = null;
        next();
    }
}