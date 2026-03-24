/**
 * api/index.ts — Mock API service functions for Idhayam Distributor App
 */

import {
    BASE_URL,
    DEMO_CUSTOMER_ID,
    DEMO_CUST_TYPE,
    API_TOKEN
} from './config';
import { encode as btoa } from 'base-64';

/** Mock delay simulator */
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAppVersion(): Promise<any> {
    const pkg = require('../../package.json');
    const appVersion = pkg?.version || '0.0.1';

    const payload = {
        "mobilenumber": appVersion,
        "otp": "",
        "frm_dt": "",
        "to_dt": ""
    };
    
    // Strict Minification (removing spaces/newlines)
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');
    
    try {
        const response = await fetch('http://117.232.71.91:2101/MOB/APPEAL_UAT', {
            method: 'POST',
            headers: {
                'F': 'CLOUDAPP_KEY',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST'
            }
        });
        
        // Handling both text and json response gracefully
        const textData = await response.text();
        console.log("CLOUDAPP_KEY Response:", textData);
        return textData ? JSON.parse(textData) : { success: true };
    } catch (e) {
        console.error("CLOUDAPP_KEY Error:", e);
        return { success: false };
    }
}

export async function getMobileListByPan(pan: string): Promise<string[]> {
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
        // Safely parse array response or return mock on fail
        const data = textData ? JSON.parse(textData) : null;
        return Array.isArray(data) ? data : ['9443534646', '9876543210'];
    } catch (e) {
        console.error("GetmobileListByPan Error:", e);
        return ['9443534646', '9876543210']; // fallback mock
    }
}

export async function generateOtp(pan: string, mobile: string): Promise<any> {
    await delay(400);
    return { success: true, message: 'OTP Generated' };
}

export async function verifyOtp(pan: string, mobile: string, otp: string): Promise<any> {
    await delay(600);
    return { success: true, message: 'OTP Verified' };
}

export async function loginCheck(pan: string, mobile: string, deviceId: string): Promise<any> {
    await delay(800);
    return {
        success: true,
        data: {
            custId: DEMO_CUSTOMER_ID,
            custName: 'IDHAYAM DISTRIBUTORS',
            token: 'mock-token-123',
        }
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD / HOME
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerBalance(custId = DEMO_CUSTOMER_ID): Promise<any> {
    const payload = { A: custId, B: DEMO_CUST_TYPE };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CUST_BALANCE_CHK',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('CUST_BALANCE_CHK Raw Response:', textData);

        // Helper: keep parsing as long as the value is a JSON string
        const deepParse = (val: any): any => {
            if (typeof val === 'string') {
                try { return deepParse(JSON.parse(val)); } catch { return val; }
            }
            return val;
        };

        // Fully unwrap all encoding layers
        const outer = deepParse(textData);
        console.log('CUST_BALANCE_CHK Outer:', JSON.stringify(outer));

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_BALANCE_CHK Inner:', JSON.stringify(inner));

            return {
                balance:      inner.DMOBNO ?? '0.00',   // Outstanding amount
                pendingOrder: inner.MOBNO  ?? '0.00',   // Orders in queue
                netBalance:   inner.NAME   ?? '0.00',   // Net payable
            };
        }
    } catch (e) {
        console.error('CUST_BALANCE_CHK Error:', e);
    }

    // Fallback so UI never breaks
    return { balance: '0.00', pendingOrder: '0.00', netBalance: '0.00' };
}

export async function getInvoicedVehicleList(custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(500);
    return [
        { vehicleNo: 'TN67BH5688', tripRefNo: 'TJ-1870', branchId: '92', tripId: '79' }
    ];
}

export async function getVehicleTracking(branchId: string, tripId: string, tripRefNo: string): Promise<any> {
    await delay(800);
    return {
        latitude: 9.3622,
        longitude: 77.9404,
        status: 'On the way',
        lastUpdated: new Date().toISOString()
    };
}

