const Product = require("./../models/productModel");
const Factory = require("./handleCrud");

exports.getAllProduct = Factory.getAll(Product);
exports.updateProduct = Factory.updateOne(Product);
exports.deleteProduct = Factory.deleteOne(Product);
exports.getProduct = Factory.getOne(Product);
exports.createProduct = Factory.creteOne(Product);

// Implement this for new arrivals and best sellers:

// ✅ Option 1: Dynamic Calculation (Recommended)
// Use existing fields like createdAt (for new arrivals) and ratings.count or sales count (if you track it) to dynamically sort products in your backend queries.

// 🔹 New Arrivals
// Sort by createdAt descending.

// Example:

// javascript
// Copy
// Edit
// const newArrivals = await Product.find().sort({ createdAt: -1 }).limit(10);
// 🔹 Best Sellers
// Sort by ratings.count descending (or sales if you implement it).

// Example:

// javascript
// Copy
// Edit
// const bestSellers = await Product.find().sort({ "ratings.count": -1 }).limit(10);
// ➡️ No changes needed in the schema!