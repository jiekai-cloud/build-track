
import { Lead } from "../types";

// The Google Sheet CSV Export URL provided by the user
const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1Uehxvg8hbN7S63EIsXK9resSgNAwttYahxmQLHMwtsE/export?format=csv";

/**
 * 簡易 CSV 解析器，處理引號內的換行符與逗號
 * Correctly handles:
 * - quoted fields with commas and newlines: "Line 1, Line 2\nLine 3"
 * - escaped quotes: "They said ""Hello!"""
 */
function parseCSV(text: string): string[][] {
    const result: string[][] = [];
    let row: string[] = [];
    let currentVal = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"' && nextChar === '"') {
                currentVal += '"';
                i++; // Skip the escaped quote
            } else if (char === '"') {
                inQuotes = false;
            } else {
                currentVal += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                row.push(currentVal.trim());
                currentVal = "";
            } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
                row.push(currentVal.trim());
                result.push(row);
                row = [];
                currentVal = "";
                if (char === '\r') i++; // Skip \n after \r
            } else {
                currentVal += char;
            }
        }
    }

    // Handle last value/row if no newline at end
    if (currentVal || row.length > 0) {
        row.push(currentVal.trim());
        result.push(row);
    }

    return result;
}

// Generate deterministic ID
function generateHashId(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return `LEAD-${Math.abs(hash)}`;
}

export const fetchLeakDetectionLeads = async (): Promise<Lead[]> => {
    try {
        const response = await fetch(SHEET_CSV_URL);
        if (!response.ok) {
            console.warn(`[Sheet Sync] Failed: ${response.statusText}`);
            return [];
        }
        const csvText = await response.text();
        const rows = parseCSV(csvText);

        // Filter valid rows (must allow date parsing in first column)
        const validRows = rows.filter(row => row.length >= 2 && (row[0].includes('/') || row[0].includes('-')));

        return validRows.map(row => {
            const timestamp = row[0] || "";
            const name = row[1] || "未命名客戶";
            const phone = row[2] || "";
            // Assume column 3 is address based on context, or diagnosis if address missing
            // Based on provided sample: Col 0=Time, 1=Name, 2=Phone, 3=Empty, 4=Diagnosis
            const userAddress = row[3] || "";
            const diagnosis = row[4] || row[3] || "無詳細說明";

            // Using timestamp + phone/name as unique key
            const uniqueSource = `${timestamp}_${phone}_${name}`;

            return {
                id: generateHashId(uniqueSource),
                customerName: name,
                phone: phone,
                address: userAddress,
                diagnosis: diagnosis,
                photos: [],
                timestamp: timestamp,
                status: 'new' as const
            } as Lead;
        });

    } catch (error) {
        console.error("[Sheet Sync] Error fetching leads:", error);
        return [];
    }
};
