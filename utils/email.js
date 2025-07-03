const nodemailer = require("nodemailer");

const sendEmail = async (props) => {
  const transporter = nodemailer.createTransport({
    host:
      process.env.NODE_ENV === "production"
        ? "smtp-relay.brevo.com"
        : "sandbox.smtp.mailtrap.io",
    port: 587,
    auth: {
      user:
        process.env.NODE_ENV === "production"
          ? process.env.SMTP_PROD_USER
          : process.env.SMTP_DEV_USER,
      pass:
        process.env.NODE_ENV === "production"
          ? process.env.SMTP_PROD_PASS
          : process.env.SMTP_DEV_PASS,
    },
  });

  const mailOptions = {
    from: "sahuprakash643@gmail.com",
    to: props.email,
    subject: props.subject,
    text: props.text,
    html: props.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: ", info.response); // Log the response from the SMTP server
    return info;
  } catch (error) {
    console.log("Error sending email: " + error);
    throw error;
  }
};

module.exports = sendEmail;
