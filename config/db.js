const mongoose = require("mongoose");
const dns = require("dns");

let cachedConnection = null;

const connectDB = async () => {
    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured");
    }

    if (cachedConnection && mongoose.connection.readyState === 1) {
        return cachedConnection;
    }

    try {
        if (process.env.MONGODB_DNS_SERVERS) {
            dns.setServers(process.env.MONGODB_DNS_SERVERS.split(","));
        }

        cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false,
        });

        console.log("MongoDB Connected Successfully");

        return cachedConnection;
    } catch (error) {
        cachedConnection = null;
        console.error("MongoDB Connection Error:", error.message);
        throw error;
    }
};

module.exports = connectDB;