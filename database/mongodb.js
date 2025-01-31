const mongoose = require("mongoose");

const DB_URL = process.env.MONGODB_ADDRESS;
console.log(DB_URL);

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL, {
      useNewUrlParser: true,
    });

    console.log("Connected to Mongo successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
