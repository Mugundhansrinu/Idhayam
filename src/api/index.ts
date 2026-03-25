/**
 * api/index.ts — API service functions for Idhayam Distributor App
 */

import {
    BASE_URL,
    FALLBACK_CUSTOMER_ID,
    FALLBACK_BRANCH_ID,
    FALLBACK_CUST_TYPE,
    API_TOKEN
} from './config';

/** Mock delay simulator (used for not-yet-integrated endpoints) */
const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** Reusable deep-parser: handles multi-layer JSON-encoded strings from server */
const deepParse = (val: any): any => {
    if (typeof val === 'string') {
        try { return deepParse(JSON.parse(val)); } catch { return val; }
    }
    return val;
};

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH — delegate to auth.ts (canonical implementation)
// ─────────────────────────────────────────────────────────────────────────────

export { AuthService } from './auth';

// ─────────────────────────────────────────────────────────────────────────────
//  APP VERSION CHECK
// ─────────────────────────────────────────────────────────────────────────────

export async function checkAppVersion(): Promise<any> {
    const pkg = require('../../package.json');
    const appVersion = pkg?.version || '0.0.1';

    const payload = {
        mobilenumber: appVersion,
        otp: '',
        frm_dt: '',
        to_dt: '',
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CLOUDAPP_KEY',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
            },
        });
        const textData = await response.text();
        console.log('CLOUDAPP_KEY Response:', textData);
        return textData ? JSON.parse(textData) : { success: true };
    } catch (e) {
        console.error('CLOUDAPP_KEY Error:', e);
        return { success: false };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD / HOME
// ─────────────────────────────────────────────────────────────────────────────

export async function getCustomerBalance(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = { A: custId, B: FALLBACK_CUST_TYPE };
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

        const outer = deepParse(textData);

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_BALANCE_CHK Inner:', JSON.stringify(inner));

            const balance      = parseFloat(inner.DMOBNO ?? '0') || 0;
            const pendingOrder = parseFloat(inner.NAME   ?? '0') || 0;
            const netCalc      = balance - pendingOrder;
            const netBalance   = netCalc < 0 ? 0 : netCalc;

            return {
                balance:      balance.toFixed(2),
                pendingOrder: pendingOrder.toFixed(2),
                netBalance:   netBalance.toFixed(2),
            };
        }
    } catch (e) {
        console.error('CUST_BALANCE_CHK Error:', e);
    }

    return { balance: '0.00', pendingOrder: '0.00', netBalance: '0.00' };
}

export async function getInvoicedVehicleList(custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
    const payload = {
        A: branchId,
        B: custId,
        C: 'GetInvoicedVehicleList',
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CheckVehicleDetails',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('CheckVehicleDetails Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CheckVehicleDetails Inner:', JSON.stringify(inner));
            
            // Map common server fields to the app's internal format
            // Based on typical naming conventions seen in other screens
            const rows = Array.isArray(inner) ? inner : [inner];
            const mapped = rows.map(v => ({
                vehicleNo: v.VEH_NO || v.VEHICLE_NO || v.A || '—',
                tripRefNo: v.TRIP_REF_NO || v.B || '',
                branchId:  v.BRANCH_ID || branchId,
                tripId:    v.TRIP_ID || v.C || '',
            }));

            // Dashboard currently expects a single object or null
            return mapped.length > 0 ? mapped[0] : null;
        }
    } catch (e) {
        console.error('CheckVehicleDetails Error:', e);
    }

    return null;
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

export async function getTripStopList(tripTransId: string, tripRefNo: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
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

export async function getDiscountSummary(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: custId,
        B: FALLBACK_CUST_TYPE,
        C: 'DISCOUNT_NAME',
        D: '',
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

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

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_DISCOUNT_SUM Inner:', JSON.stringify(inner));
            return Array.isArray(inner) ? inner : [inner];
        }
    } catch (e) {
        console.error('CUST_DISCOUNT_SUM Error:', e);
    }

    return [];
}

