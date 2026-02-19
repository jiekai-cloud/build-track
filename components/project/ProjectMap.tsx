import React, { useState } from 'react';
import { MapPin, Loader2, ExternalLink } from 'lucide-react';
import MapLocation from '../MapLocation';
import { searchNearbyResources } from '../../services/geminiService';
import { useProject } from '../../contexts/ProjectContext';

const ProjectMap: React.FC = () => {
    const { project, isReadOnly } = useProject();
    const [isSearchingNearby, setIsSearchingNearby] = useState(false);
    const [nearbyResults, setNearbyResults] = useState<{ text: string, links: { title: string, uri: string }[] } | null>(null);

    const handleNearbySearch = async (resourceType: string) => {
        if (!project.location?.lat || !project.location?.lng) {
            alert('專案尚未設定地理座標，無法搜尋附近資源。');
            return;
        }

        setIsSearchingNearby(true);
        try {
            const address = project.location?.address || project.client || '未知地點';
            const results = await searchNearbyResources(address, project.location.lat, project.location.lng, resourceType);
            setNearbyResults(results);
        } catch (error) {
            console.error(error);
            alert('搜尋失敗，請稍後再試。');
        } finally {
            setIsSearchingNearby(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-[500px]">
            {/* Map View */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-sm h-full flex flex-col">
                <div className="flex-1 min-h-[300px] relative">
                    <MapLocation
                        address={project.location?.address || project.client || ''}
                        lat={project.location?.lat}
                        lng={project.location?.lng}
                        projectName={project.name}
                    />
                </div>
            </div>

            {/* Nearby Resources Panel */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 space-y-6 shadow-sm overflow-y-auto">
                <div className="space-y-4">
                    <h3 className="font-black text-stone-900 uppercase text-xs flex items-center gap-2">
                        <MapPin size={16} className="text-blue-600" />
                        地理定位與資源
                    </h3>

                    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 flex items-start gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-1">PROJECT LOCATION</p>
                            <p className="text-sm font-bold text-stone-800">{project.location?.address || project.client || '未設定地址'}</p>
                            {project.location?.lat && project.location?.lng && (
                                <p className="text-[10px] text-stone-500 mt-1 font-mono">
                                    {project.location.lat.toFixed(6)}, {project.location.lng.toFixed(6)}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-stone-100">
                        <h4 className="text-[9px] font-black text-stone-400 uppercase tracking-widest">附近資源搜尋 (AI Suggestion)</h4>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => handleNearbySearch('五金行')}
                                disabled={isSearchingNearby || isReadOnly}
                                className="bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-[10px] font-black border border-blue-100 disabled:opacity-50 flex items-center gap-2 hover:bg-blue-100 transition-colors"
                            >
                                {isSearchingNearby ? <Loader2 size={12} className="animate-spin" /> : '五金行'}
                            </button>
                            <button
                                onClick={() => handleNearbySearch('建材行')}
                                disabled={isSearchingNearby || isReadOnly}
                                className="bg-amber-50 text-amber-600 px-3 py-2 rounded-xl text-[10px] font-black border border-amber-100 disabled:opacity-50 flex items-center gap-2 hover:bg-amber-100 transition-colors"
                            >
                                {isSearchingNearby ? <Loader2 size={12} className="animate-spin" /> : '建材行'}
                            </button>
                            <button
                                onClick={() => handleNearbySearch('餐飲店')}
                                disabled={isSearchingNearby || isReadOnly}
                                className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl text-[10px] font-black border border-emerald-100 disabled:opacity-50 flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                            >
                                {isSearchingNearby ? <Loader2 size={12} className="animate-spin" /> : '餐飲店'}
                            </button>
                        </div>

                        {nearbyResults && (
                            <div className="mt-4 p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3 animate-in fade-in slide-in-from-top-2">
                                <p className="text-[11px] font-medium text-stone-700 leading-relaxed whitespace-pre-wrap">{nearbyResults.text}</p>
                                <div className="flex flex-wrap gap-2">
                                    {nearbyResults.links.map((link, i) => (
                                        <a
                                            key={i}
                                            href={link.uri}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
                                        >
                                            <ExternalLink size={10} /> {link.title}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectMap;
