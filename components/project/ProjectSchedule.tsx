
import React, { useState } from 'react';
import { CalendarDays, Sparkles, Check, Upload, Loader2, DownloadCloud, X, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { ProjectPhase } from '../../types';
import { suggestProjectSchedule, parseScheduleFromImage } from '../../services/geminiService';
import GanttChart from '../GanttChart';
import { useProject } from '../../contexts/ProjectContext';

const ProjectSchedule: React.FC = () => {
    const { project, isReadOnly, onUpdatePhases } = useProject();
    const [scheduleStartDate, setScheduleStartDate] = useState(project.startDate || new Date().toISOString().split('T')[0]);
    const [workOnHolidays, setWorkOnHolidays] = useState(false);
    const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
    const [isAIScheduling, setIsAIScheduling] = useState(false);
    const scheduleFileInputRef = React.useRef<HTMLInputElement>(null);

    const handleScheduleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsAIScheduling(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                // Remove data URL prefix if present
                const base64Data = base64String.split(',')[1] || base64String;

                try {
                    const newPhases = await parseScheduleFromImage(base64Data, scheduleStartDate, workOnHolidays);
                    if (newPhases && newPhases.length > 0) {
                        const phasesWithIds = newPhases.map((p: any) => ({
                            ...p,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                        }));
                        onUpdatePhases([...(project.phases || []), ...phasesWithIds]);
                        alert(`已從文件中成功匯入 ${newPhases.length} 個排程項目！`);
                    } else {
                        alert('無法從文件中識別出排程項目，請確認圖片清晰度。');
                    }
                } catch (error) {
                    console.error("Schedule parsing error:", error);
                    alert('解析失敗，請稍後再試。');
                } finally {
                    setIsAIScheduling(false);
                    if (scheduleFileInputRef.current) scheduleFileInputRef.current.value = '';
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("File reading error:", error);
            setIsAIScheduling(false);
        }
    };

    const handleAIFromContract = async () => {
        if (!project.contractUrl) return;
        setIsAIScheduling(true);
        try {
            const resp = await fetch(project.contractUrl);
            const blob = await resp.blob();
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = (reader.result as string).split(',')[1];
                try {
                    const newPhases = await parseScheduleFromImage(base64, scheduleStartDate, workOnHolidays);
                    if (newPhases && newPhases.length > 0) {
                        const phasesWithIds = newPhases.map((p: any) => ({
                            ...p,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
                        }));
                        onUpdatePhases([...(project.phases || []), ...phasesWithIds]);
                        alert(`已根據合約成功產生 ${newPhases.length} 個排程項目！`);
                    }
                } catch (err) {
                    alert('AI 解析失敗');
                } finally {
                    setIsAIScheduling(false);
                }
            };
            reader.readAsDataURL(blob);
        } catch (e) {
            console.error(e);
            alert('無法讀取文件，請嘗試重新上傳或手動上傳。');
            setIsAIScheduling(false);
        }
    };

    const handleExportChart = () => {
        const container = document.getElementById('gantt-chart-container');
        const svg = container?.querySelector('svg');
        if (svg) {
            // A4 Landscape dimensions at 200+ DPI
            const A4_WIDTH = 2480;
            const A4_HEIGHT = 1754;
            const MARGIN = 80;

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = A4_WIDTH;
            canvas.height = A4_HEIGHT;

            // Background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, A4_WIDTH, A4_HEIGHT);

            const logoImg = new Image();
            const chartImg = new Image();
            let loadedCount = 0;

            const onAllLoaded = () => {
                loadedCount++;
                if (loadedCount < 2) return;

                // 1. Draw Logo
                const logoSize = 120;
                ctx.drawImage(logoImg, MARGIN, 80, logoSize, logoSize);

                // 2. Draw Company Info
                ctx.fillStyle = '#1c1917'; // Stone-900 (Black)
                ctx.font = '900 48px "Inter", sans-serif';
                const zhName = '台灣生活品質發展股份有限公司';
                ctx.fillText(zhName, MARGIN + 160, 135);

                // Measure Chinese width to align English name
                const zhWidth = ctx.measureText(zhName).width;

                ctx.fillStyle = '#78716c'; // Stone-500
                ctx.font = '800 28px "Inter", sans-serif';
                ctx.fillText('Quality of Life Development Corp. Taiwan', MARGIN + 160, 180, zhWidth);

                // 3. Draw Project Details Divider
                ctx.strokeStyle = '#e7e5e4'; // Stone-200
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(MARGIN, 240);
                ctx.lineTo(A4_WIDTH - MARGIN, 240);
                ctx.stroke();

                // 4. Project metadata
                ctx.fillStyle = '#1c1917'; // Stone-900
                ctx.font = '900 36px "Inter", sans-serif';
                ctx.fillText(`案件名稱：${project.name}`, MARGIN, 305);

                ctx.font = '700 24px "Inter", sans-serif';
                ctx.fillStyle = '#44403c'; // Stone-700
                ctx.fillText(`工程編號：${project.id}`, MARGIN, 345);
                ctx.fillText(`施工地址：${project.location?.address || '未提供地址'}`, MARGIN, 385);

                const chartAreaTop = 440; // Shift down slightly
                const availableHeight = A4_HEIGHT - chartAreaTop - MARGIN;
                const availableWidth = A4_WIDTH - (MARGIN * 2);

                // 5. Calculate Scale to fit A4
                const { width: svgW, height: svgH } = svg.getBoundingClientRect();
                const scaleX = availableWidth / svgW;
                const scaleY = availableHeight / svgH;
                const scale = Math.min(scaleX, scaleY, 2.5); // Cap scale to prevent blur

                const drawW = svgW * scale;
                const drawH = svgH * scale;
                const xOffset = MARGIN;

                ctx.drawImage(chartImg, xOffset, chartAreaTop, drawW, drawH);

                // 6. Footer (Page Info)
                ctx.fillStyle = '#a8a29e';
                ctx.font = '600 18px "Inter", sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(`產出日期：${new Date().toLocaleDateString()}`, A4_WIDTH - MARGIN, A4_HEIGHT - MARGIN / 2);

                // 7. Download
                const a = document.createElement('a');
                a.download = `施工進度表-${project.name}.jpg`;
                a.href = canvas.toDataURL('image/jpeg', 0.95);
                a.click();
            };

            logoImg.onload = onAllLoaded;
            chartImg.onload = onAllLoaded;
            logoImg.src = './pwa-icon.png';
            const svgData = new XMLSerializer().serializeToString(svg);
            chartImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        } else {
            alert('無法找到圖表，請稍後再試');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays size={16} className="text-blue-600" />
                        <h3 className="font-black text-xs uppercase tracking-widest">施工進度排程</h3>
                        <button onClick={() => setIsAIScheduling(true)} className="ml-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2 py-1 rounded-lg text-[9px] font-black flex items-center gap-1"><Sparkles size={10} /> AI 排程助手</button>
                    </div>
                    {!isReadOnly && (
                        <button
                            onClick={() => {
                                const name = prompt('階段名稱：');
                                if (name) {
                                    const newPhase: ProjectPhase = {
                                        id: Date.now().toString(),
                                        name,
                                        status: 'Upcoming',
                                        progress: 0,
                                        startDate: new Date().toISOString().split('T')[0],
                                        endDate: new Date().toISOString().split('T')[0]
                                    };
                                    if (onUpdatePhases) onUpdatePhases([...(project.phases || []), newPhase]);
                                }
                            }}
                            className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-stone-800 transition-all active:scale-95"
                        >
                            + 新增階段
                        </button>
                    )}
                </div>
                <div className="p-6 space-y-6">
                    {project.phases && project.phases.length > 0 ? (
                        <div className="space-y-8">
                            {/* 甘特圖概覽 */}
                            <div className="bg-stone-50/50 p-4 rounded-[2rem] border border-stone-100">
                                <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4 ml-2">時程視覺化概覽</h4>
                                <GanttChart phases={project.phases} />
                            </div>

                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-black text-stone-900 uppercase text-xs flex items-center gap-2">
                                    <CalendarDays size={16} className="text-blue-600" /> 施工進度排程
                                </h3>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Schedule Settings */}
                                    <div className="flex items-center gap-3 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-100">
                                        <div className="flex flex-col">
                                            <label className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-0.5">開始日期</label>
                                            <input
                                                type="date"
                                                value={scheduleStartDate}
                                                onChange={(e) => {
                                                    const newDate = e.target.value;
                                                    setScheduleStartDate(newDate);

                                                    // Cascade update phases
                                                    if (project.phases && project.phases.length > 0 && newDate) {
                                                        const phases = project.phases;
                                                        const currentEarliest = phases.reduce((min, p) => p.startDate < min ? p.startDate : min, phases[0].startDate);

                                                        const diff = new Date(newDate).getTime() - new Date(currentEarliest).getTime();

                                                        if (diff !== 0) {
                                                            const updatedPhases = phases.map(p => {
                                                                const s = new Date(p.startDate);
                                                                const e = new Date(p.endDate);
                                                                return {
                                                                    ...p,
                                                                    startDate: new Date(s.getTime() + diff).toISOString().split('T')[0],
                                                                    endDate: new Date(e.getTime() + diff).toISOString().split('T')[0]
                                                                };
                                                            });
                                                            onUpdatePhases(updatedPhases);
                                                        }
                                                    }
                                                }}
                                                className="text-[10px] font-bold bg-transparent border-none outline-none p-0 text-stone-700 w-24"
                                            />
                                        </div>
                                        <div className="w-px h-6 bg-stone-200"></div>
                                        <div className="flex items-center gap-2">
                                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                                <div className={`w-3 h-3 rounded flex items-center justify-center border transition-all ${workOnHolidays ? 'bg-orange-600 border-orange-600' : 'bg-white border-stone-300'}`}>
                                                    {workOnHolidays && <Check size={10} className="text-white" strokeWidth={4} />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={workOnHolidays}
                                                    onChange={(e) => setWorkOnHolidays(e.target.checked)}
                                                    className="hidden"
                                                />
                                                <span className="text-[10px] font-bold text-stone-600">假日施工</span>
                                            </label>
                                        </div>
                                    </div>

                                    <input type="file" ref={scheduleFileInputRef} className="hidden" accept="image/*" onChange={handleScheduleUpload} />
                                    {project.contractUrl ? (
                                        <button
                                            onClick={handleAIFromContract}
                                            disabled={isAIScheduling}
                                            className="bg-blue-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-100"
                                        >
                                            {isAIScheduling ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                            使用已上傳合約 (AI排程)
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => scheduleFileInputRef.current?.click()}
                                            disabled={isAIScheduling || isReadOnly}
                                            className="bg-stone-100 text-stone-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-stone-200 transition-all flex items-center gap-2"
                                        >
                                            <Upload size={12} /> 上傳合約/報價單 (AI排程)
                                        </button>
                                    )}
                                    <button
                                        onClick={async () => {
                                            setIsAIScheduling(true);
                                            try {
                                                const result = await suggestProjectSchedule(project);
                                                alert(result.text);
                                            } catch (e) { } finally { setIsAIScheduling(false); }
                                        }}
                                        disabled={isAIScheduling || isReadOnly}
                                        className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        {isAIScheduling ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                        AI 建議排程
                                    </button>
                                    <button
                                        onClick={handleExportChart}
                                        className="bg-stone-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black hover:bg-stone-700 transition-all flex items-center gap-2"
                                    >
                                        <DownloadCloud size={12} /> 匯出圖表
                                    </button>
                                </div>
                            </div>

                            {/* List */}
                            <div className="space-y-6">
                                {project.phases.map(phase => (
                                    <div key={phase.id} className="space-y-2 group">
                                        {editingPhaseId === phase.id ? (
                                            <div className="flex flex-col gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
                                                <input
                                                    type="text"
                                                    defaultValue={phase.name}
                                                    id={`edit-name-${phase.id}`}
                                                    className="text-xs font-bold bg-white border border-stone-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    placeholder="項目名稱"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="date"
                                                        defaultValue={phase.startDate}
                                                        id={`edit-start-${phase.id}`}
                                                        className="text-[10px] bg-white border border-stone-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                    <span className="text-stone-400">-</span>
                                                    <input
                                                        type="date"
                                                        defaultValue={phase.endDate}
                                                        id={`edit-end-${phase.id}`}
                                                        className="text-[10px] bg-white border border-stone-200 rounded px-2 py-1 outline-none focus:border-blue-500"
                                                    />
                                                    <div className="flex items-center gap-1 ml-auto">
                                                        <button
                                                            onClick={() => {
                                                                const nameInput = document.getElementById(`edit-name-${phase.id}`) as HTMLInputElement;
                                                                const startInput = document.getElementById(`edit-start-${phase.id}`) as HTMLInputElement;
                                                                const endInput = document.getElementById(`edit-end-${phase.id}`) as HTMLInputElement;

                                                                if (nameInput.value && startInput.value && endInput.value) {
                                                                    onUpdatePhases(project.phases!.map(p => p.id === phase.id ? {
                                                                        ...p,
                                                                        name: nameInput.value,
                                                                        startDate: startInput.value,
                                                                        endDate: endInput.value
                                                                    } : p));
                                                                    setEditingPhaseId(null);
                                                                }
                                                            }}
                                                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                                        >
                                                            <Check size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingPhaseId(null)}
                                                            className="p-1.5 bg-stone-100 text-stone-500 rounded-lg hover:bg-stone-200 transition-colors"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex justify-between items-center text-xs font-bold text-stone-700">
                                                <span>{phase.name}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-stone-400 text-[10px]">{phase.startDate} - {phase.endDate}</span>
                                                    {!isReadOnly && (
                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setEditingPhaseId(phase.id)}
                                                                className="p-1.5 hover:bg-blue-50 text-blue-400 hover:text-blue-600 rounded-lg transition-all"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    if (confirm(`確定要刪除「${phase.name}」項目嗎？`)) {
                                                                        onUpdatePhases(project.phases!.filter(p => p.id !== phase.id));
                                                                    }
                                                                }}
                                                                className="p-1.5 hover:bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg transition-all"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        <div className="h-2 bg-stone-100 rounded-full overflow-hidden relative cursor-pointer" onClick={() => {
                                            if (!isReadOnly && onUpdatePhases) {
                                                const newProgress = prompt('輸入新進度 (0-100):', phase.progress.toString());
                                                if (newProgress !== null) {
                                                    const p = Math.min(100, Math.max(0, parseInt(newProgress) || 0));
                                                    onUpdatePhases(project.phases!.map(ph => ph.id === phase.id ? { ...ph, progress: p, status: p === 100 ? 'Completed' : p > 0 ? 'Current' : 'Upcoming' } : ph));
                                                }
                                            }
                                        }}>
                                            <div className={`h-full rounded-full transition-all duration-500 ${phase.status === 'Completed' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${phase.progress}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 flex flex-col items-center justify-center text-stone-300 gap-3 opacity-50">
                            <CalendarDays size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">尚無排程資料</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectSchedule;
