
export enum ProjectStatus {
  NEGOTIATING = '洽談中',
  QUOTING = '報價中',
  QUOTED = '已報價',
  WAITING_SIGN = '待簽約',
  SIGNED_WAITING_WORK = '已簽約待施工',
  CONSTRUCTING = '施工中',
  INSPECTION = '施工完成、待驗收', // Updated to match user phrasing
  PREPARING_PAYMENT = '請款資料製作中',
  SUBMITTED_PAYMENT = '已送件待通知開發票',
  INVOICED = '已開發票',
  PARTIAL_PAYMENT = '已部分付款(尚有保留款未付)',
  COMPLETED = '已完工',
  CLOSED = '結案',
  CANCELLED = '撤案',
  LOST = '未成交'
}

export type ProjectCategory = '室內裝修' | '建築營造' | '水電機電' | '防水工程' | '補強工程' | '其他';

export type ProjectSource =
  | 'BNI'
  | '台塑集團'
  | '士林電機'
  | '信義居家'
  | '企業'
  | '新建工程'
  | '網路客'
  | '住宅'
  | '台灣美光晶圓'
  | 'AI會勘系統'
  | 'JW';

export interface Expense {
  id: string;
  date: string;
  name: string;
  category: '委託工程' | '零用金' | '機具材料' | '行政人事成本' | '其他';
  amount: number;
  status: '待審核' | '已核銷' | '已撥款';
  supplier?: string;
}

export interface WorkAssignment {
  id: string;
  date: string;
  memberId: string;
  memberName: string;
  wagePerDay: number;
  days: number;
  totalCost: number;
  isSpiderMan?: boolean; // 新增：是否為蜘蛛人作業（繩索吊掛作業）
}

export interface Department {
  id: string;
  name: string;
  color: string;
  manager: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  status: 'Todo' | 'Doing' | 'Done';
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: 'Completed' | 'Current' | 'Upcoming';
  progress: number;
  startDate: string;
  endDate: string;
}

export interface ProjectEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  type?: 'general' | 'meeting' | 'milestone' | 'reminder';
  description?: string;
  color?: string;
}

export interface ProjectFinancials {
  labor: number;
  material: number;
  subcontractor: number;
  other: number;
}

export interface ProjectComment {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorRole: string;
  text: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  targetId: string;
  targetName: string;
  timestamp: string;
  type: 'project' | 'customer' | 'team' | 'system' | 'inventory' | 'vendor' | 'quotation' | 'payroll' | 'order' | 'attendance';
  isRead?: boolean;
}

export interface ChecklistTask {
  id: string;
  title: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;
  isDone: boolean;
}

export interface PaymentStage {
  id: string;
  label: string;
  amount: number;
  date: string;
  notes: string;
  vendorId?: string;
  status: 'pending' | 'paid';
}

