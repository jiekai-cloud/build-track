
import React, { useState, useMemo, useRef } from 'react';
import {
  ArrowLeft, CheckCircle2, Clock, DollarSign, Pencil, Sparkles, Trash2, Activity,
  MessageSquare, Send, Receipt, X, ZoomIn, FileText, ImageIcon, Upload, MapPin,
  Navigation, ShoppingBag, Utensils, Building2, ExternalLink, CalendarDays, Loader2, Check, DownloadCloud, ShieldAlert,
  Layers, Camera, HardHat, CheckCircle, ShieldCheck, Edit2, Wrench, ClipboardList, Construction, FileImage, Zap, Lock, ChevronDown,
  ChevronLeft, ChevronRight, Plus, Minus, ZoomOut, AlertTriangle, Wallet, Users
} from 'lucide-react';
import { Project, ProjectStatus, Task, ProjectComment, Expense, WorkAssignment, TeamMember, ProjectFile, ProjectPhase, User, ChecklistTask, PaymentStage, Quotation } from '../types';
import DefectImprovement from './DefectImprovement';
import { cloudFileService } from '../services/cloudFileService';
import ProjectQuotations from './project/ProjectQuotations';
import ProjectInspection from './project/ProjectInspection';
import ProjectLogs from './project/ProjectLogs';
import ProjectFinancials from './project/ProjectFinancials';
import ProjectGallery from './project/ProjectGallery';
import ProjectTasks from './project/ProjectTasks';
import ProjectSchedule from './project/ProjectSchedule';
import ProjectPrep from './project/ProjectPrep';
import ProjectMap from './project/ProjectMap';
import ImageLightbox from './ImageLightbox';
import ProjectReportModal from './modals/ProjectReportModal';
import CompletionReportModal from './modals/CompletionReportModal';
import MandatoryUploadModal from './modals/MandatoryUploadModal';
import { ProjectProvider } from '../contexts/ProjectContext';

const PHOTO_CATEGORIES = [
  { id: 'all', label: '全部照片', icon: Layers },
  { id: 'survey', label: '會勘照片及影片', icon: Camera },
  { id: 'construction', label: '施工照片', icon: HardHat },
  { id: 'completion', label: '完工照片', icon: CheckCircle },
  { id: 'inspection', label: '檢驗照片', icon: ShieldCheck }
];

