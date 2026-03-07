import { encode } from 'base-64';

// Use standard API URL from docs
const BASE_URL = 'http://117.232.71.91:2101/MOB';
const API_TOKEN = 'Bearer 5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';

// Shared device info placeholder
const DEVICE_INFO = 'Idhayam RN Mobile ## Android';

export const AuthService = {
    /** Fetch Linked Mobiles for a PAN */
    async getMobileListByPan(pan: string): Promise<string[]> {
        const encodedPan = encode(pan);
        try {
            // Excel notes "pan = QU5..." as Parameter, while JSON column is empty.
            // Using POST with both query param and json body to maximize compatibility
            const res = await fetch(`${BASE_URL}/GetmobileListByPan?pan=${encodedPan}`, {
                method: 'POST',
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pan: encodedPan })
            });
            const data = await res.json();

            // Assume the API returns an array or an object with mobile numbers. 
            // In case the API is completely unreachable/down, we throw error.
            if (!res.ok) throw new Error('Failed to fetch mobiles from server.');

            console.log('Mobile List Data:', data);

            // Adjust this parsing based on actual backend format
            if (Array.isArray(data)) return data;
            if (data?.data && Array.isArray(data.data)) return data.data;
            if (data?.mobilenumber) return [data.mobilenumber];

            return [];
        } catch (error) {
            console.error('getMobileListByPan error:', error);
            throw error;
        }
    },

    /** Generate OTP */
    async generateOtp(pan: string, mobile: string): Promise<any> {
        const encodedPan = encode(pan);
        try {
            const res = await fetch(`${BASE_URL}/Cust_OTP_GEN`, {
                method: 'POST',
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobilenumber: mobile,
                    pan: encodedPan,
                    pwd: DEVICE_INFO
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Failed to send OTP.');
            return data;
        } catch (error) {
            console.error('generateOtp error:', error);
            throw error;
        }
    },

    /** Verify OTP */
    async verifyOtp(pan: string, mobile: string, otp: string): Promise<any> {
        const encodedPan = encode(pan);
        try {
            const res = await fetch(`${BASE_URL}/Cust_OTP_VER`, {
                method: 'POST',
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mobilenumber: mobile,
                    pan: encodedPan,
                    otp: otp,
                    pwd: DEVICE_INFO
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error('OTP Verification failed.');
            return data;
        } catch (error) {
            console.error('verifyOtp error:', error);
            throw error;
        }
    },

    /** Final Login Check / Auth after OTP */
    async checkLogin(pan: string, mobile: string): Promise<any> {
        const encodedPan = encode(pan);
        try {
            const res = await fetch(`${BASE_URL}/Cust_LOGIN_CHK`, {
                method: 'POST',
                headers: {
                    'Authorization': API_TOKEN,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pan: encodedPan,
                    mobilenumber: mobile,
                    eid: "2691", // As per document
                    did: "react_native_client_did_001", // Random Device ID
                    pname: "IDHAYAM",
                    dmobno: "",
                    deviceinfo: DEVICE_INFO
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error('Login Check failed.');
            return data;
        } catch (error) {
            console.error('checkLogin error:', error);
            throw error;
        }
    }
};
