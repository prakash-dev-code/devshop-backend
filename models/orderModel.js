const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Order must belong to a user"],
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
      },
    ],
    shippingAddress: {
      type: {
        location: String,
        phone: String,
      },
      required: true,
    },
    billingAddress: {
      type: {
        location: String,
        phone: String,
      },
      required: true,
    },
    payment: {
      method: {
        type: String,
        enum: ["credit_card", "paypal", "stripe", "cod"],
        required: true,
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed", "refunded"],
        default: "pending",
      },
      transactionId: String,
      amount: {
        type: Number,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled", "returned"],
      default: "processing",
    },
    total: {
      subtotal: Number,
      shipping: Number,
      tax: Number,
      discount: Number,
      grandTotal: {
        type: Number,
        required: true,
      },
    },
    tracking: {
      carrier: String,
      number: String,
      url: String,
    },
    notes: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
orderSchema.index({ user: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

// Virtual populate with reviews
orderSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "order",
  localField: "_id",
});

// Query middleware
orderSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name email photo",
  }).populate({
    path: "items.product",
    select: "name images",
  });
  next();
});

module.exports = mongoose.model("Order", orderSchema);