export async function getTripStopList(tripTransId: string, tripRefNo: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(600);
    return [
        { id: '1', name: 'Virudhunagar Hub', reached: true },
        { id: '2', name: 'Sivakasi Point', reached: false },
        { id: '3', name: 'Madurai Depot', reached: false },
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISCOUNT
// ─────────────────────────────────────────────────────────────────────────────

export async function getDiscountSummary(custId = DEMO_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: custId,
        B: DEMO_CUST_TYPE,
        C: 'DISCOUNT_NAME',
        D: '',
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    // Reusable deep-parse helper (handles multi-encoded JSON strings)
    const deepParse = (val: any): any => {
        if (typeof val === 'string') {
            try { return deepParse(JSON.parse(val)); } catch { return val; }
        }
        return val;
    };

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CUST_DISCOUNT_SUM',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('CUST_DISCOUNT_SUM Raw Response:', textData);

        const outer = deepParse(textData);
        console.log('CUST_DISCOUNT_SUM Outer:', JSON.stringify(outer));

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_DISCOUNT_SUM Inner:', JSON.stringify(inner));

            // Result may be an array or a single object — normalise to array
            const rows = Array.isArray(inner) ? inner : [inner];
            return rows;
        }
    } catch (e) {
        console.error('CUST_DISCOUNT_SUM Error:', e);
    }

    // Fallback so UI never breaks
    return [];
}

export async function getDiscountDetail(discountIds: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(600);
    return [
        { id: '101', slab: 'Slab 1', disc: '5%', min: '100', max: '500' },
        { id: '101', slab: 'Slab 2', disc: '8%', min: '501', max: '2000' }
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRICE DETAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPriceList(custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(600);
    return [
        { id: '1', name: 'H.Refined Groundnut Oil 1L', price: '195.00', unit: 'Bottle' },
        { id: '2', name: 'H.Refined Groundnut Oil 500ml', price: '102.00', unit: 'Bottle' },
        { id: '3', name: 'H.Sesame Oil 1L', price: '345.00', unit: 'Pouch' },
        { id: '4', name: 'H.Sesame Oil 500ml', price: '178.00', unit: 'Pouch' }
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrderItems(custId = DEMO_CUSTOMER_ID): Promise<any> {
    return getPriceList(custId);
}

export async function submitOrder(custId: string, orderDetails: any[]): Promise<any> {
    await delay(1000);
    return {
        success: true,
        orderId: 'ORD-' + Math.floor(Math.random() * 90000 + 10000),
        message: 'Order placed successfully'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrderList(fromDate: string, toDate: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(700);
    return [
        { id: 'ORD-12345', date: '2026-03-15', amount: '5840.00', status: 'Delivered' },
        { id: 'ORD-12348', date: '2026-03-18', amount: '2210.00', status: 'Pending' }
    ];
}

export async function getInvoiceList(fromDate: string, toDate: string, type: 'SI' | 'CNDN' = 'SI', custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(700);
    return [
        { id: 'INV-7890', date: '2026-03-10', amount: '12400.00' },
        { id: 'INV-7901', date: '2026-03-12', amount: '8560.00' }
    ];
}

export async function downloadBillPdf(type: 'SI' | 'CNDN', billIds: string): Promise<any> {
    await delay(1200);
    return { success: true, url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' };
}

export async function getTransactionList(fromDate: string, toDate: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(700);
    return [
        { id: 'T1', date: '2026-03-01', type: 'Payment', credit: '10000.00', debit: '0.00', balance: '10000.00' },
        { id: 'T2', date: '2026-03-05', type: 'Invoice', credit: '0.00', debit: '4500.00', balance: '5500.00' }
    ];
}

export function getTransactionPdfUrl(custId = DEMO_CUSTOMER_ID): string {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT US
// ─────────────────────────────────────────────────────────────────────────────

export async function getContactInfo(custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(400);
    return {
        company: 'IDHAYAM DISTRIBUTOR HEAD OFFICE',
        address: 'Virudhunagar, Tamil Nadu',
        phone: '+91 4562 252 252',
        email: 'info@idhayam.com'
    };
}

// ─────────────────────────────────────────────────────────────────────────────
//  BANK DETAILS
// ─────────────────────────────────────────────────────────────────────────────

export async function getBankDetails(custId = DEMO_CUSTOMER_ID): Promise<any> {
    await delay(400);
    return {
        accName: 'IDHAYAM G-NUT OIL PVT LTD',
        accNo: '923020012345678',
        ifsc: 'UTIB0000123',
        bank: 'AXIS BANK LTD',
        branch: 'VIRUDHUNAGAR'
    };
}

