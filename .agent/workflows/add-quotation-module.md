---
description: 如何安全地新增報價系統模組到系統中
---

# 新增「報價系統」模組實施指南 📋

本指南將帶您安全地新增「報價系統」模組，避免影響既有系統運作。

## 🎯 實施策略

採用**漸進式開發**策略，確保每一步都可回溯：
1. ✅ **模組註冊** - 在配置中宣告新模組
2. ✅ **組件開發** - 獨立開發報價系統組件
3. ✅ **路由整合** - 將模組整合到主應用
4. ✅ **測試驗證** - 確認不影響既有功能
5. ✅ **漸進啟用** - 先小範圍測試再全面開放

---

## 📝 步驟 1: 註冊模組配置

### 1.1 在 `moduleConfig.ts` 中新增模組 ID

在 `ModuleId` enum 中加入新的模組識別碼：

```typescript
export enum ModuleId {
    // ===== 核心模組（不可關閉）=====
    AUTH = 'auth',
    DASHBOARD = 'dashboard',
    SETTINGS = 'settings',

    // ===== 可選功能模組 =====
    PROJECTS = 'projects',
    CUSTOMERS = 'customers',
    TEAM = 'team',
    VENDORS = 'vendors',
    DISPATCH = 'dispatch',
    ANALYTICS = 'analytics',
    AI_ASSISTANT = 'ai_assistant',
    CLOUD_SYNC = 'cloud_sync',
    LEADS = 'leads',
    INVENTORY = 'inventory',
    ATTENDANCE = 'attendance',
    PAYROLL = 'payroll',
    APPROVALS = 'approvals',
    QUOTATIONS = 'quotations'     // 🆕 新增報價系統
}
```

### 1.2 在 `ALL_MODULES` 陣列中新增模組配置

```typescript
import { FileText } from 'lucide-react'; // 在頂部 import 區加入圖示

// 在 ALL_MODULES 陣列末端加入
{
    id: ModuleId.QUOTATIONS,
    name: '報價系統',
    description: '工程報價單製作、審核與追蹤管理',
    icon: FileText,
    isCore: false,
    dependencies: [ModuleId.CUSTOMERS, ModuleId.PROJECTS], // 依賴客戶與專案模組
    enabled: false,  // 🔴 初期設為 false，測試完成後改為 true
    category: 'management'
}
```

**⚠️ 關鍵設定：**
- `enabled: false` - 初期禁用，避免影響現有用戶
- `dependencies` - 定義依賴關係，確保必要模組已啟用
- `isCore: false` - 可選模組，管理員可自由開關

---

## 📝 步驟 2: 建立報價系統組件

### 2.1 建立組件檔案

```bash
touch components/QuotationSystem.tsx
```

### 2.2 建立基礎組件架構

```typescript
import React, { useState } from 'react';
import { FileText, Plus, Search } from 'lucide-react';

interface QuotationSystemProps {
  customers: any[];
  projects: any[];
  onAddQuotation?: (quotation: any) => void;
}

const QuotationSystem: React.FC<QuotationSystemProps> = ({ 
  customers, 
  projects,
  onAddQuotation 
}) => {
  const [quotations, setQuotations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">報價系統</h1>
          <p className="text-stone-500 mt-1">管理工程報價單與追蹤</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
          <Plus size={20} />
          新增報價單
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <p className="text-stone-600">報價系統開發中...</p>
        <p className="text-sm text-stone-400 mt-2">
          目前可用客戶數: {customers.length} | 可用專案數: {projects.length}
        </p>
      </div>
    </div>
  );
};

export default QuotationSystem;
```

**✅ 優點：**
- 獨立組件，不會影響其他模組
- 清楚的 Props 定義，便於整合
- 已預留數據接口

---

## 📝 步驟 3: 在 Sidebar 中加入導航項

### 3.1 編輯 `components/Sidebar.tsx`

在 `allMenuItems` 陣列中加入報價系統：

```typescript
const allMenuItems = [
  { id: 'dashboard', label: '總覽面板', icon: LayoutDashboard, moduleId: ModuleId.DASHBOARD },
  { id: 'projects', label: '專案管理', icon: FolderKanban, moduleId: ModuleId.PROJECTS },
  { id: 'dispatch', label: '派工紀錄', icon: ClipboardSignature, moduleId: ModuleId.DISPATCH },
  { id: 'customers', label: '客戶資料', icon: Contact2, moduleId: ModuleId.CUSTOMERS },
  { id: 'team', label: '團隊成員', icon: Users, moduleId: ModuleId.TEAM },
  { id: 'vendors', label: '廠商管理', icon: ShoppingBag, moduleId: ModuleId.VENDORS },
  { id: 'inventory', label: '庫存管理', icon: ShoppingBag, moduleId: ModuleId.INVENTORY },
  { id: 'attendance', label: '考勤打卡', icon: Clock, moduleId: ModuleId.ATTENDANCE },
  { id: 'payroll', label: '薪資管理', icon: Wallet, moduleId: ModuleId.PAYROLL },
  { id: 'approvals', label: '簽核系統', icon: FileCheck, moduleId: ModuleId.APPROVALS },
  { id: 'quotations', label: '報價系統', icon: FileText, moduleId: ModuleId.QUOTATIONS }, // 🆕
  { id: 'analytics', label: '數據分析', icon: BarChart3, moduleId: ModuleId.ANALYTICS },
];
```

記得在頂部 import `FileText`：
```typescript
import { ..., FileText } from 'lucide-react';
```

---

## 📝 步驟 4: 在主應用中整合組件

