const express = require("express");

const Cart = require("../models/cart");
const Product = require("../models/Product");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// ==========================
// ADD TO CART
// ==========================
router.post("/add", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "productId is required",
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1",
            });
        }

        const product = await Product.findOne({
            productId: String(productId),
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        let cart = await Cart.findOne({
            user: req.user.userId,
        });

        if (!cart) {
            cart = await Cart.create({
                user: req.user.userId,
                items: [
                    {
                        product: product._id,
                        quantity,
                    },
                ],
            });
        } else {
            const existingItem = cart.items.find(
                (item) =>
                    item.product.toString() ===
                    product._id.toString()
            );

            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.items.push({
                    product: product._id,
                    quantity,
                });
            }

            await cart.save();
        }

        await cart.populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart,
        });

    } catch (error) {
        console.error("Add Cart Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add product to cart",
        });
    }
});


// ==========================
// GET CART
// ==========================
router.get("/", authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.user.userId,
        }).populate("items.product");

        if (!cart) {
            return res.status(200).json({
                success: true,
                message: "Cart is empty",
                cart: {
                    items: [],
                },
                totalItems: 0,
                totalPrice: 0,
            });
        }

        let totalItems = 0;
        let totalPrice = 0;

        cart.items.forEach((item) => {
            totalItems += item.quantity;

            if (item.product) {
                totalPrice +=
                    item.product.price * item.quantity;
            }
        });

        return res.status(200).json({
            success: true,
            cart,
            totalItems,
            totalPrice,
        });

    } catch (error) {
        console.error("Get Cart Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch cart",
        });
    }
});


// ==========================
// UPDATE CART
// ==========================
router.put("/update", authMiddleware, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "productId and quantity are required",
            });
        }

        const product = await Product.findOne({
            productId: String(productId),
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const cart = await Cart.findOne({
            user: req.user.userId,
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        const item = cart.items.find(
            (item) =>
                item.product.toString() ===
                product._id.toString()
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                message: "Product is not in cart",
            });
        }

        // Quantity 0 ya less = remove
        if (quantity <= 0) {
            cart.items = cart.items.filter(
                (item) =>
                    item.product.toString() !==
                    product._id.toString()
            );
        } else {
            item.quantity = quantity;
        }

        await cart.save();
        await cart.populate("items.product");

        return res.status(200).json({
            success: true,
            message: "Cart updated successfully",
            cart,
        });

    } catch (error) {
        console.error("Update Cart Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update cart",
        });
    }
});


// ==========================
// REMOVE FROM CART
// ==========================
router.delete(
    "/remove/:productId",
    authMiddleware,
    async (req, res) => {
        try {
            const { productId } = req.params;

            console.log(
                "REMOVE PRODUCT ID:",
                productId
            );

            console.log(
                "USER ID:",
                req.user.userId
            );

            // Product ko custom productId se find karo
            const product = await Product.findOne({
                productId: String(productId),
            });

            if (!product) {
                console.log(
                    "PRODUCT NOT FOUND:",
                    productId
                );

                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${productId}`,
                });
            }

            console.log(
                "FOUND PRODUCT MONGO ID:",
                product._id.toString()
            );

            // MongoDB cart se item directly remove
            const updatedCart =
                await Cart.findOneAndUpdate(
                    {
                        user: req.user.userId,
                        "items.product": product._id,
                    },
                    {
                        $pull: {
                            items: {
                                product: product._id,
                            },
                        },
                    },
                    {
                        new: true,
                    }
                ).populate("items.product");

            if (!updatedCart) {
                console.log(
                    "PRODUCT NOT FOUND IN USER CART"
                );

                return res.status(404).json({
                    success: false,
                    message: "Product is not in cart",
                });
            }

            console.log(
                "PRODUCT REMOVED SUCCESSFULLY"
            );

            return res.status(200).json({
                success: true,
                message: "Product removed from cart",
                cart: updatedCart,
            });

        } catch (error) {
            console.error(
                "Remove Cart Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to remove product",
                error: error.message,
            });
        }
    }
);


// ==========================
// CLEAR CART
// ==========================
router.delete(
    "/clear",
    authMiddleware,
    async (req, res) => {
        try {
            const cart = await Cart.findOne({
                user: req.user.userId,
            });

            if (!cart) {
                return res.status(404).json({
                    success: false,
                    message: "Cart not found",
                });
            }

            cart.items = [];

            await cart.save();

            return res.status(200).json({
                success: true,
                message: "Cart cleared successfully",
                cart,
            });

        } catch (error) {
            console.error(
                "Clear Cart Error:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to clear cart",
            });
        }
    }
);


module.exports = router;

