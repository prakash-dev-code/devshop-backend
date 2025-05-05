const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const validator = require("validator");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "name is required"],
  },
  email: {
    type: String,
    required: [true, "emai is required"],
    unique: true,
    match: [/\S+@\S+\.\S+/, "Please enter a valid email"],
  },
  password: {
    type: String,
    required: function () {
      return !this.isOAuthUser; // 👈 Only required for normal signup
    },
    minlength: [8, "Password must be at least 8 characters long"],
    select: false,
  },

  googleId: {
    type: String,
    unique: true,
    sparse: true, // allows users to have an empty googleId until OAuth login
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    enum: ["admin", "user", "staff", "employee", "manager"],
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  isVerified: {
    type: Boolean,
    default: false,
  },
  otp: String,
  otpExpires: Date,
  bio: {
    type: String,
    maxlength: [150, "Bio cannot be longer than 150 characters"],
    trim: true,
  },
  addresses: {
    shipping: {
      type: {
        location: String,

        phone: String,
      },
      default: null,
    },
    billing: {
      type: {
        location: String,
        phone: String,
      },
      default: null,
    },
  },
  country: {
    type: String,
    validate: {
      validator: function (v) {
        return validator.isISO31661Alpha2(v);
      },
      message: "Invalid ISO 3166-1 alpha-2 country code",
    },
    uppercase: true,
  },
  orders: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
  ],
  cart: {
    type: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
          default: 1,
        },
        discountedPrice: {
          type: Number,
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

// 🕒 Set passwordChangedAt field
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// 🔍 Exclude inactive users

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
});

// check password is correct or not
userSchema.methods.correctPassword = async function (
  userPassword,
  userDbPassword
) {
  return await bcrypt.compare(userPassword, userDbPassword);
};
// check password is correct or not

// create reset password token
userSchema.methods.createResetPasswordToken = async function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("SHA256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //10 minutes

  return resetToken;
};

// create reset password token

// check password change after generated
userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changeTimeStamp;
  }

  // False means NOT changed
  return false;
};
// check password change after generated

module.exports = mongoose.model("User", userSchema);
