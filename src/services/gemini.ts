
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = localStorage.getItem('gemini_api_key') || '';

const genAI = new GoogleGenerativeAI(API_KEY);

export const setGeminiApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    window.location.reload();
};

export const getGeminiApiKey = () => localStorage.getItem('gemini_api_key');

const MODEL_NAME = 'gemini-2.0-flash'; // Or 'gemini-1.5-flash' based on availability and instructions
// const FALLBACK_MODELS = ['gemini-1.5-pro', 'gemini-1.5-flash'];

export const generateResponse = async (history: { role: string; parts: { text: string }[] }[], userMessage: string) => {
    if (!API_KEY) throw new Error("API Key not found");

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
        // TODO: Implement fallback logic here
        throw error;
    }
};
