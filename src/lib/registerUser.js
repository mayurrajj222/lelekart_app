import { API_BASE } from './api';

/**
 * Registers a new user with the provided data.
 * @param {Object} userData - { username, email, role, name, phone, address }
 * @returns {Promise<Object>} The registered user data or error.
 */
export async function registerUser(userData) {
  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    // Optionally save user data to local storage or context here
    return { success: true, user: data.user };
  } catch (err) {
    return { success: false, error: err.message };
  }
} 