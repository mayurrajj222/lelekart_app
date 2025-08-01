import { Request, Response } from "express";
import { sendEmail } from "../helpers/email";

interface BecomeSellerRequest {
  email: string;
  phone: string;
  businessName: string;
  businessAddress: string;
  businessState: string;
  businessCity: string;
  businessPincode: string;
  businessType: string;
  companyRegistrationNumber?: string;
  gstNumber?: string; // Made optional
  panNumber?: string; // Made optional
  bankName: string;
  bankState: string;
  bankCity: string;
  bankPincode: string;
  accountNumber: string;
  ifscCode: string;
  governmentIdType: string;
  governmentIdNumber: string;
  governmentIdPhoto: string;
  agreeToTerms: boolean;
  agreeToPrivacyPolicy: boolean;
}

export async function handleBecomeSeller(req: Request, res: Response) {
  try {
    const data: BecomeSellerRequest = req.body;

    // Validate required fields
    if (!data.email || !data.phone || !data.businessName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Create email content for admin notification
    const adminEmailContent = `
      <h2>New Seller Application Received</h2>
      <p>A new seller application has been submitted on LeleKart.</p>
      
      <h3>Contact Information:</h3>
      <ul>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Phone:</strong> ${data.phone}</li>
      </ul>
      
      <h3>Business Information:</h3>
      <ul>
        <li><strong>Business Name:</strong> ${data.businessName}</li>
        <li><strong>Business Type:</strong> ${data.businessType}</li>
        <li><strong>Business Address:</strong> ${data.businessAddress}</li>
        <li><strong>State:</strong> ${data.businessState}</li>
        <li><strong>City:</strong> ${data.businessCity}</li>
        <li><strong>Pincode:</strong> ${data.businessPincode}</li>
        ${data.companyRegistrationNumber ? `<li><strong>Company Registration Number:</strong> ${data.companyRegistrationNumber}</li>` : ""}
      </ul>
      
      <h3>Tax Information:</h3>
      <ul>
        <li><strong>GST Number:</strong> ${data.gstNumber || "Not provided"}</li>
        <li><strong>PAN Number:</strong> ${data.panNumber || "Not provided"}</li>
      </ul>
      <p><em>Note: GST and PAN numbers will be verified through government databases during the review process. IFSC codes are validated using Razorpay's official IFSC database.</em></p>
      
      <h3>Bank Account Information:</h3>
      <ul>
        <li><strong>Bank Name:</strong> ${data.bankName}</li>
        <li><strong>State:</strong> ${data.bankState}</li>
        <li><strong>City:</strong> ${data.bankCity}</li>
        <li><strong>Pincode:</strong> ${data.bankPincode}</li>
        <li><strong>Account Number:</strong> ${data.accountNumber}</li>
        <li><strong>IFSC Code:</strong> ${data.ifscCode}</li>
      </ul>
      
      <h3>Identity Verification:</h3>
      <ul>
        <li><strong>Government ID Type:</strong> ${data.governmentIdType}</li>
        <li><strong>Government ID Number:</strong> ${data.governmentIdNumber}</li>
        <li><strong>Government ID Document:</strong> <a href="${data.governmentIdPhoto}" target="_blank">View Document</a></li>
      </ul>
      
      <h3>Terms Agreement:</h3>
      <ul>
        <li><strong>Agreed to Terms:</strong> ${data.agreeToTerms ? "Yes" : "No"}</li>
        <li><strong>Agreed to Privacy Policy:</strong> ${data.agreeToPrivacyPolicy ? "Yes" : "No"}</li>
      </ul>
      
      <p><strong>Application Date:</strong> ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</p>
      
      <p>Please review this application and contact the applicant at ${data.email} or ${data.phone}.</p>
    `;

    // Send email to admin
    await sendEmail({
      to: "marketing.lelekart@gmail.com",
      subject: "New Seller Application - LeleKart",
      html: adminEmailContent,
    });

    // Send confirmation email to applicant
    const applicantEmailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2874f0; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">LeleKart Seller Application</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <h2 style="color: #2874f0;">Thank You for Your Application!</h2>
          
          <p>Dear ${data.businessName},</p>
          
          <p>We have successfully received your seller application for LeleKart. Our team will review your application and get back to you within 2-3 business days.</p>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #2874f0; margin-top: 0;">Application Details:</h3>
            <p><strong>Business Name:</strong> ${data.businessName}</p>
            <p><strong>Email:</strong> ${data.email}</p>
            <p><strong>Phone:</strong> ${data.phone}</p>
            <p><strong>Application Date:</strong> ${new Date().toLocaleDateString("en-IN")}</p>
          </div>
          
          <h3 style="color: #2874f0;">What happens next?</h3>
          <ol>
            <li><strong>Application Review:</strong> Our team will review your business information and documents</li>
            <li><strong>Document Verification:</strong> We'll verify your GST, PAN, and other submitted documents through government databases</li>
            <li><strong>Bank Account Verification:</strong> Your IFSC code and bank details will be validated</li>
            <li><strong>Identity Verification:</strong> Your government ID will be verified for authenticity</li>
            <li><strong>Account Setup:</strong> Once approved, you'll receive login credentials to start selling</li>
          </ol>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="color: #856404; margin-top: 0;">🔍 Verification Process</h4>
            <p style="margin: 5px 0;"><strong>GST Verification:</strong> We verify your GST number with the GST portal to ensure it's active and valid.</p>
            <p style="margin: 5px 0;"><strong>PAN Verification:</strong> Your PAN number format is validated and will be verified during the review process.</p>
            <p style="margin: 5px 0;"><strong>IFSC Verification:</strong> Bank details are validated using Razorpay's official IFSC database.</p>
            <p style="margin: 5px 0;"><strong>Processing Time:</strong> Verification typically takes 2-3 business days.</p>
          </div>
          
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #2874f0; margin-top: 0;">📞 Need Help?</h4>
            <p>If you have any questions about your application, please contact us:</p>
            <ul style="margin: 10px 0;">
              <li>Email: support@lelekart.com</li>
              <li>Phone: 1800 202 9898</li>
              <li>Hours: Mon-Sat (9 AM to 9 PM)</li>
            </ul>
          </div>
          
          <p>Thank you for choosing LeleKart!</p>
          
          <p>Best regards,<br>
          The LeleKart Team</p>
        </div>
        
        <div style="background-color: #f1f3f4; padding: 15px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>&copy; ${new Date().getFullYear()} LeleKart. All rights reserved.</p>
        </div>
      </div>
    `;

    await sendEmail({
      to: data.email,
      subject: "Your LeleKart Seller Application - Received",
      html: applicantEmailContent,
    });

    // Log the application (you can store this in database if needed)
    console.log("New seller application received:", {
      businessName: data.businessName,
      email: data.email,
      phone: data.phone,
      timestamp: new Date().toISOString(),
    });

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error processing seller application:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

export async function handleValidatePAN(req: Request, res: Response) {
  try {
    const { panNumber } = req.body;

    if (!panNumber) {
      return res.status(400).json({
        success: false,
        message: "PAN number is required",
      });
    }

    // Basic PAN validation regex
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isValid = panRegex.test(panNumber);

    res.status(200).json({
      success: true,
      isValid: isValid,
      message: isValid
        ? "PAN number format is valid"
        : "Invalid PAN number format",
    });
  } catch (error) {
    console.error("Error validating PAN:", error);
    res.status(500).json({
      success: false,
      message: "Error validating PAN number",
    });
  }
}
