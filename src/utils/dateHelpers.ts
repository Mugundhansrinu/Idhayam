/**
 * src/utils/dateHelpers.ts
 * Shared date validation and formatting utilities used across all report screens.
 */

/** Validates a DD-MM-YYYY string */
export const isValidDate = (dateStr: string): boolean => {
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) { return false; }
    const day   = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year  = parseInt(match[3], 10);
    if (month < 1 || month > 12) { return false; }
    if (day < 1 || day > 31) { return false; }
    if (year < 2000 || year > 2100) { return false; }
    const d = new Date(year, month - 1, day);
    return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
};

/** Parses a DD-MM-YYYY string into a Date object */
export const parseDDMMYYYY = (dateStr: string): Date | null => {
    const [d, m, y] = dateStr.split('-');
    if (!d || !m || !y) { return null; }
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
};

/**
 * Auto-formats numeric input into DD-MM-YYYY as the user types.
 * Handles backspace correctly.
 */
export const autoFormatDate = (text: string, prev: string): string => {
    if (text.length < prev.length) { return text; }
    const digits = text.replace(/\D/g, '');
    if (digits.length <= 2) { return digits; }
    if (digits.length <= 4) { return `${digits.slice(0, 2)}-${digits.slice(2)}`; }
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
};

/** Converts DD-MM-YYYY → MM/DD/YYYY for API payloads */
export const formatForApi = (dateStr: string): string => {
    const [d, m, y] = dateStr.split('-');
    if (d && m && y) { return `${m}/${d}/${y}`; }
    return dateStr;
};

/**
 * Validates a from/to date pair.
 * Returns { fromError, toError } — empty string means valid.
 */
export const validateDateRange = (
    fromDate: string,
    toDate: string,
): { fromError: string; toError: string } => {
    let fromError = '';
    let toError   = '';

    if (!fromDate || fromDate.length < 10 || !isValidDate(fromDate)) {
        fromError = 'Enter a valid date (DD-MM-YYYY)';
    }

    if (!toDate || toDate.length < 10 || !isValidDate(toDate)) {
        toError = 'Enter a valid date (DD-MM-YYYY)';
    }

    // Cross-field checks only when both dates are individually valid
    if (!fromError && !toError) {
        const from  = parseDDMMYYYY(fromDate);
        const to    = parseDDMMYYYY(toDate);
        const today = new Date(); today.setHours(23, 59, 59, 999);

        if (from && to) {
            if (from > to) {
                fromError = 'From date must be before To date';
            } else if (to > today) {
                toError = 'To date cannot be in the future';
            }
        }
    }

    return { fromError, toError };
};
