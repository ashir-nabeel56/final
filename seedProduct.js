// Load environment variables FIRST
require("dotenv").config();

const mongoose = require("mongoose");
const dns = require("dns");

const Product = require("./models/Product");
const productsData = require("./data/product.json");

// =====================================
// CUSTOM DNS SERVERS
// =====================================
if (process.env.MONGODB_DNS_SERVERS) {
    dns.setServers(
        process.env.MONGODB_DNS_SERVERS.split(",")
    );
}


// =====================================
// SEED PRODUCTS
// =====================================
const seedProducts = async () => {
    try {

        // =====================================
        // CHECK MONGODB URI
        // =====================================
        if (!process.env.MONGODB_URI) {
            throw new Error(
                "MONGODB_URI is missing in .env file"
            );
        }


        // =====================================
        // CONNECT TO MONGODB
        // =====================================
        await mongoose.connect(
            process.env.MONGODB_URI,
            {
                serverSelectionTimeoutMS: 10000,
                bufferCommands: false,
            }
        );

        console.log("✅ MongoDB connected successfully");


        // =====================================
        // CONVERT ALL SECTIONS INTO PRODUCTS
        // =====================================
        const products = [

            ...productsData.newArrivals.map((product) => ({
                ...product,
                section: "newArrivals",
            })),

            ...productsData.topSelling.map((product) => ({
                ...product,
                section: "topSelling",
            })),

            ...productsData.youMightAlsoLike.map((product) => ({
                ...product,
                section: "youMightAlsoLike",
            })),

            ...productsData.casual.map((product) => ({
                ...product,
                section: "casual",
            })),

            ...productsData.formal.map((product) => ({
                ...product,
                section: "formal",
            })),

            ...productsData.party.map((product) => ({
                ...product,
                section: "party",
            })),

            ...productsData.gym.map((product) => ({
                ...product,
                section: "gym",
            })),
        ];


        console.log(
            `📦 Total products from JSON: ${products.length}`
        );


        // =====================================
        // REMOVE DUPLICATE PRODUCT IDs
        // =====================================
        const uniqueProducts = [
            ...new Map(
                products.map((product) => [
                    product.productId,
                    product,
                ])
            ).values(),
        ];


        console.log(
            `📦 Unique products: ${uniqueProducts.length}`
        );


        // =====================================
        // DELETE OLD PRODUCTS
        // =====================================
        await Product.deleteMany({});

        console.log("🗑️ Old products deleted");


        // =====================================
        // INSERT PRODUCTS AS INDIVIDUAL DOCUMENTS
        // =====================================
        await Product.insertMany(uniqueProducts);


        console.log(
            `✅ ${uniqueProducts.length} products inserted successfully`
        );


        // =====================================
        // CLOSE CONNECTION
        // =====================================
        await mongoose.connection.close();

        console.log("🔌 MongoDB connection closed");

        process.exit(0);

    } catch (error) {

        console.error(
            "❌ Seed error:",
            error.message
        );

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
        }

        process.exit(1);
    }
};


// =====================================
// RUN SEED
// =====================================
seedProducts();