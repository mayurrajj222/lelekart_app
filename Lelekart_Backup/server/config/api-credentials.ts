// API Credentials Configuration
// Add these environment variables to your .env file

export const API_CONFIG = {
  // Razorpay IFSC API (no credentials needed - public API)
  RAZORPAY: {
    IFSC_BASE_URL: "https://ifsc.razorpay.com",
  },

  // GST Portal API (if available)
  GST: {
    BASE_URL: "https://api.gst.gov.in", // Example URL
    API_KEY: process.env.GST_API_KEY || "",
  },
};

// Helper function to check if API credentials are configured
export const isAPIConfigured = (service: "gst") => {
  switch (service) {
    case "gst":
      return !!API_CONFIG.GST.API_KEY;
    default:
      return false;
  }
};
