// This file contains PIN code to location mapping data for India
// Source: India Post PIN code directory

// Type definitions
export interface PincodeData {
  pincode: string;
  district: string;
  state: string;
}

// Top 100 cities/districts with their PIN codes
// This is a subset of the data for demonstration purposes
// In a production environment, this would be a database table or complete dataset
export const pincodeDatabase: PincodeData[] = [
  // Maharashtra
  { pincode: "400001", district: "Mumbai", state: "Maharashtra" },
  { pincode: "400002", district: "Mumbai", state: "Maharashtra" },
  { pincode: "400050", district: "Mumbai", state: "Maharashtra" },
  { pincode: "400601", district: "Thane", state: "Maharashtra" },
  { pincode: "400701", district: "Navi Mumbai", state: "Maharashtra" },
  { pincode: "411001", district: "Pune", state: "Maharashtra" },
  { pincode: "411002", district: "Pune", state: "Maharashtra" },
  { pincode: "440001", district: "Nagpur", state: "Maharashtra" },
  
  // Himachal Pradesh
  { pincode: "171001", district: "Shimla", state: "Himachal Pradesh" },
  { pincode: "171002", district: "Shimla", state: "Himachal Pradesh" },
  { pincode: "171006", district: "Shimla", state: "Himachal Pradesh" }, // Added Shimla 171006
  { pincode: "176001", district: "Mandi", state: "Himachal Pradesh" },
  { pincode: "176310", district: "Kullu", state: "Himachal Pradesh" },
  { pincode: "175101", district: "Solan", state: "Himachal Pradesh" },
  { pincode: "170001", district: "Dharamshala", state: "Himachal Pradesh" },
  { pincode: "140601", district: "Baddi", state: "Himachal Pradesh" },
  
  // Delhi
  { pincode: "110001", district: "New Delhi", state: "Delhi" },
  { pincode: "110002", district: "Delhi", state: "Delhi" },
  { pincode: "110003", district: "Delhi", state: "Delhi" },
  { pincode: "110006", district: "Delhi", state: "Delhi" },
  { pincode: "110009", district: "Delhi", state: "Delhi" },
  
  // Karnataka
  { pincode: "560001", district: "Bengaluru", state: "Karnataka" },
  { pincode: "560002", district: "Bengaluru", state: "Karnataka" },
  { pincode: "560003", district: "Bengaluru", state: "Karnataka" },
  { pincode: "570001", district: "Mysuru", state: "Karnataka" },
  
  // Tamil Nadu
  { pincode: "600001", district: "Chennai", state: "Tamil Nadu" },
  { pincode: "600002", district: "Chennai", state: "Tamil Nadu" },
  { pincode: "600003", district: "Chennai", state: "Tamil Nadu" },
  { pincode: "625001", district: "Madurai", state: "Tamil Nadu" },
  { pincode: "641001", district: "Coimbatore", state: "Tamil Nadu" },
  
  // Uttar Pradesh
  { pincode: "226001", district: "Lucknow", state: "Uttar Pradesh" },
  { pincode: "226002", district: "Lucknow", state: "Uttar Pradesh" },
  { pincode: "201301", district: "Noida", state: "Uttar Pradesh" },
  { pincode: "208001", district: "Kanpur", state: "Uttar Pradesh" },
  
  // Gujarat
  { pincode: "380001", district: "Ahmedabad", state: "Gujarat" },
  { pincode: "380002", district: "Ahmedabad", state: "Gujarat" },
  { pincode: "390001", district: "Vadodara", state: "Gujarat" },
  { pincode: "395001", district: "Surat", state: "Gujarat" },
  
  // Telangana
  { pincode: "500001", district: "Hyderabad", state: "Telangana" },
  { pincode: "500002", district: "Hyderabad", state: "Telangana" },
  { pincode: "500003", district: "Hyderabad", state: "Telangana" },
  
  // West Bengal
  { pincode: "700001", district: "Kolkata", state: "West Bengal" },
  { pincode: "700002", district: "Kolkata", state: "West Bengal" },
  { pincode: "700003", district: "Kolkata", state: "West Bengal" },
  
  // Rajasthan
  { pincode: "302001", district: "Jaipur", state: "Rajasthan" },
  { pincode: "302002", district: "Jaipur", state: "Rajasthan" },
  { pincode: "313001", district: "Udaipur", state: "Rajasthan" },
  
  // Punjab
  { pincode: "140001", district: "Chandigarh", state: "Punjab" },
  { pincode: "141001", district: "Ludhiana", state: "Punjab" },
  { pincode: "143001", district: "Amritsar", state: "Punjab" },
  
  // Bihar
  { pincode: "800001", district: "Patna", state: "Bihar" },
  { pincode: "800002", district: "Patna", state: "Bihar" },
  
  // Haryana
  { pincode: "122001", district: "Gurugram", state: "Haryana" },
  { pincode: "122002", district: "Gurugram", state: "Haryana" },
  { pincode: "121001", district: "Faridabad", state: "Haryana" },
  
  // Kerala
  { pincode: "695001", district: "Thiruvananthapuram", state: "Kerala" },
  { pincode: "682001", district: "Kochi", state: "Kerala" },
  { pincode: "673001", district: "Kozhikode", state: "Kerala" },
];

// Function to look up location data by PIN code
export function findLocationByPincode(pincode: string): PincodeData | null {
  return pincodeDatabase.find(entry => entry.pincode === pincode) || null;
}