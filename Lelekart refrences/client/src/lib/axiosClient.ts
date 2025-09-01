import axios from 'axios';

// Create an axios instance with default configuration
const axiosClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  },
  withCredentials: true, // This ensures cookies are sent with requests
});

// Add a response interceptor for error handling
axiosClient.interceptors.response.use(
  (response) => {
    // Check if response is actually HTML instead of JSON (which happens when auth redirects occur)
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('text/html') && response.config.url?.includes('/api/')) {
      // If we get HTML for an API request, it's likely an auth issue
      console.error('Received HTML response for API request - likely an auth issue');
      return Promise.reject(new Error('Authentication required'));
    }
    return response;
  },
  (error) => {
    // If we have a response from the server
    if (error.response) {
      console.error('Axios error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      });
      
      // Check for auth errors
      if (error.response.status === 401) {
        console.error('Authentication error - redirecting to login');
        // Redirect to login page if unauthorized
        window.location.href = '/auth';
        return Promise.reject(new Error('Authentication required'));
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Axios error request:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Axios error setup:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;