export interface Vendor {
  id: string;
  name: string;
  type: string;
  contact: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string;
  specialty?: string[];
  rating: number;
  notes?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface DailyLogEntry {
  id: string;
  date: string;
  content: string;
  photoUrls: string[];
  authorId: string;
  authorName: string;
  authorAvatar: string;
}

export interface ProjectFile {
  id: string;
  url: string;
  name: string;
  type: 'image' | 'video' | 'pdf' | 'other';
  uploadedAt: string;
  uploadedBy: string;
  category?: string;
  size?: number;
}

export interface PreConstructionPrep {
  materialsAndTools?: string;
  notice?: string;
  scopeDrawingUrl?: string; // Legacy
  scopeDrawings?: string[]; // Supports multiple images and PDFs
  updatedAt?: string;
}

export interface ProjectLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface Project {
  id: string;
  departmentId: string;
  name: string;
  category: ProjectCategory;
  coverImage?: string;
  source: ProjectSource;
  client: string;
  contactPerson?: string;
  referrer: string;
  quotationManager?: string; // 報價負責人
  engineeringManager?: string; // 工程負責人
  introducer?: string; // 介紹人
  introducerFeeRequired?: boolean; // 是否需要介紹費
  introducerFeeType?: 'percentage' | 'fixed'; // 介紹費計算方式：百分比或固定金額
  introducerFeePercentage?: number; // 介紹費百分比（如5代表5%）
  introducerFeeAmount?: number; // 介紹費金額（固定金額或依百分比計算後的實際金額）
  startDate: string;
  endDate: string;
  createdDate: string;
  budget?: number; // 專案總預算
  laborBudget?: number; // 人力預算
  materialBudget?: number; // 材料預算
  actualLaborCost?: number; // 實際人力成本 (自動計算)
  actualMaterialCost?: number; // 實際材料成本 
  contractAmount?: number; // 合約總金額
  spent: number;
  progress: number;
  status: ProjectStatus | string; // 容許 Enum 值與舊版英文字串
  manager?: string; // Legacy field support
  tasks: Task[];
  phases: ProjectPhase[];
  events?: ProjectEvent[];
  dailyLogs?: DailyLogEntry[];
  checklist?: ChecklistTask[];
  payments?: PaymentStage[];
  financials: ProjectFinancials;
  location?: ProjectLocation;
  preConstruction?: PreConstructionPrep;
  inspectionData?: {
    diagnosis: string;
    suggestedFix: string;
    originalPhotos: string[];
    aiAnalysis: string;
    timestamp: string;
  };
  lossReason?: string;
  comments?: ProjectComment[];
  expenses?: Expense[];
  workAssignments?: WorkAssignment[];
  files?: ProjectFile[];
  contractUrl?: string; // 合約或報價單
  defectRecords?: DefectRecord[]; // 缺失改善紀錄
  year?: string; // 新增：手動指定的年度類別 (2024, 2025, 2026)
  statusChangedAt?: string; // 狀態變更時間 (用於逾期計算)
  updatedAt?: string;
  deletedAt?: string;
  isPurged?: boolean;
  hideInCalendar?: boolean; // 新增：是否在行事曆中隱藏
}

export interface DefectItem {
  id: string;
  content: string; // 缺失項目
  status: 'Pending' | 'Completed'; // 待改進 | 已改進
  improvement?: string; // 改善情形
  photos?: string[]; // 缺失或改善照片 (Base64 or URL)
  videoUrl?: string; // 影片記錄 (Base64 or URL)
}


export interface DefectRecord {
  id: string;
  date: string;
  items: DefectItem[];
  suggestions?: string; // 後續會議建議
  updatedAt: string;
}

export interface Lead {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  diagnosis: string;
  photos: string[];
  timestamp: string;
  status: 'new' | 'contacted' | 'converted';
  updatedAt?: string;
  deletedAt?: string;
}

export interface Customer {
  id: string;
  departmentId: string;
  name: string;
  contactPerson: string;
  secondaryContact?: string; // 新增：第二聯絡人
  phone: string;
  landline?: string; // 新增：室內電話
  fax?: string; // 新增：傳真
  secondaryPhone?: string; // 備用電話
  email: string;
  address: string;
  birthday?: string; // 生日
  occupation?: string; // 職業
  source?: string; // 來源 (例如：FB, 官網, 介紹)
  lineId?: string; // Line ID
  preferredContactMethod?: 'Phone' | 'Email' | 'Line'; // 首選聯繫方式
  type: '個人' | '企業' | '政府單位' | '長期夥伴';
  createdDate: string;
  taxId?: string;
  notes?: string; // 客戶備註
  tags?: string[]; // 標籤
  updatedAt?: string;
  deletedAt?: string;
}

export interface TeamMember {
  id: string;
  employeeId: string;
  password?: string;
  departmentId: string;
  departmentIds?: string[]; // 支持多部門 (最多三個)
  accessibleModules?: string[]; // 可存取的模組 ID 列表
  name: string;
  nicknames?: string[]; // 新增：多個外號 (用於 AI 辨識)
  salaryType?: 'monthly' | 'daily' | 'hourly'; // 新增：薪資類型（月薪制、日薪制、計時制）
  jobLevel?: string; // 新增：職等
  monthlySalary?: number; // 新增：月薪（月薪制使用）
  dailyRate?: number; // 新增：日薪 (日薪制使用，用於成本計算)
  hourlyRate?: number; // 新增：時薪（計時制使用）
  laborFee?: number; // 新增：勞保自付額
  healthFee?: number; // 新增：健保自付額
  spiderManAllowance?: number; // @deprecated Use specific calculation based on ropeEquipment
  workDaysPerWeek?: number; // 新增：每週工作天數 (預設 5)
  lunchBonus?: number; // 新增：固定午餐獎勵金
  insuranceBurdenRate?: number; // 新增：特殊保險負擔費率 (例如 15 或 40)
  ropeLicenseLevel?: string; // 新增：繩索證照等級
  workStartTime?: string; // 新增：標準上班時間 (HH:MM 格式，如 "09:00")
  workEndTime?: string; // 新增：標準下班時間 (HH:MM 格式，如 "18:00")
  role: '總經理' | '副總經理' | '總經理特助' | '經理' | '副經理' | '專案經理' | '工地主任' | '工地助理' | '工務主管' | '現場工程師' | '行政助理' | '助理' | '設計師' | '工頭' | '外部協力' | '財務部經理';
  systemRole: 'SuperAdmin' | 'DeptAdmin' | 'AdminStaff' | 'Staff' | 'Guest' | 'SyncOnly' | 'HRAdmin'; // 新增 HRAdmin (人事主管)
  phone: string;
  personalPhone?: string; // 個人電話
  email: string;
  birthday?: string;
  joinDate?: string;
  certifications?: string[];
  address?: string;
  bankInfo?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  specialty: string[];
  status: 'Available' | 'Busy' | 'OnLeave' | 'OffDuty';
  currentWorkStatus?: 'OnDuty' | 'OffDuty';
  activeProjectsCount: number;
  avatar: string;
  updatedAt?: string;
  deletedAt?: string;
}

export type Role = 'SuperAdmin' | 'Admin' | 'Manager' | 'AdminStaff' | 'Staff' | 'Guest' | 'SyncOnly' | 'DeptAdmin' | 'HRAdmin';

export type SystemContext = 'FirstDept' | 'ThirdDept'; // 第一工程部 | 第三工程部

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: Role;
  roleName?: string; // 自訂職稱 (e.g. 工務經理)
  department: SystemContext;
  accessibleModules?: string[]; // 用戶個人的模組權限
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export type InventoryCategory = '材料' | '工具' | '設備' | '其他';

export interface InventoryItem {
  id: string;
  name: string;
  simpleName?: string; // 簡稱
  sku?: string; // 料號
  barcode?: string; // 條碼編號 / 資產標籤
  category: InventoryCategory;
  quantity: number;
  unit: string;
  locations: { name: string; quantity: number }[]; // 多地點庫存皆可追蹤
  // location?: string; // @deprecated Use locations instead
  minLevel?: number; // 安全庫存量
  costPrice?: number; // 成本價
  sellingPrice?: number; // 建議售價
  supplier?: string;
  status: 'Normal' | 'Low' | 'Out';
  updatedAt?: string;
  deletedAt?: string;
  notes?: string;
  maintenanceRecords?: MaintenanceRecord[];
  photoUrl?: string;
  isRental?: boolean;
  rentalExpiry?: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: '維修' | '保養' | '檢測' | '其他';
  description: string;
  cost: number;
  performer: string; // 維修廠商或人員
  nextDate?: string; // 下次預計維修/保養日
  attachments?: string[]; // 照片或單據
}


export interface InventoryLocation {
  id: string;
  name: string;
  type: 'Main' | 'Temporary' | 'Project';
  description?: string;
  isDefault?: boolean; // Default location for new items
}

export interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName: string;
  type: 'In' | 'Out' | 'Adjust' | 'Transfer' | 'Purchase';
  quantity: number;
  fromLocation?: string;
  toLocation?: string;
  date: string;
  performedBy: string; // User Name
  notes?: string;
  relatedProjectId?: string; // 關聯專案 ID (若是出庫到專案)
  relatedProjectName?: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unit: string;
  cost: number;
  received: boolean;
}

