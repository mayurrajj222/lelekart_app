import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import { db } from "../db";
import { userOtps } from "@shared/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";
dotenv.config();
// Environment variables for email configuration
const EMAIL_HOST = process.env.EMAIL_HOST || "";
const EMAIL_PORT = process.env.EMAIL_PORT
  ? parseInt(process.env.EMAIL_PORT)
  : 587;
const EMAIL_USER = process.env.EMAIL_USER || "";
const EMAIL_PASS = process.env.EMAIL_PASS || "";
const EMAIL_FROM = process.env.EMAIL_FROM || "verification@lelekart.com";

// Log email configuration (without exposing password)
console.log(
  `Email configuration: HOST=${EMAIL_HOST}, PORT=${EMAIL_PORT}, USER=${EMAIL_USER}, FROM=${EMAIL_FROM}`
);

// Create a transporter
export const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465, // true for 465, false for other ports
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Verify SMTP connection
(async function () {
  try {
    const verify = await transporter.verify();
    console.log("SMTP connection verified:", verify);
  } catch (error) {
    console.error("SMTP connection error:", error);
  }
})();

// Generate OTP
export async function generateOTP(): Promise<string> {
  return cryptoRandomString({
    length: 6,
    type: "numeric",
  });
}

// Save OTP to database
export async function saveOTP(email: string, otp: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP valid for 10 minutes

  // First try to update an existing OTP for this email
  const existing = await db
    .select()
    .from(userOtps)
    .where(eq(userOtps.email, email));

  if (existing.length > 0) {
    await db
      .update(userOtps)
      .set({
        otp,
        expiresAt,
        verified: false,
      })
      .where(eq(userOtps.email, email));
  } else {
    // Insert a new OTP record
    await db.insert(userOtps).values([
      {
        email,
        otp,
        expiresAt,
        verified: false,
      },
    ]);
  }
}

// Verify OTP
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const [otpRecord] = await db
    .select()
    .from(userOtps)
    .where(eq(userOtps.email, email));

  if (!otpRecord) {
    return false;
  }

  if (otpRecord.otp !== otp) {
    return false;
  }

  const expiresAt = new Date(otpRecord.expiresAt);
  if (expiresAt < new Date()) {
    return false; // OTP expired
  }

  // Mark OTP as verified
  await db
    .update(userOtps)
    .set({ verified: true })
    .where(eq(userOtps.id, otpRecord.id));

  return true;
}

// Send email function
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  try {
    const mailOptions = {
      from: EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ""), // Strip HTML tags for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string): Promise<void> {
  try {
    console.log(`Attempting to send OTP email to ${email}`);

    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: "Your Lelekart Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #2874f0; margin-bottom: 10px;">Lelekart</h1>
            <p style="font-size: 18px; font-weight: bold;">Your One-Time Password (OTP)</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 0;">${otp}</p>
          </div>
          <p>Use this OTP to login to your Lelekart account. This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this OTP, please ignore this email.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #888;">
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      `,
    });

    console.log(`Email sent successfully: ${info.messageId}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error(
      `Failed to send OTP email: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Check if email needs verification
export async function needsVerification(email: string): Promise<boolean> {
  const [otpRecord] = await db
    .select()
    .from(userOtps)
    .where(eq(userOtps.email, email));

  return !otpRecord || !otpRecord.verified;
}
