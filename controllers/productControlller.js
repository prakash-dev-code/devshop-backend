const Product = require("./../models/productModel");
const Factory = require("./handleCrud");

exports.getAllUsers = Factory.getAll(Product);
exports.updateUser = Factory.updateOne(Product);
exports.deleteUser = Factory.deleteOne(Product);
exports.getUser = Factory.getOne(Product);
