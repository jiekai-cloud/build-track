
import React from 'react';
import {
    X, Bell, Briefcase, Users, User, Shield,
    MessageSquare, Clock, ArrowRight, Zap, Target
} from 'lucide-react';
import { ActivityLog } from '../types';

interface NotificationPanelProps {
    logs: ActivityLog[];
    onClose: () => void;
    onProjectClick: (projectId: string) => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ logs, onClose, onProjectClick }) => {
    const getIcon = (type: ActivityLog['type']) => {
        switch (type) {
            case 'project': return <Briefcase size={14} />;
            case 'customer': return <Users size={14} />;
            case 'team': return <User size={14} />;
            default: return <Shield size={14} />;
        }
    };

    const getBgColor = (type: ActivityLog['type']) => {
        switch (type) {
            case 'project': return 'bg-blue-50 text-blue-600';
            case 'customer': return 'bg-purple-50 text-purple-600';
            case 'team': return 'bg-emerald-50 text-emerald-600';
            default: return 'bg-stone-50 text-stone-600';
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('zh-TW', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-stone-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">活動中心</h3>
                        <p className="text-[10px] text-stone-400 font-bold">即時追蹤團隊協作紀錄</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-stone-50 rounded-xl text-stone-400 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {logs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40 py-20">
                        <Zap size={48} className="text-stone-300" />
                        <p className="text-xs font-black text-stone-500 uppercase tracking-widest">尚無最新活動</p>
                    </div>
                ) : (
                    logs.map((log) => (
                        <div
                            key={log.id}
                            className="group relative flex gap-4 animate-in fade-in slide-in-from-bottom-2"
                        >
                            <div className="flex flex-col items-center">
                                <img
                                    src={log.userAvatar}
                                    alt={log.userName}
                                    className="w-10 h-10 rounded-2xl border-2 border-white shadow-md z-10"
                                />
                                <div className="w-0.5 flex-1 bg-stone-100 group-last:hidden my-2"></div>
                            </div>

                            <div className="flex-1 pb-6 group-last:pb-0">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-black text-stone-900">{log.userName}</span>
                                    <span className="text-[9px] font-bold text-stone-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {formatTime(log.timestamp)}
                                    </span>
                                </div>

                                <div className="bg-stone-50 group-hover:bg-stone-100/50 p-4 rounded-[1.5rem] transition-all border border-transparent group-hover:border-stone-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className={`p-1.5 rounded-lg ${getBgColor(log.type)}`}>
                                            {getIcon(log.type)}
                                        </div>
                                        <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">
                                            {log.action}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-bold text-stone-900 truncate max-w-[180px]">
                                            {log.targetName}
                                        </p>
                                        {log.type === 'project' && (
                                            <button
                                                onClick={() => onProjectClick(log.targetId)}
                                                className="p-1.5 hover:bg-white rounded-lg text-orange-600 shadow-sm transition-all active:scale-90"
                                            >
                                                <ArrowRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 bg-stone-50 border-t border-stone-100">
                <div className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Target size={16} />
                    </div>
                    <p className="text-[10px] font-black text-stone-500 leading-tight">
                        系統會自動保存最近 50 筆異動資訊，確保團隊溝通無礙。
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationPanel;
