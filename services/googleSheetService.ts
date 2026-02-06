import { RecordItem } from '../types';

/**
 * 將資料上傳至 Google Sheets
 * 
 * 使用方式：
 * 1. 建立一個 Google Sheet
 * 2. 擴充功能 -> Apps Script
 * 3. 貼上接收腳本 (詳見 GOOGLE_SHEETS_GUIDE.md)
 * 4. 部署為網頁應用程式 -> 取得 URL
 * 5. 將 URL 填入 .env 的 VITE_GOOGLE_SHEET_URL
 */
export const uploadToCloud = async (
    contact: { name: string; phone: string; address?: string; remark?: string },
    history: RecordItem[]
): Promise<boolean> => {
    // 優先使用環境變數，若無則使用寫死的 URL (針對本次部署)
    const sheetUrl = import.meta.env.VITE_GOOGLE_SHEET_URL || 'https://script.google.com/macros/s/AKfycbzYrpe-HCp4S-Keo4riJ2wTTAayfO4Vg5FEfvitCAuJeDsf2G7uFnuVdsz-1o5OQurU/exec';

    // 如果沒有設定 URL，回傳 false 代表未啟用雲端功能
    if (!sheetUrl || sheetUrl === 'YOUR_GOOGLE_SCRIPT_URL') {
        console.warn('Google Sheet URL尚未設定');
        return false;
    }

    // 整理最近一次的診斷紀錄 (取最新 3 筆)
    const recentRecords = history.slice(0, 3).map(item =>
        `【${item.type === 'diagnosis' ? '問卷' : 'AI'}】${item.description} -> ${item.result}`
    ).join('\n');

    const payload = {
        timestamp: new Date().toLocaleString(),
        name: contact.name,
        phone: contact.phone,
        address: contact.address || '',
        remark: contact.remark || '',
        records: recentRecords || '無近期紀錄',
        source: 'Smart Leak App'
    };

    try {
        // Google Apps Script 跨域傳輸通常使用 no-cors 模式，或是 text/plain
        // 因為 fetch cors 限制，通常用 form data 較穩
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            formData.append(key, (payload as any)[key]);
        });

        await fetch(sheetUrl, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // 重要：忽略 CORS 錯誤 (Google Script 特性)
        });

        return true;
    } catch (error) {
        console.error('上傳失敗:', error);
        return false;
    }
};
