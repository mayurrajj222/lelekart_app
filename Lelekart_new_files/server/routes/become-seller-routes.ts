import express from "express";
import {
  handleBecomeSeller,
  handleValidatePAN,
} from "../handlers/become-seller-handlers";
import { handleIFSCValidation } from "../handlers/ifsc-validation-handlers";
import { handlePincodeValidation } from "../handlers/pincode-validation-handlers";

const router = express.Router();

// Route to handle seller application submission
router.post("/become-seller", handleBecomeSeller);

// Route to validate PAN number
router.post("/validate-pan", handleValidatePAN);

// Route to validate IFSC code
router.post("/validate-ifsc", handleIFSCValidation);

// Route to validate pincode
router.post("/validate-pincode", handlePincodeValidation);

export default router;
