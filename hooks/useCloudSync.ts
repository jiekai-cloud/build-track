import React, { useState, useCallback, useRef, useEffect } from 'react';
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

    // 1. Core Sync Logic (handleCloudSync)
    const handleCloudSync = useCallback(async () => {
        if (!isCloudConnected || isSyncingRef.current || user?.role === 'Guest' || !dataRef.current) return;

        isSyncingRef.current = true;
        setIsSyncing(true);

        try {
            const modifiedTime = await supabaseSyncService.getLatestModifiedTime();

            // Check if remote is newer
            if (modifiedTime && lastRemoteModifiedTime.current && modifiedTime !== lastRemoteModifiedTime.current) {
                console.log('[Sync] Detected newer Supabase version...');
                const cloudData = await supabaseSyncService.loadFromCloud();

                if (cloudData) {
                    console.log('[Sync] Merging Supabase data...');
                    updateStateWithMerge(cloudData);
                    lastRemoteModifiedTime.current = modifiedTime;
                    setCloudError(null);
                    // Skip uploading if we just downloaded
                    isSyncingRef.current = false;
                    setIsSyncing(false);
                    return;
                }
            }

            // Otherwise, Upload Local to Cloud
            console.log('[Sync] Uploading local data to Supabase...');
            const localData = dataRef.current;

            // Ensure data integrity (attendance/quotations)
            let cloudDataCache: any = null;
            const getCloudData = async () => {
                if (!cloudDataCache) cloudDataCache = await supabaseSyncService.loadFromCloud();
                return cloudDataCache;
            };

            if (!localData.attendanceRecords || localData.attendanceRecords.length === 0) {
                try {
                    const cloud = await getCloudData();
                    if (cloud?.attendance && cloud.attendance.length > 0) {
                        setAttendanceRecords(cloud.attendance);
                        localData.attendanceRecords = cloud.attendance;
                    }
                } catch (e) { }
            }

            if (!localData.quotations || localData.quotations.length === 0) {
                try {
                    const cloud = await getCloudData();
                    if (cloud?.quotations && cloud.quotations.length > 0) {
                        setQuotations(cloud.quotations);
                        localData.quotations = cloud.quotations;
                    }
                } catch (e) { }
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
    }, [isCloudConnected, user, updateStateWithMerge, setAttendanceRecords, setQuotations, dataRef]);

    // 2. Scheduling Logic
    const scheduleSyncIfNeeded = useCallback((isMasterTab: boolean) => {
        if (isCloudConnected && !cloudError && user?.role !== 'Guest' && isMasterTab) {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            console.log('[Supabase] Sync scheduled in 10s...');
            syncTimeoutRef.current = setTimeout(() => {
                handleCloudSync();
            }, 10000);
        }
    }, [isCloudConnected, cloudError, user?.role, handleCloudSync]);

    // 3. Connection Helpers
    const autoConnectCloud = useCallback(async () => {
        try {
            console.log('[Sync] Initializing auto-connect and force fetch...');
            setIsCloudConnected(true);
            setCloudError(null);

            const cloudData = await supabaseSyncService.loadFromCloud();
            if (cloudData) {
                updateStateWithMerge(cloudData);
                const modifiedTime = await supabaseSyncService.getLatestModifiedTime();
                if (modifiedTime) lastRemoteModifiedTime.current = modifiedTime;
                setLastCloudSync(new Date().toLocaleTimeString());
            }
        } catch (e) {
            setCloudError('Supabase 連線失敗');
        }
    }, [updateStateWithMerge]);

    const handleConnectCloud = useCallback(async () => {
        if (user?.role === 'Guest') return;
        try {
            setIsSyncing(true);
            setCloudError(null);
            setIsCloudConnected(true);
            const cloudData = await supabaseSyncService.loadFromCloud();

            if (cloudData && (user?.role === 'SyncOnly' || (cloudData.projects && confirm('Supabase 中發現現有數據，是否要切換為雲端版本？')))) {
                setProjects(normalizeProjects(cloudData.projects || []));
                setCustomers(cloudData.customers || []);
                setTeamMembers(cloudData.teamMembers || []);
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
                    storageService.setItem(`${prefix}bt_team`, cloudData.teamMembers || []),
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
    }, [user, normalizeProjects, setProjects, setCustomers, setTeamMembers, setActivityLogs, setVendors, setInventoryItems, setInventoryLocations, setPurchaseOrders, setAttendanceRecords, setPayrollRecords, setApprovalRequests, setApprovalTemplates, setQuotations, handleLogout]);

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
            alert('還原失敗');
        } finally {
            setIsSyncing(false);
        }
    }, [updateStateWithMerge]);

    // 4. Effects
    useEffect(() => {
        if (!isCloudConnected || user?.role === 'Guest') return;
        const interval = setInterval(() => {
            scheduleSyncIfNeeded(true); // Always check in interval if connected
        }, 60000);
        return () => clearInterval(interval);
    }, [isCloudConnected, user, scheduleSyncIfNeeded]);

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