### 4.1 編輯 `App.tsx`

#### 4.1.1 Import 報價系統組件

```typescript
import QuotationSystem from './components/QuotationSystem';
```

#### 4.1.2 在渲染區加入路由

找到其他模組的渲染位置（約在 1600-1850 行），加入：

```typescript
{activeTab === 'quotations' && moduleService.isModuleEnabled(ModuleId.QUOTATIONS) && (
  <QuotationSystem
    customers={filteredData.customers}
    projects={filteredData.projects}
    onAddQuotation={(quotation) => {
      // TODO: 之後實作報價單資料存儲邏輯
      console.log('New quotation:', quotation);
    }}
  />
)}
```

**📍 建議放置位置：** 在 `approvals` 模組之後，`vendors` 模組之前

---

## 📝 步驟 5: 資料結構設計（準備階段）

### 5.1 在 `types.ts` 中定義報價單型別

```typescript
export interface Quotation {
  id: string;
  quotationNumber: string;         // 報價單編號 (例: Q2026-001)
  customerId: string;               // 關聯客戶 ID
  projectId?: string;               // 關聯專案 ID（選填）
  title: string;                    // 報價標題
  description: string;              // 報價說明
  items: QuotationItem[];           // 報價項目明細
  subtotal: number;                 // 小計
  tax: number;                      // 稅額
  total: number;                    // 總計
  validUntil: string;               // 有效期限 (ISO date)
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'; // 狀態
  createdBy: string;                // 建立人員 ID
  createdAt: string;                // 建立時間
  updatedAt: string;                // 更新時間
  approvedAt?: string;              // 核准時間
  notes?: string;                   // 備註
}

export interface QuotationItem {
  id: string;
  name: string;                     // 項目名稱
  description?: string;              // 項目描述
  quantity: number;                 // 數量
  unit: string;                     // 單位 (例: 坪、組、式)
  unitPrice: number;                // 單價
  amount: number;                   // 金額 (quantity * unitPrice)
  category?: string;                // 類別 (例: 材料、工資、設備)
}
```

### 5.2 在 `App.tsx` 中加入狀態管理

```typescript
const [quotations, setQuotations] = useState<Quotation[]>([]);
```

---

## 📝 步驟 6: 測試與驗證

### 6.1 啟用模組（測試環境）

1. **方式 A：透過系統設定介面**
   - 以 SuperAdmin 登入
   - 前往「模組管理」頁面
   - 啟用「報價系統」模組

2. **方式 B：直接修改配置**
   ```typescript
   // moduleConfig.ts
   enabled: true  // 將 QUOTATIONS 的 enabled 改為 true
   ```

### 6.2 測試清單

- [ ] 報價系統在側邊欄中出現
- [ ] 點擊「報價系統」可正常切換頁面
- [ ] 其他模組（專案、客戶等）功能正常
- [ ] 沒有 Console 錯誤
- [ ] 在不同角色（SuperAdmin, Manager, Staff）下測試權限

### 6.3 回溯測試

停用報價系統模組，確認：
- [ ] 側邊欄中報價系統消失
- [ ] 其他功能完全不受影響
- [ ] 系統運行正常

---

## 📝 步驟 7: 漸進式發布

### 7.1 Beta 測試階段

```typescript
// moduleConfig.ts - 僅對特定角色開放
{
    id: ModuleId.QUOTATIONS,
    name: '報價系統 (Beta)',
    description: '工程報價單製作 - 測試中',
    icon: FileText,
    isCore: false,
    dependencies: [ModuleId.CUSTOMERS, ModuleId.PROJECTS],
    enabled: true,  // ✅ 啟用但標示 Beta
    category: 'management'
}
```

### 7.2 正式發布

確認測試無誤後：
1. 移除 Beta 標示
2. 更新 `modulePresets.json`，加入完整版配置
3. 通知所有用戶新功能上線

---

## 🛡️ 安全檢查清單

在每個步驟完成後檢查：

### 編譯檢查
```bash
npx tsc --noEmit
```

### 建置測試
```bash
npm run build
```

### Git 版本控制
```bash
git add .
git commit -m "feat: add quotation system module (disabled by default)"
git push
```

**💡 建議：** 每個大步驟（如模組註冊、組件開發）都創建獨立的 commit，方便回溯

---

## 🔄 萬一出問題怎麼辦？

### 快速回滾方案

1. **禁用模組**
   ```typescript
   // moduleConfig.ts
   enabled: false
   ```

2. **Git 回退**
   ```bash
   git log --oneline  # 查看 commit 歷史
   git revert <commit-hash>  # 回退特定 commit
   ```

3. **緊急修復**
   - 註解掉 Sidebar 中的報價系統項目
   - 註解掉 App.tsx 中的報價系統路由
   - 重新建置

---

## 📚 後續開發建議

模組基礎建立完成後，可以逐步開發功能：

1. **階段 1：CRUD 基礎** - 新增、查看、編輯、刪除報價單
2. **階段 2：PDF 匯出** - 使用 jspdf 產生報價單 PDF
3. **階段 3：狀態管理** - 草稿、已送出、已核准流程
4. **階段 4：整合專案** - 報價單轉換為專案
5. **階段 5：模板系統** - 預設報價單模板
6. **階段 6：統計報表** - 報價金額分析、成交率

---

## 📞 需要協助？

如果在實施過程中遇到問題：
1. 檢查 Console 是否有錯誤訊息
2. 使用 `npm run build` 確認沒有編譯錯誤
3. 查看 GitHub Actions 的每日健康檢查報告

---

**祝您開發順利！** 🚀
