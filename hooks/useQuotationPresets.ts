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
        const lines = csvText.trim().split('\n');
        const items: any[] = [];

        for (let i = 1; i < lines.length; i++) {
            // Simple robust CSV parser for this specific sheet format
            let row: string[] = [];
            let inQuote = false;
            let currentToken = '';
            const line = lines[i];

            for (let j = 0; j < line.length; j++) {
                const char = line[j];
                if (char === '"') {
                    inQuote = !inQuote;
                } else if (char === ',' && !inQuote) {
                    row.push(currentToken.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                    currentToken = '';
                } else {
                    currentToken += char;
                }
            }
            row.push(currentToken.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

            // Filter empty rows by Name
            if (!row[1]) continue;

            const name = row[1];
            // const spec = row[2]; // unused
            const unit = row[3] || '式';
            const qty = parseFloat(row[4]?.replace(/,/g, '')) || 1;
            const price = parseFloat(row[5]?.replace(/,/g, '')) || 0;
            const note = row[7];

            items.push({
                name,
                unit,
                quantity: qty,
                unitPrice: price,
                notes: note // Store note too if needed
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
            // Cache locally for this session if needed, or just state
            console.log('Updated presets from Google Sheets:', results.length);
        } catch (err: any) {
            console.error('Error fetching presets:', err);
            setError(err.message);
            // Fallback is keeping static presets
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch on mount? User requested "any time", so maybe we fetch on load.
    // Or we provide a button. Let's fetch on mount to be "fresh".
    useEffect(() => {
        fetchPresets();
    }, []);

    return { presets, loading, error, refresh: fetchPresets };
};
