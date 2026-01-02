
import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check, AlertCircle, Scan } from 'lucide-react';
import { scanBusinessCard } from '../services/geminiService';

interface BusinessCardScannerProps {
    onScan: (data: any) => void;
    onClose: () => void;
}

const BusinessCardScanner: React.FC<BusinessCardScannerProps> = ({ onScan, onClose }) => {
    const [image, setImage] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImage(base64String);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const startScan = async () => {
        if (!image) return;

        setIsScanning(true);
        setError(null);

        try {
            // Remove the prefix (data:image/jpeg;base64,) before sending to Gemini
            const base64Data = image.split(',')[1];
            const result = await scanBusinessCard(base64Data);

            if (result) {
                onScan(result);
                onClose();
            } else {
                setError("無法解析名片內容，請手動輸入或換一張照片試試。");
            }
        } catch (err) {
            console.error("Scan error:", err);
            setError("AI 辨識發生錯誤，請檢查網路連線或稍後再試。");
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Scan size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 leading-tight">AI 名片快速掃描</h2>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">自動提取聯絡人、電話與地址</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-8">
                    {!image ? (
                        <div className="space-y-6">
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center gap-4 hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer group"
                            >
                                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                                    <Camera size={32} />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black text-slate-600">拍攝名片或上傳照片</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">支援 JPG, PNG 格式</p>
                                </div>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-50 aspect-[1.6/1] flex items-center justify-center">
                                <img src={image} alt="Preview" className="max-h-full max-w-full object-contain" />
                                {!isScanning && (
                                    <button
                                        onClick={() => setImage(null)}
                                        className="absolute top-3 right-3 p-2 bg-slate-900/50 hover:bg-rose-500 text-white rounded-xl backdrop-blur-md transition-all shadow-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                                {isScanning && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-4 animate-in fade-in">
                                        <div className="relative">
                                            <Loader2 size={48} className="text-blue-600 animate-spin" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Scan size={20} className="text-blue-600" />
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-blue-600 animate-pulse">正在透過 AI 解析名片...</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">這可能需要幾秒鐘時間</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-rose-600">
                                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-bold">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setImage(null)}
                                    disabled={isScanning}
                                    className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                                >
                                    重選照片
                                </button>
                                <button
                                    onClick={startScan}
                                    disabled={isScanning}
                                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200 active:scale-95 font-black text-sm disabled:opacity-50"
                                >
                                    <Check size={20} />
                                    <span>開始辨識提取</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BusinessCardScanner;
