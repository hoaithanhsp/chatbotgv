
import { GoogleGenerativeAI } from '@google/generative-ai';

let _genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI | null => {
    if (_genAI) return _genAI;
    const key = localStorage.getItem('gemini_api_key') || '';
    if (!key) return null;
    _genAI = new GoogleGenerativeAI(key);
    return _genAI;
};

export const setGeminiApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    _genAI = null; // Reset so it re-creates with new key
};

export const getGeminiApiKey = () => localStorage.getItem('gemini_api_key');

// =============================================
// TỐI ƯU MODEL - Theo API.md khuyến nghị
// Thứ tự ưu tiên: Rẻ → Đắt (tiết kiệm quota)
// =============================================
const MODELS = [
    'gemini-2.5-flash',          // Cân bằng chi phí/hiệu năng (mặc định)
    'gemini-3-flash-preview',    // Frontier-class, reasoning mạnh
    'gemini-2.5-flash-lite',     // Rẻ nhất, fallback cuối
];

let _selectedModel: string | null = null;

export const getSelectedModel = (): string => {
    if (_selectedModel) return _selectedModel;
    return localStorage.getItem('selected_model') || MODELS[0];
};

export const setSelectedModel = (model: string) => {
    _selectedModel = model;
    localStorage.setItem('selected_model', model);
};

export const getAvailableModels = () => MODELS;

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

// =============================================
// PHÁT HIỆN LOẠI LỖI - Xử lý quota thông minh
// =============================================
const isQuotaError = (error: any): boolean => {
    const msg = error?.message || String(error);
    return (
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('429') ||
        msg.includes('quota') ||
        msg.includes('rate limit') ||
        msg.includes('Too Many Requests')
    );
};

const isApiKeyError = (error: any): boolean => {
    const msg = error?.message || String(error);
    return (
        msg.includes('API_KEY_INVALID') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('401') ||
        msg.includes('403')
    );
};

/**
 * Delay helper - chờ trước khi retry (tránh spam API)
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// =============================================
// GENERATE RESPONSE - Tối ưu quota
// =============================================
export const generateResponse = async (history: { role: string; parts: GeminiPart[] }[], userParts: GeminiPart[]) => {
    const genAI = getGenAI();
    if (!genAI) throw new Error("API Key chưa được nhập. Vui lòng vào Cài đặt để nhập API Key.");

    // Build ordered model list: selected model first, then remaining
    const selected = getSelectedModel();
    const orderedModels = [selected, ...MODELS.filter(m => m !== selected)];

    let lastError: unknown = null;
    let allQuotaExhausted = true; // Track if ALL failures are quota-related

    for (let i = 0; i < orderedModels.length; i++) {
        const modelName = orderedModels[i];
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const chat = model.startChat({
                history: history,
                generationConfig: {
                    // TỐI ƯU: Giảm từ 65536 → 8192
                    // 8192 tokens ≈ ~6000 từ tiếng Việt — đủ cho mọi tác vụ GV
                    // Tiết kiệm ~87% output tokens so với trước
                    maxOutputTokens: 8192,
                },
            });

            const result = await chat.sendMessage(userParts);
            const response = await result.response;
            const text = response.text();
            if (text) {
                console.log(`[Gemini] ✅ Success with model: ${modelName}`);
                return text;
            }
        } catch (error: any) {
            console.warn(`[Gemini] ❌ Model ${modelName} failed:`, error?.message || error);
            lastError = error;

            // Nếu API key sai → dừng ngay, không retry
            if (isApiKeyError(error)) {
                throw new Error(
                    'API Key không hợp lệ hoặc bị vô hiệu. Vui lòng kiểm tra lại API Key trong Cài đặt.'
                );
            }

            // Track nếu lỗi KHÔNG phải quota
            if (!isQuotaError(error)) {
                allQuotaExhausted = false;
            }

            // Nếu bị rate limit → chờ trước khi thử model tiếp
            if (isQuotaError(error) && i < orderedModels.length - 1) {
                console.log(`[Gemini] ⏳ Rate limited, waiting 2s before trying next model...`);
                await delay(2000);
            }
        }
    }

    // All models failed — thông báo phù hợp
    if (allQuotaExhausted) {
        throw new Error(
            '⚠️ API Key đã hết quota cho hôm nay.\n\n' +
            '💡 Giải pháp:\n' +
            '1. Lấy API Key từ tài khoản Gmail khác tại:\n' +
            '   https://aistudio.google.com/api-keys\n' +
            '2. Dán key mới vào phần Cài đặt (⚙️)\n' +
            '3. Hoặc chờ đến ngày mai để quota được reset'
        );
    }

    const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Tất cả model đều thất bại. Lỗi cuối: ${errMsg}`);
};
