import React, { forwardRef } from 'react';
import { Quotation, QuotationItem, ItemCategory, QuotationOption, QuotationSummary } from '../types';
import { STAMP_BASE64 } from '../services/stampImage';

interface QuotationPrintTemplateProps {
    quotation: Quotation;
    showOptionName?: boolean;
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
const QuotationPrintTemplate = forwardRef<HTMLDivElement, QuotationPrintTemplateProps>(({ quotation, showOptionName }, ref) => {
    const selectedOption = quotation.options[quotation.selectedOptionIndex];
    // 優先使用 prop，若無則使用 quotation 內的設定，預設為 true
    const shouldShowOptionName = showOptionName !== undefined ? showOptionName : (quotation.showOptionName ?? true);

    return (
        // 外層容器：A4 尺寸 (210mm x 297mm)
        // 改用 Block Layout 以支援更好的原生分頁
        // padding 設定為標準文件邊界 (約 20mm) - 根據用戶反饋調整
        <div
            ref={ref}
            className="bg-white text-stone-900 font-sans relative"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                padding: '0mm 15mm', // 上下交由 @page margin 控制 (各 15mm)，左右保持內縮
                boxSizing: 'border-box'
            }}
        >

            {/* 主要內容區域 */}
            <div className="w-full">
                {/* 1. Header: 公司抬頭 (Left Aligned) */}
                <div className="flex justify-between items-end mb-6 break-inside-avoid border-b-2 border-stone-100 pb-4">
                    <div className="flex items-center gap-3">
                        <img
                            src={`${import.meta.env.BASE_URL}pwa-icon.png`}
                            alt="Company Logo"
                            className="h-12 w-auto object-contain"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                        />
                        <div>
                            <h1 className="text-xl font-black text-stone-900 tracking-wide">台灣生活品質發展股份有限公司</h1>
                            <h2 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                                Taiwan Quality of Life Development Co., Ltd.
                            </h2>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black uppercase text-stone-800 tracking-widest text-right">
                        QUOTATION <span className="block text-xl text-stone-400 font-bold tracking-[0.3em] mt-1">報 價 單</span>
                    </h2>
                </div>

                {/* 2. Info Block: 客戶與報價資訊 */}
                <div className="flex justify-between mb-8 text-sm leading-relaxed text-stone-700 break-inside-avoid">
                    {/* 左側：客戶資訊 */}
                    <div className="w-[58%] bg-stone-50 p-4 rounded-lg border border-stone-100">
                        <div className="flex mb-1">
                            <span className="font-bold min-w-20 text-stone-500">TO 客戶</span>
                            <span className="font-bold text-lg text-stone-900 -mt-1">{quotation.header.to}</span>
                        </div>
                        {quotation.header.attn && (
                            <div className="flex mb-1">
                                <span className="font-bold min-w-20 text-stone-500">ATTN 聯絡</span>
                                <span className="font-medium">{quotation.header.attn}</span>
                            </div>
                        )}
                        {quotation.header.tel && (
                            <div className="flex mb-1">
                                <span className="font-bold min-w-20 text-stone-500">TEL 電話</span>
                                <span>{quotation.header.tel}</span>
                            </div>
                        )}
                        <hr className="my-2 border-stone-200" />
                        <div className="flex mb-1">
                            <span className="font-bold min-w-20 text-stone-500">PROJECT</span>
                            <span className="font-bold text-stone-800">{quotation.header.projectName}</span>
                        </div>
                        <div className="flex">
                            <span className="font-bold min-w-20 text-stone-500">ADDR.</span>
                            <span className="text-stone-600">{quotation.header.projectAddress}</span>
                        </div>
                    </div>

                    {/* 右側：單號資訊 */}
                    <div className="w-[38%] flex flex-col justify-center space-y-2">
                        <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                            <span className="font-bold text-stone-500 text-xs uppercase">Quote No.</span>
                            <span className="font-black text-lg text-stone-900 font-mono">{quotation.quotationNumber}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-stone-200 pb-1">
                            <span className="font-bold text-stone-500 text-xs uppercase">Date</span>
                            <span className="font-medium">{formatDate(quotation.header.quotationDate)}</span>
                        </div>
                        {/* 移除 Version 欄位 */}
                        <div className="flex justify-between items-center pt-1">
                            <span className="font-bold text-stone-500 text-xs uppercase">Prepared By</span>
                            <span className="font-bold text-stone-800">{quotation.createdByName}</span>
                        </div>
                    </div>
                </div>

                {/* 3. 方案名稱 (可開關) */}
                {shouldShowOptionName && selectedOption.name && (
                    <div className="mb-6 break-inside-avoid">
                        <h3 className="font-bold text-lg text-stone-900 flex items-center gap-3">
                            <span className="w-2 h-8 bg-orange-600 rounded-full block"></span>
                            {selectedOption.name}
                            {selectedOption.description && <span className="text-sm font-normal text-stone-500 mt-1">{selectedOption.description}</span>}
                        </h3>
                    </div>
                )}

                {/* 4. 報價明細表格 */}
                <div className="mb-8 overflow-hidden rounded-lg border border-stone-200">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-stone-50 text-stone-600 text-sm border-b-2 border-stone-200">
                                <th className="py-2 px-3 w-12 text-center font-bold">No.</th>
                                <th className="py-2 px-3 text-left font-bold border-l border-stone-200">Description 項目說明</th>
                                <th className="py-2 px-3 w-16 text-center font-bold border-l border-stone-200">Unit</th>
                                <th className="py-2 px-3 w-16 text-right font-bold border-l border-stone-200">Qty</th>
                                <th className="py-2 px-3 w-28 text-right font-bold border-l border-stone-200">Price</th>
                                <th className="py-2 px-3 w-28 text-right font-bold border-l border-stone-200 text-stone-800">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {selectedOption.categories.map((category) => (
                                <React.Fragment key={category.id}>
                                    {/* 分類標題行 - 避免在標題後立即分頁 */}
                                    <tr className="bg-stone-100 break-after-avoid">
                                        <td colSpan={6} className="py-1.5 px-4 text-stone-800 font-bold text-xs uppercase tracking-wider border-b border-stone-200">
                                            {category.code} — {category.name}
                                        </td>
                                    </tr>
                                    {/* 項目行 */}
                                    {category.items.map((item, idx) => (
                                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'} break-inside-avoid`}>
                                            <td className="py-2 px-3 text-center text-stone-400 text-xs border-r border-stone-100">{item.itemNumber}</td>
                                            <td className="py-2 px-3 border-r border-stone-100">
                                                <div className="font-bold text-stone-800">{item.name}</div>
                                                {item.notes && <div className="text-xs text-stone-500 mt-1 leading-relaxed">{item.notes}</div>}
                                            </td>
                                            <td className="py-2 px-3 text-center text-stone-600 border-r border-stone-100">{item.unit}</td>
                                            <td className="py-2 px-3 text-right text-stone-600 border-r border-stone-100 font-mono">{item.quantity.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right text-stone-600 border-r border-stone-100 font-mono">{formatCurrency(item.unitPrice).replace('$', '')}</td>
                                            <td className="py-2 px-3 text-right font-bold text-stone-900 font-mono bg-stone-50">{formatCurrency(item.amount).replace('$', '')}</td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* 5. 金額總計區 (靠右) */}
                <div className="flex justify-end mb-8 break-inside-avoid">
                    <div className="w-[45%] bg-stone-50 p-6 rounded-xl border border-stone-100 leading-relaxed relative">

                        <div className="flex justify-between text-stone-600 mb-2">
                            <span>小計 Subtotal</span>
                            <span className="font-mono">{formatCurrency(selectedOption.summary.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600 mb-2">
                            <span>工安管理費 ({selectedOption.summary.managementFeeRate}%)</span>
                            <span className="font-mono">{formatCurrency(selectedOption.summary.managementFee)}</span>
                        </div>
                        <div className="h-px bg-stone-200 my-2"></div>
                        <div className="flex justify-between text-stone-800 font-bold mb-2">
                            <span>未稅金額 Before Tax</span>
                            <span className="font-mono">{formatCurrency(selectedOption.summary.beforeTaxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-stone-600 mb-2">
                            <span>稅金 Tax ({selectedOption.summary.taxRate}%)</span>
                            <span className="font-mono">{formatCurrency(selectedOption.summary.tax)}</span>
                        </div>
                        <div className="h-px bg-stone-300 my-3"></div>
                        <div className="flex justify-between items-end">
                            <span className="font-black text-stone-900 text-lg">總計 Total</span>
                            <span className="font-black text-2xl text-orange-600 font-mono">{formatCurrency(selectedOption.summary.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* 6. 條款與備註 */}
                <div className="mb-4 break-inside-avoid">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-1 h-4 bg-stone-400"></div>
                        <h4 className="font-bold text-xs uppercase tracking-wide text-stone-600">Terms & Notes</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-8 text-xs text-stone-600 border-t border-stone-200 pt-3">
                        <div className="space-y-2">
                            {quotation.terms?.workSchedule && (
                                <div className="flex gap-2"><span className="font-bold text-stone-800 min-w-16">工期說明</span><span className="text-stone-700">{quotation.terms.workSchedule}</span></div>
                            )}
                            {quotation.terms?.paymentTerms && (
                                <div className="flex gap-2"><span className="font-bold text-stone-800 min-w-16">付款方式</span><span className="text-stone-700">{quotation.terms.paymentTerms}</span></div>
                            )}
                            {quotation.terms?.validityPeriod && (
                                <div className="flex gap-2"><span className="font-bold text-stone-800 min-w-16">有效期限</span><span className="text-stone-700">{quotation.terms.validityPeriod}</span></div>
                            )}
                            {quotation.terms?.warrantyYears && (
                                <div className="flex gap-2"><span className="font-bold text-stone-800 min-w-16">保固年限</span><span className="text-stone-700">{quotation.terms.warrantyYears} 年</span></div>
                            )}
                        </div>

                        <div className="bg-stone-50 p-3 rounded border border-stone-200 relative">
                            <div className="font-bold text-stone-800 mb-1 border-b border-stone-200 pb-1">匯款帳號資料 Bank Account Info</div>
                            <div className="space-y-1 relative z-10">
                                <div className="flex justify-between"><span>銀行 Code</span><span className="font-medium text-stone-900">{quotation.terms?.bankAccount?.bankName || '玉山銀行(808) 士林分行'}</span></div>
                                <div className="flex justify-between"><span>戶名 Name</span><span className="font-medium text-stone-900 text-right">{quotation.terms?.bankAccount?.accountName || '台灣生活品質發展股份有限公司'}</span></div>
                                <div className="flex justify-between bg-white p-1 rounded border border-stone-100 mt-1">
                                    <span className="font-bold">帳號 No.</span>
                                    <span className="font-mono font-bold text-stone-900">{quotation.terms?.bankAccount?.accountNumber || '0657-940-151307'}</span>
                                </div>
                            </div>

                            {/* 報價專用章 (Stamp) - Below Bank Account Info, centered in whitespace roughly */}
                            <div className="absolute top-full mt-4 right-8 pointer-events-none">
                                <img
                                    src={STAMP_BASE64 || '/stamp.png'}
                                    alt="Stamp"
                                    className="w-28 h-28 opacity-90 mix-blend-multiply"
                                    style={{ display: STAMP_BASE64 ? 'block' : 'none' }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 其他備註 */}
                    {quotation.terms?.otherNotes && quotation.terms.otherNotes.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-100">
                            <div className="font-bold text-stone-800 mb-1 text-xs">其他備註 Notes</div>
                            <div className="grid grid-cols-1 gap-1">
                                {quotation.terms.otherNotes.map((note, index) => (
                                    <div key={index} className="flex gap-2 text-xs text-stone-600">
                                        <span className="font-bold text-stone-400 min-w-4">{index + 1}.</span>
                                        <span>{note}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                </div>

                {/* 客戶簽名區 (如果有) */}
                {(quotation as any).signature && (
                    <div className="mb-8 flex justify-end break-inside-avoid">
                        <div className="w-1/3">
                            <div className="border-b-2 border-stone-900 pb-2 mb-2">
                                <img src={(quotation as any).signature} alt="Signature" className="h-16 object-contain" />
                            </div>
                            <div className="text-xs font-bold text-stone-900">客戶簽名 Confirmation</div>
                            <div className="text-[10px] text-stone-400">
                                Signed at: {new Date((quotation as any).signedAt).toLocaleString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 頁尾 - 置底設計 (現在做為文檔尾部) */}
            <div className="mt-12 border-t-4 border-orange-500 pt-3 break-inside-avoid">
                <div className="flex justify-between items-end text-[10px] text-stone-500 leading-relaxed">
                    <div>
                        <p className="font-bold text-stone-800 text-xs mb-1">台灣生活品質發展股份有限公司</p>
                        <p>台北總部: 111 台北市士林區中山北路五段500號7樓</p>
                        <p>新北分部: 235 新北市中和區景平路71號之7號2樓</p>
                    </div>
                    <div className="text-right">
                        <p>統編: 60618756</p>
                        <p>Tel: 02-2242-1955 | Fax: 02-2242-1905</p>
                        <p>Email: service@tqldc.com.tw</p>
                        {/* <p className="mt-1 font-mono text-stone-300">Generated by TQLDC System</p> */}
                    </div>
                </div>
            </div>

            {/* DEBUG: Red Box for Visibility Test */}
            <div
                className="fixed top-1/2 right-0 z-[100] pointer-events-none print:block"
                style={{
                    right: '25mm', // Next to the seal
                    marginTop: '-9mm',
                    width: '18mm',
                    height: '18mm',
                    border: '2px solid red',
                    background: 'rgba(255, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'red',
                    fontWeight: 'bold',
                    fontSize: '10px'
                }}
            >
                SEAL TEST
            </div>

            {/* 騎縫章 (Paging Seal) - Repeating on every page via position: fixed */}
            <div
                className="fixed top-1/2 z-50 pointer-events-none print:block"
                style={{
                    right: '0mm', // Align to right edge
                    marginTop: '-9mm', // Center vertically
                    width: '18mm',
                    height: '18mm',
                    opacity: 1, // Full opacity for testing
                    // mix-blend-mode: removed for reliability
                }}
            >
                <img
                    src={STAMP_BASE64 || '/stamp.png'}
                    alt="Paging Seal"
                    className="w-full h-full object-contain"
                    style={{
                        display: STAMP_BASE64 ? 'block' : 'none',
                    }}
                />
            </div>

        </div>
    );
});

export default QuotationPrintTemplate;
