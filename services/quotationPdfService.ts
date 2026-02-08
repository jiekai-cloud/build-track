import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, QuotationOption, ItemCategory } from '../types';

// Load font helper
const loadFont = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch font: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data:application/octet-stream;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// 中文字型支援
const setupChinese = async (doc: jsPDF) => {
    try {
        console.log('[PDF] Loading Chinese font from /fonts/NotoSansTC-Regular.ttf...');

        const fontBase64 = await loadFont('/fonts/NotoSansTC-Regular.ttf');

        if (!fontBase64) {
            console.error('[PDF] Font base64 is empty');
            return false;
        }

        console.log(`[PDF] Font loaded successfully, base64 length: ${fontBase64.length}`);

        // Add font to VFS
        doc.addFileToVFS('NotoSansTC-Regular.ttf', fontBase64);

        // Add font (mapping both normal and bold to the same font file for now)
        doc.addFont('NotoSansTC-Regular.ttf', 'NotoSansTC', 'normal');
        doc.addFont('NotoSansTC-Regular.ttf', 'NotoSansTC', 'bold');

        // Set as default font
        doc.setFont('NotoSansTC');

        // Verify font is set correctly
        const currentFont = doc.getFont();
        console.log('[PDF] Current font after setup:', currentFont);

        if (currentFont.fontName !== 'NotoSansTC') {
            console.error('[PDF] Font not set correctly. Current font:', currentFont.fontName);
            return false;
        }

        console.log('[PDF] Font setup completed successfully');
        return true;
    } catch (error) {
        console.error('[PDF] Failed to load Chinese font:', error);
        console.error('[PDF] Error details:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined
        });
        return false;
    }
};

// 數字轉中文（壹、貳、參...）
const numberToChinese = (num: number): string => {
    const chinese = ['', '壹', '貳', '參', '肆', '伍', '陸', '柒', '捌', '玖', '拾'];
    return chinese[num] || num.toString();
};

// 格式化金額
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0
    }).format(amount).replace('NT$', '$');
};

// 格式化日期
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '/');
};

// 載入圖片 helper
const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                reject(new Error('Canvas context not available'));
            }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
    });
};

