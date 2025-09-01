import { Request, Response } from "express";

interface PincodeResponse {
  success: boolean;
  data?: {
    pincode: string;
    state: string;
    city: string;
    district: string;
    area: string;
  };
  message?: string;
}

export async function handlePincodeValidation(req: Request, res: Response) {
  try {
    const { pincode } = req.body;

    if (!pincode) {
      return res.status(400).json({
        success: false,
        message: "Pincode is required",
      });
    }

    // Clean the pincode
    const cleanPincode = pincode.replace(/\s/g, "");

    // Validate pincode format (6 digits)
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincodeRegex.test(cleanPincode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format (should be 6 digits)",
      });
    }

    // Call India Post Pincode API
    const apiUrl = `https://api.postalpincode.in/pincode/${cleanPincode}`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeleKart-Seller-App/1.0",
      },
    });

    if (!response.ok) {
      console.error("Pincode API error:", response.status, response.statusText);
      return res.status(500).json({
        success: false,
        message: "Unable to validate pincode at this time",
      });
    }

    const apiData = await response.json();

    if (
      apiData &&
      apiData[0] &&
      apiData[0].Status === "Success" &&
      apiData[0].PostOffice
    ) {
      const postOffice = apiData[0].PostOffice[0]; // Get first post office

      res.status(200).json({
        success: true,
        data: {
          pincode: cleanPincode,
          state: postOffice.State,
          city: postOffice.District, // Using District as city
          district: postOffice.District,
          area: postOffice.Name,
        },
        message: "Pincode validated successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Pincode not found or invalid",
      });
    }
  } catch (error) {
    console.error("Error validating pincode:", error);
    res.status(500).json({
      success: false,
      message: "Error validating pincode",
    });
  }
}
