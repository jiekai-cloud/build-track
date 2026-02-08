import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Quotation } from '../types';
import QuotationPrintTemplate from '../components/QuotationPrintTemplate';
import SignaturePad from '../components/SignaturePad';
import { storageService } from '../services/storageService';
import { CheckCircle } from 'lucide-react';

const ContractSigningPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [quotation, setQuotation] = useState<Quotation | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSigning, setIsSigning] = useState(false);
    const [signSuccess, setSignSuccess] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadQuotation = async () => {
            try {
                console.log('[Contract Signing] Loading quotation:', id);

                // Strategy 1: Try localStorage (FirstDept and ThirdDept)
                let allQuotes = await storageService.getItem<Quotation[]>('bt_quotations', []);
                let target = allQuotes.find(q => q.id === id);

                if (!target) {
                    // Try ThirdDept
                    allQuotes = await storageService.getItem<Quotation[]>('dept3_bt_quotations', []);
                    target = allQuotes.find(q => q.id === id);
                }

                // Strategy 2: If not found in localStorage, try IndexedDB (cloud sync)
                if (!target) {
                    console.log('[Contract Signing] Not found in localStorage, trying IndexedDB...');
                    try {
                        // Open IndexedDB
                        const dbName = 'BuildTrackDB';
                        const request = indexedDB.open(dbName, 1);

                        const db = await new Promise<IDBDatabase>((resolve, reject) => {
                            request.onsuccess = () => resolve(request.result);
                            request.onerror = () => reject(request.error);
                            request.onupgradeneeded = () => {
                                // If DB doesn't exist yet, we won't find data anyway
                                const db = request.result;
                                if (!db.objectStoreNames.contains('data')) {
                                    db.createObjectStore('data');
                                }
                            };
                        });

                        // Try to get quotations from IndexedDB
                        const transaction = db.transaction(['data'], 'readonly');
                        const store = transaction.objectStore('data');

                        // Try different possible keys
                        const keysToTry = ['bt_quotations', 'dept3_bt_quotations'];

                        for (const key of keysToTry) {
                            const getRequest = store.get(key);
                            const quotes = await new Promise<Quotation[] | null>((resolve) => {
                                getRequest.onsuccess = () => {
                                    const result = getRequest.result;
                                    resolve(result ? JSON.parse(result) : null);
                                };
                                getRequest.onerror = () => resolve(null);
                            });

                            if (quotes && Array.isArray(quotes)) {
                                target = quotes.find(q => q.id === id);
                                if (target) {
                                    console.log('[Contract Signing] Found in IndexedDB:', key);
                                    break;
                                }
                            }
                        }

                        db.close();
                    } catch (dbError) {
                        console.error('[Contract Signing] IndexedDB error:', dbError);
                    }
                }

                if (target) {
                    console.log('[Contract Signing] Quotation loaded successfully');
                    setQuotation(target);
                    // Check if already signed
                    if ((target as any).status === 'signed') {
                        setSignSuccess(true);
                    }
                } else {
                    console.error('[Contract Signing] Quotation not found:', id);
                    setError('找不到此報價單。\n\n可能原因：\n1. 連結已失效\n2. 報價單尚未同步到雲端\n3. 請確認連結是否正確');
                }
            } catch (e) {
                console.error('[Contract Signing] Error loading quotation:', e);
                setError('系統錯誤，無法載入報價單。\n\n請稍後再試或聯繫管理員。');
            } finally {
                setLoading(false);
            }
        };
        loadQuotation();
    }, [id]);

    const handleSignComplete = async (signatureData: string) => {
        if (!quotation) return;

        const updatedQuotation: Quotation = {
            ...quotation,
            status: 'signed',
            // @ts-ignore
            signature: signatureData,
            // @ts-ignore
            signedAt: new Date().toISOString()
        } as Quotation;

        setQuotation(updatedQuotation);
        setIsSigning(false);
        setSignSuccess(true);

        try {
            // Determine prefix based on departmentId
            // Default to empty prefix (FirstDept) unless DEPT-8 (ThirdDept)
            const prefix = quotation.departmentId === 'DEPT-8' ? 'dept3_' : '';
            const key = `${prefix}bt_quotations`;
            const quotes = await storageService.getItem<Quotation[]>(key, []);
            const newQuotes = quotes.map(q => q.id === quotation.id ? updatedQuotation : q);
            await storageService.setItem(key, newQuotes);

        } catch (e) {
            console.error('Failed to save signature', e);
            alert('儲存簽名失敗，請聯繫管理員。');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">載入中...</div>;
    if (error) return <div className="flex justify-center items-center h-screen text-red-600">{error}</div>;
    if (!quotation) return null;

    if (signSuccess) {
        return (
            <div className="flex flex-col items-center justify-center p-10 min-h-screen bg-stone-50">
                <CheckCircle size={64} className="text-green-500 mb-4" />
                <h1 className="text-2xl font-bold text-stone-800 mb-2">簽署完成！</h1>
                <p className="text-stone-600 mb-8 text-center">感謝您的簽署，我們已收到您的確認。</p>
                <div className="flex gap-4">
                    <button onClick={() => window.print()} className="px-6 py-2 bg-stone-800 text-white rounded hover:bg-stone-900">
                        下載/列印合約
                    </button>
                </div>
                <div className="mt-8 shadow-xl border border-stone-200 scale-75 origin-top">
                    <QuotationPrintTemplate ref={printRef} quotation={quotation} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 pb-32">
            {/* Header / Info Bar */}
            <div className="bg-stone-900 text-white p-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
                <div className="text-sm font-medium">電子合約簽署系統</div>
                <div className="text-xs text-stone-400">Quote ID: {quotation.quotationNumber}</div>
            </div>

            <div className="container mx-auto py-8 px-4 flex justify-center mb-24">
                {/* PDF Scale Wrapper - Mobile friendly scaling */}
                <div className="w-full flex justify-center">
                    <div className="scale-[0.6] sm:scale-[0.8] md:scale-100 origin-top shadow-xl">
                        <QuotationPrintTemplate ref={printRef} quotation={quotation} />
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-lg flex justify-center z-20">
                <button
                    onClick={() => setIsSigning(true)}
                    className="bg-orange-600 text-white px-8 py-3 rounded-full text-lg font-bold shadow-lg hover:bg-orange-700 transition-all transform hover:-translate-y-1"
                >
                    同意報價並簽名
                </button>
            </div>

            {/* Signature Modal */}
            {isSigning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-lg">
                        <SignaturePad onSave={handleSignComplete} onCancel={() => setIsSigning(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContractSigningPage;
