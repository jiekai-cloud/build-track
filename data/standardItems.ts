import { ItemCategory } from '../types';

// 定義標準工項資料庫結構
export interface StandardItemCategory {
    id: string;
    name: string;
    code: string; // 預設分類代號 (壹、貳...)
    items: StandardItem[];
}

export interface StandardItem {
    id: string;
    name: string;
    unit: string; // 單位
    defaultPrice: number; // 預設單價
    notes?: string; // 備註
}

// 標準工項資料庫內容 - 包含 Excel 完整提取的項目
export const STANDARD_QUOTATION_ITEMS: StandardItemCategory[] = [
    {
        id: 'cat-demo',
        name: '拆除工程',
        code: '壹',
        items: [
            // Excel 提取項目
            { id: 'demo-xl-1-full', name: 'RC面打除至露出鋼筋', unit: 'SM', defaultPrice: 1000, notes: '含混凝土碎塊及殘渣合法清運' },
            { id: 'demo-xl-2-full', name: '拆除隔熱層、防水層及PC層至RC面', unit: 'SM', defaultPrice: 2300, notes: '含廢料清運' },
            { id: 'demo-xl-3-full', name: '拆除混凝土PC層至PS隔熱層', unit: 'SM', defaultPrice: 1000, notes: '含廢棄物運至指定地點' },
            { id: 'demo-xl-4-full', name: '水溝切割拆除至RC面 W=20cm以下', unit: 'M', defaultPrice: 5580, notes: '含廢料清運' },
            { id: 'demo-xl-5-full', name: '混凝土面電鋸切割', unit: 'M', defaultPrice: 92, notes: '含粉塵收集' },
            { id: 'demo-xl-6-full', name: '混凝土地坪伸縮縫切割', unit: 'M', defaultPrice: 276, notes: '工料' },
            { id: 'demo-xl-7-full', name: '挖除既有老舊矽利康填縫材', unit: 'M', defaultPrice: 184, notes: '含周邊以藥劑清潔和廢料清運' },
            { id: 'demo-xl-8-full', name: 'RC面打毛', unit: 'SM', defaultPrice: 920, notes: '含廢料清運' },
            { id: 'demo-xl-9-full', name: '施工面高壓水清洗', unit: 'SM', defaultPrice: 920, notes: '含人工小搬運' },

            // 通用預設項目
            { id: 'demo-1', name: '原有隔間牆拆除', unit: 'M2', defaultPrice: 450, notes: '含清運' },
            { id: 'demo-2', name: '原有地磚拆除', unit: 'M2', defaultPrice: 650, notes: '打除至結構面' },
            { id: 'demo-3', name: '原有天花板拆除', unit: '坪', defaultPrice: 1200, notes: '含燈具線路拆除' },
            { id: 'demo-4', name: '舊有廚具拆除', unit: '套', defaultPrice: 2500, notes: '含清運' },
            { id: 'demo-5', name: '舊有衛浴設備拆除', unit: '間', defaultPrice: 3500, notes: '馬桶/面盆/浴缸/天花板' },
        ]
    },
    {
        id: 'cat-masonry',
        name: '泥作及結構補強',
        code: '貳',
        items: [
            // Excel 提取項目
            { id: 'mas-xl-1-full', name: '鋼筋除鏽防鏽處理', unit: 'SM', defaultPrice: 500, notes: '責任施工' },
            { id: 'mas-xl-2-full', name: 'RC頂板面以強固輕質環氧樹脂砂漿結構修補填平', unit: 'SM', defaultPrice: 3000, notes: 'STRONG EPOXY 502' },
            { id: 'mas-xl-3-full', name: '牆面輕質砂漿填平復原', unit: 'SM', defaultPrice: 2500, notes: '強固SP-502AB+石英砂' },
            { id: 'mas-xl-4-full', name: '無塵室牆體裂縫低壓灌注鋼板結構補強EPOXY', unit: 'M', defaultPrice: 3000, notes: '強固SP-869AB，含SP-70AB封塞' },
            { id: 'mas-xl-5-full', name: '碳纖維補強(貼覆二層)', unit: 'SM', defaultPrice: 10000, notes: '200g/m2, 抗拉35000kg/cm2' },
            { id: 'mas-xl-6-full', name: '樹脂砂漿粉刷洩水斜坡 H=3-12cm以內', unit: 'SM', defaultPrice: 2300, notes: '含材料搬運費' },
            { id: 'mas-xl-7-full', name: '水溝樹脂砂漿粉刷洩水斜坡 H=3-12cm以內', unit: 'M', defaultPrice: 2576, notes: '含材料搬運費 (515+2061)' },
            { id: 'mas-xl-8-full', name: '牆角隅處施作德國亞德士快速止水粉倒角 (ARDEX 66.M)', unit: 'M', defaultPrice: 910, notes: '3 KG/M (110+800)' },

            // 通用預設項目
            { id: 'mas-1', name: '1:3 水泥粉光', unit: 'M2', defaultPrice: 1200, notes: '牆面/地面' },
            { id: 'mas-2', name: '浴室地坪打底', unit: '間', defaultPrice: 6000, notes: '含止水墩設置' },
            { id: 'mas-3', name: '貼國產地磚 (30x30)', unit: '坪', defaultPrice: 5500, notes: '不含磁磚材料' },
            { id: 'mas-4', name: '新建 4吋 磚牆', unit: 'M2', defaultPrice: 2800, notes: '含植筋' },
        ]
    },
    {
        id: 'cat-waterproof',
        name: '防水工程',
        code: '參',
        items: [
            // Excel 提取項目 (專業防水)
            { id: 'wp-xl-1-full', name: '高壓灌注德國明氏彈性發泡樹脂 MC-INJEKT 2133', unit: 'PC', defaultPrice: 1200, notes: '灌注二次，含孔洞填平' },
            { id: 'wp-xl-2-full', name: '高壓灌注德國明氏發泡樹脂&彈性密封樹脂 (MC 2188 & 2300)', unit: 'PC', defaultPrice: 1472, notes: '灌注二次 (872+600)' },
            { id: 'wp-xl-3-full', name: '無塵室內高壓灌注德國明氏彈性發泡樹脂 MC-INJEKT 2133', unit: 'PC', defaultPrice: 3500, notes: '灌注二次，含集塵及無線施工' },
            { id: 'wp-xl-4-full', name: '無塵室裂縫及孔洞封塞 (強固SP-70AB)', unit: 'PC', defaultPrice: 300, notes: '' },
            { id: 'wp-xl-5-full', name: '伸縮縫專用高彈性填縫材填縫防水 Sikaflex® PRO-3', unit: 'M', defaultPrice: 2760, notes: '單液型萬用彈性地坪填縫膠 (1500+1260)' },
            { id: 'wp-xl-6-full', name: '伸縮縫專用高彈性填縫材 Sikaflex® 406 KC', unit: 'M', defaultPrice: 3500, notes: '自流平PU膠，含泡棉條' },
            { id: 'wp-xl-7-full', name: '矽利康填縫材 SikaHyflex 305AP', unit: 'M', defaultPrice: 552, notes: '耐候防水膠，含泡棉條 (150+402)' },
            { id: 'wp-xl-8-full', name: '塗佈美國蓋福不垂流水性填縫材 GAF ROOFMATE', unit: 'SM', defaultPrice: 4600, notes: '1 KG/SM (600+4000)' },
            { id: 'wp-xl-9-full', name: '塗佈德國明氏裂縫橋接性耐候型防塵防水塗料', unit: 'SM', defaultPrice: 1650, notes: 'MC-Color Flair pure TWN' },
            { id: 'wp-xl-10-full', name: '鋪設抗裂纖維網', unit: 'SM', defaultPrice: 300, notes: '工料' },
            { id: 'wp-xl-11-full', name: '螺絲貼覆防水鋁貼 GAF CAPS', unit: 'PC', defaultPrice: 95, notes: '(15+80)' },
            { id: 'wp-xl-12-full', name: '貼覆防水抗裂纖維膠帶 GAF UNITAPE', unit: 'M', defaultPrice: 230, notes: 'W≤4" (75+155)' },
            { id: 'wp-xl-13-full', name: '塗佈瑞士西卡快速硬化型單組份聚胺脂 Sikalastic® 632 R', unit: 'SM', defaultPrice: 4000, notes: '2.5 KG/SM' },
            { id: 'wp-xl-14-full', name: '塗佈台灣平坦適透明防水材 (T009 & NPU12)', unit: 'SM', defaultPrice: 1380, notes: '一底二度 (380+1000)' },
            { id: 'wp-xl-15-full', name: '塗佈德國亞德士多功能水性環氧樹脂 ARDEX WPM256', unit: 'SM', defaultPrice: 1380, notes: '0.4 KG/SM (380+1000)' },
            { id: 'wp-xl-16-full', name: '塗佈德國亞德士水性環氧樹脂防水材 ARDEX WPM300', unit: 'SM', defaultPrice: 2300, notes: '2.5 KG/SM (650+1650)' },
            { id: 'wp-xl-17-full', name: '噴塗日本昭和陽離子超微粒打底材 SHOWA CATION PRIMER', unit: 'SM', defaultPrice: 1840, notes: '0.2KG/SM (400+1440)' },
            { id: 'wp-xl-18-full', name: '外牆面塗佈日本昭和賽漏踏可 G 彈性水泥防水材', unit: 'SM', defaultPrice: 1500, notes: '2 KG/SM' },
            { id: 'wp-xl-19-full', name: '噴塗日本昭和矽酸質系塗布防水材 CEREGUARD DS', unit: 'SM', defaultPrice: 1380, notes: '2.5 KG/SM (285+1095)' },
            { id: 'wp-xl-20-full', name: '牆角隅處施作瑞士西卡PU膠 倒角 (SIKA CONSTRUCTION)', unit: 'M', defaultPrice: 920, notes: '145 ML/M (150+770)' },
            { id: 'wp-xl-21-full', name: '管路周邊防火泥更新收頭處理 (HILTI CP606)', unit: 'PC', defaultPrice: 5700, notes: '防火丙烯酸密封劑 (2700+3000)' },
            { id: 'wp-xl-22-full', name: '落水頭防水收頭處理', unit: 'PC', defaultPrice: 4550, notes: '(1550+3000)' },
            { id: 'wp-xl-23-full', name: '屋頂落水頭更新為超速落水罩', unit: 'PC', defaultPrice: 1500, notes: '' },
            { id: 'wp-xl-24-full', name: '管路周邊防水收頭處理', unit: 'PC', defaultPrice: 552, notes: '(100+452)' },
            { id: 'wp-xl-25-full', name: '滴水線配裝 (L-19&Q-40)', unit: 'M', defaultPrice: 1840, notes: '含矽利康收邊 (840+1000)' },

            // 通用預設項目
            { id: 'wp-1', name: '浴室地面防水 (彈性水泥 1底2度)', unit: '間', defaultPrice: 4500, notes: '轉角抗裂網補強' },
            { id: 'wp-2', name: '浴室牆面防水 (高度至天花板)', unit: '間', defaultPrice: 6000, notes: '' },
            { id: 'wp-3', name: '頂樓 PU 防水 (底/中/面漆)', unit: '坪', defaultPrice: 4500, notes: '含素地整理' },
        ]
    },
    {
        id: 'cat-paint',
        name: '油漆工程',
        code: '肆',
        items: [
            // Excel 提取項目
            { id: 'paint-xl-1-full', name: '無塵室地坪塗布無溶劑型環氧樹脂 一底二度', unit: 'SM', defaultPrice: 3000, notes: '長城大地KL-229、KL-230' },
            { id: 'paint-xl-2-full', name: '鋼構除鏽防鏽處理', unit: 'SM', defaultPrice: 2000, notes: '鐵衛R-790常溫鐵鏽轉化劑' },
            { id: 'paint-xl-3-full', name: '鋼構塗布防蝕漆 一底二度', unit: 'SM', defaultPrice: 3000, notes: '長城大地KL-409、KL-530' },
            { id: 'paint-xl-4-full', name: '牆面粉刷水泥漆二道 (虹牌450)', unit: 'SM', defaultPrice: 1380, notes: '(100+1280)' },
            { id: 'paint-xl-5-full', name: '牆面腰帶粉刷水泥漆二道', unit: 'M', defaultPrice: 250, notes: '' },
            { id: 'paint-xl-6-full', name: '牆面披土', unit: 'SM', defaultPrice: 1380, notes: '(100+1280)' },
            { id: 'paint-xl-7-full', name: '踢腳板油漆粉刷', unit: 'M', defaultPrice: 250, notes: '' },
        ]
    },
    {
        id: 'cat-misc',
        name: '假設及雜項工程',
        code: '伍',
        items: [
            // Excel 提取項目
            { id: 'misc-xl-1-full', name: '吊車承攬 45噸', unit: 'ST', defaultPrice: 40000, notes: '天' },
            { id: 'misc-xl-2-full', name: '吊車承攬 100噸', unit: 'ST', defaultPrice: 55000, notes: '天' },
            { id: 'misc-xl-3-full', name: '指揮及吊掛作業人員', unit: 'ST', defaultPrice: 2500, notes: '工作8小時內' },
            { id: 'misc-xl-4-full', name: '高空自走作業車租用 (10M以下)', unit: 'ST', defaultPrice: 15000, notes: '租期3天以內，一天租金' },
            { id: 'misc-xl-5-full', name: '高空自走作業車租用 (36M)', unit: 'ST', defaultPrice: 30000, notes: '租期3天以內，一天租金' },
            { id: 'misc-xl-6-full', name: '高空作業車指揮工作人員', unit: 'ST', defaultPrice: 3000, notes: '工作8小時內' },
            { id: 'misc-xl-7-full', name: '營建防水緊急入廠搶修基本工資', unit: 'ST', defaultPrice: 8000, notes: '出工1人/天' },
            { id: 'misc-xl-8-full', name: '搭拆安全母索租金', unit: 'M', defaultPrice: 2000, notes: '含鑽孔、拉脹螺絲、吊環固定及復原' },
            { id: 'misc-xl-9-full', name: '系統架搭拆', unit: 'M3', defaultPrice: 800, notes: '' },
            { id: 'misc-xl-10-full', name: '施工梯', unit: 'ST', defaultPrice: 2000, notes: '' },
            { id: 'misc-xl-11-full', name: '防塵網', unit: 'SM', defaultPrice: 100, notes: '' },
            { id: 'misc-xl-12-full', name: '結構計算書', unit: 'ST', defaultPrice: 30000, notes: '' },
            { id: 'misc-xl-13-full', name: '施工區域管制', unit: 'M', defaultPrice: 1000, notes: '含指揮人員及設備' },
            { id: 'misc-xl-14-full', name: '工安管理費', unit: 'ST', defaultPrice: 0, notes: '上限為單案總金額10%。含工作危害分析(JHA)、現場安全監督人员及PPE防護具' },
        ]
    },
    {
        id: 'cat-hydro',
        name: '水電工程',
        code: '陸',
        items: [
            { id: 'hydro-1', name: '全室電線更新 (太平洋/華新麗華 2.0mm)', unit: '式', defaultPrice: 35000, notes: '依坪數調整' },
            { id: 'hydro-2', name: '新增電源迴路 (專用迴路)', unit: '迴', defaultPrice: 2500, notes: '含無熔絲開關' },
            { id: 'hydro-3', name: '新增/位移 插座/開關', unit: '處', defaultPrice: 1800, notes: '含打鑿修補' },
        ]
    },
    {
        id: 'cat-wood',
        name: '木作工程',
        code: '柒',
        items: [
            { id: 'wood-1', name: '平釘天花板', unit: '坪', defaultPrice: 3800, notes: '日本矽酸鈣板' },
            { id: 'wood-2', name: '造型天花板', unit: '坪', defaultPrice: 4500, notes: '' },
        ]
    },
    {
        id: 'cat-window',
        name: '門窗工程',
        code: '捌',
        items: [
            { id: 'win-1', name: '氣密窗 (DK/錦鋐/正新) 5mm強化', unit: '才', defaultPrice: 550, notes: '含拆除清運' },
        ]
    },
    {
        id: 'cat-floor',
        name: '地坪工程 (其他)',
        code: '玖',
        items: [
            { id: 'floor-1', name: '超耐磨木地板', unit: '坪', defaultPrice: 4500, notes: '進口' },
            { id: 'floor-2', name: 'SPC 石塑地板', unit: '坪', defaultPrice: 3200, notes: '含靜音墊' },
        ]
    }
];
