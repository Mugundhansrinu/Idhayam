/**
 * api/index.ts — API service functions for Idhayam Distributor App
 */

import { Alert } from 'react-native';
import {
    BASE_URL,
    FALLBACK_CUSTOMER_ID,
    FALLBACK_BRANCH_ID,
    FALLBACK_CUST_TYPE,
    API_TOKEN
} from './config';


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
                'Authorization': API_TOKEN,
            },
        });
        const textData = await response.text();
        console.log('CLOUDAPP_KEY Response:', textData);
        return textData ? JSON.parse(textData) : { success: true };
    } catch (e) {
        console.warn('CLOUDAPP_KEY Network Error (likely server down):', e);
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

            const balance = parseFloat(inner.DMOBNO ?? '0') || 0;
            const pendingOrder = parseFloat(inner.NAME ?? '0') || 0;
            const netCalc = balance - pendingOrder;
            const netBalance = netCalc < 0 ? 0 : netCalc;

            return {
                balance: balance.toFixed(2),
                pendingOrder: pendingOrder.toFixed(2),
                netBalance: netBalance.toFixed(2),
            };
        }
    } catch (e) {
        console.log('CUST_BALANCE_CHK Error:', e);
    }

    return { balance: '0.00', pendingOrder: '0.00', netBalance: '0.00' };
}

export async function getInvoicedVehicleList(custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
    const payload = {
        A: '51',
        B: '46',
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
            const mapped = rows.map((v: any) => ({
                vehicleNo: v.VEHICLE_NO || v.BUS_NO || '—',
                busNo: v.BUS_NO || '',
                tripName: v.TRIP_NAME || v.TRIP || '',
                tripCode: v.TRIP_CODE || '',
                tripId: v.TRIP_ID || '',
                tripTransId: v.TRIP_TRANS_ID || v.ID || '',
                apiTripId: v.API_TRIP_ID || '',
                tripRefNo: v.REF_NO || '',
                invNo: v.INV_NO || '',
                status: v.STATUS || '',
                tripType: v.TRIP_TYPE || '',
                branchId: v.BRANCH_ID || branchId,
                latitude: v.LATITUDE || null,
                longitude: v.LONGITUDE || null,
            }));

            // Dashboard currently expects a single object or null
            return mapped.length > 0 ? mapped[0] : null;
        }
    } catch (e) {
        console.log('CheckVehicleDetails Error:', e);
    }

    return null;
}

export async function getVehicleTracking(branchId: string, tripId: string, tripRefNo: string): Promise<any> {
    const payload = {
        A: '51',
        B: tripId,
        C: 'GetVehicleTrackingStatus',
        D: '',
        E: 'No',
        F: tripRefNo,
        G: 'PARTY'
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'GetVehicleTrackingStatus',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });
        const textData = await response.text();
        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            const data = Array.isArray(inner) ? inner[0] : inner;

            let stops: any[] = [];
            if (data.BUS_STATUS_TRACKINGS) {
                const trackings = Array.isArray(data.BUS_STATUS_TRACKINGS) ? data.BUS_STATUS_TRACKINGS : [data.BUS_STATUS_TRACKINGS];
                stops = trackings.map((t: any) => ({
                    lat: parseFloat(t.LATITUDE),
                    lng: parseFloat(t.LONGITUDE),
                    address: t.ADDRS || t.STOP_NAME || 'Stop',
                    status: t.STATUS
                })).filter((t: any) => !isNaN(t.lat) && !isNaN(t.lng));
            }

            // Include current location as the starting point for the route line
            if (data.LATITUDE && data.LONGITUDE) {
                stops.unshift({ lat: parseFloat(data.LATITUDE), lng: parseFloat(data.LONGITUDE), address: 'Current Location', status: data.STATUS || 'In Progress' });
            }

            return {
                latitude: parseFloat(data.LATITUDE || data.A || '9.3622'),
                longitude: parseFloat(data.LONGITUDE || data.B || '77.9404'),
                status: data.STATUS || data.C || 'Moving',
                stops: stops,
                lastUpdated: new Date().toISOString()
            };
        }
    } catch (e) {
        console.log('getVehicleTracking Error:', e);
    }
    return null;
}

