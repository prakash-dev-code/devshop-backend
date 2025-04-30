// utils/generateOTP.js
exports.generateOTP = () =>
  Math.floor(100000 + Math.random() * 900000).toString();
