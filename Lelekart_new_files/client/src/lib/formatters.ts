/**
 * Collection of utility functions for formatting data in a consistent way across the application
 */

/**
 * Format a number as a currency
 * @param amount - The amount to format
 * @param currency - The currency code (default: 'INR')
 * @param locale - The locale to use for formatting (default: 'en-IN')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number | string | null | undefined,
  currency = 'INR',
  locale = 'en-IN'
): string => {
  if (amount === null || amount === undefined) return '₹0.00';
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) return '₹0.00';
  
  // Use Intl formatter for the specified locale and currency
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

/**
 * Format a date in a consistent way
 * @param date - The date to format
 * @param format - The format to use (default: 'medium')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | number | null | undefined,
  format: 'short' | 'medium' | 'long' = 'medium',
  locale = 'en-IN'
): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' || typeof date === 'number'
    ? new Date(date)
    : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Date format options based on the requested format
  let options: Intl.DateTimeFormatOptions;
  
  switch (format) {
    case 'short':
      options = { day: 'numeric', month: 'short', year: 'numeric' };
      break;
    case 'long':
      options = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      break;
    case 'medium':
    default:
      options = { day: 'numeric', month: 'long', year: 'numeric' };
      break;
  }
  
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format a phone number in a consistent way
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format for India: +91 XXXX XXXXXX
  if (cleaned.length === 10) {
    return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  
  // If it starts with country code
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
  }
  
  // Return as is if doesn't match expected formats
  return phone;
};

/**
 * Format a file size in a human-readable way
 * @param bytes - The size in bytes
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format a percentage
 * @param value - The value to format as percentage
 * @param decimals - Number of decimal places
 * @returns Formatted percentage
 */
export const formatPercentage = (
  value: number | string | null | undefined,
  decimals = 2
): string => {
  if (value === null || value === undefined) return '0%';
  
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) return '0%';
  
  return `${numericValue.toFixed(decimals)}%`;
};

/**
 * Format product status with standardized terms
 * @param status - The status to format
 * @returns Formatted status
 */
export const formatProductStatus = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  
  // Standardize status terms
  const statusMap: Record<string, string> = {
    'active': 'Active',
    'inactive': 'Inactive',
    'draft': 'Draft',
    'approved': 'Approved',
    'rejected': 'Rejected',
    'pending': 'Pending Approval',
    'out_of_stock': 'Out of Stock',
    'low_stock': 'Low Stock',
  };
  
  return statusMap[status.toLowerCase()] || status;
};

/**
 * Format order status with standardized terms
 * @param status - The status to format
 * @returns Formatted status
 */
export const formatOrderStatus = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  
  // Standardize status terms
  const statusMap: Record<string, string> = {
    'pending': 'Pending',
    'processing': 'Processing',
    'packed': 'Packed',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'refunded': 'Refunded',
    'returned': 'Returned',
    'on_hold': 'On Hold',
    'payment_pending': 'Payment Pending',
    'failed': 'Failed',
  };
  
  return statusMap[status.toLowerCase()] || status;
};

/**
 * Truncate text with ellipsis if it exceeds max length
 * @param text - The text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export const truncateText = (
  text: string | null | undefined,
  maxLength: number
): string => {
  if (!text) return '';
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};