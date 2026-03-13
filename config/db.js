const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error("❌ ERROR: MONGO_URI is not defined in environment variables.");
      process.exit(1);
    }
    
    // Log a masked version of the URI for debugging (hiding password)
    const maskedUri = uri.replace(/:([^@]+)@/, ":****@");
    console.log(`Attempting to connect to MongoDB: ${maskedUri}`);

    await mongoose.connect(uri);

    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
