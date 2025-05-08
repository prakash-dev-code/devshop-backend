const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const path = require("path");
const globalErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");

// Global middleware

const allowedOrigins = [
  process.env.FRONTEND_LOCAL_HOST_1,
  process.env.FRONTEND_LOCAL_HOST_2,
  process.env.FRONTEND_LIVE_HOST,
  "http://localhost:8000/graphql",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// check development environment

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// define routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/products", productRoutes);
// define routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// custom error handler middleware start

app.use(globalErrorHandler);
// custom error handler middleware end

module.exports = app;
