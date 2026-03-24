/**
 * api/auth.ts — Mock Auth services
 */

import { API_TOKEN } from './config';
import { encode as btoa } from 'base-64';

/** Mock delay simulator */
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const AuthService = {
    /** Fetch Linked Mobiles for a PAN */
    async getMobileListByPan(pan: string): Promise<string[]> {
        try {
            const base64Pan = btoa(pan);
            const response = await fetch('http://117.232.71.91:2101/MOB/APPEAL_UAT', {
                method: 'GET',
                headers: {
                    'F': 'GetmobileListByPan',
                    'MODE': 'MOBILE',
                    'P': `pan=${base64Pan}`,
                    'J': '',
                    'M': 'GET',
                    'Authorization': API_TOKEN
                }
            });
            const textData = await response.text();
            console.log("GetmobileListByPan Response:", textData);
            
            let resultList: string[] = [];
            
            if (textData) {
                try {
                    // Sometimes responses come as a stringified JSON string (double-encoded)
                    let outerObj = JSON.parse(textData);
                    if (typeof outerObj === 'string') {
                        outerObj = JSON.parse(outerObj);
                    }
                    
                    if (outerObj.success && typeof outerObj.result === 'string') {
                        const innerArray = JSON.parse(outerObj.result);
                        
                        if (Array.isArray(innerArray)) {
                            resultList = innerArray.map((item: any) => item.MOBNO || item.DMOBNO || '').filter(Boolean);
                        }
                    }
                } catch (parseError) {
                    console.error("JSON Parsing Error for getMobileListByPan:", parseError);
                }
            }
            
            return resultList.length > 0 ? resultList : ['1237894560', '9443534646'];
        } catch (e) {
            console.error("GetmobileListByPan Error:", e);
            return ['9443534646', '9876543210']; // fallback mock
        }
    },

    /** Generate OTP */
    async generateOtp(pan: string, mobile: string): Promise<any> {
        try {
            const base64Pan = btoa(pan);
            const payload = {
                mobilenumber: mobile,
                pan: base64Pan,
                pwd: "Oneplus##OPPO##Never Settle"
            };
            const response = await fetch('http://117.232.71.91:2101/MOB/APPEAL_UAT', {
                method: 'POST',
                headers: {
                    'F': 'Cust_OTP_GEN',
                    'MODE': 'MOBILE',
                    'P': '',
                    'J': JSON.stringify(payload),
                    'M': 'POST',
                    'Authorization': API_TOKEN
                }
            });
            const textData = await response.text();
            console.log("Cust_OTP_GEN Response:", textData);
            
            try {
                let parsed = JSON.parse(textData);
                if (typeof parsed === 'string') {
                    parsed = JSON.parse(parsed);
                }
                
                // Prioritize 'message' if it exists and 'result' for supplementary info
                let finalMsg = parsed.message || 'OTP Sent';
                if (parsed.result && !parsed.message) {
                    finalMsg = String(parsed.result);
                }
                
                return { success: true, message: finalMsg };
            } catch (e) {
                return { success: true, message: textData || 'OTP Sent' }; 
            }
        } catch (e) {
            console.error("Generate OTP Error:", e);
            throw new Error(String(e) || "Failed to send OTP");
        }
    },

    /** Verify OTP */
    async verifyOtp(_pan: string, _mobile: string, _otp: string): Promise<any> {
        await delay(600);
        return { success: true, message: 'OTP Verified' };
    },

    /** Final Login Check / Auth after OTP */
    async checkLogin(_pan: string, _mobile: string): Promise<any> {
        await delay(800);
        return {
            success: true,
            data: {
                custId: '10895',
                custName: 'IDHAYAM DISTRIBUTORS',
            }
        };
    }
};

