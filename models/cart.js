var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    itemList: [{
        type: Schema.Types.ObjectId,
        ref: "ItemList",
    }],

}, {timestamps:true},)


var Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;