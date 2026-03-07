/**
 * Central API configuration
 * All base URLs and shared tokens defined here for easy maintenance.
 */

export const BASE_URL = 'http://117.232.71.91:2101/MOB';
export const AUTH_BASE_URL = 'http://117.234.71.91:2101/MOB';  // Login uses this different IP (from Excel)
export const API_TOKEN = 'Bearer 5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';
export const DEVICE_INFO = 'Idhayam RN Mobile ## Android';

/** App context – in a real app, set these after login from server response */
export const DEMO_CUSTOMER_ID = '10895';
export const DEMO_BRANCH_ID = '92';
export const DEMO_CUST_TYPE = 'CM';
export const DEMO_PARTY_MUD_ID = '2691';
