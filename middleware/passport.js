const passport = require("passport");
const crypto = require("crypto");
const GoogleStrategy = require("passport-google-oauth2").Strategy;
const User = require("./../models/userModel"); // your user model

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:8000/api/v1/users/auth/google/callback", // Make sure this matches with Google Developer Console
    },
    async (accessToken, refreshToken, profile, done) => {
      const { id, emails, displayName } = profile;
      const email = emails[0].value;
      const photo = profile.photos[0]
        ? profile.photos[0].value
        : "default-photo-url";

      try {
        let user = await User.findOne({ email });

        if (!user) {
          const randomPassword = crypto.randomBytes(20).toString("hex"); // 👈 generate random password
          user = await User.create({
            name: displayName,
            email,
            photo,
            password: randomPassword, // 👈 set dummy random password
            isVerified: true,
            googleId: id,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});
