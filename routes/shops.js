var express = require('express');
var router = express.Router();



router.get("/", (req, res, next)=>{
    console.log(req.UserInfo,"Anupam");
    
    res.render("shop", {email: req.UserInfo.email})
})


module.exports = router;