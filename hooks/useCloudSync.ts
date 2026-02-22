import React, { useState, useCallback, useRef, useEffect } from 'react';
import { User } from '../types';
import { firestoreSyncService } from '../services/firestoreSyncService';
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
    const [syncProgress, setSyncProgress] = useState(0);
    const [syncMessage, setSyncMessage] = useState('準備同步...');
    const [cloudError, setCloudError] = useState<string | null>(null);
    const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);

    const lastRemoteModifiedTime = useRef<string | null>(null);
    const isSyncingRef = useRef(false);
    const syncTimeoutRef = useRef<any>(null);
    const lastDataHashRef = useRef<string>('');

    // Helper: Generate a simple hash of data to detect changes
    const getDataHash = useCallback(() => {
        if (!dataRef.current) return '';
        try {
            const d = dataRef.current;
            // Use counts + a few IDs as a lightweight "hash"
            return `${d.projects?.length || 0}-${d.customers?.length || 0}-${d.teamMembers?.length || 0}-${d.attendanceRecords?.length || 0}-${d.quotations?.length || 0}-${d.vendors?.length || 0}`;
        } catch {
            return '';
        }
    }, [dataRef]);

    // 1. Core Sync Logic (handleCloudSync)
    const handleCloudSync = useCallback(async (isManual = false) => {
        if (!isCloudConnected || isSyncingRef.current || user?.role === 'Guest' || !dataRef.current) return;

        isSyncingRef.current = true;
        if (isManual) {
            setIsSyncing(true);
            setSyncProgress(0);
            setSyncMessage('開始檢查 Firebase 版本...');
        }

        try {
            const modifiedTime = await firestoreSyncService.getLatestModifiedTime();

            // Check if remote is newer
            if (modifiedTime && lastRemoteModifiedTime.current && modifiedTime !== lastRemoteModifiedTime.current) {
                console.log('[Sync] Detected newer Firebase version...');
                const cloudData = await firestoreSyncService.loadFromCloud((msg, curr, total) => {
                    if (isManual) {
                        setSyncMessage(msg);
                        setSyncProgress(Math.round((curr / total) * 100));
                    }
                });

                if (cloudData) {
                    console.log('[Sync] Merging Firebase data...');
                    updateStateWithMerge(cloudData);
                    lastRemoteModifiedTime.current = modifiedTime;
                    setCloudError(null);
                    isSyncingRef.current = false;
                    if (isManual) setIsSyncing(false);
                    return;
                }
            }

            // Smart sync: Only upload if data has changed
            const currentHash = getDataHash();
            if (!isManual && currentHash === lastDataHashRef.current) {
                console.log('[Sync] No data changes detected, skipping upload.');
                isSyncingRef.current = false;
                return;
            }

            // Upload Local to Cloud
            console.log('[Sync] Uploading local data to Firebase...');
            const localData = dataRef.current;

            const success = await firestoreSyncService.saveToCloud({
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
            }, false, (msg, curr, total) => {
                if (isManual) {
                    setSyncMessage(msg);
                    setSyncProgress(Math.round((curr / total) * 100));
                }
            });

            if (success) {
                await firestoreSyncService.updateModifiedTime();
                const newModifiedTime = await firestoreSyncService.getLatestModifiedTime();
                if (newModifiedTime) lastRemoteModifiedTime.current = newModifiedTime;
                lastDataHashRef.current = currentHash;
                setLastCloudSync(new Date().toLocaleTimeString());
                setCloudError(null);
            } else {
                if (isManual) setCloudError(`寫入失敗`);
            }
        } catch (e: any) {
            console.error('Firebase sync failed:', e);
            if (isManual) setCloudError('同步發生錯誤');
        } finally {
            isSyncingRef.current = false;
            if (isManual) setIsSyncing(false);
        }
    }, [isCloudConnected, user, updateStateWithMerge, setAttendanceRecords, setQuotations, dataRef, getDataHash]);

    // 2. Scheduling Logic (increased interval to reduce IO)
    const scheduleSyncIfNeeded = useCallback((isMasterTab: boolean) => {
        if (isCloudConnected && !cloudError && user?.role !== 'Guest' && isMasterTab) {
            if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
            console.log('[Firebase] Sync scheduled in 30s...');
            syncTimeoutRef.current = setTimeout(() => {
                handleCloudSync(false);
            }, 30000); // 30 seconds (increased from 10s)
        }
    }, [isCloudConnected, cloudError, user?.role, handleCloudSync]);

    // 3. Connection Helpers
    const autoConnectCloud = useCallback(async () => {
        try {
            console.log('[Sync] Auto-connecting to Firebase...');
            setIsCloudConnected(true);
            setCloudError(null);
            setSyncProgress(0);
            setSyncMessage('首次連線 Firebase...');

            const cloudData = await firestoreSyncService.loadFromCloud((msg, curr, total) => {
                setSyncMessage(msg);
                setSyncProgress(Math.round((curr / total) * 100));
            });
            if (cloudData && cloudData.projects && cloudData.projects.length > 0) {
                updateStateWithMerge(cloudData);
                const modifiedTime = await firestoreSyncService.getLatestModifiedTime();
                if (modifiedTime) lastRemoteModifiedTime.current = modifiedTime;
                setLastCloudSync(new Date().toLocaleTimeString());
                console.log('[Sync] Firebase auto-connect: data loaded successfully');
            } else {
                console.log('[Sync] Firebase auto-connect: no cloud data, using local');
            }
        } catch (e) {
            console.warn('[Sync] Firebase auto-connect failed, continuing with local data', e);
            setCloudError('Firebase 連線失敗');
        }
    }, [updateStateWithMerge]);

    const handleConnectCloud = useCallback(async () => {
        if (user?.role === 'Guest') return;
        try {
            setIsSyncing(true);
            setSyncProgress(0);
            setSyncMessage('準備下載 Firebase 資料...');
            setCloudError(null);
            setIsCloudConnected(true);
            const cloudData = await firestoreSyncService.loadFromCloud((msg, curr, total) => {
                setSyncMessage(msg);
                setSyncProgress(Math.round((curr / total) * 100));
            });

            if (cloudData && (user?.role === 'SyncOnly' || (cloudData.projects && cloudData.projects.length > 0 && confirm('Firebase 中發現現有數據，是否要切換為雲端版本？')))) {
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
                    alert('✅ 已成功切換為 Firebase 雲端版本數據。');
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
            setSyncProgress(0);
            setSyncMessage('準備從 Firebase 強制還原...');
            const cloudData = await firestoreSyncService.loadFromCloud((msg, curr, total) => {
                setSyncMessage(msg);
                setSyncProgress(Math.round((curr / total) * 100));
            });
            if (cloudData) {
                updateStateWithMerge(cloudData);
                const modifiedTime = await firestoreSyncService.getLatestModifiedTime();
                if (modifiedTime) lastRemoteModifiedTime.current = modifiedTime;
                alert('✅ 已從 Firebase 強制同步最新數據。');
            } else {
                alert('❌ Firebase 無可用數據。');
            }
        } catch (e) {
            alert('還原失敗');
        } finally {
            setIsSyncing(false);
        }
    }, [updateStateWithMerge]);

    // 4. Effects (increased interval to 3 minutes to reduce IO usage)
    useEffect(() => {
        if (!isCloudConnected || user?.role === 'Guest') return;
        const interval = setInterval(() => {
            scheduleSyncIfNeeded(true);
        }, 180000); // 3 minutes (increased from 60s)
        return () => clearInterval(interval);
    }, [isCloudConnected, user, scheduleSyncIfNeeded]);

    return {
        isCloudConnected, setIsCloudConnected,
        isSyncing, setIsSyncing,
        syncProgress, syncMessage,
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
