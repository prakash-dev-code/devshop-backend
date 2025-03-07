const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const globalErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoutes");

// Global middleware

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// check development environment

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// define routes
app.use("/api/v1/users", userRoutes);
// define routes

app.get("/", (req, res) => {
  console.log("Root GET route hit");
  res.status(200).json({
    message: "Server is running successfully",
  });
});


// custom error handler middleware start

app.use(globalErrorHandler);
// custom error handler middleware end

module.exports = app;