export async function getDiscountDetail(discountIds: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    await delay(600);
    return [
        { id: '101', slab: 'Slab 1', disc: '5%', min: '100', max: '500' },
        { id: '101', slab: 'Slab 2', disc: '8%', min: '501', max: '2000' }
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRICE DETAILS / ORDERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches all items available for order or price list.
 * Uses FetchOrderItems with Cust_Id parameter.
 */
export async function getOrderItems(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchOrderItems',
                'MODE': 'MOBILE',
                'P': `Cust_Id=${custId}`,
                'J': '',
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchOrderItems Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            const rows = Array.isArray(inner) ? inner : [inner];

            // Normalize server fields to app format
            return rows.map(item => ({
                id:       String(item.ID || item.ITEM_ID),
                name:     `${item.ITEM_GRP_NAME} - ${item.ITEM_DESC}`,
                price:    parseFloat(item.PLUS_TAX || item.APP_PRICE || '0').toFixed(2),
                unit:     item.SALES_UOM || 'Pcs',
                category: item.ITEM_GRP_NAME,
                mrp:      parseFloat(item.APP_MRP || '0').toFixed(2),
                tax:      item.TAX_PER ? `${item.TAX_PER}%` : '0%'
            }));
        }
    } catch (e) {
        console.error('FetchOrderItems Error:', e);
    }
    return [];
}

export async function getPriceList(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    return getOrderItems(custId);
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

export async function getOrderList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    await delay(700);
    return [
        { id: 'ORD-12345', date: '2026-03-15', amount: '5840.00', status: 'Delivered' },
        { id: 'ORD-12348', date: '2026-03-18', amount: '2210.00', status: 'Pending' }
    ];
}

export async function getInvoiceList(fromDate: string, toDate: string, type: 'SI' | 'CNDN' = 'SI', custId = FALLBACK_CUSTOMER_ID): Promise<any> {
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

export async function getTransactionList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    await delay(700);
    return [
        { id: 'T1', date: '2026-03-01', type: 'Payment', credit: '10000.00', debit: '0.00', balance: '10000.00' },
        { id: 'T2', date: '2026-03-05', type: 'Invoice', credit: '0.00', debit: '4500.00', balance: '5500.00' }
    ];
}

export function getTransactionPdfUrl(custId = FALLBACK_CUSTOMER_ID): string {
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT US  →  APP_Contact
// ─────────────────────────────────────────────────────────────────────────────

// Raw token (without "Bearer " prefix) — required by the APP_Contact payload
const RAW_TOKEN = '5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';

export async function getContactInfo(
    custId   = FALLBACK_CUSTOMER_ID,
    branchId = FALLBACK_BRANCH_ID,
    custType = FALLBACK_CUST_TYPE,
): Promise<any> {
    const payload = {
        otp:          branchId,   // Branch ID
        mobilenumber: RAW_TOKEN,  // API token (raw, without "Bearer ")
        frm_dt:       custId,     // Customer ID
        to_dt:        custType,   // Customer type e.g. "CM"
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'APP_Contact',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('APP_Contact Raw Response:', textData);

        const outer = deepParse(textData);
        console.log('APP_Contact Outer:', JSON.stringify(outer));

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('APP_Contact Inner:', JSON.stringify(inner));
            return Array.isArray(inner) ? inner : [inner];
        }
    } catch (e) {
        console.error('APP_Contact Error:', e);
    }

    return [];
}

// ─────────────────────────────────────────────────────────────────────────────
//  BANK DETAILS  →  CUST_VitrualAcc_CHK
// ─────────────────────────────────────────────────────────────────────────────

export async function getBankDetails(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = { A: custId, B: FALLBACK_CUST_TYPE };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CUST_VitrualAcc_CHK',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('CUST_VitrualAcc_CHK Raw Response:', textData);

        const outer = deepParse(textData);

        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_VitrualAcc_CHK Inner:', JSON.stringify(inner));
            return Array.isArray(inner) ? inner : [inner];
        }
    } catch (e) {
        console.error('CUST_VitrualAcc_CHK Error:', e);
    }

    return [];
}
