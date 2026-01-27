
import React, { useState, useEffect } from 'react';
import { X, Briefcase, Calendar, DollarSign, User as LucideUser, Tag, UserPlus, Save, Activity, Globe, ChevronDown, MapPin } from 'lucide-react';
import { Project, ProjectCategory, ProjectStatus, ProjectSource, ProjectLocation, TeamMember } from '../types';

interface ProjectModalProps {
  onClose: () => void;
  onConfirm: (data: Partial<Project>) => void;
  initialData?: Project | null;
  teamMembers: TeamMember[];
}

const ProjectModal: React.FC<ProjectModalProps> = ({ onClose, onConfirm, initialData, teamMembers }) => {
  const categories: ProjectCategory[] = ['室內裝修', '建築營造', '水電機電', '防水工程', '補強工程', '其他'];
  const sources: ProjectSource[] = ['BNI', '台塑集團', '士林電機', '信義居家', '企業', '新建工程', '網路客', '住宅', '台灣美光晶圓', 'AI會勘系統', 'JW'];
  const statuses = Object.values(ProjectStatus);
  const isEditMode = !!initialData;

  const [formData, setFormData] = useState({
    name: '',
    category: '室內裝修' as ProjectCategory,
    source: 'BNI' as ProjectSource,
    status: ProjectStatus.NEGOTIATING,
    client: '',
    referrer: '',
    quotationManager: '',
    engineeringManager: '',
    introducer: '',
    introducerFeeRequired: false,
    introducerFeeType: 'percentage' as 'percentage' | 'fixed',
    introducerFeePercentage: '',
    introducerFeeAmount: '',
    budget: '',
    progress: '0',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    address: '',
    year: '', // 新增：年度類別 (2024, 2025, 2026)
    id: '', // 新增：可編輯的案件編號
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        category: initialData.category,
        source: initialData.source,
        status: initialData.status,
        client: initialData.client,
        referrer: initialData.referrer,
        quotationManager: initialData.quotationManager || initialData.manager || '',
        engineeringManager: initialData.engineeringManager || '',
        introducer: initialData.introducer || '',
        introducerFeeRequired: initialData.introducerFeeRequired || false,
        introducerFeeType: initialData.introducerFeeType || 'percentage',
        introducerFeePercentage: initialData.introducerFeePercentage?.toString() || '',
        introducerFeeAmount: initialData.introducerFeeAmount?.toString() || '',
        budget: initialData.budget.toString(),
        progress: initialData.progress.toString(),
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        address: initialData.location?.address || '',
        year: initialData.year || '', // 載入年度類別
        id: initialData.id || '', // 載入現有編號
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // 模擬地址轉經緯度 (正式版會串接 Geocoding API)
    const mockLocation: ProjectLocation = {
      address: formData.address,
      lat: 25.0330,
      lng: 121.5654
    };

    // 計算介紹費金額
    let calculatedFeeAmount = 0;
    if (formData.introducerFeeRequired) {
      if (formData.introducerFeeType === 'percentage') {
        const budget = Number(formData.budget) || 0;
        const percentage = Number(formData.introducerFeePercentage) || 0;
        calculatedFeeAmount = (budget * percentage) / 100;
      } else {
        calculatedFeeAmount = Number(formData.introducerFeeAmount) || 0;
      }
    }

    onConfirm({
      ...formData,
      budget: Number(formData.budget),
      progress: Number(formData.progress),
      introducerFeeType: formData.introducerFeeType,
      introducerFeePercentage: Number(formData.introducerFeePercentage) || undefined,
      introducerFeeAmount: calculatedFeeAmount,
      location: mockLocation,
      createdDate: initialData?.createdDate || new Date().toISOString().split('T')[0]
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-6 py-4 flex justify-between items-center ${isEditMode ? 'bg-amber-600' : 'bg-slate-900'}`}>
          <h2 className="text-white font-bold flex items-center gap-2 text-lg">
            {isEditMode ? <Save size={20} /> : <Briefcase size={20} className="text-blue-400" />}
            {isEditMode ? `編輯案件: ${initialData.id}` : '建立新工程專案'}
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">案件名稱 *</label>
              <input required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">案件編號 (可手動修正)</label>
              <input className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 outline-none font-black uppercase tracking-wider" value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} placeholder="自動產生" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">案場詳細地址</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold" placeholder="例如：台北市信義區信義路五段7號" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">報價負責人 Quotation</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideUser size={16} />
                </div>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold appearance-none" value={formData.quotationManager} onChange={e => setFormData({ ...formData, quotationManager: e.target.value })}>
                  <option value="">請選擇報價人</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">工程負責人 Engineering</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <LucideUser size={16} />
                </div>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold appearance-none" value={formData.engineeringManager} onChange={e => setFormData({ ...formData, engineeringManager: e.target.value })}>
                  <option value="">請選擇負責人</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.name}>{m.name} ({m.role})</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">業主名稱 Client</label>
              <input className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold placeholder:text-slate-300" placeholder="" value={formData.client} onChange={e => setFormData({ ...formData, client: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">案件來源 Source</label>
              <div className="relative">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none font-bold appearance-none" value={formData.source} onChange={e => setFormData({ ...formData, source: e.target.value as any })}>
                  {sources.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Tag size={16} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">介紹人資訊 (選填)</span>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">介紹人名稱</label>
                  <input
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 outline-none font-bold text-sm"
                    placeholder="介紹人姓名"
                    value={formData.introducer}
                    onChange={e => setFormData({ ...formData, introducer: e.target.value })}
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex flex-col w-full">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">需介紹費</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.introducerFeeRequired}
                        onChange={e => setFormData({ ...formData, introducerFeeRequired: e.target.checked })}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {formData.introducerFeeRequired && (
                <div className="animate-in slide-in-from-top-2 space-y-4">
                  {/* 計算方式選擇 */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">介紹費計算方式</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, introducerFeeType: 'percentage' })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.introducerFeeType === 'percentage'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        📊 百分比計算
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, introducerFeeType: 'fixed' })}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${formData.introducerFeeType === 'fixed'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                      >
                        💵 固定金額
                      </button>
                    </div>
                  </div>

                  {/* 百分比模式 */}
                  {formData.introducerFeeType === 'percentage' ? (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">介紹費百分比</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          className="w-full bg-white border border-blue-200 rounded-xl pl-4 pr-8 py-2.5 outline-none font-bold text-sm"
                          placeholder="例如：5 (代表5%)"
                          value={formData.introducerFeePercentage}
                          onChange={e => setFormData({ ...formData, introducerFeePercentage: e.target.value })}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 text-sm font-black">%</span>
                      </div>
                      {formData.introducerFeePercentage && formData.budget && (
                        <p className="text-xs text-emerald-600 font-bold mt-2">
                          預估介紹費：NT$ {((Number(formData.budget) * Number(formData.introducerFeePercentage)) / 100).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* 固定金額模式 */
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5 tracking-wider">介紹費金額</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                        <input
                          type="number"
                          className="w-full bg-white border border-blue-200 rounded-xl pl-7 pr-4 py-2.5 outline-none font-bold text-sm"
                          placeholder="輸入固定金額"
                          value={formData.introducerFeeAmount}
                          onChange={e => setFormData({ ...formData, introducerFeeAmount: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">合約預算 Budget (TWD)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold placeholder:text-stone-300" placeholder="尚未報價請留空" value={formData.budget} onChange={e => setFormData({ ...formData, budget: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">施工進度 Progress (%)</label>
              <div className="relative">
                <Activity size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" min="0" max="100" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold" value={formData.progress} onChange={e => setFormData({ ...formData, progress: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">預計開工日 Start Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold" value={formData.startDate} onChange={e => setFormData({ ...formData, startDate: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">預計完工日 End Date</label>
              <div className="relative">
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 outline-none font-bold" value={formData.endDate} onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">歸屬年度 (大類別分類用)</label>
              <div className="relative">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select className="w-full bg-orange-50 border border-orange-200 text-orange-900 rounded-xl px-4 py-2.5 outline-none font-black appearance-none" value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}>
                  <option value="">自動判斷 (依開工日或編號)</option>
                  <option value="2024">2024 年度</option>
                  <option value="2025">2025 年度</option>
                  <option value="2026">2026 年度</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 tracking-wider">案件類別 Category</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map(c => (
                <button type="button" key={c} onClick={() => setFormData({ ...formData, category: c })} className={`py-2 rounded-xl text-xs font-bold transition-all border ${formData.category === c ? 'bg-slate-800 text-white border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl">取消</button>
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95">確認儲存</button>
          </div>
        </form >
      </div >
    </div >
  );
};

export default ProjectModal;
