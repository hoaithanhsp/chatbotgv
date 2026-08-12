import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check } from 'lucide-react';
import { 
    getAvailableModels, 
    getSelectedModel, 
    setSelectedModel, 
    getProvider, 
    setProvider, 
    AiProvider,
    getGeminiApiKey,
    getAgentPlatformApiKey,
    setGeminiApiKey,
    setAgentPlatformApiKey
} from '../services/gemini';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (supabaseUrl: string, supabaseKey: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave }) => {
    const [providerState, setProviderState] = useState<AiProvider>('gemini');
    const [geminiKey, setGeminiKey] = useState('');
    const [agentKey, setAgentKey] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [currentModel, setCurrentModel] = useState(getSelectedModel());

    useEffect(() => {
        if (isOpen) {
            setProviderState(getProvider());
            setGeminiKey(getGeminiApiKey() || '');
            setAgentKey(getAgentPlatformApiKey() || '');
            setSupabaseUrl(localStorage.getItem('supabase_url') || '');
            setSupabaseKey(localStorage.getItem('supabase_anon_key') || '');
            setCurrentModel(getSelectedModel());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = () => {
        setProvider(providerState);
        if (providerState === 'gemini') {
            setGeminiApiKey(geminiKey);
        } else {
            setAgentPlatformApiKey(agentKey);
        }
        
        onSave(supabaseUrl, supabaseKey);
        onClose();
    };

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        setCurrentModel(model);
    };

    const models = getAvailableModels();

    const getModelInfo = (model: string) => {
        switch (model) {
            case 'gemini-3.6-flash':
            case 'gemini-2.5-flash':
                return { label: 'Flash (Default)', desc: 'Cân bằng chi phí & hiệu năng, ổn định', badge: 'Default', color: 'emerald' };
            case 'gemini-2.5-flash-lite':
                return { label: '2.5 Lite', desc: 'Tiết kiệm nhất, phù hợp chat đơn giản', badge: 'Tiết kiệm', color: 'amber' };
            case 'gemini-3.5-flash':
                return { label: '3.5 Flash', desc: 'Model stable mới, mạnh cho suy luận', badge: 'Mới', color: 'teal' };
            case 'gemini-2.5-pro':
                return { label: '2.5 Pro', desc: 'Phân tích sâu, dùng khi cần chất lượng cao', badge: 'Pro', color: 'teal' };
            default:
                return { label: model, desc: '', badge: '', color: 'gray' };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">⚙️ Cài đặt</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    
                    {/* === PROVIDER SELECTION === */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">🔗 Chọn Nền Tảng API</h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => {
                                    setProviderState('gemini');
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${providerState === 'gemini' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Gemini API (Google AI Studio)
                            </button>
                            <button
                                onClick={() => {
                                    setProviderState('agent-platform');
                                }}
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${providerState === 'agent-platform' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Agent Platform API
                            </button>
                        </div>
                    </div>

                    {/* === MODEL SELECTION === */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">🤖 Chọn Model AI</h3>
                        <div className="space-y-2">
                            {models.map(model => {
                                const info = getModelInfo(model);
                                const isActive = currentModel === model;
                                return (
                                    <button
                                        key={model}
                                        onClick={() => handleModelSelect(model)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${isActive
                                            ? 'border-teal-500 bg-teal-50'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-teal-600' : 'bg-gray-200'
                                            }`}>
                                            {isActive ? <Check size={16} className="text-white" /> : <div className="w-3 h-3 rounded-full bg-gray-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 text-sm">{info.label}</span>
                                                {info.badge && (
                                                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${info.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' :
                                                        info.color === 'teal' ? 'bg-teal-100 text-teal-700' :
                                                            'bg-amber-100 text-amber-700'
                                                        }`}>{info.badge}</span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">💡 Nếu model lỗi, hệ thống sẽ tự động fallback sang model khác</p>
                    </div>

                    {/* === API KEY === */}
                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                            {providerState === 'gemini' ? '🔑 Gemini API Key' : '🔑 Agent Platform API Key'}
                        </h3>
                        {providerState === 'gemini' ? (
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Nhập key bắt đầu bằng AIzaSy..."
                            />
                        ) : (
                            <input
                                type="password"
                                value={agentKey}
                                onChange={(e) => setAgentKey(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Nhập key bắt đầu bằng AQ..."
                            />
                        )}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-red-500 font-medium">⚠️ Cần nhập API key để sử dụng app</p>
                            {providerState === 'gemini' && (
                                <a
                                    href="https://aistudio.google.com/api-keys"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-xs text-teal-600 hover:underline font-medium"
                                >
                                    <ExternalLink size={11} />
                                    Lấy API Key
                                </a>
                            )}
                        </div>
                    </div>

                    {/* === SUPABASE (Optional) === */}
                    <details className="border-t border-gray-100 pt-4">
                        <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors">
                            🗄️ Database (tùy chọn)
                        </summary>
                        <div className="mt-3 space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Supabase URL</label>
                                <input
                                    type="text"
                                    value={supabaseUrl}
                                    onChange={(e) => setSupabaseUrl(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Supabase Anon Key</label>
                                <input
                                    type="password"
                                    value={supabaseKey}
                                    onChange={(e) => setSupabaseKey(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                />
                            </div>
                        </div>
                    </details>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors"
                    >
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>
    );
};
