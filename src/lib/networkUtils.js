// Network utilities for performance monitoring and debugging

// Network performance monitor
class NetworkMonitor {
  constructor() {
    this.requests = new Map();
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
  }

  // Start monitoring a request
  startRequest(url, options = {}) {
    const requestId = Date.now() + Math.random();
    this.requests.set(requestId, {
      url,
      options,
      startTime: Date.now(),
      status: 'pending',
    });
    this.stats.totalRequests++;
    return requestId;
  }

  // End monitoring a request
  endRequest(requestId, success = true, responseTime = null) {
    const request = this.requests.get(requestId);
    if (request) {
      request.endTime = Date.now();
      request.responseTime = responseTime || (request.endTime - request.startTime);
      request.status = success ? 'success' : 'failed';
      
      if (success) {
        this.stats.successfulRequests++;
      } else {
        this.stats.failedRequests++;
      }
      
      this.stats.totalResponseTime += request.responseTime;
      this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.totalRequests;
      
      this.requests.delete(requestId);
    }
  }

  // Get performance statistics
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 
        ? (this.stats.successfulRequests / this.stats.totalRequests) * 100 
        : 0,
      activeRequests: this.requests.size,
    };
  }

  // Clear statistics
  clearStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
    };
    this.requests.clear();
  }

  // Log slow requests (over 5 seconds)
  logSlowRequests() {
    const slowRequests = [];
    this.requests.forEach((request, id) => {
      if (request.responseTime > 5000) {
        slowRequests.push({
          id,
          url: request.url,
          responseTime: request.responseTime,
        });
      }
    });
    
    if (slowRequests.length > 0) {
      console.warn('Slow API requests detected:', slowRequests);
    }
  }
}

// Create global network monitor
export const networkMonitor = new NetworkMonitor();

// Network debugging utilities
export const networkUtils = {
  // Log network request
  logRequest: (url, options = {}) => {
    if (__DEV__) {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    }
  },

  // Log network response
  logResponse: (url, status, responseTime) => {
    if (__DEV__) {
      const statusColor = status >= 200 && status < 300 ? '🟢' : '🔴';
      console.log(`${statusColor} API Response: ${status} ${url} (${responseTime}ms)`);
    }
  },

  // Log network error
  logError: (url, error) => {
    if (__DEV__) {
      console.error(`❌ API Error: ${url}`, error);
    }
  },

  // Check if device is online
  isOnline: () => {
    return navigator.onLine !== false;
  },

  // Get connection type (if available)
  getConnectionType: () => {
    if (navigator.connection) {
      return navigator.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  },

  // Retry function with exponential backoff
  retry: async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  },
};

// Export network monitor for use in API client
export default networkMonitor; 