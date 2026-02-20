import { supabaseDb } from './supabaseDb';
import { supabase } from './supabaseClient';
import { Project, Customer, TeamMember, Vendor, Lead, InventoryItem, InventoryLocation, PurchaseOrder, AttendanceRecord, PayrollRecord, ApprovalRequest, ApprovalTemplate, ActivityLog, Quotation, SystemCalendarEvent } from '../types';

export const supabaseSyncService = {
    /**
     * 從 Supabase 載入所有資料集合，並組合成跟舊版一樣的巨型物件
     */
    loadFromCloud: async (): Promise<any> => {
        try {
            console.log('[Supabase] Pulling all collections from cloud...');
            const [
                projects, customers, teamMembers, vendors, leads,
                inventory, locations, purchaseOrders, attendance, payroll,
                approvalRequests, approvalTemplates, activityLogs, quotations, calendarEvents
            ] = await Promise.all([
                supabaseDb.getCollection<Project>('projects'),
                supabaseDb.getCollection<Customer>('customers'),
                supabaseDb.getCollection<TeamMember>('teamMembers'),
                supabaseDb.getCollection<Vendor>('vendors'),
                supabaseDb.getCollection<Lead>('leads'),
                supabaseDb.getCollection<InventoryItem>('inventoryItems'),
                supabaseDb.getCollection<InventoryLocation>('inventoryLocations'),
                supabaseDb.getCollection<PurchaseOrder>('purchaseOrders'),
                supabaseDb.getCollection<AttendanceRecord>('attendanceRecords'),
                supabaseDb.getCollection<PayrollRecord>('payrollRecords'),
                supabaseDb.getCollection<ApprovalRequest>('approvalRequests'),
                supabaseDb.getCollection<ApprovalTemplate>('approvalTemplates'),
                supabaseDb.getCollection<ActivityLog>('activityLogs'),
                supabaseDb.getCollection<Quotation>('quotations'),
                supabaseDb.getCollection<SystemCalendarEvent>('calendarEvents')
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
    saveToCloud: async (data: any, throwError: boolean = false): Promise<boolean> => {
        try {
            console.log('[Supabase] Pushing all collections to cloud...');
            const results = await Promise.allSettled([
                supabaseDb.setCollection('projects', data.projects || []),
                supabaseDb.setCollection('customers', data.customers || []),
                supabaseDb.setCollection('teamMembers', data.teamMembers || []),
                supabaseDb.setCollection('vendors', data.vendors || []),
                supabaseDb.setCollection('leads', data.leads || []),
                supabaseDb.setCollection('inventoryItems', data.inventory || []),
                supabaseDb.setCollection('inventoryLocations', data.locations || []),
                supabaseDb.setCollection('purchaseOrders', data.purchaseOrders || []),
                supabaseDb.setCollection('attendanceRecords', data.attendance || []),
                supabaseDb.setCollection('payrollRecords', data.payroll || []),
                supabaseDb.setCollection('approvalRequests', data.approvalRequests || []),
                supabaseDb.setCollection('approvalTemplates', data.approvalTemplates || []),
                supabaseDb.setCollection('activityLogs', data.activityLogs || []),
                supabaseDb.setCollection('quotations', data.quotations || []),
                supabaseDb.setCollection('calendarEvents', data.calendarEvents || [])
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
            const { data, error } = await supabase
                .from('app_data')
                .select('updated_at')
                .order('updated_at', { ascending: false })
                .limit(1);

            if (error) throw error;
            if (data && data.length > 0) {
                // 回傳這筆最新的時間
                return new Date(data[0].updated_at).getTime().toString();
            }
            return null;
        } catch (e) {
            return null;
        }
    }
};
