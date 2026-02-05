import { QuotationOption, ItemCategory, QuotationItem, QuotationSummary } from '../types';

export interface QuotationPreset {
    id: string;
    name: string;
    description: string;
    categories: {
        name: string;
        code: string;
        items: {
            name: string;
            unit: string;
            quantity: number;
            unitPrice: number;
            notes?: string;
        }[];
    }[];
}

export const QUOTATION_PRESETS: QuotationPreset[] = [
    {
        id: 'general_quote',
        name: '一般報價單',
        description: '包含常用的防水工程、填縫、拆除清運及各式雜項工程。',
        categories: [
            {
                code: '壹',
                name: '工程項目',
                items: [
                    { name: '牆面泛水/隔熱磚/舊有防水層 (拆除見底)', unit: 'M2', quantity: 1, unitPrice: 0 },
                    { name: 'RC裂縫高壓灌注止水', unit: '針', quantity: 1, unitPrice: 500 },
                    { name: '窗框崁縫灌注sw-323', unit: 'ST', quantity: 1, unitPrice: 2000 },
                    { name: '得利959倍剋漏防水塗料 (屋頂專用)', unit: 'M2', quantity: 1, unitPrice: 0 },
                    { name: '得利強力防水底膠(5桶) A930-5', unit: 'ST', quantity: 1, unitPrice: 0 },
                    { name: '得利A791絲滑乳膠漆(特白/1G)', unit: 'ST', quantity: 1, unitPrice: 0 },
                    { name: 'Sikaflex® 11FC 彈性PU填縫膠/黏著劑', unit: 'M', quantity: 1, unitPrice: 0 },
                    { name: 'Sikaflex® PRO-3單液型萬用彈性地坪填縫膠', unit: 'M', quantity: 1, unitPrice: 0 },
                    { name: '砂利康填縫材 含泡棉條 SikaHyflex 355無汙染耐候防水膠填縫劑', unit: 'M', quantity: 1, unitPrice: 0 },
                    { name: '排水管疏通清淤 含廢棄物合法運棄', unit: 'ST', quantity: 1, unitPrice: 0 },
                    { name: '混凝土/磚牆 打除見底', unit: 'M2', quantity: 1, unitPrice: 0 },
                    { name: '垃圾清運', unit: '式', quantity: 1, unitPrice: 0 }
                ]
            }
        ]
    },
    {
        id: 'spiderman',
        name: '蜘蛛人報價單',
        description: '高空繩索作業專用，包含外牆巡檢、防水及清潔。',
        categories: [
            {
                code: '壹',
                name: '高空繩索作業',
                items: [
                    { name: '外牆繩索檢測技術服務', unit: '式', quantity: 1, unitPrice: 0 },
                    { name: '永久掛點安裝', unit: '處', quantity: 1, unitPrice: 0 },
                    { name: '外牆磁磚修補 (含材料/工資)', unit: '式', quantity: 1, unitPrice: 0 },
                    { name: '外牆防水塗佈 (透明/有色)', unit: 'M2', quantity: 1, unitPrice: 0 },
                    { name: '外牆清洗 (高壓水柱)', unit: 'M2', quantity: 1, unitPrice: 0 },
                    { name: '矽利康更新 (窗框/伸縮縫)', unit: 'M', quantity: 1, unitPrice: 0 }
                ]
            }
        ]
    },
    {
        id: 'no_destruct_toilet',
        name: '免打除廁所報價單',
        description: '微創施工，適合居住中或不想大興土木的廁所翻修。',
        categories: [
            {
                code: '壹',
                name: '浴室微創翻修',
                items: [
                    { name: '浴室高溫蒸氣清潔 (除霉/殺菌)', unit: '間', quantity: 1, unitPrice: 5000 },
                    { name: '磁磚縫滲透止漏液施作', unit: '式', quantity: 1, unitPrice: 8000 },
                    { name: '聚脲透明防水塗層 (地坪)', unit: '間', quantity: 1, unitPrice: 15000 },
                    { name: '矽利康更新 (抗霉型)', unit: '式', quantity: 1, unitPrice: 3500 },
                    { name: '五金配件拆裝保護', unit: '式', quantity: 1, unitPrice: 2000 }
                ]
            }
        ]
    },
    {
        id: 'destruct_toilet',
        name: '打除廁所報價單',
        description: '全面翻新，包含拆除、管線更新及防水施作。',
        categories: [
            {
                code: '壹',
                name: '浴室翻新工程',
                items: [
                    { name: '浴室設備/天花板拆除', unit: '間', quantity: 1, unitPrice: 5000 },
                    { name: '地坪/壁磚打除見底 (含清運)', unit: '間', quantity: 1, unitPrice: 18000 },
                    { name: '冷熱給水管更新 (壓接白鐵管)', unit: '式', quantity: 1, unitPrice: 12000 },
                    { name: '排水管管口防水加強 (抗裂網)', unit: '處', quantity: 4, unitPrice: 500 },
                    { name: '防水施作 (底塗+中塗+面塗 3道)', unit: '式', quantity: 1, unitPrice: 15000 },
                    { name: '試水測試 (24-48小時)', unit: '式', quantity: 1, unitPrice: 0 },
                    { name: '泥作打底/粉光', unit: '式', quantity: 1, unitPrice: 12000 },
                    { name: '壁磚/地磚 貼磚工資', unit: '坪', quantity: 5, unitPrice: 5000 },
                    { name: '衛浴設備安裝 (馬桶/面盆/淋浴)', unit: '式', quantity: 1, unitPrice: 6000 }
                ]
            }
        ]
    },
    {
        id: 'spc_toilet',
        name: 'SPC廁所報價單',
        description: '採用 SPC 石塑防水牆版，施工快速且質感優異。',
        categories: [
            {
                code: '壹',
                name: 'SPC 防水內裝工程',
                items: [
                    { name: '原有設備拆除 (不含浴缸)', unit: '間', quantity: 1, unitPrice: 3500 },
                    { name: '牆面 SPC 轉接扣件安裝', unit: '式', quantity: 1, unitPrice: 4500 },
                    { name: 'SPC 石塑防水牆版安裝 (含矽利康)', unit: '坪', quantity: 5, unitPrice: 8500 },
                    { name: 'SPC 地板鋪設 (含收邊)', unit: '坪', quantity: 1.5, unitPrice: 4500 },
                    { name: '衛浴設備復原安裝', unit: '式', quantity: 1, unitPrice: 5000 }
                ]
            }
        ]
    },
    {
        id: 'designer_items',
        name: '設計師項目報價單',
        description: '包含標準化浴室防水(不同保固年限)、負水壓及屋頂防水套裝。',
        categories: [
            {
                code: '壹',
                name: '專業防水專案',
                items: [
                    { name: '標準浴室防水 (保固1年)', unit: '間', quantity: 1, unitPrice: 12000 },
                    { name: '加強型浴室防水 (保固3年)', unit: '間', quantity: 1, unitPrice: 18000 },
                    { name: '頂級浴室防水 (保固5年，含試水)', unit: '間', quantity: 1, unitPrice: 25000 },
                    { name: '負水壓止漏工程 (地下室/蓄水池)', unit: '處', quantity: 1, unitPrice: 0 },
                    { name: '屋頂防水漆套裝 (30坪以內标准施作)', unit: '式', quantity: 1, unitPrice: 65000 }
                ]
            }
        ]
    },
    {
        id: 'ventilation',
        name: '透氣工法報價單',
        description: '屋頂專用透氣防水工法，解決水氣鼓起問題。',
        categories: [
            {
                code: '壹',
                name: '透氣防水系統',
                items: [
                    { name: '素地整理/高壓清洗', unit: 'M2', quantity: 1, unitPrice: 250 },
                    { name: '地面研磨 (去除舊有老化層)', unit: 'M2', quantity: 1, unitPrice: 600 },
                    { name: '切割透氣溝縫 (每 3M 一道)', unit: 'M', quantity: 1, unitPrice: 300 },
                    { name: '埋設透氣管', unit: '支', quantity: 1, unitPrice: 1500 },
                    { name: '鋪設抗裂透氣網', unit: 'M2', quantity: 1, unitPrice: 400 },
                    { name: '防水中塗層 (可透氣材質)', unit: 'M2', quantity: 1, unitPrice: 800 },
                    { name: '隔熱面漆塗佈', unit: 'M2', quantity: 1, unitPrice: 500 }
                ]
            }
        ]
    },
    {
        id: 'inorganic',
        name: '無機防水報價單',
        description: '利匯豐無機系統，環保無毒且長效。',
        categories: [
            {
                code: '壹',
                name: '無機塗裝工程',
                items: [
                    { name: '無機滲透底塗 A劑', unit: 'M2', quantity: 1, unitPrice: 400 },
                    { name: '無機防水中塗 B劑 (纖維補強)', unit: 'M2', quantity: 1, unitPrice: 700 },
                    { name: '無機保護面塗 C劑 (耐候/抗汙)', unit: 'M2', quantity: 1, unitPrice: 500 },
                    { name: '裂縫加強處理 (玻纖網貼附)', unit: 'M', quantity: 1, unitPrice: 250 }
                ]
            }
        ]
    },
    {
        id: 'wall_cancer',
        name: '牆面壁癌報價單',
        description: '針對牆面起泡、粉化及壁癌問題的專業處置。',
        categories: [
            {
                code: '壹',
                name: '壁癌整治工程',
                items: [
                    { name: '壁癌牆面打除/研磨至結構層', unit: 'M2', quantity: 1, unitPrice: 1200 },
                    { name: '瓦斯噴燈/熱風槍 高溫殺菌乾燥', unit: '式', quantity: 1, unitPrice: 1500 },
                    { name: '矽酸質滲透結晶防水塗佈 (兩道)', unit: 'M2', quantity: 1, unitPrice: 800 },
                    { name: '防水批土整平', unit: 'M2', quantity: 1, unitPrice: 450 },
                    { name: '矽藻漆/防黴乳膠漆 粉刷', unit: 'M2', quantity: 1, unitPrice: 600 }
                ]
            }
        ]
    },
    {
        id: 'basement',
        name: '地下室報價單',
        description: '高壓灌注與負水壓防水，適用於停車場及梯間。',
        categories: [
            {
                code: '壹',
                name: '地下結構止水',
                items: [
                    { name: '高壓灌注止水 (單液型疏水發泡劑)', unit: '針', quantity: 1, unitPrice: 450 },
                    { name: '壁面滲水打磨處理', unit: 'M2', quantity: 1, unitPrice: 600 },
                    { name: '負水壓專用防水塗料 (兩底兩度)', unit: 'M2', quantity: 1, unitPrice: 1200 },
                    { name: '導水板/排水板安裝', unit: 'M2', quantity: 1, unitPrice: 1800 },
                    { name: '截水溝設置/清理', unit: 'M', quantity: 1, unitPrice: 2500 }
                ]
            }
        ]
    }
];

