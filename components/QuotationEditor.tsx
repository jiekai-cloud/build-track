import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Trash2, FileText, Save, Download, Calculator, ChevronDown, ChevronRight, Copy, Database, Check, Sparkles, Loader2, Bot, Mic, MicOff } from 'lucide-react';
import { Quotation, QuotationItem, ItemCategory, QuotationOption, Customer, Project, QuotationSummary } from '../types';
import { generateQuotationPDF } from '../services/quotationPdfService';
import { STANDARD_QUOTATION_ITEMS, StandardItem } from '../data/standardItems';
import { QUOTATION_PRESETS as STATIC_PRESETS, createQuotationFromPreset, QuotationPreset } from '../data/quotationPresets';
import { useQuotationPresets } from '../hooks/useQuotationPresets';
import { findQuotationItems } from '../services/geminiService';
import { generateQuotationNumber } from '../utils/quotationIdGenerator';
import { STANDARD_NOTES, getCategories } from '../data/standardNotes';

interface QuotationEditorProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (quotation: Quotation) => void;
    initialData?: Quotation | null;
    customers: Customer[];
    projects: Project[];
    user: any;
    defaultProjectId?: string;
    quotations: Quotation[];
}

const EmptyItem: QuotationItem = {
    id: '',
    itemNumber: 0,
    name: '',
    unit: '式',
    quantity: 1,
    unitPrice: 0,
    amount: 0
};

const EmptyCategory: ItemCategory = {
    id: '',
    code: '壹',
    name: '新建分類',
    items: []
};

const EmptyOption: QuotationOption = {
    id: 'OPT-1',
    name: '方案一',
    description: '',
    categories: [],
    summary: {
        subtotal: 0,
        managementFee: 0,
        managementFeeRate: 10,
        beforeTaxAmount: 0,
        tax: 0,
        taxRate: 5,
        totalAmount: 0
    }
};

