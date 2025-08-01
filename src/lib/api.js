// Production API base URL
export const API_BASE = 'https://www.lelekart.com';

// Import network utilities
import { networkMonitor, networkUtils } from './networkUtils';

// API Client with performance optimizations
class ApiClient {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.timeout = 10000; // 10 seconds timeout
  }

  // Create a cache key for requests
  getCacheKey(url, options = {}) {
    return `${url}-${JSON.stringify(options)}`;
  }

  // Check if request is already pending
  getPendingRequest(key) {
    return this.pendingRequests.get(key);
  }

  // Set pending request
  setPendingRequest(key, promise) {
    this.pendingRequests.set(key, promise);
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
    return promise;
  }

  // Make API request with timeout and caching
  async request(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    
    // Check if request is already pending
    const pendingRequest = this.getPendingRequest(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Check cache for GET requests
    if (options.method === 'GET' || !options.method) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data;
      }
    }

    const requestPromise = this._makeRequest(url, options);
    return this.setPendingRequest(cacheKey, requestPromise);
  }

  async _makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    // Start network monitoring
    const requestId = networkMonitor.startRequest(url, options);
    networkUtils.logRequest(url, options);
    const startTime = Date.now();

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        // Try to parse JSON error response, fallback to text
        let errorData = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textError = await response.text();
            errorData = { error: textError };
          }
        } catch (parseError) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        networkMonitor.endRequest(requestId, false, responseTime);
        networkUtils.logResponse(url, response.status, responseTime);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Try to parse JSON response, handle non-JSON responses
      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          const textData = await response.text();
          data = { message: textData };
        }
      } catch (parseError) {
        throw new Error('Invalid JSON response from server');
      }
      
      // End network monitoring
      networkMonitor.endRequest(requestId, true, responseTime);
      networkUtils.logResponse(url, response.status, responseTime);

      // Cache GET requests
      if (options.method === 'GET' || !options.method) {
        const cacheKey = this.getCacheKey(url, options);
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
        });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      networkMonitor.endRequest(requestId, false, responseTime);
      networkUtils.logError(url, error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Clear specific cache entry
  clearCacheEntry(url, options = {}) {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.delete(cacheKey);
  }
}

// Create global API client instance
const apiClient = new ApiClient();

// Export API client for external use
export { apiClient };

// Export network statistics for debugging
export const getNetworkStats = () => networkMonitor.getStats();
export const clearNetworkStats = () => networkMonitor.clearStats();

// Helper function for API requests
async function apiRequest(endpoint, options = {}) {
  try {
    const url = `${API_BASE}${endpoint}`;
    const data = await apiClient.request(url, options);
    return { success: true, ...data };
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    return { 
      success: false, 
      message: error.message || 'Network error', 
      error: String(error) 
    };
  }
}

export async function sendOtp(email) {
  return apiRequest('/api/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function verifyOtp(email, otp) {
  return apiRequest('/api/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

export async function demoLogin(username, password) {
  return apiRequest('/api/auth/demo-login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchAddresses() {
  const result = await apiRequest('/api/addresses', {
    method: 'GET',
    credentials: 'include',
  });
  
  if (result.success) {
    return { success: true, addresses: result };
  }
  return result;
}

export async function createAddress(addressData) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addressData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to create address');
    }
    
    const data = await res.json();
    return { success: true, address: data };
  } catch (err) {
    console.error('createAddress error:', err);
    return { success: false, message: err.message || 'Failed to create address', error: String(err) };
  }
}

export async function updateAddress(id, addressData) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(addressData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update address');
    }
    
    const data = await res.json();
    return { success: true, address: data };
  } catch (err) {
    console.error('updateAddress error:', err);
    return { success: false, message: err.message || 'Failed to update address', error: String(err) };
  }
}

export async function deleteAddress(id) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to delete address');
    }
    
    return { success: true };
  } catch (err) {
    console.error('deleteAddress error:', err);
    return { success: false, message: err.message || 'Failed to delete address', error: String(err) };
  }
}

export async function setDefaultAddress(id) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${id}/set-default`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to set default address');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('setDefaultAddress error:', err);
    return { success: false, message: err.message || 'Failed to set default address', error: String(err) };
  }
}

export async function setDefaultBillingAddress(id) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${id}/set-default-billing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to set default billing address');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('setDefaultBillingAddress error:', err);
    return { success: false, message: err.message || 'Failed to set default billing address', error: String(err) };
  }
}

export async function setDefaultShippingAddress(id) {
  try {
    const res = await fetch(`${API_BASE}/api/addresses/${id}/set-default-shipping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to set default shipping address');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('setDefaultShippingAddress error:', err);
    return { success: false, message: err.message || 'Failed to set default shipping address', error: String(err) };
  }
}

