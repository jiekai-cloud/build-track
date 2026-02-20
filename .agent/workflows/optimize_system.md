---
description: 自動系統優化與重構流程
---

# System Optimization Workflow

此工作流程用於自動診斷並優化系統代碼。它會執行健康檢查腳本，分析報告，並建議重構方案。

## 1. 執行健康檢查
這一步會掃描整個代碼庫，生成詳細的健康報告。

// turbo
```bash
node scripts/health-check.js
```

## 2. 分析作為
請閱讀生成的 `system_health_report.json`，並針對 "Top 3 Candidates" (分數最高的檔案) 提出重構計劃。

重構策略範例：
1. **拆分組件 (Extract Components)**: 如果檔案超過 400 行，嘗試將部分 UI 拆分為獨立組件。
2. **提取 Hooks (Custom Hooks)**: 如果 `useState` 超過 10 個，將相關邏輯提取為 `useLogic.ts`。
3. **移除死碼 (Dead Code)**: 檢查並建議移除未使用的 imports 或變數。

## 3. 執行重構
在用戶確認後，對排名第一的候選檔案執行重構。

## 4. 驗證
重構後，確保相關功能正常運作，且無 TypeScript 錯誤。
