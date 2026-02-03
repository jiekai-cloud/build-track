import React, { useState, useMemo, useRef } from 'react';
import { FileText, Plus, Search, Filter, Download, Eye, Edit2, Trash2, Copy, CheckCircle2, XCircle, Clock, Send } from 'lucide-react';
import { Quotation, QuotationItem, ItemCategory, Customer, Project } from '../types';
import QuotationEditor from './QuotationEditor';
import QuotationPrintTemplate from './QuotationPrintTemplate';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QuotationSystemProps {
    quotations: Quotation[];
    customers: Customer[];
    projects: Project[];
    user: any;
    onAddQuotation?: (quotation: Quotation) => void;
    onUpdateQuotation?: (quotation: Quotation) => void;
    onDeleteQuotation?: (quotationId: string) => void;
}

const QuotationSystem: React.FC<QuotationSystemProps> = ({
    quotations,
    customers,
    projects,
    user,
    onAddQuotation,
    onUpdateQuotation,
    onDeleteQuotation
}) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [showNewQuotationModal, setShowNewQuotationModal] = useState(false);

    // PDF Generation State
    const [printingQuotation, setPrintingQuotation] = useState<Quotation | null>(null);
    const printRef = useRef<HTMLDivElement>(null);

    const handleDownloadPDF = async (quotation: Quotation) => {
        // 1. Set the quotation to be printed (mounts the hidden template)
        setPrintingQuotation(quotation);

        // Allow React to render by waiting a tick
        setTimeout(async () => {
            if (!printRef.current) return;

            try {
                // 2. Capture with html2canvas (High scale for better quality)
                const canvas = await html2canvas(printRef.current, {
                    scale: 2, // 2x resolution for crisp text
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff'
                });

                // 3. Generate PDF
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                const pdf = new jsPDF('p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = 0;

                // First page
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pdfHeight;

                // Multi-page handling (Simple cut)
                while (heightLeft > 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pdfHeight;
                }

                pdf.save(`Quote_${quotation.quotationNumber}.pdf`);
            } catch (error) {
                console.error('PDF Generation failed', error);
                alert('PDF 產生失敗，請稍後再試');
            } finally {
                // Cleanup
                setPrintingQuotation(null);
            }
        }, 100);
    };



    // 狀態統計
    const stats = useMemo(() => {
        return {
            total: quotations.filter(q => !q.deletedAt).length,
            draft: quotations.filter(q => q.status === 'draft' && !q.deletedAt).length,
            sent: quotations.filter(q => q.status === 'sent' && !q.deletedAt).length,
            approved: quotations.filter(q => q.status === 'approved' && !q.deletedAt).length,
            converted: quotations.filter(q => q.status === 'converted' && !q.deletedAt).length
        };
    }, [quotations]);

    // 篩選報價單
    const filteredQuotations = useMemo(() => {
        return quotations
            .filter(q => !q.deletedAt)
            .filter(q => {
                if (statusFilter !== 'all' && q.status !== statusFilter) return false;
                if (searchTerm) {
                    const term = searchTerm.toLowerCase();
                    return (
                        q.quotationNumber.toLowerCase().includes(term) ||
                        q.header.projectName.toLowerCase().includes(term) ||
                        q.header.to?.toLowerCase().includes(term)
                    );
                }
                return true;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [quotations, searchTerm, statusFilter]);

    // 狀態標籤樣式
    const getStatusBadge = (status: Quotation['status']) => {
        const styles = {
            draft: 'bg-stone-100 text-stone-700 border-stone-300',
            sent: 'bg-blue-100 text-blue-700 border-blue-300',
            approved: 'bg-green-100 text-green-700 border-green-300',
            rejected: 'bg-red-100 text-red-700 border-red-300',
            expired: 'bg-orange-100 text-orange-700 border-orange-300',
            converted: 'bg-purple-100 text-purple-700 border-purple-300'
        };

        const labels = {
            draft: '草稿',
            sent: '已送出',
            approved: '已核准',
            rejected: '已拒絕',
            expired: '已過期',
            converted: '已成交'
        };

        const icons = {
            draft: Edit2,
            sent: Send,
            approved: CheckCircle2,
            rejected: XCircle,
            expired: Clock,
            converted: CheckCircle2
        };

        const Icon = icons[status];

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
                <Icon size={14} />
                {labels[status]}
            </span>
        );
    };

    return (
        <div className="p-6 space-y-6 bg-gradient-to-br from-stone-50 to-stone-100 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-black text-stone-900 flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                            <FileText className="text-white" size={28} />
                        </div>
                        報價系統
                    </h1>
                    <p className="text-stone-500 mt-2 text-sm">專業工程報價單管理與追蹤</p>
                </div>
                <button
                    onClick={() => setShowNewQuotationModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all shadow-lg hover:shadow-xl font-bold"
                >
                    <Plus size={20} />
                    新增報價單
                </button>
            </div>

            {/* 統計卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-sm">
                    <div className="text-stone-500 text-xs font-bold uppercase">全部報價單</div>
                    <div className="text-3xl font-black text-stone-900 mt-2">{stats.total}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-stone-200 shadow-sm">
                    <div className="text-stone-500 text-xs font-bold uppercase">草稿</div>
                    <div className="text-3xl font-black text-stone-600 mt-2">{stats.draft}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-sm">
                    <div className="text-blue-600 text-xs font-bold uppercase">已送出</div>
                    <div className="text-3xl font-black text-blue-600 mt-2">{stats.sent}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-green-200 shadow-sm">
                    <div className="text-green-600 text-xs font-bold uppercase">已核准</div>
                    <div className="text-3xl font-black text-green-600 mt-2">{stats.approved}</div>
                </div>
                <div className="bg-white rounded-2xl p-5 border-2 border-purple-200 shadow-sm">
                    <div className="text-purple-600 text-xs font-bold uppercase">已成交</div>
                    <div className="text-3xl font-black text-purple-600 mt-2">{stats.converted}</div>
                </div>
            </div>

            {/* 搜尋與篩選 */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-stone-200">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* 搜尋框 */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <input
                            type="text"
                            placeholder="搜尋報價單編號、工程名稱、客戶名稱..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-500 focus:outline-none font-medium"
                        />
                    </div>

                    {/* 狀態篩選 */}
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-12 pr-8 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-500 focus:outline-none font-bold bg-white appearance-none cursor-pointer"
                        >
                            <option value="all">全部狀態</option>
                            <option value="draft">草稿</option>
                            <option value="sent">已送出</option>
                            <option value="approved">已核准</option>
                            <option value="rejected">已拒絕</option>
                            <option value="expired">已過期</option>
                            <option value="converted">已成交</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* 報價單列表 */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-stone-200 overflow-hidden">
                {filteredQuotations.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-stone-100 mb-4">
                            <FileText className="text-stone-400" size={40} />
                        </div>
                        <h3 className="text-lg font-bold text-stone-900 mb-2">尚無報價單</h3>
                        <p className="text-stone-500 mb-6">
                            {searchTerm || statusFilter !== 'all'
                                ? '沒有符合條件的報價單'
                                : '點擊「新增報價單」開始建立第一筆報價'}
                        </p>
                        {!searchTerm && statusFilter === 'all' && (
                            <button
                                onClick={() => setShowNewQuotationModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors font-bold"
                            >
                                <Plus size={20} />
                                新增報價單
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-stone-50 border-b-2 border-stone-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-black text-stone-600 uppercase tracking-wider">報價單號</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-stone-600 uppercase tracking-wider">工程名稱</th>
                                    <th className="px-6 py-4 text-left text-xs font-black text-stone-600 uppercase tracking-wider">客戶</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-stone-600 uppercase tracking-wider">報價金額</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-stone-600 uppercase tracking-wider">狀態</th>
                                    <th className="px-6 py-4 text-center text-xs font-black text-stone-600 uppercase tracking-wider">建立日期</th>
                                    <th className="px-6 py-4 text-right text-xs font-black text-stone-600 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-200">
                                {filteredQuotations.map((quotation) => (
                                    <tr key={quotation.id} className="hover:bg-stone-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-stone-900">{quotation.quotationNumber}</div>
                                            <div className="text-xs text-stone-500">v{quotation.version}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-stone-900">{quotation.header.projectName}</div>
                                            {quotation.header.projectAddress && (
                                                <div className="text-xs text-stone-500 mt-1">{quotation.header.projectAddress}</div>
                                            )}
                                            {quotation.projectId && (
                                                <div className="flex items-center gap-1 mt-1 text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100 w-fit font-bold">
                                                    連結案件: {projects.find(p => p.id === quotation.projectId)?.name || '未知案件'}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-stone-900">{quotation.header.to || '-'}</div>
                                            {quotation.header.attn && (
                                                <div className="text-xs text-stone-500">聯絡人: {quotation.header.attn}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="font-black text-lg text-orange-600">
                                                ${quotation.options[quotation.selectedOptionIndex]?.summary.totalAmount.toLocaleString() || 0}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(quotation.status)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm text-stone-600">
                                                {new Date(quotation.createdAt).toLocaleDateString('zh-TW')}
                                            </div>
                                            <div className="text-xs text-stone-400">{quotation.createdByName}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleDownloadPDF(quotation)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="下載 PDF"
                                                >
                                                    <Download size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedQuotation(quotation)}
                                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                    title="編輯"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="複製"
                                                >
                                                    <Copy size={18} />
                                                </button>
                                                <button
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="刪除"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* 開發中提示 */}
            <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
                        <FileText className="text-white" size={24} />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-black text-orange-900 mb-2">報價系統開發中 🚀</h3>
                        <div className="text-sm text-orange-800 space-y-1">
                            <p>✅ 已完成：資料結構定義、模組註冊、基礎界面</p>
                            <p>🔄 開發中：報價單編輯器、PDF 產生功能</p>
                            <p className="mt-3 font-bold">💡 可用資料：客戶數 {customers.length} | 專案數 {projects.length}</p>
                        </div>
                    </div>
                </div>
            </div>
            <QuotationEditor
                isOpen={showNewQuotationModal || !!selectedQuotation}
                onClose={() => {
                    setShowNewQuotationModal(false);
                    setSelectedQuotation(null);
                }}
                onSave={(newQuotation) => {
                    if (selectedQuotation) {
                        // Update
                        if (onUpdateQuotation) onUpdateQuotation(newQuotation);
                    } else {
                        // Create
                        if (onAddQuotation) onAddQuotation(newQuotation);
                    }
                    setShowNewQuotationModal(false);
                    setSelectedQuotation(null);
                }}
                initialData={selectedQuotation}
                customers={customers}
                projects={projects}
                user={user}
            />

            {/* Hidden Print Container */}
            <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
                {printingQuotation && (
                    <QuotationPrintTemplate ref={printRef} quotation={printingQuotation} />
                )}
            </div>
        </div>
    );
};

export default QuotationSystem;
