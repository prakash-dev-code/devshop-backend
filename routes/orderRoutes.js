const express = require("express");
const passport = require("passport");
const orderController = require("../controllers/orderController");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const orderRouter = express.Router();

// Load auth page (optional)
orderRouter.get("/auth", authController.loadAuth);

// Route for Google Login
orderRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback URL
orderRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = signToken(req.user._id); // <-- generate JWT from user id
    res.redirect(`http://localhost:3000/signin/success?token=${token}`);
    // or you can send JSON if API-only
    // res.json({ token });
  }
);

// Failure route
orderRouter.get("/auth/failure", authController.failureGoogleLogin);
orderRouter.get("/me", authController.protect, authController.getMe);

orderRouter.route("/sign-in").post(authController.singIn);
orderRouter.route("/sign-up").post(authController.signup);
orderRouter.route("/verify-email").post(authController.verifyEmail);
orderRouter.route("/forget-password").post(authController.forgetPassword);
orderRouter.route("/reset-password/:token").patch(authController.resetPassword);
// orderRouter.route("/google/").post(authController.googleLogin);

orderRouter
  .route("/change-password")
  .patch(authController.protect, authController.changePassword);

orderRouter
  .route("/")
  .all(authController.loadAuth) // apply auth before any method if needed
  .get(userController.getAllUsers);

orderRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = orderRouter;
