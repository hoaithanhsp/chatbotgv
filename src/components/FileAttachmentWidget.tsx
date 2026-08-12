import React, { useRef, useState, useCallback } from 'react';
import { Paperclip, X, FileText, ImageIcon, Film, Music, FileIcon, Upload } from 'lucide-react';
import type { FileAttachment } from '../types';
import { fileToAttachment, formatFileSize, MAX_FILE_SIZE, MAX_FILES } from '../utils/fileUtils';

interface FileAttachmentWidgetProps {
    files: FileAttachment[];
    onFilesChange: (files: FileAttachment[]) => void;
    accentColor?: string; // e.g. 'teal', 'purple', 'orange', 'blue'
    maxFiles?: number;
}

const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={14} className="text-purple-500" />;
    if (type.startsWith('video/')) return <Film size={14} className="text-blue-500" />;
    if (type.startsWith('audio/')) return <Music size={14} className="text-pink-500" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text'))
        return <FileText size={14} className="text-orange-500" />;
    return <FileIcon size={14} className="text-gray-500" />;
};

export const FileAttachmentWidget: React.FC<FileAttachmentWidgetProps> = ({
    files,
    onFilesChange,
    accentColor = 'teal',
    maxFiles = MAX_FILES,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const dragCounterRef = useRef(0);

    const colorMap: Record<string, { bg: string; border: string; text: string; ring: string; hoverBg: string }> = {
        teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', ring: 'ring-teal-300', hoverBg: 'hover:bg-teal-100' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', ring: 'ring-purple-300', hoverBg: 'hover:bg-purple-100' },
        orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', ring: 'ring-orange-300', hoverBg: 'hover:bg-orange-100' },
        blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', ring: 'ring-blue-300', hoverBg: 'hover:bg-blue-100' },
    };
    const colors = colorMap[accentColor] || colorMap.teal;

    const processFiles = useCallback(async (fileList: FileList | File[]) => {
        const fileArray = Array.from(fileList);
        const errors: string[] = [];

        if (files.length + fileArray.length > maxFiles) {
            setError(`Tối đa ${maxFiles} file. Đang có ${files.length} file.`);
            setTimeout(() => setError(null), 4000);
            return;
        }

        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (file.size > MAX_FILE_SIZE) {
                errors.push(`"${file.name}" vượt quá 20MB`);
            } else {
                validFiles.push(file);
            }
        }

        if (errors.length > 0) {
            setError(errors.join('. '));
            setTimeout(() => setError(null), 4000);
        }

        if (validFiles.length === 0) return;

        try {
            const attachments = await Promise.all(validFiles.map(fileToAttachment));
            onFilesChange([...files, ...attachments].slice(0, maxFiles));
        } catch (err: any) {
            setError(err.message || 'Lỗi khi đọc file');
            setTimeout(() => setError(null), 4000);
        }
    }, [files, onFilesChange, maxFiles]);

    const removeFile = (index: number) => {
        onFilesChange(files.filter((_, i) => i !== index));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) {
            processFiles(e.dataTransfer.files);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFiles(e.target.files);
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">📎 Tài liệu tham khảo</label>

            {/* Drag & Drop Zone */}
            <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-3 cursor-pointer transition-all duration-200 text-center ${
                    isDragging
                        ? `${colors.border} ${colors.bg} scale-[1.01]`
                        : files.length > 0
                          ? 'border-gray-200 bg-white hover:border-gray-300'
                          : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50'
                }`}
            >
                {files.length === 0 ? (
                    <div className="flex flex-col items-center gap-1 py-1">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                            <Upload size={16} className={colors.text} />
                        </div>
                        <p className="text-xs text-gray-500">
                            <span className={`font-medium ${colors.text}`}>Nhấn để chọn</span> hoặc kéo thả file
                        </p>
                        <p className="text-[10px] text-gray-400">
                            DOCX, PDF, ảnh, TXT... • Tối đa {maxFiles} file, 20MB/file
                        </p>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {/* File list */}
                        <div className="flex flex-wrap gap-1.5">
                            {files.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="group/f flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs max-w-[180px] shadow-sm hover:shadow transition-shadow"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {file.isImage && file.previewUrl ? (
                                        <img src={file.previewUrl} alt={file.name} className="w-6 h-6 rounded object-cover shrink-0" />
                                    ) : (
                                        getFileIcon(file.type)
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-gray-700 font-medium truncate text-[11px]">{file.name}</p>
                                        <p className="text-[9px] text-gray-400">{formatFileSize(file.size)}</p>
                                    </div>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                        className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/f:opacity-100 transition-all shrink-0"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        {/* Add more hint */}
                        {files.length < maxFiles && (
                            <p className="text-[10px] text-gray-400 flex items-center justify-center gap-1">
                                <Paperclip size={10} /> Nhấn để thêm file ({files.length}/{maxFiles})
                            </p>
                        )}
                    </div>
                )}

                {/* Drag overlay */}
                {isDragging && (
                    <div className={`absolute inset-0 ${colors.bg} ${colors.border} border-2 border-dashed rounded-xl flex items-center justify-center`}>
                        <p className={`text-sm font-medium ${colors.text}`}>📂 Thả file tại đây</p>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileInputChange}
                accept="*/*"
            />

            {/* Error message */}
            {error && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1.5 animate-in fade-in duration-200">
                    <span>⚠️</span>
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
                        <X size={12} />
                    </button>
                </div>
            )}
        </div>
    );
};
