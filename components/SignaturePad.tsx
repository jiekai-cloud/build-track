import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
    onSave: (signatureImage: string) => void;
    onCancel: () => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onCancel }) => {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
    };

    const save = () => {
        if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
            // Get base64 string
            const dataURL = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
            onSave(dataURL);
        }
    };

    return (
        <div className="flex flex-col items-center w-full max-w-lg mx-auto bg-white p-4 rounded-lg shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-stone-700">請在此簽名</h3>
            <div className="border-2 border-dashed border-stone-300 rounded mb-4 w-full h-64 bg-stone-50 overflow-hidden relative">
                {/* Canvas needs explicit width/height in container usually */}
                <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                        className: 'signature-canvas',
                        style: { width: '100%', height: '100%', display: 'block' }
                    }}
                    onBegin={() => setIsEmpty(false)}
                    backgroundColor="rgba(255,255,255,0)"
                />
            </div>
            <div className="flex gap-4 w-full">
                <button
                    onClick={clear}
                    className="flex-1 py-2 px-4 bg-stone-200 text-stone-700 rounded hover:bg-stone-300 transition-colors"
                >
                    清除
                </button>
                <button
                    onClick={save}
                    disabled={isEmpty}
                    className={`flex-1 py-2 px-4 text-white rounded transition-colors ${isEmpty ? 'bg-stone-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'
                        }`}
                >
                    確認簽名
                </button>
            </div>
            <button
                onClick={onCancel}
                className="mt-2 text-sm text-stone-500 hover:text-stone-700 underline"
            >
                取消
            </button>
        </div>
    );
};

export default SignaturePad;
