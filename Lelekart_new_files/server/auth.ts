import passport from "passport";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { 
  generateOTP, 
  saveOTP, 
  verifyOTP, 
  sendOTPEmail
} from "./helpers/email";
import { z } from "zod";
import { createAdminUser, isSpecialAdmin } from './adminUser';

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
  role: z.enum(["buyer", "seller", "admin"]).default("buyer"),
  name: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

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
  
  // Create special admin user on startup
  createAdminUser().catch(err => {
    console.error("Failed to create special admin user:", err);
  });
  
  // Special direct login endpoint for admin
  app.post("/api/auth/admin-login", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      
      // Ensure this endpoint only works for the special admin user
      if (!isSpecialAdmin(email)) {
        return res.status(403).json({ 
          error: "This login method is restricted to authorized administrators only" 
        });
      }
      
      // Find the admin user
      const adminUser = await storage.getUserByEmail(email);
      
      if (!adminUser) {
        return res.status(404).json({ error: "Admin user not found" });
      }
      
      // Verify that the user has admin role
      if (adminUser.role !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access" });
      }
      
      // Log in the admin user directly without OTP
      req.login(adminUser, (err) => {
        if (err) return next(err);
        return res.status(200).json({ 
          user: adminUser,
          message: "Admin login successful" 
        });
      });
    } catch (error) {
      console.error("Error in admin login:", error);
      next(error);
    }
  });

  passport.serializeUser((user, done) => {
    try {
      // If this is an impersonated session, store both the impersonated and original user ID
      if (user.isImpersonating && user.originalUserId) {
        return done(null, { 
          id: user.id, 
          originalUserId: user.originalUserId,
          isImpersonating: true 
        });
      }
      // Normal session
      return done(null, { id: user.id });
    } catch (err) {
      console.error("Error in serializeUser:", err);
      done(err);
    }
  });
  
  passport.deserializeUser(async (serialized: any, done) => {
    try {
      // Handle null or non-object case gracefully
      if (!serialized || typeof serialized !== 'object') {
        console.warn('Invalid session data format:', serialized);
        return done(null, null);
      }
      
      // Handle legacy session format (just an ID number)
      let userId: number;
      if (typeof serialized === 'number') {
        userId = serialized;
      } else if (serialized.id && typeof serialized.id === 'number') {
        userId = serialized.id;
      } else {
        console.warn('Could not find user ID in session:', serialized);
        return done(null, null);
      }
      
      // Handle impersonation case
      if (serialized.isImpersonating === true && 
          serialized.originalUserId && 
          typeof serialized.originalUserId === 'number') {
        try {
          const impersonatedUser = await storage.getUser(userId);
          if (!impersonatedUser) {
            console.warn('Impersonated user not found:', userId);
            return done(null, null);
          }
          
          // Add impersonation flags to the user object
          impersonatedUser.isImpersonating = true;
          impersonatedUser.originalUserId = serialized.originalUserId;
          
          return done(null, impersonatedUser);
        } catch (error) {
          console.error('Error retrieving impersonated user:', error);
          return done(null, null);
        }
      }
      
      // Normal session
      try {
        const user = await storage.getUser(userId);
        if (!user) {
          console.warn('User not found:', userId);
          return done(null, null);
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

  // Step 1: Request OTP for login or registration
  app.post("/api/auth/request-otp", async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Received OTP request", req.body);
      
      // Validate request
      const validation = requestOtpSchema.safeParse(req.body);
      if (!validation.success) {
        console.error("Invalid email validation:", validation.error);
        return res.status(400).json({ error: "Invalid email address" });
      }

      const { email } = validation.data;
      console.log(`Processing OTP request for email: ${email}`);
      
      // We'll remove the special admin bypass - all admins must verify OTP
      // Special admins are still non-deletable but must go through OTP process

      // Generate OTP for regular users
      const otp = await generateOTP();
      console.log(`Generated OTP for ${email}: ${otp}`);
      
      // Save OTP to database
      try {
        await saveOTP(email, otp);
        console.log(`OTP saved to database for ${email}`);
      } catch (dbError) {
        console.error("Failed to save OTP to database:", dbError);
        return res.status(500).json({ error: "Database error. Please try again later." });
      }
      
      // Send OTP to user's email
      try {
        await sendOTPEmail(email, otp);
        console.log(`OTP email sent successfully to ${email}`);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({ error: "Failed to send OTP email. Please check your email configuration." });
      }
      
      res.status(200).json({ 
        message: "OTP sent successfully", 
        email, 
        expiresIn: 10 * 60 // 10 minutes in seconds
      });
    } catch (error) {
      console.error("Unexpected error in /api/auth/request-otp:", error);
      next(error);
    }
  });

  // Step 2: Verify OTP
  app.post("/api/auth/verify-otp", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request
      const validation = verifyOtpSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid request" });
      }

      const { email, otp } = validation.data;
      
      // Verify OTP
      const isValid = await verifyOTP(email, otp);
      
      if (!isValid) {
        return res.status(400).json({ error: "Invalid or expired OTP" });
      }
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(email);
      
      if (existingUser) {
        // Login existing user
        req.login(existingUser, (err) => {
          if (err) return next(err);
          return res.status(200).json({ 
            user: existingUser,
            isNewUser: false,
            message: "Login successful" 
          });
        });
      } else {
        // User doesn't exist, ask for registration
        return res.status(200).json({
          isNewUser: true,
          email,
          message: "OTP verified. Please complete registration."
        });
      }
    } catch (error) {
      next(error);
    }
  });

  // Step 3: Complete registration for new users after OTP verification
  app.post("/api/auth/register", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid registration data" });
      }

      const userData = validation.data;
      
      // Check if username is already taken
      const existingUserByUsername = await storage.getUserByUsername(userData.username);
      if (existingUserByUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      // Check if email is already taken
      const existingUserByEmail = await storage.getUserByEmail(userData.email);
      if (existingUserByEmail) {
        return res.status(400).json({ error: "Email address already in use" });
      }

      // Create new user
      const newUser = await storage.createUser({
        ...userData,
        // Use a random password string since we're using OTP
        password: randomBytes(16).toString('hex'),
      });

      // Log in the new user
      req.login(newUser, (err) => {
        if (err) return next(err);
        res.status(201).json({
          user: newUser,
          message: "Registration successful"
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/user", (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // If user is impersonating, include impersonation data
    if (req.user.isImpersonating && req.user.originalUserId) {
      return res.json({
        ...req.user,
        isImpersonating: true,
        originalUserId: req.user.originalUserId
      });
    }
    
    res.json(req.user);
  });
  
  // Start impersonation - Admin only
  app.post("/api/admin/impersonate/:userId", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated and is an admin
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (req.user.role !== 'admin') return res.status(403).json({ error: "Only administrators can impersonate users" });
      
      // Don't allow nested impersonation
      if (req.user.isImpersonating) {
        return res.status(400).json({ 
          error: "You are already impersonating a user. Please end the current impersonation first." 
        });
      }
      
      const targetUserId = parseInt(req.params.userId);
      
      // Don't allow impersonating self
      if (req.user.id === targetUserId) {
        return res.status(400).json({ error: "You cannot impersonate yourself" });
      }
      
      // Get the target user
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Store the original admin's ID in the impersonated user object
      const impersonatedUser = {
        ...targetUser,
        isImpersonating: true,
        originalUserId: req.user.id
      };
      
      // Log the impersonation for security auditing
      console.log(`Admin ${req.user.username} (ID: ${req.user.id}) started impersonating user ${targetUser.username} (ID: ${targetUser.id})`);
      
      // Login as the impersonated user
      req.login(impersonatedUser, (err) => {
        if (err) return next(err);
        
        return res.status(200).json({
          message: `Now impersonating ${targetUser.username}`,
          user: {
            ...targetUser,
            isImpersonating: true,
            originalUserId: req.user.id
          }
        });
      });
    } catch (error) {
      console.error("Error starting impersonation:", error);
      next(error);
    }
  });
  
  // End impersonation and restore original admin session
  app.post("/api/admin/stop-impersonation", async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ensure user is authenticated and is currently impersonating
      if (!req.isAuthenticated()) return res.sendStatus(401);
      if (!req.user.isImpersonating || !req.user.originalUserId) {
        return res.status(400).json({ error: "You are not currently impersonating anyone" });
      }
      
      // Get the original admin user
      const originalUserId = req.user.originalUserId;
      const originalUser = await storage.getUser(originalUserId);
      
      if (!originalUser) {
        return res.status(404).json({ error: "Original user not found" });
      }
      
      // Log the end of impersonation
      console.log(`Ending impersonation: User ${req.user.username} (ID: ${req.user.id}) returning to original user ${originalUser.username} (ID: ${originalUser.id})`);
      
      // Login as the original admin user
      req.login(originalUser, (err) => {
        if (err) return next(err);
        
        return res.status(200).json({
          message: "Impersonation ended",
          user: originalUser
        });
      });
    } catch (error) {
      console.error("Error ending impersonation:", error);
      next(error);
    }
  });
}