export async function getTripStopList(tripTransId: string, tripRefNo: string, custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
    const payload = {
        A: branchId,
        B: tripTransId,
        C: custId,
        D: tripRefNo,
        E: 'Yes',
        F: ''
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'GetStopList',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });
        const textData = await response.text();
        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            const rows = Array.isArray(inner) ? inner : [inner];
            return rows.map((r: any, i: number) => ({
                id: String(i + 1),
                name: r.STOP_NAME || r.A || 'Unknown Stop',
                reached: !!(r.IS_REACHED || r.B === 'Yes')
            }));
        }
    } catch (e) {
        console.log('getTripStopList Error:', e);
    }
    return [];
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
        console.log('CUST_DISCOUNT_SUM Error:', e);
    }

    return [];
}

export async function getDiscountDetail(discountIds: string, type: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: custId,
        B: FALLBACK_CUST_TYPE,
        C: 'DISCOUNT_DETAIL',
        D: type,
        E: discountIds,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'CUST_DISCOUNT',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('CUST_DISCOUNT Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('CUST_DISCOUNT Inner:', JSON.stringify(inner));
            return Array.isArray(inner) ? inner : [inner];
        }
    } catch (e) {
        console.log('CUST_DISCOUNT Error:', e);
    }
    return [];
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
                id: String(item.ID || item.ITEM_ID),
                name: item.ITEM_DESC || 'Unknown Item',
                price: parseFloat(item.PLUS_TAX || item.APP_PRICE || '0').toFixed(2),
                unit: item.SALES_UOM || 'Pcs',
                category: item.ITEM_GRP_NAME,
                mrp: parseFloat(item.APP_MRP || '0').toFixed(2),
                tax: item.TAX_PER ? `${item.TAX_PER}%` : '0%',
                raw: item // Keep raw data for order submission
            }));
        }
    } catch (e) {
        console.log('FetchOrderItems Error:', e);
    }
    return [];
}

export async function getPriceList(custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    return getOrderItems(custId);
}

export async function submitOrder(custId: string, orderDetails: any[], branchId = FALLBACK_BRANCH_ID, userId = '2937'): Promise<any> {
    const items = orderDetails.map(o => {
        const raw = o.raw || {};
        const price = parseFloat(o.price || '0');
        const box = parseFloat(o.box || '0');
        const pcs = parseFloat(o.pcs || '0');
        const convFactor = parseFloat(raw.CONV_FACTOR || '1');
        const totalPcs = (box * convFactor) + pcs;
        const lineAmt = totalPcs * price;

        // Tax percentage (from raw response)
        const taxRate = parseFloat(raw.TAX_PER || '0'); // e.g. 5.0
        const taxAmt = (lineAmt * taxRate) / 100;
        const totalAmt = lineAmt + taxAmt;

        return {
            ITEM_ID: String(raw.ITEM_ID || raw.ID || '0'),
            ITEM_GROUP_ID: String(raw.ITEM_GROUP_ID || '0'),
            ITEM_GRP_NAME: String(raw.ITEM_GRP_NAME || ''),
            ITEM_DESC: String(raw.ITEM_DESC || ''),
            DISPLAY_NAME: String(raw.DISPLAY_NAME || ''),
            SALES_UOM: String(raw.SALES_UOM || 'Pcs'),
            UOM: String(raw.UOM || ''),
            CONV_FACTOR: Number(convFactor) || 1,
            PACKING_FACTOR: Number(raw.PACKING_FACTOR) || 0,
            SO_ID: Number(raw.SO_ID) || 0,
            ORDER_NO: Number(raw.ORDER_NO) || 0,
            ORDER_DATE: String(raw.ORDER_DATE || ''),
            ORD_QTY: Number(totalPcs) || 0,
            TOTAL_BOX: Number(box) || 0,
            TOTAL_AMOUNT: Number(totalAmt) || 0,
            ORD_PCS: Number(totalPcs) || 0,
            APP_PRICE: Number(price) || 0,
            PLUS_TAX: Number(raw.PLUS_TAX) || 0,
            APP_MRP: Number(o.mrp) || 0,
            TAX_PER: Number(taxAmt) || 0,
            APP_LINE_AMT: Number(lineAmt) || 0,
            APP_ORDER_AMT: Number(totalAmt) || 0,
            ORDER_NO_STR: String(raw.ORDER_NO_STR || ''),
            ID: 0,
            IG_SORT: 0,
            APP_PCS: 0,
            APP_QTY: 0,
            USR_ID: Number(userId) || 2937,
            STATUS: '',
            BOX_QTY: Number(box) || 0,
            PCS_QTY: Number(pcs) || 0,
            PRICETAG: true,
            IsRefreshing: false,
            RefreshCommand: null
        };
    });

    const payload = {
        A: custId,
        B: JSON.stringify(items),
        C: branchId,
        D: '', E: '', F: '', G: '', H: '', I: '', J: ''
    };

    const minifiedJson = JSON.stringify(payload);
    console.log('OrderCreation Final Payload:', minifiedJson);

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'OrderCreation',
                'MODE': 'MOBILE',
                'P': '',
                'J': '',
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
            body: minifiedJson,
        });

        const textData = await response.text();
        console.log('OrderCreation Raw Response:', textData);
        const outer = deepParse(textData);

        if (outer?.success) {
            return {
                success: true,
                orderId: outer.result || 'SUCCESS',
                message: outer.message || 'Order placed successfully'
            };
        }
        return { success: false, message: outer.message || 'Server error' };
    } catch (e) {
        console.log('submitOrder Error:', e);
        return { success: false, message: 'Network request failed' };
    }
}

