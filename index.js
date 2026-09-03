const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");


// Load environment variables
dotenv.config();


// Create Express app
const app = express();


// ===============================
// MIDDLEWARE
// ===============================

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());


// ===============================
// DATABASE MIDDLEWARE
// ===============================

app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database Middleware Error:", error.message);

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
// LOCAL DEVELOPMENT SERVER
// ===============================

if (process.env.NODE_ENV !== "production") {
    const PORT = process.env.PORT || 8000;

    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on http://localhost:${PORT}`);
            });
        })
        .catch((error) => {
            console.error("Server startup failed:", error.message);
            process.exit(1);
        });
}


// Export for Vercel
module.exports = app;