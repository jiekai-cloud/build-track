
import React, { useState, useMemo, FC } from 'react';
import {
  User, ChevronRight, Download, ShieldCheck,
  Cloud, CloudOff, RefreshCw, Database, HardDrive, FileJson, UploadCloud, RotateCcw, Zap, Info, AlertTriangle, Github, Globe, Copy, Check, ShieldAlert, LayoutDashboard, Sparkles
} from 'lucide-react';
import {
  Project, Customer, TeamMember, User as UserType,
  Vendor, InventoryItem, AttendanceRecord, PayrollRecord,
  Quotation, Lead, PurchaseOrder, ApprovalRequest, ApprovalTemplate, InventoryLocation
} from '../types';
import { BACKUP_FILENAME } from '../services/googleDriveService';

interface SettingsProps {
  user: UserType;
  projects: Project[];
  customers: Customer[];
  teamMembers: TeamMember[];
  vendors: Vendor[];
  inventory: InventoryItem[];
  locations: InventoryLocation[];
  purchaseOrders: PurchaseOrder[];
  attendance: AttendanceRecord[];
  payroll: PayrollRecord[];
  quotations: Quotation[];
  leads: Lead[];
  approvalRequests: ApprovalRequest[];
  approvalTemplates: ApprovalTemplate[];
  onResetData: () => void;
  onImportData: (data: any, mode?: 'overwrite' | 'merge') => void;
  isCloudConnected: boolean;
  onConnectCloud: () => void;
  onDisconnectCloud: () => void;
  lastSyncTime: string | null;
  onDownloadBackup?: () => void;
  onRestoreLocalBackup?: () => void;
}

