var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var reviewSchema = new Schema(
    {
        content: {
            type: String,
            required:true
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        productId: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        }
    },{ timestamps:true }
);

module.exports = mongoose.model("Review", reviewSchema);