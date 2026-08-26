// frontend/src/constants/api.ts
/**
 * กำหนด Base URL ของ Backend Server
 * - เมื่อทดสอบบน Cloud: 'http://119.59.102.161:3020'
 * - เมื่อทดสอบบน Web Localhost: 'http://localhost:3020'
 * - เมื่อทดสอบบน Android Emulator Localhost: 'http://10.0.2.2:3020'
 */
export const API_BASE_URL = 'http://119.59.102.161:3020';

export const API_ENDPOINTS = {
  BASE: API_BASE_URL,
  LOGIN: `${API_BASE_URL}/api/login`,
  REGISTER: `${API_BASE_URL}/api/register`,
  PRODUCTS: `${API_BASE_URL}/api/products`,
  FINANCES: `${API_BASE_URL}/api/finances`,
  CART: `${API_BASE_URL}/api/cart`,
  FAVORITES: `${API_BASE_URL}/api/favorites`,
};

