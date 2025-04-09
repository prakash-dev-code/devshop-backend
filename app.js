const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const path = require("path");
const globalErrorHandler = require("./controllers/errorController");
const userRoutes = require("./routes/userRoutes");

// Global middleware

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// check development environment

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// define routes
app.use("/api/v1/users", userRoutes);
// define routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "home.html"));
});

// custom error handler middleware start

app.use(globalErrorHandler);
// custom error handler middleware end

module.exports = app;
