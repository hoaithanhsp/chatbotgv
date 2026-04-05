// ========== FILE PROCESSOR SERVICE ==========
// Tiền xử lý file đính kèm trước khi gửi cho Gemini API
// Giải quyết: Gemini không hỗ trợ DOCX, DOC, XLSX... dạng inlineData
// Chiến lược: trích xuất text + ảnh nhúng từ DOCX, gửi dưới dạng text + image parts

import type { FileAttachment } from '../types';
import type { GeminiPart } from './gemini';

// MIME types mà Gemini hỗ trợ trực tiếp qua inlineData
const GEMINI_SUPPORTED_MIME_TYPES = new Set([
    // Images
    'image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
    // PDF
    'application/pdf',
    // Audio
    'audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/aiff', 'audio/aac', 'audio/ogg', 'audio/flac',
    // Video
    'video/mp4', 'video/mpeg', 'video/mov', 'video/avi', 'video/x-flv',
    'video/mpg', 'video/webm', 'video/wmv', 'video/3gpp',
]);

// Image MIME types mà Gemini chấp nhận (dùng khi lọc ảnh từ DOCX)
const GEMINI_IMAGE_TYPES = new Set([
    'image/png', 'image/jpeg', 'image/gif', 'image/webp',
]);

/**
 * Kiểm tra file có phải DOCX/DOC không
 */
const isDocxFile = (mimeType: string, fileName: string): boolean => {
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return true;
    if (mimeType === 'application/msword') return true;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'docx' || ext === 'doc';
};

/**
 * Kiểm tra file có phải text thuần không
 */
const isTextFile = (mimeType: string, fileName: string): boolean => {
    if (mimeType.startsWith('text/')) return true;
    const ext = fileName.split('.').pop()?.toLowerCase();
    return ext === 'txt' || ext === 'md' || ext === 'csv';
};

/**
 * Chuyển base64 string thành ArrayBuffer
 */
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

/**
 * Xử lý file DOCX: trích xuất text + ảnh nhúng
 * Sử dụng mammoth.js (đã có trong dependencies)
 */
const processDocxFile = async (attachment: FileAttachment): Promise<GeminiPart[]> => {
    const mammoth = await import('mammoth');
    const arrayBuffer = base64ToArrayBuffer(attachment.base64);

    const parts: GeminiPart[] = [];
    const extractedImages: { mimeType: string; data: string }[] = [];

    // 1. Trích xuất text thuần
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = textResult.value.trim();

    // 2. Trích xuất ảnh nhúng qua convertToHtml với custom image handler
    try {
        await mammoth.convertToHtml(
            { arrayBuffer },
            {
                convertImage: mammoth.images.imgElement(function (image: any) {
                    return image.read("base64").then(function (imageBase64: string) {
                        const contentType = image.contentType || 'image/png';

                        // Chỉ giữ lại ảnh mà Gemini hỗ trợ
                        if (GEMINI_IMAGE_TYPES.has(contentType)) {
                            extractedImages.push({
                                mimeType: contentType,
                                data: imageBase64,
                            });
                        }
                        // WMF/EMF/BMP... → bỏ qua vì Gemini không hỗ trợ
                        return { src: '' };
                    });
                }),
            }
        );
    } catch (imgErr) {
        console.warn('[FileProcessor] Lỗi khi trích xuất ảnh từ DOCX:', imgErr);
    }

    // 3. Build text part
    const imageInfo = extractedImages.length > 0
        ? `\n(File có ${extractedImages.length} hình ảnh nhúng, đã đính kèm bên dưới)`
        : '';

    if (rawText) {
        parts.push({
            text: `📎 Nội dung file "${attachment.name}":\n\n${rawText}${imageInfo}`
        });
    } else {
        parts.push({
            text: `📎 File "${attachment.name}" (không trích xuất được text, xem hình ảnh đính kèm)${imageInfo}`
        });
    }

    // 4. Thêm ảnh nhúng
    for (const img of extractedImages) {
        parts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            }
        });
    }

    console.log(`[FileProcessor] DOCX "${attachment.name}": ${rawText.length} chars text, ${extractedImages.length} images`);
    return parts;
};

/**
 * Xử lý file text thuần (TXT, MD, CSV)
 */
const processTextFile = async (attachment: FileAttachment): Promise<GeminiPart[]> => {
    try {
        const text = atob(attachment.base64);
        return [{
            text: `📎 Nội dung file "${attachment.name}":\n\n${text}`
        }];
    } catch {
        // Nếu không decode được base64, gửi raw
        return [{
            text: `📎 File "${attachment.name}" (không đọc được nội dung text)`
        }];
    }
};

/**
 * Xử lý file mà Gemini hỗ trợ natively (ảnh, PDF, video, audio)
 * → giữ nguyên, gửi qua inlineData
 */
const processNativeFile = (attachment: FileAttachment): GeminiPart[] => {
    return [{
        inlineData: {
            mimeType: attachment.type,
            data: attachment.base64,
        }
    }];
};

/**
 * === MAIN FUNCTION ===
 * Xử lý file đính kèm thành các GeminiPart phù hợp
 * 
 * Luồng:
 * - DOCX/DOC → trích xuất text + ảnh nhúng
 * - TXT/MD/CSV → đọc text content
 * - Ảnh/PDF/Audio/Video → giữ nguyên inlineData
 * - Khác → thông báo không hỗ trợ
 */
export const processFileForGemini = async (attachment: FileAttachment): Promise<GeminiPart[]> => {
    const { type, name } = attachment;

    // 1. DOCX/DOC → xử lý đặc biệt
    if (isDocxFile(type, name)) {
        try {
            return await processDocxFile(attachment);
        } catch (err: any) {
            console.error('[FileProcessor] DOCX processing failed:', err);
            return [{
                text: `📎 File "${name}" (DOCX) - Lỗi khi xử lý: ${err.message}. Vui lòng thử upload lại hoặc chuyển sang PDF.`
            }];
        }
    }

    // 2. Text files → đọc nội dung
    if (isTextFile(type, name)) {
        return processTextFile(attachment);
    }

    // 3. Gemini native support → giữ nguyên
    if (GEMINI_SUPPORTED_MIME_TYPES.has(type)) {
        return processNativeFile(attachment);
    }

    // 4. File không hỗ trợ → thông báo
    console.warn(`[FileProcessor] Unsupported file type: ${type} (${name})`);
    return [{
        text: `📎 File "${name}" (${type}) - Định dạng này chưa được hỗ trợ phân tích. Hãy thử chuyển sang PDF hoặc DOCX.`
    }];
};

/**
 * Xử lý nhiều file đính kèm cùng lúc
 */
export const processFilesForGemini = async (attachments: FileAttachment[]): Promise<GeminiPart[]> => {
    const allParts: GeminiPart[] = [];
    for (const att of attachments) {
        const parts = await processFileForGemini(att);
        allParts.push(...parts);
    }
    return allParts;
};
