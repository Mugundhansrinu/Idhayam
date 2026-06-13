/**
 * api/auth.ts — Real authentication services (PAN, OTP, Login)
 */

import { Alert, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { API_TOKEN } from './config';
import { encode as btoa } from 'base-64';

const API_URL = 'http://117.232.71.91:2101/MOB/APPEAL_UAT';

export const AuthService = {
    /** Fetch Linked Mobiles for a PAN */
    async getMobileListByPan(pan: string): Promise<string[]> {
        const base64Pan = btoa(pan);
        const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
        'F': 'GetmobileListByPan',
        'MODE': 'MOBILE',
        'P': `pan=${base64Pan}`,
        'J': '',
        'M': 'GET',
        'Authorization': API_TOKEN,
    },
});
if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server error ${response.status}: ${errText}`);
}

        const textData = await response.text();
        console.log('GetmobileListByPan Response:', textData);

        try {
            let outer = JSON.parse(textData);
            if (typeof outer === 'string') outer = JSON.parse(outer);

            if (outer?.success && typeof outer.result === 'string') {
                const innerArray = JSON.parse(outer.result);
                if (Array.isArray(innerArray)) {
                    const mobiles = innerArray
                        .map((item: any) => item.MOBNO || item.DMOBNO || '')
                        .filter(Boolean);
                    if (mobiles.length > 0) return mobiles;
                }
            }
        } catch (parseError) {
            console.log('JSON Parsing Error for getMobileListByPan:', parseError);
        }

        // Throw so the caller can show a proper error to the user
        throw new Error('No linked mobiles found for this PAN. Please contact support.');
    },

    /** Generate OTP */
    async generateOtp(pan: string, mobile: string): Promise<any> {
        const base64Pan = btoa(pan);
        const deviceName =
            Platform.OS === 'android'
                ? `${(Platform.constants as any).Brand || 'Android'} ${(Platform.constants as any).Model || 'Device'}`
                : 'Apple Device';

        const payload = { mobilenumber: mobile, pan: base64Pan, pwd: deviceName };

        const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
        'F': 'Cust_OTP_GEN',
        'MODE': 'MOBILE',
        'P': '',
        'J': JSON.stringify(payload),
        'M': 'POST',
        'Authorization': API_TOKEN,
    },
});
if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Server error ${response.status}: ${errText}`);
}

        const textData = await response.text();
        console.log('Cust_OTP_GEN Response:', textData);

        try {
            let parsed = JSON.parse(textData);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            const finalMsg = parsed.message || (parsed.result ? String(parsed.result) : 'OTP Sent');
            return { success: true, message: finalMsg };
        } catch {
            return { success: true, message: textData || 'OTP Sent' };
        }
    },

    /** Verify OTP and return the eid from server response */
    async verifyOtp(pan: string, mobile: string, otp: string): Promise<any> {
        const base64Pan = btoa(pan);
        const deviceName =
            Platform.OS === 'android'
                ? `${(Platform.constants as any).Brand || 'Android'} ${(Platform.constants as any).Model || 'Device'}`
                : 'Apple Device';

        const payload = { mobilenumber: mobile, pan: base64Pan, otp, pwd: deviceName };
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'F': 'Cust_OTP_VER',
                'MODE': 'MOBILE',
                'P': '',
                'J': JSON.stringify(payload),
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Server error ${response.status}: ${errText}`);
        }



        const textData = await response.text();
        console.log('Cust_OTP_VER Response:', textData);

        let parsed: any;
        try {
            parsed = JSON.parse(textData);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        } catch {
            throw new Error('Please enter a valid OTP');
        }

        // Extract eid from result string (e.g. "id:3004")
        let eid = '3004';
        if (parsed?.result) {
            const match = String(parsed.result).match(/\bid\s*:\s*['"]?([0-9a-zA-Z]+)['"]?/);
            if (match) eid = match[1];
        }

        if (parsed?.message === 'Register Successfull..') {
            return { success: true, message: 'Register Successfull..', eid };
        }

        throw new Error('Please enter a valid OTP');
    },

    /** Final Login Check — returns branch list and session data */

        const base64Pan = btoa(pan);
        const did = await DeviceInfo.getUniqueId();
        const deviceName =
            Platform.OS === 'android'
                ? `${(Platform.constants as any).Brand || 'Android'} ## ${(Platform.constants as any).Model || 'Device'} ## android${Platform.Version || 'Unknown'}`
                : 'Apple Device';

        const manualJson = `{"pan":"${base64Pan}","mobilenumber":"${mobile}","eid":"${eid}","did":"${did}","pname":"IDHAYAM","dmobno":"","deviceinfo":"${deviceName}"}`;
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'F': 'Cust_LOGIN_CHK',
                'MODE': 'MOBILE',
                'P': '',
                'J': manualJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('Cust_LOGIN_CHK Response:', textData);

        try {
            let parsed = JSON.parse(textData);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            return { success: true, data: parsed };
        } catch {
            return { success: true, data: textData };
        }
    },
};
