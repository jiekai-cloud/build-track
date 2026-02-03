import { Quotation, QuotationOption, ItemCategory, QuotationItem } from '../types';
import { STANDARD_QUOTATION_ITEMS } from './standardItems';

export interface QuotationPreset {
    id: string;
    name: string;
    description: string;
    items: {
        categoryCode: string; // 對應 StandardItemCategory.code (壹, 貳...)
        itemIds: string[]; // 對應 StandardItem.id
    }[];
}

// Helper to create quotation from preset
export const createQuotationFromPreset = (preset: QuotationPreset): QuotationOption => {
    const categories: ItemCategory[] = [];

    preset.items.forEach(presetCategory => {
        // Find standard category to get name
        const standardCategory = STANDARD_QUOTATION_ITEMS.find(c => c.code === presetCategory.categoryCode);
        if (!standardCategory) return;

        const newCategory: ItemCategory = {
            id: crypto.randomUUID(),
            code: standardCategory.code,
            name: standardCategory.name,
            items: []
        };

        presetCategory.itemIds.forEach((itemId, index) => {
            // Find item in standard items (searching through all categories)
            let standardItem = null;
            for (const cat of STANDARD_QUOTATION_ITEMS) {
                const found = cat.items.find(i => i.id === itemId);
                if (found) {
                    standardItem = found;
                    break;
                }
            }

            if (standardItem) {
                newCategory.items.push({
                    id: crypto.randomUUID(),
                    itemNumber: index + 1,
                    name: standardItem.name,
                    unit: standardItem.unit,
                    quantity: 1,
                    unitPrice: standardItem.defaultPrice,
                    amount: standardItem.defaultPrice,
                    notes: standardItem.notes
                });
            }
        });

        if (newCategory.items.length > 0) {
            categories.push(newCategory);
        }
    });

    return {
        id: crypto.randomUUID(),
        name: preset.name,
        description: preset.description,
        categories: categories,
        summary: {
            subtotal: 0,
            managementFee: 0,
            managementFeeRate: 10,
            beforeTaxAmount: 0,
            tax: 0,
            taxRate: 5,
            totalAmount: 0
        }
    };
};

export const QUOTATION_PRESETS: QuotationPreset[] = [
    {
        id: 'template-waterproof-full',
        name: '完整防水工程範本',
        description: '包含高壓灌注、專業塗佈及相關雜項工程',
        items: [
            {
                categoryCode: '參', // 防水工程
                itemIds: [
                    'wp-xl-1-full', // 高壓灌注 MC-INJEKT 2133
                    'wp-xl-3-full', // 無塵室內高壓灌注
                    'wp-xl-13-full', // Sikalastic® 632 R
                    'wp-xl-16-full', // ARDEX WPM300
                    'wp-xl-21-full', // 管路周邊防火泥
                    'wp-xl-25-full'  // 滴水線配裝
                ]
            },
            {
                categoryCode: '伍', // 假設及雜項
                itemIds: [
                    'misc-xl-1-full', // 吊車 45T
                    'misc-xl-7-full', // 緊急搶修工資
                    'misc-xl-13-full' // 施工區域管制
                ]
            }
        ]
    },
    {
        id: 'template-structure-reinforce',
        name: '結構補強工程範本',
        description: '針對 RC 結構修補、鋼筋除鏽及碳纖維補強',
        items: [
            {
                categoryCode: '壹', // 拆除工程
                itemIds: [
                    'demo-xl-1-full', // RC面打除至露出鋼筋
                    'demo-xl-8-full', // RC面打毛
                    'demo-xl-9-full'  // 高壓水清洗
                ]
            },
            {
                categoryCode: '貳', // 泥作及結構補強
                itemIds: [
                    'mas-xl-1-full', // 鋼筋除鏽
                    'mas-xl-2-full', // Epoxy 結構修補
                    'mas-xl-5-full', // 碳纖維補強
                    'mas-xl-4-full'  // 裂縫低壓灌注
                ]
            },
            {
                categoryCode: '伍', // 假設及雜項
                itemIds: [
                    'misc-xl-12-full', // 結構計算書
                    'misc-xl-14-full'  // 工安管理費
                ]
            }
        ]
    },
    {
        id: 'template-factory-painting',
        name: '廠房塗裝與地坪範本',
        description: '無塵室地坪、鋼構防蝕漆',
        items: [
            {
                categoryCode: '肆', // 油漆工程
                itemIds: [
                    'paint-xl-1-full', // 無塵室 Epoxy
                    'paint-xl-2-full', // 鋼構除鏽
                    'paint-xl-3-full'  // 鋼構防蝕漆
                ]
            },
            {
                categoryCode: '壹', // 拆除
                itemIds: [
                    'demo-xl-5-full', // 混凝土電鋸切割
                    'demo-xl-6-full'  // 伸縮縫切割
                ]
            },
            {
                categoryCode: '參', // 防水 (用於填縫)
                itemIds: [
                    'wp-xl-6-full', // Sikaflex 406 KC
                    'wp-xl-7-full'  // SikaHyflex 305AP
                ]
            }
        ]
    }
];
