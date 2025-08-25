const mongoose = require("mongoose")

// Function to connect to MongoDB
async function connectDb() {
    try {
        // connect to mongodb using the connection string from the environment variables
        await mongoose.connect(process.env.MONGODB_URL)
    } catch (error) {
        console.log("❌ MongoDb connection error:", error.message)
    }
}

module.exports = connectDb