export interface OrderPayment {
  id: string;
  date: string;
  amount: number;
  method: 'Cash' | 'Transfer' | 'Check' | 'CreditCard' | 'Other';
  note?: string;
}

export interface PurchaseOrder {
  id: string;
  date: string; // 訂購日期
  expectedDeliveryDate?: string;
  supplier: string;
  targetWarehouseId: string; // 預設入庫倉庫
  items: PurchaseOrderItem[];
  status: 'Pending' | 'Partial' | 'Completed' | 'Cancelled'; // 待出貨 | 部分到貨 | 已完成 | 取消
  payments: OrderPayment[];
  totalAmount: number;
  notes?: string;
  updatedAt?: string;
  createdAb?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  type: 'work-start' | 'work-end'; // 上班 | 下班
  timestamp: string;
  location: {
    lat: number;
    lng: number;
    address?: string;
  };
  departmentId?: string;
  photoUrl?: string; // Optional: photo verification
  isCorrection?: boolean; // 補打卡標記
  ropeEquipment?: 'personal' | 'company' | null; // 當日使用裝備 (繩索作業)
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  overtimeHours: number;
  overtimePay: number;
  deductions: number;
  progress: number;
  // 財務數據 (ERP 核心)
  budget?: number; // 專案總預算
  laborBudget?: number; // 人力預算
  materialBudget?: number; // 材料預算
  actualLaborCost?: number; // 實際人力成本 (由薪資系統自動計算)
  actualMaterialCost?: number; // 實際材料成本
  contractAmount?: number; // 合約總金額 (營收)
  status: 'Planning' | 'Active' | 'Completed' | 'OnHold'; // 新增 Planning 狀態
  note?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description?: string;
  workflow: string[]; // Role names or IDs
  formFields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'time' | 'select' | 'boolean' | 'teamMember';
    required?: boolean;
    options?: string[]; // For select type
  }[];
  updatedAt: string;
}

