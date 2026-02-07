/**
 * 標準備註庫 - 報價單常用備註
 */

export interface StandardNote {
    id: string;
    category: string;  // 分類：施工說明、付款條件、保固條款等
    content: string;
    order: number;     // 顯示順序
}

export const STANDARD_NOTES: StandardNote[] = [
    {
        id: 'location-alley',
        category: '施工條件',
        content: '因位置處於巷弄內，車輛無法進入，故搬運成本較高。',
        order: 1
    },
    {
        id: 'paint-repair-local',
        category: '施工範圍',
        content: '油漆修補僅限於施工位置局部修補。',
        order: 2
    },
    {
        id: 'work-schedule-detail',
        category: '工期說明',
        content: '雨遮預計3個工作天；窗戶施工預計4個工作天；室內預計3個工作天；共計10工作天。',
        order: 3
    },
    {
        id: 'rope-safety-cert',
        category: '安全規範',
        content: '工業繩索技術員施工符合「職業安全衛生法設施規則第225條」之規定，施工人員皆有繩索技術證照。',
        order: 4
    },
    {
        id: 'contract-advance-payment',
        category: '付款條件',
        content: '同意此報價後，將進行簽約，並於簽約後預付頭期工程款，以利工進。',
        order: 5
    },
    {
        id: 'bank-account-yushan',
        category: '付款資訊',
        content: '收款帳號 玉山銀行(808) 士林分行 戶名：台灣生活品質發展股份有限公司 帳號：0657-940-151307。',
        order: 6
    },
    {
        id: 'validity-warranty',
        category: '有效期與保固',
        content: '報價有效期限30天，並提供X年保固。',
        order: 7
    },
    {
        id: 'budget-estimation-only',
        category: '使用說明',
        content: '本報價單僅供預算評估，不做為報帳憑證使用。',
        order: 8
    }
];

/**
 * 根據分類獲取備註
 */
export const getNotesByCategory = (category: string): StandardNote[] => {
    return STANDARD_NOTES.filter(note => note.category === category)
        .sort((a, b) => a.order - b.order);
};

/**
 * 獲取所有分類
 */
export const getCategories = (): string[] => {
    const categories = new Set(STANDARD_NOTES.map(note => note.category));
    return Array.from(categories);
};
