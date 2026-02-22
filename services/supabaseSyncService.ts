import { supabaseDb } from './supabaseDb';
import { supabase } from './supabaseClient';
import { Project, Customer, TeamMember, Vendor, Lead, InventoryItem, InventoryLocation, PurchaseOrder, AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate, ActivityLog, Quotation, SystemCalendarEvent } from '../types';

export const supabaseSyncService = {
    /**
     * 從 Supabase 載入所有資料集合，並組合成跟舊版一樣的巨型物件
     */
    loadFromCloud: async (onProgress?: (msg: string, current: number, total: number) => void): Promise<any> => {
        try {
            console.log('[Supabase] Pulling all collections from cloud...');
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
                wrap(supabaseDb.getCollection<Project>('projects'), '下載專案資料'),
                wrap(supabaseDb.getCollection<Customer>('customers'), '下載客戶資料'),
                wrap(supabaseDb.getCollection<TeamMember>('teamMembers'), '下載團隊資料'),
                wrap(supabaseDb.getCollection<Vendor>('vendors'), '下載廠商資料'),
                wrap(supabaseDb.getCollection<Lead>('leads'), '下載線索資料'),
                wrap(supabaseDb.getCollection<InventoryItem>('inventoryItems'), '下載庫存資料'),
                wrap(supabaseDb.getCollection<InventoryLocation>('inventoryLocations'), '下載倉位資料'),
                wrap(supabaseDb.getCollection<PurchaseOrder>('purchaseOrders'), '下載採購單'),
                wrap(supabaseDb.getCollection<AttendanceRecord>('attendanceRecords'), '下載考勤資料'),
                wrap(supabaseDb.getCollection<PayrollRecord>('payrollRecords'), '下載薪資資料'),
                wrap(supabaseDb.getCollection<ApprovalRequest>('approvalRequests'), '下載簽核資料'),
                wrap(supabaseDb.getCollection<ApprovalTemplate>('approvalTemplates'), '下載簽核範本'),
                wrap(supabaseDb.getCollection<ActivityLog>('activityLogs'), '下載活動紀錄'),
                wrap(supabaseDb.getCollection<Quotation>('quotations'), '下載報價單'),
                wrap(supabaseDb.getCollection<SystemCalendarEvent>('calendarEvents'), '下載行事曆')
            ]);

            return {
                projects, customers, teamMembers, vendors, leads,
                inventory, locations, purchaseOrders, attendance, payroll,
                approvalRequests, approvalTemplates, activityLogs, quotations, calendarEvents
            };
        } catch (e) {
            console.error('[Supabase] loadFromCloud failed', e);
            return null;
        }
    },

    /**
     * 將所有集合推送到 Supabase (Batch Upserts)
     */
    saveToCloud: async (data: any, throwError: boolean = false, onProgress?: (msg: string, current: number, total: number) => void): Promise<boolean> => {
        try {
            console.log('[Supabase] Pushing all collections to cloud...');
            const total = 15;
            let current = 0;
            const wrap = async (promise: Promise<boolean>, msg: string) => {
                const res = await promise;
                current++;
                if (onProgress) onProgress(msg, current, total);
                return res;
            };

            const results = await Promise.allSettled([
                wrap(supabaseDb.setCollection('projects', data.projects || []), '上傳專案資料'),
                wrap(supabaseDb.setCollection('customers', data.customers || []), '上傳客戶資料'),
                wrap(supabaseDb.setCollection('teamMembers', data.teamMembers || []), '上傳團隊資料'),
                wrap(supabaseDb.setCollection('vendors', data.vendors || []), '上傳廠商資料'),
                wrap(supabaseDb.setCollection('leads', data.leads || []), '上傳線索資料'),
                wrap(supabaseDb.setCollection('inventoryItems', data.inventory || []), '上傳庫存資料'),
                wrap(supabaseDb.setCollection('inventoryLocations', data.locations || []), '上傳倉位資料'),
                wrap(supabaseDb.setCollection('purchaseOrders', data.purchaseOrders || []), '上傳採購單'),
                wrap(supabaseDb.setCollection('attendanceRecords', data.attendance || []), '上傳考勤資料'),
                wrap(supabaseDb.setCollection('payrollRecords', data.payroll || []), '上傳薪資資料'),
                wrap(supabaseDb.setCollection('approvalRequests', data.approvalRequests || []), '上傳簽核資料'),
                wrap(supabaseDb.setCollection('approvalTemplates', data.approvalTemplates || []), '上傳簽核範本'),
                wrap(supabaseDb.setCollection('activityLogs', data.activityLogs || []), '上傳活動紀錄'),
                wrap(supabaseDb.setCollection('quotations', data.quotations || []), '上傳報價單'),
                wrap(supabaseDb.setCollection('calendarEvents', data.calendarEvents || []), '上傳行事曆')
            ]);

            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                console.error('[Supabase] Save had partial failures', failed);
                throw new Error('Partial save failure');
            }

            return true;
        } catch (e) {
            console.error('[Supabase] saveToCloud failed', e);
            if (throwError) throw e;
            return false;
        }
    },

    /**
     * 模擬取得檔案中繼資料（用於判斷是否有更新）
     * Supabase 每一筆紀錄都有更新時間，所以我們用最簡單的一種輪詢：
     * 去看 app_data 裡是否有大於上一次同步時間的一筆資料。
     */
    getLatestModifiedTime: async (): Promise<string | null> => {
        try {
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Supabase request timeout')), 5000)
            );

            const supabasePromise = supabase
                .from('app_data')
                .select('updated_at')
                .order('updated_at', { ascending: false })
                .limit(1);

            const result = await Promise.race([supabasePromise, timeoutPromise]) as any;

            if (result.error) throw result.error;
            if (result.data && result.data.length > 0) {
                // 回傳這筆最新的時間
                return new Date(result.data[0].updated_at).getTime().toString();
            }
            return null;
        } catch (e) {
            return null;
        }
    }
};