// Wishlist API functions
export async function fetchWishlist() {
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, wishlist: data };
  } catch (err) {
    console.error('fetchWishlist error:', err);
    return { success: false, message: 'Failed to fetch wishlist', error: String(err) };
  }
}

export async function addToWishlist(productId) {
  try {
    const res = await fetch(`${API_BASE}/api/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to add to wishlist');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('addToWishlist error:', err);
    return { success: false, message: err.message || 'Failed to add to wishlist', error: String(err) };
  }
}

export async function removeFromWishlist(productId) {
  try {
    const res = await fetch(`${API_BASE}/api/wishlist/${productId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to remove from wishlist');
    }
    
    return { success: true };
  } catch (err) {
    console.error('removeFromWishlist error:', err);
    return { success: false, message: err.message || 'Failed to remove from wishlist', error: String(err) };
  }
}

// Wallet API functions
export async function fetchWallet() {
  try {
    const res = await fetch(`${API_BASE}/api/wallet`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, wallet: data };
  } catch (err) {
    console.error('fetchWallet error:', err);
    return { success: false, message: 'Failed to fetch wallet', error: String(err) };
  }
}

export async function fetchWalletTransactions() {
  try {
    const res = await fetch(`${API_BASE}/api/wallet/transactions`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, transactions: data };
  } catch (err) {
    console.error('fetchWalletTransactions error:', err);
    return { success: false, message: 'Failed to fetch wallet transactions', error: String(err) };
  }
}

export async function redeemCoins(amount, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/api/wallet/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        amount,
        referenceType: options.referenceType || 'MANUAL',
        description: options.description || 'Manual redemption',
        orderValue: options.orderValue,
        category: options.category
      }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to redeem coins');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('redeemCoins error:', err);
    return { success: false, message: err.message || 'Failed to redeem coins', error: String(err) };
  }
}

// Gift Cards API functions
export async function fetchGiftCards() {
  try {
    const res = await fetch(`${API_BASE}/api/gift-cards`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, giftCards: data };
  } catch (err) {
    console.error('fetchGiftCards error:', err);
    return { success: false, message: 'Failed to fetch gift cards', error: String(err) };
  }
}

export async function checkGiftCardBalance(code) {
  try {
    const res = await fetch(`${API_BASE}/api/gift-cards/check-balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ code }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to check gift card balance');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('checkGiftCardBalance error:', err);
    return { success: false, message: err.message || 'Failed to check gift card balance', error: String(err) };
  }
}

export async function buyGiftCard(giftCardData) {
  try {
    const res = await fetch(`${API_BASE}/api/gift-cards/buy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(giftCardData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to buy gift card');
    }
    
    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    console.error('buyGiftCard error:', err);
    return { success: false, message: err.message || 'Failed to buy gift card', error: String(err) };
  }
}

// Settings API functions
export async function fetchUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/user`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, user: data };
  } catch (err) {
    console.error('fetchUserProfile error:', err);
    return { success: false, message: 'Failed to fetch user profile', error: String(err) };
  }
}

export async function updateUserProfile(profileData) {
  try {
    const res = await fetch(`${API_BASE}/api/user/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(profileData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }
    
    const data = await res.json();
    return { success: true, user: data };
  } catch (err) {
    console.error('updateUserProfile error:', err);
    return { success: false, message: err.message || 'Failed to update profile', error: String(err) };
  }
}

export async function changePassword(passwordData) {
  try {
    const res = await fetch(`${API_BASE}/api/user/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(passwordData),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to change password');
    }
    
    return { success: true };
  } catch (err) {
    console.error('changePassword error:', err);
    return { success: false, message: err.message || 'Failed to change password', error: String(err) };
  }
}

export async function fetchNotificationPreferences() {
  try {
    const res = await fetch(`${API_BASE}/api/user/notification-preferences`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return { success: true, preferences: data };
  } catch (err) {
    console.error('fetchNotificationPreferences error:', err);
    return { success: false, message: 'Failed to fetch notification preferences', error: String(err) };
  }
}

export async function updateNotificationPreferences(preferences) {
  try {
    const res = await fetch(`${API_BASE}/api/user/notification-preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(preferences),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Failed to update notification preferences');
    }
    
    return { success: true };
  } catch (err) {
    console.error('updateNotificationPreferences error:', err);
    return { success: false, message: err.message || 'Failed to update notification preferences', error: String(err) };
  }
} 