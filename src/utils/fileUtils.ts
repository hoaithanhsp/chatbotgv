// ========== SHARED FILE UTILITIES ==========
// Dùng chung cho ChatArea và các Tool Modals (LessonPlan, Quiz, Game, Slide)

import type { FileAttachment } from '../types';

export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
export const MAX_FILES = 5; // Giới hạn file trong modal công cụ

// Convert File to FileAttachment
export const fileToAttachment = (file: File): Promise<FileAttachment> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || '';
            const isImage = file.type.startsWith('image/');
            resolve({
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                base64,
                isImage,
                previewUrl: isImage ? result : undefined,
            });
        };
        reader.onerror = () => reject(new Error(`Không thể đọc file: ${file.name}`));
        reader.readAsDataURL(file);
    });
};

// Format file size
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// MIME type labels
export const getFileTypeLabel = (type: string): string => {
    if (type.startsWith('image/')) return 'Ảnh';
    if (type.includes('pdf')) return 'PDF';
    if (type.includes('document') || type.includes('word')) return 'Word';
    if (type.includes('spreadsheet') || type.includes('excel')) return 'Excel';
    if (type.includes('presentation') || type.includes('powerpoint')) return 'PPT';
    if (type.startsWith('text/')) return 'Text';
    if (type.startsWith('video/')) return 'Video';
    if (type.startsWith('audio/')) return 'Audio';
    return 'File';
};
