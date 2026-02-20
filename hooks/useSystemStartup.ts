import { useCallback, useEffect, useRef } from 'react';
import {
    Project, Customer, TeamMember, Vendor, Lead, ActivityLog,
    InventoryItem, InventoryLocation, PurchaseOrder,
    AttendanceRecord, ApprovalRequest, ApprovalTemplate, Quotation,
    PayrollRecord, SystemContext, SystemCalendarEvent
} from '../types';
import { storageService } from '../services/storageService';
import { MOCK_PROJECTS, MOCK_TEAM_MEMBERS } from '../constants';

interface SystemStartupDeps {
    normalizeProjects: (projects: Project[]) => Project[];
    autoConnectCloud: () => Promise<void>;
    // Setters
    setProjects: (fn: any) => void;
    setCustomers: (fn: any) => void;
    setTeamMembers: (fn: any) => void;
    setVendors: (fn: any) => void;
    setLeads: (fn: any) => void;
    setActivityLogs: (fn: any) => void;
    setInventoryItems: (fn: any) => void;
    setInventoryLocations: (fn: any) => void;
    setPurchaseOrders: (fn: any) => void;
    setAttendanceRecords: (fn: any) => void;
    setPayrollRecords: (fn: any) => void;
    setApprovalRequests: (fn: any) => void;
    setApprovalTemplates: (fn: any) => void;
    setQuotations: (fn: any) => void;
    setCalendarEvents: (fn: any) => void;
    setInitialSyncDone: (value: boolean) => void;
    setIsInitializing: (value: boolean) => void;
    setIsFirstTimeUser: (value: boolean) => void;
    setUser: (user: any) => void;
    setCurrentDept: (dept: SystemContext) => void;
    setViewingDeptId: (id: string) => void;
}

/**
 * 系統啟動 Hook：負責從 IndexedDB 載入所有實體資料、
 * 執行資料遷移、並處理首次啟動流程。
 */
