
import React, { useState, useEffect } from 'react';
import { HardHat, ShieldCheck, Sparkles, User, Lock, ArrowRight, Layers, Check, AlertCircle, Hash, Info, UserCheck, Cloud, Building2 } from 'lucide-react';
import { MOCK_DEPARTMENTS } from '../constants';
import { storageService } from '../services/storageService';
import { firestoreDb } from '../services/firestoreDb';
import { SystemContext } from '../types';

interface LoginProps {
  onLoginSuccess: (userData: any, department: SystemContext) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState<SystemContext>('FirstDept');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!employeeId || !password) {
      setError('請輸入員工編號與密碼');
      return;
    }

    setIsLoading(true);

    // 模擬驗證流程 (延遲一下增加儀式感)
    await new Promise(resolve => setTimeout(resolve, 800));

    const cleanId = employeeId.trim();
    const cleanPassword = password.trim();
    console.log('[Login Trace] cleanId:', cleanId);

    // 1. 檢查管理員
    if (cleanId.toLowerCase() === 'admin' && cleanPassword === '1234') {
      console.log('[Login Trace] Admin login success');
      onLoginSuccess({
        id: 'ADMIN-ROOT',
        name: "管理總監",
        email: "admin@lifequality.ai",
        picture: `https://ui-avatars.com/api/?name=Admin&background=ea580c&color=fff`,
        role: 'SuperAdmin',
        department: selectedDept,
        departmentId: selectedDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4'
      }, selectedDept);
      return;
    }

    if (cleanId.toLowerCase() === 'test' && cleanPassword === 'test') {
      console.log('[Login Trace] Test user login success');
      onLoginSuccess({
        id: 'SYNC-ONLY',
        name: "系統初始化員",
        email: "sync@lifequality.ai",
        picture: `https://ui-avatars.com/api/?name=Sync&background=0ea5e9&color=fff`,
        role: 'SyncOnly',
        department: selectedDept,
        departmentId: selectedDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4'
      }, selectedDept);
      return;
    }

    // 1.8 增加管理員後門 (確保 JK001 永不被鎖在外部)
    if (cleanId.toUpperCase() === 'JK001' && cleanPassword === '1234') {
      console.log('[Login Trace] Fallback JK001 login triggered');
      onLoginSuccess({
        id: 'JK001',
        name: "陳傑凱",
        email: "jie.kai@lifequality.ai",
        picture: "https://ui-avatars.com/api/?name=JK&background=0284c7&color=fff",
        role: 'DeptAdmin',
        roleName: '專案經理',
        department: selectedDept,
        departmentId: selectedDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4'
      }, selectedDept);
      return;
    }

    let team = [];
    const prefix = (selectedDept as string) === 'ThirdDept' ? 'dept3_' : (selectedDept as string) === 'FourthDept' ? 'dept4_' : '';
    const teamKey = `${prefix}bt_team`;

    try {
      console.log('[Login Trace] Fetching local team:', teamKey);
      team = await storageService.getItem<any[]>(teamKey, []);
      if (!Array.isArray(team)) team = [];
      console.log('[Login Trace] Local team found:', team?.length);
    } catch (e) {
      console.error('Error loading team during login', e);
      team = [];
    }

    let member = team.find((m: any) => m && m.employeeId === cleanId.toUpperCase());
    console.log('[Login Trace] Local member match:', member?.name || 'Not Found');

    if (!member) {
      try {
        console.log('[Login Trace] Local member not found, fetching team from Supabase...');
        const cloudTeam = await firestoreDb.getCollection<any>('teamMembers');
        console.log('[Login Trace] Supabase returning cloudTeam length:', cloudTeam?.length);
        if (cloudTeam && cloudTeam.length > 0) {
          const normalizedCloudTeam = cloudTeam.map(m => ({
            ...m,
            employeeId: m.employeeId || m.employee_id || m.id
          }));

          console.log('[Login Trace] Saving normalized cloud team to local storage...');
          await storageService.setItem(teamKey, normalizedCloudTeam);
          console.log('[Login Trace] Local storage updated.');

          const activeMembers = normalizedCloudTeam.filter((m: any) => m && m.employeeId && m.employeeId.toUpperCase() === cleanId.toUpperCase() && !m.deletedAt && !m.isPurged);
          activeMembers.sort((a: any, b: any) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
          member = activeMembers[0];
          console.log('[Login Trace] Found member from Cloud:', member?.name || 'Still not found');
        }
      } catch (err) {
        console.error('[Login Trace] Auto-fetch from Supabase failed:', err);
      }
    }

    console.log('[Login Trace] Final check. Member:', member?.name || 'Not Found');
    if (member) {
      const expectedPassword = member.password || '1234';
      if (cleanPassword === expectedPassword) {
        // 根據職稱給予預設權限
        let fallbackRole = 'Staff';
        const roleStr = member.role || '';
        if (/總經理|老闆|店長|主理人|總監|財務長|管理長/.test(roleStr)) {
          fallbackRole = 'Admin';
        } else if (/經理|副理|工務主管|主任|專案經理/.test(roleStr)) {
          fallbackRole = 'DeptAdmin';
        }

        const finalRole = member.systemRole || fallbackRole;
        console.log('[Login Trace] Authentication successful, calling onLoginSuccess. Role:', finalRole);
        onLoginSuccess({
          id: member.id,
          name: member.name,
          email: member.email,
          picture: member.avatar,
          role: finalRole,
          roleName: member.role,
          department: selectedDept,
          departmentId: member.departmentId || (selectedDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4')
        }, selectedDept);
      } else {
        console.log('[Login Trace] Wrong password');
        setError('密碼輸入錯誤');
        setIsLoading(false);
      }
    } else {
      console.log('[Login Trace] Employee ID not found globally');
      setError('找不到該員工編號');
      setIsLoading(false);
    }
  };

  /* LINE Login Integration */
  const [isLineReady, setIsLineReady] = useState(false);

  useEffect(() => {
    const initLine = async () => {
      try {
        const { lineService } = await import('../services/lineService');
        // Add a timeout to prevent hanging forever if LINE SDK is slow
        const timeoutPromise = new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 3000));
        const initPromise = lineService.init();

        const initialized = await Promise.race([initPromise, timeoutPromise]);

        setIsLineReady(!!initialized); // Ensure manual boolean conversion

        if (initialized && lineService.isLoggedIn()) {
          setIsLoading(true);
          const profile = await lineService.getProfile();
          if (profile) {
            console.log('LINE Profile:', profile);

            // Verify against all departments
            const departments: SystemContext[] = ['FirstDept', 'ThirdDept'];
            let foundMember = null;
            let foundDept: SystemContext = 'FirstDept';

            for (const dept of departments) {
              const prefix = dept === 'ThirdDept' ? 'dept3_' : '';
              const teamKey = `${prefix}bt_team`;
              const team = await storageService.getItem<any[]>(teamKey, []) || [];

              // Match by Email or Name (DisplayName)
              const match = team.find((m: any) =>
                (m.email && (profile as any).email && m.email.toLowerCase() === (profile as any).email.toLowerCase()) ||
                (m.name === profile.displayName) ||
                (profile.displayName && m.name && profile.displayName.includes(m.name)) ||
                (profile.displayName && m.name && m.name.includes(profile.displayName))
              );

              if (match) {
                foundMember = match;
                foundDept = dept;
                break;
              }
            }

            if (foundMember) {
              const finalRole = foundMember.systemRole || (foundMember.role === '工務主管' || foundMember.role === '專案經理' ? 'DeptAdmin' : 'Staff');
              onLoginSuccess({
                id: foundMember.id,
                name: foundMember.name,
                email: foundMember.email,
                picture: foundMember.avatar || profile.pictureUrl, // Use LINE picture if avatar missing
                role: finalRole,
                roleName: foundMember.role,
                department: foundDept,
                departmentId: foundMember.departmentId || (foundDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4')
              }, foundDept);
              return;
            } else {
              // Only show error if explicitly logged in via LINE, but for auto-login we might want to be silent or specific
              // For now, allow user to know why auto-login failed
              console.warn(`LINE Auto-login failed: User ${profile.displayName} not found`);
              // Don't block the UI, just stop loading
              setIsLoading(false);
            }
          }
        }
      } catch (e) {
        console.error('LINE Init Failed (Non-blocking):', e);
        setIsLineReady(false);
        setIsLoading(false);
      }
    };

    initLine();
  }, [onLoginSuccess]);

  const handleLineLoginAction = async () => {
    const { lineService } = await import('../services/lineService');
    const initialized = isLineReady || await lineService.init();

    if (!initialized) {
      alert('尚未設定 LINE LIFF ID。\n\n請聯絡管理員在系統設定 (.env.local) 中填入 VITE_LINE_LIFF_ID，才能啟用 LINE 登入功能。');
      return;
    }
    lineService.login();
  };

  const handleQuickAccess = () => {
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        id: 'GUEST-USER',
        name: "體驗帳戶",
        email: "guest@lifequality.ai",
        picture: `https://ui-avatars.com/api/?name=Guest&background=1e293b&color=fff`,
        role: 'Guest',
        department: selectedDept,
        departmentId: selectedDept === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4'
      }, selectedDept);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      {/* 動態背景裝飾 */}
      <div className={`absolute top-[-15%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse transition-colors duration-1000 ${selectedDept === 'FirstDept' ? 'bg-orange-600/10' : 'bg-blue-600/10'}`}></div>
      <div className={`absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full animate-pulse [animation-delay:2s] transition-colors duration-1000 ${selectedDept === 'FirstDept' ? 'bg-amber-600/10' : 'bg-cyan-600/10'}`}></div>

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-stone-900/40 backdrop-blur-3xl border border-white/10 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden">

        {/* 左側：品牌形象區 */}
        <div className={`hidden lg:flex lg:col-span-5 flex-col justify-between p-16 bg-gradient-to-br transition-all duration-1000 border-r border-white/5 relative ${selectedDept === 'FirstDept' ? 'from-stone-900 to-stone-950' : 'from-slate-900 to-slate-950'}`}>
          <div className="relative z-10">
            <div className="bg-white/10 w-16 h-16 rounded-3xl flex items-center justify-center border border-white/10 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] mb-10 group hover:scale-110 transition-transform duration-500 overflow-hidden">
              <img src="./pwa-icon.png" alt="Logo" className="w-10 h-10 object-contain" />
            </div>
            <h1 className="text-4xl font-black text-white leading-tight tracking-tighter mb-6">
              生活品質<br />
              <span className={`transition-colors duration-500 ${selectedDept === 'FirstDept' ? 'text-orange-500' : 'text-blue-500'}`}>工程管理系統</span>
            </h1>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8">
              <Sparkles size={14} className={selectedDept === 'FirstDept' ? 'text-amber-400' : 'text-cyan-400'} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400">2026 Professional Edition</span>
            </div>
            <div className="space-y-4">
              <div onClick={() => setSelectedDept('FirstDept')} className={`cursor-pointer p-4 rounded-2xl border transition-all ${selectedDept === 'FirstDept' ? 'bg-orange-500/20 border-orange-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">生活品質<br />第一工程部</span>
                  {selectedDept === 'FirstDept' && <Check size={16} className="text-orange-500" />}
                </div>
                <p className="text-xs text-stone-400">住宅修繕、防水工程、空間改造</p>
              </div>
              <div onClick={() => setSelectedDept('ThirdDept')} className={`cursor-pointer p-4 rounded-2xl border transition-all ${selectedDept === 'ThirdDept' ? 'bg-blue-500/20 border-blue-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-white">傑凱工程<br />第三工程部</span>
                  {selectedDept === 'ThirdDept' && <Check size={16} className="text-blue-500" />}
                </div>
                <p className="text-xs text-stone-400">大型建案、公設維護、機電整合</p>
              </div>
            </div>
          </div>
        </div>

        {/* 右側：登錄操作區 */}
        <div className="lg:col-span-7 p-8 lg:p-20 flex flex-col justify-center">
          <form onSubmit={handleLogin} className="space-y-8 max-w-md mx-auto w-full">
            <div className="text-center lg:text-left space-y-2">
              <h1 className="text-3xl font-black text-stone-900 tracking-tight">Quality of Life</h1>
              <p className="text-stone-500 font-bold uppercase tracking-widest text-xs mt-2">
                Login to <span className={selectedDept === 'FirstDept' ? 'text-orange-600' : 'text-blue-600'}>
                  {selectedDept === 'FirstDept' ? 'First Dept.' : 'Third Dept.'}
                </span>
              </p>

              {/* Mobile Selector */}
              <div className="lg:hidden flex gap-2 mt-4 p-1 bg-stone-100 rounded-xl">
                <button type="button" onClick={() => setSelectedDept('FirstDept')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${selectedDept === 'FirstDept' ? 'bg-white shadow text-orange-600' : 'text-stone-400'}`}>生活品質<br />第一工程部</button>
                <button type="button" onClick={() => setSelectedDept('ThirdDept')} className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${selectedDept === 'ThirdDept' ? 'bg-white shadow text-blue-600' : 'text-stone-400'}`}>傑凱工程<br />第三工程部</button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-rose-200 text-xs font-bold">{error}</p>
              </div>
            )}

            {/* 帳號密碼 */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-stone-500 text-[10px] font-black uppercase tracking-[0.25em] pl-1 flex items-center gap-2">
                  <Hash size={14} className={selectedDept === 'FirstDept' ? 'text-orange-500' : 'text-blue-500'} /> 員工編號 Employee ID
                </label>
                <div className="group relative">
                  <input
                    type="text"
                    placeholder="輸入員工編號"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-opacity-50 transition-all placeholder:text-stone-700 uppercase"
                    style={{ '--tw-ring-color': selectedDept === 'FirstDept' ? 'rgb(234 88 12)' : 'rgb(37 99 235)' } as any}
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-stone-500 text-[10px] font-black uppercase tracking-[0.25em] pl-1 flex items-center gap-2">
                  <Lock size={14} className={selectedDept === 'FirstDept' ? 'text-orange-500' : 'text-blue-500'} /> 登入密碼 Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-bold outline-none focus:ring-2 focus:ring-opacity-50 transition-all placeholder:text-stone-700"
                  style={{ '--tw-ring-color': selectedDept === 'FirstDept' ? 'rgb(234 88 12)' : 'rgb(37 99 235)' } as any}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-[0.2em] uppercase transition-all shadow-2xl active:scale-[0.98] ${isLoading
                  ? 'bg-stone-800 text-stone-600 cursor-not-allowed'
                  : selectedDept === 'FirstDept'
                    ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-900/20'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    驗證中
                  </>
                ) : (
                  <>
                    進入系統
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLineLoginAction}
                disabled={isLoading}
                className="w-full py-5 bg-[#06C755] hover:bg-[#05b34c] text-white rounded-2xl flex items-center justify-center gap-3 font-black text-sm tracking-[0.2em] uppercase transition-all shadow-xl shadow-[#06c755]/20 active:scale-[0.98]"
              >
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/LINE_logo.svg" className="w-6 h-6" alt="LINE" />
                LINE 快速登入
              </button>

              <button
                type="button"
                onClick={handleQuickAccess}
                disabled={isLoading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-black text-[11px] uppercase tracking-[0.3em] text-stone-500 hover:text-white border border-white/5 hover:border-white/10 hover:bg-white/5 transition-all duration-300"
              >
                <Sparkles size={14} className="text-amber-500" />
                訪客模式預覽 (唯讀)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
