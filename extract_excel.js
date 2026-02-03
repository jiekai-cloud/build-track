import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
const { readFile, utils } = XLSX;

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, '生活品質_報價單-案件名稱.xlsx');

try {
    const workbook = readFile(filePath);
    console.log('Sheet Names:', workbook.SheetNames);

    workbook.SheetNames.forEach(sheetName => {
        console.log(`\n--- Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        // Get JSON data (first 150 rows)
        const data = utils.sheet_to_json(sheet, { header: 1 });

        data.slice(0, 150).forEach((row, index) => {
            // Filter out empty rows for cleaner output
            if (row.length > 0 && row.some(cell => cell !== null && cell !== undefined && cell !== '')) {
                console.log(`Row ${index + 1}:`, JSON.stringify(row));
            }
        });
    });

} catch (error) {
    console.error('Error reading Excel file:', error);
}
