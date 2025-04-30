const Order = require("./../models/orderModel");
const Factory = require("./handleCrud");

exports.getAllUsers = Factory.getAll(Order);
exports.updateUser = Factory.updateOne(Order);
exports.deleteUser = Factory.deleteOne(Order);
exports.getUser = Factory.getOne(Order);