export interface ApprovalRequest {
  id: string;
  templateId: string;
  templateName: string;
  requesterId: string;
  requesterName: string;
  title: string;
  formData: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  currentStep: number;
  workflowLogs: {
    step: number;
    role: string;
    approverId?: string;
    approverName?: string;
    status: 'approved' | 'rejected';
    comment?: string;
    timestamp: string;
  }[];
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

// ===== 報價系統 (Quotation System) =====

export interface BankAccount {
  bankName: string;            // "玉山銀行(808) 士林分行"
  accountName: string;         // "台灣生活品質發展股份有限公司"
  accountNumber: string;       // "0657-940-151307"
}

export interface ProjectResponsible {
  name: string;
  mobile: string;
}

export interface ProjectResponsibles {
  siteManager?: ProjectResponsible;    // 工地負責人
  projectManager?: ProjectResponsible;  // 專案負責人
  fieldManager?: ProjectResponsible;    // 現場負責人
}

export interface QuotationHeader {
  // 客戶資訊
  to?: string;                 // 收件人
  attn?: string;               // 聯絡人
  tel?: string;                // 電話
  mobile?: string;             // 行動電話
  fax?: string;                // 傳真
  email?: string;              // Email

  // 工程資訊
  projectCode?: string;        // 工程編號
  projectName: string;         // 工程名稱
  projectAddress?: string;     // 工程地址

  // 報價日期
  quotationDate: string;       // 報價日期 (YYYY-MM-DD)
}

export interface QuotationItem {
  id: string;
  itemNumber: number;          // 項目序號
  name: string;                // 品名
  unit: string;                // 單位 (M, M2, M3, ST, PC...)
  quantity: number;            // 數量
  unitPrice: number;           // 單價
  amount: number;              // 金額 (自動計算: quantity × unitPrice)
  notes?: string;              // 備註