export const useSystemStartup = (deps: SystemStartupDeps) => {
    const {
        normalizeProjects, autoConnectCloud,
        setProjects, setCustomers, setTeamMembers, setVendors, setLeads,
        setActivityLogs, setInventoryItems, setInventoryLocations,
        setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
        setApprovalRequests, setApprovalTemplates, setQuotations, setCalendarEvents,
        setInitialSyncDone, setIsInitializing, setIsFirstTimeUser,
        setUser, setCurrentDept, setViewingDeptId,
    } = deps;

    const loadSystemData = useCallback(async (dept: SystemContext) => {
        console.log(`[System] Initializing context for: ${dept}`);

        // 1. Configure Cloud Context
        const prefix = dept === 'ThirdDept' ? 'dept3_' : '';

        // 2. Load Local Data (IndexedDB) with Prefix
        try {
            const defaultProjects = dept === 'FirstDept' ? MOCK_PROJECTS : [];
            const defaultTeam = dept === 'FirstDept' ? MOCK_TEAM_MEMBERS : [];

            // Load Projects
            let initialProjects = await storageService.getItem<Project[]>(`${prefix}bt_projects`, defaultProjects);

            // Restoration Logic (Legacy FirstDept Support)
            if (dept === 'FirstDept') {
                const criticalRestorationIds = ['BNI2601001', 'BNI2601002', 'BNI2601004', 'OC2601005', 'JW2601003'];

                try {
                    if (initialProjects.length > 0) await storageService.setItem(`${prefix}bt_projects_backup`, initialProjects);
                } catch (e) { }

                try { initialProjects = JSON.parse(JSON.stringify(initialProjects)); } catch (e) { console.error('Deep clone failed', e); }

                initialProjects = initialProjects.map((p: any) => {
                    if (criticalRestorationIds.includes(p.id) && p.deletedAt) {
                        const { deletedAt, ...rest } = p;
                        return { ...rest, updatedAt: new Date().toISOString() };
                    }
                    return p;
                });

                const missingProjects = MOCK_PROJECTS.filter(mockP =>
                    criticalRestorationIds.includes(mockP.id) &&
                    !initialProjects.some((p: Project) => p.id === mockP.id || p.name === mockP.name)
                );
                if (missingProjects.length > 0) {
                    initialProjects = [...initialProjects, ...JSON.parse(JSON.stringify(missingProjects))];
                }
            }

            // Normalize
            const deduplicatedProjects = normalizeProjects(initialProjects);

            setProjects(deduplicatedProjects.map((p: Project) => ({
                ...p,
                expenses: p.expenses || [],
                workAssignments: p.workAssignments || [],
                files: p.files || [],
                phases: p.phases || [],
                dailyLogs: p.dailyLogs || [],
                checklist: p.checklist || [],
                payments: p.payments || []
            })));

            // Load other entities
            const [customersData, initialTeamData, vendorsData, leadsData, logsData, inventoryData, locationsData, purchaseOrdersData, attendanceData, payrollData, approvalRequestsData, approvalTemplatesData] = await Promise.all([
                storageService.getItem<Customer[]>(`${prefix}bt_customers`, []),
                storageService.getItem<TeamMember[]>(`${prefix}bt_team`, defaultTeam),
                storageService.getItem<Vendor[]>(`${prefix}bt_vendors`, []),
                storageService.getItem<Lead[]>(`${prefix}bt_leads`, []),
                storageService.getItem<any[]>(`${prefix}bt_logs`, []),
                storageService.getItem<InventoryItem[]>(`${prefix}bt_inventory`, []),
                storageService.getItem<InventoryLocation[]>(`${prefix}bt_locations`, [{ id: 'MAIN', name: '總倉庫', type: 'Main', isDefault: true }]),
                storageService.getItem<PurchaseOrder[]>(`${prefix}bt_orders`, []),
                storageService.getItem<AttendanceRecord[]>(`${prefix}bt_attendance`, []),
                storageService.getItem<PayrollRecord[]>(`${prefix}bt_payroll`, []),
                storageService.getItem<ApprovalRequest[]>(`${prefix}bt_approval_requests`, []),
                storageService.getItem<ApprovalTemplate[]>(`${prefix}bt_approval_templates`, [
                    {
                        id: 'TPL-LEAVE',
                        name: '請假申請單',
                        description: '各類假別申請流程',
                        workflow: ['Manager', 'AdminStaff'],
                        formFields: [
                            { key: '假別', label: '假別類型', type: 'select', options: ['事假', '病假', '特休', '公假', '喪假', '婚假', '補休', '其他'], required: true },
                            { key: 'startDate', label: '開始日期', type: 'date', required: true },
                            { key: 'endDate', label: '結束日期', type: 'date', required: true },
                            { key: 'reason', label: '詳細原因', type: 'text', required: true }
                        ],
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: 'TPL-EXPENSE',
                        name: '費用報支申請',
                        description: '專案或行政費用報銷',
                        workflow: ['Manager', 'DeptAdmin', 'AdminStaff'],
                        formFields: [
                            { key: '項目', label: '報支項目', type: 'text', required: true },
                            { key: '金額', label: '報支金額', type: 'number', required: true },
                            { key: '日期', label: '發生日期', type: 'date', required: true },
                            { key: '備註', label: '備註說明', type: 'text', required: false }
                        ],
                        updatedAt: new Date().toISOString()
                    }
                ])
                    // Ensure TPL-CORRECTION exists if not present (Migration)
                    .then(templates => {
                        if (!templates.find(t => t.id === 'TPL-CORRECTION')) {
                            templates.push({
                                id: 'TPL-CORRECTION',
                                name: '補打卡申請',
                                description: '忘記打卡或打卡異常時使用',
                                workflow: ['Manager', 'AdminStaff'],
                                formFields: [
                                    { key: 'date', label: '補打卡日期', type: 'date', required: true },
                                    { key: 'time', label: '補打卡時間', type: 'time', required: true },
                                    { key: 'type', label: '打卡類型', type: 'select', options: ['上班', '下班'], required: true },
                                    { key: 'reason', label: '補打卡原因', type: 'text', required: true }
                                ],
                                updatedAt: new Date().toISOString()
                            });
                        }
                        return templates;
                    })
            ]);

            setCustomers(customersData);
            // Migration Logic: Strong Cleanup & Fixes
            let processedTeamData = [...initialTeamData];

            // 1. Purge Virtual Members (Force cleanup for ALL departments)
            const PURGE_NAMES = ['林志豪', '陳建宏', '黃國華', '李美玲', '李大維', '張家銘', '陳小美', '王雪芬'];
            const PURGE_PREFIXES = ['T-', 'CEO'];

            const originalCount = processedTeamData.length;
            processedTeamData = processedTeamData.filter((m: any) => {
                const isPurgeName = PURGE_NAMES.includes(m.name);
                const isPurgeId = typeof m.id === 'string' && PURGE_PREFIXES.some(prefix => m.id.startsWith(prefix) && m.id.length < 8);
                return !isPurgeName && !isPurgeId;
            });

            if (processedTeamData.length < originalCount) {
                console.log(`[Migration] Purged ${originalCount - processedTeamData.length} virtual members. FORCE SAVING...`);
                const storageKey = dept === 'FirstDept' ? 'bt_team' : (dept === 'ThirdDept' ? 'dept3_bt_team' : 'bt_team');
                storageService.setItem(storageKey, processedTeamData);
            }

            // 2. Fix Data Integrity for Real Users
            processedTeamData.forEach((m: any) => {
                if (m.salaryType === 'monthly' && m.monthlySalary === undefined) {
                    m.monthlySalary = 0;
                }
                if ((m.salaryType === 'daily' || m.dailyRate > 0) && !m.workStartTime) {
                    console.log(`[Migration] Setting default work hours for daily worker: ${m.name}`);
                    m.workStartTime = '08:00';
                    m.workEndTime = '17:00';
                }
                if (m.workDaysPerWeek === undefined) m.workDaysPerWeek = 5;
                if (m.lunchBonus === undefined) m.lunchBonus = 0;
            });

            // Emergency Restore for JK001 (If missing)
            if (!processedTeamData.some((m: any) => m.name === '陳信寬' || m.employeeId === 'JK001')) {
                processedTeamData.push({
                    id: 'JK001',
                    employeeId: 'JK001',
                    name: '陳信寬',
                    role: '工務主管',
                    systemRole: 'DeptAdmin',
                    departmentId: 'DEPT-4',
                    departmentIds: ['DEPT-4'],
                    phone: '',
                    email: '',
                    status: 'Available',
                    activeProjectsCount: 0,
                    avatar: '',
                    specialty: [],
                    certifications: [],
                    joinDate: new Date().toISOString().split('T')[0],
                    salaryType: 'monthly',
                    monthlySalary: 80000,
                    dailyRate: 0,
                    workStartTime: '09:00',
                    workEndTime: '18:00'
                });
                console.log('[Migration] Emergency restored JK001 陳信寬');
                const storageKey = dept === 'FirstDept' ? 'bt_team' : (dept === 'ThirdDept' ? 'dept3_bt_team' : 'bt_team');
                storageService.setItem(storageKey, processedTeamData);
            }

            setTeamMembers(processedTeamData.map((m: any) => ({
                ...m,
                specialty: m.specialty || [],
                certifications: m.certifications || [],
                departmentIds: m.departmentIds || [m.departmentId]
            })));
            setVendors(vendorsData);
            setLeads(leadsData);
            setInventoryItems(inventoryData);
            setInventoryLocations(locationsData);
            setPurchaseOrders(purchaseOrdersData);
            setAttendanceRecords(attendanceData);
            setPayrollRecords(payrollData);
            setApprovalRequests(approvalRequestsData);
            setApprovalTemplates(approvalTemplatesData);
            setActivityLogs(logsData);

            const quotationsData = await storageService.getItem<Quotation[]>(`${prefix}bt_quotations`, []);
            setQuotations(quotationsData);

            const calendarEventsData = await storageService.getItem<SystemCalendarEvent[]>(`${prefix}bt_calendar_events`, []);
            setCalendarEvents(calendarEventsData);

            setInitialSyncDone(true);
            setIsInitializing(false);
            console.log('System initialized successfully');

            // Auto Connect
            try {
                await autoConnectCloud();
            } catch (e) {
                console.warn('Supabase 連線失敗', e);
            }

        } catch (err) {
            console.error('Initialization failed', err);
            setIsInitializing(false);
        }
    }, [normalizeProjects, autoConnectCloud,
        setProjects, setCustomers, setTeamMembers, setVendors, setLeads,
        setActivityLogs, setInventoryItems, setInventoryLocations,
        setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
        setApprovalRequests, setApprovalTemplates, setQuotations, setCalendarEvents,
        setInitialSyncDone, setIsInitializing]);

    // Startup Effect — 只執行一次
    const hasStartedRef = useRef(false);
    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        let safetyTimeout: any;

        const startup = async () => {
            safetyTimeout = setTimeout(() => {
                setIsInitializing(false);
                console.warn('啟動超時：進入自動跳過模式');
            }, 5000);

            try {
                const savedUser = localStorage.getItem('bt_user');
                if (savedUser) {
                    try {
                        const parsedUser = JSON.parse(savedUser);
                        setUser(parsedUser);
                        const dept = parsedUser.department || 'FirstDept';
                        setCurrentDept(dept);
                        setViewingDeptId(parsedUser.role === 'SuperAdmin' || parsedUser.role === 'Guest' ? 'all' : (parsedUser.departmentId || 'DEPT-1'));
                        loadSystemData(dept);
                    } catch (e) {
                        console.error('Saved user parse error', e);
                        localStorage.removeItem('bt_user');
                        setIsInitializing(false);
                    }
                } else {
                    setIsInitializing(false);
                }
            } catch (e) {
                setIsInitializing(false);
            }
        };
        startup();

        return () => clearTimeout(safetyTimeout);
    }, [loadSystemData, setUser, setCurrentDept, setViewingDeptId, setIsInitializing]);

    return { loadSystemData };
};
