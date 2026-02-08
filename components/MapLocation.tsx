
import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, Loader2, HardHat, Store, Hammer, ExternalLink, Key, X } from 'lucide-react';
import { searchNearbyResources } from '../services/geminiService';

interface MapLocationProps {
    address: string;
    lat?: number;
    lng?: number;
    projectName: string;
}

const MapLocation: React.FC<MapLocationProps> = ({ address, lat = 25.0330, lng = 121.5654, projectName }) => {
    const [nearbyResources, setNearbyResources] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeResourceType, setActiveResourceType] = useState<string | null>(null);
    const [apiKey, setApiKey] = useState<string>('');
    const [showKeySetup, setShowKeySetup] = useState(false);

    useEffect(() => {
        // Priority: localStorage > environment variable
        const storedKey = localStorage.getItem('GOOGLE_MAPS_API_KEY');
        const envKey = (import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) || process.env.GOOGLE_MAPS_API_KEY;

        if (storedKey && storedKey !== 'undefined') {
            setApiKey(storedKey);
        } else if (envKey && envKey !== 'undefined') {
            setApiKey(envKey);
        }
    }, []);

    const handleSearchResources = async (type: string) => {
        setIsSearching(true);
        setActiveResourceType(type);
        try {
            const result = await searchNearbyResources(address, lat, lng, type);
            if (result && result.links) {
                setNearbyResources(result.links);
            }
        } catch (error) {
            console.error("搜尋資源失敗:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSaveApiKey = () => {
        const key = prompt('請輸入您的 Google Maps API 金鑰：\n\n取得方式：\n1. 前往 https://console.cloud.google.com/\n2. 啟用 Maps JavaScript API\n3. 建立 API 金鑰並設定限制');

        if (key && key.trim()) {
            localStorage.setItem('GOOGLE_MAPS_API_KEY', key.trim());
            setApiKey(key.trim());
            setShowKeySetup(false);
        }
    };

    const handleRemoveApiKey = () => {
        if (confirm('確定要移除 Google Maps API 金鑰嗎？')) {
            localStorage.removeItem('GOOGLE_MAPS_API_KEY');
            setApiKey('');
        }
    };

    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    const hasApiKey = apiKey && apiKey !== 'undefined' && apiKey !== '' && apiKey !== 'PLACEHOLDER';

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 地圖預覽區域 */}
            <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-stone-200 shadow-xl group bg-stone-100">
                {hasApiKey ? (
                    <iframe
                        title="project-location"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        style={{ border: 0 }}
                        src={`https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${encodeURIComponent(address)}`}
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-stone-50 to-stone-100">
                        <div className="w-20 h-20 bg-stone-200 rounded-3xl flex items-center justify-center text-stone-400 mb-6 shadow-inner">
                            <MapPin size={40} />
                        </div>
                        <h4 className="text-base font-black text-stone-700 uppercase tracking-widest mb-2">Google Maps 未設定</h4>
                        <p className="text-xs font-medium text-stone-500 max-w-sm leading-relaxed mb-6">
                            請設定 Google Maps API 金鑰以啟用地圖顯示、街景預覽和周邊資源搜尋功能
                        </p>
                        <button
                            onClick={handleSaveApiKey}
                            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-2xl hover:bg-stone-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            <Key size={18} />
                            <span className="text-sm font-bold tracking-wide">設定 API 金鑰</span>
                        </button>
                        <p className="text-[10px] text-stone-400 mt-4 max-w-xs">
                            金鑰將安全地儲存在您的瀏覽器中，不會上傳到任何伺服器
                        </p>
                    </div>
                )}

                <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-white/50 shadow-lg pointer-events-auto">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={16} className="text-rose-500" />
                            <span className="text-xs font-black text-stone-900">{projectName}</span>
                        </div>
                        <p className="text-[10px] font-bold text-stone-500">{address}</p>
                    </div>

                    {hasApiKey && (
                        <button
                            onClick={handleRemoveApiKey}
                            className="bg-red-500/90 backdrop-blur-md text-white p-3 rounded-2xl shadow-lg hover:bg-red-600 transition-all pointer-events-auto group"
                            title="移除 API 金鑰"
                        >
                            <X size={16} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    )}
                </div>

                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-6 right-6 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-2 hover:scale-105 transition-all active:scale-95 pointer-events-auto group"
                >
                    <Navigation size={18} className="group-hover:animate-pulse" />
                    <span className="text-xs font-black tracking-widest">開始導航</span>
                </a>
            </div>

            {/* 附近資源搜尋 */}
            <div className="bg-stone-50 p-6 rounded-[2.5rem] border border-stone-200 shadow-inner">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h4 className="text-sm font-black text-stone-900 uppercase tracking-widest">案場周邊資源</h4>
                        <p className="text-[10px] font-bold text-stone-400 mt-1 uppercase tracking-tight">利用 AI 搜尋案場附近物資支援</p>
                    </div>
                    <Search size={20} className="text-stone-300" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { id: 'hardware', label: '五金材料', icon: Hammer },
                        { id: 'hardware_store', label: '水電材料', icon: Store },
                        { id: 'contractor', label: '臨時工班', icon: HardHat },
                        { id: 'parking', label: '附近車位', icon: MapPin },
                    ].map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleSearchResources(type.label)}
                            disabled={isSearching}
                            className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group ${activeResourceType === type.label
                                ? 'bg-stone-900 border-stone-900 text-white shadow-lg'
                                : 'bg-white border-stone-100 text-stone-600 hover:border-stone-300 hover:shadow-md'
                                }`}
                        >
                            <type.icon size={20} className={`${activeResourceType === type.label ? 'text-white' : 'text-stone-400 group-hover:text-stone-900'} transition-colors`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                        </button>
                    ))}
                </div>

                {isSearching && (
                    <div className="mt-8 flex flex-col items-center justify-center py-10 gap-4 animate-in fade-in">
                        <Loader2 size={32} className="text-stone-400 animate-spin" />
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] animate-pulse">正在透過 Gemini 深度檢索周邊資訊...</p>
                    </div>
                )}

                {!isSearching && nearbyResources.length > 0 && (
                    <div className="mt-8 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <h5 className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-4 ml-1">搜尋結果推薦</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {nearbyResources.map((resource, i) => (
                                <a
                                    key={i}
                                    href={resource.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white p-4 rounded-2xl border border-stone-200 flex items-center justify-between group hover:border-stone-900 transition-all shadow-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center">
                                            <MapPin size={14} className="text-stone-400 group-hover:text-stone-900" />
                                        </div>
                                        <span className="text-xs font-bold text-stone-800">{resource.title}</span>
                                    </div>
                                    <ExternalLink size={14} className="text-stone-300 group-hover:text-stone-900" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapLocation;
