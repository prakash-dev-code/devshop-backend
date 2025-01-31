const crypto = require("crypto");
const { promisify } = require("util");
const sendEmail = require("./../utils/email");
const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");
const appError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

const jwtToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// protected controller

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1. Getting token and checking if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new appError("You are not authorized", 401));
  }

  try {
    // 2. Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 3. Check if user still exists
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new appError("User does not exist anymore", 401));
    }

    // 4. Check if user changed password after JWT token was generated
    if (currentUser.changePasswordAfter(decoded.iat)) {
      return next(
        new appError("Password has been changed, please login again", 401)
      );
    }

    // Grand access

    req.user = currentUser;

    // Add the currentUser to the request object for further middlewares

    next();
  } catch (err) {
    // Handle specific JWT errors or other errors
    if (err.name === "JsonWebTokenError") {
      return next(new appError("Token is not valid", 401));
    } else if (err.name === "TokenExpiredError") {
      return next(new appError("Token has expired", 401));
    } else {
      return next(
        new appError("Something went wrong with token verification", 401)
      );
    }
  }
});

// protected controller

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  //   createSendToken(newUser, 201, res);

  const token = jwtToken(newUser._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: newUser,
    },
  });
});

exports.singIn = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new appError("Please provide email and password", 404));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user?.password))) {
    return next(new appError("Incorrect email or password", 401));
  }
  const token = jwtToken(user._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
});

exports.forgetPassword = async function (req, res, next) {
  const userByEmail = await User.findOne({ email: req.body.email });
  if (!userByEmail)
    return next(new appError("no user found with provided email", 404));

  const resetToken = await userByEmail.createResetPasswordToken();

  await userByEmail.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Visit ${resetURL} to reset your password.`;

  try {
    await sendEmail({
      email: userByEmail.email,
      subject: "Password Reset Token valid for only 10 minutes",
      text: message,
    });
    res.status(200).json({
      status: "success",
      message: "Reset password email sent to your email address.",
    });
  } catch (error) {
    userByEmail.resetPasswordToken = undefined;
    userByEmail.resetPasswordExpires = undefined;
    await userByEmail.save({ validateBeforeSave: false });
    return next(new appError("Couldn't send email , Try again later.", 500));
  }
};
exports.resetPassword = catchAsync(async (req, res, next) => {
  //1. Get user based on token

  const hashToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2. if token is not expired then set new password
  if (!user) {
    return next(new appError("Token is invalid or expired", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  //3. update changePasswordAt property for user
  await user.save();

  //4.  Log the user in ,send the JWT token

  const token = jwtToken(user._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  //1 Get user from collection

  const user = await User.findById(req.user.id).select("+password");

  //2. Check if posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new appError("Your current password is wrong ", 401));
  }

  //3. if So, update current password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  const token = jwtToken(user._id);

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: user,
    },
  });

  //4. log user and send JWT token
});

// authorized some role to delete a tour

exports.ristrictTour = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new appError("You are not authorized to perform this action", 403)
      );
    }
    next();
  };
};
// authorized some role to delete a tour
