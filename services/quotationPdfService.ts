import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation, QuotationOption, ItemCategory } from '../types';

// 中文字型支援（使用內建字體的變通方案）
const setupChinese = (doc: jsPDF) => {
    // 使用 Arial Unicode MS 或回退到基本字體
    // 注意：jsPDF 預設不完全支援中文，這裡使用基本顯示
    doc.setFont('helvetica');
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

export const generateQuotationPDF = (quotation: Quotation): void => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    setupChinese(doc);

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 15;

    // 選擇的方案
    const selectedOption = quotation.options[quotation.selectedOptionIndex];

    // ===== 公司抬頭 =====
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Taiwan Life Quality Development Co., Ltd.', pageWidth / 2, currentY, { align: 'center' });

    currentY += 8;
    doc.setFontSize(18);
    doc.text('QUOTATION', pageWidth / 2, currentY, { align: 'center' });

    currentY += 10;

    // ===== 報價單資訊 =====
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // 左側：客戶資訊
    const leftX = 15;
    doc.setFont('helvetica', 'bold');
    doc.text('TO:', leftX, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.header.to || '', leftX + 15, currentY);

    currentY += 6;
    if (quotation.header.attn) {
        doc.setFont('helvetica', 'bold');
        doc.text('ATTN:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(quotation.header.attn, leftX + 15, currentY);
        currentY += 6;
    }

    if (quotation.header.tel) {
        doc.setFont('helvetica', 'bold');
        doc.text('TEL:', leftX, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(quotation.header.tel, leftX + 15, currentY);
        currentY += 6;
    }

    // 右側：報價單資訊
    const rightX = pageWidth - 15;
    let infoY = 33;

    doc.setFont('helvetica', 'bold');
    doc.text('Quote No.:', rightX - 60, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.quotationNumber, rightX - 30, infoY, { align: 'right' });

    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', rightX - 60, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(formatDate(quotation.header.quotationDate), rightX - 30, infoY, { align: 'right' });

    infoY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text('Version:', rightX - 60, infoY);
    doc.setFont('helvetica', 'normal');
    doc.text(`v${quotation.version}`, rightX - 30, infoY, { align: 'right' });

    currentY = Math.max(currentY, infoY + 10);

    // ===== 工程資訊 =====
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Project Information', leftX, currentY);
    currentY += 7;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
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
        doc.setFont('helvetica', 'bold');
        doc.text(`${selectedOption.name}: ${selectedOption.description}`, leftX, currentY);
        currentY += 8;
    }

    // ===== 項目明細表格 =====
    selectedOption.categories.forEach((category, catIndex) => {
        // 檢查是否需要新頁面
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 15;
        }

        // 分類標題
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
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
            headStyles: {
                fillColor: [100, 100, 100],
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold',
                halign: 'center'
            },
            bodyStyles: {
                fontSize: 9
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
        currentY = 15;
    }

    const summaryX = pageWidth - 80;
    const labelX = summaryX - 5;
    const valueX = pageWidth - 15;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // 項目小計
    doc.text('Subtotal:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.subtotal), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 工安管理費
    doc.text(`Management Fee (${selectedOption.summary.managementFeeRate}%):`, labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.managementFee), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 未稅金額
    doc.setFont('helvetica', 'bold');
    doc.text('Subtotal Before Tax:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.beforeTaxAmount), valueX, currentY, { align: 'right' });
    currentY += 6;

    // 營業稅
    doc.setFont('helvetica', 'normal');
    doc.text(`Tax (${selectedOption.summary.taxRate}%):`, labelX, currentY, { align: 'right' });
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
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL AMOUNT:', labelX, currentY, { align: 'right' });
    doc.text(formatCurrency(selectedOption.summary.totalAmount), valueX, currentY, { align: 'right' });

    currentY += 10;

    // ===== 條款與備註 =====
    if (quotation.terms) {
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 15;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Terms & Conditions', leftX, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

        if (quotation.terms.workSchedule) {
            doc.text(`- Work Schedule: ${quotation.terms.workSchedule}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.paymentTerms) {
            doc.text(`- Payment Terms: ${quotation.terms.paymentTerms}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.validityPeriod) {
            doc.text(`- Valid Until: ${quotation.terms.validityPeriod}`, leftX + 5, currentY);
            currentY += 5;
        }

        if (quotation.terms.warrantyYears) {
            doc.text(`- Warranty: ${quotation.terms.warrantyYears} years`, leftX + 5, currentY);
            currentY += 5;
        }

        // 銀行帳號
        if (quotation.terms.bankAccount) {
            currentY += 3;
            doc.setFont('helvetica', 'bold');
            doc.text('Bank Account Information:', leftX + 5, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(`Bank: ${quotation.terms.bankAccount.bankName}`, leftX + 10, currentY);
            currentY += 5;
            doc.text(`Account Name: ${quotation.terms.bankAccount.accountName}`, leftX + 10, currentY);
            currentY += 5;
            doc.text(`Account No.: ${quotation.terms.bankAccount.accountNumber}`, leftX + 10, currentY);
            currentY += 5;
        }
    }

    // ===== 負責人資訊 =====
    if (quotation.responsibles) {
        currentY += 8;

        if (currentY > pageHeight - 40) {
            doc.addPage();
            currentY = 15;
        }

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Project Contacts', leftX, currentY);
        currentY += 7;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');

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
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);

        // 頁碼
        doc.text(
            `Page ${i} of ${totalPages}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );

        // 公司資訊
        doc.text(
            'Taiwan Life Quality Development Co., Ltd.',
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
        );
    }

    // ===== 儲存PDF =====
    const filename = `Quote_${quotation.quotationNumber}_${selectedOption.name}.pdf`;
    doc.save(filename);
};
