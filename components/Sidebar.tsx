
import React, { useEffect, useState } from 'react';
import { LayoutDashboard, FolderKanban, Users, BarChart3, Settings, HelpCircle, HardHat, Contact2, ClipboardSignature, X, ShoppingBag, Sparkles, Clock, Wallet, FileCheck, FileText, CalendarClock, Building, ListTodo } from 'lucide-react';
import { moduleService } from '../services/moduleService';
import { ModuleId, DEFAULT_ENABLED_MODULES } from '../moduleConfig';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onMenuClose?: () => void;
  isSyncing?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onMenuClose, isSyncing }) => {
  const [enabledModules, setEnabledModules] = useState<ModuleId[]>([]);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [prevSyncing, setPrevSyncing] = useState(false);

  useEffect(() => {
    // Load initial modules
    setEnabledModules(moduleService.getEnabledModules());

    // Listen for module changes
    const unsubscribe = moduleService.onChange((modules) => {
      setEnabledModules(modules);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (prevSyncing && !isSyncing) {
      setSyncSuccess(true);
      const timer = setTimeout(() => setSyncSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevSyncing(!!isSyncing);
  }, [isSyncing, prevSyncing]);

  // Map tab IDs to module IDs
  const tabToModuleMap: Record<string, ModuleId> = {
    'dashboard': ModuleId.DASHBOARD,
    'calendar': ModuleId.CALENDAR,
    'projects': ModuleId.PROJECTS,
    'dispatch': ModuleId.DISPATCH,
    'quotations': ModuleId.QUOTATIONS,
    'customers': ModuleId.CUSTOMERS,
    'team': ModuleId.TEAM,
    'vendors': ModuleId.VENDORS,
    'inventory': ModuleId.INVENTORY,
    'attendance': ModuleId.ATTENDANCE,
    'payroll': ModuleId.PAYROLL,
    'approvals': ModuleId.APPROVALS,
    'analytics': ModuleId.ANALYTICS,
    'company_mgmt': ModuleId.COMPANY_MGMT,
    'todos': ModuleId.TODOS,
  };

  const allMenuItems = [
    { id: 'dashboard', label: '總覽面板', icon: LayoutDashboard, moduleId: ModuleId.DASHBOARD },
    { id: 'calendar', label: '行事曆', icon: CalendarClock, moduleId: ModuleId.CALENDAR },
    { id: 'projects', label: '專案管理', icon: FolderKanban, moduleId: ModuleId.PROJECTS },
    { id: 'dispatch', label: '派工紀錄', icon: ClipboardSignature, moduleId: ModuleId.DISPATCH },
    { id: 'quotations', label: '報價系統', icon: FileText, moduleId: ModuleId.QUOTATIONS },
    { id: 'customers', label: '客戶資料', icon: Contact2, moduleId: ModuleId.CUSTOMERS },
    { id: 'team', label: '團隊成員', icon: Users, moduleId: ModuleId.TEAM },
    { id: 'vendors', label: '廠商管理', icon: ShoppingBag, moduleId: ModuleId.VENDORS },
    { id: 'inventory', label: '庫存管理', icon: ShoppingBag, moduleId: ModuleId.INVENTORY },
    { id: 'attendance', label: '考勤打卡', icon: Clock, moduleId: ModuleId.ATTENDANCE },
    { id: 'payroll', label: '薪資管理', icon: Wallet, moduleId: ModuleId.PAYROLL },
    { id: 'approvals', label: '簽核系統', icon: FileCheck, moduleId: ModuleId.APPROVALS },
    { id: 'analytics', label: '數據分析', icon: BarChart3, moduleId: ModuleId.ANALYTICS },
    { id: 'company_mgmt', label: '公司管理', icon: Building, moduleId: ModuleId.COMPANY_MGMT },
    { id: 'todos', label: '個人待辦', icon: ListTodo, moduleId: ModuleId.TODOS },
  ];

  // Filter menu items based on enabled modules AND user permissions
  const menuItems = allMenuItems.filter(item => {
    // 1. Check valid/enabled globally
    if (!enabledModules.includes(item.moduleId)) return false;

    // 2. Check user role/permissions
    // CRITICAL: We now check accessibleModules even for SuperAdmin if they have explicit settings in App.tsx
    const userModules = user.accessibleModules || DEFAULT_ENABLED_MODULES;
    return userModules.includes(item.moduleId);
  });

  const bottomItems = [
    { id: 'settings', label: '設定', icon: Settings },
    { id: 'help', label: '協助中心', icon: HelpCircle },
  ];

  // Add Module Manager for SuperAdmin
  if (user.role === 'SuperAdmin') {
    bottomItems.unshift({ id: 'modules', label: '模組管理', icon: Sparkles });
  }

  return (
    <aside className="h-full w-full bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white flex flex-col shadow-2xl relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(249,115,22,0.08),transparent_70%)] pointer-events-none"></div>

      <div className="relative p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="./pwa-icon.png" alt="Logo" className="w-10 h-10 object-contain relative z-10" />
              <div className="absolute inset-0 bg-orange-500/20 rounded-xl blur-lg"></div>
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-black tracking-tight leading-none text-orange-400 uppercase">Quality of Life</span>
              <span className="text-[10px] font-bold text-stone-500">Development Corp.</span>
            </div>
          </div>
        </div>
        {onMenuClose && (
          <button
            onClick={onMenuClose}
            className="lg:hidden p-2 text-stone-500 hover:text-white hover:bg-stone-800 rounded-xl transition-all"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar relative">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${activeTab === item.id
              ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg shadow-orange-900/40'
              : 'text-stone-400 hover:bg-stone-800/80 hover:text-white'
              }`}
          >
            {activeTab === item.id && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-300 rounded-r-full shadow-lg shadow-orange-400/50"></div>
            )}
            <item.icon size={18} className={`transition-transform duration-300 ${activeTab !== item.id ? 'group-hover:scale-110 group-hover:-rotate-6' : ''}`} />
            <span className="font-bold text-xs">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-stone-800/50 shrink-0 bg-stone-950/50 backdrop-blur-sm relative">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-stone-500 hover:bg-stone-800/50 hover:text-white transition-all duration-300 group ${activeTab === item.id ? 'text-white bg-stone-800/30' : ''}`}
          >
            <item.icon size={18} className="group-hover:scale-110 transition-transform duration-300" />
            <span className="font-bold text-xs">{item.label}</span>
          </button>
        ))}

        {/* Manual Sync Button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('TRIGGER_CLOUD_SYNC'))}
          disabled={isSyncing}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-stone-500 hover:bg-stone-800 hover:text-white transition-colors group ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="立即同步 (Sync Now)"
        >
          <div className="relative">
            {/* @ts-ignore */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`lucide lucide-refresh-cw transition-transform duration-500 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'}`}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M3 21v-5h5" /></svg>
          </div>
          <span className="font-bold text-xs">{isSyncing ? '同步中...' : syncSuccess ? '同步完成' : '立即同步'}</span>
          {syncSuccess && (
            <div className="absolute right-4 animate-in zoom-in fade-in duration-300">
              <div className="bg-emerald-500 p-1 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check"><path d="M20 6 9 17l-5-5" /></svg>
              </div>
            </div>
          )}
        </button>



        <div className="mt-4 px-4 py-3 bg-gradient-to-r from-stone-800/50 to-stone-800/30 border border-white/5 rounded-2xl flex items-center gap-3 hover:border-orange-500/20 transition-all duration-500 group/profile">
          <div className="relative">
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`}
              alt="Avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=random`;
              }}
              className="w-9 h-9 rounded-xl border-2 border-orange-500/30 object-cover group-hover/profile:border-orange-500/60 transition-all duration-500"
            />
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-stone-900"></div>
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-black truncate group-hover/profile:text-orange-300 transition-colors duration-300">{user.name}</p>
            <div className="flex flex-col">
              <span className="text-[9px] text-stone-500 font-black uppercase tracking-widest truncate">{user.role}</span>
              <span className="text-[8px] text-stone-600 font-mono mt-0.5">
                Mods: {(user.accessibleModules || []).length} / {allMenuItems.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
