import { firestoreDb } from './firestoreDb';
import { Project, Customer, TeamMember, Vendor, Lead, InventoryItem, InventoryLocation, PurchaseOrder, AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate, ActivityLog, Quotation, SystemCalendarEvent } from '../types';

export const firestoreSyncService = {
    /**
     * 測試 Firestore 連線
     */
    pingCloud: async (): Promise<boolean> => {
        try {
            return await firestoreDb.ping();
        } catch (e) {
            return false;
        }
    },

    /**
     * 從 Firestore 載入所有資料集合
     */
    loadFromCloud: async (onProgress?: (msg: string, current: number, total: number) => void): Promise<any> => {
        try {
            if (onProgress) onProgress('正在連線 Firebase...', 0, 15);

            const total = 15;
            let current = 0;
            const wrap = async <T>(promise: Promise<T>, msg: string) => {
                const res = await promise;
                current++;
                if (onProgress) onProgress(msg, current, total);
                return res;
            };

            const [
                projects, customers, teamMembers, vendors, leads,
                inventory, locations, purchaseOrders, attendance, payroll,
                approvalRequests, approvalTemplates, activityLogs, quotations, calendarEvents
            ] = await Promise.all([
                wrap(firestoreDb.getCollection<Project>('projects'), '下載專案資料'),
                wrap(firestoreDb.getCollection<Customer>('customers'), '下載客戶資料'),
                wrap(firestoreDb.getCollection<TeamMember>('teamMembers'), '下載團隊資料'),
                wrap(firestoreDb.getCollection<Vendor>('vendors'), '下載廠商資料'),
                wrap(firestoreDb.getCollection<Lead>('leads'), '下載線索資料'),
                wrap(firestoreDb.getCollection<InventoryItem>('inventoryItems'), '下載庫存資料'),
                wrap(firestoreDb.getCollection<InventoryLocation>('inventoryLocations'), '下載倉位資料'),
                wrap(firestoreDb.getCollection<PurchaseOrder>('purchaseOrders'), '下載採購單'),
                wrap(firestoreDb.getCollection<AttendanceRecord>('attendanceRecords'), '下載考勤資料'),
                wrap(firestoreDb.getCollection<PayrollRecord>('payrollRecords'), '下載薪資資料'),
                wrap(firestoreDb.getCollection<ApprovalRequest>('approvalRequests'), '下載簽核資料'),
                wrap(firestoreDb.getCollection<ApprovalTemplate>('approvalTemplates'), '下載簽核範本'),
                wrap(firestoreDb.getCollection<ActivityLog>('activityLogs'), '下載活動紀錄'),
                wrap(firestoreDb.getCollection<Quotation>('quotations'), '下載報價單'),
                wrap(firestoreDb.getCollection<SystemCalendarEvent>('calendarEvents'), '下載行事曆')
            ]);

            return {
                projects, customers, teamMembers, vendors, leads,
                inventory, locations, purchaseOrders, attendance, payroll,
                approvalRequests, approvalTemplates, activityLogs, quotations, calendarEvents
            };
        } catch (e) {
            console.error('[Firebase] loadFromCloud failed', e);
            return null;
        }
    },

    /**
     * 將所有集合推送到 Firestore
     */
    saveToCloud: async (data: any, throwError: boolean = false, onProgress?: (msg: string, current: number, total: number) => void): Promise<boolean> => {
        try {
            const total = 15;
            let current = 0;
            const wrap = async (promise: Promise<boolean>, msg: string) => {
                const res = await promise;
                current++;
                if (onProgress) onProgress(msg, current, total);
                return res;
            };

            const results = await Promise.all([
                wrap(firestoreDb.setCollection('projects', data.projects || []), '上傳專案資料'),
                wrap(firestoreDb.setCollection('customers', data.customers || []), '上傳客戶資料'),
                wrap(firestoreDb.setCollection('teamMembers', data.teamMembers || []), '上傳團隊資料'),
                wrap(firestoreDb.setCollection('vendors', data.vendors || []), '上傳廠商資料'),
                wrap(firestoreDb.setCollection('leads', data.leads || []), '上傳線索資料'),
                wrap(firestoreDb.setCollection('inventoryItems', data.inventory || []), '上傳庫存資料'),
                wrap(firestoreDb.setCollection('inventoryLocations', data.locations || []), '上傳倉位資料'),
                wrap(firestoreDb.setCollection('purchaseOrders', data.purchaseOrders || []), '上傳採購單'),
                wrap(firestoreDb.setCollection('attendanceRecords', data.attendance || []), '上傳考勤資料'),
                wrap(firestoreDb.setCollection('payrollRecords', data.payroll || []), '上傳薪資資料'),
                wrap(firestoreDb.setCollection('approvalRequests', data.approvalRequests || []), '上傳簽核資料'),
                wrap(firestoreDb.setCollection('approvalTemplates', data.approvalTemplates || []), '上傳簽核範本'),
                wrap(firestoreDb.setCollection('activityLogs', (data.activityLogs || []).slice(0, 200)), '上傳活動紀錄'),
                wrap(firestoreDb.setCollection('quotations', data.quotations || []), '上傳報價單'),
                wrap(firestoreDb.setCollection('calendarEvents', data.calendarEvents || []), '上傳行事曆')
            ]);

            return results.every(r => r);
        } catch (e) {
            console.error('[Firebase] saveToCloud failed', e);
            if (throwError) throw e;
            return false;
        }
    },

    /**
     * 取得最後修改時間 (用 _meta 文件追蹤)
     */
    getLatestModifiedTime: async (): Promise<string | null> => {
        try {
            const meta = await firestoreDb.getCollection<any>('_meta');
            if (meta.length > 0) {
                return meta[0].lastModified || null;
            }
            return null;
        } catch (e) {
            return null;
        }
    },

    /**
     * 更新最後修改時間
     */
    updateModifiedTime: async (): Promise<void> => {
        try {
            await firestoreDb.setCollection('_meta', [{
                id: 'sync_info',
                lastModified: new Date().toISOString()
            }]);
        } catch (e) {
            console.error('[Firebase] Failed to update modified time', e);
        }
    }
};
