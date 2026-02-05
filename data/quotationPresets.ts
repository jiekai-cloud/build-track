import { QuotationItem } from '../types';

export interface QuotationPreset {
    id: string;
    name: string;
    items: QuotationItem[];
    description?: string;
}

export const QUOTATION_PRESETS: QuotationPreset[] = [
    {
        id: 'general_quote',
        name: '一般報價單',
        description: '包含常用的防水工程、填縫、拆除清運及各式雜項工程。',
        items: [
            { id: 'g01', description: '牆面泛水/隔熱磚/舊有防水層 (拆除見底)', unit: 'M2', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g02', description: 'RC裂縫高壓灌注止水', unit: '針', quantity: 1, unitPrice: 500, total: 500, discount: 0, isCustom: false },
            { id: 'g03', description: '窗框崁縫灌注sw-323', unit: 'ST', quantity: 1, unitPrice: 2000, total: 2000, discount: 0, isCustom: false },
            { id: 'g04', description: '得利959倍剋漏防水塗料 (屋頂專用)', unit: 'M2', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g05', description: '得利強力防水底膠(5桶) A930-5', unit: 'ST', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g06', description: '得利A791絲滑乳膠漆(特白/1G)', unit: 'ST', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g07', description: 'Sikaflex® 11FC 彈性PU填縫膠/黏著劑', unit: 'M', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g08', description: 'Sikaflex® PRO-3單液型萬用彈性地坪填縫膠', unit: 'M', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g09', description: '砂利康填縫材 含泡棉條 SikaHyflex 355無汙染耐候防水膠填縫劑', unit: 'M', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g10', description: '排水管疏通清淤 含廢棄物合法運棄', unit: 'ST', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g11', description: '混凝土/磚牆 打除見底', unit: 'M2', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'g12', description: '垃圾清運', unit: '式', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'spiderman',
        name: '蜘蛛人報價單',
        description: '高空繩索作業專用，包含外牆巡檢、防水及清潔。',
        items: [
            { id: 's01', description: '外牆繩索檢測技術服務', unit: '式', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 's02', description: '永久掛點安裝', unit: '處', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 's03', description: '外牆磁磚修補 (含材料/工資)', unit: '式', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 's04', description: '外牆防水塗佈 (透明/有色)', unit: 'M2', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 's05', description: '外牆清洗 (高壓水柱)', unit: 'M2', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 's06', description: '矽利康更新 (窗框/伸縮縫)', unit: 'M', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'no_destruct_toilet',
        name: '免打除廁所報價單',
        description: '微創施工，適合居住中或不想大興土木的廁所翻修。',
        items: [
            { id: 'ndt01', description: '浴室高溫蒸氣清潔 (除霉/殺菌)', unit: '間', quantity: 1, unitPrice: 5000, total: 5000, discount: 0, isCustom: false },
            { id: 'ndt02', description: '磁磚縫滲透止漏液施作', unit: '式', quantity: 1, unitPrice: 8000, total: 8000, discount: 0, isCustom: false },
            { id: 'ndt03', description: '聚脲透明防水塗層 (地坪)', unit: '間', quantity: 1, unitPrice: 15000, total: 15000, discount: 0, isCustom: false },
            { id: 'ndt04', description: '矽利康更新 (抗霉型)', unit: '式', quantity: 1, unitPrice: 3500, total: 3500, discount: 0, isCustom: false },
            { id: 'ndt05', description: '五金配件拆裝保護', unit: '式', quantity: 1, unitPrice: 2000, total: 2000, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'destruct_toilet',
        name: '打除廁所報價單',
        description: '全面翻新，包含拆除、管線更新及防水施作。',
        items: [
            { id: 'dt01', description: '浴室設備/天花板拆除', unit: '間', quantity: 1, unitPrice: 5000, total: 5000, discount: 0, isCustom: false },
            { id: 'dt02', description: '地坪/壁磚打除見底 (含清運)', unit: '間', quantity: 1, unitPrice: 18000, total: 18000, discount: 0, isCustom: false },
            { id: 'dt03', description: '冷熱給水管更新 (壓接白鐵管)', unit: '式', quantity: 1, unitPrice: 12000, total: 12000, discount: 0, isCustom: false },
            { id: 'dt04', description: '排水管管口防水加強 (抗裂網)', unit: '處', quantity: 4, unitPrice: 500, total: 2000, discount: 0, isCustom: false },
            { id: 'dt05', description: '防水施作 (底塗+中塗+面塗 3道)', unit: '式', quantity: 1, unitPrice: 15000, total: 15000, discount: 0, isCustom: false },
            { id: 'dt06', description: '試水測試 (24-48小時)', unit: '式', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'dt07', description: '泥作打底/粉光', unit: '式', quantity: 1, unitPrice: 12000, total: 12000, discount: 0, isCustom: false },
            { id: 'dt08', description: '壁磚/地磚 貼磚工資', unit: '坪', quantity: 5, unitPrice: 5000, total: 25000, discount: 0, isCustom: false },
            { id: 'dt09', description: '衛浴設備安裝 (馬桶/面盆/淋浴)', unit: '式', quantity: 1, unitPrice: 6000, total: 6000, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'spc_toilet',
        name: 'SPC廁所報價單',
        description: '採用 SPC 石塑防水牆版，施工快速且質感優異。',
        items: [
            { id: 'spc01', description: '原有設備拆除 (不含浴缸)', unit: '間', quantity: 1, unitPrice: 3500, total: 3500, discount: 0, isCustom: false },
            { id: 'spc02', description: '牆面 SPC 轉接扣件安裝', unit: '式', quantity: 1, unitPrice: 4500, total: 4500, discount: 0, isCustom: false },
            { id: 'spc03', description: 'SPC 石塑防水牆版安裝 (含矽利康)', unit: '坪', quantity: 5, unitPrice: 8500, total: 42500, discount: 0, isCustom: false },
            { id: 'spc04', description: 'SPC 地板鋪設 (含收邊)', unit: '坪', quantity: 1.5, unitPrice: 4500, total: 6750, discount: 0, isCustom: false },
            { id: 'spc05', description: '衛浴設備復原安裝', unit: '式', quantity: 1, unitPrice: 5000, total: 5000, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'designer_items',
        name: '設計師項目報價單',
        description: '包含標準化浴室防水(不同保固年限)、負水壓及屋頂防水套裝。',
        items: [
            { id: 'di01', description: '標準浴室防水 (保固1年)', unit: '間', quantity: 1, unitPrice: 12000, total: 12000, discount: 0, isCustom: false },
            { id: 'di02', description: '加強型浴室防水 (保固3年)', unit: '間', quantity: 1, unitPrice: 18000, total: 18000, discount: 0, isCustom: false },
            { id: 'di03', description: '頂級浴室防水 (保固5年，含試水)', unit: '間', quantity: 1, unitPrice: 25000, total: 25000, discount: 0, isCustom: false },
            { id: 'di04', description: '負水壓止漏工程 (地下室/蓄水池)', unit: '處', quantity: 1, unitPrice: 0, total: 0, discount: 0, isCustom: false },
            { id: 'di05', description: '屋頂防水漆套裝 (30坪以內标准施作)', unit: '式', quantity: 1, unitPrice: 65000, total: 65000, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'ventilation',
        name: '透氣工法報價單',
        description: '屋頂專用透氣防水工法，解決水氣鼓起問題。',
        items: [
            { id: 'v01', description: '素地整理/高壓清洗', unit: 'M2', quantity: 1, unitPrice: 250, total: 250, discount: 0, isCustom: false },
            { id: 'v02', description: '地面研磨 (去除舊有老化層)', unit: 'M2', quantity: 1, unitPrice: 600, total: 600, discount: 0, isCustom: false },
            { id: 'v03', description: '切割透氣溝縫 (每 3M 一道)', unit: 'M', quantity: 1, unitPrice: 300, total: 300, discount: 0, isCustom: false },
            { id: 'v04', description: '埋設透氣管', unit: '支', quantity: 1, unitPrice: 1500, total: 1500, discount: 0, isCustom: false },
            { id: 'v05', description: '鋪設抗裂透氣網', unit: 'M2', quantity: 1, unitPrice: 400, total: 400, discount: 0, isCustom: false },
            { id: 'v06', description: '防水中塗層 (可透氣材質)', unit: 'M2', quantity: 1, unitPrice: 800, total: 800, discount: 0, isCustom: false },
            { id: 'v07', description: '隔熱面漆塗佈', unit: 'M2', quantity: 1, unitPrice: 500, total: 500, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'inorganic',
        name: '無機防水報價單',
        description: '利匯豐無機系統，環保無毒且長效。',
        items: [
            { id: 'io01', description: '無機滲透底塗 A劑', unit: 'M2', quantity: 1, unitPrice: 400, total: 400, discount: 0, isCustom: false },
            { id: 'io02', description: '無機防水中塗 B劑 (纖維補強)', unit: 'M2', quantity: 1, unitPrice: 700, total: 700, discount: 0, isCustom: false },
            { id: 'io03', description: '無機保護面塗 C劑 (耐候/抗汙)', unit: 'M2', quantity: 1, unitPrice: 500, total: 500, discount: 0, isCustom: false },
            { id: 'io04', description: '裂縫加強處理 (玻纖網貼附)', unit: 'M', quantity: 1, unitPrice: 250, total: 250, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'wall_cancer',
        name: '牆面壁癌報價單',
        description: '針對牆面起泡、粉化及壁癌問題的專業處置。',
        items: [
            { id: 'wc01', description: '壁癌牆面打除/研磨至結構層', unit: 'M2', quantity: 1, unitPrice: 1200, total: 1200, discount: 0, isCustom: false },
            { id: 'wc02', description: '瓦斯噴燈/熱風槍 高溫殺菌乾燥', unit: '式', quantity: 1, unitPrice: 1500, total: 1500, discount: 0, isCustom: false },
            { id: 'wc03', description: '矽酸質滲透結晶防水塗佈 (兩道)', unit: 'M2', quantity: 1, unitPrice: 800, total: 800, discount: 0, isCustom: false },
            { id: 'wc04', description: '防水批土整平', unit: 'M2', quantity: 1, unitPrice: 450, total: 450, discount: 0, isCustom: false },
            { id: 'wc05', description: '矽藻漆/防黴乳膠漆 粉刷', unit: 'M2', quantity: 1, unitPrice: 600, total: 600, discount: 0, isCustom: false }
        ]
    },
    {
        id: 'basement',
        name: '地下室報價單',
        description: '高壓灌注與負水壓防水，適用於停車場及梯間。',
        items: [
            { id: 'bm01', description: '高壓灌注止水 (單液型疏水發泡劑)', unit: '針', quantity: 1, unitPrice: 450, total: 450, discount: 0, isCustom: false },
            { id: 'bm02', description: '壁面滲水打磨處理', unit: 'M2', quantity: 1, unitPrice: 600, total: 600, discount: 0, isCustom: false },
            { id: 'bm03', description: '負水壓專用防水塗料 (兩底兩度)', unit: 'M2', quantity: 1, unitPrice: 1200, total: 1200, discount: 0, isCustom: false },
            { id: 'bm04', description: '導水板/排水板安裝', unit: 'M2', quantity: 1, unitPrice: 1800, total: 1800, discount: 0, isCustom: false },
            { id: 'bm05', description: '截水溝設置/清理', unit: 'M', quantity: 1, unitPrice: 2500, total: 2500, discount: 0, isCustom: false }
        ]
    }
];

export const GENERAL_TERMS = `
1. 合約審閱權：本報價單經雙方簽名用印後即視同正式合約，業主已充分行使合約審閱權。
2. 付款方式：簽約時支付總工程款 30% 為訂金；材料進場/開工支付 40%；完工驗收後 3 日內支付尾款 30%。
3. 有效期限：本報價單有效期限為 15 天，逾期需重新報價。
4. 變更設計：若需追加減工程，雙方應另行協議並簽署追加減帳單，費用另計。
5. 施工界面：本工程僅包含報價單所列項目，未列及之周邊修復或遷移工程不在本合約範圍內。
6. 保固條款：依合約約定年限提供保固 (天災人禍、結構變位等不可抗力因素除外)。
`;
