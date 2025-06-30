const Product = require("./../models/productModel");
const Factory = require("./handleCrud");
const { uploadFileToS3, deleteFilesFromS3 } = require("../config/s3");

exports.getAllProduct = Factory.getAll(Product);
// exports.updateProduct = Factory.updateOne(Product);
exports.deleteProduct = Factory.deleteOne(Product);
exports.getProduct = Factory.getOne(Product);
exports.createProduct = async (req, res) => {
  const uploadedKeys = [];

  try {
    const { name, description, price, discountedPrice, category, stock } =
      req.body;

    if (!name || !price) {
      return res
        .status(400)
        .json({ success: false, message: "Name and price are required" });
    }

    const imageData = await Promise.all(
      (req.files || []).map(async (file, i) => {
        const { url, key } = await uploadFileToS3(
          file.buffer,
          file.originalname,
          file.mimetype
        );
        uploadedKeys.push(key); // Store in case we need to rollback

        return {
          url,
          altText: req.body[`altText${i}`] || `Image ${i + 1}`,
        };
      })
    );

    const product = await Product.create({
      name,
      description,
      price: parseFloat(price),
      discountedPrice: parseFloat(discountedPrice),
      category,
      stock: parseInt(stock),
      seller: req.user._id,
      images: imageData,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Create Product Error:", error);

    // Cleanup uploaded images if product creation failed
    await deleteFilesFromS3(uploadedKeys);

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

exports.updateProduct = async (req, res) => {
  const uploadedKeys = [];

  try {
    const productId = req.params.id;

    // 1. Find existing product
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // 2. Extract and validate fields
    const updatedFields = {};

    if (req.body.name) updatedFields.name = req.body.name;
    if (req.body.description) updatedFields.description = req.body.description;

    if (req.body.price !== undefined && req.body.price !== "") {
      const parsedPrice = parseFloat(req.body.price);
      if (isNaN(parsedPrice)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid price format" });
      }
      updatedFields.price = parsedPrice;
    }

    if (
      req.body.discountedPrice !== undefined &&
      req.body.discountedPrice !== ""
    ) {
      const parsedDiscountedPrice = parseFloat(req.body.discountedPrice);
      if (isNaN(parsedDiscountedPrice)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid discounted price" });
      }
      updatedFields.discountedPrice = parsedDiscountedPrice;
    }

    if (req.body.category) updatedFields.category = req.body.category;

    if (req.body.stock !== undefined && req.body.stock !== "") {
      const parsedStock = parseInt(req.body.stock);
      if (isNaN(parsedStock)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid stock value" });
      }
      updatedFields.stock = parsedStock;
    }

    // 3. Handle new image uploads (replace old images completely)
    if (req.files && req.files.length > 0) {
      // Delete all existing product images from S3
      const keysToDelete = product.images.map(
        (img) => img.url.split(".amazonaws.com/")[1]
      );
      if (keysToDelete.length > 0) {
        await deleteFilesFromS3(keysToDelete);
      }

      // Upload new images
      const newImages = await Promise.all(
        req.files.map(async (file, i) => {
          const { url, key } = await uploadFileToS3(
            file.buffer,
            file.originalname,
            file.mimetype
          );
          uploadedKeys.push(key);
          return {
            url,
            altText: req.body[`altText${i}`] || `Image ${i + 1}`,
          };
        })
      );

      // Replace image array completely
      updatedFields.images = newImages;
    }

    // 4. Update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updatedFields,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product Error:", error);

    // Rollback uploaded S3 images if update fails
    if (uploadedKeys.length > 0) {
      await deleteFilesFromS3(uploadedKeys);
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
