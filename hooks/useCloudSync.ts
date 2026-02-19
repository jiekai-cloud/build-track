import React, { useState, useCallback, useRef } from 'react';
import { User } from '../types';
import { googleDriveService } from '../services/googleDriveService';
import { storageService } from '../services/storageService';

interface CloudSyncDeps {
    // 來自 useAppData
    updateStateWithMerge: (data: any) => void;
    normalizeProjects: (projects: any) => any[];
    dataRef: React.MutableRefObject<any>;
    setProjects: (fn: any) => void;
    setCustomers: (fn: any) => void;
    setTeamMembers: (fn: any) => void;
    setActivityLogs: (fn: any) => void;
    setVendors: (fn: any) => void;
    setInventoryItems: (fn: any) => void;
    setInventoryLocations: (fn: any) => void;
    setPurchaseOrders: (fn: any) => void;
    setAttendanceRecords: (fn: any) => void;
    setPayrollRecords: (fn: any) => void;
    setApprovalRequests: (fn: any) => void;
    setApprovalTemplates: (fn: any) => void;
    setQuotations: (fn: any) => void;
    // 來自 App
    handleLogout: (forced?: boolean) => void;
    user: User | null;
}

/**
 * 集中管理雲端同步 state 與所有同步邏輯
 * - autoConnectCloud: 啟動時自動連線
 * - handleCloudSync: 定期雙向同步
 * - handleConnectCloud: 手動首次連線
 * - handleCloudRestore: 強制還原
 * - heartbeat logic: 背景輪詢
 */