const Settings: FC<SettingsProps> = ({
  user, projects, customers, teamMembers,
  vendors, inventory, locations, purchaseOrders, attendance, payroll,
  quotations, leads, approvalRequests, approvalTemplates,
  onResetData, onImportData,
  isCloudConnected, onConnectCloud, onDisconnectCloud, lastSyncTime,
  onDownloadBackup, onRestoreLocalBackup
}) => {
  const [activeSection, setActiveSection] = useState('cloud');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null); // Legacy removed
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set()); // Legacy removed

  const [restoreData, setRestoreData] = useState<any>(null);
  const [restoreOptions, setRestoreOptions] = useState<Record<string, boolean>>({});
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, Set<string>>>({});
  const [selectionCategory, setSelectionCategory] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState('');

  React.useEffect(() => {
    const key = localStorage.getItem('GEMINI_API_KEY');
    if (key) setApiKey(key);
  }, []);

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('GEMINI_API_KEY');
      alert('API Key 已清除');
      window.location.reload();
      return;
    }
    localStorage.setItem('GEMINI_API_KEY', apiKey.trim());
    alert('✅ API Key 已安全儲存於瀏覽器本機！');
    window.location.reload();
  };

  const [importMode, setImportMode] = useState<'overwrite' | 'merge'>('merge');
  const isReadOnly = user.role === 'Guest';
  const currentUrl = window.location.origin + window.location.pathname;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const backupData = {
        version: "2026.1.1",
        exportDate: new Date().toISOString(),
        projects,
        customers,
        teamMembers,
        vendors,
        inventory,
        locations,
        purchaseOrders,
        attendance,
        payroll,
        quotations,
        leads,
        approvalRequests,
        approvalTemplates
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `生活品質工程系統_備份_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
    }, 800);
  };

  const sections = [
    { id: 'profile', label: '個人帳戶', icon: User },
    { id: 'ai', label: 'AI 設定', icon: Sparkles },
    { id: 'cloud', label: '雲端同步', icon: Cloud },
    { id: 'deploy', label: '部署助手', icon: Github },
    { id: 'data', label: '資料安全', icon: ShieldCheck },
  ];

  // Add modules section for SuperAdmin
  if (user.role === 'SuperAdmin') {
    sections.push({ id: 'modules', label: '功能模組', icon: LayoutDashboard });
  }

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-stone-900 tracking-tight">系統配置</h1>
        <p className="text-stone-500 text-sm font-medium">針對生產環境與 GitHub Pages 最佳化。</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 space-y-1 shrink-0">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl transition-all ${activeSection === section.id
                ? 'bg-stone-900 text-white shadow-xl shadow-stone-200'
                : 'text-stone-500 hover:bg-white hover:text-stone-900'
                }`}
            >
              <div className="flex items-center gap-3">
                <section.icon size={18} className={activeSection === section.id ? 'text-orange-400' : 'text-stone-400'} />
                <span className="font-black text-xs uppercase tracking-widest">{section.label}</span>
              </div>
              <ChevronRight size={14} className={activeSection === section.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-[2.5rem] border border-stone-200 shadow-sm overflow-hidden min-h-[550px]">
          <div className="p-6 lg:p-12">

            {activeSection === 'ai' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-5">
                  <div className="p-5 rounded-[2rem] bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg">
                    <Sparkles size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">AI 智慧助手設定</h3>
                    <p className="text-sm text-stone-500 font-medium">管理 Gemini AI 模型連線與金鑰。</p>
                  </div>
                </div>

                <div className="bg-violet-50 border border-violet-100 p-8 rounded-[2rem] space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-violet-900 uppercase tracking-widest">
                      Google Gemini API Key
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="請在此輸入您的 API Key (AIzaSy...)"
                        className="w-full bg-white border border-violet-200 text-stone-900 text-sm font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all placeholder:font-normal"
                      />
                    </div>
                    <p className="text-[11px] text-violet-700 leading-relaxed font-bold mt-2">
                      為了保護您的資產安全，此金鑰僅會儲存在您的瀏覽器中 (localStorage)，絕對不會上傳至任何伺服器。
                      <br />請確保您的 API Key 已啟用 Generative Language API 權限。
                    </p>
                  </div>

                  <button
                    onClick={handleSaveApiKey}
                    className="w-full bg-violet-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-violet-200 hover:bg-violet-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    {apiKey ? '更新並儲存金鑰' : '儲存金鑰'}
                  </button>
                </div>

                <div className="bg-stone-50 p-6 rounded-[2rem] border border-stone-200">
                  <h4 className="text-sm font-black text-stone-900 mb-2">如何取得 API Key？</h4>
                  <ol className="list-decimal list-inside text-xs text-stone-500 space-y-1 font-bold">
                    <li>前往 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline">Google AI Studio</a></li>
                    <li>點擊 "Create API key"</li>
                    <li>將產生的字串複製並貼上至上方欄位</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 'deploy' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-5">
                  <div className="p-5 rounded-[2rem] bg-stone-900 text-white shadow-lg">
                    <Github size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">GitHub Pages 部署助手</h3>
                    <p className="text-sm text-stone-500 font-medium">協助您完成雲端授權與發佈設定。</p>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] space-y-4">
                  <div className="flex items-start gap-3">
                    <Info className="text-orange-600 mt-1" size={18} />
                    <div className="space-y-2">
                      <p className="text-sm font-black text-orange-900">為什麼需要設定授權來源？</p>
                      <p className="text-xs text-orange-700 leading-relaxed font-bold">
                        為了防止他人惡意存取您的 Google Drive，Google 要求必須在後台手動核准您的網站網址。
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">您的系統網址</p>
                    <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-orange-200 shadow-inner">
                      <Globe size={14} className="text-stone-400" />
                      <code className="text-xs font-black text-stone-900 flex-1 truncate">{currentUrl}</code>
                      <button
                        onClick={handleCopyUrl}
                        className="p-2 hover:bg-stone-50 rounded-lg text-orange-600 transition-all active:scale-90"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'cloud' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-5">
                  <div className={`p-5 rounded-[2rem] ${isCloudConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                    {isCloudConnected ? <Cloud size={32} /> : <CloudOff size={32} />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">Google Drive 雲端同步</h3>
                    <p className="text-sm text-stone-500 font-medium">跨設備數據存取的唯一核心路徑。</p>
                  </div>
                </div>

                {isReadOnly ? (
                  <div className="bg-stone-50 p-10 rounded-[2.5rem] border border-stone-200 text-center flex flex-col items-center gap-4">
                    <ShieldAlert size={48} className="text-stone-300" />
                    <div>
                      <h4 className="text-lg font-black text-stone-900 uppercase">權限受限</h4>
                      <p className="text-sm text-stone-500 max-w-sm mx-auto mt-2">訪客帳號無法進行雲端連線設定。</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {!isCloudConnected ? (
                      <div className="bg-stone-50 p-10 rounded-[2.5rem] border border-stone-200 text-center space-y-6">
                        <div className="mx-auto w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                          <Zap size={32} className="text-orange-500" />
                        </div>
                        <div>
                          <h4 className="text-lg font-black text-stone-900 uppercase">啟動智慧同步</h4>
                          <p className="text-sm text-stone-500 max-w-sm mx-auto mt-2">一旦啟用，您的所有更動都會立即加密儲存至您的 Google Drive 專屬檔案中。</p>
                        </div>
                        <button
                          onClick={onConnectCloud}
                          className="w-full max-w-xs mx-auto bg-orange-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                          授權並啟動同步
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="bg-emerald-50 border border-emerald-100 p-8 rounded-[2rem] flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <ShieldCheck size={28} className="text-emerald-500" />
                            <div>
                              <p className="text-sm font-black text-emerald-900">連線穩定</p>
                              <p className="text-xs text-emerald-600 font-bold">同步檔案：{BACKUP_FILENAME}</p>
                            </div>
                          </div>
                          <button
                            onClick={onDisconnectCloud}
                            className="text-xs font-black text-emerald-700 hover:text-rose-600 transition-colors underline underline-offset-4"
                          >
                            中斷連線
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeSection === 'data' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-orange-50 text-orange-600 rounded-[1.5rem]">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">資料安全中心</h3>
                    <p className="text-sm text-stone-500 font-medium">管理本地與雲端的數據持久化策略。</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm space-y-4 group hover:border-orange-200 transition-all">
                    <div className="flex items-center gap-3">
                      <Download size={20} className="text-blue-500" />
                      <h4 className="text-sm font-black text-stone-900">導出 JSON 備份</h4>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed font-bold">
                      將所有資料存為本地檔案，適合在無網路環境下進行遷移。
                    </p>
                    <button
                      onClick={() => {
                        if (onDownloadBackup) onDownloadBackup();
                        else handleManualExport();
                      }}
                      disabled={isExporting}
                      className="w-full bg-stone-900 text-white hover:bg-stone-800 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-stone-100 transition-all active:scale-95"
                    >
                      {isExporting ? <RefreshCw size={14} className="animate-spin" /> : <Download size={16} />}
                      導出完整數據包 (.json)
                    </button>
                  </div>

                  {!isReadOnly && (
                    <div className="bg-white p-6 rounded-[2rem] border border-stone-200 shadow-sm space-y-4 group hover:border-emerald-200 transition-all">
                      <div className="flex items-center gap-3">
                        <UploadCloud size={20} className="text-emerald-500" />
                        <h4 className="text-sm font-black text-stone-900">匯入現有資料</h4>
                      </div>
                      <p className="text-[11px] text-stone-500 leading-relaxed font-bold">
                        從現有的備份檔恢復數據。
                      </p>

                      <div className="flex bg-stone-100 p-1 rounded-xl mb-3">
                        <button
                          onClick={() => setImportMode('merge')}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${importMode === 'merge' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-400'}`}
                        >
                          合併 (Merge)
                        </button>
                        <button
                          onClick={() => setImportMode('overwrite')}
                          className={`flex-1 py-1.5 rounded-lg text-[10px] font-black tracking-widest transition-all ${importMode === 'overwrite' ? 'bg-rose-600 text-white shadow-sm' : 'text-stone-400'}`}
                        >
                          覆蓋 (Overwrite)
                        </button>
                      </div>

                      {!restoreData ? (
                        <div className="relative">
                          <input
                            type="file"
                            accept=".json"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                try {
                                  const jsonStr = event.target?.result as string;
                                  const parsed = JSON.parse(jsonStr);

                                  // Initialize restore options and selected items map
                                  const initialOptions: any = {};
                                  const initialSelection: Record<string, Set<string>> = {};

                                  // Define all known categories
                                  const possibleKeys = ['projects', 'customers', 'vendors', 'teamMembers', 'inventory', 'attendance', 'payroll', 'leads', 'approvalRequests', 'approvalTemplates', 'locations', 'purchaseOrders', 'quotations'];

                                  possibleKeys.forEach(key => {
                                    if (parsed[key] && Array.isArray(parsed[key]) && parsed[key].length > 0) {
                                      initialOptions[key] = true;
                                      initialSelection[key] = new Set(parsed[key].map((item: any) => item.id));
                                    }
                                  });

                                  if (Object.keys(initialOptions).length > 0) {
                                    setRestoreOptions(initialOptions);
                                    setSelectedItemsMap(initialSelection);
                                    setRestoreData(parsed);
                                  } else {
                                    // Format not recognized or empty
                                    alert('備份檔案格式不符或內容為空');
                                  }
                                } catch (err) {
                                  alert('檔案解析失敗：請確認上傳的是有效的 .json 備份檔');
                                }
                              };
                              reader.onerror = () => {
                                alert('檔案讀取錯誤，請重試');
                              };
                              reader.readAsText(file);
                              e.target.value = '';
                            }}
                          />
                          <button
                            className="w-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all pointer-events-none"
                          >
                            <RotateCcw size={14} />
                            選擇備份檔案匯入
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="flex items-center gap-2 text-xs font-black text-emerald-800">
                                <Database size={14} />
                                偵測到完整備份資料
                              </h5>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    const newOpts: any = {};
                                    Object.keys(restoreData).forEach(k => {
                                      if (Array.isArray(restoreData[k]) && restoreData[k].length > 0) newOpts[k] = true;
                                    });
                                    setRestoreOptions(newOpts);
                                  }}
                                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm"
                                >
                                  全選
                                </button>
                                <button
                                  onClick={() => setRestoreOptions({})}
                                  className="text-[10px] font-bold text-stone-400 hover:text-stone-600 bg-white px-2 py-1 rounded-lg border border-stone-100 hover:border-stone-300 transition-all shadow-sm"
                                >
                                  全取消
                                </button>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {restoreData.projects && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.projects} onChange={(e) => setRestoreOptions({ ...restoreOptions, projects: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">專案 ({restoreData.projects.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('projects');
                                      if (!selectedItemsMap['projects']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['projects'] = new Set(restoreData.projects.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.customers && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.customers} onChange={(e) => setRestoreOptions({ ...restoreOptions, customers: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">客戶 ({restoreData.customers.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('customers');
                                      if (!selectedItemsMap['customers']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['customers'] = new Set(restoreData.customers.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.teamMembers && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.teamMembers} onChange={(e) => setRestoreOptions({ ...restoreOptions, teamMembers: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">團隊 ({restoreData.teamMembers.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('teamMembers');
                                      if (!selectedItemsMap['teamMembers']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['teamMembers'] = new Set(restoreData.teamMembers.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.vendors && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.vendors} onChange={(e) => setRestoreOptions({ ...restoreOptions, vendors: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">廠商 ({restoreData.vendors.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('vendors');
                                      if (!selectedItemsMap['vendors']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['vendors'] = new Set(restoreData.vendors.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.inventory && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.inventory} onChange={(e) => setRestoreOptions({ ...restoreOptions, inventory: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">庫存 ({restoreData.inventory.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('inventory');
                                      if (!selectedItemsMap['inventory']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['inventory'] = new Set(restoreData.inventory.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.attendance && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.attendance} onChange={(e) => setRestoreOptions({ ...restoreOptions, attendance: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">考勤 ({restoreData.attendance.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('attendance');
                                      if (!selectedItemsMap['attendance']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['attendance'] = new Set(restoreData.attendance.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.payroll && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.payroll} onChange={(e) => setRestoreOptions({ ...restoreOptions, payroll: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">薪資 ({restoreData.payroll.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('payroll');
                                      if (!selectedItemsMap['payroll']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['payroll'] = new Set(restoreData.payroll.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.approvalRequests && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.approvalRequests} onChange={(e) => setRestoreOptions({ ...restoreOptions, approvalRequests: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">簽核申請 ({restoreData.approvalRequests.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('approvalRequests');
                                      if (!selectedItemsMap['approvalRequests']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['approvalRequests'] = new Set(restoreData.approvalRequests.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.approvalTemplates && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.approvalTemplates} onChange={(e) => setRestoreOptions({ ...restoreOptions, approvalTemplates: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">簽核流程 ({restoreData.approvalTemplates.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('approvalTemplates');
                                      if (!selectedItemsMap['approvalTemplates']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['approvalTemplates'] = new Set(restoreData.approvalTemplates.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                              {restoreData.quotations && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white/50 rounded-lg">
                                  <input type="checkbox" checked={restoreOptions.quotations} onChange={(e) => setRestoreOptions({ ...restoreOptions, quotations: e.target.checked })} className="w-4 h-4 text-emerald-600 rounded" />
                                  <span className="text-[10px] font-bold">報價單 ({restoreData.quotations.length})</span>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setPendingData(restoreData);
                                      setSelectionCategory('quotations');
                                      if (!selectedItemsMap['quotations']) {
                                        const newMap = { ...selectedItemsMap };
                                        newMap['quotations'] = new Set(restoreData.quotations.map((p: any) => p.id));
                                        setSelectedItemsMap(newMap);
                                      }
                                      setImportMode('merge');
                                    }}
                                    className="ml-auto px-2 py-0.5 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 text-[10px] font-black"
                                  >
                                    挑選
                                  </button>
                                </label>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              onClick={() => {
                                setRestoreData(null);
                                setRestoreOptions({ projects: true, dispatch: true, customers: true, vendors: true, teamMembers: true, inventory: true, attendance: true, payroll: true, leads: true, approvalRequests: true, approvalTemplates: true, quotations: true });
                              }}
                              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 py-3 rounded-xl text-xs font-black transition-colors"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => {
                                try {
                                  const dataToRestore: any = {};
                                  const restoredItems: string[] = [];

                                  if (restoreOptions.projects && restoreData.projects) {
                                    if (selectedItemsMap['projects']) {
                                      dataToRestore.projects = restoreData.projects.filter((item: any) => selectedItemsMap['projects'].has(item.id));
                                    } else {
                                      dataToRestore.projects = restoreData.projects;
                                    }
                                    restoredItems.push(`專案`);
                                  }
                                  if (restoreOptions.customers && restoreData.customers) {
                                    if (selectedItemsMap['customers']) {
                                      dataToRestore.customers = restoreData.customers.filter((item: any) => selectedItemsMap['customers'].has(item.id));
                                    } else {
                                      dataToRestore.customers = restoreData.customers;
                                    }
                                    restoredItems.push(`客戶`);
                                  }
                                  if (restoreOptions.vendors && restoreData.vendors) {
                                    if (selectedItemsMap['vendors']) {
                                      dataToRestore.vendors = restoreData.vendors.filter((item: any) => selectedItemsMap['vendors'].has(item.id));
                                    } else {
                                      dataToRestore.vendors = restoreData.vendors;
                                    }
                                    restoredItems.push(`廠商`);
                                  }
                                  if (restoreOptions.teamMembers && restoreData.teamMembers) {
                                    if (selectedItemsMap['teamMembers']) {
                                      dataToRestore.teamMembers = restoreData.teamMembers.filter((item: any) => selectedItemsMap['teamMembers'].has(item.id));
                                    } else {
                                      dataToRestore.teamMembers = restoreData.teamMembers;
                                    }
                                    restoredItems.push(`團隊`);
                                  }
                                  if (restoreOptions.inventory && restoreData.inventory) {
                                    if (selectedItemsMap['inventory']) {
                                      dataToRestore.inventory = restoreData.inventory.filter((item: any) => selectedItemsMap['inventory'].has(item.id));
                                    } else {
                                      dataToRestore.inventory = restoreData.inventory;
                                    }
                                    if (restoreData.locations) dataToRestore.locations = restoreData.locations;
                                    if (restoreData.purchaseOrders) dataToRestore.purchaseOrders = restoreData.purchaseOrders;
                                    restoredItems.push(`庫存`);
                                  }
                                  if (restoreOptions.attendance && restoreData.attendance) {
                                    if (selectedItemsMap['attendance']) {
                                      dataToRestore.attendance = restoreData.attendance.filter((item: any) => selectedItemsMap['attendance'].has(item.id));
                                    } else {
                                      dataToRestore.attendance = restoreData.attendance;
                                    }
                                    restoredItems.push(`考勤`);
                                  }
                                  if (restoreOptions.payroll && restoreData.payroll) {
                                    if (selectedItemsMap['payroll']) {
                                      dataToRestore.payroll = restoreData.payroll.filter((item: any) => selectedItemsMap['payroll'].has(item.id));
                                    } else {
                                      dataToRestore.payroll = restoreData.payroll;
                                    }
                                    restoredItems.push(`薪資`);
                                  }
                                  if (restoreOptions.approvalRequests && restoreData.approvalRequests) {
                                    if (selectedItemsMap['approvalRequests']) {
                                      dataToRestore.approvalRequests = restoreData.approvalRequests.filter((item: any) => selectedItemsMap['approvalRequests'].has(item.id));
                                    } else {
                                      dataToRestore.approvalRequests = restoreData.approvalRequests;
                                    }
                                    restoredItems.push(`簽核申請`);
                                  }
                                  if (restoreOptions.approvalTemplates && restoreData.approvalTemplates) {
                                    if (selectedItemsMap['approvalTemplates']) {
                                      dataToRestore.approvalTemplates = restoreData.approvalTemplates.filter((item: any) => selectedItemsMap['approvalTemplates'].has(item.id));
                                    } else {
                                      dataToRestore.approvalTemplates = restoreData.approvalTemplates;
                                    }
                                    restoredItems.push(`簽核流程`);
                                  }
                                  if (restoreOptions.quotations && restoreData.quotations) {
                                    if (selectedItemsMap['quotations']) {
                                      dataToRestore.quotations = restoreData.quotations.filter((item: any) => selectedItemsMap['quotations'].has(item.id));
                                    } else {
                                      dataToRestore.quotations = restoreData.quotations;
                                    }
                                    restoredItems.push(`報價單`);
                                  }

                                  if (Object.keys(dataToRestore).length === 0) return alert('請至少選擇一項');

                                  onImportData(dataToRestore, importMode);
                                  alert(`✅ 恢復成功！已還原：${restoredItems.join(', ')}`);
                                  setRestoreData(null);
                                } catch (error) {
                                  alert('恢復失敗：' + (error as Error).message);
                                }
                              }}
                              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-black transition-colors shadow-lg shadow-emerald-100 active:scale-95"
                            >
                              確認還原
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>


                <div className="bg-stone-50 border border-stone-200 p-6 rounded-[2rem] shadow-sm space-y-3">
                  <div className="flex items-center gap-3">
                    <RotateCcw size={20} className="text-stone-600" />
                    <h4 className="text-sm font-black text-stone-900">本機自動備份還原</h4>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed font-bold">
                    如果雲端同步發生錯誤，您可以嘗試還原到上一次啟動時的自動備份。
                  </p>
                  <button
                    onClick={onRestoreLocalBackup}
                    className="w-full bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                  >
                    <RefreshCw size={14} />
                    立即還原上次備份
                  </button>
                </div>

                {!isReadOnly && (
                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={onResetData}
                      className="flex items-center gap-2 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 px-4 py-2 rounded-xl transition-all"
                    >
                      <AlertTriangle size={14} />
                      清除所有本地快取
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="flex flex-col items-center justify-center py-20 space-y-6">
                <img src={user.picture} className="w-24 h-24 rounded-[2rem] border-4 border-stone-100 shadow-xl" alt="user" />
                <div className="text-center">
                  <h3 className="text-xl font-black text-stone-900">{user.name}</h3>
                  <p className="text-sm text-stone-500 font-bold">{user.email}</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${isReadOnly ? 'bg-stone-900 text-orange-400' : 'bg-stone-100 text-stone-500'}`}>
                  權限角色：{isReadOnly ? '訪客 (唯讀)' : user.role}
                </div>
              </div>
            )}

            {activeSection === 'modules' && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                <div className="flex items-center gap-5">
                  <div className="p-5 rounded-[2rem] bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                    <LayoutDashboard size={32} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-stone-900 uppercase tracking-tight">功能模組管理</h3>
                    <p className="text-sm text-stone-500 font-medium">為不同客戶設定所需功能</p>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-100 p-8 rounded-[2rem] space-y-4 text-center">
                  <div className="flex items-start gap-3 justify-center">
                    <Info className="text-orange-600 mt-1" size={18} />
                    <div className="space-y-2">
                      <p className="text-sm font-black text-orange-900">進階模組管理功能</p>
                      <p className="text-xs text-orange-700 leading-relaxed font-bold max-w-lg">
                        請前往側邊欄的「模組管理」查看完整的模組配置介面，您可以在那裡啟用/停用功能模組、管理依賴關係，以及匯入/匯出配置。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Selective Import Modal (Generalized) */}
      {
        pendingData && selectionCategory && (
          <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-12 animate-in fade-in">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="p-8 lg:p-10 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                <div>
                  <h2 className="text-2xl font-black text-stone-900 uppercase tracking-tight flex items-center gap-3">
                    <Database className="text-orange-500" /> 選擇要復原的{
                      selectionCategory === 'projects' ? '專案' :
                        selectionCategory === 'quotations' ? '報價單' :
                          selectionCategory === 'customers' ? '客戶' :
                            selectionCategory === 'vendors' ? '廠商' :
                              selectionCategory === 'teamMembers' ? '團隊成員' :
                                selectionCategory === 'inventory' ? '庫存項目' :
                                  selectionCategory === 'attendance' ? '考勤記錄' :
                                    selectionCategory === 'payroll' ? '薪資記錄' :
                                      selectionCategory === 'approvalRequests' ? '簽核申請' :
                                        selectionCategory === 'approvalTemplates' ? '簽核流程' :
                                          '項目'
                    }
                  </h2>
                  <p className="text-sm text-stone-500 font-bold mt-1">從備份檔中偵測到 {pendingData[selectionCategory].length} 個項目，請選取您要還原的項目。</p>
                </div>
                <button
                  onClick={() => { setPendingData(null); setSelectionCategory(null); }}
                  className="p-3 hover:bg-white rounded-2xl text-stone-400 hover:text-stone-900 transition-all active:scale-90"
                >
                  取消
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="flex flex-col gap-2">
                  {pendingData[selectionCategory]
                    .sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
                    .map((item: any) => {
                      const isSelected = selectedItemsMap[selectionCategory]?.has(item.id);
                      let displayText = item.name || item.title || item.header?.projectName || item.quotationNumber || item.id;
                      let subText = item.id;
                      let badge = '';

                      if (selectionCategory === 'quotations') {
                        displayText = `${item.header?.projectName || '未命名專案'} (${item.quotationNumber})`;
                        subText = item.header?.to || '未知客戶';
                      } else if (selectionCategory === 'projects') {
                        badge = item.source || 'SYSTEM';
                      }

                      return (
                        <label
                          key={item.id}
                          className={`flex items-center gap-4 px-5 py-3 rounded-xl border transition-all cursor-pointer group ${isSelected
                            ? 'border-orange-500 bg-orange-50 shadow-sm'
                            : 'border-stone-100 hover:border-stone-300 hover:bg-stone-50 bg-white'
                            }`}
                        >
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-stone-300 text-orange-600 focus:ring-orange-500 cursor-pointer shrink-0"
                            checked={isSelected}
                            onChange={() => {
                              const newMap = { ...selectedItemsMap };
                              const set = new Set(newMap[selectionCategory] || []);
                              if (set.has(item.id)) set.delete(item.id);
                              else set.add(item.id);
                              newMap[selectionCategory] = set;
                              setSelectedItemsMap(newMap);
                            }}
                          />
                          <div className="flex-1 flex flex-col md:flex-row md:items-center gap-2 md:gap-4 overflow-hidden">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <span className="text-[10px] font-black bg-stone-100 text-stone-600 px-2 py-1 rounded uppercase tracking-wider shrink-0 w-[120px] text-center font-mono truncate">
                                {item.id}
                              </span>
                              <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-orange-900' : 'text-stone-700'}`}>
                                {displayText}
                              </h4>
                              {item.deletedAt && (
                                <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded shrink-0">
                                  已刪除
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 text-xs font-medium text-stone-400 shrink-0 md:border-l md:border-stone-200 md:pl-4 min-w-[200px]">
                              {badge && <span className="hidden md:inline text-[10px] uppercase tracking-widest bg-stone-50 px-2 py-0.5 rounded text-stone-400">{badge}</span>}
                              {subText !== item.id && <span className="hidden md:inline text-[10px] text-stone-400 truncate max-w-[100px]">{subText}</span>}

                              <span className={`font-mono text-xs ${isSelected ? 'text-orange-700 font-bold' : 'text-stone-500'}`}>
                                {item.updatedAt ? new Date(item.updatedAt).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '無日期'}
                              </span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="p-8 lg:p-10 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      const newMap = { ...selectedItemsMap };
                      newMap[selectionCategory] = new Set(pendingData[selectionCategory].map((p: any) => p.id));
                      setSelectedItemsMap(newMap);
                    }}
                    className="text-xs font-black text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    全部勾選
                  </button>
                  <button
                    onClick={() => {
                      const newMap = { ...selectedItemsMap };
                      newMap[selectionCategory] = new Set();
                      setSelectedItemsMap(newMap);
                    }}
                    className="text-xs font-black text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    全部取消
                  </button>
                  <span className="text-xs text-stone-300">|</span>
                  <button
                    onClick={() => {
                      // Save current selection and close modal, returning to main restore dialog
                      setPendingData(null);
                      setSelectionCategory(null);
                    }}
                    className="text-xs font-black text-stone-500 hover:text-stone-900 transition-colors"
                  >
                    確認選擇
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right mr-4">
                    <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">目前選取</p>
                    <p className="text-lg font-black text-stone-900">{selectedItemsMap[selectionCategory]?.size || 0} 個項目</p>
                  </div>

                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default Settings;
