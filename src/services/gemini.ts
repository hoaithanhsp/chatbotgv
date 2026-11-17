import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../data/systemInstruction';

export type AiProvider = 'gemini' | 'agent-platform';

let _genAI: GoogleGenAI | null = null;
let _currentProvider: AiProvider | null = null;
let _currentKey: string | null = null;

export const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;

export const normalizeGoogleAiApiKey = (key: string): string => key.trim();

export const isValidGoogleAiApiKey = (key: string): boolean => {
    return GOOGLE_AI_API_KEY_PATTERN.test(normalizeGoogleAiApiKey(key));
};

export const createGoogleAiClient = (apiKey: string, provider: AiProvider): GoogleGenAI => {
    if (provider === 'agent-platform') {
        return new GoogleGenAI({ vertexai: true, apiKey });
    }
    return new GoogleGenAI({ apiKey });
};

export const getProvider = (): AiProvider => {
    const p = localStorage.getItem('google_ai_provider');
    return (p === 'agent-platform') ? 'agent-platform' : 'gemini';
};

export const setProvider = (provider: AiProvider) => {
    localStorage.setItem('google_ai_provider', provider);
    localStorage.setItem('google_ai_provider_selection_source', 'manual');
    _genAI = null;
};

export const getGeminiApiKey = () => localStorage.getItem('gemini_api_key');
export const getAgentPlatformApiKey = () => localStorage.getItem('agent_platform_api_key');
export const getApiKey = () => getProvider() === 'agent-platform' ? getAgentPlatformApiKey() : getGeminiApiKey();

export const setGeminiApiKey = (key: string) => {
    const normalized = normalizeGoogleAiApiKey(key);
    if (normalized && !isValidGoogleAiApiKey(normalized)) {
        throw new Error('API Key Google AI không hợp lệ. Hãy dùng key bắt đầu bằng AQ... hoặc AIzaSy...');
    }
    localStorage.setItem('gemini_api_key', normalized);
    if (getProvider() === 'gemini') _genAI = null;
};

export const setAgentPlatformApiKey = (key: string) => {
    const normalized = normalizeGoogleAiApiKey(key);
    if (normalized && !isValidGoogleAiApiKey(normalized)) {
        throw new Error('API Key Google AI không hợp lệ. Hãy dùng key bắt đầu bằng AQ... hoặc AIzaSy...');
    }
    localStorage.setItem('agent_platform_api_key', normalized);
    if (getProvider() === 'agent-platform') _genAI = null;
};

export const getGenAI = (): GoogleGenAI | null => {
    const provider = getProvider();
    const key = provider === 'agent-platform' ? getAgentPlatformApiKey() : getGeminiApiKey();
    const normalizedKey = normalizeGoogleAiApiKey(key || '');
    
    if (!normalizedKey) return null;
    if (!isValidGoogleAiApiKey(normalizedKey)) {
        throw new Error('API Key không hợp lệ. Key mới bắt đầu bằng AQ..., key cũ bắt đầu bằng AIzaSy...');
    }
    
    if (_genAI && _currentProvider === provider && _currentKey === normalizedKey) {
        return _genAI;
    }
    
    _genAI = createGoogleAiClient(normalizedKey, provider);
    _currentProvider = provider;
    _currentKey = normalizedKey;
    return _genAI;
};

// =============================================
// MODEL LIST
// =============================================
export const MODELS = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
] as const;

export const AGENT_PLATFORM_MODELS = [
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.5-flash-lite',
    'gemini-3.6-flash',
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
] as const;

export const getAvailableModels = (): string[] => {
    return getProvider() === 'agent-platform' ? [...AGENT_PLATFORM_MODELS] : [...MODELS];
};

const DEFAULT_GEMINI_MODEL = MODELS[0];
const DEFAULT_AGENT_PLATFORM_MODEL = AGENT_PLATFORM_MODELS[0];

let _selectedModel: string | null = null;