export const useCloudSync = (deps: CloudSyncDeps) => {
    const {
        updateStateWithMerge, normalizeProjects, dataRef,
        setProjects, setCustomers, setTeamMembers, setActivityLogs,
        setVendors, setInventoryItems, setInventoryLocations,
        setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
        setApprovalRequests, setApprovalTemplates, setQuotations,
        handleLogout, user
    } = deps;

    // ============ Cloud State ============
    const [isCloudConnected, setIsCloudConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cloudError, setCloudError] = useState<string | null>(null);
    const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

    const lastRemoteModifiedTime = useRef<string | null>(null);
    const isSyncingRef = useRef(false);
    const syncTimeoutRef = useRef<any>(null);

    // ============ 自動連線雲端 (啟動時) ============
    const autoConnectCloud = useCallback(async () => {
        try {
            await googleDriveService.authenticate('none');
            setIsCloudConnected(true);
            setCloudError(null);

            const metadata = await googleDriveService.getFileMetadata();
            if (metadata) {
                lastRemoteModifiedTime.current = metadata.modifiedTime;
                const cloudData = await googleDriveService.loadFromCloud();
                if (cloudData) {
                    updateStateWithMerge(cloudData);
                    setLastCloudSync(new Date().toLocaleTimeString());
                }
            }
        } catch (e) {
            setCloudError('會話已過期');
        }
    }, [updateStateWithMerge]);

    // ============ 雲端同步 (雙向) ============
    const handleCloudSync = useCallback(async () => {
        if (!isCloudConnected || isSyncingRef.current || user?.role === 'Guest') return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            if (cloudError === '會話已過期') {
                await googleDriveService.authenticate('none');
                setCloudError(null);
            }

            // 先檢查雲端是否有更新
            const metadata = await googleDriveService.getFileMetadata(true);
            if (metadata && lastRemoteModifiedTime.current && metadata.modifiedTime !== lastRemoteModifiedTime.current) {
                console.log('[Sync] Detected newer cloud version...');
                const cloudData = await googleDriveService.loadFromCloud(true);

                if (cloudData) {
                    const localCount = dataRef.current.projects.length;
                    const cloudCount = Array.isArray(cloudData.projects) ? cloudData.projects.length : 0;

                    if (localCount > 3 && cloudCount === 0) {
                        console.warn(`[Sync] ⚠️ DANGER: Cloud data appears empty (${cloudCount}) while local has ${localCount}. IGNORING CLOUD UPDATE.`);
                    } else {
                        console.log('[Sync] Merging cloud data...');
                        updateStateWithMerge(cloudData);
                        lastRemoteModifiedTime.current = metadata.modifiedTime;
                        console.log('[Sync] Cloud merge requested. Pausing upload to allow state update.');
                        setCloudError(null);
                        isSyncingRef.current = false;
                        setIsSyncing(false);
                        return;
                    }
                }
            }

            // 安全檢查：防止用空白資料覆蓋雲端
            const localData = dataRef.current;
            if (!localData.projects || (localData.projects.length === 0 && localData.teamMembers.length <= 1)) {
                console.warn('[Sync] Aborted save: Local state appears empty.');
                isSyncingRef.current = false;
                setIsSyncing(false);
                return;
            }

            const success = await googleDriveService.saveToCloud({
                projects: localData.projects,
                customers: localData.customers,
                teamMembers: localData.teamMembers,
                vendors: localData.vendors,
                leads: localData.leads,
                inventory: localData.inventoryItems,
                locations: localData.inventoryLocations,
                purchaseOrders: localData.purchaseOrders,
                attendance: localData.attendanceRecords,
                payroll: localData.payrollRecords,
                approvalRequests: localData.approvalRequests,
                approvalTemplates: localData.approvalTemplates,
                activityLogs: localData.activityLogs,
                quotations: localData.quotations,
                lastUpdated: new Date().toISOString(),
                userEmail: user?.email
            }, true);

            if (success) {
                const newMetadata = await googleDriveService.getFileMetadata(true);
                if (newMetadata) lastRemoteModifiedTime.current = newMetadata.modifiedTime;
                setLastCloudSync(new Date().toLocaleTimeString());
                setCloudError(null);

                if (user?.role === 'SyncOnly') {
                    setTimeout(() => {
                        alert('✅ 同步完成！系統即將登出，請使用您個人的員工編號正式登入。');
                        handleLogout(true);
                    }, 1500);
                }
            } else {
                const status = googleDriveService.getLastErrorStatus();
                setCloudError(`同步失敗(${status || '?'})`);
            }
        } catch (e: any) {
            console.error('Cloud sync failed:', e);
            if (e.message === 'AUTH_INTERACTION_REQUIRED') {
                setCloudError('需要重新驗證');
            } else {
                setCloudError('同步發生錯誤');
            }
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [isCloudConnected, user?.email, user?.role, updateStateWithMerge, cloudError, handleLogout, dataRef]);

    // ============ 手動首次連線 ============
    const handleConnectCloud = useCallback(async () => {
        if (user?.role === 'Guest') return;
        try {
            setIsSyncing(true);
            setCloudError(null);
            await googleDriveService.authenticate('consent');
            localStorage.setItem('bt_cloud_connected', 'true');
            setIsCloudConnected(true);

            const cloudData = await googleDriveService.loadFromCloud();
            const shouldRestore = (user?.role === 'SyncOnly') || (cloudData && cloudData.projects && confirm('雲端發現現有數據，是否要切換為雲端版本？'));

            if (shouldRestore && cloudData) {
                const teamData = cloudData.teamMembers || [];
                setProjects(normalizeProjects(cloudData.projects || []));
                setCustomers(cloudData.customers || []);
                setTeamMembers(teamData);
                setActivityLogs(cloudData.activityLogs || []);
                setVendors(cloudData.vendors || []);
                setInventoryItems(cloudData.inventory || []);
                setInventoryLocations(cloudData.locations || []);
                setPurchaseOrders(cloudData.purchaseOrders || []);
                setAttendanceRecords(cloudData.attendance || []);
                setPayrollRecords(cloudData.payroll || []);
                setApprovalRequests(cloudData.approvalRequests || []);
                setApprovalTemplates(cloudData.approvalTemplates || []);
                setQuotations(cloudData.quotations || []);
                setLastCloudSync(new Date().toLocaleTimeString());

                // 強制存入 IndexedDB (在登出前確保資料持久化)
                await Promise.all([
                    storageService.setItem('bt_projects', cloudData.projects || []),
                    storageService.setItem('bt_team', teamData),
                    storageService.setItem('bt_customers', cloudData.customers || []),
                    storageService.setItem('bt_vendors', cloudData.vendors || []),
                    storageService.setItem('bt_leads', cloudData.leads || []),
                    storageService.setItem('bt_inventory', cloudData.inventory || []),
                    storageService.setItem('bt_locations', cloudData.locations || []),
                    storageService.setItem('bt_orders', cloudData.purchaseOrders || []),
                    storageService.setItem('bt_attendance', cloudData.attendance || []),
                    storageService.setItem('bt_payroll', cloudData.payroll || []),
                    storageService.setItem('bt_approval_requests', cloudData.approvalRequests || []),
                    storageService.setItem('bt_approval_templates', cloudData.approvalTemplates || []),
                    storageService.setItem('bt_logs', cloudData.activityLogs || []),
                    storageService.setItem('bt_quotations', cloudData.quotations || [])
                ]);

                if (user?.role === 'SyncOnly') {
                    setTimeout(() => {
                        alert('✅ 數據同步完成！請使用您的「員工編號」正式登入。');
                        handleLogout(true);
                    }, 800);
                } else {
                    alert('✅ 已成功切換為雲端版本數據。');
                }
            }
        } catch (err: any) {
            setCloudError('驗證失敗');
        } finally {
            setIsSyncing(false);
        }
    }, [user?.role, normalizeProjects, handleLogout,
        setProjects, setCustomers, setTeamMembers, setActivityLogs, setVendors,
        setInventoryItems, setInventoryLocations, setPurchaseOrders,
        setAttendanceRecords, setPayrollRecords, setApprovalRequests,
        setApprovalTemplates, setQuotations]);

    // ============ 強制雲端還原 ============
    const handleCloudRestore = useCallback(async () => {
        try {
            setIsSyncing(true);
            const cloudData = await googleDriveService.loadFromCloud(false);
            if (cloudData) {
                updateStateWithMerge(cloudData);
                const metadata = await googleDriveService.getFileMetadata(false);
                if (metadata) lastRemoteModifiedTime.current = metadata.modifiedTime;
                alert('✅ 已從雲端強制同步最新數據。');
            } else {
                alert('❌ 雲端無可用數據。');
            }
        } catch (e) {
            alert('還原失敗，請檢查網路。');
        } finally {
            setIsSyncing(false);
        }
    }, [updateStateWithMerge]);

    // ============ 排程自動同步 (資料變更後延遲 10 秒) ============
    const scheduleSyncIfNeeded = useCallback((isMasterTab: boolean) => {
        if (isCloudConnected && !cloudError && user?.role !== 'Guest' && isMasterTab) {
            // Debounce: Clear existing timer to restart the countdown
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

            console.log('[Cloud] Sync scheduled in 10s...');
            syncTimeoutRef.current = setTimeout(() => {
                console.log('[Cloud] Executing scheduled sync...');
                handleCloudSync();
            }, 10000);
        }
    }, [isCloudConnected, cloudError, user?.role, handleCloudSync]);

    return {
        // State
        isCloudConnected, setIsCloudConnected,
        isSyncing, setIsSyncing,
        cloudError, setCloudError,
        lastCloudSync, setLastCloudSync,
        // Refs
        lastRemoteModifiedTime,
        isSyncingRef,
        // 核心函式
        autoConnectCloud,
        handleCloudSync,
        handleConnectCloud,
        handleCloudRestore,
        scheduleSyncIfNeeded,
    };
};