const QuotationEditor: React.FC<QuotationEditorProps> = ({
    isOpen,
    onClose,
    onSave,
    initialData,
    customers,
    projects,
    user,
    defaultProjectId,
    quotations
}) => {
    const [formData, setFormData] = useState<Quotation | null>(null);
    const [activeOptionIndex, setActiveOptionIndex] = useState(0);

    // Standard Item Selector State
    const [showItemSelector, setShowItemSelector] = useState(false);
    const [showTemplateSelector, setShowTemplateSelector] = useState(false); // Template Selector State
    const [showNoteSelector, setShowNoteSelector] = useState(false); // Note Selector State
    const [selectedStandardItems, setSelectedStandardItems] = useState<StandardItem[]>([]);
    const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');

    // AI Assistant State
    const [showAISelector, setShowAISelector] = useState(false);
    const [aiDescription, setAiDescription] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [aiResults, setAiResults] = useState<string[]>([]);

    // Voice Recognition State
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = React.useRef<any>(null);

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("您的瀏覽器不支援語音辨識功能，請使用 Chrome 或 Safari。");
            return;
        }

        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event: any) => {
            const text = event.results[0][0].transcript;
            setAiDescription(prev => prev ? `${prev}，${text}` : text);
        };
        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            setIsListening(false);
        };
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
        recognition.start();
    };

    const handleAIAnalysis = async () => {
        if (!aiDescription.trim()) return;
        setAiLoading(true);
        try {
            const results = await findQuotationItems(aiDescription, STANDARD_QUOTATION_ITEMS);
            setAiResults(results);
        } catch (error) {
            console.error("AI Analysis failed:", error);
            alert("AI 分析失敗，請稍後再試。");
        } finally {
            setAiLoading(false);
        }
    };

    const handleApplyAIResults = () => {
        const itemsToAdd: StandardItem[] = [];

        // Flatten standard items for lookup
        const allStandardItems: StandardItem[] = [];
        STANDARD_QUOTATION_ITEMS.forEach(cat => allStandardItems.push(...cat.items));

        aiResults.forEach(id => {
            const item = allStandardItems.find(i => i.id === id);
            if (item) itemsToAdd.push(item);
        });

        if (itemsToAdd.length > 0) {
            setSelectedStandardItems(itemsToAdd);
            setShowAISelector(false);
            setShowItemSelector(true); // Open the standard item selector with these items pre-selected
        } else {
            alert("沒有找到匹配的工項。");
        }
    };

    // Live Presets from Google Sheet
    const { presets, loading: loadingPresets, refresh: refreshPresets } = useQuotationPresets();

    // 初始化資料
    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setFormData(JSON.parse(JSON.stringify(initialData)));
            } else {
                // 建立新報價單預設值
                // Init with independent ID first, or defaultProject's ID if present
                const newId = generateQuotationNumber(defaultProjectId, quotations);

                const newQuotation: Quotation = {
                    id: newId,
                    quotationNumber: newId,
                    version: 1,
                    header: {
                        projectName: '',
                        quotationDate: new Date().toISOString().split('T')[0],
                        to: '',
                    },
                    options: [{ ...EmptyOption, categories: [{ ...EmptyCategory, id: crypto.randomUUID(), items: [{ ...EmptyItem, id: crypto.randomUUID(), itemNumber: 1 }] }] }],
                    selectedOptionIndex: 0,
                    status: 'draft',
                    createdBy: user?.id || '',
                    createdByName: user?.name || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // Apply Default Project ID if provided
                if (defaultProjectId) {
                    newQuotation.projectId = defaultProjectId;
                    const proj = projects.find(p => p.id === defaultProjectId);
                    if (proj) {
                        newQuotation.header.projectName = proj.name; // Also pre-fill project name
                        newQuotation.header.to = proj.client; // And client name
                        // Auto-fill address
                        if (proj.location) {
                            const addr = typeof proj.location === 'object' && proj.location.address
                                ? proj.location.address
                                : (typeof proj.location === 'string' ? proj.location : '');
                            if (addr) newQuotation.header.projectAddress = addr;
                        }
                    }
                }

                setFormData(newQuotation);
            }
        }
    }, [isOpen, initialData, user, defaultProjectId, projects, quotations]);

    // 自動計算金額
    useEffect(() => {
        if (!formData) return;

        const updatedOptions = formData.options.map(option => {
            let subtotal = 0;

            const updatedCategories = option.categories.map(cat => ({
                ...cat,
                items: cat.items.map(item => {
                    const amount = item.quantity * item.unitPrice;
                    subtotal += amount;
                    return { ...item, amount };
                })
            }));

            const mgmtFee = Math.round(subtotal * (option.summary.managementFeeRate / 100));
            const beforeTax = subtotal + mgmtFee;
            const tax = Math.round(beforeTax * (option.summary.taxRate / 100));
            const total = beforeTax + tax;

            return {
                ...option,
                categories: updatedCategories,
                summary: {
                    ...option.summary,
                    subtotal,
                    managementFee: mgmtFee,
                    beforeTaxAmount: beforeTax,
                    tax,
                    totalAmount: total
                }
            };
        });

        // 只有當數值真正改變時才更新狀態，避免無限迴圈
        if (JSON.stringify(updatedOptions) !== JSON.stringify(formData.options)) {
            setFormData(prev => prev ? ({ ...prev, options: updatedOptions }) : null);
        }
    }, [formData?.options]);

    // Helper to update specific fields
    const updateHeader = (field: string, value: any) => {
        setFormData(prev => prev ? ({
            ...prev,
            header: { ...prev.header, [field]: value }
        }) : null);
    };

    const addItem = (catIndex: number) => {
        if (!formData) return;
        const newOptions = [...formData.options];
        const category = newOptions[activeOptionIndex].categories[catIndex];
        category.items.push({
            ...EmptyItem,
            id: crypto.randomUUID(),
            itemNumber: category.items.length + 1
        });
        setFormData({ ...formData, options: newOptions });
    };

    const updateItem = (catIndex: number, itemIndex: number, field: keyof QuotationItem, value: any) => {
        if (!formData) return;
        const newOptions = [...formData.options];
        const item = newOptions[activeOptionIndex].categories[catIndex].items[itemIndex];
        (item as any)[field] = value;
        setFormData({ ...formData, options: newOptions });
    };

    const deleteItem = (catIndex: number, itemIndex: number) => {
        if (!formData) return;
        const newOptions = [...formData.options];
        newOptions[activeOptionIndex].categories[catIndex].items.splice(itemIndex, 1);
        // Renumber
        newOptions[activeOptionIndex].categories[catIndex].items.forEach((item, idx) => {
            item.itemNumber = idx + 1;
        });
        setFormData({ ...formData, options: newOptions });
    };

    const handleImportItems = () => {
        if (!formData || selectedStandardItems.length === 0) return;

        const newOptions = [...formData.options];
        const currentOption = newOptions[activeOptionIndex];

        selectedStandardItems.forEach(stdItem => {
            // Find source category
            const sourceCat = STANDARD_QUOTATION_ITEMS.find(cat => cat.items.some(i => i.id === stdItem.id));
            if (!sourceCat) return;

            // Try to find matching category in current quotation by Name
            let targetCatIndex = currentOption.categories.findIndex(c => c.name === sourceCat.name);

            if (targetCatIndex === -1) {
                // Create new category
                const newCat: ItemCategory = {
                    id: crypto.randomUUID(),
                    code: sourceCat.code,
                    name: sourceCat.name,
                    items: []
                };
                currentOption.categories.push(newCat);
                targetCatIndex = currentOption.categories.length - 1;
            }

            // Add item
            const newItem: QuotationItem = {
                id: crypto.randomUUID(),
                itemNumber: currentOption.categories[targetCatIndex].items.length + 1,
                name: stdItem.name,
                unit: stdItem.unit,
                quantity: 1,
                unitPrice: stdItem.defaultPrice,
                amount: stdItem.defaultPrice, // initial amount
                notes: stdItem.notes
            };
            currentOption.categories[targetCatIndex].items.push(newItem);
        });

        setFormData({ ...formData, options: newOptions });
        setSelectedStandardItems([]); // Clear selection
        setShowItemSelector(false); // Close modal
    };

    const toggleStandardItemSelection = (item: StandardItem) => {
        setSelectedStandardItems(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) {
                return prev.filter(i => i.id !== item.id);
            } else {
                return [...prev, item];
            }
        });
    };

    const handleGeneratePDF = async () => {
        if (!formData) {
            alert('報價資料不完整');
            return;
        }

        try {
            alert('正在產生 PDF，請稍候...');
            await generateQuotationPDF(formData);
        } catch (error: any) {
            console.error('PDF generation failed:', error);
            alert(error.message || '生成 PDF 時發生錯誤，請檢查報價資料是否完整');
        }
    };

    const generateSampleData = () => {
        setFormData(prev => prev ? ({
            ...prev,
            header: {
                ...prev.header,
                to: '範例客戶股份有限公司',
                attn: '陳經理',
                tel: '02-23456789',
                projectName: '信義區辦公室裝修工程',
                projectAddress: '台北市信義區松高路1號'
            },
            options: [
                {
                    ...EmptyOption,
                    categories: [
                        {
                            id: 'c1',
                            code: '壹',
                            name: '拆除保護工程',
                            items: [
                                { id: 'i1', itemNumber: 1, name: '室內地板保護', unit: '式', quantity: 1, unitPrice: 5000, amount: 5000 },
                                { id: 'i2', itemNumber: 2, name: '原有隔間拆除清運', unit: '車', quantity: 3, unitPrice: 12000, amount: 36000 }
                            ]
                        },
                        {
                            id: 'c2',
                            code: '貳',
                            name: '泥作工程',
                            items: [
                                { id: 'i3', itemNumber: 1, name: '磚牆砌磚', unit: 'M2', quantity: 25, unitPrice: 1800, amount: 45000 },
                                { id: 'i4', itemNumber: 2, name: '水泥粉光', unit: 'M2', quantity: 25, unitPrice: 1200, amount: 30000 }
                            ]
                        }
                    ]
                }
            ]
        }) : null);
    };

    const handleApplyTemplate = (preset: QuotationPreset) => {
        if (!formData) return;

        const newOption = createQuotationFromPreset(preset);

        // Replace current option or add new one? Let's add new option for safety and switch to it
        setFormData(prev => {
            if (!prev) return null;
            const newOptions = [...prev.options, newOption];
            return { ...prev, options: newOptions };
        });

        // Switch to the newly added option
        setActiveOptionIndex(formData.options.length);
        setShowTemplateSelector(false);
    };

    if (!isOpen || !formData) return null;

    const currentOption = formData.options[activeOptionIndex];

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                            <FileText className="text-orange-600" />
                            {initialData ? '編輯報價單' : '新增報價單'}
                        </h2>
                        <p className="text-sm text-stone-500 mt-1">單號: {formData.quotationNumber}</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAISelector(true)}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 rounded-lg font-bold transition-all text-sm flex items-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Sparkles size={16} className="animate-pulse" /> AI 智慧選單
                        </button>
                        <button
                            onClick={() => setShowItemSelector(true)}
                            className="px-4 py-2 bg-stone-800 text-white hover:bg-stone-700 rounded-lg font-bold transition-colors text-sm flex items-center gap-2 shadow-sm"
                        >
                            <Database size={16} /> 從資料庫選擇
                        </button>
                        <button
                            onClick={() => setShowTemplateSelector(true)}
                            className="px-4 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg font-bold transition-colors text-sm flex items-center gap-2 shadow-sm border border-stone-200"
                        >
                            <Copy size={16} /> 套用範本
                        </button>
                        <button
                            onClick={generateSampleData}
                            className="px-4 py-2 text-stone-600 hover:bg-stone-200 rounded-lg font-bold transition-colors text-sm flex items-center gap-2"
                        >
                            <Copy size={16} /> 帶入範例資料
                        </button>
                        <button
                            onClick={handleGeneratePDF}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors shadow-sm flex items-center gap-2"
                        >
                            <Download size={18} /> 輸出 PDF
                        </button>
                        <button
                            onClick={() => onSave(formData)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-bold transition-colors shadow-lg flex items-center gap-2"
                        >
                            <Save size={18} /> 儲存
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
                            <X size={24} className="text-stone-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* 基本資料區 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-600">關聯案件 (選填)</label>
                            <div className="relative">
                                <select
                                    value={formData.projectId || ''}
                                    onChange={(e) => {
                                        const pid = e.target.value;
                                        setFormData(prev => prev ? ({ ...prev, projectId: pid }) : null);

                                        // Auto-fill client name if empty
                                        if (pid) {
                                            const proj = projects.find(p => p.id === pid);
                                            if (proj && !formData.header.to) {
                                                updateHeader('to', proj.client);
                                            }
                                        }
                                    }}
                                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none appearance-none bg-white"
                                >
                                    <option value="">-- 獨立報價單 (無關聯案件) --</option>
                                    {projects
                                        .filter(p => !p.deletedAt)
                                        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
                                        .map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} ({p.client})
                                            </option>
                                        ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-2.5 text-stone-400 pointer-events-none" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-600">客戶名稱 / 對象</label>
                            <input
                                type="text"
                                value={formData.header.to || ''}
                                onChange={(e) => updateHeader('to', e.target.value)}
                                className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                placeholder="輸入客戶名稱"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-600">工程名稱</label>
                            {projects && projects.length > 0 ? (
                                <div className="space-y-2">
                                    <select
                                        value={formData.projectId || ''}
                                        onChange={(e) => {
                                            const selectedProjectId = e.target.value;
                                            if (selectedProjectId === 'custom') {
                                                // Clear project ID to allow manual input
                                                // Regenerate quotation number without project ID
                                                const newIndependentId = generateQuotationNumber(undefined, quotations);
                                                setFormData(prev => prev ? {
                                                    ...prev,
                                                    projectId: undefined,
                                                    quotationNumber: newIndependentId,
                                                    id: newIndependentId
                                                } : null);
                                            } else if (selectedProjectId) {
                                                const selectedProject = projects.find(p => p.id === selectedProjectId);
                                                if (selectedProject) {
                                                    // Generate new quotation number based on selected project
                                                    const newQuotationNumber = generateQuotationNumber(selectedProject.id, quotations);
                                                    setFormData(prev => prev ? {
                                                        ...prev,
                                                        projectId: selectedProject.id,
                                                        quotationNumber: newQuotationNumber,
                                                        id: newQuotationNumber,
                                                        header: {
                                                            ...prev.header,
                                                            projectName: selectedProject.name,
                                                            to: selectedProject.client,
                                                            projectAddress: typeof selectedProject.location === 'object' && selectedProject.location.address
                                                                ? selectedProject.location.address
                                                                : (typeof selectedProject.location === 'string' ? selectedProject.location : prev.header.projectAddress)
                                                        }
                                                    } : null);
                                                }
                                            }
                                        }}
                                        className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white"
                                    >
                                        <option value="">-- 選擇既有專案 --</option>
                                        {projects.filter(p => !p.deletedAt).map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.id} - {project.name}
                                            </option>
                                        ))}
                                        <option value="custom">✏️ 手動輸入工程名稱</option>
                                    </select>
                                    {!formData.projectId && (
                                        <input
                                            type="text"
                                            value={formData.header.projectName}
                                            onChange={(e) => updateHeader('projectName', e.target.value)}
                                            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                            placeholder="輸入自訂工程名稱"
                                        />
                                    )}
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    value={formData.header.projectName}
                                    onChange={(e) => updateHeader('projectName', e.target.value)}
                                    className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="輸入工程名稱"
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-stone-600">報價日期</label>
                            <input
                                type="date"
                                value={formData.header.quotationDate}
                                onChange={(e) => updateHeader('quotationDate', e.target.value)}
                                className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* 方案選擇與內容 */}
                    <div className="bg-stone-50 rounded-xl p-6 border border-stone-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-stone-800">報價明細</h3>
                            <div className="text-sm text-stone-500">
                                目前方案：{currentOption.name}
                            </div>
                        </div>

                        {/* 分類與項目列表 */}
                        <div className="space-y-6">
                            {currentOption.categories.map((category, catIndex) => (
                                <div key={category.id || catIndex} className="bg-white rounded-lg border border-stone-200 shadow-sm overflow-hidden">
                                    <div className="bg-stone-100 p-3 flex items-center gap-2 border-b border-stone-200">
                                        <span className="font-bold text-stone-700 w-8">{category.code}</span>
                                        <input
                                            value={category.name}
                                            onChange={(e) => {
                                                const newOptions = [...formData.options];
                                                newOptions[activeOptionIndex].categories[catIndex].name = e.target.value;
                                                setFormData({ ...formData, options: newOptions });
                                            }}
                                            className="bg-transparent font-bold text-stone-800 focus:outline-none flex-1"
                                            placeholder="分類名稱"
                                        />
                                    </div>

                                    <div className="p-0">
                                        <table className="w-full text-sm">
                                            <thead className="bg-stone-50 text-stone-500">
                                                <tr>
                                                    <th className="p-3 text-center w-12">#</th>
                                                    <th className="p-3 text-left">項目名稱</th>
                                                    <th className="p-3 text-center w-20">單位</th>
                                                    <th className="p-3 text-right w-24">數量</th>
                                                    <th className="p-3 text-right w-32">單價</th>
                                                    <th className="p-3 text-right w-32">金額</th>
                                                    <th className="p-3 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-stone-100">
                                                {category.items.map((item, itemIndex) => (
                                                    <tr key={item.id} className="group hover:bg-stone-50">
                                                        <td className="p-2 text-center text-stone-400">{itemIndex + 1}</td>
                                                        <td className="p-2">
                                                            <div className="space-y-1">
                                                                <input
                                                                    value={item.name}
                                                                    onChange={(e) => updateItem(catIndex, itemIndex, 'name', e.target.value)}
                                                                    className="w-full p-1 border border-transparent hover:border-stone-300 rounded focus:border-orange-500 outline-none font-bold text-stone-700"
                                                                    placeholder="輸入項目說明"
                                                                />
                                                                <input
                                                                    value={item.notes || ''}
                                                                    onChange={(e) => updateItem(catIndex, itemIndex, 'notes', e.target.value)}
                                                                    className="w-full p-1 text-xs text-stone-500 border border-transparent hover:border-stone-300 rounded focus:border-orange-500 outline-none bg-stone-50/50"
                                                                    placeholder="項目備註 (選填)"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="p-2 centered">
                                                            <input
                                                                value={item.unit}
                                                                onChange={(e) => updateItem(catIndex, itemIndex, 'unit', e.target.value)}
                                                                className="w-full text-center p-1 border border-transparent hover:border-stone-300 rounded focus:border-orange-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                value={item.quantity}
                                                                onChange={(e) => updateItem(catIndex, itemIndex, 'quantity', parseFloat(e.target.value) || 0)}
                                                                className="w-full text-right p-1 border border-transparent hover:border-stone-300 rounded focus:border-orange-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="p-2">
                                                            <input
                                                                type="number"
                                                                value={item.unitPrice}
                                                                onChange={(e) => updateItem(catIndex, itemIndex, 'unitPrice', parseFloat(e.target.value) || 0)}
                                                                className="w-full text-right p-1 border border-transparent hover:border-stone-300 rounded focus:border-orange-500 outline-none"
                                                            />
                                                        </td>
                                                        <td className="p-2 text-right font-medium text-stone-700">
                                                            ${item.amount.toLocaleString()}
                                                        </td>
                                                        <td className="p-2 text-center">
                                                            <button
                                                                onClick={() => deleteItem(catIndex, itemIndex)}
                                                                className="text-stone-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            onClick={() => addItem(catIndex)}
                                            className="w-full py-2 text-center text-stone-500 text-sm hover:bg-stone-50 hover:text-orange-600 transition-colors border-t border-stone-100 flex items-center justify-center gap-1"
                                        >
                                            <Plus size={14} /> 新增項目
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => {
                                    const newOptions = [...formData.options];
                                    const codes = ['壹', '貳', '參', '肆', '伍'];
                                    newOptions[activeOptionIndex].categories.push({
                                        ...EmptyCategory,
                                        id: crypto.randomUUID(),
                                        code: codes[newOptions[activeOptionIndex].categories.length] || 'N',
                                        items: []
                                    });
                                    setFormData({ ...formData, options: newOptions });
                                }}
                                className="w-full py-3 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 font-bold hover:border-orange-500 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> 新增工程分類
                            </button>
                        </div>
                    </div>

                    {/* 條款與備註設定 */}
                    <div className="bg-stone-50 rounded-xl p-6 border border-stone-200 space-y-4">
                        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                            <FileText size={20} className="text-stone-500" />
                            條款與備註設定
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-stone-500">付款方式</label>
                                    <input
                                        type="text"
                                        value={formData.terms?.paymentTerms || ''}
                                        onChange={(e) => setFormData({ ...formData, terms: { ...formData.terms, paymentTerms: e.target.value } })}
                                        className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        placeholder="例如：訂金30%、完工驗收70%"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-stone-500">工期說明</label>
                                    <input
                                        type="text"
                                        value={formData.terms?.workSchedule || ''}
                                        onChange={(e) => setFormData({ ...formData, terms: { ...formData.terms, workSchedule: e.target.value } })}
                                        className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                        placeholder="例如：預計 25 個工作天"
                                    />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-stone-500">有效期限</label>
                                        <input
                                            type="text"
                                            value={formData.terms?.validityPeriod || ''}
                                            onChange={(e) => setFormData({ ...formData, terms: { ...formData.terms, validityPeriod: e.target.value } })}
                                            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            placeholder="例如：30天"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-stone-500">保固年限 (年)</label>
                                        <input
                                            type="number"
                                            value={formData.terms?.warrantyYears || ''}
                                            onChange={(e) => setFormData({ ...formData, terms: { ...formData.terms, warrantyYears: parseFloat(e.target.value) || 0 } })}
                                            className="w-full p-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            placeholder="例如：1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-bold text-stone-500">其他備註</label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowNoteSelector(true)}
                                                className="px-3 py-1 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                                            >
                                                <Database size={14} />
                                                從標準庫選擇
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newNote = prompt('請輸入自訂備註：');
                                                    if (newNote?.trim()) {
                                                        const currentNotes = formData.terms?.otherNotes || [];
                                                        setFormData({
                                                            ...formData,
                                                            terms: {
                                                                ...formData.terms,
                                                                otherNotes: [...currentNotes, newNote.trim()]
                                                            }
                                                        });
                                                    }
                                                }}
                                                className="px-3 py-1 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                                            >
                                                <Plus size={14} />
                                                自訂備註
                                            </button>
                                        </div>
                                    </div>
                                    {formData.terms?.otherNotes && formData.terms.otherNotes.length > 0 ? (
                                        <div className="space-y-2 max-h-60 overflow-y-auto border border-stone-200 rounded-lg p-3 bg-stone-50">
                                            {formData.terms.otherNotes.map((note, index) => (
                                                <div key={index} className="flex items-start gap-2 bg-white p-3 rounded-lg border border-stone-200">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </span>
                                                    <p className="flex-1 text-sm text-stone-700">{note}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newNotes = formData.terms?.otherNotes?.filter((_, i) => i !== index) || [];
                                                            setFormData({
                                                                ...formData,
                                                                terms: {
                                                                    ...formData.terms,
                                                                    otherNotes: newNotes.length > 0 ? newNotes : undefined
                                                                }
                                                            });
                                                        }}
                                                        className="flex-shrink-0 p-1 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="刪除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 border-2 border-dashed border-stone-200 rounded-lg text-stone-400 text-xs">
                                            點擊上方按鈕添加備註
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 總計摘要 */}
                    <div className="flex justify-end">
                        <div className="w-80 bg-stone-800 text-white rounded-xl p-6 shadow-xl">
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-stone-400">
                                    <span>項目小計</span>
                                    <span>${currentOption.summary.subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-400">
                                    <span>工安管理費 ({currentOption.summary.managementFeeRate}%)</span>
                                    <span>${currentOption.summary.managementFee.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-stone-700 my-2 pt-2 flex justify-between font-bold">
                                    <span>未稅金額</span>
                                    <span>${currentOption.summary.beforeTaxAmount.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-stone-400">
                                    <span>營業稅 ({currentOption.summary.taxRate}%)</span>
                                    <span>${currentOption.summary.tax.toLocaleString()}</span>
                                </div>
                                <div className="border-t border-stone-600 my-2 pt-3 flex justify-between text-xl font-black text-orange-400">
                                    <span>總計金額</span>
                                    <span>${currentOption.summary.totalAmount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Smart Selector Modal */}
            {
                showAISelector && (
                    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-6 border-b border-indigo-100 flex justify-between items-center bg-gradient-to-r from-violet-50 to-indigo-50">
                                <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                                    <Sparkles className="text-indigo-600" />
                                    AI 智慧選單
                                </h3>
                                <button
                                    onClick={() => setShowAISelector(false)}
                                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-indigo-400" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {!aiResults.length ? (
                                    <div className="space-y-4">
                                        <div className="bg-indigo-50 p-4 rounded-xl text-indigo-800 text-sm leading-relaxed">
                                            <p className="font-bold flex items-center gap-2 mb-1">
                                                <Bot size={16} /> AI 助理
                                            </p>
                                            請告訴我您需要施作的工程內容，我會自動為您從資料庫中挑選合適的工項。<br />
                                            例如：「浴室防水重做，包含拆除磁磚和更換衛浴設備」
                                        </div>
                                        <div className="relative">
                                            <textarea
                                                value={aiDescription}
                                                onChange={(e) => setAiDescription(e.target.value)}
                                                placeholder="請輸入工程描述，或點擊右下角麥克風用語音輸入..."
                                                className="w-full h-32 p-4 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-stone-800 text-lg pr-12"
                                                autoFocus
                                            />
                                            <button
                                                onClick={startListening}
                                                className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}
                                                title="語音輸入"
                                            >
                                                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                                            </button>
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={handleAIAnalysis}
                                                disabled={aiLoading || !aiDescription.trim()}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-indigo-500/30"
                                            >
                                                {aiLoading ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        AI 正在分析工項...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={18} />
                                                        開始智慧分析
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-bold text-stone-700">AI 為您挑選了 {aiResults.length} 個相關工項：</h4>
                                            <button
                                                onClick={() => setAiResults([])}
                                                className="text-sm text-stone-400 hover:text-stone-600"
                                            >
                                                重新輸入
                                            </button>
                                        </div>

                                        <div className="bg-stone-50 rounded-xl p-2 max-h-[40vh] overflow-y-auto border border-stone-200">
                                            {aiResults.map(id => {
                                                // Find item details
                                                let itemDetail = null;
                                                STANDARD_QUOTATION_ITEMS.forEach(cat => {
                                                    const found = cat.items.find(i => i.id === id);
                                                    if (found) itemDetail = found;
                                                });

                                                if (!itemDetail) return null;

                                                return (
                                                    <div key={id} className="p-3 bg-white border border-stone-100 rounded-lg mb-2 flex justify-between items-center shadow-sm">
                                                        <div className="flex-1">
                                                            <div className="font-bold text-stone-800">{(itemDetail as any).name}</div>
                                                            <div className="text-xs text-stone-500">單位: {(itemDetail as any).unit} | 預算: ${(itemDetail as any).defaultPrice}</div>
                                                        </div>
                                                        <Check size={18} className="text-green-500" />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button
                                                onClick={() => setShowAISelector(false)}
                                                className="flex-1 py-3 text-stone-500 font-bold hover:bg-stone-100 rounded-xl transition-colors"
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={handleApplyAIResults}
                                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg"
                                            >
                                                確認並帶入選單
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Item Selector Modal */}
            {
                showItemSelector && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                                    <Database className="text-stone-600" />
                                    標準工項資料庫
                                </h3>
                                <button
                                    onClick={() => setShowItemSelector(false)}
                                    className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                                >
                                    <X size={24} className="text-stone-500" />
                                </button>
                            </div>

                            <div className="flex flex-1 overflow-hidden">
                                {/* Sidebar: Categories */}
                                <div className="w-64 bg-stone-50 border-r border-stone-200 overflow-y-auto p-4 space-y-2">
                                    <button
                                        onClick={() => setActiveCategoryFilter('all')}
                                        className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${activeCategoryFilter === 'all'
                                            ? 'bg-orange-100 text-orange-700 shadow-sm'
                                            : 'text-stone-600 hover:bg-stone-100'
                                            }`}
                                    >
                                        全部工項
                                    </button>
                                    {STANDARD_QUOTATION_ITEMS.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategoryFilter(cat.id)}
                                            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between ${activeCategoryFilter === cat.id
                                                ? 'bg-orange-100 text-orange-700 shadow-sm'
                                                : 'text-stone-600 hover:bg-stone-100'
                                                }`}
                                        >
                                            <span>{cat.name}</span>
                                            <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-stone-200 text-stone-400">
                                                {cat.items.length}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Main: Items Grid */}
                                <div className="flex-1 overflow-y-auto p-6 bg-white">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {STANDARD_QUOTATION_ITEMS
                                            .filter(cat => activeCategoryFilter === 'all' || cat.id === activeCategoryFilter)
                                            .map(cat => (
                                                cat.items.map(item => {
                                                    const isSelected = selectedStandardItems.some(i => i.id === item.id);
                                                    return (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => toggleStandardItemSelection(item)}
                                                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md relative group ${isSelected
                                                                ? 'border-orange-500 bg-orange-50'
                                                                : 'border-stone-100 hover:border-orange-200 bg-white'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className={`font-bold text-lg ${isSelected ? 'text-orange-900' : 'text-stone-800'}`}>
                                                                    {item.name}
                                                                </span>
                                                                {isSelected && (
                                                                    <div className="bg-orange-500 text-white p-1 rounded-full">
                                                                        <Check size={14} />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-4 text-sm text-stone-500">
                                                                <span className="bg-stone-100 px-2 py-0.5 rounded text-xs font-medium">
                                                                    {cat.name}
                                                                </span>
                                                                <span>單位: {item.unit}</span>
                                                                <span className="font-bold text-stone-700">${item.defaultPrice.toLocaleString()}</span>
                                                            </div>
                                                            {item.notes && (
                                                                <div className="mt-2 text-xs text-stone-400">
                                                                    備註: {item.notes}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
                                <div className="text-stone-600 font-medium">
                                    已選擇 <span className="font-bold text-orange-600">{selectedStandardItems.length}</span> 個項目
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setShowItemSelector(false)}
                                        className="px-6 py-2.5 rounded-xl font-bold text-stone-500 hover:bg-stone-200 transition-colors"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={handleImportItems}
                                        disabled={selectedStandardItems.length === 0}
                                        className="px-6 py-2.5 rounded-xl font-bold text-white bg-orange-600 hover:bg-orange-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Plus size={18} />
                                        加入報價單
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
            {/* Template Selector Modal */}
            {
                showTemplateSelector && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-stone-50">
                                <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                                    <Copy className="text-stone-600" />
                                    選擇報價範本
                                    {loadingPresets && <span className="text-sm font-normal text-orange-600 animate-pulse">(更新中...)</span>}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={refreshPresets}
                                        className="p-2 hover:bg-stone-200 rounded-full transition-colors text-stone-500"
                                        title="重新同步 Google Sheet"
                                    >
                                        <Database size={20} />
                                    </button>
                                    <button
                                        onClick={() => setShowTemplateSelector(false)}
                                        className="p-2 hover:bg-stone-200 rounded-full transition-colors"
                                    >
                                        <X size={24} className="text-stone-500" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 overflow-y-auto bg-stone-50 grid gap-4">
                                {presets.map(preset => {
                                    if (!preset) return null;
                                    return (
                                        <button
                                            key={preset.id}
                                            onClick={() => handleApplyTemplate(preset)}
                                            className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:shadow-md hover:border-orange-300 hover:ring-2 hover:ring-orange-100 transition-all text-left group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-lg font-bold text-stone-800 group-hover:text-orange-700 transition-colors">
                                                    {preset.name}
                                                </h4>
                                                <div className="bg-stone-100 text-stone-500 text-xs px-2 py-1 rounded-full group-hover:bg-orange-100 group-hover:text-orange-600">
                                                    {preset.categories?.length || 0} 個分類
                                                </div>
                                            </div>
                                            <p className="text-stone-500 text-sm mb-4">
                                                {preset.description}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {preset.categories?.slice(0, 3).map((cat, idx) => (
                                                    <span key={idx} className="text-xs bg-stone-50 text-stone-400 border border-stone-100 px-2 py-0.5 rounded">
                                                        分類 {cat.code}
                                                    </span>
                                                ))}
                                                {(preset.categories?.length || 0) > 3 && (
                                                    <span className="text-xs text-stone-400 px-1">...</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="p-4 border-t border-stone-200 bg-stone-50 text-center text-sm text-stone-500">
                                選擇範本將會新增一個新的報價方案
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Standard Notes Selector Modal */}
            {
                showNoteSelector && (
                    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                            <div className="p-6 border-b border-stone-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-blue-700">
                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                    <Database className="text-white" />
                                    選擇標準備註
                                </h3>
                                <button
                                    onClick={() => setShowNoteSelector(false)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="space-y-6">
                                    {getCategories().map(category => {
                                        const notes = STANDARD_NOTES.filter(n => n.category === category);
                                        return (
                                            <div key={category} className="space-y-3">
                                                <h4 className="text-sm font-bold text-stone-700 bg-stone-100 px-3 py-2 rounded-lg">
                                                    {category}
                                                </h4>
                                                <div className="space-y-2 pl-4">
                                                    {notes.map(note => {
                                                        const isSelected = formData.terms?.otherNotes?.includes(note.content) || false;
                                                        return (
                                                            <button
                                                                key={note.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const currentNotes = formData.terms?.otherNotes || [];
                                                                    if (isSelected) {
                                                                        // Remove
                                                                        const newNotes = currentNotes.filter(n => n !== note.content);
                                                                        setFormData({
                                                                            ...formData,
                                                                            terms: {
                                                                                ...formData.terms,
                                                                                otherNotes: newNotes.length > 0 ? newNotes : undefined
                                                                            }
                                                                        });
                                                                    } else {
                                                                        // Add
                                                                        setFormData({
                                                                            ...formData,
                                                                            terms: {
                                                                                ...formData.terms,
                                                                                otherNotes: [...currentNotes, note.content]
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:shadow-md ${isSelected
                                                                    ? 'border-blue-500 bg-blue-50'
                                                                    : 'border-stone-200 bg-white hover:border-blue-300'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${isSelected
                                                                        ? 'border-blue-500 bg-blue-500'
                                                                        : 'border-stone-300'
                                                                        }`}>
                                                                        {isSelected && <Check size={14} className="text-white" />}
                                                                    </div>
                                                                    <p className="flex-1 text-sm text-stone-700">{note.content}</p>
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="p-6 border-t border-stone-200 bg-stone-50 flex justify-between items-center">
                                <div className="text-stone-600 font-medium">
                                    已選擇 <span className="font-bold text-blue-600">{formData.terms?.otherNotes?.length || 0}</span> 條備註
                                </div>
                                <button
                                    onClick={() => setShowNoteSelector(false)}
                                    className="px-6 py-2.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg"
                                >
                                    完成
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default QuotationEditor;
