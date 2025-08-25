// Configuration for the Lelekart mobile app
// This file should be included in your React Native / Expo app

// Production API URL (use your Replit deployment URL)
export const API_BASE_URL = 'https://lelekart.your-username.repl.co';

// Development API URL (when testing locally)
export const DEV_API_BASE_URL = 'http://localhost:5000';

// Function to get the appropriate base URL based on environment
export const getApiBaseUrl = (isDev = false) => {
  return isDev ? DEV_API_BASE_URL : API_BASE_URL;
};

// Example usage in your app:
/*
import axios from 'axios';
import { getApiBaseUrl } from './mobile-app-config';

// Create an axios instance with default configuration
const axiosClient = axios.create({
  baseURL: getApiBaseUrl(__DEV__), // Expo/React Native uses __DEV__ to determine environment
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout for mobile apps
  withCredentials: true, // This ensures cookies are sent with requests
});

// Add request interceptor to handle connection issues more gracefully
axiosClient.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
axiosClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.code === 'ECONNABORTED') {
      // Handle timeout errors
      console.error('Request timeout, server took too long to respond');
      // Show a user-friendly message
      Alert.alert('Connection Timeout', 'The server is taking too long to respond. Please try again later.');
    } else if (!error.response) {
      // Network error (server not reachable)
      console.error('Network error, cannot connect to server');
      // Show a user-friendly message
      Alert.alert('Network Error', 'Cannot connect to the server. Please check your internet connection and try again.');
    } else {
      // Server responded with an error
      console.error('API Error Response:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
*/