import { GoogleGenAI } from '@google/genai';

let _genAI: GoogleGenAI | null = null;

export const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;

export const normalizeGoogleAiApiKey = (key: string): string => key.trim();

export const isValidGoogleAiApiKey = (key: string): boolean => {
    return GOOGLE_AI_API_KEY_PATTERN.test(normalizeGoogleAiApiKey(key));
};

const getGenAI = (): GoogleGenAI | null => {
    if (_genAI) return _genAI;
    const key = normalizeGoogleAiApiKey(localStorage.getItem('gemini_api_key') || '');
    if (!key) return null;
    if (!isValidGoogleAiApiKey(key)) {
        throw new Error('API Key Google AI không hợp lệ. Key mới bắt đầu bằng AQ..., key cũ bắt đầu bằng AIzaSy...');
    }
    _genAI = new GoogleGenAI({ apiKey: key });
    return _genAI;
};

export const setGeminiApiKey = (key: string) => {
    const normalized = normalizeGoogleAiApiKey(key);
    if (normalized && !isValidGoogleAiApiKey(normalized)) {
        throw new Error('API Key Google AI không hợp lệ. Hãy dùng key bắt đầu bằng AQ... hoặc AIzaSy...');
    }
    localStorage.setItem('gemini_api_key', normalized);
    _genAI = null;
};

export const getGeminiApiKey = () => localStorage.getItem('gemini_api_key');

// =============================================
// MODEL LIST - Google GenAI SDK / Gemini API
// Keep the user's selected model first, then fall back through this stable list.
// =============================================
const MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-3.5-flash',
    'gemini-2.5-pro',
];

const DEFAULT_MODEL = MODELS[0];

let _selectedModel: string | null = null;

export const getSelectedModel = (): string => {
    const stored = _selectedModel || localStorage.getItem('selected_model') || DEFAULT_MODEL;
    return MODELS.includes(stored) ? stored : DEFAULT_MODEL;
};

export const setSelectedModel = (model: string) => {
    const nextModel = MODELS.includes(model) ? model : DEFAULT_MODEL;
    _selectedModel = nextModel;
    localStorage.setItem('selected_model', nextModel);
};

export const getAvailableModels = () => MODELS;

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export type GeminiApiErrorType = 'QUOTA_EXCEEDED' | 'MODEL_OVERLOADED' | 'INVALID_API_KEY' | 'UNKNOWN';

const stringifyError = (error: any): string => {
    const message = error?.message || error?.toString?.() || String(error);
    let serialized = '';
    try {
        serialized = JSON.stringify(error);
    } catch {
        serialized = '';
    }
    return `${message} ${serialized}`.toLowerCase();
};

export const parseApiError = (error: any): GeminiApiErrorType => {
    const text = stringifyError(error);

    if (
        text.includes('429') ||
        text.includes('resource_exhausted') ||
        text.includes('quota') ||
        text.includes('rate limit') ||
        text.includes('too many requests')
    ) {
        return 'QUOTA_EXCEEDED';
    }

    if (
        text.includes('503') ||
        text.includes('unavailable') ||
        text.includes('high demand') ||
        text.includes('overloaded') ||
        text.includes('try again later')
    ) {
        return 'MODEL_OVERLOADED';
    }

    if (
        text.includes('api_key_invalid') ||
        text.includes('unauthenticated') ||
        text.includes('permission_denied') ||
        text.includes('401') ||
        text.includes('403')
    ) {
        return 'INVALID_API_KEY';
    }

    return 'UNKNOWN';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getOrderedModels = (selectedModel?: string): string[] => {
    const selected = selectedModel && MODELS.includes(selectedModel) ? selectedModel : getSelectedModel();
    return [selected, ...MODELS.filter(model => model !== selected)];
};

// =============================================
// GENERATE RESPONSE - Google GenAI SDK with model fallback
// =============================================
export const generateResponse = async (history: { role: string; parts: GeminiPart[] }[], userParts: GeminiPart[]) => {
    const genAI = getGenAI();
    if (!genAI) throw new Error('API Key chưa được nhập. Vui lòng vào Cài đặt để nhập API Key.');

    const orderedModels = getOrderedModels();
    let lastError: any = null;
    let sawQuotaError = false;
    let sawOverloadError = false;
    let sawUnknownError = false;

    const contents = [
        ...history.map(item => ({
            role: item.role === 'model' ? 'model' : 'user',
            parts: item.parts,
        })),
        {
            role: 'user',
            parts: userParts,
        },
    ];

    for (let i = 0; i < orderedModels.length; i++) {
        const modelName = orderedModels[i];
        try {
            console.log(`[Gemini] Trying model: ${modelName}`);
            const response = await genAI.models.generateContent({
                model: modelName,
                contents,
                config: {
                    maxOutputTokens: 8192,
                },
            });

            const text = response.text || '';
            if (text) {
                console.log(`[Gemini] Success with model: ${modelName}`);
                return text;
            }
        } catch (error: any) {
            const errorType = parseApiError(error);
            console.warn(`[Gemini] Model ${modelName} failed (${errorType}):`, error?.message || error);
            lastError = error;

            if (errorType === 'INVALID_API_KEY') {
                throw new Error('API Key không hợp lệ, bị chặn hoặc không có quyền dùng Gemini API. Vui lòng kiểm tra lại API Key trong Cài đặt.');
            }

            if (errorType === 'QUOTA_EXCEEDED') {
                sawQuotaError = true;
            } else if (errorType === 'MODEL_OVERLOADED') {
                sawOverloadError = true;
            } else {
                sawUnknownError = true;
            }

            if (i < orderedModels.length - 1) {
                await delay(errorType === 'QUOTA_EXCEEDED' ? 2000 : 1000);
            }
        }
    }

    if (sawOverloadError && !sawUnknownError) {
        throw new Error(
            'Các model Gemini đang tạm quá tải. API Key vẫn hợp lệ, vui lòng thử lại sau ít phút hoặc chọn model nhẹ hơn như Gemini 2.5 Flash-Lite.'
        );
    }

    if (sawQuotaError && !sawUnknownError) {
        throw new Error(
            'API Key đã hết quota hoặc bị giới hạn tốc độ cho hôm nay.\n\n' +
            'Gợi ý:\n' +
            '1. Tạo auth key mới tại https://aistudio.google.com/api-keys\n' +
            '2. Dán key mới vào phần Cài đặt\n' +
            '3. Hoặc chờ quota được reset'
        );
    }

    const errMsg = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Tất cả model Gemini đều thất bại. Lỗi cuối: ${errMsg}`);
};
