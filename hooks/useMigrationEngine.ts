import React, { useState, useCallback } from 'react';
import { supabaseDb } from '../services/supabaseDb';
import { Project, Customer, TeamMember, Vendor, Lead, InventoryItem, InventoryLocation, PurchaseOrder, AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate, ActivityLog, Quotation, User, SystemCalendarEvent } from '../types';
import { useAppData } from './useAppData';

interface MigrationEngineDeps {
    user: User | null;
    appData: ReturnType<typeof useAppData>;
}

export const useMigrationEngine = ({ user, appData }: MigrationEngineDeps) => {
    const [isMigrating, setIsMigrating] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 10, task: '' });
    const [error, setError] = useState<string | null>(null);

    const performMigration = useCallback(async () => {
        if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) {
            setError('權限不足，僅系統管理員可執行資料庫升級作業。');
            return;
        }

        const confirmB = confirm('即將執行最高級別保護的「資料庫雙寫遷移作業」。\n\n系統將會把您目前存放在本機與舊版雲端的所有專案、客戶等資源，分批上傳至 Supabase 企業級資料庫。\n\n過程中請勿關閉網頁，請按確定開始。');
        if (!confirmB) return;

        setIsMigrating(true);
        setError(null);
        setProgress({ current: 0, total: 14, task: '準備搬遷...' });

        try {
            const dataRef = appData.dataRef.current;
            const steps = [
                { name: '專案(Projects)', collection: 'projects', data: dataRef.projects },
                { name: '客戶(Customers)', collection: 'customers', data: dataRef.customers },
                { name: '團隊成員(Team)', collection: 'teamMembers', data: dataRef.teamMembers },
                { name: '廠商(Vendors)', collection: 'vendors', data: dataRef.vendors },
                { name: '商機(Leads)', collection: 'leads', data: dataRef.leads },
                { name: '庫存項目(Inventory)', collection: 'inventoryItems', data: dataRef.inventoryItems },
                { name: '庫存地點(Locations)', collection: 'inventoryLocations', data: dataRef.inventoryLocations },
                { name: '採購單(Orders)', collection: 'purchaseOrders', data: dataRef.purchaseOrders },
                { name: '出勤紀錄(Attendance)', collection: 'attendanceRecords', data: dataRef.attendanceRecords },
                { name: '薪資紀錄(Payroll)', collection: 'payrollRecords', data: dataRef.payrollRecords },
                { name: '簽核申請(ApprovalReq)', collection: 'approvalRequests', data: dataRef.approvalRequests },
                { name: '簽核流程範本(ApprovalTpl)', collection: 'approvalTemplates', data: dataRef.approvalTemplates },
                { name: '活動紀錄(Logs)', collection: 'activityLogs', data: dataRef.activityLogs },
                { name: '報價單(Quotations)', collection: 'quotations', data: dataRef.quotations }
            ];

            let count = 0;
            for (const step of steps) {
                count++;
                setProgress({ current: count, total: steps.length, task: `上傳 ${step.name}... (${step.data?.length || 0} 筆)` });
                if (step.data && Array.isArray(step.data) && step.data.length > 0) {
                    const success = await supabaseDb.setCollection(step.collection, step.data as any[]);
                    if (!success) throw new Error(`${step.name} 寫入失敗`);
                }
            }

            setProgress({ current: steps.length, total: steps.length, task: '升級完成！' });
            alert('🎉 恭喜！資料庫雙寫升級圓滿完成！您現在受到最高規格的 Supabase 資料保護。');
        } catch (e: any) {
            console.error('Migration failed:', e);
            setError(`升級作業中斷: ${e.message}`);
        } finally {
            setIsMigrating(false);
        }

    }, [user, appData.dataRef]);

    return { performMigration, isMigrating, progress, error };
};
