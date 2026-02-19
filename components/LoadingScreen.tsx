import React from 'react';

interface LoadingScreenProps {
    onSkip: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onSkip }) => {
    return (
        <div className="h-screen w-screen bg-[#1c1917] flex flex-col items-center justify-center space-y-8 animate-in fade-in">
            <div className="relative">
                <img src="./pwa-icon.png" alt="Loading" className="w-24 h-24 object-contain animate-pulse" />
            </div>
            <div className="text-center space-y-3">
                <h2 className="text-white font-black text-2xl uppercase tracking-[0.2em]">Quality of Life</h2>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-bounce"></span>
                    <p className="text-stone-500 text-[10px] font-black uppercase tracking-[0.2em]">Development Corporation</p>
                </div>
                <button
                    onClick={onSkip}
                    className="mt-4 text-stone-600 text-[10px] font-bold underline underline-offset-4 hover:text-orange-500 opacity-50 hover:opacity-100 transition-all"
                >
                    直接進入系統 (跳過等待)
                </button>
            </div>
        </div>
    );
};

export default LoadingScreen;
