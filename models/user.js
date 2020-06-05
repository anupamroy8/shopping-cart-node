var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");

var userSchema = new Schema({
    username: {
        type:String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type:String,
    },
    isVerified: {
        type:Boolean,
        default:false
    },
    isBlocked: {
        type:Boolean,
        default:false
    },
    verificationCode: {
        type:String,
    },
    cart: {
        type: Schema.Types.ObjectId,
        ref:"Cart",
    },
    isAdmin: {
        type:Boolean,
        default:false
    },
}, {timestamps:true},)

userSchema.pre("save", function(next) {
    if(this.password && this.isModified("password")) {
        this.password = bcrypt.hashSync(this.password, 11)
        return next()
    }
    else next()
})

userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

var User = mongoose.model("User", userSchema);

module.exports = User;