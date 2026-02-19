import { useCallback } from 'react';
import {
    Project, ProjectStatus, Customer, TeamMember, User, ActivityLog,
    Vendor, ProjectComment, DailyLogEntry, ChecklistTask, PaymentStage,
    InventoryItem, InventoryLocation, PurchaseOrder,
    AttendanceRecord, ApprovalRequest, ApprovalTemplate, Quotation, Lead
} from '../types';

interface EntityHandlerDeps {
    user: User | null;
    // State setters
    setProjects: (fn: any) => void;
    setCustomers: (fn: any) => void;
    setTeamMembers: (fn: any) => void;
    setActivityLogs: (fn: any) => void;
    setVendors: (fn: any) => void;
    setLeads: (fn: any) => void;
    setInventoryItems: (fn: any) => void;
    setInventoryLocations: (fn: any) => void;
    setPurchaseOrders: (fn: any) => void;
    setAttendanceRecords: (fn: any) => void;
    setApprovalRequests: (fn: any) => void;
    setApprovalTemplates: (fn: any) => void;
    setQuotations: (fn: any) => void;
    // Data
    projects: Project[];
    leads: Lead[];
    approvalTemplates: ApprovalTemplate[];
    inventoryLocations: InventoryLocation[];
    purchaseOrders: PurchaseOrder[];
    inventoryItems: InventoryItem[];
    activityLogs: ActivityLog[];
    quotations: Quotation[];
    // Actions
    addActivityLog: (action: string, targetName: string, targetId: string, type: ActivityLog['type']) => void;
    viewingDeptId: string;
    setActiveTab: (tab: string) => void;
    setSelectedProjectId: (id: string | null) => void;
    setQuotationSystemParams: (params: { projectId?: string; quotationId?: string } | null) => void;
}

/**
 * 集中管理所有實體 (Project, Customer, Team, Vendor, Inventory 等) 的
 * CRUD handler 函式，減少 App.tsx 的行數和複雜度。
 */
