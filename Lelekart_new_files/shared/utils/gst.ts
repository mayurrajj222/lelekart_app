/**
 * Utility functions for GST calculation
 */

/**
 * Calculate the GST amount for a given price and rate (price is exclusive of GST)
 * @param price - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount
 */
export function calculateGstAmount(price: number, gstRate: number): number {
  return (price * gstRate) / 100;
}

/**
 * Calculate the base price from a price that includes GST
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The base price without GST
 */
export function calculateBasePrice(inclusivePrice: number, gstRate: number): number {
  return inclusivePrice / (1 + gstRate / 100);
}

/**
 * Extract the GST amount from a price that includes GST
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The GST amount contained in the inclusive price
 */
export function extractGstAmount(inclusivePrice: number, gstRate: number): number {
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  return inclusivePrice - basePrice;
}

/**
 * Calculate the total price including GST
 * @param price - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns The total price including GST
 */
export function calculatePriceWithGst(price: number, gstRate: number): number {
  return price + calculateGstAmount(price, gstRate);
}

/**
 * Format a price with GST breakdown for display (price is exclusive of GST)
 * @param basePrice - The base price without GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns Formatted string showing price breakdown with GST
 */
export function formatPriceWithGstBreakdown(basePrice: number, gstRate: number): string {
  // Guard against NaN or undefined values
  if (basePrice === undefined || isNaN(basePrice) || basePrice === null) {
    return "₹0.00 (₹0.00 + ₹0.00 GST @ " + (gstRate || 0) + "%)";
  }
  
  const gstAmount = calculateGstAmount(basePrice, gstRate);
  const totalPrice = basePrice + gstAmount;
  
  // Ensure all values are proper numbers before calling toFixed
  const formattedTotal = typeof totalPrice === 'number' ? totalPrice.toFixed(2) : '0.00';
  const formattedBase = typeof basePrice === 'number' ? basePrice.toFixed(2) : '0.00';
  const formattedGst = typeof gstAmount === 'number' ? gstAmount.toFixed(2) : '0.00';
  
  return `₹${formattedTotal} (₹${formattedBase} + ₹${formattedGst} GST @ ${gstRate}%)`;
}

/**
 * Format a GST-inclusive price with breakdown for display
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage (e.g., 18 for 18%)
 * @returns Formatted string showing price breakdown with GST
 */
export function formatGstInclusivePriceBreakdown(inclusivePrice: number, gstRate: number): string {
  // Guard against NaN or undefined values
  if (inclusivePrice === undefined || isNaN(inclusivePrice) || inclusivePrice === null) {
    return "₹0.00 (₹0.00 + ₹0.00 GST @ " + (gstRate || 0) + "%)";
  }
  
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  const gstAmount = inclusivePrice - basePrice;
  
  // Ensure all values are proper numbers before calling toFixed
  const formattedTotal = typeof inclusivePrice === 'number' ? inclusivePrice.toFixed(2) : '0.00';
  const formattedBase = typeof basePrice === 'number' ? basePrice.toFixed(2) : '0.00';
  const formattedGst = typeof gstAmount === 'number' ? gstAmount.toFixed(2) : '0.00';
  
  return `₹${formattedTotal} (₹${formattedBase} + ₹${formattedGst} GST @ ${gstRate}%)`;
}

/**
 * Get GST details for a product (price is exclusive of GST)
 * @param basePrice - The base price without GST
 * @param gstRate - The GST rate as a percentage
 * @returns Object containing GST details
 */
export function getGstDetails(basePrice: number, gstRate: number) {
  const gstAmount = calculateGstAmount(basePrice, gstRate);
  const totalPrice = basePrice + gstAmount;
  
  return {
    basePrice,
    gstRate,
    gstAmount,
    totalPrice
  };
}

/**
 * Get GST details for a product (price is inclusive of GST)
 * @param inclusivePrice - The price that already includes GST
 * @param gstRate - The GST rate as a percentage
 * @returns Object containing GST details
 */
export function getGstDetailsFromInclusive(inclusivePrice: number, gstRate: number) {
  const basePrice = calculateBasePrice(inclusivePrice, gstRate);
  const gstAmount = inclusivePrice - basePrice;
  
  return {
    basePrice,
    gstRate,
    gstAmount,
    totalPrice: inclusivePrice
  };
}