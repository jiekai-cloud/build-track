
import localforage from 'localforage';

// 初始化 IndexedDB 配置
localforage.config({
    name: 'LifeQualitySystem',
    storeName: 'app_data',
    description: 'Storage for project management data'
});

/**
 * 儲存服務：封裝 IndexedDB 與 LocalStorage 備援
 */
export const storageService = {
    /**
     * 儲存資料
     */
    setItem: async (key: string, data: any): Promise<boolean> => {
        try {
            await localforage.setItem(key, data);
            return true;
        } catch (e) {
            console.error(`[StorageService] IndexedDB set error for ${key}:`, e);
            // 備援：嘗試存入 LocalStorage (如果資料沒超過 5MB)
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return true;
            } catch (lsE) {
                console.error(`[StorageService] LocalStorage fallback failed for ${key}`);
                return false;
            }
        }
    },

    /**
     * 取得資料
     */
    getItem: async <T>(key: string, fallback: T): Promise<T> => {
        try {
            const value = await localforage.getItem<T>(key);
            if (value !== null) return value;

            // 嘗試從舊的 LocalStorage 遷移
            const lsValue = localStorage.getItem(key);
            if (lsValue) {
                try {
                    const parsed = JSON.parse(lsValue);
                    // 執行遷移：存入 IndexedDB 並回傳
                    await localforage.setItem(key, parsed);
                    return parsed;
                } catch {
                    return fallback;
                }
            }
            return fallback;
        } catch (e) {
            console.error(`[StorageService] getItem error for ${key}:`, e);
            return fallback;
        }
    },

    /**
     * 移除資料
     */
    removeItem: async (key: string): Promise<void> => {
        await localforage.removeItem(key);
        localStorage.removeItem(key);
    },

    /**
     * 清除所有資料 (警告：慎用)
     */
    clear: async (): Promise<void> => {
        await localforage.clear();
        localStorage.clear();
    }
};
