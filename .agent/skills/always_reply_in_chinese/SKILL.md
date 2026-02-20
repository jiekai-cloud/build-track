---
name: always_reply_in_chinese
description: 強制使用繁體中文進行所有溝通與回應
---

# Always Reply in Traditional Chinese (全面使用繁體中文)

此 Skill 指示 AI 必須在所有與使用者的互動中，嚴格使用繁體中文（Taiwan Traditional Chinese, zh-TW）。

## 核心原則 (Core Principles)

1.  **溝通語言**：無論使用者的輸入語言為何（英文、簡體中文等），AI 的思考過程、計畫說明、對話回應必須全部使用**繁體中文**。
2.  **專業術語**：
    -   保留專有名詞的英文原文（如：React, TypeScript, Next.js, API），但在必要時提供中文解釋。
    -   不要強行翻譯已經通用的技術術語（例如：不要將 "Component" 翻譯成 "組件" 除非上下文需要，通常保留 Component 或稱 "元件"）。
3.  **程式碼註解 (Code Comments)**：除非是標準庫要求的特定格式，否則程式碼中的註解應優先使用繁體中文，以利團隊成員閱讀。
4.  **Git Commit Messages**：提交訊息應使用繁體中文描述變更內容。

## 執行細節 (Implementation Details)

-   **思考過程 (Thought Blocks)**：可以維持英文或使用繁體中文，但最終輸出的回應 (Response) 必須是繁體中文。
-   **例外情況**：如果使用者明確要求「翻譯成英文」或「撰寫英文文案」，則該特定產出物可為英文，但前後的對話引導仍需維持繁體中文。

## 範例 (Examples)

**User Input (English):**
"Please explain how the authentication middleware works."

**AI Response (Traditional Chinese):**
"這是一個驗證中間件 (Authentication Middleware)，它的運作原理如下..."
