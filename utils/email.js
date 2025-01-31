const nodemailer = require("nodemailer");

const sendEmail = async (props) => {
  const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: process.env.SMTP_USER_NAME,
      pass: process.env.SMTP_USER_PASSWORD,
    },
    secure: false,
    tls: {
      rejectUnauthorized: false, // Do not reject unauthorized TLS certificates
    },
    connectionTimeout: 100000,
  });

  const mailOptions = {
    from: "Prakash <noreply@example.com>",
    to: props.email,
    subject: props.subject,
    text: props.text,
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
