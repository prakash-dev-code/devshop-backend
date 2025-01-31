const dotenv = require("dotenv");

dotenv.config({ path: "./.env.local" });
const connectDB = require("./database/mongodb");
const app = require("./app");
const PORT = process.env.PORT;

connectDB();

const server = app.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});

// Errors Outside Express: Unhandled Rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION, SHUTTING DOWN...");
  console.error(err);

  // Gracefully shut down the server
  server.close(() => {
    console.log("Server closed");
    process.exit(1);
  });
});

// Errors Outside Express: Unhandled Rejections