// ─────────────────────────────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getOrderList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID, branchId = FALLBACK_BRANCH_ID): Promise<any> {
    const payload = {
        A: fromDate, // MM/DD/YYYY
        B: toDate,   // MM/DD/YYYY
        C: 'ORD',
        D: branchId,
        E: custId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchOrderList',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchOrderList Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            const rows = Array.isArray(inner) ? inner : [inner];

            return rows.map(o => ({
                id: o.ORD_NO || o.ID || o.Order_No || '—',
                date: o.ORD_DATE_STR || o.DATE || '—',
                amount: o.NET_AMT || o.AMOUNT || '0',
                status: o.STATUS || '—',
                branchId: o.BRANCH_ID || branchId,
                type: o.TYPE || '—',
            }));
        }
    } catch (e) {
        console.log('FetchOrderList Error:', e);
    }
    return [];
}

export async function getInvoiceList(fromDate: string, toDate: string, type: 'SI' | 'CNDN' = 'SI', branchId = FALLBACK_BRANCH_ID, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: fromDate, // MM/DD/YYYY
        B: toDate,   // MM/DD/YYYY
        C: type,
        D: branchId,
        E: custId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchBills',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchBills Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('FetchBills Inner:', JSON.stringify(inner));
            return Array.isArray(inner) ? inner : [inner];
        }
    } catch (e) {
        console.log('FetchBills Error:', e);
    }
    return [];
}

export async function getCreditDebitNotes(fromDate: string, toDate: string, branchId = FALLBACK_BRANCH_ID, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: fromDate, // MM/DD/YYYY
        B: toDate,   // MM/DD/YYYY
        C: 'CNDN',
        D: branchId,
        E: custId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');
    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchBills',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchBills(CNDN) Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            const rows = Array.isArray(inner) ? inner : [inner];

            // Log first row to Metro to discover actual field names
            if (rows.length > 0) {
                console.log('FetchBills(CNDN) First Row Fields:', JSON.stringify(rows[0]));
            }

            const stripTime = (val: any): string => {
                if (!val || val === '—') return '—';
                const s = String(val);
                // handles "2024-04-10T00:00:00", "04/10/2024 12:00:00", etc.
                return s.split('T')[0].split(' ')[0];
            };

            return rows.map((r: any) => ({
                id: r.BILL_NO || r.ID || r.CN_NO || r.DN_NO || '—',
                billId: r.ID != null ? String(r.ID) : '—',
                date: stripTime(r.BILL_DATE || r.DATE || r.CN_DATE || r.DN_DATE),
                amount: r.NET_AMT || r.AMOUNT || r.CN_AMT || r.DN_AMT || '0',
                type: r.BILL_TYPE || r.TYPE || r.NOTE_TYPE || 'CNDN',
                custName: r.CUST_NAME || r.PARTY || '',
                branchId: r.BRANCH_ID || branchId,
                raw: r,  // keep raw for full-field display
            }));
        }

        console.log('FetchBills(CNDN) – no result in response:', JSON.stringify(outer));
    } catch (e) {
        console.log('FetchBills(CNDN) Error:', e);
    }
    return [];
}

