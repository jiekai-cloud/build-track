import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Layers, Trash2 } from 'lucide-react';
import { ProjectFile } from '../types';

interface ImageLightboxProps {
    image: ProjectFile;
    onClose: () => void;
    onNext: (e?: React.MouseEvent) => void;
    onPrev: (e?: React.MouseEvent) => void;
    hasNext: boolean;
    hasPrev: boolean;
    currentPosition: number;
    totalImages: number;
    isReadOnly: boolean;
    onUpdateFiles?: (files: ProjectFile[]) => void;
    allFiles: ProjectFile[]; // Needed for updating files
    photoCategories: { id: string, label: string }[];
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({
    image,
    onClose,
    onNext,
    onPrev,
    hasNext,
    hasPrev,
    currentPosition,
    totalImages,
    isReadOnly,
    onUpdateFiles,
    allFiles,
    photoCategories
}) => {
    const [zoomLevel, setZoomLevel] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0 });
    const lastPinchDistRef = useRef<number | null>(null);

    // Reset zoom on image change
    useEffect(() => {
        setZoomLevel(1);
        setPosition({ x: 0, y: 0 });
    }, [image.id, image.url]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' && hasNext) onNext();
            if (e.key === 'ArrowLeft' && hasPrev) onPrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasNext, hasPrev, onNext, onPrev, onClose]);

    const handleZoomIn = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoomLevel(prev => Math.min(prev + 0.5, 3));
    };

    const handleZoomOut = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setZoomLevel(prev => {
            const newZoom = Math.max(prev - 0.5, 1);
            if (newZoom === 1) setPosition({ x: 0, y: 0 });
            return newZoom;
        });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoomLevel > 1) {
            e.preventDefault();
            setIsDragging(true);
            dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoomLevel > 1) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && zoomLevel > 1) {
            const touch = e.touches[0];
            setIsDragging(true);
            dragStartRef.current = { x: touch.clientX - position.x, y: touch.clientY - position.y };
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            lastPinchDistRef.current = dist;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging && zoomLevel > 1) {
            const touch = e.touches[0];
            setPosition({
                x: touch.clientX - dragStartRef.current.x,
                y: touch.clientY - dragStartRef.current.y
            });
        } else if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            if (lastPinchDistRef.current !== null) {
                const delta = dist - lastPinchDistRef.current;
                const ZOOM_SPEED = 0.01;
                setZoomLevel(prev => {
                    const newZoom = Math.min(Math.max(prev + delta * ZOOM_SPEED, 1), 5);
                    if (newZoom === 1) setPosition({ x: 0, y: 0 });
                    return newZoom;
                });
            }
            lastPinchDistRef.current = dist;
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        lastPinchDistRef.current = null;
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-[110] bg-white/10 p-3 rounded-full hover:bg-white/20">
                <X size={24} />
            </button>

            {/* Navigation Buttons */}
            {hasPrev && (
                <button
                    onClick={onPrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-[110]"
                >
                    <ChevronLeft size={40} />
                </button>
            )}

            {hasNext && (
                <button
                    onClick={onNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white hover:bg-white/10 p-4 rounded-full transition-all z-[110]"
                >
                    <ChevronRight size={40} />
                </button>
            )}

            {/* Main Content */}
            <div
                className="relative w-full h-full flex flex-col items-center justify-center p-4 lg:p-12 animate-in zoom-in-95 duration-300"
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <div className="flex-1 w-full flex items-center justify-center min-h-0 overflow-hidden relative">
                    {image.type === 'video' ? (
                        <video src={image.url} className="max-w-full max-h-full rounded-2xl shadow-2xl" controls autoPlay />
                    ) : (
                        <div
                            className="relative transition-transform duration-75 ease-out will-change-transform"
                            style={{
                                transform: `scale(${zoomLevel}) translate3d(${position.x / zoomLevel}px, ${position.y / zoomLevel}px, 0)`,
                                cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                            }}
                            onMouseDown={handleMouseDown}
                            onMouseMove={handleMouseMove}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                        >
                            <img
                                src={image.url}
                                alt={image.name}
                                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl pointer-events-none select-none"
                                draggable={false}
                            />
                        </div>
                    )}
                </div>

                {/* Controls Toolbar */}
                <div className="mt-6 flex flex-col items-center gap-4 z-[110]">
                    {/* Zoom Controls (Images Only) */}
                    {image.type !== 'video' && (
                        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                            <button onClick={handleZoomOut} className="text-white/70 hover:text-white transition-colors disabled:opacity-30" disabled={zoomLevel <= 1}>
                                <ZoomOut size={18} />
                            </button>
                            <span className="text-xs font-black text-white w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
                            <button onClick={handleZoomIn} className="text-white/70 hover:text-white transition-colors disabled:opacity-30" disabled={zoomLevel >= 3}>
                                <ZoomIn size={18} />
                            </button>
                        </div>
                    )}

                    {/* Image Info */}
                    <div className="text-center space-y-3">
                        <h3 className="text-white text-lg font-black tracking-tight drop-shadow-md">{image.name}</h3>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">
                                {currentPosition + 1} / {totalImages}
                            </p>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">
                                {image.uploadedAt ? new Date(image.uploadedAt).toLocaleString() : '無日期'}
                            </p>
                            <span className="w-1 h-1 bg-white/20 rounded-full" />
                            {!isReadOnly && onUpdateFiles && image.category !== '施工範圍圖' ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative group/cat">
                                        <select
                                            value={image.category}
                                            onChange={(e) => {
                                                const newCategory = e.target.value;
                                                const updatedFiles = allFiles.map(f => f.id === image.id ? { ...f, category: newCategory } : f);
                                                onUpdateFiles(updatedFiles);
                                                // Note: Does not update local props immediately, parent must re-render
                                            }}
                                            className="appearance-none bg-stone-800 text-orange-500 text-[10px] font-black uppercase tracking-widest border border-stone-700 rounded-xl px-4 py-1.5 pr-8 outline-none cursor-pointer hover:bg-stone-700 transition-all"
                                        >
                                            {photoCategories.filter(c => c.id !== 'all').map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-orange-500/50">
                                            <Layers size={10} />
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (confirm('確定要從雲端刪除這張照片嗎？')) {
                                                onUpdateFiles(allFiles.filter(f => f.id !== image.id));
                                                onClose(); // Close lightbox on delete
                                            }
                                        }}
                                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"
                                        title="刪除"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">
                                    {image.category === '施工範圍圖' ? '施工範圍圖' : (photoCategories.find(c => c.id === image.category)?.label || '未分類')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageLightbox;
