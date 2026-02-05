import fs from 'fs';
import https from 'https';

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

const fetchCSV = (sheetName) => {
    return new Promise((resolve, reject) => {
        const url = BASE_URL + encodeURIComponent(sheetName);
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
};

const parseCSV = (csvText) => {
    const lines = csvText.trim().split('\n');
    const items = [];

    // Skip header row if exists (usually row 1)
    // We assume columns: ID(0), Name(1), Spec(2), Unit(3), Qty(4), Price(5), Total(6), Note(7)
    // But CSV from Google Viz might be quoted. Simple regex parser needed.

    for (let i = 1; i < lines.length; i++) {
        // Simple CSV split handling quotes
        const row = [];
        let inQuote = false;
        let currentToken = '';
        for (let char of lines[i]) {
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(currentToken.trim());
                currentToken = '';
            } else {
                currentToken += char;
            }
        }
        row.push(currentToken.trim());

        // Map columns (Adjust index based on actual data observation)
        // Usually: [0]ID, [1]Name, [2]Spec?, [3]Unit, [4]Qty, [5]Price...
        // Let's clean quotes
        const clean = (val) => val ? val.replace(/^"|"$/g, '').replace(/""/g, '"') : '';

        const name = clean(row[1]);
        if (!name) continue; // Skip empty rows

        const unit = clean(row[3]) || '式';
        const qty = parseFloat(clean(row[4])) || 1;
        const price = parseFloat(clean(row[5]).replace(/,/g, '')) || 0;
        const note = clean(row[7]);

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

const generateFile = async () => {
    let output = `import { QuotationOption, ItemCategory, QuotationItem, QuotationSummary } from '../types';

export interface QuotationPreset {
    id: string;
    name: string;
    description: string;
    categories: {
        name: string;
        code: string;
        items: {
            name: string;
            unit: string;
            quantity: number;
            unitPrice: number;
            notes?: string;
        }[];
    }[];
}

export const QUOTATION_PRESETS: QuotationPreset[] = [\n`;

    for (const sheet of SHEETS) {
        console.log(`Fetching ${sheet.name}...`);
        try {
            const csv = await fetchCSV(sheet.name);
            const items = parseCSV(csv);

            output += `    {
        id: '${sheet.id}',
        name: '${sheet.name}',
        description: '${sheet.description}',
        categories: [
            {
                code: '壹',
                name: '工程項目',
                items: [\n`;

            items.forEach(item => {
                const noteStr = item.notes ? `, notes: '${item.notes.replace(/'/g, "\\'")}'` : '';
                output += `                    { name: '${item.name.replace(/'/g, "\\'")}', unit: '${item.unit}', quantity: ${item.quantity}, unitPrice: ${item.unitPrice}${noteStr} },\n`;
            });

            output += `                ]
            }
        ]
    },\n`;
        } catch (e) {
            console.error(`Error fetching ${sheet.name}:`, e);
        }
    }

    output += `];

export const createQuotationFromPreset = (preset: QuotationPreset): QuotationOption => {
    const categories: ItemCategory[] = preset.categories.map(cat => ({
        id: crypto.randomUUID(),
        code: cat.code,
        name: cat.name,
        items: cat.items.map((item, idx) => ({
            id: crypto.randomUUID(),
            itemNumber: idx + 1,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            notes: item.notes
        }))
    }));

    // Calculate initial summary
    let subtotal = 0;
    categories.forEach(cat => {
        cat.items.forEach(item => {
            subtotal += item.amount;
        });
    });

    const mgmtFeeRate = 10;
    const taxRate = 5;
    const managementFee = Math.round(subtotal * (mgmtFeeRate / 100));
    const beforeTax = subtotal + managementFee;
    const tax = Math.round(beforeTax * (taxRate / 100));
    const total = beforeTax + tax;

    return {
        id: crypto.randomUUID(),
        name: preset.name,
        description: preset.description || '',
        categories: categories,
        summary: {
            subtotal,
            managementFee,
            managementFeeRate: mgmtFeeRate,
            beforeTaxAmount: beforeTax,
            tax,
            taxRate: taxRate,
            totalAmount: total
        }
    };
};

export const GENERAL_TERMS = \`
1. 合約審閱權：本報價單經雙方簽名用印後即視同正式合約，業主已充分行使合約審閱權。
2. 付款方式：簽約時支付總工程款 30% 為訂金；材料進場/開工支付 40%；完工驗收後 3 日內支付尾款 30%。
3. 有效期限：本報價單有效期限為 15 天，逾期需重新報價。
4. 變更設計：若需追加減工程，雙方應另行協議並簽署追加減帳單，費用另計。
5. 施工界界面：本工程僅包含報價單所列項目，未列及之周邊修復或遷移工程不在本合約範圍內。
6. 保固條款：依合約約定年限提供保固 (天災人禍、結構變位等不可抗力因素除外)。
\`;
`;

    fs.writeFileSync('data/quotationPresets.ts', output);
    console.log('Done! Generated data/quotationPresets.ts');
};

generateFile();
