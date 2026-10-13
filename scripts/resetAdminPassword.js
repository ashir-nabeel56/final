require("dotenv").config();

const readline = require("node:readline");
const { createInterface } = require("node:readline/promises");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const User = require("../models/User");

const promptHidden = (question) =>
    new Promise((resolve, reject) => {
        const input = process.stdin;
        if (!input.isTTY || typeof input.setRawMode !== "function") {
            reject(new Error("Run this command in an interactive terminal."));
            return;
        }

        process.stdout.write(question);
        readline.emitKeypressEvents(input);
        input.setRawMode(true);
        input.resume();

        let value = "";
        const cleanup = () => {
            input.removeListener("keypress", onKeypress);
            input.setRawMode(false);
            input.pause();
            process.stdout.write("\n");
        };
        const onKeypress = (character, key = {}) => {
            if (key.ctrl && key.name === "c") {
                cleanup();
                reject(new Error("Password reset cancelled."));
                return;
            }
            if (key.name === "return" || key.name === "enter") {
                cleanup();
                resolve(value);
                return;
            }
            if (key.name === "backspace") {
                value = value.slice(0, -1);
                return;
            }
            if (character && !key.ctrl && !key.meta) {
                value += character;
            }
        };

        input.on("keypress", onKeypress);
    });

const main = async () => {
    const prompt = createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    const email = (await prompt.question("Existing admin email: "))
        .trim()
        .toLowerCase();
    prompt.close();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Enter a valid admin email address.");
    }

    const password = await promptHidden("New password (12+ characters): ");
    const confirmation = await promptHidden("Confirm new password: ");
    if (password.length < 12) {
        throw new Error("Password must be at least 12 characters.");
    }
    if (password !== confirmation) {
        throw new Error("Passwords do not match.");
    }

    await connectDB();
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
        throw new Error("No admin account found for that email.");
    }

    admin.password = await bcrypt.hash(password, 12);
    await admin.save();
    console.log("Admin password reset successfully.");
};

main()
    .catch((error) => {
        console.error(`Admin password reset failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
