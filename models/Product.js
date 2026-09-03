const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        price: {
            type: Number,
            required: true,
            min: 0,
        },

        oldPrice: {
            type: Number,
            min: 0,
        },

        discount: {
            type: String,
            trim: true,
        },

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        imageUrl: {
            type: String,
            required: true,
            trim: true,
        },

        description: {
            type: String,
            trim: true,
        },

        category: {
            type: String,
            trim: true,
        },

        section: {
            type: String,
            enum: [
                "newArrivals",
                "topSelling",
                "youMightAlsoLike",
                "casual",
                "formal",
                "party",
                "gym",
            ],
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Product", productSchema);