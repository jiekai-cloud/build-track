import React, { useState, useMemo, useRef } from 'react';
import { FileText, Plus, Search, Filter, Download, Eye, Edit2, Trash2, Copy, CheckCircle2, XCircle, Clock, Send, Pen, Link } from 'lucide-react';
import { Quotation, QuotationItem, ItemCategory, Customer, Project } from '../types';
import QuotationEditor from './QuotationEditor';
import QuotationPrintTemplate from './QuotationPrintTemplate';
import { generateQuotationNumber } from '../utils/quotationIdGenerator';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface QuotationSystemProps {
    quotations: Quotation[];
    customers: Customer[];
    projects: Project[];
    user: any;
    onAddQuotation?: (quotation: Quotation) => void;
    onUpdateQuotation?: (quotation: Quotation, originalId?: string) => void;
    onDeleteQuotation?: (quotationId: string) => void;
    initialProjectId?: string;
    initialQuotationId?: string;
}

const QuotationSystem: React.FC<QuotationSystemProps> = ({
    quotations,
    customers,
    projects,
    user,
    onAddQuotation,
    onUpdateQuotation,
    onDeleteQuotation,
    initialProjectId,
    initialQuotationId
}) => {

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
    const [showNewQuotationModal, setShowNewQuotationModal] = useState(false);
    const [isCopyMode, setIsCopyMode] = useState(false);

    const [showOptionNameInPdf, setShowOptionNameInPdf] = useState(true);

    // Deep Link Logic
    React.useEffect(() => {
        // ... (existing code)
    }, [initialProjectId, initialQuotationId, quotations]);

    // ... (existing code)

    {/* 搜尋與篩選 */ }
    <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-stone-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* 搜尋框 */}
            <div className="flex-1 relative w-full">
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
            <div className="relative w-full md:w-auto">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={20} />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full md:w-auto pl-12 pr-8 py-3 rounded-xl border-2 border-stone-200 focus:border-orange-500 focus:outline-none font-bold bg-white appearance-none cursor-pointer"
                >
                    <option value="all">全部狀態</option>
                    <option value="draft">草稿</option>
                    <option value="sent">已送出</option>
                    <option value="signed">已簽署</option>
                    <option value="approved">已核准</option>
                    <option value="rejected">已拒絕</option>
                    <option value="expired">已過期</option>
                    <option value="converted">已成交</option>
                </select>
            </div>

            {/* PDF 設定 */}
            <div className="flex items-center gap-2 px-4 py-3 bg-stone-50 rounded-xl border-2 border-stone-200 w-full md:w-auto whitespace-nowrap">
                <input
                    type="checkbox"
                    id="showOptionName"
                    checked={showOptionNameInPdf}
                    onChange={(e) => setShowOptionNameInPdf(e.target.checked)}
                    className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500 cursor-pointer accent-orange-600"
                />
                <label htmlFor="showOptionName" className="font-bold text-stone-700 cursor-pointer select-none text-sm">
                    PDF 顯示方案名稱
                </label>
            </div>
        </div>
    </div>

    {/* 報價單列表 */ }
    {/* ... (existing code) ... */ }

    {/* Hidden Print Container */ }
    <div style={{ position: 'fixed', top: '-9999px', left: '-9999px' }}>
        {printingQuotation && (
            <QuotationPrintTemplate ref={printRef} quotation={printingQuotation} showOptionName={showOptionNameInPdf} />
        )}
    </div>
        </div >
    );
};

export default QuotationSystem;
