// Load environment variables FIRST
const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");


// Create Express app
const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());

app.use(express.json());


// ===============================
// DATABASE MIDDLEWARE
// ===============================

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error(
            "Database Middleware Error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Database connection failed",
        });
    }
});


// ===============================
// ROOT ROUTE
// ===============================

app.get("/", (req, res) => {
    res.status(200).send("E-Commerce Backend is running");
});


// ===============================
// ROUTES
// ===============================

app.use("/auth", authRoutes);

app.use("/products", productRoutes);

app.use("/cart", cartRoutes);


// ===============================
// 404 HANDLER
// ===============================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});


// ===============================
// ERROR HANDLER
// ===============================

app.use((err, req, res, next) => {
    console.error("Global Error:", err);

    res.status(500).json({
        success: false,
        message: "Internal server error",
    });
});


// ===============================
// LOCAL DEVELOPMENT
// ===============================

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 8000;

    app.listen(PORT, () => {
        console.log(
            `Server running on http://localhost:${PORT}`
        );
    });
}


// ===============================
// VERCEL EXPORT
// ===============================

module.exports = app;