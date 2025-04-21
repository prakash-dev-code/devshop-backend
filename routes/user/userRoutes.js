const express = require("express");
const userController = require("./../../controllers/userController");
const authController = require("./../../controllers/authController");

const userRouter = express.Router();

userRouter.route("/sign-in").post(authController.singIn);
userRouter.route("/sign-up").post(authController.signup);
userRouter.route("/verify-email").post(authController.verifyEmail);
userRouter.route("/forget-password").post(authController.forgetPassword);
userRouter.route("/reset-password/:token").patch(authController.resetPassword);
userRouter.route("/google/").post(authController.googleLogin);
userRouter
  .route("/change-password")
  .patch(authController.protect, authController.changePassword);

userRouter.route("/").get(userController.getAllUsers);

userRouter
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = userRouter;
