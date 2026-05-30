/**
 * Central API configuration
 * All base URLs and shared tokens defined here for easy maintenance.
 */

export const BASE_URL = 'http://117.232.71.91:2101/MOB';

// ⚠️ NOTE: Store this in a secure vault / environment config for production.
// For now kept here to keep the app functional during development.
export const API_TOKEN = 'Bearer 5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';

export const DEVICE_INFO = 'Idhayam RN Mobile ## Android';

/**
 * Fallback values used ONLY when the server hasn't returned session data yet.
 * These should be replaced by real values from the login response.
 */
export const FALLBACK_CUSTOMER_ID = '10895';
export const FALLBACK_BRANCH_ID   = '92';
export const FALLBACK_CUST_TYPE   = 'CM';
export const FALLBACK_PARTY_MUD_ID = '2691';
