export const nameRegex = /^[a-zA-Z\s]+$/;
export const phoneRegex = /^[6-9]\d{9}$/;
export const pincodeRegex = /^[1-9][0-9]{5}$/;
export const gstinRegex =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const validateName = (name: string) => nameRegex.test(name);
export const validatePhone = (phone: string) => phoneRegex.test(phone);
export const validatePincode = (pincode: string) => pincodeRegex.test(pincode);
export const validateGstin = (gstin: string) => gstinRegex.test(gstin);
export const validatePan = (pan: string) => panRegex.test(pan);
export const validateIfsc = (ifsc: string) => ifscRegex.test(ifsc);
