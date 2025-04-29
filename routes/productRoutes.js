const express = require("express");
const passport = require("passport");
const productController = require("../controllers/productControlller");
const authController = require("../controllers/authController");
const userController = require("../controllers/userController");

const productRouter = express.Router();

// Load auth page (optional)
productRouter.get("/auth", authController.loadAuth);

// Route for Google Login
productRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback URL
productRouter.get(
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
productRouter.get("/auth/failure", authController.failureGoogleLogin);
productRouter.get("/me", authController.protect, authController.getMe);

productRouter.route("/sign-in").post(authController.singIn);
productRouter.route("/sign-up").post(authController.signup);
productRouter.route("/verify-email").post(authController.verifyEmail);
productRouter.route("/forget-password").post(authController.forgetPassword);
productRouter
  .route("/reset-password/:token")
  .patch(authController.resetPassword);
// productRouter.route("/google/").post(authController.googleLogin);

productRouter
  .route("/change-password")
  .patch(authController.protect, authController.changePassword);

productRouter
  .route("/")
  //   .all(authController.loadAuth) // apply auth before any method if needed
  //   .get(userController.getAllUsers)
  .post(productController.createProduct);

productRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = productRouter;
