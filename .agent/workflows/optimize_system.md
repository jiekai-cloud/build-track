---
description: 自動系統優化與重構流程
---
// turbo-all
1. 執行 `grep -n "useState(" src/App.tsx | wc -l` 來觀察主元件的狀態複雜度
2. 尋找系統中是否有過大、或超過 400 行的元件需要重構
3. 根據每天的檢查結果自動使用工具 `replace_file_content` 協助切割程式碼
4. 跑一次 `npm run test:e2e` 確認重構沒有弄壞系統
5. 上傳到 GitHub (`git add . && git commit -m "Refactor: 自動系統健檢與優化" && git push`)
