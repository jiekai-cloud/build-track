import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import DispatchManager from './components/DispatchManager';
import CustomerList from './components/CustomerList';
import TeamList from './components/TeamList';
import Analytics from './components/Analytics';
import Settings from './components/Settings';
import HelpCenter from './components/HelpCenter';
import AIAssistant from './components/AIAssistant';
import ProjectModal from './components/ProjectModal';
import ProjectDetail from './components/ProjectDetail';
import CustomerModal from './components/CustomerModal';
import TeamModal from './components/TeamModal';
import VendorModal from './components/VendorModal';
import InventoryModal from './components/InventoryModal';
import InventoryList from './components/InventoryList';
import LocationManagerModal from './components/LocationManagerModal';
import TransferModal from './components/TransferModal';
import ScanTransferModal from './components/ScanTransferModal';

import Login from './components/Login';
import OrderManagerModal from './components/OrderManagerModal';
import AttendanceSystem from './components/AttendanceSystem';
import PayrollSystem from './components/PayrollSystem';
import ApprovalSystem from './components/ApprovalSystem';
import QuotationSystem from './components/QuotationSystem';
import CompanyManagement from './components/CompanyManagement';
import ModuleManager from './components/ModuleManager';
import OnboardingTour from './components/OnboardingTour';
import { CalendarView } from './components/CalendarView';
import TodoList from './components/TodoList';





import { Menu, LogOut, Layers, Cloud, CloudOff, RefreshCw, AlertCircle, CheckCircle, ShieldCheck, Database, Zap, Sparkles, Globe, Activity, ShieldAlert, Bell, User as LucideUser, Trash2, ShoppingBag, Receipt, Pencil, X, ExternalLink, Download, Phone } from 'lucide-react';
import NotificationPanel from './components/NotificationPanel';
import { MOCK_PROJECTS, MOCK_DEPARTMENTS, MOCK_TEAM_MEMBERS } from './constants';
import { Project, ProjectStatus, Customer, TeamMember, User, SystemContext, ProjectComment, ActivityLog, Vendor, ChecklistTask, PaymentStage, DailyLogEntry, Lead, InventoryItem, InventoryCategory, InventoryLocation, InventoryTransaction, PurchaseOrder, AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate, Quotation } from './types';
import { moduleService } from './services/moduleService';
import { ModuleId, DEFAULT_ENABLED_MODULES, ALL_MODULES } from './moduleConfig';
import { storageService } from './services/storageService';
import { useAppData } from './hooks/useAppData';
import { useCloudSync } from './hooks/useCloudSync';
import { useEntityHandlers } from './hooks/useEntityHandlers';
import { useSystemStartup } from './hooks/useSystemStartup';