export const useEntityHandlers = (deps: EntityHandlerDeps) => {
    const {
        user, setProjects, setCustomers, setTeamMembers, setActivityLogs,
        setVendors, setLeads, setInventoryItems, setInventoryLocations,
        setPurchaseOrders, setAttendanceRecords, setApprovalRequests,
        setApprovalTemplates, setQuotations,
        projects, leads, approvalTemplates, inventoryLocations, purchaseOrders, inventoryItems, activityLogs, quotations,
        addActivityLog, viewingDeptId, setActiveTab, setSelectedProjectId, setQuotationSystemParams
    } = deps;

    // ============ 打卡 ============
    const handleClockRecord = useCallback((type: 'work-start' | 'work-end', location: { lat: number; lng: number; address?: string }, customTimestamp?: string) => {
        if (!user) return;
        const employeeId = user.id;
        const isSupplement = !!customTimestamp;
        const recordTime = customTimestamp || new Date().toISOString();

        const newRecord: AttendanceRecord = {
            id: crypto.randomUUID(),
            employeeId,
            name: user.name,
            type,
            timestamp: recordTime,
            location,
            departmentId: user.department === 'FirstDept' ? 'DEPT-4' : 'DEPT-8'
        };

        setAttendanceRecords((prev: AttendanceRecord[]) => [...prev, newRecord]);

        if (!isSupplement) {
            setTeamMembers((prev: TeamMember[]) => prev.map(member => {
                if (member.id === user.id || member.employeeId === user.id || member.name === user.name) {
                    return { ...member, status: type === 'work-start' ? 'Available' : 'OffDuty', currentWorkStatus: type === 'work-start' ? 'OnDuty' : 'OffDuty', updatedAt: new Date().toISOString() };
                }
                return member;
            }));
        }

        const action = type === 'work-start' ? '上班' : '下班';
        const displayTime = new Date(recordTime).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        alert(`${isSupplement ? '✅ 補打卡' : action + '打卡'}成功！\n${isSupplement ? '記錄類型：' + action : '狀態變更：' + (type === 'work-start' ? '上班中' : '未上班')}\n時間：${displayTime}\n地點：${location.address || 'GPS ' + location.lat.toFixed(4)}`);
    }, [user, setAttendanceRecords, setTeamMembers]);

    // ============ 匯入 ============
    const handleImportRecords = useCallback((newRecords: AttendanceRecord[]) => {
        setAttendanceRecords((prev: AttendanceRecord[]) => [...prev, ...newRecords]);
        addActivityLog('批量匯入打卡紀錄', `${newRecords.length} 筆`, 'IMPORT', 'system');
    }, [setAttendanceRecords, addActivityLog]);

    const handleImportLeaves = useCallback((newRequests: ApprovalRequest[]) => {
        setApprovalRequests((prev: ApprovalRequest[]) => [...prev, ...newRequests]);
        addActivityLog('批量匯入請假紀錄', `${newRequests.length} 筆`, 'IMPORT', 'system');
    }, [setApprovalRequests, addActivityLog]);

    // ============ 簽核 ============
    const handleSaveApprovalRequest = useCallback((request: ApprovalRequest) => {
        setApprovalRequests((prev: ApprovalRequest[]) => [request, ...prev]);
        addActivityLog('提交了簽核申請', request.title, request.id, 'system');
    }, [setApprovalRequests, addActivityLog]);

    const handleSaveApprovalTemplate = useCallback((template: ApprovalTemplate) => {
        setApprovalTemplates((prev: ApprovalTemplate[]) => {
            const exists = prev.find(t => t.id === template.id);
            if (exists) return prev.map(t => t.id === template.id ? template : t);
            return [...prev, template];
        });
        addActivityLog('更新了簽核流程設定', template.name, template.id, 'system');
    }, [setApprovalTemplates, addActivityLog]);

    const handleDeleteApprovalTemplate = useCallback((id: string) => {
        if (confirm('確定要刪除此簽核流程？這不會影響已提交的申請。')) {
            const t = approvalTemplates.find(x => x.id === id);
            setApprovalTemplates((prev: ApprovalTemplate[]) => prev.filter(x => x.id !== id));
            if (t) addActivityLog('刪除了簽核流程', t.name, id, 'system');
        }
    }, [approvalTemplates, setApprovalTemplates, addActivityLog]);

    const handleApprovalAction = useCallback((requestId: string, action: 'approved' | 'rejected', comment?: string) => {
        if (!user) return;
        setApprovalRequests((prev: ApprovalRequest[]) => prev.map(req => {
            if (req.id !== requestId) return req;
            const template = approvalTemplates.find(t => t.id === req.templateId);
            if (!template) return req;
            const newLog = {
                step: req.currentStep,
                role: template.workflow[req.currentStep],
                approverId: user.id,
                approverName: user.name,
                status: action,
                comment,
                timestamp: new Date().toISOString()
            };
            const nextStep = req.currentStep + 1;
            const isFinished = action === 'rejected' || nextStep >= template.workflow.length;
            return {
                ...req,
                status: action === 'rejected' ? 'rejected' : (isFinished ? 'approved' : 'pending'),
                currentStep: isFinished ? req.currentStep : nextStep,
                workflowLogs: [...req.workflowLogs, newLog],
                updatedAt: new Date().toISOString(),
                completedAt: isFinished ? new Date().toISOString() : undefined
            };
        }));
        const actStr = action === 'approved' ? '核准' : '駁回';
        addActivityLog(`${actStr}了簽核申請`, requestId, requestId, 'system');
    }, [user, approvalTemplates, setApprovalRequests, addActivityLog]);

    // ============ 專案狀態 ============
    const handleUpdateStatus = useCallback((projectId: string, status: ProjectStatus) => {
        if (user?.role === 'Guest') return;
        const project = projects.find(p => p.id === projectId);
        if (project) addActivityLog(`變更專案狀態：${status} `, project.name, projectId, 'project');
        setProjects((prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, status, statusChangedAt: new Date().toISOString(), updatedAt: new Date().toISOString() } : p));
    }, [user?.role, projects, setProjects, addActivityLog]);

    // ============ 專案留言 ============
    const handleAddComment = useCallback((projectId: string, text: string) => {
        if (!user || user.role === 'Guest') return;
        const project = projects.find(p => p.id === projectId);
        const newComment: ProjectComment = {
            id: Date.now().toString(),
            authorName: user.name,
            authorAvatar: user.picture,
            authorRole: user.role === 'SuperAdmin' ? '管理總監' : '成員',
            text,
            timestamp: new Date().toLocaleString('zh-TW', { hour12: false }) || new Date().toISOString()
        };
        if (project) addActivityLog(`在案件中留言`, project.name, projectId, 'project');
        setProjects((prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, comments: [newComment, ...(p.comments || [])], updatedAt: new Date().toISOString() } : p));
    }, [user, projects, setProjects, addActivityLog]);

    // ============ 施工日誌 ============
    const handleAddDailyLog = useCallback((projectId: string, logData: { content: string, photoUrls: string[] }) => {
        if (!user || user.role === 'Guest') return;
        const newLog: DailyLogEntry = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            content: logData.content,
            photoUrls: logData.photoUrls,
            authorId: user.id || 'unknown',
            authorName: user.name,
            authorAvatar: user.picture
        };
        setProjects((prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, dailyLogs: [newLog, ...(p.dailyLogs || [])], updatedAt: new Date().toISOString() } : p));
    }, [user, setProjects]);

    // ============ Checklist / Payments ============
    const handleUpdateChecklist = useCallback((projectId: string, checklist: ChecklistTask[]) => {
        setProjects((prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, checklist, updatedAt: new Date().toISOString() } : p));
    }, [setProjects]);

    const handleUpdatePayments = useCallback((projectId: string, payments: PaymentStage[]) => {
        setProjects((prev: Project[]) => prev.map(p => p.id === projectId ? { ...p, payments, updatedAt: new Date().toISOString() } : p));
    }, [setProjects]);

    // ============ 標記已讀 ============
    const handleMarkLogAsRead = useCallback((logId: string) => {
        setActivityLogs((prev: ActivityLog[]) => prev.map(log => log.id === logId ? { ...log, isRead: true } : log));
    }, [setActivityLogs]);

    const handleMarkAllLogsAsRead = useCallback(() => {
        setActivityLogs((prev: ActivityLog[]) => prev.map(log => ({ ...log, isRead: true })));
    }, [setActivityLogs]);

    // ============ 會勘轉專案 ============
    const handleConvertLead = useCallback((leadId: string) => {
        const lead = leads.find(l => l.id === leadId);
        if (!lead) return;

        const newProject: any = {
            id: `AI${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${Math.floor(100 + Math.random() * 900)}`,
            departmentId: viewingDeptId === 'all' ? 'DEPT-1' : viewingDeptId,
            name: `${lead.customerName} - 智慧抓漏會勘件`,
            category: '室內裝修',
            source: 'AI會勘系統',
            client: lead.customerName,
            referrer: 'Tiiny Web App',
            manager: user?.name || '',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            createdDate: new Date().toISOString().split('T')[0],
            budget: 0, spent: 0, progress: 0,
            status: ProjectStatus.NEGOTIATING,
            tasks: [], phases: [], checklist: [], payments: [],
            updatedAt: new Date().toISOString(),
            inspectionData: {
                diagnosis: lead.diagnosis,
                suggestedFix: '待現場覆核後提供完整對策',
                originalPhotos: lead.photos,
                aiAnalysis: '初步特徵符合漏水徵兆，內容由智慧抓漏系統 v8.1 自動生成。',
                timestamp: lead.timestamp
            },
            financials: { labor: 0, material: 0, subcontractor: 0, other: 0 }
        };

        setProjects((prev: Project[]) => [newProject, ...prev]);
        setLeads((prev: Lead[]) => prev.map(l => l.id === leadId ? { ...l, status: 'converted' as const } : l));
        addActivityLog('將會勘線索轉為專案', newProject.name, newProject.id, 'project');
        setActiveTab('projects');
        setSelectedProjectId(newProject.id);
    }, [leads, user?.name, viewingDeptId, setProjects, setLeads, addActivityLog, setActiveTab, setSelectedProjectId]);

    // ============ 測試專案 ============
    const handleAddTestProject = useCallback(() => {
        const today = new Date().toISOString().split('T')[0];
        const testId = `TEST-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(100 + Math.random() * 900)}`;

        const testProject: any = {
            id: testId,
            departmentId: viewingDeptId === 'all' ? 'DEPT-1' : viewingDeptId,
            name: '系統測試案件 - 萬大路室內裝修工程',
            category: '室內裝修',
            source: '系統測試',
            client: '測試客戶 (林先生)',
            location: { address: '台北市萬華區萬大路 123 號 5 樓', lat: 25.029, lng: 121.498 },
            manager: user?.name || '測試經理',
            startDate: today,
            endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
            createdDate: today,
            budget: 1200000, spent: 0, progress: 15,
            status: ProjectStatus.CONSTRUCTING,
            tasks: [
                { id: 'T-1', title: '現場放樣與水電確認', status: 'Done', priority: 'High', dueDate: today, assignee: user?.name || 'Manager' },
                { id: 'T-2', title: '拆除牆面與清運', status: 'Done', priority: 'Medium', dueDate: today, assignee: user?.name || 'Manager' },
                { id: 'T-3', title: '泥作粉刷工程', status: 'Todo', priority: 'Medium', dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0], assignee: user?.name || 'Manager' }
            ],
            phases: [
                { id: 'P-1', name: '準備階段', startDate: today, endDate: today, status: 'Completed', progress: 100 },
                { id: 'P-2', name: '拆除工程', startDate: today, endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: 'Current', progress: 50 },
                { id: 'P-3', name: '泥作工程', startDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0], status: 'Upcoming', progress: 0 }
            ],
            checklist: [
                { id: 'C-1', title: '合約用印與簽署 (合約與文件)', isDone: true },
                { id: 'C-2', title: '室內裝修審查申請 (合約與文件)', isDone: false }
            ],
            payments: [
                { id: 'PY-1', stage: '開工案', amount: 360000, dueDate: today, status: 'paid', datePaid: today, label: '第一期', notes: '' },
                { id: 'PY-2', stage: '泥作完成', amount: 360000, dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0], status: 'pending', label: '第二期', notes: '' }
            ],
            updatedAt: new Date().toISOString(),
            financials: { labor: 0, material: 0, subcontractor: 0, other: 0 }
        };

        setProjects((prev: Project[]) => [testProject, ...prev]);
        addActivityLog('新增測試案件', testProject.name, testProject.id, 'project');
        setSelectedProjectId(testProject.id);
    }, [viewingDeptId, user?.name, setProjects, addActivityLog, setSelectedProjectId]);

    // ============ 專案 CRUD (ProjectModal onConfirm) ============
    const handleSaveProject = useCallback((data: any, editingProject: Project | null) => {
        const sourcePrefixes: Record<string, string> = {
            'BNI': 'BNI', '台塑集團': 'FPC', '士林電機': 'SE', '信義居家': 'SY',
            '企業': 'CORP', '新建工程': 'NEW', '網路客': 'OC', '住宅': 'AB',
            'JW': 'JW', '台灣美光晶圓': 'MIC', 'AI會勘系統': 'AI'
        };

        if (editingProject) {
            addActivityLog('更新了專案資訊', data.name, editingProject.id, 'project');
            setProjects((prev: Project[]) => {
                const originalProject = prev.find(p => p.id === editingProject.id);
                if (!originalProject) return prev;

                let updatedId = originalProject.id;
                if (data.source && data.source !== originalProject.source) {
                    const oldPrefix = sourcePrefixes[originalProject.source] || 'PJ';
                    const newPrefix = sourcePrefixes[data.source] || 'PJ';
                    updatedId = originalProject.id.replace(oldPrefix, newPrefix);
                }
                const statusChangedAt = data.status !== originalProject.status ? new Date().toISOString() : (originalProject.statusChangedAt || originalProject.updatedAt || originalProject.createdDate);
                const finalId = data.id && data.id !== editingProject.id ? data.id : updatedId;

                // 同步報價單
                const syncQuotations = () => {
                    if (data.name !== originalProject.name || data.client !== originalProject.client) {
                        setQuotations((prevQuotations: Quotation[]) => prevQuotations.map(q => {
                            if (q.projectId === editingProject.id || q.convertedProjectId === editingProject.id) {
                                const updatedHeader = { ...q.header };
                                if (data.name !== originalProject.name) updatedHeader.projectName = data.name;
                                if (data.client !== originalProject.client) updatedHeader.to = data.client;
                                if (data.location !== originalProject.location) {
                                    const addr = typeof data.location === 'object' && data.location.address ? data.location.address : (typeof data.location === 'string' ? data.location : '');
                                    if (addr) updatedHeader.projectAddress = addr;
                                }
                                return { ...q, header: updatedHeader, updatedAt: new Date().toISOString() };
                            }
                            return q;
                        }));
                    }
                };

                if (finalId === editingProject.id) {
                    syncQuotations();
                    return prev.map(p => p.id === editingProject.id ? { ...p, ...data, statusChangedAt, updatedAt: new Date().toISOString() } : p);
                } else {
                    // ID 變更：舊案標記刪除，新案建立
                    const tombstone = { ...originalProject, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
                    let determinedYear = data.year;
                    if (!determinedYear) {
                        const yearMatch = finalId.match(/(20\d{2})/) || finalId.match(/^[A-Za-z]+(\d{2})/);
                        if (yearMatch) determinedYear = yearMatch[1].length === 2 ? `20${yearMatch[1]}` : yearMatch[1];
                    }
                    if (!determinedYear && data.startDate) determinedYear = data.startDate.split('-')[0];
                    const newProject = { ...originalProject, ...data, id: finalId, year: determinedYear, statusChangedAt, updatedAt: new Date().toISOString() };
                    syncQuotations();
                    return [...prev.map(p => p.id === editingProject.id ? tombstone : p), newProject];
                }
            });
        } else {
            // 新增專案
            const prefix = sourcePrefixes[data.source || 'BNI'] || 'PJ';
            const projectDate = data.startDate ? new Date(data.startDate) : new Date();
            const yearShort = projectDate.getFullYear().toString().slice(-2);
            const month = '01';

            let sequence = 1;
            if (projects.length > 0) {
                const targetPattern = new RegExp(`^${prefix}${yearShort}`);
                const sequences = projects
                    .filter(p => !p.isPurged && targetPattern.test(p.id))
                    .map(p => { const match = p.id.match(/(\d{3})$/); return match ? parseInt(match[1], 10) : 0; })
                    .filter(num => !isNaN(num) && num > 0 && num < 1000);
                if (sequences.length > 0) sequence = Math.max(...sequences) + 1;
            }

            const generatedId = `${prefix}${yearShort}${month}${sequence.toString().padStart(3, '0')}`;
            const finalId = data.id || generatedId;
            addActivityLog('建立新專案', data.name, finalId, 'project');
            setProjects((prev: Project[]) => [{ ...data, id: finalId, status: ProjectStatus.NEGOTIATING, statusChangedAt: new Date().toISOString(), progress: 0, workAssignments: [], expenses: [], comments: [], files: [], phases: [], updatedAt: new Date().toISOString() } as any, ...prev]);
        }
    }, [projects, setProjects, setQuotations, addActivityLog]);

    return {
        handleClockRecord,
        handleImportRecords,
        handleImportLeaves,
        handleSaveApprovalRequest,
        handleSaveApprovalTemplate,
        handleDeleteApprovalTemplate,
        handleApprovalAction,
        handleUpdateStatus,
        handleAddComment,
        handleAddDailyLog,
        handleUpdateChecklist,
        handleUpdatePayments,
        handleMarkLogAsRead,
        handleMarkAllLogsAsRead,
        handleConvertLead,
        handleAddTestProject,
        handleSaveProject,
    };
};
