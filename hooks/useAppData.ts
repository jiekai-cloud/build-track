import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    Project, ProjectStatus, Customer, TeamMember, User, ActivityLog,
    Vendor, Lead, InventoryItem, InventoryLocation, PurchaseOrder,
    AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate,
    Quotation, ChecklistTask, PaymentStage, DailyLogEntry, ProjectComment,
    SystemCalendarEvent
} from '../types';
import { MOCK_PROJECTS, MOCK_TEAM_MEMBERS } from '../constants';
import { storageService } from '../services/storageService';
import { SystemContext } from '../types';

// 集中管理所有實體資料 state 與合併/正規化邏輯
import { fetchLeakDetectionLeads } from '../services/sheetService';

// 集中管理所有實體資料 state 與合併/正規化邏輯
export const useAppData = (currentDept: SystemContext = 'FirstDept', enableAutoSave: boolean = false) => {
    // ============ 核心業務資料 State ============
    const [projects, setProjects] = useState<Project[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [inventoryLocations, setInventoryLocations] = useState<InventoryLocation[]>([]);
    const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
    const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
    const [approvalTemplates, setApprovalTemplates] = useState<ApprovalTemplate[]>([]);
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<SystemCalendarEvent[]>([]);

    // ============ 外部表單同步 (Google Sheet) ============
    const syncExternalLeads = useCallback(async () => {
        if (typeof window !== 'undefined' && !window.navigator.onLine) return;

        try {
            console.log('[Sheet Sync] Checking for new leads from Google Sheet...');
            const sheetLeads = await fetchLeakDetectionLeads();

            if (sheetLeads.length > 0) {
                setLeads(prev => {
                    const existingIds = new Set(prev.map(l => l.id));
                    const newUniqueLeads = sheetLeads.filter(l => !existingIds.has(l.id));

                    if (newUniqueLeads.length === 0) return prev;

                    console.log(`[Sheet Sync] Imported ${newUniqueLeads.length} new leads.`);
                    // New leads go to top
                    const allLeads = [...newUniqueLeads, ...prev];
                    // Also update localStorage for immediate backup
                    localStorage.setItem('bt_leads', JSON.stringify(allLeads));
                    return allLeads;
                });
            }
        } catch (e) {
            console.error('[Sheet Sync] Background sync failed', e);
        }
    }, []);

    // 初次載入時自動同步
    useEffect(() => {
        // Delay slightly to allow main hydration
        const timer = setTimeout(() => {
            syncExternalLeads();
        }, 3000);
        return () => clearTimeout(timer);
    }, [syncExternalLeads]);

    // ============ 初始化 Leads (Demo 資料) ============
    useEffect(() => {
        try {
            const savedLeads = JSON.parse(localStorage.getItem('bt_leads') || '[]');
            if (!Array.isArray(savedLeads) || savedLeads.length === 0) {
                const mockLeads: Lead[] = [
                    {
                        id: 'L-1',
                        customerName: '張小姐',
                        phone: '0912-345-678',
                        address: '台北市士林區',
                        diagnosis: '浴室外牆產生壁癌，疑似冷熱水管滲漏導致水氣滲透。',
                        photos: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=800'],
                        timestamp: '2026-01-02 09:30',
                        status: 'new'
                    },
                    {
                        id: 'L-2',
                        customerName: '科技辦公室行政',
                        phone: '02-2345-6789',
                        address: '新北市中和區',
                        diagnosis: '頂樓女兒牆裂縫與防水層老化，雨後天花板有明顯滴水現象。',
                        photos: ['https://images.unsplash.com/photo-1516714435131-44d6b64dc392?auto=format&fit=crop&q=80&w=800'],
                        timestamp: '2026-01-02 10:15',
                        status: 'new'
                    }
                ];
                setLeads(mockLeads);
                localStorage.setItem('bt_leads', JSON.stringify(mockLeads));
            } else {
                setLeads(savedLeads);
            }
        } catch (e) {
            console.error('Leads initialization error', e);
            setLeads([]);
        }
    }, []);

    // ============ 合併邏輯 (Map-based Optimization O(N)) ============
    const mergeData = useCallback(<T extends { id: string, updatedAt?: string, deletedAt?: string }>(local: T[], remote: T[]): T[] => {
        if (!remote || remote.length === 0) return local;
        if (!local || local.length === 0) return remote;

        // 1. 建立 Local Map，方便快速查找 (Item ID -> Item)
        const itemMap = new Map<string, T>();
        local.forEach(item => itemMap.set(item.id, item));

        // 2. 遍歷 Remote 資料進行合併
        remote.forEach(remoteItem => {
            const localItem = itemMap.get(remoteItem.id);

            // 如果本地沒有，直接新增
            if (!localItem) {
                itemMap.set(remoteItem.id, remoteItem);
                return;
            }

            // 如果本地有，比較 updatedAt
            const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
            const remoteTime = remoteItem.updatedAt ? new Date(remoteItem.updatedAt).getTime() : 0;

            if (remoteTime > localTime) {
                // Remote 比較新，執行深度合併 (針對特殊欄位)
                if ('dailyLogs' in localItem || 'workflowLogs' in localItem) {
                    const l = localItem as any;
                    const r = remoteItem as any;

                    // 輔助函式：合併子陣列 (如 logs, comments)
                    const combineSubArrays = (arr1: any[] = [], arr2: any[] = []) => {
                        const subMap = new Map();
                        // 優先保留時間較新的項目，或 ID 相同的項目
                        [...arr1, ...arr2].forEach(x => {
                            const key = x.id || (x.timestamp ? x.timestamp + (x.step || '') : JSON.stringify(x));
                            subMap.set(key, x);
                        });
                        return Array.from(subMap.values()).sort((a, b) =>
                            new Date(b.timestamp || b.date || b.createdAt || 0).getTime() - new Date(a.timestamp || a.date || a.createdAt || 0).getTime()
                        );
                    };

                    let mergedItem = { ...remoteItem };

                    if ('dailyLogs' in localItem) {
                        mergedItem = {
                            ...mergedItem,
                            dailyLogs: combineSubArrays(l.dailyLogs, r.dailyLogs),
                            comments: combineSubArrays(l.comments, r.comments),
                            files: combineSubArrays(l.files, r.files),
                            expenses: combineSubArrays(l.expenses, r.expenses),
                            payments: combineSubArrays(l.payments, r.payments),
                            checklist: combineSubArrays(l.checklist, r.checklist),
                            workAssignments: combineSubArrays(l.workAssignments, r.workAssignments),
                            defectRecords: combineSubArrays(l.defectRecords, r.defectRecords),
                            phases: combineSubArrays(l.phases, r.phases)
                        };
                    } else if ('workflowLogs' in localItem) {
                        mergedItem = {
                            ...mergedItem,
                            workflowLogs: combineSubArrays(l.workflowLogs, r.workflowLogs)
                        };
                    }
                    itemMap.set(remoteItem.id, mergedItem as T);
                } else {
                    // 一般物件，直接使用較新的 Remote
                    itemMap.set(remoteItem.id, remoteItem);
                }
            }
            // 如果 localTime >= remoteTime，保留本地版本 (無需動作)
        });

        return Array.from(itemMap.values());
    }, []);

    // ============ 正規化 Projects ============
    // 簡化版：僅確保結構完整，移除多餘的合併邏輯 (由 mergeData 統一處理)
    const normalizeProjects = useCallback((projects: Project[] | null | undefined): Project[] => {
        if (!projects || !Array.isArray(projects)) return [];

        const validProjects = projects.filter(p => p && typeof p === 'object' && (p.id || p.name));

        const processed = validProjects.map(p => {
            let updatedProject = { ...p };
            if (updatedProject.status === '驗收中' as any) updatedProject.status = ProjectStatus.INSPECTION;
            if (!updatedProject.dailyLogs) updatedProject.dailyLogs = [];
            if (!updatedProject.comments) updatedProject.comments = [];
            if (!updatedProject.files) updatedProject.files = [];
            if (!updatedProject.phases) updatedProject.phases = [];
            if (!updatedProject.expenses) updatedProject.expenses = [];
            if (!updatedProject.checklist) updatedProject.checklist = [];
            if (!updatedProject.payments) updatedProject.payments = [];
            if (!updatedProject.defectRecords) updatedProject.defectRecords = [];
            if (!updatedProject.departmentId) updatedProject.departmentId = 'DEPT-4';
            return updatedProject;
        });

        // 簡單去重 (以 ID 為準，保留後面的/最新的)
        const projectMap = new Map<string, Project>();
        processed.forEach(p => {
            projectMap.set(p.id, p);
        });

        return Array.from(projectMap.values());
    }, []);

    // ============ 雲端合併更新 ============
    const updateStateWithMerge = useCallback((cloudData: any) => {
        if (!cloudData) return;

        const cleanCloudProjects = normalizeProjects(cloudData.projects || []);

        // Ensure customers have a valid departmentId
        const cleanCustomers = (cloudData.customers || []).map((c: any) => ({
            ...c,
            departmentId: c.departmentId || 'DEPT-4'
        }));

        setProjects(prev => mergeData(prev, cleanCloudProjects));
        setCustomers(prev => mergeData(prev, cleanCustomers));
        setTeamMembers(prev => mergeData(prev, cloudData.teamMembers || []));
        setVendors(prev => mergeData(prev, cloudData.vendors || []));
        if (cloudData.inventory) setInventoryItems(prev => mergeData(prev, cloudData.inventory || []));
        if (cloudData.locations) setInventoryLocations(prev => mergeData(prev, cloudData.locations || []));
        if (cloudData.purchaseOrders) setPurchaseOrders(prev => mergeData(prev, cloudData.purchaseOrders || []));
        if (cloudData.attendance) setAttendanceRecords(prev => mergeData(prev, cloudData.attendance || []));
        if (cloudData.payroll) setPayrollRecords(prev => mergeData(prev, cloudData.payroll || []));
        if (cloudData.approvalRequests) setApprovalRequests(prev => mergeData(prev, cloudData.approvalRequests || []));
        if (cloudData.approvalTemplates) setApprovalTemplates(prev => mergeData(prev, cloudData.approvalTemplates || []));
        if (cloudData.quotations) setQuotations(prev => mergeData(prev, cloudData.quotations || []));
        if (cloudData.calendarEvents) setCalendarEvents(prev => mergeData(prev, cloudData.calendarEvents || []));

        setActivityLogs(prev => {
            const combined = [...(cloudData.activityLogs || []), ...prev];
            const seen = new Set();
            return combined.filter(log => {
                if (seen.has(log.id)) return false;
                seen.add(log.id);
                return true;
            }).slice(0, 200);
        });
    }, [mergeData, normalizeProjects]);

    // ============ dataRef (用於同步時取得最新資料) ============
    const dataRef = useRef({
        projects, customers, teamMembers, activityLogs, vendors, leads,
        inventoryItems, inventoryLocations, purchaseOrders, attendanceRecords,
        payrollRecords, approvalRequests, approvalTemplates, quotations, calendarEvents
    });
    useEffect(() => {
        dataRef.current = {
            projects, customers, teamMembers, activityLogs, vendors, leads,
            inventoryItems, inventoryLocations, purchaseOrders, attendanceRecords,
            payrollRecords, approvalRequests, approvalTemplates, quotations, calendarEvents
        };
    }, [projects, customers, teamMembers, activityLogs, vendors, leads, inventoryItems, inventoryLocations, purchaseOrders, attendanceRecords, payrollRecords, approvalRequests, approvalTemplates, quotations, calendarEvents]);

    // ============ 活動日誌 ============
    const addActivityLog = useCallback((action: string, targetName: string, targetId: string, type: ActivityLog['type'], user: User | null) => {
        if (!user) return;
        const newLog: ActivityLog = {
            id: Date.now().toString(),
            userId: user.id || 'unknown',
            userName: user.name,
            userAvatar: user.picture,
            action,
            targetId,
            targetName,
            type,
            timestamp: new Date().toISOString(),
            isRead: false
        };
        setActivityLogs(prev => [newLog, ...prev].slice(0, 200));
    }, []);

    // ============ 登出清除 ============
    const clearAllData = useCallback(() => {
        setProjects([]);
        setCustomers([]);
        setTeamMembers([]);
        setVendors([]);
        setLeads([]);
        setInventoryItems([]);
        setPurchaseOrders([]);
        setActivityLogs([]);
        setQuotations([]);
        setCalendarEvents([]);
        // Add other clears if needed
    }, []);

    // ============ 存檔到 IndexedDB ============
    // 改為可由 useEffect 觸發，也可手動觸發
    const [lastSaved, setLastSaved] = useState<string>(new Date().toLocaleTimeString());

    const saveToIndexedDB = useCallback(async (targetDept: SystemContext = currentDept) => {
        const prefix = targetDept === 'ThirdDept' ? 'dept3_' : '';
        try {
            await Promise.all([
                storageService.setItem(`${prefix}bt_projects`, projects),
                storageService.setItem(`${prefix}bt_customers`, customers),
                storageService.setItem(`${prefix}bt_team`, teamMembers),
                storageService.setItem(`${prefix}bt_vendors`, vendors),
                storageService.setItem(`${prefix}bt_leads`, leads),
                storageService.setItem(`${prefix}bt_inventory`, inventoryItems),
                storageService.setItem(`${prefix}bt_locations`, inventoryLocations),
                storageService.setItem(`${prefix}bt_orders`, purchaseOrders),
                storageService.setItem(`${prefix}bt_attendance`, attendanceRecords),
                storageService.setItem(`${prefix}bt_payroll`, payrollRecords),
                storageService.setItem(`${prefix}bt_approval_requests`, approvalRequests),
                storageService.setItem(`${prefix}bt_approval_templates`, approvalTemplates),
                storageService.setItem(`${prefix}bt_quotations`, quotations),
                storageService.setItem(`${prefix}bt_calendar_events`, calendarEvents),
                storageService.setItem(`${prefix}bt_logs`, activityLogs.slice(0, 200))
            ]);
            console.log(`[AutoSave] Data saved to IndexedDB (${targetDept})`);
            setLastSaved(new Date().toLocaleTimeString());
            return true;
        } catch (e) {
            console.error('Auto-save failed', e);
            return false;
        }
    }, [projects, customers, teamMembers, vendors, leads, inventoryItems, inventoryLocations, purchaseOrders, attendanceRecords, payrollRecords, approvalRequests, approvalTemplates, quotations, calendarEvents, activityLogs, currentDept]);

    // ============ 自動存檔 Effect ============
    useEffect(() => {
        if (!enableAutoSave) return;

        const timer = setTimeout(() => {
            saveToIndexedDB();
        }, 2000); // 2秒 Debounce

        return () => clearTimeout(timer);
    }, [
        enableAutoSave, saveToIndexedDB,
        // 依賴項已包含在 saveToIndexedDB 中，但為了明確觸發，這裡列出數據依賴
        projects, customers, teamMembers, vendors, leads,
        inventoryItems, inventoryLocations, purchaseOrders,
        attendanceRecords, payrollRecords, approvalRequests,
        approvalTemplates, quotations, calendarEvents, activityLogs
    ]);

    return {
        // State
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
        lastSaved, // Expose lastSaved state

        // 核心函式
        mergeData,
        normalizeProjects,
        updateStateWithMerge,
        addActivityLog,
        clearAllData,
        saveToIndexedDB,
        syncExternalLeads, // Expose syncing function
        dataRef,
    };
};

