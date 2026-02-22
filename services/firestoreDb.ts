import { db } from './firebaseClient';
import { collection, doc, getDocs, writeBatch, deleteDoc, setDoc } from 'firebase/firestore';
import { storageService } from './storageService';

/**
 * Firestore 資料存取引擎 (取代 supabaseDb)
 * 每個集合 (e.g. 'projects') 對應一個 Firestore Collection
 * 每筆資料 (e.g. 每個 project) 對應一個 Document (doc ID = item.id)
 */
export const firestoreDb = {
    /**
     * 從 Firestore 取得特定集合的所有資料
     */
    getCollection: async <T>(collectionName: string): Promise<T[]> => {
        try {
            const colRef = collection(db, collectionName);
            const snapshot = await getDocs(colRef);
            const items: T[] = [];
            snapshot.forEach((docSnap) => {
                items.push(docSnap.data() as T);
            });
            return items;
        } catch (e) {
            console.error(`[Firestore] Error fetching ${collectionName}:`, e);
            // Fallback to local storage
            const fallback = await storageService.getItem<T[]>(collectionName, []);
            return fallback;
        }
    },

    /**
     * 整批寫入/更新資料陣列至 Firestore (Batch Write)
     * Firestore batch 限制 500 次操作，超過時自動分批
     */
    setCollection: async <T extends { id: string }>(collectionName: string, items: T[]): Promise<boolean> => {
        try {
            if (!items || items.length === 0) return true;

            const BATCH_SIZE = 450; // 安全值，小於 500 限制
            const colRef = collection(db, collectionName);

            for (let i = 0; i < items.length; i += BATCH_SIZE) {
                const chunk = items.slice(i, i + BATCH_SIZE);
                const batch = writeBatch(db);

                chunk.forEach(item => {
                    const docRef = doc(colRef, item.id);
                    batch.set(docRef, JSON.parse(JSON.stringify(item))); // Deep clone to remove undefined
                });

                await batch.commit();
            }

            // 雙寫：同時備份到本地
            await storageService.setItem(collectionName, items);
            return true;
        } catch (e) {
            console.error(`[Firestore] Error writing ${collectionName}:`, e);
            // 雲端失敗，退回寫本地
            await storageService.setItem(collectionName, items);
            return false;
        }
    },

    /**
     * 從 Firestore 移除特定項目
     */
    removeItem: async (collectionName: string, itemId: string): Promise<boolean> => {
        try {
            const docRef = doc(db, collectionName, itemId);
            await deleteDoc(docRef);
            return true;
        } catch (e) {
            console.error(`[Firestore] Error deleting ${itemId} from ${collectionName}:`, e);
            return false;
        }
    },

    /**
     * 測試 Firestore 連線是否正常
     */
    ping: async (): Promise<boolean> => {
        try {
            const testRef = collection(db, '_ping');
            const testDocRef = doc(testRef, 'health');
            await setDoc(testDocRef, { ts: Date.now() }, { merge: true });
            return true;
        } catch (e) {
            console.warn('[Firestore] Ping failed:', e);
            return false;
        }
    }
};