export const generateQuotationPDF = async (quotation: Quotation): Promise<void> => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // Setup Chinese font - MUST succeed or throw error
    const fontLoaded = await setupChinese(doc);
    if (!fontLoaded) {
        throw new Error(
            '無法載入中文字體，PDF 生成失敗。\n\n' +
            '可能原因：\n' +
            '1. 字體檔案不存在或損壞\n' +
            '2. 網路連線問題\n' +
            '3. 瀏覽器快取問題\n\n' +
            '建議：\n' +
            '- 重新整理頁面 (Ctrl/Cmd + Shift + R)\n' +
            '- 清除瀏覽器快取\n' +
            '- 檢查網路連線'
        );
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const topMargin = 15;  // Top margin for all pages
    const headerHeight = 42; // Height reserved for header on continuation pages
    let currentY = topMargin;

    // 選擇的方案
    const selectedOption = quotation.options?.[quotation.selectedOptionIndex];

    // 驗證必要資料
    if (!selectedOption) {
        throw new Error(
            `無法生成 PDF：找不到報價方案。\n` +
            `請確保報價單包含至少一個方案且已選擇方案。\n` +
            `目前方案數量: ${quotation.options?.length || 0}\n` +
            `選擇的方案索引: ${quotation.selectedOptionIndex}`
        );
    }

    // 1. 載入 Logo
    try {
        const logoData = await loadImage('/pwa-icon.png').catch(() => null);
        if (logoData) {
            // Logo 放在左上角，垂直置中於標題區域
            doc.addImage(logoData, 'PNG', 15, 10, 20, 20);
        }
    } catch (e) {
        console.warn('Logo loading failed', e);
    }

    // 2. 公司標題 area: Y=10 to Y=30
    const companyNameCN = '台灣生活品質發展股份有限公司';
    const companyNameEN = 'Taiwan Quality of Life Development Co., Ltd.';
    const centerX = pageWidth / 2;

    // 步驟1: 先設定中文字體並測量寬度
    doc.setFontSize(16);
    doc.setFont('NotoSansTC', 'bold');
    const cnTextWidth = doc.getTextWidth(companyNameCN);

    // 步驟2: 繪製中文標題（在上方，置中）
    doc.text(companyNameCN, centerX, 18, { align: 'center' });

    // 步驟3: 設定英文字體（較小）並測量原始寬度
    doc.setFontSize(8.5);
    doc.setFont('NotoSansTC', 'bold');
    const enTextWidth = doc.getTextWidth(companyNameEN);

    // 步驟4: 計算字距讓英文跟中文一樣寬
    // charSpace 是每個字元之間額外增加的間距
    let charSpace = 0;
    if (enTextWidth < cnTextWidth) {
        // 需要增加的總寬度 / 間隔數（字元數-1）
        charSpace = (cnTextWidth - enTextWidth) / (companyNameEN.length - 1);
    }

    // 步驟5: 計算起始 X 位置（讓文字從左邊開始，寬度等於中文）
    const startX = centerX - (cnTextWidth / 2);

    // 步驟6: 繪製英文標題（在中文下方）
    doc.text(companyNameEN, startX, 25, { charSpace: charSpace });

    currentY = 32;
    doc.setFontSize(18);
    // 報價單標題
    doc.text('QUOTATION 報 價 單', pageWidth / 2, currentY, { align: 'center' });

    // 畫一條分隔線
    doc.setLineWidth(0.5);
    doc.line(15, currentY + 3, pageWidth - 15, currentY + 3);

    currentY += 10;

    // ===== 報價單資訊 =====
    doc.setFontSize(10);
    doc.setFont('NotoSansTC', 'normal');

    // 左側：客戶資訊
    const leftX = 15;
    doc.setFont('NotoSansTC', 'bold');
    doc.text('TO:', leftX, currentY);
    doc.setFont('NotoSansTC', 'normal');
    doc.text(quotation.header.to || '', leftX + 15, currentY);

    currentY += 6;
    if (quotation.header.attn) {
        doc.setFont('NotoSansTC', 'bold');
        doc.text('ATTN:', leftX, currentY);
        doc.setFont('NotoSansTC', 'normal');
        doc.text(quotation.header.attn, leftX + 15, currentY);
        currentY += 6;
    }

    if (quotation.header.tel) {
        doc.setFont('NotoSansTC', 'bold');
        doc.text('TEL:', leftX, currentY);
        doc.setFont('NotoSansTC', 'normal');
        doc.text(quotation.header.tel, leftX + 15, currentY);
        currentY += 6;
    }

    // 右側：報價單資訊
    const rightX = pageWidth - 15;
    let infoY = 33;

    // 計算顯示用的報價單編號 (案件編號-版本)
    const displayQuoteNo = quotation.projectId
        ? `${quotation.projectId}-${quotation.version || 1}`
        : quotation.quotationNumber;

    doc.setFont('NotoSansTC', 'bold');
    doc.text('Quote No.:', rightX - 60, infoY);
    doc.setFont('NotoSansTC', 'normal');
    doc.text(displayQuoteNo, rightX - 30, infoY, { align: 'right' });

    infoY += 6;
    doc.setFont('NotoSansTC', 'bold');
    doc.text('Date:', rightX - 60, infoY);
    doc.setFont('NotoSansTC', 'normal');
    // 使用 header 中的日期
    doc.text(formatDate(quotation.header.quotationDate), rightX - 30, infoY, { align: 'right' });

    infoY += 6;
    doc.setFont('NotoSansTC', 'bold');
    doc.text('Version:', rightX - 60, infoY);
    doc.setFont('NotoSansTC', 'normal');
    doc.text(`v${quotation.version}`, rightX - 30, infoY, { align: 'right' });

    currentY = Math.max(currentY, infoY + 10);

    // ===== 工程資訊 =====
    doc.setFontSize(12);
    doc.setFont('NotoSansTC', 'bold');
    doc.text('Project Information', leftX, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont('NotoSansTC', 'normal');

    // 顯示案件編號 (如果有)
    if (quotation.projectId) {
        doc.text(`Project ID: ${quotation.projectId}`, leftX, currentY);
        currentY += 6;
    }

    doc.text(`Project: ${quotation.header.projectName}`, leftX, currentY);
    currentY += 6;

    if (quotation.header.projectAddress) {
        doc.text(`Address: ${quotation.header.projectAddress}`, leftX, currentY);
        currentY += 6;
    }

    currentY += 5;

    // ===== 方案標題 =====
    if (selectedOption.description) {
        doc.setFontSize(11);
        doc.setFont('NotoSansTC', 'bold');
        doc.text(`${selectedOption.name}: ${selectedOption.description}`, leftX, currentY);
        currentY += 8;
    }

    // ===== 項目明細表格 =====
    selectedOption.categories.forEach((category, catIndex) => {
        // 檢查是否需要新頁面
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = headerHeight;  // Leave space for header
        }

        // 分類標題
        doc.setFontSize(10);
        doc.setFont('NotoSansTC', 'bold');
        doc.text(`${category.code}. ${category.name}`, leftX, currentY);
        currentY += 5;

        // 項目表格
        const tableData = category.items.map(item => [
            item.itemNumber.toString(),
            item.name + (item.notes ? ` (${item.notes})` : ''),
            item.unit,
            item.quantity.toLocaleString(),
            formatCurrency(item.unitPrice),
            formatCurrency(item.amount)
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['No.', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount']],
            body: tableData,
            theme: 'grid',
            styles: {
                font: 'NotoSansTC',
                fontStyle: 'normal'
            },
            headStyles: {
                fillColor: [100, 100, 100],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center',
                font: 'NotoSansTC'
            },
            bodyStyles: {
                fontSize: 9,
                font: 'NotoSansTC'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 15 },
                1: { halign: 'left', cellWidth: 70 },
                2: { halign: 'center', cellWidth: 20 },
                3: { halign: 'right', cellWidth: 20 },
                4: { halign: 'right', cellWidth: 30 },
                5: { halign: 'right', cellWidth: 30 }
            },
            margin: { left: leftX, right: 15 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
    });

    // ===== 金額總計 =====
    if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = headerHeight;  // Leave space for header
    }

    const summaryX = pageWidth - 80;
    const labelX = summaryX - 5;
    const valueX = pageWidth - 15;

    doc.setFontSize(10);
    doc.setFont('NotoSansTC', 'normal');

    // 項目小計
    doc.text('Subtotal 項 目 小 計:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.subtotal), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 工安管理費
    doc.text(`Management Fee 工安管理費 (${selectedOption.summary.managementFeeRate}%):`, labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.managementFee), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 未稅金額
    doc.setFont('NotoSansTC', 'bold');
    doc.text('Subtotal Before Tax 未 稅 金 額:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.beforeTaxAmount), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 營業稅
    doc.setFont('NotoSansTC', 'normal');
    doc.text(`Tax 營業稅 (${selectedOption.summary.taxRate}%):`, labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.tax), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 折扣
    if (selectedOption.summary.discounts && selectedOption.summary.discounts.length > 0) {
        selectedOption.summary.discounts.forEach(discount => {
            doc.text(`${discount.name}:`, labelX, currentY, { align: 'right' });
            doc.text(formatCurrency(discount.amount), valueX, currentY, { align: 'right' });
            currentY += 6;
        });
    }

    // 總計
    currentY += 2;
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(summaryX - 10, currentY - 3, valueX, currentY - 3);

    doc.setFontSize(12);
    doc.setFont('NotoSansTC', 'bold');
    doc.text('TOTAL AMOUNT 總 計 金 額:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.totalAmount), valueX, currentY, { align: 'right' });

    currentY += 10;

    // ===== 條款與備註 =====
    if (quotation.terms) {
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = headerHeight;  // Leave space for header
        }

        doc.setFontSize(11);
        doc.setFont('NotoSansTC', 'bold');
        doc.text('Terms & Conditions 條款與備註', leftX, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('NotoSansTC', 'normal');

        if (quotation.terms.workSchedule) {
            doc.text(`- Work Schedule 工期說明: ${quotation.terms.workSchedule}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.paymentTerms) {
            doc.text(`- Payment Terms 付款方式: ${quotation.terms.paymentTerms}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.validityPeriod) {
            doc.text(`- Valid Until 有效期限: ${quotation.terms.validityPeriod}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.warrantyYears) {
            doc.text(`- Warranty 保固年限: ${quotation.terms.warrantyYears} years`, leftX + 5, currentY);
            currentY += 5;
        }

        // 銀行帳號
        if (quotation.terms.bankAccount) {
            currentY += 3;
            doc.setFont('NotoSansTC', 'bold');
            doc.text('Bank Account Information 匯款帳號資料:', leftX + 5, currentY);
            currentY += 5;
            doc.setFont('NotoSansTC', 'normal');
            doc.text(`Bank 銀行: ${quotation.terms.bankAccount.bankName}`, leftX + 10, currentY);
            currentY += 5;
            doc.text(`Account Name 戶名: ${quotation.terms.bankAccount.accountName}`, leftX + 10, currentY);
            currentY += 5;
            doc.text(`Account No. 帳號: ${quotation.terms.bankAccount.accountNumber}`, leftX + 10, currentY);
            currentY += 5;
        }
    }

    // ===== 負責人資訊 =====
    if (quotation.responsibles) {
        currentY += 8;

        if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = headerHeight;  // Leave space for header
        }

        doc.setFontSize(11);
        doc.setFont('NotoSansTC', 'bold');
        doc.text('Project Contacts 專案聯繫', leftX, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('NotoSansTC', 'normal');

        const contacts = [
            { label: 'Site Manager', data: quotation.responsibles.siteManager },
            { label: 'Project Manager', data: quotation.responsibles.projectManager },
            { label: 'Field Manager', data: quotation.responsibles.fieldManager }
        ];

        contacts.forEach(contact => {
            if (contact.data) {
                doc.text(`${contact.label}: ${contact.data.name} (${contact.data.mobile})`, leftX + 5, currentY);
                currentY += 5;
            }
        });
    }

    // ===== 頁尾 =====
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('NotoSansTC', 'normal');
        doc.setTextColor(128, 128, 128);

        // 頁尾分隔線
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.1);
        doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

        // 公司聯絡資訊
        const address1 = '台北: 111 台北市士林區中山北路五段500號7樓';
        const address2 = '新北: 235 新北市中和區景平路71號之7號2樓本號';
        const contactInfo = '統編: 60618756  |  Tel: 02-2242-1955  |  Fax: 02-2242-1905  |  Email: service@tqldc.com.tw';

        doc.text(address1, pageWidth / 2, pageHeight - 13, { align: 'center' });
        doc.text(address2, pageWidth / 2, pageHeight - 10, { align: 'center' });
        doc.text(contactInfo, pageWidth / 2, pageHeight - 7, { align: 'center' });

        // 頁碼
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 3,
            { align: 'center' }
        );
    }

    // ===== 儲存PDF =====
    const filename = `Quote_${quotation.quotationNumber}_${selectedOption.name}.pdf`;
    doc.save(filename);
};