  // 進階欄位
  materialCode?: string;       // 材料編號 (例: MC-INJECT 2111 FLEX)
  isNoiseWork?: boolean;       // 是否為噪音工程
  category?: string;           // 分類
}

export interface ItemCategory {
  id: string;
  code: string;                // "壹", "貳", "參", "肆"...
  name: string;                // "拆除工程", "防水工程"...
  items: QuotationItem[];
}

export interface DiscountItem {
  name: string;                // "會勘費折抵"
  amount: number;              // -1000 (負數表示折扣)
  description?: string;        // 說明
}

export interface QuotationSummary {
  subtotal: number;            // 項目小計
  managementFee: number;       // 工安管理費
  managementFeeRate: number;   // 工安管理費率 (預設 10%)
  beforeTaxAmount: number;     // 未稅金額
  tax: number;                 // 營業稅
  taxRate: number;             // 稅率 (預設 5%)
  discounts?: DiscountItem[];  // 折扣項目
  totalAmount: number;         // 工程金額總計
}

export interface QuotationOption {
  id: string;
  name: string;                // "方案一"
  description: string;         // "頂樓地坪及女兒牆外牆防水工程"
  categories: ItemCategory[];  // 項目分類
  summary: QuotationSummary;   // 金額總計
  warranty?: string;           // 保固說明
}

export interface QuotationTerms {
  workSchedule?: string;       // 工期說明 "預計25個工作天"
  safetyRequirements?: string[]; // 安全規定
  paymentTerms?: string;       // 付款方式
  bankAccount?: BankAccount;   // 收款帳號
  validityPeriod?: string;     // 報價有效期限 "30天"
  warrantyYears?: number;      // 保固年限
  otherNotes?: string[];       // 其他備註
}

export interface Quotation {
  id: string;
  quotationNumber: string;     // 報價單編號 (例: Q2026-001)
  version: number;             // 版本號（修改時遞增）

  // 關聯資訊
  customerId?: string;         // 關聯客戶 ID
  projectId?: string;          // 關聯專案 ID（成交後）

  // 報價單抬頭
  header: QuotationHeader;

  // 報價方案（支援多方案比較）
  options: QuotationOption[];
  selectedOptionIndex: number; // 預設選擇的方案索引

  // 負責人資訊
  responsibles?: ProjectResponsibles;

  // 條款與備註
  terms?: QuotationTerms;

  // 狀態管理
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired' | 'converted' | 'signed';
  validUntil?: string;         // 有效期限 (YYYY-MM-DD)

  // 審計資訊
  createdBy: string;           // 建立人員 ID
  createdByName: string;       // 建立人員姓名
  createdAt: string;           // 建立時間
  updatedAt: string;           // 更新時間
  sentAt?: string;             // 送出時間
  approvedAt?: string;         // 核准時間
  convertedProjectId?: string; // 成交後轉成的專案ID

  // 附件
  attachments?: {
    drawingUrl?: string;       // 施工位置簡圖
    detailDrawingUrl?: string; // 施工大樣圖
    otherFiles?: string[];     // 其他附件
  };

  // 其他
  departmentId?: string;       // 所屬部門
  showOptionName?: boolean;    // 是否顯示方案名稱
  deletedAt?: string;          // 軟刪除標記
}

// 報價單項目範本（可重複使用）
export interface QuotationTemplate {
  id: string;
  name: string;                // 範本名稱
  category: string;            // 分類
  description?: string;        // 描述
  items: Omit<QuotationItem, 'id' | 'itemNumber' | 'amount'>[];
  usageCount: number;          // 使用次數
  lastUsedAt?: string;         // 最後使用時間
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecordItem {
  type: 'diagnosis' | 'AI' | string;
  description: string;
  result: string;
}

export interface SystemCalendarEvent {
  id: string;
  title: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  type: 'visit' | 'meeting' | 'inspection' | 'other' | 'milestone';
  description?: string;
  linkedProjectId?: string;
  googleEventId?: string; // If synced to Google Calendar
  createdAt: string;
  createdBy: string;
  updatedAt: string;
}
