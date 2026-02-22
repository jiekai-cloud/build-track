import React from 'react';
import { Menu, LogOut, CloudOff, RefreshCw, AlertCircle, CheckCircle, Bell, Sparkles } from 'lucide-react';
import { User } from '../types';
import { SYSTEM_VERSION } from '../constants';

interface HeaderProps {
    user: User;
    isSidebarOpen: boolean;
    onMenuClick: () => void;
    cloudError: string | null;
    isCloudConnected: boolean;
    isSyncing: boolean;
    onConnectCloud: () => void;
    onNotificationClick: () => void;
    activityLogsLength: number;
    onAISettingsClick: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({
    user,
    onMenuClick,
    cloudError,
    isCloudConnected,
    isSyncing,
    onConnectCloud,
    onNotificationClick,
    activityLogsLength,
    onAISettingsClick,
    onLogout
}) => {
    return (
        <header className="h-16 shrink-0 bg-white/80 backdrop-blur-xl border-b border-stone-200 px-4 lg:px-8 flex items-center justify-between no-print z-40">
            <div className="flex items-center gap-2 sm:gap-4">
                <button onClick={onMenuClick} className="lg:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg">
                    <Menu size={24} />
                </button>

                <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-2xl shadow-lg ${user.role === 'Guest' ? 'bg-stone-900 text-orange-400' : 'bg-stone-900 text-white'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${user.role === 'Guest' ? 'bg-orange-500' : 'bg-emerald-400'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{user.role === 'Guest' ? '訪客唯讀' : `${SYSTEM_VERSION} SYNC-GUARD`}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest sm:hidden">{SYSTEM_VERSION}</span>
                    </div>

                    {user.role !== 'Guest' && (
                        <div className="flex items-center">
                            {cloudError ? (
                                <button onClick={onConnectCloud} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200 animate-pulse">
                                    <AlertCircle size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.1em] hidden sm:inline">{cloudError}</span>
                                </button>
                            ) : isCloudConnected ? (
                                <div className="flex items-center gap-1 sm:gap-2.5 px-2 sm:px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 shadow-sm">
                                    <div className="relative">
                                        <CheckCircle size={14} className="text-emerald-500" />
                                        {isSyncing && <RefreshCw size={10} className="absolute -top-1 -right-1 text-emerald-600 animate-spin bg-white rounded-full p-0.5" />}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none hidden sm:inline">{isSyncing ? '同步中...' : '雲端同步就緒'}</span>
                                    </div>
                                </div>
                            ) : (
                                <button onClick={onConnectCloud} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 bg-stone-100 text-stone-400 rounded-2xl border border-stone-200 hover:text-orange-600">
                                    <CloudOff size={14} />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <button
                    onClick={onNotificationClick}
                    className="relative p-2.5 bg-white text-stone-900 rounded-2xl border border-stone-200 shadow-sm hover:ring-2 hover:ring-orange-100 hover:border-orange-200 transition-all active:scale-95 flex items-center justify-center shrink-0"
                >
                    <Bell size={18} className="text-stone-600" />
                    {activityLogsLength > 0 && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-orange-600 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>

                <button
                    onClick={onAISettingsClick}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all hover:scale-105 active:scale-95 bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm"
                >
                    <Sparkles size={12} className="text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        AI 智慧服務已啟用
                    </span>
                </button>

                <button onClick={onLogout} className="p-2 text-stone-400 hover:text-rose-600 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
};

export default Header;

