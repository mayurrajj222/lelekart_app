/**
 * Test Shiprocket connection by retrieving couriers
 */
export async function testShiprocketConnection(req: Request, res: Response) {
  try {
    // Check if user is authenticated and is admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    
    // Get token (this will automatically refresh if expired)
    let token;
    try {
      token = await getShiprocketToken();
      
      if (!token) {
        return res.status(400).json({ 
          error: "Shiprocket token not available", 
          message: "Please check your Shiprocket credentials or generate a new token.",
          code: "TOKEN_MISSING" 
        });
      }
    } catch (tokenError: any) {
      console.log("Shiprocket API error details:", tokenError.message);
      
      // Catch permission errors specifically
      if (tokenError.message && tokenError.message.includes("Unauthorized")) {
        return res.status(403).json({ 
          error: "API Permission Error",
          message: "Your Shiprocket account doesn't have the necessary API access permissions. This typically requires a Business plan or higher.",
          details: "Please upgrade your Shiprocket plan or contact Shiprocket support to enable API access.",
          code: "PERMISSION_ERROR"
        });
      }
      
      // For other token errors
      return res.status(400).json({ 
        error: "Error getting Shiprocket token", 
        message: tokenError.message || "Please check your Shiprocket credentials.",
        code: "TOKEN_ERROR"
      });
    }
    
    // Test API access by getting courier companies
    try {
      const response = await axios.get(`${SHIPROCKET_API_BASE}/courier/courierListWithCounts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: "Successfully connected to Shiprocket API"
      });
    } catch (apiError: any) {
      console.error("Error in Shiprocket API test call:", apiError?.response?.data || apiError.message);
      
      if (apiError?.response?.data) {
        return res.status(apiError.response.status || 400).json({
          error: "Error from Shiprocket API",
          message: apiError.response.data.message || "An error occurred while communicating with Shiprocket API",
          details: apiError.response.data
        });
      }
      
      return res.status(500).json({ 
        error: "Failed to communicate with Shiprocket API",
        message: apiError.message || "Connection test failed"
      });
    }
  } catch (error: any) {
    console.error("Error in testShiprocketConnection:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error.message || "An unexpected error occurred while processing your request."
    });
  }
}