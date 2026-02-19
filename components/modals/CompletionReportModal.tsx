
import React from 'react';
import { CheckCircle, DownloadCloud, X } from 'lucide-react';
import { Project } from '../../types';

interface CompletionReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

const CompletionReportModal: React.FC<CompletionReportModalProps> = ({ isOpen, onClose, project }) => {
    if (!isOpen) return null;
    const files = project.files || [];

    return (
        <div className="fixed inset-0 z-[120] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
            <div className="bg-white w-full max-w-[210mm] min-h-screen sm:min-h-0 sm:rounded-[2.5rem] shadow-2xl relative flex flex-col print:shadow-none print:rounded-none">
                {/* Action Bar (Hidden when printing) */}
                <div className="sticky top-0 z-[130] bg-white/80 backdrop-blur-md px-8 py-4 border-b border-stone-100 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <CheckCircle size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">完工報告書系統</h3>
                            <p className="text-[10px] text-stone-400 font-bold mt-1">Completion Report Preview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center gap-2"
                        >
                            <DownloadCloud size={14} /> 列印或匯出 PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 rounded-xl bg-stone-100 text-stone-400 flex items-center justify-center hover:bg-stone-200 hover:text-stone-900 transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="flex-1 p-0 print:p-0">
                    {/* PAGE 1: COVER */}
                    <div className="w-full aspect-[1/1.4142] p-16 flex flex-col items-center justify-between relative print:break-after-page">
                        <div className="w-full text-center space-y-6 mt-12">
                            <h1 className="text-3xl font-black text-slate-900 tracking-[0.2em]">{project.location?.address}</h1>
                            <h2 className="text-4xl font-black text-slate-900 tracking-[0.1em]">{project.name}</h2>
                        </div>

                        <div className="relative w-96 h-96 flex items-center justify-center">
                            <div className="absolute inset-0 border-[1px] border-stone-100 rounded-full"></div>
                            <div className="absolute inset-8 border-[1px] border-stone-200 rounded-full"></div>
                            <div className="relative text-center space-y-4">
                                <span className="text-6xl font-black text-stone-800 tracking-[0.5em] block ml-4">完工</span>
                                <span className="text-6xl font-black text-stone-800 tracking-[0.5em] block ml-4">報告</span>
                                <span className="text-6xl font-black text-stone-800 tracking-[0.5em] block ml-4">書</span>
                            </div>
                        </div>

                        <div className="w-full max-w-md space-y-4 pb-12">
                            <div className="grid grid-cols-3 gap-4 border-b border-stone-100 pb-2">
                                <span className="text-stone-400 text-sm font-black uppercase tracking-widest">案件編號</span>
                                <span className="col-span-2 text-stone-900 text-lg font-black tracking-widest">{project.id}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b border-stone-100 pb-2">
                                <span className="text-stone-400 text-sm font-black uppercase tracking-widest">承攬廠商</span>
                                <span className="col-span-2 text-stone-900 text-sm font-black">台灣生活品質發展股份有限公司</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b border-stone-100 pb-2">
                                <span className="text-stone-400 text-sm font-black uppercase tracking-widest">負責人</span>
                                <span className="col-span-2 text-stone-900 text-sm font-black text-lg">陳信寬</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-b border-stone-100 pb-2">
                                <span className="text-stone-400 text-sm font-black uppercase tracking-widest">專案負責人</span>
                                <span className="col-span-2 text-stone-900 text-sm font-black text-lg">{project.engineeringManager}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <span className="text-stone-400 text-sm font-black uppercase tracking-widest">聯絡電話</span>
                                <span className="col-span-2 text-stone-900 text-sm font-black">0986-909157 / 0910-929-597</span>
                            </div>
                        </div>

                        <div className="absolute bottom-12 right-12 flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-stone-900 uppercase">傑凱相關企業</p>
                                <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">Jiekai Affiliated Companies</p>
                            </div>
                            <img src="./pwa-icon.png" className="w-8 h-8 opacity-50 contrast-125" alt="Logo" />
                        </div>
                    </div>

                    {/* PAGE 2: TABLE OF CONTENTS */}
                    <div className="w-full aspect-[1/1.4142] p-24 flex flex-col relative print:break-after-page">
                        <h3 className="text-3xl font-black text-slate-900 text-center mb-24 tracking-[0.5em] ml-4">目錄</h3>
                        <div className="space-y-8 flex-1 max-w-2xl mx-auto w-full">
                            {[
                                { label: '工程報單', page: '2' },
                                { label: '施工過程照片紀錄', page: '3' },
                                { label: '工程保固書', page: '10' },
                                { label: '附件一：合約影本', page: '12' },
                                { label: '附件二：工安管理資料影本', page: '24' },
                                { label: '附件三：使用材料簡介', page: '34' }
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-end gap-2 group">
                                    <span className="text-lg font-black text-slate-900 shrink-0">{item.label}</span>
                                    <div className="flex-1 border-b-[1.5px] border-dotted border-stone-300 mb-1.5 transition-colors group-hover:border-stone-900"></div>
                                    <span className="text-lg font-black text-slate-900 shrink-0 font-mono">{item.page}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-auto flex justify-center pb-12">
                            <img src="./pwa-icon.png" className="w-10 h-10 opacity-20" alt="Logo" />
                        </div>
                    </div>

                    {/* PAGE 3+: PHOTO RECORDS (CHUNKED BY 2 PER PAGE) */}
                    {Array.from({ length: Math.ceil(files.filter(f => f.category === 'construction').length / 2) }).map((_, pageIdx) => {
                        const pagePhotos = files.filter(f => f.category === 'construction').slice(pageIdx * 2, pageIdx * 2 + 2);
                        return (
                            <div key={pageIdx} className="w-full aspect-[1/1.4142] p-20 flex flex-col relative print:break-after-page border-t sm:border-t-0 border-stone-100">
                                <h3 className="text-2xl font-black text-slate-900 text-center mb-12 tracking-widest">施工過程照片紀錄</h3>
                                <div className="flex-1 flex flex-col gap-12">
                                    {pagePhotos.map((photo, pIdx) => (
                                        <div key={pIdx} className="flex-1 flex flex-col border border-slate-200 rounded-lg overflow-hidden bg-stone-50/30">
                                            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-2">
                                                <img
                                                    src={photo.url}
                                                    className="max-w-full max-h-full object-contain shadow-sm"
                                                    alt={photo.name}
                                                />
                                            </div>
                                            <div className="bg-white px-8 py-5 border-t border-slate-100 text-center">
                                                <p className="text-sm font-black text-slate-800">{photo.name.replace(/\.[^/.]+$/, "")}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex justify-between items-center opacity-40">
                                    <span className="text-[10px] font-black">{pageIdx + 3}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-tighter">Jiekai Affiliated Companies</span>
                                        <img src="./pwa-icon.png" className="w-6 h-6" alt="Logo" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* PAGE 10: ENGINEERING WARRANTY (工程保固書) */}
                    <div className="w-full aspect-[1/1.4142] p-20 flex flex-col relative print:break-after-page border-t sm:border-t-0 border-stone-100">
                        <div className="flex-1 border-[1.5px] border-stone-800 p-12 flex flex-col space-y-10">
                            <h3 className="text-4xl font-black text-slate-900 text-center tracking-[0.5em] mb-12 underline underline-offset-8">工程保固書</h3>

                            <div className="space-y-6 text-base font-bold text-slate-800">
                                <p>一、工程名稱：{project.name}</p>
                                <p>二、工程地點：{project.location?.address}</p>
                                <p>三、承包廠商：台灣生活品質發展股份有限公司</p>
                                <p>四、工程範圍：工程項目詳細報價單</p>

                                <div className="pt-4 leading-relaxed space-y-4">
                                    <p>五、保固責任：本工程已於民國一一四年十一月三日全部竣工完成，</p>
                                    <p className="pl-12">並由承商負責保固，保固期限為壹年，自民國一一四年</p>
                                    <p className="pl-12">十一月二日起至民國一一五年十一月一日止，保固期間</p>
                                    <p className="pl-12">施工範圍內，倘發生結構損壞或漏水情形，由承商負責</p>
                                    <p className="pl-12">無償修復(因不可抗力及材料自然老化之因素，或甲方</p>
                                    <p className="pl-12">使用不當、未善盡保管之責所造成之損害除外)，並於</p>
                                    <p className="pl-12">甲方通知後，七日內安排保固修繕，絕無異議。</p>
                                </div>
                            </div>

                            <div className="mt-auto grid grid-cols-2 gap-8 pt-12">
                                <div className="space-y-3 text-sm font-black text-slate-900">
                                    <p>承攬廠商：台灣生活品質發展股份有限公司</p>
                                    <p>負責人：陳信寬</p>
                                    <p>工地負責人：陳信寬 &nbsp;&nbsp; 專案負責人：{project.engineeringManager}</p>
                                    <p>公司地址：新北市中和區景平路 71-7 號 5 樓之 9</p>
                                    <p>統一編號：60618756</p>
                                    <p>公司電話：02-2242-1955 公司傳真：02-2242-1905</p>
                                </div>

                                <div className="relative flex flex-col items-center justify-center">
                                    <div className="w-48 h-48 border-2 border-dashed border-rose-200 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                                        <div className="text-[10px] text-rose-300 font-black text-center group-hover:text-rose-400 transition-colors">
                                            <p>保固書專用章用印處</p>
                                            <p className="mt-1">無戳印則本保固書無效</p>
                                        </div>
                                        {/* Seal Simulation Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                                            <div className="w-24 h-24 border-4 border-rose-600 rounded flex items-center justify-center text-rose-600 font-black text-xs rotate-12">公司大章</div>
                                            <div className="w-12 h-12 border-2 border-rose-600 rounded flex items-center justify-center text-rose-600 font-black text-[8px] -rotate-12 absolute bottom-4 right-4">私章</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-between items-end pt-12">
                                <div className="flex gap-4 text-xl font-black text-slate-900 tracking-widest">
                                    <span>中</span>
                                    <span>華</span>
                                    <span>民</span>
                                    <span>國</span>
                                    <span className="w-12 border-b-2 border-stone-800 text-center">一一四</span>
                                    <span>年</span>
                                    <span className="w-8 border-b-2 border-stone-800 text-center">十</span>
                                    <span>月</span>
                                    <span className="w-8 border-b-2 border-stone-800 text-center">四</span>
                                    <span>日</span>
                                </div>
                                <div className="flex items-center gap-3 opacity-60 scale-75 origin-right">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-stone-900 uppercase">傑凱相關企業</p>
                                        <p className="text-[8px] text-stone-400 font-bold uppercase tracking-tighter">Jiekai Affiliated Companies</p>
                                    </div>
                                    <img src="./pwa-icon.png" className="w-8 h-8" alt="Logo" />
                                </div>
                            </div>
                        </div>
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-stone-300">10</div>
                    </div>
                    <div className="w-full aspect-[1/1.4142] p-16 flex flex-col relative print:break-after-page border-t sm:border-t-0 border-stone-100">
                        <div className="border-[1.5px] border-stone-900 h-full p-8 flex flex-col">
                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900">報價單</h3>
                                    <p className="text-stone-500 font-bold text-[10px] tracking-widest">QUOTATION SUMMARY</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black">台灣生活品質發展股份有限公司</p>
                                    <p className="text-[8px] text-stone-500">台北市士林區中心北路五段500號7樓</p>
                                    <p className="text-[8px] text-stone-500">TEL: 02-2242-1955</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-y-4 mb-8 text-[11px] font-bold text-slate-700">
                                <p>工程編號：{project.id}</p>
                                <p className="text-right font-black">Date: {new Date().toLocaleDateString()}</p>
                                <p className="col-span-2">工程名稱：{project.name}</p>
                                <p className="col-span-2">工程地址：{project.location?.address || '見詳述'}</p>
                            </div>

                            <div className="flex-1 border-t border-stone-900">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-stone-900 text-[10px] font-black uppercase tracking-widest">
                                            <th className="py-2 px-1">項次</th>
                                            <th className="py-2 px-1">品名項目</th>
                                            <th className="py-2 px-1">單位</th>
                                            <th className="py-2 px-1 text-right">金額</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[10px] font-bold">
                                        {(project.phases || []).map((phase, idx) => (
                                            <tr key={idx} className="border-b border-stone-100">
                                                <td className="py-2 px-1 text-stone-400">{idx + 1}</td>
                                                <td className="py-2 px-1 text-slate-800">{phase.name}</td>
                                                <td className="py-2 px-1 text-stone-500">一式</td>
                                                <td className="py-2 px-1 text-right font-black">${((project.budget || 0) / (project.phases?.length || 1)).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="space-y-1 mt-8 border-t-[1.5px] border-stone-900 pt-6">
                                <div className="flex justify-between items-center text-sm font-black">
                                    <span className="text-stone-400">未稅金額</span>
                                    <span>${Math.round((project.budget || 0) / 1.05).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm font-black">
                                    <span className="text-stone-400">營業稅 5%</span>
                                    <span>${Math.round((project.budget || 0) - ((project.budget || 0) / 1.05)).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xl font-black pt-4">
                                    <span>總計金額</span>
                                    <span className="text-emerald-600">${(project.budget || 0).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompletionReportModal;
