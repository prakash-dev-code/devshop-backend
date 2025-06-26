const express = require("express");
const productController = require("../controllers/productControlller");
// const passport = require("passport");
const authController = require("../controllers/authController");

const productRouter = express.Router();

// Load auth page (optional)

// public route
productRouter.get("/", productController.getAllProduct);

// private route
productRouter
  .route("/")
  .all(authController.protect, authController.ristrictUser("admin")) // apply auth before any method if needed
  .post(productController.createProduct);

productRouter
  .route("/:id")
  .get(productController.getProduct)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

module.exports = productRouter;
