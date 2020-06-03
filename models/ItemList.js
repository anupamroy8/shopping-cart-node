var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var itemSchema = new Schema({
    item: {
        type: Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
        type:Number,
        default:0,
    },
    cart: {
        type:Schema.Types.ObjectId,
        ref:"Cart"
    }

}, {timestamps:true},)


var ItemList = mongoose.model("ItemList", itemSchema);

module.exports = ItemList;