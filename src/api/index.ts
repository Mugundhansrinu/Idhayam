/**
 * api/index.ts — All API service functions for Idhayam Distributor App
 * Mapped directly from DIGISAILOR_JSON_DETAILS.xlsx
 */
import { encode } from 'base-64';
import {
    BASE_URL,
    AUTH_BASE_URL,
    API_TOKEN,
    DEVICE_INFO,
    DEMO_CUSTOMER_ID,
    DEMO_BRANCH_ID,
    DEMO_CUST_TYPE,
    DEMO_PARTY_MUD_ID,
} from './config';

/** Shared fetch wrapper */
async function apiFetch(url: string, body?: object, method = 'POST'): Promise<any> {
    const res = await fetch(url, {
        method,
        headers: {
            'Authorization': API_TOKEN,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(`API Error [${res.status}]: ${JSON.stringify(data)}`);
    return data;
}

// ─────────────────────────────────────────────────────────────────────────────
//  AUTH
// ─────────────────────────────────────────────────────────────────────────────

/** Version check — called on app launch */
export async function checkAppVersion(version: string): Promise<any> {
    return apiFetch(`${AUTH_BASE_URL}/CLOUDAPP_KEY`, {
        mobilenumber: version,
        otp: '',
        frm_dt: '',
        to_dt: '',
    });
}

/** Fetch list of mobile numbers linked to a PAN */
export async function getMobileListByPan(pan: string): Promise<string[]> {
    const encodedPan = encode(pan);
    const data = await apiFetch(`${AUTH_BASE_URL}/GetmobileListByPan?pan=${encodedPan}`);
    console.log('[getMobileListByPan]', data);
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.mobilenumber) return [data.mobilenumber];
    return [];
}

/** Generate OTP for selected mobile */
export async function generateOtp(pan: string, mobile: string): Promise<any> {
    const encodedPan = encode(pan);
    return apiFetch(`${AUTH_BASE_URL}/Cust_OTP_GEN`, {
        mobilenumber: mobile,
        pan: encodedPan,
        pwd: DEVICE_INFO,
    });
}

/** Verify OTP */
export async function verifyOtp(pan: string, mobile: string, otp: string): Promise<any> {
    const encodedPan = encode(pan);
    return apiFetch(`${BASE_URL}/Cust_OTP_VER`, {
        mobilenumber: mobile,
        pan: encodedPan,
        otp,
        pwd: DEVICE_INFO,
    });
}

/** Final login — returns customer session data */
export async function loginCheck(pan: string, mobile: string, deviceId: string): Promise<any> {
    const encodedPan = encode(pan);
    return apiFetch(`${BASE_URL}/Cust_LOGIN_CHK`, {
        pan: encodedPan,
        mobilenumber: mobile,
        eid: DEMO_PARTY_MUD_ID,
        did: deviceId,
        pname: 'IDHAYAM',
        dmobno: '',
        deviceinfo: DEVICE_INFO,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD / HOME
// ─────────────────────────────────────────────────────────────────────────────

/** Check customer balance */
export async function getCustomerBalance(custId = DEMO_CUSTOMER_ID, custType = DEMO_CUST_TYPE): Promise<any> {
    return apiFetch(`${BASE_URL}/CUST_BALANCE_CHK`, { A: custId, B: custType });
}

/** Get invoiced vehicle list for delivery tracking */
export async function getInvoicedVehicleList(branchId = DEMO_BRANCH_ID, custId = DEMO_CUSTOMER_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/CheckVehicleDetails`, {
        A: branchId,
        B: custId,
        C: 'GetInvoicedVehicleList',
    });
}

/** Get vehicle tracking status for a trip */
export async function getVehicleTracking(branchId: string, tripId: string, tripRefNo: string): Promise<any> {
    return apiFetch(`http://117.232.71.91:2101/School/GetVehicleTrackingStatus`, {
        A: branchId,
        B: tripId,
        C: 'GetVehicleTrackingStatus',
        D: '',
        E: 'No',
        F: tripRefNo,
        G: 'PARTY',
    });
}

/** Get stop list / map waypoints for a trip */
export async function getTripStopList(tripTransId: string, tripRefNo: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/GetStopList`, {
        A: DEMO_BRANCH_ID,
        B: tripTransId,
        C: custId,
        D: tripRefNo,
        E: 'Yes',
        F: '',
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISCOUNT
// ─────────────────────────────────────────────────────────────────────────────

/** Discount summary */
export async function getDiscountSummary(custId = DEMO_CUSTOMER_ID, custType = DEMO_CUST_TYPE): Promise<any> {
    return apiFetch(`${BASE_URL}/CUST_DISCOUNT_SUM`, {
        A: custId,
        B: custType,
        C: 'DISCOUNT_NAME',
        D: '',
    });
}

/** Discount detail by discount IDs */
export async function getDiscountDetail(discountIds: string, custId = DEMO_CUSTOMER_ID, custType = DEMO_CUST_TYPE): Promise<any> {
    return apiFetch(`${BASE_URL}/CUST_DISCOUNT`, {
        A: custId,
        B: custType,
        C: 'DISCOUNT_DETAIL',
        D: 'TD',
        E: discountIds,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  PRICE DETAILS
// ─────────────────────────────────────────────────────────────────────────────

/** Get price list for customer */
export async function getPriceList(custId = DEMO_CUSTOMER_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchOrderItems?Cust_Id=${custId}`, undefined, 'GET');
}

// ─────────────────────────────────────────────────────────────────────────────
//  ORDERS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch available items for an order */
export async function getOrderItems(custId = DEMO_CUSTOMER_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchOrderItems?Cust_Id=${custId}`, undefined, 'GET');
}

/** Submit a new order */
export async function submitOrder(custId: string, orderDetails: any[], branchId = DEMO_BRANCH_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/OrderCreation`, {
        A: custId,
        B: JSON.stringify(orderDetails),
        C: branchId,
        D: null,
        E: null,
        F: null,
        G: null,
        H: null,
        I: null,
        J: null,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  REPORTS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch order list (report) */
export async function getOrderList(fromDate: string, toDate: string, custId = DEMO_CUSTOMER_ID, branchId = DEMO_BRANCH_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchOrderList`, {
        A: fromDate,
        B: toDate,
        C: 'ORD',
        D: branchId,
        E: custId,
    });
}

/** Fetch invoice list */
export async function getInvoiceList(fromDate: string, toDate: string, type: 'SI' | 'CNDN' = 'SI', custId = DEMO_CUSTOMER_ID, branchId = DEMO_BRANCH_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchBills`, {
        A: fromDate,
        B: toDate,
        C: type,
        D: branchId,
        E: custId,
    });
}

/** Download invoice or CNDN PDF — returns PDF URL or base64 */
export async function downloadBillPdf(type: 'SI' | 'CNDN', billIds: string, branchId = DEMO_BRANCH_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchBillsPdf`, {
        A: type,
        B: billIds,
        C: branchId,
    });
}

/** Fetch transaction details (ledger) */
export async function getTransactionList(fromDate: string, toDate: string, custId = DEMO_CUSTOMER_ID): Promise<any> {
    return apiFetch(`${BASE_URL}/FetchTransDetails`, {
        A: fromDate,
        B: toDate,
        C: custId,
    });
}

/** Download transaction PDF */
export function getTransactionPdfUrl(custId = DEMO_CUSTOMER_ID): string {
    return `${BASE_URL}/FetchTransDetailsPdf?Cust_Id=${custId}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONTACT US
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch contact info */
export async function getContactInfo(branchId = DEMO_BRANCH_ID, custId = DEMO_CUSTOMER_ID, custType = DEMO_CUST_TYPE): Promise<any> {
    return apiFetch(`${BASE_URL}/APP_Contact`, {
        otp: branchId,
        mobilenumber: API_TOKEN.replace('Bearer ', ''),
        frm_dt: custId,
        to_dt: custType,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
//  BANK DETAILS
// ─────────────────────────────────────────────────────────────────────────────

/** Fetch virtual/bank account details */
export async function getBankDetails(custId = DEMO_CUSTOMER_ID, custType = DEMO_CUST_TYPE): Promise<any> {
    return apiFetch(`${BASE_URL}/CUST_VitruaAcc_CHK`, { A: custId, B: custType });
}
