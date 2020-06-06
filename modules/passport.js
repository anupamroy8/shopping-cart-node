var passport = require("passport")
var githubStrategy = require("passport-github").Strategy;
var Admin = require("../models/admin");


passport.use(
    new githubStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "https://shopping-cart-node-anupam.herokuapp.com/auth/github/callback"
        },
        (accessToken, refreshToken, profile, done)=>{
            var newAdmin = {
                username: profile._json.name,
                email: profile._json.email,
                avatar: profile._json.avatar_url,
            };
            console.log(profile);
            
            Admin.findOne( {email: profile._json.email}, (err, admin) =>{
                if(err) return done(null, false);
                if(!admin) {
                    Admin.create(newAdmin, (err, admin)=>{
                        console.log(admin, "new admin created");
                        done(null, admin)
                    });
                } else {
                    console.log(admin, "admin exists");
                    done(null, admin)
                }
            })
        }
    )
)

passport.serializeUser((admin, done)=>{
    console.log(admin, "serializeUser");
    done(null, admin._id)  
})

passport.deserializeUser((id, done)=>{
    console.log(id, "deserializeUser");
    Admin.findById(id, (err, admin) => {
        if (err) return done(err, false)
        done(null, admin);
    })
})
