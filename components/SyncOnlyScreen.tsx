import React, { useEffect } from 'react';
import { Cloud, CheckCircle, CloudOff, RefreshCw, Download, AlertCircle, LogOut } from 'lucide-react';

interface SyncOnlyScreenProps {
    isCloudConnected: boolean;
    isSyncing: boolean;
    lastCloudSync: string | null;
    cloudError: string | null;
    onConnectCloud: () => void;
    onSync: () => void;
    onLogout: () => void;
}

const SyncOnlyScreen: React.FC<SyncOnlyScreenProps> = ({
    isCloudConnected,
    isSyncing,
    lastCloudSync,
    cloudError,
    onConnectCloud,
    onSync,
    onLogout
}) => {

    // Auto-Trigger Connect for SyncOnly User
    useEffect(() => {
        if (!isCloudConnected && !isSyncing) {
            onConnectCloud();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="h-screen w-screen bg-stone-950 flex flex-col items-center justify-center p-8 overflow-hidden font-sans relative">
            <div className="absolute inset-0 bg-stone-900/50 backdrop-blur-3xl z-0"></div>
            <div className="relative z-10 w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-stone-200">
                <div className="text-center space-y-4 mb-10">
                    <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/20 mb-6">
                        <Cloud size={40} className="text-white animate-bounce" />
                    </div>
                    <h1 className="text-3xl font-black text-stone-900 tracking-tight">系統同步中心</h1>
                    <p className="text-stone-500 text-sm font-bold uppercase tracking-widest">Initial Cloud Synchronization</p>
                </div>

                <div className="space-y-6">
                    <div className={`p-6 rounded-3xl border transition-all ${isCloudConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-stone-50 border-stone-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isCloudConnected ? 'bg-emerald-500 text-white' : 'bg-stone-200 text-stone-400'}`}>
                                    {isCloudConnected ? <CheckCircle size={24} /> : <CloudOff size={24} />}
                                </div>
                                <div>
                                    <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">連線狀態</p>
                                    <p className={`text-sm font-black ${isCloudConnected ? 'text-emerald-700' : 'text-stone-600'}`}>
                                        {isCloudConnected ? '已連結至 Google Drive' : '尚未連結雲端'}
                                    </p>
                                </div>
                            </div>
                            {!isCloudConnected && (
                                <button onClick={onConnectCloud} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95">
                                    立即連結
                                </button>
                            )}
                        </div>
                    </div>

                    {isCloudConnected && (
                        <div className="p-6 bg-stone-50 rounded-3xl border border-stone-200 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-stone-200 shadow-sm">
                                        <RefreshCw size={24} className={`text-stone-400 ${isSyncing ? 'animate-spin' : ''}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase tracking-widest text-stone-400 mb-1">同步進度</p>
                                        <p className="text-sm font-black text-stone-900">
                                            {isSyncing ? '正在下載數據...' : lastCloudSync ? `最後同步: ${lastCloudSync}` : '等待下載'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    disabled={isSyncing}
                                    onClick={onSync}
                                    className="p-3 bg-white border border-stone-200 rounded-2xl text-stone-600 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm disabled:opacity-50"
                                >
                                    <Download size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {cloudError && (
                        <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 animate-in shake duration-500">
                            <AlertCircle className="text-rose-500 shrink-0" size={18} />
                            <p className="text-rose-600 text-xs font-bold">{cloudError}</p>
                        </div>
                    )}
                </div>

                <div className="mt-12 space-y-4">
                    <p className="text-center text-[10px] text-stone-400 font-bold leading-relaxed px-6">
                        ✨ 同步完成後，請點擊下方按鈕登出。
                        <br />之後即可使用您的個人員工編號直接登入本設備。
                    </p>
                    <button
                        onClick={onLogout}
                        className="w-full py-5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-stone-950/20 flex items-center justify-center gap-3"
                    >
                        登出並完成初始化
                        <LogOut size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SyncOnlyScreen;
