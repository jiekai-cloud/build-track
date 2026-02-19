import React, { useRef, useState } from 'react';
import { ImageIcon, Sparkles, Layers, Upload, Zap, Trash2 } from 'lucide-react';
import { ProjectFile } from '../../types';
import { cloudFileService } from '../../services/cloudFileService';
import { useProject } from '../../contexts/ProjectContext';

const ProjectGallery: React.FC = () => {
    const {
        project,
        isReadOnly,
        onUpdateFiles,
        onImageClick,
        photoCategories,
        currentPhotoFilter,
        onFilterChange
    } = useProject();
    const [isUploading, setIsUploading] = useState(false);
    const [selectedUploadCategory, setSelectedUploadCategory] = useState('survey');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !onUpdateFiles) return;

        setIsUploading(true);
        const files = Array.from(e.target.files);
        const newFiles: ProjectFile[] = [];

        try {
            for (const file of files) {
                const result = await cloudFileService.uploadFile(file);
                if (result) {
                    newFiles.push({
                        id: result.id,
                        url: result.url,
                        name: file.name,
                        type: file.type.startsWith('video/') ? 'video' : 'image',
                        category: selectedUploadCategory,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: 'User', // Needs user info, but let's default or pass it? For now simplified.
                        size: file.size
                    });
                }
            }
            onUpdateFiles([...(project.files || []), ...newFiles]);
        } catch (err) {
            console.error('上傳失敗:', err);
            alert('上傳失敗，請稍後再試');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {!isReadOnly && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-50 p-6 rounded-[2rem] border border-stone-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isUploading ? 'bg-orange-100 text-orange-600 animate-spin' : 'bg-stone-200 text-stone-500 shadow-inner'}`}>
                            {isUploading ? <Sparkles size={20} /> : <ImageIcon size={20} />}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-stone-900 uppercase tracking-widest leading-none mb-1">{isUploading ? '正在同步至雲端...' : '專案媒體庫'}</p>
                            <p className="text-[10px] text-stone-400 font-bold">{isUploading ? '正在建立加密連結並上傳檔案' : `目前共有 ${(project.files || []).length} 個檔案`}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <div className="relative">
                            <select
                                value={selectedUploadCategory}
                                onChange={(e) => setSelectedUploadCategory(e.target.value)}
                                className="appearance-none bg-white border border-stone-200 rounded-xl px-4 py-2 pr-10 text-[10px] font-black text-stone-700 outline-none focus:ring-2 focus:ring-orange-500/20 transition-all cursor-pointer"
                            >
                                {photoCategories.filter(c => c.id !== 'all').map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                <Layers size={12} />
                            </div>
                        </div>

                        <input type="file" multiple accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${isUploading ? 'bg-stone-100 text-stone-400' : 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-100'}`}
                        >
                            {isUploading ? <Zap size={14} className="animate-pulse" /> : <Upload size={14} />}
                            {isUploading ? '正在上傳...' : '上傳照片'}
                        </button>
                    </div>
                </div>
            )}

            {/* Photo Filter Tabs */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                {photoCategories.map(cat => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => onFilterChange(cat.id)}
                            className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 border ${currentPhotoFilter === cat.id
                                ? 'bg-stone-900 text-white border-stone-900 shadow-lg'
                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'
                                }`}
                        >
                            <Icon size={14} />
                            {cat.label}
                            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[8px] ${currentPhotoFilter === cat.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-400'}`}>
                                {(cat.id === 'all' ? project.files || [] : (project.files || []).filter(f => f.category === cat.id)).length}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {(project.files || []).filter(f => (f.type === 'image' || f.type === 'video') && (currentPhotoFilter === 'all' || f.category === currentPhotoFilter)).map(file => (
                    <div key={file.id} className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative group border border-stone-200 shadow-sm cursor-zoom-in" onClick={() => onImageClick(file)}>
                        {file.type === 'video' ? (
                            <video src={file.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onMouseOver={e => (e.target as HTMLVideoElement).play()} onMouseOut={e => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }} muted loop />
                        ) : (
                            <img src={file.url} alt={file.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        )}

                        {file.type === 'video' && (
                            <div className="absolute top-2 left-2 bg-stone-900/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-white font-black flex items-center gap-1">
                                <Zap size={8} /> VIDEO
                            </div>
                        )}

                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-[10px] font-bold truncate">{file.name}</p>
                            <p className="text-white/60 text-[9px]">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : '無日期'}</p>
                        </div>
                        {!isReadOnly && onUpdateFiles && (
                            <button onClick={(e) => { e.stopPropagation(); if (confirm('刪除此檔案？')) onUpdateFiles(project.files!.filter(f => f.id !== file.id)); }} className="absolute top-2 right-2 p-1.5 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                ))}
                {!isUploading && (project.files || []).filter(f => (f.type === 'image' || f.type === 'video') && (currentPhotoFilter === 'all' || f.category === currentPhotoFilter)).length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-stone-300 gap-4 opacity-50">
                        <ImageIcon size={48} />
                        <p className="text-[10px] font-black uppercase tracking-widest">照片庫是空的</p>
                    </div>
                )}

                {isUploading && (
                    <div className="aspect-square bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center gap-2 animate-pulse">
                        <Upload size={24} className="text-stone-300" />
                        <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest">同步中...</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectGallery;
