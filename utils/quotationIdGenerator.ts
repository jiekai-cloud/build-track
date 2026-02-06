import { Quotation } from '../types';

/**
 * Generates a new quotation number based on the project ID.
 * Format: {ProjectId}-{Serial} (e.g., BNI2026001-01)
 * If no ProjectId is provided, falls back to randomized Q{Year}-{Random} format.
 */
export const generateQuotationNumber = (projectId: string | undefined, allQuotations: Quotation[]): string => {
    if (!projectId) {
        // Fallback for independent quotations: Q{Year}-{Random}
        const year = new Date().getFullYear();
        const randomId = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `Q${year}-${randomId}`;
    }

    // Find all quotations for this project to determine the next serial number
    const projectQuotations = allQuotations.filter(q => q.projectId === projectId);

    if (projectQuotations.length === 0) {
        return `${projectId}-01`;
    }

    let maxSerial = 0;

    projectQuotations.forEach(q => {
        // Check if the quotation number starts with the project ID followed by a hyphen
        // This ensures we are looking at the correct serial pattern
        const prefix = `${projectId}-`;
        if (q.quotationNumber && q.quotationNumber.startsWith(prefix)) {
            const suffix = q.quotationNumber.slice(prefix.length);
            // Ensure the suffix is numeric (handle potential manual edits or malformed IDs)
            if (/^\d+$/.test(suffix)) {
                const serial = parseInt(suffix, 10);
                if (!isNaN(serial) && serial > maxSerial) {
                    maxSerial = serial;
                }
            }
        }
    });

    // Calculate next serial
    const nextSerial = maxSerial + 1;
    return `${projectId}-${nextSerial.toString().padStart(2, '0')}`;
};