// Build Trigger: 2026-01-05 Module System Integration
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [viewingDeptId, setViewingDeptId] = useState<string>('all');
  const [currentDept, setCurrentDept] = useState<SystemContext>('FirstDept');
  const [isInitializing, setIsInitializing] = useState(true);

  // ============ 使用 useAppData Hook 集中管理實體資料 ============
  // 傳入 currentDept 與 enableAutoSave=true (當初始化完成後)
  const appData = useAppData(currentDept, !isInitializing);
  const {
    projects, setProjects,
    customers, setCustomers,
    teamMembers, setTeamMembers,
    activityLogs, setActivityLogs,
    vendors, setVendors,
    leads, setLeads,
    inventoryItems, setInventoryItems,
    inventoryLocations, setInventoryLocations,
    purchaseOrders, setPurchaseOrders,
    attendanceRecords, setAttendanceRecords,
    payrollRecords, setPayrollRecords,
    approvalRequests, setApprovalRequests,
    approvalTemplates, setApprovalTemplates,
    quotations, setQuotations,
    calendarEvents, setCalendarEvents,
    mergeData, normalizeProjects, updateStateWithMerge,
    addActivityLog: _addActivityLog,
    clearAllData, saveToIndexedDB, dataRef,
    lastSaved, // Get lastSaved from appData
  } = appData;

  // 包裝 addActivityLog 以自動傳入 user
  const addActivityLog = useCallback((action: string, targetName: string, targetId: string, type: ActivityLog['type']) => {
    _addActivityLog(action, targetName, targetId, type, user);
  }, [_addActivityLog, user]);


  // Calculate permissions dynamically
  // Calculate permissions dynamically
  const currentUserPermissions = useMemo(() => {
    if (!user) return [];

    // Strict Match: ID -> Email -> Name
    const member = teamMembers.find(m =>
      m.employeeId.toLowerCase() === user.id.toLowerCase() ||
      (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
      (m.name && user.name && m.name.toLowerCase() === user.name.toLowerCase())
    );

    // If we found a member and they have specific modules configured (even empty array), use it
    if (member && Array.isArray(member.accessibleModules)) {
      // 確保所有核心模組 (含 Dashboard, Calendar, Settings) 必定能被存取
      const coreModuleIds = ALL_MODULES.filter(m => m.isCore).map(m => m.id);
      return Array.from(new Set([...member.accessibleModules, ...coreModuleIds]));
    }

    // Default Fallback
    return DEFAULT_ENABLED_MODULES;
  }, [user, teamMembers]);

  // Leads 初始化已移至 useAppData

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // inventoryLocations 已移至 useAppData
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isLocationManagerOpen, setIsLocationManagerOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isOrderManagerOpen, setIsOrderManagerOpen] = useState(false);
  const [transferItem, setTransferItem] = useState<InventoryItem | null>(null);
  const [editingInventoryItem, setEditingInventoryItem] = useState<InventoryItem | null>(null);

  // 雲端狀態由 useCloudSync 管理 (isCloudConnected, isSyncing, cloudError, lastCloudSync)


  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [aiApiKey, setAiApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [quotationSystemParams, setQuotationSystemParams] = useState<{ projectId?: string; quotationId?: string } | null>(null);
  const [isMasterTab, setIsMasterTab] = useState(false);
  const tabId = useMemo(() => Math.random().toString(36).substring(7), []);

  // Elect Master Tab to handle sync and prevent conflicts
  // BroadcastChannel-based Leader Election
  useEffect(() => {
    const channel = new BroadcastChannel('LEADER_ELECTION');
    let heartbeatInterval: NodeJS.Timeout | null = null;
    let isLeader = false;
    let lastHeartbeat = Date.now();

    // Sends a heartbeat if we are the leader
    const sendHeartbeat = () => {
      channel.postMessage({ type: 'HEARTBEAT', id: tabId });
    };

    // Main election loop: Check if we should become leader
    const checkLeaderStatus = () => {
      const now = Date.now();
      // If we are NOT leader, but haven't heard from one in 1.5s, take over
      if (!isLeader && (now - lastHeartbeat > 1500)) {
        console.log(`[System] No heartbeat detected (last: ${now - lastHeartbeat}ms). Electing self as Master.`);
        isLeader = true;
        setIsMasterTab(true);

        // Start sending heartbeats immediately
        sendHeartbeat();
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        heartbeatInterval = setInterval(sendHeartbeat, 500);
      }
    };

    const electionLoop = setInterval(checkLeaderStatus, 500);

    channel.onmessage = (event) => {
      if (event.data?.type === 'HEARTBEAT') {
        const otherId = event.data.id;

        // Update last heartbeat time regardless of who sent it (as long as it's not us, though BroadcastChannel doesn't echo to self usually)
        if (otherId !== tabId) {
          lastHeartbeat = Date.now();

          // Conflict Resolution: If we thought we were leader, but someone else is also sending heartbeats
          if (isLeader) {
            // Tie-breaker: Compare IDs. Lexicographically higher ID wins.
            if (otherId > tabId) {
              console.log('[System] Conflict detected. Stepping down as Master (Other ID > My ID).');
              isLeader = false;
              setIsMasterTab(false);
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
            } else {
              // We win, ignore them (they should step down)
              // console.log('[System] Conflict detected. Staying Leader (My ID > Other ID).');
            }
          }
        }
      } else if (event.data?.type === 'SYNC_NOTIFY') {
        // When Master Tab finishes sync, notify others to reload from IndexedDB/State if needed
        // Currently, useAppData handles IndexedDB reload automatically on focus or init,
        // but we could force a refresh here if needed.
        console.log('[System] Received SYNC_NOTIFY from Master Tab.');
      }
    };

    // Initial check (random delay to reduce boot-up collisions)
    setTimeout(checkLeaderStatus, Math.random() * 500);

    return () => {
      console.log('[System] Tab closing/unmounting. Cleaning up Leader Election.');
      clearInterval(electionLoop);
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      channel.close();
    };
  }, [tabId]);

  const saveAiApiKey = () => {
    localStorage.setItem('GEMINI_API_KEY', aiApiKey);
    setIsAISettingsOpen(false);
    alert('AI 金鑰已儲存，服務將在下次解析時生效。');
    window.location.reload();
  };

  // Trigger Onboarding for new users or upon login
  useEffect(() => {
    if (user && !isInitializing) {
      const hasCompleted = localStorage.getItem('bt_onboarding_completed') === 'true';
      if (!hasCompleted) {
        // Delay a bit to let the dashboard render
        const timer = setTimeout(() => setIsOnboardingOpen(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [user, isInitializing]);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    localStorage.setItem('bt_onboarding_completed', 'true');
  };

  // Sync User Session with Team Data (Auto-update role/info if changed in TeamModal)
  useEffect(() => {
    if (user && teamMembers.length > 0) {
      // Robust matching: ID, EmployeeID, Email or Name
      const me = teamMembers.find(m =>
        m.id === user.id ||
        (m.employeeId && m.employeeId.toLowerCase() === user.id.toLowerCase()) ||
        (m.email && user.email && m.email.toLowerCase() === user.email.toLowerCase()) ||
        m.name === user.name
      );
      if (me) {
        // Also sync accessibleModules to user session for immediate UI update
        const userModules = user.accessibleModules || [];
        const memberModules = me.accessibleModules || [];

        // Compare modules array equality simply by joining sorted strings
        const modulesChanged = [...userModules].sort().join(',') !== [...memberModules].sort().join(',');

        // Only use team member avatar if it exists
        const targetAvatar = me.avatar || user.picture;

        const needsUpdate = me.systemRole !== user.role || me.name !== user.name || targetAvatar !== user.picture || modulesChanged;

        if (needsUpdate) {
          console.log('[Session] Auto-updating user session from team data...');
          setUser(prev => {
            if (!prev) return null;
            const updatedUser = {
              ...prev,
              role: me.systemRole,
              name: me.name,
              picture: targetAvatar, // Critical: Sync avatar
              accessibleModules: me.accessibleModules // Critical: Sync modules
            };

            // Persist the updated user state back to localStorage to prevent fallback to stale avatars on refresh
            try {
              localStorage.setItem('bt_user', JSON.stringify(updatedUser));
            } catch (e) {
              console.warn('[Session] Could not persist updated user info:', e);
            }

            return updatedUser;
          });
        }
      }
    }
  }, [teamMembers, user?.id, user?.role, user?.name, user?.picture, user?.accessibleModules]);


  // cloud refs 已移至 useCloudSync

  const handleLogout = useCallback((forced = false) => {
    if (forced || confirm('確定要安全登出生產系統嗎？')) {
      setUser(null);
      localStorage.removeItem('bt_user');
      clearAllData();
      setActiveTab('dashboard');
      console.log('[System] Logout complete, memory cleared.');
    }
  }, [clearAllData]);

  // ============ 使用 useEntityHandlers Hook 集中管理實體 CRUD ============
  const {
    handleClockRecord, handleImportRecords, handleImportLeaves,
    handleSaveApprovalRequest, handleSaveApprovalTemplate,
    handleDeleteApprovalTemplate, handleApprovalAction,
    handleUpdateStatus, handleAddComment, handleAddDailyLog,
    handleUpdateChecklist, handleUpdatePayments,
    handleMarkLogAsRead, handleMarkAllLogsAsRead,
    handleConvertLead, handleAddTestProject, handleSaveProject,
  } = useEntityHandlers({
    user, setProjects, setCustomers, setTeamMembers, setActivityLogs,
    setVendors, setLeads, setInventoryItems, setInventoryLocations,
    setPurchaseOrders, setAttendanceRecords, setApprovalRequests,
    setApprovalTemplates, setQuotations,
    projects, leads, approvalTemplates, inventoryLocations, purchaseOrders,
    inventoryItems, activityLogs, quotations,
    addActivityLog, viewingDeptId, setActiveTab, setSelectedProjectId,
    setQuotationSystemParams,
  });

  // ============ 使用 useCloudSync Hook 集中管理雲端同步 ============
  const {
    isCloudConnected, setIsCloudConnected,
    isSyncing, setIsSyncing,
    syncProgress, syncMessage,
    cloudError, setCloudError,
    lastCloudSync, setLastCloudSync,
    lastRemoteModifiedTime, isSyncingRef,
    autoConnectCloud, handleCloudSync,
    handleConnectCloud, handleCloudRestore,
    scheduleSyncIfNeeded,
  } = useCloudSync({
    updateStateWithMerge, normalizeProjects, dataRef,
    setProjects, setCustomers, setTeamMembers, setActivityLogs,
    setVendors, setInventoryItems, setInventoryLocations,
    setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
    setApprovalRequests, setApprovalTemplates, setQuotations,
    handleLogout, user,
  });

  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  // ============ 使用 useSystemStartup Hook 管理啟動與載入 ============
  const { loadSystemData } = useSystemStartup({
    normalizeProjects, autoConnectCloud,
    setProjects, setCustomers, setTeamMembers, setVendors, setLeads,
    setActivityLogs, setInventoryItems, setInventoryLocations,
    setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
    setApprovalRequests, setApprovalTemplates, setQuotations, setCalendarEvents,
    setInitialSyncDone, setIsInitializing, setIsFirstTimeUser,
    setUser, setCurrentDept, setViewingDeptId,
  });

  // handleClockRecord ~ handleApprovalAction 已移至 useEntityHandlers

  // Auto-redirect to Attendance page on login
  const hasRedirectedRef = React.useRef(false);
  useEffect(() => {
    if (user && !isInitializing && !hasRedirectedRef.current) {
      if (currentUserPermissions.includes(ModuleId.ATTENDANCE)) {
        setActiveTab('attendance');
        hasRedirectedRef.current = true;
      }
    }
    if (!user) {
      hasRedirectedRef.current = false;
    }
  }, [user, isInitializing, currentUserPermissions]);

  // Sync / Restore 事件 Listeners & Proactive Sync
  useEffect(() => {
    const onManualSync = () => handleCloudSync();
    const onManualRestore = () => handleCloudRestore();

    // Proactive sync when user returns to tab
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Sync] Tab visible, checking for remote changes...');
        scheduleSyncIfNeeded(isMasterTab);
      }
    };

    window.addEventListener('TRIGGER_CLOUD_SYNC', onManualSync);
    window.addEventListener('TRIGGER_CLOUD_RESTORE', onManualRestore);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    return () => {
      window.removeEventListener('TRIGGER_CLOUD_SYNC', onManualSync);
      window.removeEventListener('TRIGGER_CLOUD_RESTORE', onManualRestore);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onVisibilityChange);
    };
  }, [handleCloudSync, handleCloudRestore, isMasterTab, scheduleSyncIfNeeded]);

  // Auto-sync when local data changes OR heartbeat (Frequent Sync)
  useEffect(() => {
    if (lastSaved !== '' && !isInitializing) {
      scheduleSyncIfNeeded(isMasterTab);
    }

    // 定時強制檢查雲端 (每 2 分鐘，如果沒存檔也會檢查)
    if (isMasterTab && !isInitializing) {
      const timer = setInterval(() => {
        console.log('[Sync] Master rotation check...');
        scheduleSyncIfNeeded(true);
      }, 120000);
      return () => clearInterval(timer);
    }
  }, [lastSaved, isInitializing, isMasterTab, scheduleSyncIfNeeded]);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const [showDeleted, setShowDeleted] = useState(false);

  const filteredData = useMemo(() => {
    const filterByDept = (item: any) => {
      // 永久刪除的項目在所有視圖中完全隱藏
      if (item.isPurged) return false;
      // 過濾已被軟刪除的項目 (除非開啟查看垃圾桶)
      if (item.deletedAt && !showDeleted) return false;

      if (viewingDeptId === 'all') return true;
      // 支援多部門過濾
      if (item.departmentIds && Array.isArray(item.departmentIds) && item.departmentIds.length > 0) {
        return item.departmentIds.includes(viewingDeptId);
      }
      return item.departmentId === viewingDeptId;
    };
    const filterTeamMembers = (item: any) => {
      if (item.isPurged) return false;
      if (item.deletedAt && !showDeleted) return false;

      if (viewingDeptId === 'all') return true;

      const itemDepts = item.departmentIds && Array.isArray(item.departmentIds) && item.departmentIds.length > 0
        ? item.departmentIds
        : [item.departmentId];

      // 1. 基本規則：部門相符
      if (itemDepts.includes(viewingDeptId)) return true;

      // 2. 特殊規則：戰略指揮部 (DEPT-1) 的成員可以在第一/第三/第四工程部出現
      if (itemDepts.includes('DEPT-1') && (viewingDeptId === 'DEPT-4' || viewingDeptId === 'DEPT-8')) {
        return true;
      }

      return false;
    };

    return {
      projects: projects.filter(filterByDept),
      customers: customers.filter(filterByDept),
      teamMembers: teamMembers.filter(filterTeamMembers), // 使用特殊過濾邏輯
      vendors: vendors.filter(filterByDept),
      quotations: quotations.filter(filterByDept)
    };
  }, [projects, customers, teamMembers, vendors, quotations, viewingDeptId, showDeleted]);

  if (isInitializing) {
    return <LoadingScreen onSkip={() => setIsInitializing(false)} />;
  }

  if (!user) return <Login onLoginSuccess={(u, d) => {
    // 檢查是否為初次使用者 (根據是否有舊的 user 紀錄)
    const storedUser = localStorage.getItem('bt_user');
    if (!storedUser) {
      setIsFirstTimeUser(true);
    }

    setIsInitializing(true); // Show loading screen immediately
    const fullUser: User = { ...u, department: d };
    setUser(fullUser);
    setCurrentDept(d);
    // 修正部門 ID 對應：第一工程部(DEPT-4), 第三工程部(DEPT-8)
    const dId = u.role === 'SuperAdmin' ? 'all' : (u.departmentId || (d === 'ThirdDept' ? 'DEPT-8' : 'DEPT-4'));
    setViewingDeptId(dId);

    try {
      localStorage.setItem('bt_user', JSON.stringify(fullUser));
    } catch (e) {
      console.warn('[System] LocalStorage is full, user session not persisted.', e);
      // If full, try to clear some non-critical logs to make space
      try {
        localStorage.removeItem('bt_logs');
        localStorage.removeItem('dept3_bt_logs');
      } catch (innerE) { }
    }

    // Data loading happens in background but UI is blocked by isInitializing
    loadSystemData(d);
  }} />;

  return (
    <div className="flex h-screen w-screen bg-[#fafaf9] overflow-hidden print:overflow-visible print:h-auto print:block">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static transition-transform duration-500 z-[101] w-64 h-full shrink-0 print:hidden`}>
        <Sidebar activeTab={activeTab} setActiveTab={(t) => { setActiveTab(t); setSelectedProjectId(null); setIsSidebarOpen(false); }} user={{ ...user, accessibleModules: currentUserPermissions }} onMenuClose={() => setIsSidebarOpen(false)} isSyncing={isSyncing} />
      </div>

      {/* Center Sync Notification Overlay */}
      {isSyncing && !isInitializing && (
        <div className="fixed inset-0 z-[150] bg-stone-900/40 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="bg-stone-900/95 border border-stone-800 p-8 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)] flex flex-col items-center gap-6 max-w-[280px] w-full mx-4 text-center">
            <div className="relative mt-2">
              <div className="absolute inset-[-6px] border-[3px] border-orange-500/30 rounded-full animate-ping"></div>
              <div className="w-[64px] h-[64px] border-[4px] border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <Cloud className="absolute inset-0 m-auto text-orange-400 animate-pulse" size={24} />
            </div>
            <div className="mb-2">
              <h3 className="text-[15px] font-black text-white mb-2 tracking-widest leading-none">正在與雲端同步</h3>
              <p className="text-stone-400 text-[11px] font-bold">
                {syncMessage ? syncMessage : 'Please wait while data is syncing...'}
              </p>

              {/* Progress Bar Container */}
              <div className="mt-4 w-full h-1.5 bg-stone-800 rounded-full overflow-hidden relative">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <div className="text-right text-[10px] text-stone-500 font-bold mt-1 tracking-wider">
                {syncProgress}%
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col h-full w-full min-0 relative print:h-auto print:overflow-visible print:block">
        <Header
          user={user}
          isSidebarOpen={isSidebarOpen}
          onMenuClick={() => setIsSidebarOpen(true)}
          cloudError={cloudError}
          isCloudConnected={isCloudConnected}
          isSyncing={isSyncing}
          onConnectCloud={handleConnectCloud}
          onNotificationClick={() => setIsNotificationOpen(true)}
          activityLogsLength={activityLogs.length}
          onAISettingsClick={() => setIsAISettingsOpen(true)}
          viewingDeptId={viewingDeptId}
          onViewingDeptChange={setViewingDeptId}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto touch-scroll">
          {selectedProject ? (
            <ProjectDetail
              project={selectedProject} user={user} teamMembers={teamMembers}
              onBack={() => setSelectedProjectId(null)}
              onEdit={(p) => { setEditingProject(p); setIsModalOpen(true); }}
              onDelete={(id) => {
                if (confirm('確定要刪除嗎？')) {
                  // Soft Delete: 標記刪除而非移除
                  setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : p));
                  setSelectedProjectId(null);
                }
              }}
              onUpdateStatus={(status) => handleUpdateStatus(selectedProject.id, status)}
              onAddComment={(text) => handleAddComment(selectedProject.id, text)}
              onDeleteComment={(commentId) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, comments: p.comments?.filter(c => c.id !== commentId), updatedAt: new Date().toISOString() } : p))}
              onUpdateFiles={(files) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, files, updatedAt: new Date().toISOString() } : p))}
              onUpdatePhases={(phases) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, phases, updatedAt: new Date().toISOString() } : p))}
              onUpdateEvents={(events) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, events, updatedAt: new Date().toISOString() } : p))}
              onAddDailyLog={(log) => handleAddDailyLog(selectedProjectId, log)}
              onDeleteDailyLog={(logId) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, dailyLogs: p.dailyLogs?.filter(l => l.id !== logId), updatedAt: new Date().toISOString() } : p))}
              onUpdateChecklist={(checklist) => handleUpdateChecklist(selectedProjectId, checklist)}
              onUpdatePayments={(payments) => handleUpdatePayments(selectedProjectId, payments)}
              onUpdateTasks={(tasks) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, tasks, updatedAt: new Date().toISOString() } : p))}
              onUpdateProgress={(progress) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, progress, updatedAt: new Date().toISOString() } : p))}
              onUpdateExpenses={(expenses) => setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                const labor = (p.workAssignments || []).reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
                const mat = expenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
                const introducerFee = (p.introducerFeeRequired && p.introducerFeeAmount) ? p.introducerFeeAmount : 0;
                return {
                  ...p,
                  expenses,
                  spent: labor + mat + introducerFee,
                  updatedAt: new Date().toISOString()
                };
              }))}
              onUpdateWorkAssignments={(assignments) => setProjects(prev => prev.map(p => {
                if (p.id !== selectedProjectId) return p;
                const labor = assignments.reduce((acc, curr) => acc + (curr.totalCost || 0), 0);
                const mat = (p.expenses || []).reduce((acc, curr) => acc + (curr.amount || 0), 0);
                const introducerFee = (p.introducerFeeRequired && p.introducerFeeAmount) ? p.introducerFeeAmount : 0;
                return {
                  ...p,
                  workAssignments: assignments,
                  spent: labor + mat + introducerFee,
                  updatedAt: new Date().toISOString()
                };
              }))}
              onUpdatePreConstruction={(prep) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, preConstruction: prep, updatedAt: new Date().toISOString() } : p))}
              onUpdateContractUrl={(url) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, contractUrl: url, updatedAt: new Date().toISOString() } : p))}
              onUpdateDefectRecords={(records) => setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, defectRecords: records, updatedAt: new Date().toISOString() } : p))}
              onLossClick={() => handleUpdateStatus(selectedProjectId!, ProjectStatus.LOST)}

              quotations={quotations}
              onNavigateToQuotation={(projectId, quotationId) => {
                setSelectedProjectId(null); // Exit project detail
                setQuotationSystemParams({ projectId, quotationId }); // Set context
                setActiveTab('quotations'); // Switch tab
              }}
              onDeleteQuotation={(id) => {
                const q = quotations.find(item => item.id === id);
                if (q) {
                  addActivityLog('刪除報價單', q.quotationNumber, id, 'quotation');
                  setQuotations(prev => prev.map(item => item.id === id ? { ...item, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : item));
                }
              }}
            />
          ) : (
            <div className="p-4 lg:p-8 animate-in fade-in duration-500">
              {activeTab === 'attendance' && (
                <AttendanceSystem
                  currentUser={{ ...user, accessibleModules: currentUserPermissions }}
                  records={attendanceRecords}
                  onRecord={handleClockRecord}
                />
              )}
              {activeTab === 'payroll' && (
                <PayrollSystem
                  records={attendanceRecords}
                  teamMembers={filteredData.teamMembers}
                  currentUser={user}
                  approvalRequests={approvalRequests}
                  onCreateApproval={handleSaveApprovalRequest}
                  onImportRecords={handleImportRecords}
                  onImportLeaves={handleImportLeaves}
                />
              )}
              {activeTab === 'approvals' && moduleService.isModuleEnabled(ModuleId.APPROVALS) && (
                <ApprovalSystem
                  requests={approvalRequests}
                  templates={approvalTemplates}
                  teamMembers={filteredData.teamMembers}
                  currentUser={{ ...user, accessibleModules: currentUserPermissions } as any}
                  onSaveRequest={handleSaveApprovalRequest}
                  onSaveTemplate={handleSaveApprovalTemplate}
                  onDeleteTemplate={handleDeleteApprovalTemplate}
                  onAction={handleApprovalAction}
                />
              )}
              {activeTab === 'quotations' && moduleService.isModuleEnabled(ModuleId.QUOTATIONS) && (
                <QuotationSystem
                  customers={customers}
                  projects={projects}
                  user={user}
                  quotations={quotations}
                  onAddQuotation={(q) => {
                    setQuotations(prev => [q, ...prev]);
                    addActivityLog('建立了報價單', q.header.projectName, q.id, 'system');
                  }}
                  onUpdateQuotation={(q, originalId) => {
                    // Use originalId if provided (for when quotation number changes)
                    // Otherwise fall back to q.id for backwards compatibility
                    const idToMatch = originalId || q.id;
                    setQuotations(prev => prev.map(item => item.id === idToMatch ? q : item));
                    addActivityLog('更新了報價單', q.header.projectName, q.id, 'system');
                  }}
                  onDeleteQuotation={(id) => {
                    const q = quotations.find(item => item.id === id);
                    if (q) {
                      setQuotations(prev => prev.map(item => item.id === id ? { ...item, deletedAt: new Date().toISOString() } : item));
                      addActivityLog('刪除了報價單', q.header.projectName, id, 'system');
                    }
                  }}
                  initialProjectId={quotationSystemParams?.projectId}
                  initialQuotationId={quotationSystemParams?.quotationId}
                />
              )}
              {activeTab === 'dashboard' && !isCloudConnected && user.role !== 'Guest' && (
                <div className="mx-4 lg:mx-8 mt-6 p-5 bg-orange-600 text-white rounded-[2rem] shadow-2xl flex items-center justify-between gap-6 animate-in slide-in-from-top-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-2xl"><ShieldCheck size={28} /></div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.1em]">啟動數據安全備份</p>
                      <p className="text-[11px] opacity-80 font-bold mt-1">為了確保數據不遺失，請立即連結您的 Google Drive。</p>
                    </div>
                  </div>
                  <button onClick={handleConnectCloud} className="bg-white text-orange-600 px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-stone-50 transition-all flex items-center gap-3"><Zap size={16} fill="currentColor" /> 立即連結雲端</button>
                </div>
              )}

              {activeTab === 'dashboard' && moduleService.isModuleEnabled(ModuleId.DASHBOARD) && <Dashboard
                projects={filteredData.projects}
                leads={leads}
                cloudError={cloudError}
                lastCloudSync={lastCloudSync}
                isMasterTab={isMasterTab}
                onRetrySync={handleCloudSync}
                onConvertLead={handleConvertLead}
                onProjectClick={(id) => { setSelectedProjectId(id); setActiveTab('projects'); }}
                onStartTour={() => setIsOnboardingOpen(true)}
                currentDept={currentDept}
              />}
              {activeTab === 'calendar' && moduleService.isModuleEnabled(ModuleId.CALENDAR) && (
                <CalendarView
                  projects={filteredData.projects}
                  approvalRequests={approvalRequests}
                  teamMembers={teamMembers}
                  leads={leads}
                  onEditProjectClick={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                  onUpdateProject={(id, updates) => setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))}
                  onDeleteProject={(id) => {
                    if (confirm('確定要刪除此專案嗎？（此操作可到系統設定救援）')) {
                      setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : p));
                    }
                  }}

                  user={user}
                  isCloudConnected={isCloudConnected}
                />
              )}
              {activeTab === 'projects' && moduleService.isModuleEnabled(ModuleId.PROJECTS) && <ProjectList
                projects={filteredData.projects}
                user={user}
                onAddClick={() => { setEditingProject(null); setIsModalOpen(true); }}
                onUpdateStatus={handleUpdateStatus}

                onEditClick={(p) => { setEditingProject(p); setIsModalOpen(true); }}
                onDeleteClick={(id) => {
                  if (confirm('刪除操作將移動至回收桶，確定嗎？')) {
                    const p = projects.find(x => x.id === id);
                    if (p) addActivityLog('刪除了專案', p.name, id, 'project');
                    setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : p));
                  }
                }}
                onRestoreClick={(id) => {
                  const p = projects.find(x => x.id === id);
                  if (p) addActivityLog('復原了專案', p.name, id, 'project');
                  setProjects(prev => prev.map(p => p.id === id ? { ...p, deletedAt: undefined, updatedAt: new Date().toISOString() } : p));
                  alert('✅ 案件已復原！');
                }}
                onHardDeleteClick={(id) => {
                  if (confirm('警告：此操作將永久刪除案件，無法還原，確定嗎？')) {
                    const p = projects.find(x => x.id === id);
                    if (p) {
                      addActivityLog('永久刪除了專案', p.name, id, 'project');
                      // 不直接從陣列 filter，而是標記 isPurged 以維持同步一致性，防止從雲端復原
                      setProjects(prev => prev.map(item => item.id === id ? { ...item, isPurged: true, updatedAt: new Date().toISOString() } : item));
                      alert('✅ 案件已永久刪除。');
                    }
                  }
                }}
                onDetailClick={(p) => setSelectedProjectId(p.id)}

                showDeleted={showDeleted}
                onToggleDeleted={setShowDeleted}
                teamMembers={teamMembers}
                attendanceRecords={attendanceRecords}
              />}
              {activeTab === 'settings' && (
                <Settings
                  appData={appData}
                  user={user} projects={projects} customers={customers} teamMembers={teamMembers}
                  vendors={vendors} inventory={inventoryItems} locations={inventoryLocations}
                  purchaseOrders={purchaseOrders} attendance={attendanceRecords} payroll={payrollRecords}
                  quotations={quotations} leads={leads} approvalRequests={approvalRequests} approvalTemplates={approvalTemplates}
                  onImportData={(data, mode = 'overwrite') => {
                    try {
                      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
                      if (mode === 'overwrite') {
                        if (parsed.projects) setProjects(parsed.projects);
                        if (parsed.customers) setCustomers(parsed.customers);
                        if (parsed.teamMembers) setTeamMembers(parsed.teamMembers);
                        if (parsed.vendors) setVendors(parsed.vendors);
                        if (parsed.leads) setLeads(parsed.leads);
                        if (parsed.inventory) setInventoryItems(parsed.inventory);
                        if (parsed.locations) setInventoryLocations(parsed.locations);
                        if (parsed.purchaseOrders) setPurchaseOrders(parsed.purchaseOrders);
                        if (parsed.attendance) setAttendanceRecords(parsed.attendance);
                        if (parsed.payroll) setPayrollRecords(parsed.payroll);
                        if (parsed.quotations) setQuotations(parsed.quotations);
                      } else {
                        // Safe Merge Mode
                        if (parsed.projects) setProjects(prev => mergeData(prev, parsed.projects));
                        if (parsed.customers) setCustomers(prev => mergeData(prev, parsed.customers || []));
                        if (parsed.teamMembers) setTeamMembers(prev => mergeData(prev, parsed.teamMembers || []));
                        if (parsed.vendors) setVendors(prev => mergeData(prev, parsed.vendors || []));
                        if (parsed.leads) setLeads(prev => mergeData(prev, parsed.leads || []));
                        if (parsed.inventory) setInventoryItems(prev => mergeData(prev, parsed.inventory || []));
                        if (parsed.locations) setInventoryLocations(prev => mergeData(prev, parsed.locations || []));
                        if (parsed.purchaseOrders) setPurchaseOrders(prev => mergeData(prev, parsed.purchaseOrders || []));
                        if (parsed.attendance) setAttendanceRecords(prev => mergeData(prev, parsed.attendance || []));
                        if (parsed.payroll) setPayrollRecords(prev => mergeData(prev, parsed.payroll || []));
                        if (parsed.quotations) setQuotations(prev => mergeData(prev, parsed.quotations || []));
                      }
                      alert('資料匯入成功！');
                    } catch (e: any) {
                      console.error('Import Failed:', e);
                      alert(`匯入失敗：${e.message || '格式錯誤'}`);
                    }
                  }}
                  isCloudConnected={isCloudConnected}
                  onConnectCloud={handleConnectCloud}
                  onDownloadBackup={() => {
                    const data = {
                      projects,
                      customers,
                      teamMembers,
                      vendors,
                      leads,
                      inventory: inventoryItems,
                      locations: inventoryLocations,
                      purchaseOrders,
                      attendance: attendanceRecords,
                      payroll: payrollRecords,
                      quotations
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  onDisconnectCloud={() => { setIsCloudConnected(false); localStorage.removeItem('bt_cloud_connected'); }}
                  lastSyncTime={lastCloudSync}
                />
              )}
              {activeTab === 'modules' && <ModuleManager userRole={user.role} />}
              {activeTab === 'team' && moduleService.isModuleEnabled(ModuleId.TEAM) && <TeamList
                members={filteredData.teamMembers}
                departments={MOCK_DEPARTMENTS}
                projects={filteredData.projects}
                currentUserRole={user.role}
                onAddClick={() => { setEditingMember(null); setIsTeamModalOpen(true); }}
                onEditClick={(m) => { setEditingMember(m); setIsTeamModalOpen(true); }}
                onDeleteClick={(id) => {
                  if (confirm('確定移除此成員？')) {
                    const m = teamMembers.find(x => x.id === id);
                    if (m) addActivityLog('移除了成員', m.name, id, 'team');
                    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : m));
                  }
                }}
              />}
              {activeTab === 'customers' && moduleService.isModuleEnabled(ModuleId.CUSTOMERS) && <CustomerList
                customers={filteredData.customers}
                onAddClick={() => { setEditingCustomer(null); setIsCustomerModalOpen(true); }}
                onEditClick={(c) => { setEditingCustomer(c); setIsCustomerModalOpen(true); }}
                onDeleteClick={(id) => {
                  if (confirm('確定移除此客戶？')) {
                    const c = customers.find(x => x.id === id);
                    if (c) addActivityLog('移除了客戶', c.name, id, 'customer');
                    setCustomers(prev => prev.map(c => c.id === id ? { ...c, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : c));
                  }
                }}
              />}
              {activeTab === 'dispatch' && moduleService.isModuleEnabled(ModuleId.DISPATCH) && <DispatchManager projects={filteredData.projects} teamMembers={filteredData.teamMembers} onProjectsUpdate={setProjects} onAddDispatch={(pid, ass) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, workAssignments: [ass, ...(p.workAssignments || [])], updatedAt: new Date().toISOString() } : p))} onDeleteDispatch={(pid, aid) => setProjects(prev => prev.map(p => p.id === pid ? { ...p, workAssignments: (p.workAssignments || []).filter(a => a.id !== aid), updatedAt: new Date().toISOString() } : p))} />}
              {activeTab === 'analytics' && moduleService.isModuleEnabled(ModuleId.ANALYTICS) && <Analytics projects={filteredData.projects} />}
              {activeTab === 'company_mgmt' && moduleService.isModuleEnabled(ModuleId.COMPANY_MGMT) && (
                <CompanyManagement projects={filteredData.projects} />
              )}
              {activeTab === 'todos' && moduleService.isModuleEnabled(ModuleId.TODOS) && (
                <TodoList userId={user.id} />
              )}
              {activeTab === 'inventory' && moduleService.isModuleEnabled(ModuleId.INVENTORY) && <InventoryList
                items={inventoryItems}
                locations={inventoryLocations}
                user={user}
                onAddClick={() => { setEditingInventoryItem(null); setIsInventoryModalOpen(true); }}
                onEditClick={(item) => { setEditingInventoryItem(item); setIsInventoryModalOpen(true); }}
                onDeleteClick={(id) => {
                  if (confirm('確定移除此庫存項目？')) {
                    const item = inventoryItems.find(i => i.id === id);
                    if (item) addActivityLog('移除庫存項目', item.name, id, 'system');
                    setInventoryItems(prev => prev.map(i => i.id === id ? { ...i, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : i));
                  }
                }}
                onManageLocations={() => setIsLocationManagerOpen(true)}
                onTransferClick={(item) => setTransferItem(item)}
                onScanClick={() => setIsScanModalOpen(true)}
                onOrdersClick={() => setIsOrderManagerOpen(true)}
              />}

              {activeTab === 'vendors' && moduleService.isModuleEnabled(ModuleId.VENDORS) && (
                <div className="p-4 lg:p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-black text-stone-900 tracking-tight">廠商與工班管理</h2>
                    {user?.role !== 'Guest' && (
                      <button
                        onClick={() => {
                          setEditingVendor(null);
                          setIsVendorModalOpen(true);
                        }}
                        className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-stone-200 active:scale-95 transition-all"
                      >
                        + 新增廠商
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {vendors.map(v => (
                      <div key={v.id} className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-stone-100 px-2 py-0.5 rounded text-[8px] font-black text-stone-500 uppercase">{v.id}</div>
                          {user?.role !== 'Guest' && (
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => {
                                  setEditingVendor(v);
                                  setIsVendorModalOpen(true);
                                }}
                                className="text-stone-300 hover:text-blue-600 p-1"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`確定要刪除廠商 ${v.name} 嗎？`)) {
                                    setVendors(prev => prev.map(vend => vend.id === v.id ? { ...vend, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : vend));
                                  }
                                }}
                                className="text-stone-300 hover:text-rose-500 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <h3 className="text-lg font-black text-stone-900 mb-1">{v.name}</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase mb-4 tracking-widest">{v.type}</p>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-medium text-stone-500">
                            <LucideUser size={14} /> {v.contact}
                          </div>
                          {v.phone && (
                            <a href={`tel:${v.phone}`} className="flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                              {/* @ts-ignore */}
                              <Phone size={14} /> {v.phone}
                            </a>
                          )}
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Sparkles key={i} size={10} className={i < v.rating ? 'text-amber-400' : 'text-stone-200'} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                    {vendors.length === 0 && (
                      <div className="col-span-full py-20 bg-stone-50 rounded-[2.5rem] border-2 border-dashed border-stone-100 flex flex-col items-center justify-center text-stone-300 gap-4">
                        <ShoppingBag size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest">尚無廠商資料</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {activeTab === 'help' && <HelpCenter onStartTour={() => setIsOnboardingOpen(true)} />}
            </div>
          )}
        </div>

        {
          !selectedProjectId && activeTab === 'dashboard' && (
            <div className="fixed bottom-8 right-8 z-[45] flex flex-col items-end gap-3 no-print">
              <div className="bg-white/90 backdrop-blur-2xl border border-stone-200 p-4 rounded-[2rem] shadow-2xl flex items-center gap-6 animate-in slide-in-from-right-12">
                <div className="flex items-center gap-3 border-r border-stone-100 pr-6">
                  <Activity size={18} className="text-emerald-500" />
                  <div className="flex flex-col"><span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">系統狀態</span><span className="text-[10px] font-bold text-stone-900">核心正常</span></div>
                </div>
                <div className="flex items-center gap-3">
                  <Database size={16} className="text-emerald-500" />
                  <div className="flex flex-col"><span className="text-[9px] font-black text-stone-400 uppercase tracking-widest leading-none">無限量緩存</span><span className="text-[10px] font-bold text-stone-900">{lastSaved}</span></div>
                </div>
              </div>
            </div>
          )
        }

        <div className="no-print">
          <AIAssistant
            projects={filteredData.projects}
            activeTab={activeTab}
            selectedProjectId={selectedProjectId}
            onAddProject={(initialData) => {
              setEditingProject({
                id: '',
                name: initialData.name || '新案件',
                status: ProjectStatus.NEGOTIATING,
                progress: 0,
                managers: [],
                customer: initialData.client ? { name: initialData.client, phone: '', id: 'temp' } as any : undefined,
                budget: initialData.budget || 0,
                description: initialData.notes || '',
                location: initialData.location ? { address: initialData.location } as any : undefined,
                categories: [],
                startDate: new Date().toISOString().split('T')[0],
              } as any);
              setIsModalOpen(true);
            }}
            onProjectClick={(projectId) => {
              setSelectedProjectId(projectId);
              setActiveTab('projects');
            }}
            onOpenSettings={() => setIsAISettingsOpen(true)}
          />
        </div>
        {/* AI API Key Settings Modal */}
        {
          isAISettingsOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="px-8 py-6 bg-stone-900 flex justify-between items-center text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500 rounded-xl">
                      <Sparkles size={20} className="text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-tight">AI 服務核心配置</h2>
                      <p className="text-[10px] text-orange-200 font-bold uppercase tracking-widest">Gemini API Configuration</p>
                    </div>
                  </div>
                  <button onClick={() => setIsAISettingsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex justify-between">
                      <span>Gemini API Key</span>
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                        獲取金鑰 <ExternalLink size={10} />
                      </a>
                    </label>
                    <input
                      type="password"
                      placeholder="貼上您的 API 金鑰..."
                      className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-5 py-4 text-sm font-bold text-black outline-none focus:ring-4 focus:ring-orange-500/10 placeholder:text-stone-300 transition-all font-mono"
                      value={aiApiKey}
                      onChange={(e) => setAiApiKey(e.target.value)}
                    />
                    <p className="text-[10px] text-stone-400 font-bold leading-relaxed px-1">
                      金鑰將安全地儲存在您的瀏覽器本地 (LocalStorage)，不會上傳至伺服器或 GitHub，且僅用於此設備的 AI 解析功能。
                    </p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { localStorage.removeItem('GEMINI_API_KEY'); setAiApiKey(''); alert('已清除金鑰'); window.location.reload(); }} className="flex-1 py-4 border border-stone-200 text-stone-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-stone-50 transition-all">清除</button>
                    <button onClick={saveAiApiKey} className="flex-[2] bg-stone-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-stone-100 hover:bg-black active:scale-[0.98] transition-all">儲存配置</button>
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </main >

      {isModalOpen && user.role !== 'Guest' && <ProjectModal onClose={() => setIsModalOpen(false)} onConfirm={(data) => {
        handleSaveProject(data, editingProject);
        setIsModalOpen(false);
      }} initialData={editingProject} teamMembers={teamMembers} />}

      {
        isCustomerModalOpen && user?.role !== 'Guest' && <CustomerModal
          onClose={() => setIsCustomerModalOpen(false)}
          onConfirm={(data) => {
            if (editingCustomer) {
              addActivityLog('更新客戶資料', data.name, editingCustomer.id, 'customer');
              setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, ...data, updatedAt: new Date().toISOString() } : c));
            } else {
              const newId = 'C' + Date.now().toString().slice(-6);
              addActivityLog('新增客戶', data.name, newId, 'customer');
              setCustomers(prev => [{ ...data, id: newId, createdDate: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString() } as any, ...prev]);
            }
            setIsCustomerModalOpen(false);
            setEditingCustomer(null);
          }}
          initialData={editingCustomer}
        />
      }

      {
        isTeamModalOpen && user?.role !== 'Guest' && <TeamModal
          onClose={() => { setIsTeamModalOpen(false); setEditingMember(null); }}
          onConfirm={(data) => {
            if (editingMember) {
              addActivityLog('更新成員資料', data.name, editingMember.id, 'team');
              setTeamMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m));
            } else {
              const newId = 'T' + Date.now().toString().slice(-6);
              addActivityLog('新增團隊成員', data.name, newId, 'team');
              setTeamMembers(prev => [{ ...data, id: newId, status: 'Available', activeProjectsCount: 0, systemRole: data.systemRole || 'Staff', departmentId: data.departmentId || 'DEPT-1', updatedAt: new Date().toISOString() } as any, ...prev]);
            }
            setIsTeamModalOpen(false);
            setEditingMember(null);
          }}
          initialData={editingMember}
          currentUser={user!}
        />
      }

      {
        isInventoryModalOpen && user?.role !== 'Guest' && <InventoryModal
          onClose={() => { setIsInventoryModalOpen(false); setEditingInventoryItem(null); }}
          onConfirm={(data) => {
            const timestamped = { ...data, updatedAt: new Date().toISOString() };
            if (editingInventoryItem) {
              addActivityLog('更新庫存', data.name || '', editingInventoryItem.id, 'system');
              setInventoryItems(prev => prev.map(i => i.id === editingInventoryItem.id ? { ...i, ...timestamped } as InventoryItem : i));
            } else {
              const newId = 'INV' + Date.now().toString().slice(-6);
              addActivityLog('新增庫存', data.name || '', newId, 'system');
              setInventoryItems(prev => [{ ...timestamped, id: newId, status: 'Normal' } as InventoryItem, ...prev]);
            }
            setIsInventoryModalOpen(false);
            setEditingInventoryItem(null);
          }}
          initialData={editingInventoryItem}
          // Pass available locations names for suggestion
          availableLocationNames={inventoryLocations.map(l => l.name)}
          relatedPurchaseOrders={purchaseOrders.filter(o => o.items.some(i => i.itemId === editingInventoryItem?.id))}
          relatedTransferLogs={activityLogs.filter(l => l.targetId === editingInventoryItem?.id && l.action === '庫存調撥')}
        />
      }

      {
        isOrderManagerOpen && user?.role !== 'Guest' && <OrderManagerModal
          onClose={() => setIsOrderManagerOpen(false)}
          orders={purchaseOrders}
          inventoryItems={inventoryItems}
          locations={inventoryLocations}
          onSaveOrder={(order) => {
            setPurchaseOrders(prev => [order, ...prev]);
            addActivityLog('建立採購單', order.supplier, order.id, 'system');
          }}
          onUpdateOrder={(order) => {
            setPurchaseOrders(prev => prev.map(o => o.id === order.id ? order : o));
            addActivityLog('更新採購單', order.supplier, order.id, 'system');
          }}
          onDeleteOrder={(orderId) => {
            const order = purchaseOrders.find(o => o.id === orderId);
            setPurchaseOrders(prev => prev.filter(o => o.id !== orderId));
            addActivityLog('刪除採購單', order?.supplier || '未知廠商', orderId, 'system');
          }}
          onReceiveItems={(orderId, itemIdxs) => {
            const order = purchaseOrders.find(o => o.id === orderId);
            if (!order) return;

            const updatedItems = [...order.items];
            let somethingChanged = false;

            itemIdxs.forEach(idx => {
              if (!updatedItems[idx].received) {
                updatedItems[idx].received = true;
                somethingChanged = true;

                // Update Inventory
                const invItemId = updatedItems[idx].itemId;
                const quantityToAdd = updatedItems[idx].quantity;
                const targetWarehouseId = order.targetWarehouseId;
                const targetWarehouseName = inventoryLocations.find(l => l.id === targetWarehouseId)?.name || '總倉庫';

                setInventoryItems(prev => prev.map(item => {
                  if (item.id === invItemId) {
                    // Find if location exists
                    const existingLocIdx = item.locations?.findIndex(l => l.name === targetWarehouseName);
                    let newLocations = [...(item.locations || [])];

                    if (existingLocIdx !== undefined && existingLocIdx >= 0) {
                      newLocations[existingLocIdx] = {
                        ...newLocations[existingLocIdx],
                        quantity: Number(newLocations[existingLocIdx].quantity) + quantityToAdd
                      };
                    } else {
                      newLocations.push({ name: targetWarehouseName, quantity: quantityToAdd });
                    }

                    const totalQuantity = newLocations.reduce((sum, loc) => sum + loc.quantity, 0);

                    return {
                      ...item,
                      quantity: totalQuantity,
                      locations: newLocations,
                      updatedAt: new Date().toISOString()
                    };
                  }
                  return item;
                }));
              }
            });

            if (somethingChanged) {
              const allReceived = updatedItems.every(i => i.received);
              const updatedOrder = {
                ...order,
                items: updatedItems,
                status: allReceived ? 'Completed' : 'Partial' as any
              };
              setPurchaseOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
              addActivityLog('採購單收貨', order.supplier, order.id, 'system');
            }
          }}
        />
      }

      {
        isLocationManagerOpen && <LocationManagerModal
          locations={inventoryLocations}
          onClose={() => setIsLocationManagerOpen(false)}
          onAdd={(data) => {
            const newId = 'LOC' + Date.now().toString().slice(-6);
            setInventoryLocations(prev => [...prev, { ...data, id: newId } as InventoryLocation]);
            addActivityLog('新增倉庫', data.name, newId, 'system');
          }}
          onDelete={(id) => {
            const loc = inventoryLocations.find(l => l.id === id);
            if (loc) {
              setInventoryLocations(prev => prev.filter(l => l.id !== id));
              addActivityLog('移除倉庫', loc.name, id, 'system');
            }
          }}
          onUpdate={(location) => {
            setInventoryLocations(prev => prev.map(l => l.id === location.id ? location : l));
            addActivityLog('更新倉庫資訊', location.name, location.id, 'system');
          }}
        />
      }

      {
        transferItem && <TransferModal
          item={transferItem}
          allLocations={inventoryLocations}
          onClose={() => setTransferItem(null)}
          onConfirm={(from, to, qty, notes) => {
            // Perform Transfer
            setInventoryItems(prev => prev.map(item => {
              if (item.id !== transferItem.id) return item;

              const newLocations = [...(item.locations || [])];

              // Decrease Source
              const sourceIdx = newLocations.findIndex(l => l.name === from);
              if (sourceIdx >= 0) {
                newLocations[sourceIdx] = {
                  ...newLocations[sourceIdx],
                  quantity: Math.max(0, newLocations[sourceIdx].quantity - qty)
                };
              }

              // Increase Dest
              const destIdx = newLocations.findIndex(l => l.name === to);
              if (destIdx >= 0) {
                newLocations[destIdx] = {
                  ...newLocations[destIdx],
                  quantity: newLocations[destIdx].quantity + qty
                };
              } else {
                newLocations.push({ name: to, quantity: qty });
              }

              // Update Item total quantity (should technically remain same, but recalc to be safe)
              const total = newLocations.reduce((sum, l) => sum + (l.quantity || 0), 0);

              addActivityLog('庫存調撥', `${item.name} (${qty} ${item.unit}) from ${from} to ${to}`, item.id, 'inventory');

              return {
                ...item,
                quantity: total,
                locations: newLocations,
                updatedAt: new Date().toISOString()
              };
            }));
            setTransferItem(null);
          }}
        />
      }

      {
        isScanModalOpen && <ScanTransferModal
          inventoryItems={inventoryItems}
          locations={inventoryLocations}
          onClose={() => setIsScanModalOpen(false)}
          onConfirm={(items, toLocation) => {
            // Batch Transfer Logic
            setInventoryItems(prev => {
              let newItems = [...prev];
              const logDetails: string[] = [];

              items.forEach(transfer => {
                const itemIndex = newItems.findIndex(i => i.id === transfer.inventoryItem.id);
                if (itemIndex >= 0) {
                  const item = newItems[itemIndex];
                  const newLocations = [...(item.locations || [])];

                  // Decrease Source
                  const sourceIdx = newLocations.findIndex(l => l.name === transfer.fromLocation);
                  if (sourceIdx >= 0) {
                    newLocations[sourceIdx] = {
                      ...newLocations[sourceIdx],
                      quantity: Math.max(0, newLocations[sourceIdx].quantity - transfer.quantity)
                    };
                  }

                  // Increase Dest
                  const destIdx = newLocations.findIndex(l => l.name === toLocation);
                  if (destIdx >= 0) {
                    newLocations[destIdx] = {
                      ...newLocations[destIdx],
                      quantity: newLocations[destIdx].quantity + transfer.quantity
                    };
                  } else {
                    newLocations.push({ name: toLocation, quantity: transfer.quantity });
                  }

                  // Recalculate total
                  const total = newLocations.reduce((sum, l) => sum + (l.quantity || 0), 0);
                  newItems[itemIndex] = {
                    ...item,
                    quantity: total,
                    locations: newLocations,
                    updatedAt: new Date().toISOString()
                  };

                  logDetails.push(`${item.name} (${transfer.quantity})`);
                }
              });

              if (logDetails.length > 0) {
                addActivityLog('批量調撥', `轉移至 ${toLocation}: ${logDetails.join(', ')}`, 'BATCH_TRANSFER', 'inventory');
              }

              return newItems;
            });
            setIsScanModalOpen(false);
          }}
        />
      }

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => { setIsVendorModalOpen(false); setEditingVendor(null); }}
        onSave={(data) => {
          const timestampedData = { ...data, updatedAt: new Date().toISOString() };
          if (editingVendor) {
            addActivityLog('更新廠商資料', data.name, editingVendor.id, 'vendor');
            setVendors(prev => prev.map(v => v.id === data.id ? timestampedData : v));
          } else {
            addActivityLog('新增合作廠商', data.name, data.id, 'vendor');
            setVendors(prev => [timestampedData, ...prev]);
          }
          setIsVendorModalOpen(false);
          setEditingVendor(null);
        }}
        vendor={editingVendor}
      />

      {/* Activity Log Side Panel Overlay */}
      {
        isNotificationOpen && (
          <>
            <div
              className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-[110] animate-in fade-in duration-300"
              onClick={() => setIsNotificationOpen(false)}
            />
            <div className="fixed top-0 right-0 bottom-0 w-full max-w-[400px] z-[120] shadow-2xl">
              <NotificationPanel
                logs={activityLogs}
                onClose={() => setIsNotificationOpen(false)}
                onProjectClick={(id) => {
                  setSelectedProjectId(id);
                  setIsNotificationOpen(false);
                  setActiveTab('projects');
                }}
                onMarkAsRead={handleMarkLogAsRead}
                onMarkAllAsRead={handleMarkAllLogsAsRead}
              />
            </div>
          </>
        )
      }
      <OnboardingTour isOpen={isOnboardingOpen} onClose={handleCloseOnboarding} />
    </div >
  );
};

export default App;
