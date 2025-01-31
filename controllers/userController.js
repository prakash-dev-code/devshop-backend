const User = require("./../models/userModel");
const Factory = require("./handleCrud");

exports.getAllUsers = Factory.getAll(User);
exports.updateUser = Factory.updateOne(User);
exports.deleteUser = Factory.deleteOne(User);
exports.getUser = Factory.getOne(User);
