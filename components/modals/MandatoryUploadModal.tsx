import React, { useRef, useState } from 'react';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import { ProjectStatus } from '../../types';
import { cloudFileService } from '../../services/cloudFileService';
import { useProject } from '../../contexts/ProjectContext';

interface MandatoryUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    pendingStatus: ProjectStatus | null;
}

const MandatoryUploadModal: React.FC<MandatoryUploadModalProps> = ({
    isOpen,
    onClose,
    pendingStatus
}) => {
    const { project, onUpdateContractUrl, onUpdateStatus } = useProject();
    const [isUploading, setIsUploading] = useState(false);
    const contractFileInputRef = useRef<HTMLInputElement>(null);

    const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const result = await cloudFileService.uploadFile(file);
            if (result) {
                onUpdateContractUrl(result.url);
                if (pendingStatus) {
                    onUpdateStatus(pendingStatus);
                }
                onClose();
            }
        } catch (error) {
            console.error('Upload failed:', error);
            alert('上傳失敗，請稍後再試');
        } finally {
            setIsUploading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 space-y-6">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
                        <Upload size={32} />
                    </div>

                    <div className="text-center space-y-2">
                        <h3 className="text-xl font-black text-slate-900">上傳報價單或合約</h3>
                        <p className="text-sm text-slate-500 font-bold leading-relaxed">
                            將案件狀態更改為「{pendingStatus}」前，<br />
                            需先上傳正式報價單或合約文件作為後續參考。
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-900 uppercase">REQUIRED DOCUMENTS</p>
                                <p className="text-[10px] text-slate-400 font-bold">支援 PDF, JPG, PNG 格式</p>
                            </div>
                        </div>
                    </div>

                    <input
                        type="file"
                        className="hidden"
                        ref={contractFileInputRef}
                        onChange={handleContractUpload}
                        accept=".pdf,image/*"
                    />

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onClose}
                            className="py-3 px-4 rounded-xl text-xs font-black text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            暫不變更
                        </button>
                        <button
                            onClick={() => contractFileInputRef.current?.click()}
                            disabled={isUploading}
                            className="py-3 px-4 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                            {isUploading ? '上傳中...' : '上傳並變更狀態'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MandatoryUploadModal;