export const getSelectedModel = (): string => {
    const stored = _selectedModel || localStorage.getItem('selected_model');
    const availableModels = getAvailableModels();
    
    if (stored && availableModels.includes(stored as any)) {
        return stored;
    }
    
    return getProvider() === 'agent-platform' ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL;
};

export const setSelectedModel = (model: string) => {
    const availableModels = getAvailableModels();
    const nextModel = availableModels.includes(model as any) 
        ? model 
        : (getProvider() === 'agent-platform' ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL);
        
    _selectedModel = nextModel;
    localStorage.setItem('selected_model', nextModel);
};

export type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };

export type GeminiApiErrorType = 'QUOTA_EXCEEDED' | 'MODEL_OVERLOADED' | 'INVALID_API_KEY' | 'UNKNOWN' | 'NOT_FOUND';

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
        text.includes('try again later') ||
        text.includes('500') ||
        text.includes('504') ||
        text.includes('deadline_exceeded') ||
        text.includes('temporarily unavailable')
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
    
    if (text.includes('404') || text.includes('not_found')) {
        return 'NOT_FOUND';
    }

    return 'UNKNOWN';
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getOrderedModels = (selectedModel?: string): string[] => {
    const provider = getProvider();
    const availableModels = getAvailableModels();
    const fallbackChain = [
        'gemini-3.8-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash',
    ];
    
    let selected = selectedModel || getSelectedModel();
    if (!availableModels.includes(selected as any)) {
        selected = provider === 'agent-platform' ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL;
    }
    
    const ordered = [selected, ...fallbackChain.filter(m => m !== selected && availableModels.includes(m))];
    return ordered;
};

// =============================================
// GENERATE RESPONSE - Google GenAI SDK with model fallback
// =============================================
export const generateResponse = async (history: { role: string; parts: GeminiPart[] }[], userParts: GeminiPart[]) => {
    const genAI = getGenAI();
    if (!genAI) throw new Error('API Key chưa được nhập. Vui lòng vào Cài đặt để nhập API Key.');

    const orderedModels = getOrderedModels();
    const provider = getProvider();
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
            const isGemini3 = /^gemini-3\./.test(modelName);
            const config: any = {
                maxOutputTokens: 12288,
                systemInstruction: SYSTEM_INSTRUCTION,
            };
            if (isGemini3) {
                config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
            } else {
                config.temperature = 0.2;
                config.topP = 0.95;
                config.topK = 40;
            }
            const response = await genAI.models.generateContent({
                model: modelName,
                contents,
                config,
            });

            const text = response.text || '';
            if (text) {
                return text;
            }
        } catch (error: any) {
            const errorType = parseApiError(error);
            console.warn(`[Gemini] Model ${modelName} failed (${errorType}):`, error?.message || error);
            lastError = error;

            if (errorType === 'INVALID_API_KEY') {
                throw new Error('API Key không hợp lệ, bị chặn hoặc không có quyền dùng Gemini API. Vui lòng kiểm tra lại API Key trong Cài đặt.');
            }

            const status = (error?.status || error?.code || error?.response?.status || '').toString();
            const message = `${error?.message || error || ''}`.toLowerCase();
            const isUnavailable = ['503', '502', '504'].includes(status) || /unavailable|overloaded|temporarily unavailable|deadline_exceeded|try again later|high demand/.test(message);

            if (errorType === 'QUOTA_EXCEEDED') {
                sawQuotaError = true;
            } else if (errorType === 'MODEL_OVERLOADED' || errorType === 'NOT_FOUND' || isUnavailable) {
                sawOverloadError = true;
            } else {
                sawUnknownError = true;
            }

            if (errorType === 'UNKNOWN' && !isUnavailable) throw error;

            if (i < orderedModels.length - 1) {
                await delay(errorType === 'QUOTA_EXCEEDED' ? 2000 : 1000);
            }
        }
    }

    if (sawOverloadError && !sawUnknownError) {
        throw new Error(
            'Các model Gemini đang tạm quá tải. API Key vẫn hợp lệ, vui lòng thử lại sau ít phút hoặc chọn model dự phòng nhẹ hơn.'
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
