const crypto = require("crypto");
const { promisify } = require("util");
const sendEmail = require("./../utils/email");
const User = require("./../models/userModel");
const jwt = require("jsonwebtoken");
const appError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");
const { generateOTP } = require("./../utils/generateOTP");
const { signToken } = require("./../utils/jwtToken");

const frontendUrl = process.env.FRONTEND_LIVE_HOST;
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

exports.getMe = (req, res) => {
  res.status(200).json({
    status: "success",
    data: {
      user: req.user, // user is already set in protect middleware
    },
  });
};
// GOOGEL AUTH
exports.loadAuth = (req, res, next) => {
  res.render("auth");
};

exports.successGoogleLogin = (req, res) => {
  if (!req.user) res.redirect("/failure");
  console.log(req.user);
  res.send("WELCOME" + req.user.email);
};

exports.failureGoogleLogin = (req, res) => {
  res.send("Login failed");
};
// GOOGEL AUTH

// protected controller

exports.signup = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  const otp = generateOTP(); // e.g., 6-digit code
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  // const message = `Your OTP for email verification is: ${otp}`;
  const message = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Reset Password</title>

  <!-- Web Font / @font-face : BEGIN -->
  <!--[if mso]>
    <style>
      * {
        font-family: 'Roboto', sans-serif !important;
      }
    </style>
  <![endif]-->

  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
  <!--<![endif]-->

  <style>
    html,
    body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      font-family: 'Roboto', sans-serif !important;
      font-size: 14px;
      margin-bottom: 10px;
      line-height: 24px;
      color: #8094ae;
      font-weight: 400;
    }

    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }

    table,
    td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }

    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }

    table table table {
      table-layout: auto;
    }

    a {
      text-decoration: none;
    }

    img {
      -ms-interpolation-mode: bicubic;
    }
  </style>
</head>

<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f5f6fa; mso-line-height-rule: exactly;">

  <!-- Start Preheader -->
  <div class="preheader"
    style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Forgot your password? No worries — click the button below to reset it securely.
  </div>
  <!-- End Preheader -->

  <center style="width: 100%; background-color: #f5f6fa;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
      <tr>
        <td style="padding: 40px 0;">

          <!-- Logo Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding-bottom:25px">
                <a href="#">
                  <h2>Dev Shop</h3>
                </a>
              </td>
            </tr>
          </table>

          <!-- Main Content Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
            <tr>
              <td style="text-align:center;padding: 30px 30px 15px 30px;">
                <h2 style="font-size: 18px; color: #6576ff; font-weight: 600; margin: 0;">Verify your email</h2>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 0 30px 20px">

                <p style="margin-bottom: 25px;">Copy the OTP below to complete your verification.</p>
               <p style="font-size: 24px; font-weight: 600; color: #6576ff;">${otp}</p>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 20px 30px 40px">
                <p>If you did not request this, please contact us or ignore this message.</p>
                <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">
                  This is an automatically generated email. Please do not reply to this email. If you face any issues,
                  please contact us at
                  <a href="#" style="color: #6576ff;">devshop@gmail.com</a>
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding:25px 20px 0;">
                <p style="font-size: 13px;">
                  Copyright © 2025 Dev Shop. All rights reserved.

                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>