export async function downloadBillPdf(type: 'SI' | 'CNDN', billIds: string, branchId = FALLBACK_BRANCH_ID): Promise<any> {
    const payload = {
        A: type,
        B: billIds,
        C: branchId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchBillsPdf',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchBillsPdf Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            console.log('FetchBillsPdf Inner:', JSON.stringify(inner));

            // The result may be a plain URL string, or an object with a URL property
            let url: string | null = null;
            if (typeof inner === 'string' && inner.startsWith('http')) {
                url = inner;
            } else if (typeof inner === 'object' && inner !== null) {
                url = inner.URL || inner.url || inner.REPORT_URL || inner.ReportUrl || inner.DMOBNO || null;
                // Fallback: grab the first string value that looks like a URL
                if (!url) {
                    const vals = Object.values(inner) as string[];
                    url = vals.find((v: string) => typeof v === 'string' && v.startsWith('http')) || null;
                }
            }

            if (url) {
                return { success: true, url };
            }
        }
    } catch (e) {
        console.log('FetchBillsPdf Error:', e);
    }
    return { success: false, message: 'Failed to generate PDF' };
}

export async function getTransactionList(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: fromDate, // MM/DD/YYYY
        B: toDate,   // MM/DD/YYYY
        C: custId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchTransDetails',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchTransDetails PDF URL Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            // The result is the PDF URL string based on the user's shared JSON
            return { success: true, url: outer.result };
        }
    } catch (e) {
        console.log('FetchTransDetails Error:', e);
    }

    return { success: false, message: 'Failed to fetch statement URL' };
}

export async function getTransactionPdf(fromDate: string, toDate: string, custId = FALLBACK_CUSTOMER_ID): Promise<any> {
    const payload = {
        A: fromDate, // MM/DD/YYYY
        B: toDate,   // MM/DD/YYYY
        C: custId,
    };
    const minifiedJson = JSON.stringify(payload).replace(/\s/g, '');

    try {
        const response = await fetch(`${BASE_URL}/APPEAL_UAT`, {
            method: 'POST',
            headers: {
                'F': 'FetchTransDetailsPDF',
                'MODE': 'MOBILE',
                'P': '',
                'J': minifiedJson,
                'M': 'POST',
                'Authorization': API_TOKEN,
            },
        });

        const textData = await response.text();
        console.log('FetchTransDetailsPDF Raw Response:', textData);

        const outer = deepParse(textData);
        if (outer?.success && outer?.result) {
            const inner = deepParse(outer.result);
            // Assuming result is a string URL or an object with a URL field
            const url = typeof inner === 'string' ? inner : inner.URL || inner.url || inner.DMOBNO;
            return { success: true, url };
        }
    } catch (e) {
        console.log('FetchTransDetailsPDF Error:', e);
    }
    return { success: false, message: 'Failed to generate PDF' };
}

export function getTransactionPdfUrl(custId = FALLBACK_CUSTOMER_ID): string {
    return '';
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT US  →  APP_Contact
// ─────────────────────────────────────────────────────────────────────────────

// Raw token (without "Bearer " prefix) — required by the APP_Contact payload
const RAW_TOKEN = '5HNdr62cpgiZ/Op3AU/uuUXRpkUVurMbVZPrUE+nOF1iHgazGrL8iWUU2jRuPPbU';

export async function getContactInfo(
    custId = FALLBACK_CUSTOMER_ID,
    branchId = FALLBACK_BRANCH_ID,
    custType = FALLBACK_CUST_TYPE,
): Promise<any> {
    const payload = {
        otp: branchId,   // Branch ID
        mobilenumber: RAW_TOKEN,  // API token (raw, without "Bearer ")
        frm_dt: custId,     // Customer ID
        to_dt: custType,   // Customer type e.g. "CM"
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
        console.log('APP_Contact Error:', e);
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
        console.log('CUST_VitrualAcc_CHK Error:', e);
    }

    return [];
}
