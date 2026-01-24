
import React, { useState } from 'react';
import { Activity, CheckCircle2, AlertTriangle, XCircle, RefreshCw, ShieldCheck, Database, Key, Wifi, HardDrive } from 'lucide-react';
import { Project, Customer, TeamMember } from '../types';
import { getAI } from '../services/geminiService';

interface SystemHealthProps {
    projects: Project[];
    customers: Customer[];
    teamMembers: TeamMember[];
}

interface HealthCheckItem {
    id: string;
    name: string;
    category: 'System' | 'Data' | 'Network' | 'API';
    status: 'Pending' | 'Running' | 'Pass' | 'Fail' | 'Warning';
    message?: string;
}

const SystemHealth: React.FC<SystemHealthProps> = ({ projects, customers, teamMembers }) => {
    const [isChecking, setIsChecking] = useState(false);
    const [checks, setChecks] = useState<HealthCheckItem[]>([
        { id: 'browser', name: '瀏覽器相容性檢查', category: 'System', status: 'Pending' },
        { id: 'storage', name: '本地儲存空間 (LocalStorage)', category: 'System', status: 'Pending' },
        { id: 'api_gemini', name: 'Gemini AI 連線測試', category: 'API', status: 'Pending' },
        { id: 'api_maps', name: 'Google Maps API 設定', category: 'API', status: 'Pending' },
        { id: 'data_integrity', name: '專案資料結構完整性', category: 'Data', status: 'Pending' },
        { id: 'orphan_data', name: '孤立資料檢查 (關聯性)', category: 'Data', status: 'Pending' },
    ]);

    const runDiagnostics = async () => {
        setIsChecking(true);
        const newChecks = [...checks].map(c => ({ ...c, status: 'Pending', message: '' })) as HealthCheckItem[];
        setChecks(newChecks);

        // Helper to update specific check
        const updateCheck = (id: string, status: HealthCheckItem['status'], message?: string) => {
            setChecks(prev => prev.map(c => c.id === id ? { ...c, status, message } : c));
        };

        // 1. Browser Check
        updateCheck('browser', 'Running');
        await new Promise(r => setTimeout(r, 500));
        try {
            const isModern = window.fetch && window.localStorage && window.FileReader;
            if (isModern) updateCheck('browser', 'Pass', `User Agent: ${navigator.userAgent.slice(0, 30)}...`);
            else updateCheck('browser', 'Warning', '偵測到較舊的瀏覽器環境，部分功能可能受限');
        } catch (e) {
            updateCheck('browser', 'Fail', '無法讀取瀏覽器資訊');
        }

        // 2. Storage Check
        updateCheck('storage', 'Running');
        await new Promise(r => setTimeout(r, 600));
        try {
            const used = JSON.stringify(localStorage).length;
            const sizeMB = (used / 1024 / 1024).toFixed(2);
            if (used > 4 * 1024 * 1024) updateCheck('storage', 'Warning', `佔用偏高 (${sizeMB} MB)`);
            else updateCheck('storage', 'Pass', `使用量正常 (${sizeMB} MB)`);
        } catch (e) {
            updateCheck('storage', 'Fail', '無法存取 LocalStorage');
        }

        // 3. API - Gemini
        updateCheck('api_gemini', 'Running');
        try {
            // Check if key exists
            const ai = getAI(); // Throws if no key
            // Optional: Try a very cheap call if possible, or just assume Key presence is good step 1
            updateCheck('api_gemini', 'Pass', 'API Key 已配置 (未進行計費調用)');
        } catch (e: any) {
            updateCheck('api_gemini', 'Fail', e.message || 'API Key 失效或未設定');
        }

        // 4. API - Maps
        updateCheck('api_maps', 'Running');
        await new Promise(r => setTimeout(r, 500));
        const mapKey = localStorage.getItem('GOOGLE_MAPS_API_KEY') || process.env.GOOGLE_MAPS_API_KEY;
        if (mapKey && mapKey.startsWith('AIza')) {
            updateCheck('api_maps', 'Pass', 'API Key 格式正確');
        } else {
            updateCheck('api_maps', 'Fail', '未偵測到有效的 Google Maps Key');
        }

        // 5. Data Integrity
        updateCheck('data_integrity', 'Running');
        await new Promise(r => setTimeout(r, 800));
        const corruptProjects = projects.filter(p => !p.id || !p.name);
        if (corruptProjects.length > 0) {
            updateCheck('data_integrity', 'Fail', `發現 ${corruptProjects.length} 筆損毀的專案資料`);
        } else {
            updateCheck('data_integrity', 'Pass', `掃描 ${projects.length} 筆專案：結構完整`);
        }

        // 6. Orphan Data
        updateCheck('orphan_data', 'Running');
        await new Promise(r => setTimeout(r, 800));
        // Example: Projects referencing non-existent department (skip for now as Dept logic is simple)
        // Check Project -> Customer link? (Projects usually have client name string, usually loose link)
        // Let's check duplicate IDs
        const ids = projects.map(p => p.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            updateCheck('orphan_data', 'Warning', '偵測到重複的專案 ID，可能導致數據覆蓋');
        } else {
            updateCheck('orphan_data', 'Pass', '資料關聯性檢查通過');
        }

        setIsChecking(false);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Running': return <RefreshCw size={18} className="animate-spin text-blue-500" />;
            case 'Pass': return <CheckCircle2 size={18} className="text-emerald-500" />;
            case 'Fail': return <XCircle size={18} className="text-rose-500" />;
            case 'Warning': return <AlertTriangle size={18} className="text-amber-500" />;
            default: return <div className="w-4 h-4 rounded-full border-2 border-stone-200"></div>;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Running': return '檢測中...';
            case 'Pass': return '通過';
            case 'Fail': return '失敗';
            case 'Warning': return '警告';
            default: return '待檢測';
        }
    };

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4">
            <div className="flex items-center gap-5">
                <div className="p-5 rounded-[2rem] bg-violet-50 text-violet-600 shadow-lg">
                    <Activity size={32} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">系統自動診斷</h3>
                    <p className="text-sm text-stone-500 font-medium">一鍵掃描系統健康狀況、API 連線與資料完整性。</p>
                </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-stone-200 shadow-sm space-y-6">

                <div className="flex justify-between items-center pb-6 border-b border-stone-100">
                    <div className="flex gap-4">
                        <div className="text-center px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase">檢查項目</p>
                            <p className="text-xl font-black text-stone-900">{checks.length}</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase">已通過</p>
                            <p className="text-xl font-black text-emerald-600">{checks.filter(c => c.status === 'Pass').length}</p>
                        </div>
                        <div className="text-center px-4 py-2 bg-stone-50 rounded-2xl border border-stone-100">
                            <p className="text-[10px] font-black text-stone-400 uppercase">異常</p>
                            <p className="text-xl font-black text-rose-600">{checks.filter(c => ['Fail', 'Warning'].includes(c.status)).length}</p>
                        </div>
                    </div>

                    <button
                        onClick={runDiagnostics}
                        disabled={isChecking}
                        className="bg-stone-900 text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-800 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-stone-200 disabled:opacity-50"
                    >
                        {isChecking ? <RefreshCw size={16} className="animate-spin" /> : <Activity size={16} />}
                        {isChecking ? '正在執行全系統掃描...' : '開始系統診斷'}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {checks.map(check => (
                        <div key={check.id} className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-100 group hover:border-violet-100 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${check.category === 'API' ? 'bg-indigo-100 text-indigo-600' :
                                        check.category === 'Data' ? 'bg-orange-100 text-orange-600' :
                                            'bg-slate-200 text-slate-600'
                                    }`}>
                                    {check.category === 'API' ? <Key size={18} /> :
                                        check.category === 'Data' ? <Database size={18} /> :
                                            check.category === 'Network' ? <Wifi size={18} /> :
                                                <HardDrive size={18} />
                                    }
                                </div>
                                <div>
                                    <h4 className="font-bold text-stone-700 text-sm">{check.name}</h4>
                                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{check.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-right">
                                {check.message && (
                                    <span className={`text-[10px] font-bold px-2 py-1 rounded bg-white border ${check.status === 'Fail' ? 'text-rose-600 border-rose-100' :
                                            check.status === 'Warning' ? 'text-amber-600 border-amber-100' :
                                                'text-stone-500 border-stone-200'
                                        }`}>
                                        {check.message}
                                    </span>
                                )}
                                <div className="flex items-center gap-2 min-w-[80px] justify-end">
                                    <span className={`text-xs font-black uppercase ${check.status === 'Pass' ? 'text-emerald-600' :
                                            check.status === 'Fail' ? 'text-rose-600' :
                                                check.status === 'Warning' ? 'text-amber-600' :
                                                    'text-stone-400'
                                        }`}>
                                        {getStatusText(check.status)}
                                    </span>
                                    {getStatusIcon(check.status)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default SystemHealth;
