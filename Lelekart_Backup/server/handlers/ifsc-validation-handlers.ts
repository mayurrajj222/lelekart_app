import { Request, Response } from "express";

interface IFSCResponse {
  success: boolean;
  data?: {
    ifsc: string;
    bank: string;
    branch: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    contact: string;
    micr: string;
    upi: boolean;
    neft: boolean;
    rtgs: boolean;
    imps: boolean;
  };
  message?: string;
}

export async function handleIFSCValidation(req: Request, res: Response) {
  try {
    const { ifscCode } = req.body;

    if (!ifscCode) {
      return res.status(400).json({
        success: false,
        message: "IFSC code is required",
      });
    }

    // Clean the IFSC code
    const cleanIFSC = ifscCode.replace(/\s/g, "").toUpperCase();

    // Validate IFSC format
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(cleanIFSC)) {
      return res.status(400).json({
        success: false,
        message: "Invalid IFSC code format",
      });
    }

    // Call Razorpay IFSC API
    const apiUrl = `https://ifsc.razorpay.com/${cleanIFSC}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeleKart-Seller-App/1.0",
      },
    });

    if (!response.ok) {
      console.error("IFSC API error:", response.status, response.statusText);
      return res.status(500).json({
        success: false,
        message: "Unable to validate IFSC code at this time",
      });
    }

    const apiData = await response.json();

    if (apiData && apiData.BANK) {
      // Razorpay API returns data directly, not wrapped in success/data structure
      res.status(200).json({
        success: true,
        data: {
          ifsc: apiData.IFSC,
          bankName: apiData.BANK,
          branch: apiData.BRANCH,
          address: apiData.ADDRESS,
          city: apiData.CITY,
          state: apiData.STATE,
          district: apiData.DISTRICT,
          contact: apiData.CONTACT,
          rtgs: apiData.RTGS,
          bankCode: apiData.BANKCODE,
        },
        message: "IFSC code validated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "IFSC code not found or invalid",
      });
    }
  } catch (error) {
    console.error("Error validating IFSC:", error);
    res.status(500).json({
      success: false,
      message: "Error validating IFSC code",
    });
  }
}
