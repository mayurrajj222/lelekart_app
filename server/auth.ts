import passport from "passport";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "../shared/schema";
import { 
  generateOTP, 
  saveOTP, 
  verifyOTP, 
  sendOTPEmail
} from "./helpers/email";
import { z } from "zod";
// Removed admin imports - no admins allowed

declare global {
  namespace Express {
    interface User extends SelectUser {
      isImpersonating?: boolean;
      originalUserId?: number;
    }
    interface Request {
      isImpersonating?: boolean;
      originalUserId?: number;
    }
  }
}

// Validation schemas
const requestOtpSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

const registerSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  role: z.literal("buyer").default("buyer"),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  // After authentication, check if the user is a buyer
  if (req.user && req.user.role !== "buyer") {
    // Forbid access for seller and admin roles and log them out
    return req.logout((err) => {
      if (err) {
        console.error("Error during logout after unauthorized role access:", err);
        return res.status(500).json({ error: "Internal server error." });
      }
      return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
    });
  }
  next();
}

export function setupAuth(app: Express) {
  // Generate a secure secret for sessions
  const SESSION_SECRET = process.env.SESSION_SECRET || randomBytes(32).toString('hex');
  const sessionSettings: session.SessionOptions = {
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for longer persistence
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    }
  };
  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());
  // Removed admin user creation - no admins allowed
  app.post("/api/auth/admin-login", (async (req: any, res: any, next: any) => {
    try {
      const { email } = req.body;
      // Block all admin login attempts with the consistent message
      return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
    } catch (error) {
      console.error("Error in admin login:", error);
      next(error);
    }
  }) as any);
  passport.serializeUser((user, done) => {
    try {
      if (user.isImpersonating && user.originalUserId) {
        return done(null, { id: user.id, originalUserId: user.originalUserId, isImpersonating: true });
      }
      return done(null, { id: user.id });
    } catch (err) {
      console.error("Error in serializeUser:", err);
      done(err);
    }
  });
  passport.deserializeUser(async (serialized: any, done) => {
    try {
      if (!serialized || typeof serialized !== 'object') {
        console.warn('Invalid session data format:', serialized);
        return done(null, null);
      }
      let userId: number;
      if (typeof serialized === 'number') {
        userId = serialized;
      } else if (serialized.id && typeof serialized.id === 'number') {
        userId = serialized.id;
      } else {
        console.warn('Could not find user ID in session:', serialized);
        return done(null, null);
      }
      if (serialized.isImpersonating === true && serialized.originalUserId && typeof serialized.originalUserId === 'number') {
        try {
          const impersonatedUser = await storage.getUser(userId);
          if (!impersonatedUser) {
            console.warn('Impersonated user not found:', userId);
            return done(null, null);
          }
                  // Block all seller and admin roles from being deserialized
        if (impersonatedUser.role !== "buyer") {
          console.warn(`Access denied during deserialization for impersonated user ${impersonatedUser.email} (role: ${impersonatedUser.role})`);
          return done(null, false, { message: "Seller and admin not allowed to login in app." });
        }
          (impersonatedUser as any).isImpersonating = true;
          (impersonatedUser as any).originalUserId = serialized.originalUserId;
          return done(null, impersonatedUser);
        } catch (error) {
          console.error('Error retrieving impersonated user:', error);
          return done(null, null);
        }
      }
      try {
        const user = await storage.getUser(userId);
        if (!user) {
          console.warn('User not found:', userId);
          return done(null, null);
        }
        // Block all seller and admin roles from being deserialized
        if (user.role !== "buyer") {
          console.warn(`Access denied during deserialization for user ${user.email} (role: ${user.role})`);
          return done(null, false, { message: "Seller and admin not allowed to login in app." });
        }
        done(null, user);
      } catch (error) {
        console.error('Error retrieving user:', error);
        return done(null, null);
      }
    } catch (err) {
      console.error("Error in deserializeUser:", err);
      done(null, null);
    }
  });
  app.post("/api/auth/request-otp", (async (req: any, res: any, next: any) => {
    try {
      console.log("Received OTP request", req.body);
      const validation = requestOtpSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Invalid email validation:", validation.error);
        return res.status(400).json({ error: "Invalid email address" });
      }
      const { email } = validation.data;
      console.log(`Processing OTP request for email: ${email}`);
      // Check if user exists and if their role is restricted
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && (existingUser.role === "seller" || existingUser.role === "admin")) {
        return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
      }
      const otp = await generateOTP();
      console.log(`Generated OTP for ${email}: ${otp}`);
      try {
        await saveOTP(email, otp);
        console.log(`OTP saved to database for ${email}`);
      } catch (dbError) {
        console.error("Failed to save OTP to database:", dbError);
        return res.status(500).json({ error: "Database error. Please try again later." });
      }
      try {
        await sendOTPEmail(email, otp);
        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ error: "Failed to send OTP email. Please check your email configuration." });
      }
      res.status(200).json({ message: "OTP sent successfully", email, expiresIn: 10 * 60 });
    } catch (error) {
      console.error("Unexpected error in /api/auth/request-otp:", error);
      next(error);
    }
  }) as any);
  app.post("/api/auth/verify-otp", (async (req: any, res: any, next: any) => {
    try {
      const validation = verifyOtpSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request" });
      }
      const { email, otp } = validation.data;
      const isValid = await verifyOTP(email, otp);
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        // Only allow 'buyer' roles to log in via OTP
        if (existingUser.role !== "buyer") {
          return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
        }
        req.login(existingUser, (err: any) => {
          if (err) return next(err);
          return res.status(200).json({ user: existingUser, isNewUser: false, message: "Login successful" });
        });
      } else {
        return res.status(200).json({ isNewUser: true, email, message: "OTP verified. Please complete registration." });
      }
    } catch (error) {
      next(error);
    }
  }) as any);
  app.post("/api/auth/register", (async (req: any, res: any, next: any) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid registration data" });
      }
      const userData = validation.data;
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email address already in use" });
      }
      const newUser = await storage.createUser({
        ...userData,
        password: randomBytes(16).toString('hex'),
      });
      req.login(newUser, (err: any) => {
        if (err) return next(err);
        res.status(201).json({ user: newUser, message: "Registration successful" });
      });
    } catch (error) {
      next(error);
    }
  }) as any);
  app.post("/api/auth/logout", (req: any, res: any, next: any) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // Demo login endpoint for reviewers
  app.post("/api/auth/demo-login", (async (req: any, res: any, next: any) => {
    try {
      const { username, password } = req.body;
      
      // Check for demo credentials
      if (username === '7771' && password === '0000') {
        const demoUser = {
          id: 999,
          email: 'demo@lelekart.com',
          username: 'demo_reviewer',
          name: 'Demo Reviewer',
          phone: '9999999999',
          address: 'Demo Address',
          role: 'buyer',
          isDemoUser: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        req.login(demoUser, (err: any) => {
          if (err) return next(err);
          return res.status(200).json({ 
            user: demoUser, 
            message: "Demo login successful",
            isDemoUser: true 
          });
        });
      } else {
        return res.status(401).json({ error: "Invalid demo credentials" });
      }
    } catch (error) {
      console.error("Error in demo login:", error);
      next(error);
    }
  }) as any);
  app.get("/api/user", (req: any, res: any) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    if (req.user.isImpersonating && req.user.originalUserId) {
      return res.json({ ...req.user, isImpersonating: true, originalUserId: req.user.originalUserId });
    }
    res.json(req.user);
  });
  app.post("/api/admin/impersonate/:userId", (async (req: any, res: any, next: any) => {
    try {
      // Block all impersonation attempts
      return res.status(403).json({ error: "Seller and admin not allowed to login in app." });
    } catch (error) {
      console.error("Error in impersonation:", error);
      next(error);
    }
  }) as any);
  app.post("/api/admin/stop-impersonation", (async (req: any, res: any, next: any) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (!req.user.isImpersonating || !req.user.originalUserId) {
        return res.status(400).json({ error: "You are not currently impersonating anyone" });
      }
      const originalUserId = req.user.originalUserId;
      const originalUser = await storage.getUser(originalUserId);
      if (!originalUser) {
        return res.status(404).json({ error: "Original user not found" });
      }
      console.log(`Ending impersonation: User ${req.user.username} (ID: ${req.user.id}) returning to original user ${originalUser.username} (ID: ${originalUser.id})`);
      req.login(originalUser, (err: any) => {
        if (err) return next(err);
        return res.status(200).json({ message: "Impersonation ended", user: originalUser });
      });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      next(error);
    }
  }) as any);
} 