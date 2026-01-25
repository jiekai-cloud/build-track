
import React, { useState, useEffect } from 'react';
import {
    X, ChevronRight, ChevronLeft, Sparkles, LayoutDashboard,
    HardHat, ClipboardCheck, Wallet, Cloud, Zap, CheckCircle2
} from 'lucide-react';

interface TourStep {
    title: string;
    description: string;
    icon: React.ElementType;
    color: string;
    highlightId?: string;
}

const TOUR_STEPS: TourStep[] = [
    {
        title: "歡迎使用生活品質管理系統",
        description: "這是一個專為工程團隊打造的數位化管理平台，結合 AI 技術，讓案場管理、考勤與帳務變得前所未有的簡單。",
        icon: Sparkles,
        color: "from-indigo-600 to-blue-600"
    },
    {
        title: "智慧儀表板",
        description: "在這裡您可以一目瞭然公司的營運狀況、目前進行中的專案，以及重要的人力調度資訊。",
        icon: LayoutDashboard,
        color: "from-blue-600 to-emerald-600",
        highlightId: "nav-dashboard"
    },
    {
        title: "AI 工地助理",
        description: "在專案討論區中，您可以利用 AI 專業優化文字紀錄，或讓 AI 分析現場照片自動識別工項，減少 80% 的打字時間。",
        icon: HardHat,
        color: "from-orange-600 to-rose-600",
        highlightId: "nav-projects"
    },
    {
        title: "一站式考勤與薪資",
        description: "人員可以直接透過手機定位打卡，系統會自動根據出勤紀錄計算薪資，並生成專業的薪資單據。",
        icon: ClipboardCheck,
        color: "from-teal-600 to-emerald-700",
        highlightId: "nav-attendance"
    },
    {
        title: "全方位帳務管理",
        description: "內建發票/收據 AI 辨識功能，快速建立報銷紀錄。並能對專案進行即時盈虧預測，嚴控工程成本。",
        icon: Wallet,
        color: "from-blue-700 to-slate-900",
        highlightId: "nav-analytics"
    },
    {
        title: "雲端自動同步",
        description: "資料會自動同步至 Google Drive，確保手機端與電腦端資料永遠保持最新，不怕檔案遺失。",
        icon: Cloud,
        color: "from-sky-500 to-indigo-500",
        highlightId: "cloud-sync-status"
    },
    {
        title: "準備就緒！",
        description: "現在就開始探索系統的功能，開啟您的工程管理數位轉型之旅吧！",
        icon: Zap,
        color: "from-indigo-600 to-purple-600"
    }
];

interface OnboardingTourProps {
    isOpen: boolean;
    onClose: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setCurrentStep(0);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const step = TOUR_STEPS[currentStep];
    const isLastStep = currentStep === TOUR_STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose}></div>

            {/* Card */}
            <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-stone-100 flex">
                    {TOUR_STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`flex-1 transition-all duration-500 ${i <= currentStep ? 'bg-indigo-600' : ''}`}
                        />
                    ))}
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-xl transition-all z-10"
                >
                    <X size={20} />
                </button>

                {/* Content Section */}
                <div className="p-8 sm:p-12 pt-16">
                    <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-3xl flex items-center justify-center text-white mb-8 shadow-lg transform transition-transform duration-500 hover:rotate-6 sm:mx-auto`}>
                        <step.icon size={40} />
                    </div>

                    <div className="sm:text-center space-y-4">
                        <h2 className="text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
                            {step.title}
                        </h2>
                        <p className="text-stone-500 text-sm sm:text-base font-bold leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    {/* Navigation */}
                    <div className="mt-12 flex items-center justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0}
                            className={`p-4 rounded-2xl flex items-center justify-center transition-all ${currentStep === 0 ? 'text-stone-200' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-900'}`}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div className="flex gap-2">
                            {TOUR_STEPS.map((_, i) => (
                                <div
                                    key={i}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentStep ? 'w-4 bg-indigo-600' : 'bg-stone-200'}`}
                                />
                            ))}
                        </div>

                        <button
                            onClick={handleNext}
                            className={`px-8 py-4 rounded-2xl bg-stone-900 text-white font-black text-sm flex items-center gap-2 hover:bg-indigo-600 hover:scale-105 active:scale-95 transition-all shadow-lg hover:shadow-indigo-200`}
                        >
                            {isLastStep ? '開始使用' : '下一步'}
                            {isLastStep ? <CheckCircle2 size={18} /> : <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>

                {/* Decorative elements */}
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50"></div>
            </div>
        </div>
    );
};

export default OnboardingTour;
