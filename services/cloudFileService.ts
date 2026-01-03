
import { googleDriveService } from './googleDriveService';

const ASSETS_FOLDER_NAME = 'life_quality_photos';

class CloudFileService {
    private folderId: string | null = null;

    /**
     * 尋找或建立專用的專案照片資料夾
     */
    private async getOrCreateFolder(): Promise<string | null> {
        if (this.folderId) return this.folderId;

        try {
            const query = `name='${ASSETS_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
            const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id)`;

            // @ts-ignore - access private method for generic auth fetch
            const response = await googleDriveService.fetchWithAuth(searchUrl);
            const data = await response.json();

            if (data.files && data.files.length > 0) {
                this.folderId = data.files[0].id;
                return this.folderId;
            }

            // 建立資料夾
            const createUrl = 'https://www.googleapis.com/drive/v3/files';
            const metadata = {
                name: ASSETS_FOLDER_NAME,
                mimeType: 'application/vnd.google-apps.folder'
            };

            // @ts-ignore
            const createRes = await googleDriveService.fetchWithAuth(createUrl, {
                method: 'POST',
                body: JSON.stringify(metadata),
                headers: { 'Content-Type': 'application/json' }
            });
            const folder = await createRes.json();
            this.folderId = folder.id;
            return this.folderId;
        } catch (e) {
            console.error('資料夾建立失敗:', e);
            return null;
        }
    }

    /**
     * 上傳檔案至雲端並取得公開連結
     */
    async uploadFile(file: File): Promise<{ id: string; url: string } | null> {
        const parentId = await this.getOrCreateFolder();
        if (!parentId) return null;

        try {
            const metadata = {
                name: `${Date.now()}_${file.name}`,
                parents: [parentId]
            };

            const boundary = '-------314159265358979323846';
            const delimiter = "\r\n--" + boundary + "\r\n";
            const close_delim = "\r\n--" + boundary + "--";

            const reader = new FileReader();
            const fileContent: ArrayBuffer = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result as ArrayBuffer);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            const metadataPart = [
                'Content-Type: application/json; charset=UTF-8\r\n\r\n',
                JSON.stringify(metadata),
                '\r\n'
            ].join('');

            const mediaPartHead = [
                `Content-Type: ${file.type}\r\n\r\n`
            ].join('');

            const body = new Blob([
                delimiter,
                metadataPart,
                delimiter,
                mediaPartHead,
                new Uint8Array(fileContent),
                close_delim
            ], { type: 'multipart/related; boundary=' + boundary });

            const uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webContentLink,webViewLink';

            // @ts-ignore
            const response = await googleDriveService.fetchWithAuth(uploadUrl, {
                method: 'POST',
                body
            });

            if (!response.ok) throw new Error('Upload failed');

            const result = await response.json();

            // 嘗試設定權限為任何人可讀 (或維持私有，視需求而定)
            // 這裡我們暫時使用 webContentLink 作為直接存取連結
            return {
                id: result.id,
                url: result.webContentLink || result.webViewLink
            };
        } catch (e) {
            console.error('檔案上傳失敗:', e);
            return null;
        }
    }
}

export const cloudFileService = new CloudFileService();
