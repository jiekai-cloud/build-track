import React, { useState, useCallback, useRef } from 'react';
import { User } from '../types';
import { supabaseSyncService } from '../services/supabaseSyncService';
import { storageService } from '../services/storageService';

interface CloudSyncDeps {
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
    handleLogout: (forced?: boolean) => void;
    user: User | null;
}

export const useCloudSync = (deps: CloudSyncDeps) => {
    const {
        updateStateWithMerge, normalizeProjects, dataRef,
        setProjects, setCustomers, setTeamMembers, setActivityLogs,
        setVendors, setInventoryItems, setInventoryLocations,
        setPurchaseOrders, setAttendanceRecords, setPayrollRecords,
        setApprovalRequests, setApprovalTemplates, setQuotations,
        handleLogout, user
    } = deps;

    const [isCloudConnected, setIsCloudConnected] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [cloudError, setCloudError] = useState<string | null>(null);
    const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

    const lastRemoteModifiedTime = useRef<string | null>(null);
    const isSyncingRef = useRef(false);
    const syncTimeoutRef = useRef<any>(null);

    const autoConnectCloud = useCallback(async () => {
        try {
            // 自動連線至 Supabase
            setIsCloudConnected(true);
            setCloudError(null);

            const modifiedTime = await supabaseSyncService.getLatestModifiedTime();
            if (modifiedTime) {
                lastRemoteModifiedTime.current = modifiedTime;
                const cloudData = await supabaseSyncService.loadFromCloud();
                if (cloudData) {
                    updateStateWithMerge(cloudData);
                    setLastCloudSync(new Date().toLocaleTimeString());
                }
            }
        } catch (e) {
            console.error(e);
            setCloudError('Supabase 連線失敗');
        }
    }, [updateStateWithMerge]);

    const handleCloudSync = useCallback(async () => {
        if (!isCloudConnected || isSyncingRef.current || user?.role === 'Guest') return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            const modifiedTime = await supabaseSyncService.getLatestModifiedTime();
            if (modifiedTime && lastRemoteModifiedTime.current && modifiedTime !== lastRemoteModifiedTime.current) {
                console.log('[Sync] Detected newer Supabase version...');
                const cloudData = await supabaseSyncService.loadFromCloud();

                if (cloudData) {
                    console.log('[Sync] Merging Supabase data...');
                    updateStateWithMerge(cloudData);
                    lastRemoteModifiedTime.current = modifiedTime;
                    setCloudError(null);
                    isSyncingRef.current = false;
                    setIsSyncing(false);
                    return;
                }
            }

            const localData = dataRef.current;
            if (!localData.projects || (localData.projects.length === 0 && localData.teamMembers.length <= 1)) {
                console.warn('[Sync] Aborted save: Local state empty.');
                isSyncingRef.current = false;
                setIsSyncing(false);
                return;
            }

            // ===== 資料完整性防護：防止空/不完整的本地資料覆蓋雲端 =====
            let cloudDataCache: any = null;
            const getCloudData = async () => {
                if (!cloudDataCache) cloudDataCache = await supabaseSyncService.loadFromCloud();
                return cloudDataCache;
            };

            // 防護 1：打卡紀錄
            if (!localData.attendanceRecords || localData.attendanceRecords.length === 0) {
                try {
                    const cloud = await getCloudData();
                    if (cloud?.attendance && cloud.attendance.length > 0) {
                        console.warn(`[Sync] Local attendance empty but cloud has ${cloud.attendance.length} records. Restoring.`);
                        deps.setAttendanceRecords(cloud.attendance);
                        localData.attendanceRecords = cloud.attendance;
                    }
                } catch (e) {
                    console.warn('[Sync] Could not verify cloud attendance.', e);
                }
            }

            // 防護 2：報價單 — 本地空但雲端有
            if (!localData.quotations || localData.quotations.length === 0) {
                try {
                    const cloud = await getCloudData();
                    if (cloud?.quotations && cloud.quotations.length > 0) {
                        console.warn(`[Sync] Local quotations empty but cloud has ${cloud.quotations.length}. Restoring.`);
                        deps.setQuotations(cloud.quotations);
                        localData.quotations = cloud.quotations;
                    }
                } catch (e) {
                    console.warn('[Sync] Could not verify cloud quotations.', e);
                }
            }

            // 防護 3：報價單內容完整性 — 不允許把沒有 sections 的報價單覆蓋有 sections 的版本
            if (localData.quotations && localData.quotations.length > 0) {
                try {
                    const cloud = await getCloudData();
                    if (cloud?.quotations && cloud.quotations.length > 0) {
                        const cloudMap = new Map(cloud.quotations.map((q: any) => [q.id, q]));
                        localData.quotations = localData.quotations.map((localQ: any) => {
                            const cloudQ = cloudMap.get(localQ.id) as any;
                            if (cloudQ) {
                                const localSections = localQ.sections || [];
                                const cloudSections = cloudQ.sections || [];
                                const localItemCount = localSections.reduce((s: number, sec: any) => s + (sec.items?.length || 0), 0);
                                const cloudItemCount = cloudSections.reduce((s: number, sec: any) => s + (sec.items?.length || 0), 0);
                                // 如果雲端有內容但本地沒有，保留雲端版本
                                if (cloudItemCount > 0 && localItemCount === 0) {
                                    console.warn(`[Sync] Quotation ${localQ.id}: Local has 0 items but cloud has ${cloudItemCount}. Keeping cloud version.`);
                                    return cloudQ;
                                }
                            }
                            return localQ;
                        });
                    }
                } catch (e) {
                    console.warn('[Sync] Could not verify quotation integrity.', e);
                }
            }

            const success = await supabaseSyncService.saveToCloud({
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
                calendarEvents: localData.calendarEvents,
            });

            if (success) {
                const newModifiedTime = await supabaseSyncService.getLatestModifiedTime();
                if (newModifiedTime) lastRemoteModifiedTime.current = newModifiedTime;
                setLastCloudSync(new Date().toLocaleTimeString());
                setCloudError(null);
            } else {
                setCloudError(`寫入失敗`);
            }
        } catch (e: any) {
            console.error('Supabase sync failed:', e);
            setCloudError('同步發生錯誤');
        } finally {
            isSyncingRef.current = false;
            setIsSyncing(false);
        }
    }, [isCloudConnected, user?.role, updateStateWithMerge, cloudError, dataRef]);

    const handleConnectCloud = useCallback(async () => {
        if (user?.role === 'Guest') return;
        try {
            setIsSyncing(true);
            setCloudError(null);

            setIsCloudConnected(true);
            const cloudData = await supabaseSyncService.loadFromCloud();

            const shouldRestore = (user?.role === 'SyncOnly') || (cloudData && cloudData.projects && confirm('Supabase 中發現現有數據，是否要切換為雲端版本？'));

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

                const prefix = user?.department === 'ThirdDept' ? 'dept3_' : '';

                await Promise.all([
                    storageService.setItem(`${prefix}bt_projects`, cloudData.projects || []),
                    storageService.setItem(`${prefix}bt_team`, teamData),
                    storageService.setItem(`${prefix}bt_customers`, cloudData.customers || []),
                    storageService.setItem(`${prefix}bt_vendors`, cloudData.vendors || []),
                    storageService.setItem(`${prefix}bt_leads`, cloudData.leads || []),
                    storageService.setItem(`${prefix}bt_inventory`, cloudData.inventory || []),
                    storageService.setItem(`${prefix}bt_locations`, cloudData.locations || []),
                    storageService.setItem(`${prefix}bt_orders`, cloudData.purchaseOrders || []),
                    storageService.setItem(`${prefix}bt_attendance`, cloudData.attendance || []),
                    storageService.setItem(`${prefix}bt_payroll`, cloudData.payroll || []),
                    storageService.setItem(`${prefix}bt_approval_requests`, cloudData.approvalRequests || []),
                    storageService.setItem(`${prefix}bt_approval_templates`, cloudData.approvalTemplates || []),
                    storageService.setItem(`${prefix}bt_logs`, cloudData.activityLogs || []),
                    storageService.setItem(`${prefix}bt_quotations`, cloudData.quotations || [])
                ]);

                if (user?.role === 'SyncOnly') {
                    setTimeout(() => {
                        alert('✅ 數據同步完成！請使用您的「員工編號」正式登入。');
                        handleLogout(true);
                    }, 800);
                } else {
                    alert('✅ 已成功切換為 Supabase 雲端版本數據。');
                }
            }
        } catch (err: any) {
            setCloudError('驗證失敗');
        } finally {
            setIsSyncing(false);
        }
    }, [user?.role, normalizeProjects, setProjects, setCustomers, setTeamMembers, setActivityLogs, setVendors, setInventoryItems, setInventoryLocations, setPurchaseOrders, setAttendanceRecords, setPayrollRecords, setApprovalRequests, setApprovalTemplates, setQuotations]);

    const handleCloudRestore = useCallback(async () => {
        try {
            setIsSyncing(true);
            const cloudData = await supabaseSyncService.loadFromCloud();
            if (cloudData) {
                updateStateWithMerge(cloudData);
                const modifiedTime = await supabaseSyncService.getLatestModifiedTime();
                if (modifiedTime) lastRemoteModifiedTime.current = modifiedTime;
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

    const scheduleSyncIfNeeded = useCallback((isMasterTab: boolean) => {
        if (isCloudConnected && !cloudError && user?.role !== 'Guest' && isMasterTab) {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            console.log('[Supabase] Sync scheduled in 10s...');
            syncTimeoutRef.current = setTimeout(() => {
                console.log('[Supabase] Executing scheduled sync...');
                handleCloudSync();
            }, 10000);
        }
    }, [isCloudConnected, cloudError, user?.role, handleCloudSync]);

    return {
        isCloudConnected, setIsCloudConnected,
        isSyncing, setIsSyncing,
        cloudError, setCloudError,
        lastCloudSync, setLastCloudSync,
        lastRemoteModifiedTime,
        isSyncingRef,
        autoConnectCloud,
        handleCloudSync,
        handleConnectCloud,
        handleCloudRestore,
        scheduleSyncIfNeeded,
    };
};
