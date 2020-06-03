var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var bcrypt = require("bcrypt");

var adminSchema = new Schema({
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
    },
    avatar: {
        type:String
    },
    isAdmin: {
        type:Boolean,
        default:true
    }
}, {timestamps:true},)


var Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;