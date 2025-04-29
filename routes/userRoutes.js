const express = require("express");
const passport = require("passport");
const { signToken } = require("../utils/jwtToken");
const userController = require("../controllers/userController");
const authController = require("../controllers/authController");
require("../middleware/passport");

const userRouter = express.Router();

// Load auth page (optional)
userRouter.get("/auth", authController.loadAuth);

// Route for Google Login
userRouter.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google callback URL
userRouter.get(
  "/auth/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/" }),
  (req, res) => {
    const token = signToken(req.user._id); // <-- generate JWT from user id
    res.redirect(
      `${process.env.FRONTEND_LIVE_HOST}/signin/success?token=${token}`
    );
    // or you can send JSON if API-only
    // res.json({ token });
  }
);

// Failure route
userRouter.get("/auth/failure", authController.failureGoogleLogin);
userRouter.get("/me", authController.protect, authController.getMe);

userRouter.route("/sign-in").post(authController.singIn);
userRouter.route("/sign-up").post(authController.signup);
userRouter.route("/verify-email").post(authController.verifyEmail);
userRouter.route("/forget-password").post(authController.forgetPassword);
userRouter.route("/reset-password/:token").patch(authController.resetPassword);
// userRouter.route("/google/").post(authController.googleLogin);

userRouter
  .route("/change-password")
  .patch(authController.protect, authController.changePassword);

userRouter
  .route("/")
  .all(authController.loadAuth) // apply auth before any method if needed
  .get(userController.getAllUsers);

userRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
