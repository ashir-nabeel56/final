const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();


// ===============================
// SIGNUP
// POST /auth/signup
// ===============================

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        // Password minimum length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        // Clean email
        const cleanEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await User.findOne({
            email: cleanEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Signup Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during signup",
        });
    }
});


// ===============================
// LOGIN
// POST /auth/login
// ===============================

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        // Clean email
        const cleanEmail = email.toLowerCase().trim();

        // Find user
        const user = await User.findOne({
            email: cleanEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Compare password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // Check JWT secret
        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "JWT configuration is missing",
            });
        }

        // Create JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });

    } catch (error) {
        console.error("Login Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error during login",
        });
    }
});


// ===============================
// LOGOUT
// POST /auth/logout
// ===============================

router.post("/logout", (req, res) => {
    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
});


// ===============================
// EXPORT ROUTER
// ===============================

module.exports = router;