</html>
`;

  const existing = await User.findOne({ email });

  if (existing && !existing.isVerified) {
    // Optionally, delete the old unverified user
    await User.deleteOne({ email });
  } else if (existing && existing.isVerified) {
    return next(new appError("Email already in use", 400));
  }

  const newUser = await User.create({
    ...req.body,
    otp,
    otpExpires,
  });

  await sendEmail({
    email: newUser.email,
    subject: "Email Verification OTP - valid for 10 minutes",
    html: message,
  });

  res.status(201).json({
    status: "success",
    message: "OTP sent to your email for verification",
  });
});

// verify email
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({
    email,
    otp,
    otpExpires: { $gt: Date.now() },
  });

  if (!user) return next(new appError("Invalid or expired OTP", 400));

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);
  const { _id, password: _, __v, ...rest } = user.toObject();
  const userDoc = { id: _id, ...rest };

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: userDoc,
    },
  });
});

exports.singIn = catchAsync(async function (req, res, next) {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new appError("Please provide email and password", 400));

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user?.password))) {
    return next(new appError("Incorrect email or password", 400));
  }
  const token = signToken(user._id);
  const { _id, password: _, passwordChangedAt, __v, ...rest } = user.toObject();
  const userDoc = { id: _id, ...rest };

  res.status(200).json({
    status: "success",
    token,
    data: {
      user: userDoc,
    },
  });
});

exports.forgetPassword = async function (req, res, next) {
  const userByEmail = await User.findOne({ email: req.body.email });
  if (!userByEmail)
    return next(new appError("no user found with provided email", 404));

  const resetToken = await userByEmail.createResetPasswordToken();

  await userByEmail.save({ validateBeforeSave: false });
  const resetURL = `${frontendUrl}/forgetpassword/${resetToken}`;

  // const message = `Visit ${resetURL} to reset your password.`;

  const message = `
  <!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml"
  xmlns:o="urn:schemas-microsoft-com:office:office">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Reset Password</title>

  <!-- Web Font / @font-face : BEGIN -->
  <!--[if mso]>
    <style>
      * {
        font-family: 'Roboto', sans-serif !important;
      }
    </style>
  <![endif]-->

  <!--[if !mso]><!-->
  <link href="https://fonts.googleapis.com/css?family=Roboto:400,600" rel="stylesheet" type="text/css">
  <!--<![endif]-->

  <style>
    html,
    body {
      margin: 0 auto !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      font-family: 'Roboto', sans-serif !important;
      font-size: 14px;
      margin-bottom: 10px;
      line-height: 24px;
      color: #8094ae;
      font-weight: 400;
    }

    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      margin: 0;
      padding: 0;
    }

    table,
    td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }

    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }

    table table table {
      table-layout: auto;
    }

    a {
      text-decoration: none;
    }

    img {
      -ms-interpolation-mode: bicubic;
    }
  </style>
</head>

<body width="100%" style="margin: 0; padding: 0 !important; background-color: #f5f6fa; mso-line-height-rule: exactly;">

  <!-- Start Preheader -->
  <div class="preheader"
    style="display: none; max-width: 0; max-height: 0; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">
    Forgot your password? No worries — click the button below to reset it securely.
  </div>
  <!-- End Preheader -->

  <center style="width: 100%; background-color: #f5f6fa;">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f6fa">
      <tr>
        <td style="padding: 40px 0;">

          <!-- Logo Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding-bottom:25px">
                <a href="#">
                <h2>Dev Shop</h3>
                </a>
              </td>
            </tr>
          </table>

          <!-- Main Content Section -->
          <table style="width:100%;max-width:620px;margin:0 auto;background-color:#ffffff;">
            <tr>
              <td style="text-align:center;padding: 30px 30px 15px 30px;">
                <h2 style="font-size: 18px; color: #6576ff; font-weight: 600; margin: 0;">Reset Password</h2>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 0 30px 20px">
                
                <p style="margin-bottom: 25px;">Click the link below to reset your password.</p>
                <a href="${resetURL}"
                  style="background-color:#6576ff;border-radius:4px;color:#ffffff;display:inline-block;font-size:13px;font-weight:600;line-height:44px;text-align:center;text-decoration:none;text-transform: uppercase; padding: 0 25px">
                  Reset Password
                </a>
              </td>
            </tr>
            <tr>
              <td style="text-align:center;padding: 20px 30px 40px">
                <p>If you did not request this, please contact us or ignore this message.</p>
                <p style="margin: 0; font-size: 13px; line-height: 22px; color:#9ea8bb;">
                  This is an automatically generated email. Please do not reply to this email. If you face any issues,
                  please contact us at
                  <a href="#" style="color: #6576ff;">devshop@gmail.com</a>
                </p>
              </td>
            </tr>
          </table>

          <!-- Footer -->
          <table style="width:100%;max-width:620px;margin:0 auto;">
            <tr>
              <td style="text-align: center; padding:25px 20px 0;">
                <p style="font-size: 13px;">
                  Copyright © 2025 Dev Shop. All rights reserved.
                  
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </center>
</body>

</html>
`;

  try {
    await sendEmail({
      email: userByEmail.email,
      subject: "Password Reset Token valid for only 10 minutes",
      html: message,
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
  const token = signToken(user._id);

  const { _id, password: _, passwordChangedAt, __v, ...rest } = user.toObject();
  const userDoc = { id: _id, ...rest };

  //4.  Log the user in ,send the JWT token

  res.status(201).json({
    status: "success",
    token,
    data: {
      user: userDoc,
    },
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  //1 Get user from collection

  const user = await User.findById(req.user.id).select("+password");

  //2. Check if posted current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new appError("Your current password is wrong ", 400));
  }

  //3. if So, update current password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();
  const token = signToken(user._id);
  const userDoc = user.toObject();
  delete userDoc.password;
  delete userDoc.passwordChangedAt;

  res.status(201).json({
    status: "success",
    message: "Password changed successfully",
    token,
    data: {
      user: userDoc,
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
