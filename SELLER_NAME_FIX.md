# Seller Name Display Fix

## Issue
Some products (e.g., "lelekart") were not showing seller names in the product details and listings.

## Root Cause
The app was only checking a limited set of field names for seller information:
- `sellerName`
- `seller.name`
- `seller.username`
- `sellerUsername`

However, the API might be returning seller information in other field names that weren't being checked.

## Solution
Enhanced seller name normalization logic to check for additional possible field names:

### New Fields Checked (in order of priority):
1. `sellerUsername`
2. `seller.username`
3. `seller.name`
4. `seller_name`
5. `sellerName`
6. `seller_username`
7. `store_name`
8. `storeName`
9. `shop_name`
10. `shopName`
11. `brand`
12. `brandName`
13. `vendor`
14. `vendorName`

## Files Modified

### 1. ProductDetail.js
- Enhanced seller normalization in 3 places:
  - Main product fetch (line ~656)
  - Product parameter handling (line ~758)
  - Refresh function (line ~799)
- Added debug logging to show all seller-related fields
- Updated similar products logic to use expanded field checking

### 2. ProductListScreen.js
- Added seller normalization to product fetch logic
- Ensures seller names are displayed consistently in product listings

### 3. HomeTab.js
- Added seller normalization to main product fetch
- Added seller normalization to deal of the day fetch
- Ensures seller names are displayed in home screen product cards

## Testing
After this fix:
1. Products like "lelekart" should now display seller names
2. All product listings (home, category, search) should show seller names consistently
3. Debug logs in ProductDetail will show which seller fields are available in the API response

## Debug Information
Added console logging in ProductDetail.js to show all seller-related fields from the API response:
```javascript
console.log('Seller info debug:', {
  sellerName: data.sellerName,
  seller: data.seller,
  sellerUsername: data.sellerUsername,
  seller_name: data.seller_name,
  // ... all other fields
});
```

This will help identify which field contains the seller information for products that were previously not showing seller names.