import { supabase } from './supabaseClient';
import { storageService } from './storageService';

/**
 * 萬用資料儲存與遷移引擎 (Supabase NoSQL-like)
 */
export const supabaseDb = {
    /**
     * 從 Supabase 取得特定集合的所有資料 (解析 JSONB)
     */
    getCollection: async <T>(collection: string): Promise<T[]> => {
        try {
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Supabase request timeout')), 5000)
            );

            const supabasePromise = supabase
                .from('app_data')
                .select('data')
                .eq('collection', collection);

            // Add timeout wrapper to prevent hanging
            const result = await Promise.race([supabasePromise, timeoutPromise]) as any;

            if (result.error) {
                console.error(`[Supabase] Error fetching ${collection}:`, result.error);
                throw result.error;
            }

            return (result.data || []).map((row: any) => row.data as T);
        } catch (e) {
            console.error(`[Supabase] fallback triggered for ${collection}`, e);
            // 本機開發時尚未全上線或網路錯誤的備援 (退回讀取本地)
            const fallback = await storageService.getItem<T[]>(collection, []);
            return fallback;
        }
    },

    /**
     * 整批寫入 or 更新資料陣列至 Supabase
     */
    setCollection: async <T extends { id: string }>(collection: string, items: T[]): Promise<boolean> => {
        try {
            if (!items || items.length === 0) return true;

            const rows = items.map(item => ({
                collection,
                item_id: item.id,
                data: item
            }));

            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Supabase request timeout')), 5000)
            );

            const supabasePromise = supabase
                .from('app_data')
                .upsert(rows, { onConflict: 'collection,item_id' });

            const result = await Promise.race([supabasePromise, timeoutPromise]) as any;

            if (result.error) {
                console.error(`[Supabase] Error upserting ${collection}:`, result.error);
                // 雲端失敗的話，退回寫本地
                await storageService.setItem(collection, items);
                return false;
            }

            // 實施雙寫：雲端成功後，一樣備份一份在本地以防萬一斷網
            await storageService.setItem(collection, items);
            return true;
        } catch (e) {
            console.error(`[Supabase] Fatal error writing ${collection}:`, e);
            await storageService.setItem(collection, items);
            return false;
        }
    },

    /**
     * 從 Supabase 移除特定項目
     */
    removeItem: async (collection: string, itemId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .from('app_data')
                .delete()
                .eq('collection', collection)
                .eq('item_id', itemId);

            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`[Supabase] Error deleting ${itemId} from ${collection}:`, e);
            return false;
        }
    }
};
