import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";

// Configure Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Extract user info from Google profile
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value;
        const displayName = profile.displayName;
        const avatarUrl = profile.photos?.[0]?.value;

        // Use Google ID as user ID for consistent login
        const userId = `google-${googleId}`;
        
        // Check if user exists
        let user = await storage.getUser(userId);

        if (!user) {
          // Create new user
          user = {
            id: userId,
            username: displayName || email?.split("@")[0] || "user",
            email: email || "",
            role: "contractor", // Default role
            password: "", // OAuth users don't have passwords
            createdAt: new Date(),
          };

          await storage.createUser(user);
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

// Serialize user to session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await storage.getUser(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

export default passport;
