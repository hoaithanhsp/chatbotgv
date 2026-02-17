
import React, { useState } from 'react';
import type { TeacherProfile } from '../types';

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
            if (apiKey && supabaseUrl && supabaseKey) setStep(2);
            else alert('Vui lòng điền đầy đủ thông tin API');
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 animate-in zoom-in-95 duration-300">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {step === 1 ? '🔧 Cấu hình hệ thống' : '👤 Thông tin cá nhân'}
                    </h1>
                    <p className="text-gray-500">
                        {step === 1
                            ? 'Kết nối với Gemini AI và Database để bắt đầu'
                            : 'Giúp AI hiểu rõ hơn về bạn để hỗ trợ tốt nhất'}
                    </p>
                </div>

                {step === 1 ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="AIza..."
                            />
                            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">
                                Lấy API Key miễn phí
                            </a>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supabase URL</label>
                            <input
                                type="text"
                                value={supabaseUrl}
                                onChange={(e) => setSupabaseUrl(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="https://xxx.supabase.co"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Supabase Anon Key</label>
                            <input
                                type="password"
                                value={supabaseKey}
                                onChange={(e) => setSupabaseKey(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="eyJ..."
                            />
                            <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">
                                Tạo project Supabase miễn phí
                            </a>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Môn dạy</label>
                                <select
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                >
                                    <option value="THCS">THCS</option>
                                    <option value="THPT">THPT</option>
                                    <option value="TieuHoc">Tiểu Học</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trường (tùy chọn)</label>
                            <input
                                type="text"
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="THPT..."
                            />
                        </div>
                    </div>
                )}

                <div className="mt-8 flex justify-end gap-3">
                    {step === 2 && (
                        <button
                            onClick={() => setStep(1)}
                            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Quay lại
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
                    >
                        {step === 1 ? 'Tiếp theo' : 'Hoàn thành'}
                    </button>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-center gap-2 mt-6">
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                    <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                </div>
            </div>
        </div>
    );
};
