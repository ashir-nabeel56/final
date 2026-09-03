const express = require("express");

const Product = require("../models/Product");
const productData = require("../data/product.json");

const router = express.Router();


// ===============================
// GET ALL PRODUCTS
// GET /products
// ===============================

router.get("/", async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1,
        });

        return res.status(200).json({
            success: true,
            count: products.length,
            products,
        });

    } catch (error) {
        console.error("Get Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch products",
        });
    }
});


// ===============================
// GET PRODUCTS BY CATEGORY
// GET /products/category/:categoryName
// ===============================

router.get("/category/:categoryName", async (req, res) => {
    try {
        const categoryName = req.params.categoryName;

        const products = await Product.find({
            category: {
                $regex: `^${categoryName}$`,
                $options: "i",
            },
        });

        return res.status(200).json({
            success: true,
            count: products.length,
            category: categoryName,
            products,
        });

    } catch (error) {
        console.error("Category Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch category products",
        });
    }
});


// ===============================
// ADD SINGLE PRODUCT
// POST /products
// ===============================

router.post("/", async (req, res) => {
    try {
        const {
            productId,
            title,
            price,
            oldPrice,
            discount,
            rating,
            imageUrl,
            description,
            category,
            section,
        } = req.body;

        // Required fields
        if (!productId || !title || price === undefined || !imageUrl) {
            return res.status(400).json({
                success: false,
                message: "productId, title, price and imageUrl are required",
            });
        }

        // Check duplicate product
        const existingProduct = await Product.findOne({
            productId,
        });

        if (existingProduct) {
            return res.status(409).json({
                success: false,
                message: "Product with this productId already exists",
            });
        }

        const product = await Product.create({
            productId,
            title,
            price,
            oldPrice,
            discount,
            rating,
            imageUrl,
            description,
            category,
            section,
        });

        return res.status(201).json({
            success: true,
            message: "Product added successfully",
            product,
        });

    } catch (error) {
        console.error("Add Product Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to add product",
        });
    }
});


// ===============================
// SEED PRODUCTS
// POST /products/seed
// ===============================

router.post("/seed", async (req, res) => {
    try {
        const sections = [
            "newArrivals",
            "topSelling",
            "youMightAlsoLike",
            "casual",
            "formal",
            "party",
            "gym",
        ];

        const productsToInsert = [];

        // Loop through every section
        sections.forEach((sectionName) => {
            const products = productData[sectionName] || [];

            products.forEach((product) => {
                productsToInsert.push({
                    ...product,
                    section: sectionName,
                });
            });
        });

        // Clear old products
        await Product.deleteMany({});

        // Insert new products
        const insertedProducts = await Product.insertMany(
            productsToInsert
        );

        return res.status(201).json({
            success: true,
            message: "Products seeded successfully",
            count: insertedProducts.length,
        });

    } catch (error) {
        console.error("Seed Products Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to seed products",
            error: error.message,
        });
    }
});


module.exports = router;