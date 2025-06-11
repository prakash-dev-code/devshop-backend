const User = require("./../models/userModel");
const Factory = require("./handleCrud");
const Product = require("./../models/productModel");
const mongoose = require("mongoose");

exports.getAllUsers = Factory.getAll(User);
exports.updateUser = Factory.updateOne(User);
exports.deleteUser = Factory.deleteOne(User);
exports.getUser = Factory.getOne(User);

exports.addToCart = async (req, res) => {
  try {
    // const { productId, quantity, discountedPrice } = req.body;

    const { productId } = req.body;
    const quantity = Number(req.body.quantity);
    const discountedPrice = Number(req.body.discountedPrice);

    if (!productId || isNaN(quantity) || isNaN(discountedPrice)) {
      return res.status(400).json({ message: "Missing or invalid fields" });
    }

    const user = await User.findById(req.user._id);

    const existingIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId
    );

    if (existingIndex !== -1) {
      user.cart[existingIndex].quantity += quantity;
      user.cart[existingIndex].discountedPrice = discountedPrice; // ✅ Fix
    } else {
      if (!mongoose.isValidObjectId(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      user.cart.push({
        product: new mongoose.Types.ObjectId(productId),
        quantity,
        discountedPrice,
      });
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      select: "name price images stock",
    });

    res.status(200).json({ message: "Cart updated", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId || !mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid or missing product ID" });
    }

    const user = await User.findById(req.user._id);

    const initialCartLength = user.cart.length;

    // Filter out the item to be removed
    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId
    );

    if (user.cart.length === initialCartLength) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    await user.save();

    await user.populate({
      path: "cart.product",
      select: "name price images stock",
    });

    res
      .status(200)
      .json({ message: "Item removed from cart", cart: user.cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};