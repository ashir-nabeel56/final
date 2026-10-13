
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        shippingInfo: {
            type: new mongoose.Schema(
                {
                    fullName: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    email: {
                        type: String,
                        required: true,
                        trim: true,
                        lowercase: true,
                        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    },
                    phone: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    address: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    city: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                    postalCode: {
                        type: String,
                        required: true,
                        trim: true,
                    },
                },
                { _id: false }
            ),
            required: true,
        },

        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },

                price: {
                    type: Number,
                    required: true,
                    min: 0,
                },
            },
        ],

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        discount: {
            type: Number,
            required: true,
            min: 0,
        },

        deliveryFee: {
            type: Number,
            required: true,
            min: 0,
        },

        totalPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", orderSchema);



// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//     {
//         user: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },

//         items: [
//             {
//                 product: {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: "Product",
//                     required: true,
//                 },

//                 quantity: {
//                     type: Number,
//                     required: true,
//                     min: 1,
//                 },

//                 price: {
//                     type: Number,
//                     required: true,
//                     min: 0,
//                 },
//             },
//         ],

//         totalPrice: {
//             type: Number,
//             required: true,
//             min: 0,
//         },

//         status: {
//             type: String,
//             enum: [
//                 "pending",
//                 "processing",
//                 "shipped",
//                 "delivered",
//                 "cancelled",
//             ],
//             default: "pending",
//         },
//     },
//     {
//         timestamps: true,
//     }
// );

// module.exports = mongoose.model("Order", orderSchema);