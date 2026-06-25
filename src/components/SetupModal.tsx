
import React, { useState } from 'react';
import type { TeacherProfile } from '../types';
import { ExternalLink, Key, Sparkles, User } from 'lucide-react';
import { isValidGoogleAiApiKey } from '../services/gemini';

interface SetupModalProps {
    onSubmit: (apiKey: string, supabaseUrl: string, supabaseKey: string, profile: TeacherProfile) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onSubmit }) => {
    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');

    const [name, setName] = useState('');
    const [subject, setSubject] = useState('Toán');
    const [schoolLevel, setSchoolLevel] = useState('THPT');
    const [schoolName, setSchoolName] = useState('');

    const handleNext = () => {
        if (step === 1) {
            if (!apiKey) {
                alert('Vui lòng nhập Gemini API Key để sử dụng app');
                return;
            }
            if (!isValidGoogleAiApiKey(apiKey)) {
                alert('API Key Google AI không hợp lệ. Key mới bắt đầu bằng AQ..., key cũ bắt đầu bằng AIzaSy...');
                return;
            }
            setStep(2);
        } else {
            if (name) {
                onSubmit(apiKey, supabaseUrl, supabaseKey, {
                    name,
                    subject,
                    school_level: schoolLevel,
                    school_name: schoolName
                });
            } else {
                alert('Vui lòng nhập tên của bạn');
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {step === 1 ? <Key size={28} className="text-teal-600" /> : <User size={28} className="text-teal-600" />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {step === 1 ? 'Thiết lập API Key' : '👤 Thông tin cá nhân'}
                    </h1>
                    <p className="text-gray-500">
                        {step === 1
                            ? 'Nhập API Key để kết nối với Gemini AI'
                            : 'Giúp AI hiểu rõ hơn về bạn để hỗ trợ tốt nhất'}
                    </p>
                </div>

                {step === 1 ? (
                    <div className="space-y-5">
                        {/* API Key Section */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                            <p className="text-sm text-amber-800 font-medium mb-2">📌 Hướng dẫn lấy API Key:</p>
                            <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
                                <li>Truy cập Google AI Studio</li>
                                <li>Đăng nhập bằng tài khoản Google</li>
                                <li>Nhấn "Create API Key"</li>
                                <li>Copy key và dán vào ô bên dưới</li>
                            </ol>
                            <a
                                href="https://aistudio.google.com/api-keys"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                            >
                                <ExternalLink size={12} />
                                Lấy API Key tại đây
                            </a>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Gemini API Key <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="AIzaSy... hoặc AQ..."
                            />
                            <p className="text-xs text-red-500 mt-1 font-medium">⚠️ Bắt buộc nhập API key để sử dụng app</p>
                        </div>

                        {/* Supabase Section - Optional */}
                        <details className="border border-gray-200 rounded-xl overflow-hidden">
                            <summary className="px-4 py-3 bg-gray-50 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                                🗄️ Kết nối Database (tùy chọn)
                            </summary>
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Supabase URL</label>
                                    <input
                                        type="text"
                                        value={supabaseUrl}
                                        onChange={(e) => setSupabaseUrl(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="https://xxx.supabase.co"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Supabase Anon Key</label>
                                    <input
                                        type="password"
                                        value={supabaseKey}
                                        onChange={(e) => setSupabaseKey(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                                        placeholder="eyJ..."
                                    />
                                </div>
                            </div>
                        </details>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Họ và tên <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Môn dạy</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    {['Toán', 'Văn', 'Tiếng Anh', 'Vật Lý', 'Hóa Học', 'Sinh Học', 'Lịch Sử', 'Địa Lý', 'GDCD', 'Tin Học', 'Công Nghệ', 'Khác'].map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cấp học</label>
                                <select
                                    value={schoolLevel}
                                    onChange={(e) => setSchoolLevel(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="TieuHoc">Tiểu Học</option>
                                    <option value="THCS">THCS</option>
                                    <option value="THPT">THPT</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trường (tùy chọn)</label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                                placeholder="THPT..."
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Quay lại
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="px-6 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors shadow-lg shadow-teal-200 flex items-center gap-2"
                    >
                        <Sparkles size={16} />
                        {step === 1 ? 'Tiếp theo' : 'Bắt đầu sử dụng'}
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    <div className={`w-8 h-1 rounded-full transition-colors ${step === 1 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                    <div className={`w-8 h-1 rounded-full transition-colors ${step === 2 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                </div>
            </div>
        </div>
    );
};
