import { useState, useEffect } from 'react';
import { QuotationPreset, QUOTATION_PRESETS as STATIC_PRESETS } from '../data/quotationPresets';

// Google Sheet ID
const SPREADSHEET_ID = '1P5J7_iqUXgdlxm_2raMJGMkxJ6G0KZ30x6oO_CC50WQ';
const BASE_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=`;

const SHEETS = [
    { name: '一般報價單', id: 'general_quote', description: '包含常用的防水工程、填縫、拆除清運及各式雜項工程。' },
    { name: '蜘蛛人報價單', id: 'spiderman', description: '高空繩索作業專用，包含外牆巡檢、防水及清潔。' },
    { name: '免打除廁所', id: 'no_destruct_toilet', description: '微創施工，適合居住中或不想大興土木的廁所翻修。' },
    { name: '打除廁所', id: 'destruct_toilet', description: '全面翻新，包含拆除、管線更新及防水施作。' },
    { name: 'SPC廁所', id: 'spc_toilet', description: '採用 SPC 石塑防水牆版，施工快速且質感優異。' },
    { name: '設計師項目', id: 'designer_items', description: '包含標準化浴室防水(不同保固年限)、負水壓及屋頂防水套裝。' },
    { name: '透氣工法', id: 'ventilation', description: '屋頂專用透氣防水工法，解決水氣鼓起問題。' },
    { name: '無機防水', id: 'inorganic', description: '利匯豐無機系統，環保無毒且長效。' },
    { name: '牆面壁癌', id: 'wall_cancer', description: '針對牆面起泡、粉化及壁癌問題的專業處置。' },
    { name: '地下室', id: 'basement', description: '高壓灌注與負水壓防水，適用於停車場及梯間。' }
];

export const useQuotationPresets = () => {
    const [presets, setPresets] = useState<QuotationPreset[]>(STATIC_PRESETS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const parseCSV = (csvText: string) => {
        const items: any[] = [];
        const rows: string[][] = [];
        let currentRow: string[] = [];
        let currentToken = '';
        let inQuote = false;

        // Iterate through the entire CSV text char by char to handle multiline quotes
        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
                if (inQuote && nextChar === '"') {
                    currentToken += '"';
                    i++; // Skip escape
                } else {
                    inQuote = !inQuote;
                }
            } else if (char === ',' && !inQuote) {
                currentRow.push(currentToken);
                currentToken = '';
            } else if ((char === '\n' || char === '\r') && !inQuote) {
                // Handle CRLF or LF (skip LF if prev was CR)
                if (char === '\r' && nextChar === '\n') {
                    i++;
                }

                currentRow.push(currentToken);
                rows.push(currentRow);
                currentRow = [];
                currentToken = '';
            } else {
                currentToken += char;
            }
        }
        // Push last token/row if exists
        if (currentToken || currentRow.length > 0) {
            currentRow.push(currentToken);
            rows.push(currentRow);
        }

        // Process parsed rows (skip header row which is usually index 0)
        // However, we need to be careful. The Google Viz output usually has a header.
        // Let's iterate all rows and use logic to skip header.
        for (let i = 0; i < rows.length; i++) {
            let row = rows[i];

            // Clean up: unescape quotes (remove surrounding quotes and replace "" with ")
            row = row.map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            // Filter empty rows or header
            // Header usually contains "項目名稱" or is empty
            if (!row[1] || row[1] === '備註' || row[1].includes('項目名稱')) continue;

            // Safe access
            const name = row[1];
            // const spec = row[2];
            const unit = row[3] || '式';
            const qtyStr = row[4] || '1';
            const priceStr = row[5] || '0';
            const note = row[7];

            const qty = parseFloat(qtyStr.replace(/,/g, '')) || 1;
            const price = parseFloat(priceStr.replace(/,/g, '')) || 0;

            items.push({
                name,
                unit,
                quantity: qty,
                unitPrice: price,
                notes: note
            });
        }
        return items;
    };

    const fetchPresets = async () => {
        setLoading(true);
        setError(null);
        try {
            const promises = SHEETS.map(async (sheet) => {
                const url = BASE_URL + encodeURIComponent(sheet.name);
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch ${sheet.name}`);
                const csvText = await response.text();
                const items = parseCSV(csvText);

                return {
                    id: sheet.id,
                    name: sheet.name,
                    description: sheet.description,
                    categories: [
                        {
                            code: '壹',
                            name: sheet.name.includes('廁所') ? '衛浴工程' : '工程項目',
                            items: items
                        }
                    ]
                } as QuotationPreset;
            });

            const results = await Promise.all(promises);
            setPresets(results);
            console.log('Updated presets from Google Sheets:', results.length);
        } catch (err: any) {
            console.error('Error fetching presets:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPresets();
    }, []);

    return { presets, loading, error, refresh: fetchPresets };
};
