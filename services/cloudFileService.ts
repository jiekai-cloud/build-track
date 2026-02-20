import { supabase } from './supabaseClient';

class CloudFileService {
    /**
     * 上傳檔案至 Supabase Storage 並取得公開連結
     */
    async uploadFile(file: File): Promise<{ id: string; url: string } | null> {
        try {
            // 檔名加上時間戳記避免重複，移除非法字元
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const fileName = `${Date.now()}_${safeName}`;

            // 嘗試上傳到名為 'assets' 的 bucket
            let uploadResult = await supabase.storage
                .from('assets')
                .upload(fileName, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            // 若遇到 Bucket 不存在的錯誤，自動嘗試建立 (需資料庫權限允許)
            if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
                console.log('[Supabase Storage] Bucket "assets" not found, attempting to create...');
                const { error: createError } = await supabase.storage.createBucket('assets', {
                    public: true,
                    allowedMimeTypes: ['image/*', 'application/pdf', 'video/*'],
                    fileSizeLimit: 52428800 // 50MB
                });

                if (createError) {
                    console.error('[Supabase Storage] Failed to create bucket:', createError);
                    throw createError;
                }

                // 建立成功後重新嘗試上傳
                uploadResult = await supabase.storage
                    .from('assets')
                    .upload(fileName, file, {
                        cacheControl: '3600',
                        upsert: false
                    });
            }

            if (uploadResult.error) {
                console.error('[Supabase Storage] Upload error:', uploadResult.error);
                throw uploadResult.error;
            }

            // 獲取公開 URL
            const { data: publicUrlData } = supabase.storage
                .from('assets')
                .getPublicUrl(fileName);

            return {
                id: fileName,
                url: publicUrlData.publicUrl
            };
        } catch (e) {
            console.error('檔案上傳失敗:', e);
            // 本地 fallback：萬一後端沒開通 Storage，至少傳回一個假網址讓前端不會壞
            return null;
        }
    }
}

export const cloudFileService = new CloudFileService();
