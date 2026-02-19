---
name: PDF Generation & Paging Seals
description: Standard operating procedures for generating PDF quotations with correct paging seals.
---

# PDF 報價單生成與騎縫章技能 (PDF Generation & Paging Seals)

這份技能文件定義了在此專案中生成 PDF 報價單與實作騎縫章的正確流程與規範。

## 1. 核心原則 (Core Principles)

*   **使用瀏覽器原生列印**：利用 `window.print()` 搭配 `@media print` CSS 來生成 PDF。
*   **獨立渲染層 (Portal)**：為了避免主畫面干擾，列印內容應透過 React Portal 渲染至獨立的根節點 (如 `#print-overlay-container`)。
*   **動態計算頁數**：不可依賴固定頁數，必須在渲染後測量內容高度來決定總頁數與騎縫章位置。
*   **絕對定位 (Absolute Positioning)**：騎縫章位置應使用 `mm` (毫米) 為單位，相對於 A4 頁面頂部進行絕對定位，嚴禁使用 `fixed` 定位（會導致每頁重複且位置錯誤）。

## 2. 騎縫章邏輯 (Paging Seal Logic)

騎縫章的目的是確保文件的連續性與防偽，其規則如下：

**基本公式：**
*   **總頁數 (N)**：動態計算所得。
*   **左半章 (Start of Pair)**：位於頁面 $i$ 的右側緣，代表第 $i$ 頁與第 $i+1$ 頁的連接點。
    *   顯示條件：當前頁面不是最後一頁 (`i < N - 1`)。
    *   位置：通常位於頁面較下方。
*   **右半章 (End of Pair)**：位於頁面 $i+1$ 的右側緣，代表第 $i$ 頁與第 $i+1$ 頁的連接點。
    *   顯示條件：當前頁面不是第一頁 (`i > 0`)。
    *   位置：通常位於頁面較上方，與上一頁的左半章水平對齊。

**特殊情況：**
*   **單頁文件 (Single Page)**：
    *   既是第一頁也是最後一頁。
    *   規則：**不顯示任何騎縫章**（因為沒有頁面連接處）。

## 3. 實作細節 (Implementation Details)

### 3.1 CSS 設定
確保列印時隱藏非必要元素，僅顯示列印容器：

```css
@media print {
    body > *:not(#print-overlay-container) { display: none !important; }
    #print-overlay-container { display: block !important; }
    @page { size: A4; margin: 15mm 0mm; } /* 邊距可調整 */
}
```

### 3.2 渲染策略

建議使用 `QuotationPrintTemplate.tsx` 中的邏輯：
1.  **測量階段**：先將內容渲染出來，利用 `ref.current.scrollHeight` 取得總高度。
2.  **計算階段**：`lines = Math.ceil(height / A4_HEIGHT_PX)`。
3.  **繪製階段**：
    *   `Array.from({ length: pageCount }).map((_, i) => ...)`
    *   使用 `position: absolute`，`top: ${i * 297 + offsetY}mm`。

### 3.3 視覺樣式
*   `mix-blend-mode: multiply`：模擬真實印章蓋在紙上的效果（透明疊加）。
*   `z-index: 99999`：確保印章在最上層。
*   `pointer-events: none`：避免遮擋內容互動。

## 4. 常見陷阱 (Pitfalls)

*   **陷阱 1：使用 `position: fixed`**
    *   後果：印章會出現在每一頁的相同位置，無法實現「階梯式」或「上下錯開」的效果。
    *   解法：必須用 `absolute` 並計算每頁的 `top` 偏移量。
*   **陷阱 2：圖片被切裁**
    *   後果：騎縫章的圖片應為半圓形，若原圖是整圓，需確保切割正確或使用 `object-position`。
*   **陷阱 3：單頁文件顯示印章**
    *   後果：單頁文件顯示半個印章，讓使用者困惑。
    *   解法：嚴格遵守 `i < N-1` 和 `i > 0` 的邏輯。

## 5. 資源 (Resources)

*   相關組件：`components/QuotationPrintTemplate.tsx`
*   相關圖片：`services/stampImage.ts` (定義 `SEAL_LEFT_BASE64`, `SEAL_RIGHT_BASE64`)
