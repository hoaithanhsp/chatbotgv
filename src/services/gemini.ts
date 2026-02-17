
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

const MODEL_NAME = 'gemini-2.0-flash';

export const generateResponse = async (history: { role: string; parts: { text: string }[] }[], userMessage: string) => {
    const genAI = getGenAI();
    if (!genAI) throw new Error("API Key not found. Vui lòng nhập API Key trong Cài đặt.");

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const chat = model.startChat({
        history: history,
        generationConfig: {
            maxOutputTokens: 2048,
        },
    });

    try {
        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini Error:", error);
        throw error;
    }
};