interface ProjectDetailProps {
  project: Project;
  user: User;
  teamMembers: TeamMember[];
  onBack: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
  onLossClick: (project: Project) => void;
  onUpdateTasks: (tasks: Task[]) => void;
  onUpdateProgress: (progress: number) => void;
  onUpdateStatus: (status: ProjectStatus) => void;
  onAddComment: (text: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateExpenses: (expenses: Expense[]) => void;
  onUpdateWorkAssignments: (assignments: WorkAssignment[]) => void;
  onUpdatePreConstruction: (prep: any) => void;
  onUpdateFiles?: (files: ProjectFile[]) => void;
  onUpdatePhases?: (phases: ProjectPhase[]) => void;
  onAddDailyLog: (log: { content: string, photoUrls: string[] }) => void;
  onDeleteDailyLog: (logId: string) => void;
  onUpdateChecklist: (checklist: ChecklistTask[]) => void;
  onUpdatePayments: (payments: PaymentStage[]) => void;
  onUpdateContractUrl: (url: string) => void;
  onUpdateDefectRecords: (records: any[]) => void;
  onNavigateToQuotation: (projectId: string, quotationId?: string) => void;
  quotations: Quotation[];
  onDeleteQuotation?: (id: string) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = (props) => {
  const {
    project, user, teamMembers, onBack, onEdit, onDelete, onLossClick,
    onUpdateTasks, onUpdateProgress, onUpdateStatus, onAddComment, onDeleteComment,
    onUpdateExpenses, onUpdateWorkAssignments, onUpdateFiles, onUpdatePhases,
    onAddDailyLog, onDeleteDailyLog, onUpdateChecklist, onUpdatePayments, onUpdateContractUrl,
    onUpdateDefectRecords, onNavigateToQuotation, quotations, onDeleteQuotation
  } = props;
  const [newComment, setNewComment] = useState('');
  const [activeView, setActiveView] = useState<'tasks' | 'financials' | 'logs' | 'photos' | 'schedule' | 'map' | 'inspection' | 'prep' | 'defects' | 'quotations'>('logs');
  const [selectedImage, setSelectedImage] = useState<ProjectFile | null>(null);
  const [isReportMode, setIsReportMode] = useState(false);
  const [isCompletionReportMode, setIsCompletionReportMode] = useState(false);
  const [currentPhotoFilter, setCurrentPhotoFilter] = useState('all');


  const currentFilteredFiles = useMemo(() => {
    return (project.files || []).filter(f =>
      (f.type === 'image' || f.type === 'video') &&
      (currentPhotoFilter === 'all' || f.category === currentPhotoFilter)
    );
  }, [project.files, currentPhotoFilter]);

  const scopeDrawingFiles = useMemo(() => {
    const urls = [
      ...(project.preConstruction?.scopeDrawingUrl ? [project.preConstruction.scopeDrawingUrl] : []),
      ...(project.preConstruction?.scopeDrawings || [])
    ];
    return urls.map((url, idx) => ({
      id: `scope-${idx}`,
      url: String(url),
      name: `施工範圍圖 (${idx + 1})`,
      category: '施工範圍圖',
      type: 'image',
      uploadedAt: project.preConstruction?.updatedAt,
      uploadedBy: 'System'
    } as ProjectFile));
  }, [project.preConstruction]);

  const navigationList = useMemo(() => {
    if (selectedImage?.category === '施工範圍圖') return scopeDrawingFiles;
    return currentFilteredFiles;
  }, [selectedImage, scopeDrawingFiles, currentFilteredFiles]);

  const handleNextImage = () => {
    if (!selectedImage) return;
    const currentIndex = navigationList.findIndex(f => f.id === selectedImage.id || f.url === selectedImage.url);
    if (currentIndex !== -1 && currentIndex < navigationList.length - 1) {
      setSelectedImage(navigationList[currentIndex + 1]);
    }
  };

  const handlePrevImage = () => {
    if (!selectedImage) return;
    const currentIndex = navigationList.findIndex(f => f.id === selectedImage.id || f.url === selectedImage.url);
    if (currentIndex > 0) {
      setSelectedImage(navigationList[currentIndex - 1]);
    }
  };

  const [isMandatoryUploadOpen, setIsMandatoryUploadOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<ProjectStatus | null>(null);
  const headerContractInputRef = useRef<HTMLInputElement>(null);

  const isReadOnly = user.role === 'Guest';
  const statusOptions = Object.values(ProjectStatus);
  const expenses = project.expenses || [];
  const assignments = project.workAssignments || [];
  const files = project.files || [];

  const totalLaborCost = assignments.reduce((acc, curr) => acc + curr.totalCost, 0);
  const totalExpenseCost = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const currentSpent = totalLaborCost + totalExpenseCost;
  const margin = project.budget - currentSpent;
  const totalReceived = (project.payments || [])
    .filter(p => p.status === 'paid')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);



  return (
    <ProjectProvider
      project={project}
      isReadOnly={isReadOnly}
      user={user}
      teamMembers={teamMembers}
      quotations={quotations}
      onUpdateTasks={onUpdateTasks}
      onUpdateProgress={onUpdateProgress}
      onUpdateStatus={onUpdateStatus}
      onAddComment={onAddComment}
      onDeleteComment={onDeleteComment}
      onUpdateExpenses={onUpdateExpenses}
      onUpdateWorkAssignments={onUpdateWorkAssignments}
      onUpdatePreConstruction={props.onUpdatePreConstruction}
      onUpdateFiles={onUpdateFiles}
      onUpdatePhases={onUpdatePhases}
      onAddDailyLog={onAddDailyLog}
      onDeleteDailyLog={onDeleteDailyLog}
      onUpdateChecklist={onUpdateChecklist}
      onUpdatePayments={onUpdatePayments}
      onUpdateContractUrl={onUpdateContractUrl}
      onUpdateDefectRecords={onUpdateDefectRecords}
      onNavigateToQuotation={onNavigateToQuotation}
      onDeleteQuotation={onDeleteQuotation}
      onLossClick={onLossClick}
      onImageClick={setSelectedImage}
      currentPhotoFilter={currentPhotoFilter}
      onFilterChange={setCurrentPhotoFilter}
      photoCategories={PHOTO_CATEGORIES}
    >
      <div className="flex flex-col lg:h-full animate-in slide-in-from-right-4 duration-500 lg:overflow-hidden relative">
        {isReadOnly && (
          <div className="bg-amber-500 text-white px-8 py-2 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 z-[60] shadow-sm">
            <ShieldAlert size={14} /> 您目前以訪客模式登入，僅供檢視，無法修改資料。
          </div>
        )}
        {/* 固定標頭資訊 */}
        <div className="p-4 lg:p-8 space-y-4 shrink-0 bg-white/50 border-b border-stone-100">
          <div className="flex justify-between items-center no-print">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold text-sm">
              <ArrowLeft size={16} /> <span className="hidden sm:inline">返回</span>
            </button>
            <div className="flex gap-2 overflow-x-auto no-scrollbar desktop-scrollbar touch-scroll sm:overflow-visible pb-1 sm:pb-0">
              {!isReadOnly && (
                <div className="flex gap-2 whitespace-nowrap">
                  <button onClick={() => setIsReportMode(true)} className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0"><FileText size={14} /> 績效報表</button>
                  <button onClick={() => setIsCompletionReportMode(true)} className="flex items-center gap-2 bg-white border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0"><CheckCircle size={14} /> 完工報告書</button>
                  <button onClick={() => onEdit(project)} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0"><Pencil size={14} /> 編輯</button>
                </div>
              )}
              {isReadOnly && (
                <div className="flex items-center gap-2 bg-stone-100 text-stone-400 px-3 py-1.5 rounded-xl text-[10px] font-black border border-stone-200 whitespace-nowrap shrink-0">
                  <ShieldAlert size={14} /> 訪客唯讀權限
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-slate-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{project.id}</span>
                <span className="bg-blue-50 text-blue-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-blue-100 uppercase">{project.category}</span>
                {project.contractUrl && (
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-100 uppercase flex items-center gap-1">
                    <ShieldCheck size={10} /> 已簽約
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">{project.name}</h1>
              <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-bold uppercase">
                <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {project.location?.address || '無地址'}</span>
                <span className="bg-stone-100 px-2 py-0.5 rounded-full">負責人：{project.quotationManager || '未指定'}</span>
                <div className="flex items-center gap-1">
                  <Activity size={12} />
                  <select
                    disabled={isReadOnly}
                    className={`bg-transparent outline-none appearance-none text-blue-600 font-black ${isReadOnly ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                    value={project.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as ProjectStatus;
                      if (newStatus === ProjectStatus.SIGNED_WAITING_WORK && !project.contractUrl) {
                        setPendingStatus(newStatus);
                        setIsMandatoryUploadOpen(true);
                      } else {
                        onUpdateStatus(newStatus);
                      }
                    }}
                  >
                    {statusOptions.map(opt => <option key={opt} value={opt} className="text-black font-bold">{opt}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Import/View Contract Button */}
            <div className="shrink-0">
              {project.contractUrl ? (
                <a
                  href={project.contractUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-emerald-50 text-emerald-600 border border-emerald-200 px-4 py-2.5 rounded-xl font-black text-[11px] hover:bg-emerald-100 transition-colors shadow-sm"
                >
                  <FileText size={16} />
                  <span>查看報價單/合約</span>
                  <ExternalLink size={12} />
                </a>
              ) : (
                !isReadOnly && (
                  <>
                    <input
                      type="file"
                      className="hidden"
                      ref={headerContractInputRef}
                      accept="application/pdf,image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        try {
                          const result = await cloudFileService.uploadFile(file);
                          if (result && result.url) {
                            onUpdateContractUrl(result.url);
                            // Also try to analyze schedule automatically if it's an image
                            if (file.type.startsWith('image/')) {
                              // Optional: Trigger analysis or prompt user
                            }
                            alert('檔案上傳成功！');
                          }
                        } catch (err) {
                          console.error('上傳失敗', err);
                          alert('上傳失敗，請重試');
                        } finally {
                          if (headerContractInputRef.current) headerContractInputRef.current.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => headerContractInputRef.current?.click()}
                      className="flex items-center gap-2 bg-slate-900 text-white px-5 py-3 rounded-2xl font-black text-[11px] hover:bg-slate-800 transition-all active:scale-95 shadow-md hover:shadow-lg"
                    >
                      <Upload size={16} />
                      <span>匯入報價單或合約</span>
                    </button>
                  </>
                )
              )}
            </div>
          </div>
        </div>

        {/* Modern Navigation Tabs */}
        <div className="mt-0 border-b border-stone-200 bg-white sticky top-0 z-20 shadow-sm relative group">
          <div className="flex gap-6 lg:gap-8 overflow-x-auto pb-px px-4 lg:px-8 no-scrollbar relative z-10 scroll-smooth" id="project-tabs">
            {[
              { id: 'quotations', label: '報價單', icon: Receipt },
              { id: 'prep', label: '施工前準備', icon: Construction },
              { id: 'schedule', label: '施工排程', icon: CalendarDays },
              { id: 'logs', label: '施工日誌', icon: ClipboardList },
              { id: 'tasks', label: '待辦任務', icon: CheckCircle2 },
              { id: 'photos', label: '照片庫', icon: FileImage },
              { id: 'defects', label: '缺失改善', icon: ShieldAlert },
              { id: 'financials', label: '帳務管理', icon: DollarSign },
              { id: 'map', label: '案場定位', icon: Navigation },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id as any)}
                className={`flex items-center gap-2 py-3 lg:py-4 text-xs lg:text-sm font-bold transition-all whitespace-nowrap relative ${activeView === tab.id
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-400 hover:text-stone-600 border-b-2 border-transparent hover:border-stone-200'
                  }`}
              >
                <tab.icon size={16} className={activeView === tab.id ? 'text-amber-500' : 'text-stone-300'} strokeWidth={activeView === tab.id ? 2.5 : 2} />
                {tab.label}
              </button>
            ))}
          </div>
          {/* Right Gradient Fade */}
          <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none lg:hidden z-20" />
        </div>

        {/* 視圖內容區 */}
        <div className="flex-1 lg:min-h-0 flex flex-col p-4 sm:p-6 lg:overflow-hidden">
          {activeView === 'quotations' && <ProjectQuotations />}
          {activeView === 'inspection' && <ProjectInspection />}
          {activeView === 'logs' && <ProjectLogs />}
          {activeView === 'defects' && (
            <div className="lg:h-full lg:overflow-hidden animate-in fade-in">
              <DefectImprovement />
            </div>
          )}

          {['financials', 'map', 'tasks', 'schedule', 'prep', 'photos'].includes(activeView) && (
            <div className="flex-1 lg:overflow-y-auto touch-scroll space-y-4 pr-1 no-scrollbar">
              {activeView === 'financials' && <ProjectFinancials />}
              {activeView === 'map' && <ProjectMap />}
              {activeView === 'tasks' && <ProjectTasks />}
              {activeView === 'schedule' && <ProjectSchedule />}
              {activeView === 'prep' && <ProjectPrep />}
              {activeView === 'photos' && <ProjectGallery />}
            </div>
          )}
        </div >

        {/* Lightbox / Media Preview Modal */}
        {selectedImage && (
          <ImageLightbox
            image={selectedImage}
            onClose={() => setSelectedImage(null)}
            onNext={handleNextImage}
            onPrev={handlePrevImage}
            hasNext={navigationList.findIndex(f => f.id === selectedImage.id || f.url === selectedImage.url) < navigationList.length - 1}
            hasPrev={navigationList.findIndex(f => f.id === selectedImage.id || f.url === selectedImage.url) > 0}
            currentPosition={navigationList.findIndex(f => f.id === selectedImage.id || f.url === selectedImage.url)}
            totalImages={navigationList.length}
            isReadOnly={isReadOnly}
            onUpdateFiles={onUpdateFiles}
            allFiles={project.files || []}
            photoCategories={PHOTO_CATEGORIES}
          />
        )}
        {/* Mandatory Contract Upload Modal */}
        <MandatoryUploadModal
          isOpen={isMandatoryUploadOpen}
          onClose={() => setIsMandatoryUploadOpen(false)}
          pendingStatus={pendingStatus}
        />
        <ProjectReportModal
          isOpen={isReportMode}
          onClose={() => setIsReportMode(false)}
          project={project}
          currentSpent={currentSpent}
          margin={margin}
          totalLaborCost={totalLaborCost}
          totalExpenseCost={totalExpenseCost}
        />
        <CompletionReportModal
          isOpen={isCompletionReportMode}
          onClose={() => setIsCompletionReportMode(false)}
          project={project}
        />


      </div >
    </ProjectProvider>
  );
};

export default ProjectDetail;
