import React, { forwardRef } from 'react';
import { Quotation, QuotationItem, ItemCategory, QuotationOption, QuotationSummary } from '../types';

interface QuotationPrintTemplateProps {
    quotation: Quotation;
}

// 數字轉中文大寫金錢 (例如 1500 -> 壹仟伍佰元整)
// 這裡簡化處理，先用數字顯示，若有需要可擴充
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
        style: 'currency',
        currency: 'TWD',
        minimumFractionDigits: 0
    }).format(amount).replace('NT$', '$');
};

const formatDate = (dateString: string) => {
    return dateString.replace(/-/g, '/');
};

// 使用 forwardRef 讓我們可以從父組件取得這個 DOM 元素
const QuotationPrintTemplate = forwardRef<HTMLDivElement, QuotationPrintTemplateProps>(({ quotation }, ref) => {
    const selectedOption = quotation.options[quotation.selectedOptionIndex];

    return (
        // 外層容器：使用 flex column 佈局，確保頁尾在內容較少時也能置底
        <div ref={ref} className="bg-white text-black font-sans flex flex-col justify-between relative" style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '48px 48px 96px 48px', boxSizing: 'border-box' }}>

            {/* 主要內容區域 (會撐開高度) */}
            <div className="flex-grow">
                {/* 1. Header: 公司抬頭 */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-stone-900 mb-1">台灣生活品質發展股份有限公司</h1>
                    <h2 className="text-sm font-bold text-stone-500 tracking-[0.2em] mb-4">Taiwan Quality of Life Development Co., Ltd.</h2>
                    <h2 className="text-xl font-bold uppercase border-b-2 border-stone-800 inline-block pb-1">Quotation 報 價 單</h2>
                </div>

                {/* 2. Info Block: 客戶與報價資訊 */}
                <div className="flex justify-between mb-8 text-sm">
                    {/* 左側：客戶資訊 */}
                    <div className="w-[55%] space-y-1">
                        <div className="flex">
                            <span className="font-bold min-w-20 whitespace-nowrap">TO (客戶):</span>
                            <span className="font-medium">{quotation.header.to}</span>
                        </div>
                        {quotation.header.attn && (
                            <div className="flex">
                                <span className="font-bold min-w-20 whitespace-nowrap">ATTN (聯絡):</span>
                                <span>{quotation.header.attn}</span>
                            </div>
                        )}
                        {quotation.header.tel && (
                            <div className="flex">
                                <span className="font-bold min-w-20 whitespace-nowrap">TEL (電話):</span>
                                <span>{quotation.header.tel}</span>
                            </div>
                        )}
                        <div className="flex mt-2">
                            <span className="font-bold min-w-20 whitespace-nowrap">專案:</span>
                            <span className="font-medium">{quotation.header.projectName}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold min-w-20 whitespace-nowrap">地址:</span>
                            <span>{quotation.header.projectAddress}</span>
                        </div>
                    </div>

                    {/* 右側：單號資訊 */}
                    <div className="w-[40%] space-y-1 text-right">
                        <div className="flex justify-end gap-2">
                            <span className="font-bold">Quote No.:</span>
                            <span className="font-medium">{quotation.quotationNumber}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="font-bold">Date:</span>
                            <span>{formatDate(quotation.header.quotationDate)}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <span className="font-bold">Ver:</span>
                            <span>v{quotation.version}</span>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <span className="font-bold">負責人:</span>
                            <span>{quotation.createdByName}</span>
                        </div>
                    </div>
                </div>

                {/* 3. 方案名稱 */}
                <div className="mb-4">
                    <h3 className="font-bold text-lg border-l-4 border-orange-500 pl-3">
                        {selectedOption.name}
                        {selectedOption.description && <span className="text-base font-normal text-stone-600 ml-2">- {selectedOption.description}</span>}
                    </h3>
                </div>

                {/* 4. 報價明細表格 */}
                <div className="mb-8">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-stone-800 text-white text-sm">
                                <th className="py-2 px-3 border border-stone-800 w-12 text-center">No.</th>
                                <th className="py-2 px-3 border border-stone-800 text-left">Description 項目說明</th>
                                <th className="py-2 px-3 border border-stone-800 w-16 text-center">Unit</th>
                                <th className="py-2 px-3 border border-stone-800 w-16 text-right">Qty</th>
                                <th className="py-2 px-3 border border-stone-800 w-28 text-right">Unit Price</th>
                                <th className="py-2 px-3 border border-stone-800 w-28 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {selectedOption.categories.map((category) => (
                                <React.Fragment key={category.id}>
                                    {/* 分類標題行 */}
                                    <tr className="bg-stone-100 font-bold">
                                        <td colSpan={6} className="py-2 px-3 border border-stone-300 text-stone-800">
                                            {category.code}、{category.name}
                                        </td>
                                    </tr>
                                    {/* 項目行 */}
                                    {category.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="py-2 px-3 border border-stone-300 text-center text-stone-500">{item.itemNumber}</td>
                                            <td className="py-2 px-3 border border-stone-300">
                                                <div className="font-medium text-stone-800">{item.name}</div>
                                                {item.notes && <div className="text-xs text-stone-500 mt-0.5">{item.notes}</div>}
                                            </td>
                                            <td className="py-2 px-3 border border-stone-300 text-center">{item.unit}</td>
                                            <td className="py-2 px-3 border border-stone-300 text-right">{item.quantity.toLocaleString()}</td>
                                            <td className="py-2 px-3 border border-stone-300 text-right">{formatCurrency(item.unitPrice).replace('$', '')}</td>
                                            <td className="py-2 px-3 border border-stone-300 text-right font-medium">{formatCurrency(item.amount).replace('$', '')}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. 金額總計區 (靠右) */}
                <div className="flex justify-end mb-10">
                    <div className="w-1/2 space-y-2 text-sm">
                        <div className="flex justify-between border-b border-stone-200 pb-1">
                            <span className="text-stone-600">Subtotal 項目小計</span>
                            <span className="font-medium">{formatCurrency(selectedOption.summary.subtotal)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 pb-1">
                            <span className="text-stone-600">Management Fee 工安管理費 ({selectedOption.summary.managementFeeRate}%)</span>
                            <span className="font-medium">{formatCurrency(selectedOption.summary.managementFee)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1">
                            <span>Subtotal Before Tax 未稅金額</span>
                            <span>{formatCurrency(selectedOption.summary.beforeTaxAmount)}</span>
                        </div>
                        <div className="flex justify-between border-b border-stone-200 pb-1">
                            <span className="text-stone-600">Tax 營業稅 ({selectedOption.summary.taxRate}%)</span>
                            <span className="font-medium">{formatCurrency(selectedOption.summary.tax)}</span>
                        </div>
                        {/* 總計醒目顯示 */}
                        <div className="flex justify-between border-t-2 border-stone-800 pt-2 mt-2 text-lg">
                            <span className="font-bold">TOTAL AMOUNT 總計金額</span>
                            <span className="font-black text-orange-600">{formatCurrency(selectedOption.summary.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* 6. 條款與備註 */}
                <div className="border-t-2 border-stone-200 pt-6 mt-8">
                    <h4 className="font-bold mb-3 text-sm uppercase tracking-wide text-stone-500">Terms & Conditions 條款與備註</h4>
                    <div className="text-xs space-y-2 text-stone-700">
                        {quotation.terms?.workSchedule && (
                            <div className="flex gap-2"><span className="font-bold min-w-20">工期說明:</span><span>{quotation.terms.workSchedule}</span></div>
                        )}
                        {quotation.terms?.paymentTerms && (
                            <div className="flex gap-2"><span className="font-bold min-w-20">付款方式:</span><span>{quotation.terms.paymentTerms}</span></div>
                        )}
                        {quotation.terms?.validityPeriod && (
                            <div className="flex gap-2"><span className="font-bold min-w-20">有效期限:</span><span>{quotation.terms.validityPeriod}</span></div>
                        )}
                        {quotation.terms?.warrantyYears && (
                            <div className="flex gap-2"><span className="font-bold min-w-20">保固年限:</span><span>{quotation.terms.warrantyYears} 年</span></div>
                        )}

                        {/* 其他備註 */}
                        {quotation.terms?.otherNotes && quotation.terms.otherNotes.length > 0 && (
                            <div className="mt-4 space-y-2">
                                <div className="font-bold">備註</div>
                                <div className="pl-4 space-y-1.5">
                                    {quotation.terms.otherNotes.map((note, index) => (
                                        <div key={index} className="flex gap-2">
                                            <span className="font-bold min-w-6">{index + 1}</span>
                                            <span>{note}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 銀行帳號 */}
                        <div className="mt-4 p-3 bg-stone-50 rounded border border-stone-200 inline-block w-full">
                            <div className="font-bold mb-1">匯款帳號資料 Bank Account Info:</div>
                            <div className="flex flex-wrap gap-x-8 gap-y-1">
                                <div>銀行: <span className="font-medium">{quotation.terms?.bankAccount?.bankName || '玉山銀行(808) 士林分行'}</span></div>
                                <div>戶名: <span className="font-medium">{quotation.terms?.bankAccount?.accountName || '台灣生活品質發展股份有限公司'}</span></div>
                                <div className="font-mono text-sm">帳號: {quotation.terms?.bankAccount?.accountNumber || '0657-940-151307'}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 客戶簽名區 (只有已簽署時顯示) */}
                {(quotation as any).signature && (
                    <div className="mt-8 flex justify-end">
                        <div className="w-64 border-b-2 border-stone-800 pb-2">
                            <div className="text-sm font-bold mb-2">客戶簽名 Customer Signature:</div>
                            <img src={(quotation as any).signature} alt="Client Signature" className="max-h-24 object-contain" />
                            <div className="text-xs text-stone-500 mt-1 text-right">
                                Signed on: {(quotation as any).signedAt ? new Date((quotation as any).signedAt).toLocaleString() : ''}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 頁尾 - 使用 mt-12 增加間距，並確保在最底部 */}
            <div className="mt-12 pt-6 border-t border-stone-100 text-center text-[10px] text-stone-400 space-y-1">
                <p className="font-bold text-stone-500 mb-2 text-xs">感謝您選擇台灣生活品質發展股份有限公司，期待為您服務。</p>
                <div className="flex flex-col gap-0.5">
                    <p>台北: 111 台北市士林區中山北路五段500號7樓</p>
                    <p>新北: 235 新北市中和區景平路71號之7號2樓本號</p>
                    <p>統編: 60618756 | Tel: 02-2242-1955 | Fax: 02-2242-1905 | Email: service@tqldc.com.tw</p>
                </div>
            </div>

        </div>
    );
});

export default QuotationPrintTemplate;