export const createQuotationFromPreset = (preset: QuotationPreset): QuotationOption => {
    const categories: ItemCategory[] = preset.categories.map(cat => ({
        id: crypto.randomUUID(),
        code: cat.code,
        name: cat.name,
        items: cat.items.map((item, idx) => ({
            id: crypto.randomUUID(),
            itemNumber: idx + 1,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice,
            notes: item.notes
        }))
    }));

    // Calculate initial summary
    let subtotal = 0;
    categories.forEach(cat => {
        cat.items.forEach(item => {
            subtotal += item.amount;
        });
    });

    const mgmtFeeRate = 10;
    const taxRate = 5;
    const managementFee = Math.round(subtotal * (mgmtFeeRate / 100));
    const beforeTax = subtotal + managementFee;
    const tax = Math.round(beforeTax * (taxRate / 100));
    const total = beforeTax + tax;

    return {
        id: crypto.randomUUID(),
        name: preset.name,
        description: preset.description || '',
        categories: categories,
        summary: {
            subtotal,
            managementFee,
            managementFeeRate: mgmtFeeRate,
            beforeTaxAmount: beforeTax,
            tax,
            taxRate: taxRate,
            totalAmount: total
        }
    };
};

export const GENERAL_TERMS = `
1. 合約審閱權：本報價單經雙方簽名用印後即視同正式合約，業主已充分行使合約審閱權。
2. 付款方式：簽約時支付總工程款 30% 為訂金；材料進場/開工支付 40%；完工驗收後 3 日內支付尾款 30%。
3. 有效期限：本報價單有效期限為 15 天，逾期需重新報價。
4. 變更設計：若需追加減工程，雙方應另行協議並簽署追加減帳單，費用另計。
5. 施工界界面：本工程僅包含報價單所列項目，未列及之周邊修復或遷移工程不在本合約範圍內。
6. 保固條款：依合約約定年限提供保固 (天災人禍、結構變位等不可抗力因素除外)。
`;
