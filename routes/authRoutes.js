const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const router = express.Router();



// SIGNUP
// POST /auth/signup
// ===============================

router.post("/signup", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Name, email and password are required",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters",
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        const existingUser = await User.findOne({
            email: cleanEmail,
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            name: name.trim(),
            email: cleanEmail,
            password: hashedPassword,
            role: "user",
        });

        return res.status(201).json({
            success: true,
            message: "User registered successfully",

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const cleanEmail = email.toLowerCase().trim();

        const user = await User.findOne({
            email: cleanEmail,
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

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

        if (!process.env.JWT_SECRET) {
            console.error("JWT_SECRET is missing");

            return res.status(500).json({
                success: false,
                message: "JWT configuration is missing",
            });
        }


        // ===============================
        // CREATE JWT
        // ===============================

        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );


        // ===============================
        // RESPONSE
        // ===============================

        return res.status(200).json({
            success: true,
            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
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
// GET ALL USERS
// GET /auth/users
// ===============================

router.get("/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");

        return res.status(200).json({
            success: true,
            count: users.length,
            users,
        });
    } catch (error) {
        console.error("Get Users Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching users",
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


module.exports = router;