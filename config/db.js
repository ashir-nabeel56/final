const mongoose = require("mongoose");
const dns = require("dns");

// Wire up custom DNS servers from .env (fixes querySrv ECONNREFUSED
// caused by ISP/router not resolving _mongodb._tcp SRV records)
if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(process.env.MONGODB_DNS_SERVERS.split(","));
}

// Global cache
const globalForMongoose = global;

if (!globalForMongoose.mongoose) {
    globalForMongoose.mongoose = {
        conn: null,
        promise: null,
    };
}

const cached = globalForMongoose.mongoose;

const connectDB = async () => {

    // Already connected
    if (
        cached.conn &&
        mongoose.connection.readyState === 1
    ) {
        return cached.conn;
    }

    // Connection is already being established
    if (cached.promise) {
        cached.conn = await cached.promise;
        return cached.conn;
    }

    // Create new connection
    cached.promise = mongoose.connect(
        process.env.MONGODB_URI,
        {
            serverSelectionTimeoutMS: 5000,
            bufferCommands: false,
        }
    );

    try {

        cached.conn = await cached.promise;

        console.log("MongoDB Connected Successfully");

        return cached.conn;

    } catch (error) {

        cached.promise = null;
        cached.conn = null;

        console.error(
            "MongoDB Connection Error:",
            error.message
        );

        throw error;
    }
};

module.exports = connectDB;