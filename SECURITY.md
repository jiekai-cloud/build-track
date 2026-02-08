# 安全說明 (Security Policy)

## 🔐 API 金鑰管理

本專案使用以下 API 服務：
- **Google Maps API**：用於地圖顯示和地址搜尋
- **Gemini API**：用於 AI 功能

### ⚠️ 重要安全規則

1. **絕對不要**將 API 金鑰直接寫在代碼中
2. **絕對不要**提交 `.env` 文件到 Git
3. **總是**使用環境變數來儲存敏感資訊

### 🔧 如何配置 API 金鑰

1. 複製 `.env.example` 到 `.env`：
   ```bash
   cp .env.example .env
   ```

2. 編輯 `.env` 文件，填入您的 API 金鑰：
   ```
   VITE_GOOGLE_MAPS_API_KEY=你的真實金鑰
   VITE_GEMINI_API_KEY=你的真實金鑰
   ```

3. 確保 `.env` 已在 `.gitignore` 中（已預設配置）

### 🛡️ Google Cloud API 金鑰安全設定

為了保護您的 API 金鑰不被濫用，請在 Google Cloud Console 設定以下限制：

#### **HTTP Referrer 限制**
只允許來自您的網站的請求：
```
https://jiekai-cloud.github.io/*
http://localhost:*
```

#### **API 限制**
只啟用必要的 API：
- Maps JavaScript API
- Geocoding API

### 🚨 如果 API 金鑰外洩

1. **立即前往 Google Cloud Console**
2. **刪除或停用**外洩的金鑰
3. **建立新的金鑰**並設定適當的限制
4. **更新本地 `.env` 文件**
5. **檢查 Google Cloud 帳單**，確認沒有異常使用

## 📊 數據安全

### 本地儲存
- 所有使用者數據儲存在瀏覽器的 localStorage 和 IndexedDB
- 數據**不會**上傳到任何遠端伺服器
- 使用 Google Drive 登入僅用於身份驗證，不會讀取您的 Google Drive 文件

### 數據備份
- 建議定期使用系統內建的「匯出」功能備份數據
- 備份文件可以儲存在您信任的位置

## 🔒 倉庫安全

### 建議設定
- 將倉庫設為 **Private**（私人）
- 只授權必要的協作者訪問
- 定期檢查 Security Advisories

### GitHub Secret Scanning
如果 GitHub 偵測到您的代碼中有敏感資訊（如 API 金鑰），會在 Security 標籤中顯示警告。請立即：
1. 撤銷外洩的金鑰
2. 從代碼中移除硬編碼的金鑰
3. 使用環境變數替代

## 📞 回報安全問題

如果您發現本專案的安全漏洞，請：
1. **不要**在公開的 issue 中揭露
2. 直接聯繫專案維護者
3. 提供詳細的漏洞資訊以便我們盡快修復

---

**最後更新**：2026-02-08
