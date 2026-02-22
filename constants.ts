import { Project, ProjectStatus, Department, TeamMember } from './types';

export const SYSTEM_VERSION = 'V3.5';

/**
 * 傑凱工程升遷與薪資管理辦法 (2026 實施)
 * 支援管理職與技術職雙軌制
 */
export const JOB_LEVEL_RULES = [
  { level: 1, title: '總經理', minPay: 150000, maxPay: 200000, bonus: '依績效', lunchBonus: 0, type: 'monthly' },
  { level: 2, title: '副總、特助 / 工地的傳奇', minPay: 90000, maxPay: 150000, bonus: '300/日', lunchBonus: 300, type: 'monthly' },
  { level: 3, title: '協理 / 工地的菁英', minPay: 80000, maxPay: 110000, bonus: '250/日', lunchBonus: 250, type: 'daily' },
  { level: 4, title: '部經理 / 工地高級高階工人', minPay: 65000, maxPay: 90000, bonus: '200/日', lunchBonus: 200, type: 'daily' },
  { level: 5, title: '副理 / 代理部經理 / 工地資深高階工人', minPay: 55000, maxPay: 75000, bonus: '150/日', lunchBonus: 150, type: 'daily' },
  { level: 6, title: '工地現場工程師 / 工地高階工人', minPay: 45000, maxPay: 65000, bonus: '175/日', lunchBonus: 175, type: 'daily' },
  { level: 7, title: '現場助理 / 行政助理 / 工地中高階工人', minPay: 35000, maxPay: 48000, bonus: '150/日', lunchBonus: 150, type: 'daily' },
  { level: 8, title: '工地中階工人', minPay: 2000, maxPay: 2200, bonus: '150/日', lunchBonus: 150, type: 'daily' },
  { level: 9, title: '工地初階工人', minPay: 1900, maxPay: 2000, bonus: '150/日', lunchBonus: 150, type: 'daily' },
  { level: 10, title: '工地初心者', minPay: 1800, maxPay: 1900, bonus: '100/日', lunchBonus: 100, type: 'daily' },
];

export const MOCK_DEPARTMENTS: Department[] = [
  { id: 'DEPT-1', name: '戰略指揮部', color: '#6366f1', manager: '總經理' },
  { id: 'DEPT-2', name: '人事行政部', color: '#64748b', manager: '行政主管' },
  { id: 'DEPT-3', name: '財務部', color: '#0284c7', manager: '財務主管' },
  { id: 'DEPT-4', name: '生活品質 第一工程部', color: '#16a34a', manager: '工務主管' },
  { id: 'DEPT-5', name: '品質管理部', color: '#8b5cf6', manager: '品管主管' },
  { id: 'DEPT-6', name: '業務部', color: '#ea580c', manager: '業務經理' },
  { id: 'DEPT-7', name: '行銷部', color: '#ec4899', manager: '行銷經理' },
  { id: 'DEPT-8', name: '傑凱工程 第三工程部', color: '#0ea5e9', manager: '工務主管' }
];

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'BNI2024001',
    departmentId: 'DEPT-6',
    name: '桃園至善街290號防水工程',
    category: '防水工程',
    source: 'BNI',
    client: '冠亨商設計',
    referrer: '舊客介紹',
    manager: '陳信寬',
    startDate: '2024-01-05',
    endDate: '2024-03-05',
    createdDate: '2024-01-05',
    budget: 0,
    spent: 0,
    progress: 0,
    status: ProjectStatus.COMPLETED,
    tasks: [],
    phases: [],
    financials: { labor: 40, material: 30, subcontractor: 20, other: 10 }
  },
  {
    id: 'BNI2025002',
    departmentId: 'DEPT-6',
    name: '桃園龜山民安街11號防水工程',
    category: '防水工程',
    source: 'BNI',
    client: '璇凱伯修',
    referrer: '網站預約',
    manager: '陳文凱',
    startDate: '2025-01-05',
    endDate: '2025-03-10',
    createdDate: '2025-01-05',
    budget: 0,
    spent: 0,
    progress: 0,
    status: ProjectStatus.COMPLETED,
    tasks: [],
    phases: [],
    financials: { labor: 40, material: 30, subcontractor: 20, other: 10 }
  },
  {
    id: 'JW2601003',
    departmentId: 'DEPT-6',
    name: '樹林區三龍街24巷16號國為海砂屋補強工程',
    category: '補強工程',
    source: 'JW',
    client: '邱金龍',
    referrer: '',
    manager: '余家豪',
    startDate: '2026-01-05',
    endDate: '2026-04-15',
    createdDate: '2026-01-05',
    budget: 0,
    spent: 0,
    progress: 0,
    status: ProjectStatus.NEGOTIATING,
    tasks: [],
    phases: [],
    financials: { labor: 40, material: 30, subcontractor: 20, other: 10 }
  },
  {
    id: 'BNI2601004',
    departmentId: 'DEPT-6',
    name: '光復北路190巷40號章省予大樓管線修復工程',
    category: '水電機電',
    source: 'BNI',
    client: '章省予',
    referrer: '',
    manager: '余家豪',
    startDate: '2026-01-05',
    endDate: '',
    createdDate: '2026-01-05',
    budget: 0,
    spent: 0,
    progress: 0,
    status: ProjectStatus.NEGOTIATING,
    tasks: [],
    phases: [],
    financials: { labor: 40, material: 30, subcontractor: 20, other: 10 }
  },
  {
    id: 'OC2601005',
    departmentId: 'DEPT-6',
    name: '光復南路住宅電力系統更新工程',
    category: '水電機電',
    source: '網路客',
    client: '光復南路業主',
    referrer: '',
    manager: '郭俊宏',
    startDate: '2026-01-05',
    endDate: '',
    createdDate: '2026-01-05',
    budget: 0,
    spent: 0,
    progress: 0,
    status: ProjectStatus.NEGOTIATING,
    tasks: [],
    phases: [],
    financials: { labor: 40, material: 30, subcontractor: 20, other: 10 }
  },
  {
    id: 'CORP2601002',
    departmentId: 'DEPT-6',
    name: '台中商業辦公室擴建',
    category: '室內裝修',
    source: '企業',
    client: '科技公司',
    referrer: '舊客介紹',
    manager: '林靜宜',
    startDate: '2026-02-15',
    endDate: '2026-08-20',
    createdDate: '2026-01-20',
    budget: 8800000,
    spent: 2100000,
    progress: 15,
    status: ProjectStatus.CONSTRUCTING,
    tasks: [],
    phases: [],
    financials: { labor: 25, material: 55, subcontractor: 15, other: 5 }
  }
];

export const MOCK_TEAM_MEMBERS: TeamMember[] = [];
