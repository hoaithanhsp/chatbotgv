
import React, { useState, useEffect, useCallback } from 'react';
import { X, Upload, Trash2, Check, Loader2, AlertCircle, File } from 'lucide-react';
import { extractText, saveDocument, getDocuments, deleteDocument } from '../services/documents';
import type { Document } from '../services/documents';

interface DocumentManagerProps {
    isOpen: boolean;
    onClose: () => void;
    selectedDocIds: string[];
    onSelectionChange: (ids: string[]) => void;
}

export const DocumentManager: React.FC<DocumentManagerProps> = ({
    isOpen, onClose, selectedDocIds, onSelectionChange
}) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const loadDocuments = useCallback(async () => {
        const docs = await getDocuments();
        setDocuments(docs);
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadDocuments();
        }
    }, [isOpen, loadDocuments]);

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setUploading(true);
        setError('');

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            try {
                setUploadProgress(`Đang xử lý: ${file.name} (${i + 1}/${files.length})...`);

                // Extract text
                const text = await extractText(file);

                if (!text || text.trim().length < 10) {
                    setError(`File "${file.name}" không có nội dung text hoặc quá ngắn.`);
                    continue;
                }

                // Get file extension
                const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';

                // Save to Supabase/localStorage
                setUploadProgress(`Đang lưu: ${file.name}...`);
                await saveDocument(
                    file.name.replace(/\.\w+$/, ''), // title without extension
                    text,
                    ext,
                    file.size,
                    []
                );

            } catch (err: any) {
                console.error(`Error processing ${file.name}:`, err);
                setError(`Lỗi xử lý "${file.name}": ${err.message}`);
            }
        }

        setUploadProgress('');
        setUploading(false);
        await loadDocuments();
    };

    const handleDelete = async (docId: string) => {
        if (!confirm('Xóa tài liệu này?')) return;
        await deleteDocument(docId);
        onSelectionChange(selectedDocIds.filter(id => id !== docId));
        await loadDocuments();
    };

    const toggleSelect = (docId: string) => {
        if (selectedDocIds.includes(docId)) {
            onSelectionChange(selectedDocIds.filter(id => id !== docId));
        } else {
            onSelectionChange([...selectedDocIds, docId]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getFileIcon = (type: string) => {
        switch (type) {
            case 'pdf': return '📄';
            case 'docx': case 'doc': return '📝';
            default: return '📃';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">📚 Tài liệu tham khảo</h2>
                        <p className="text-sm text-gray-500 mt-1">Upload PDF, Word, TXT để chatbot tham khảo khi trả lời</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Upload Area */}
                <div className="p-4 border-b border-gray-100 shrink-0">
                    <label
                        className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${dragOver
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                    >
                        {uploading ? (
                            <>
                                <Loader2 size={32} className="text-indigo-600 animate-spin mb-2" />
                                <p className="text-sm text-indigo-600 font-medium">{uploadProgress}</p>
                            </>
                        ) : (
                            <>
                                <Upload size={32} className="text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600 font-medium">Kéo thả file hoặc nhấn để chọn</p>
                                <p className="text-xs text-gray-400 mt-1">Hỗ trợ: PDF, DOCX, TXT (tối đa 50MB)</p>
                            </>
                        )}
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.docx,.doc,.txt,.md"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            disabled={uploading}
                        />
                    </label>

                    {error && (
                        <div className="flex items-start gap-2 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600">{error}</p>
                        </div>
                    )}
                </div>

                {/* Document List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {documents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <File size={48} className="text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">Chưa có tài liệu nào</p>
                            <p className="text-xs text-gray-400 mt-1">Upload tài liệu để chatbot tham khảo</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {selectedDocIds.length > 0 && (
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2 mb-3">
                                    <p className="text-xs text-indigo-700 font-medium">
                                        ✅ Đã chọn {selectedDocIds.length} tài liệu — Chatbot sẽ tham khảo khi trả lời
                                    </p>
                                </div>
                            )}
                            {documents.map(doc => {
                                const isSelected = selectedDocIds.includes(doc.id);
                                return (
                                    <div
                                        key={doc.id}
                                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${isSelected
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                        onClick={() => toggleSelect(doc.id)}
                                    >
                                        {/* Select indicator */}
                                        <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border-2 transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <Check size={14} className="text-white" />}
                                        </div>

                                        {/* File icon */}
                                        <span className="text-xl">{getFileIcon(doc.file_type)}</span>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm truncate">{doc.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">
                                                {doc.file_type.toUpperCase()} · {formatSize(doc.file_size)} · {doc.chunk_count} phần
                                                {doc.created_at && ` · ${new Date(doc.created_at).toLocaleDateString('vi-VN')}`}
                                            </p>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                    <p className="text-xs text-gray-400">
                        {documents.length} tài liệu · {selectedDocIds.length} đang chọn
                    </p>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    );
};
