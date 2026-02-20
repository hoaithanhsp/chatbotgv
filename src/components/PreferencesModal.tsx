
import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Download, Upload, Brain, MessageCircle, GraduationCap, Settings2, Sparkles } from 'lucide-react';
import {
    getPreferences, savePreferences, resetPreferences,
    exportProfile, importProfile, getStyleProfile, getPersonalizationScore,
    type TeacherPreferences, type ContentPreferences, type CommunicationStyle,
    type PedagogicalApproach, type TechnicalPreferences,
} from '../services/teacherPreferences';

interface PreferencesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabKey = 'content' | 'communication' | 'pedagogical' | 'technical';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'content', label: 'Nội dung', icon: <Brain size={16} /> },
    { key: 'communication', label: 'Giao tiếp', icon: <MessageCircle size={16} /> },
    { key: 'pedagogical', label: 'Sư phạm', icon: <GraduationCap size={16} /> },
    { key: 'technical', label: 'Kỹ thuật', icon: <Settings2 size={16} /> },
];

export const PreferencesModal: React.FC<PreferencesModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('content');
    const [prefs, setPrefs] = useState<TeacherPreferences>(getPreferences());
    const [saved, setSaved] = useState(false);
    const [importMsg, setImportMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPrefs(getPreferences());
            setSaved(false);
            setImportMsg('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const profile = getStyleProfile();
    const personalizationScore = getPersonalizationScore();

    const handleSave = () => {
        savePreferences(prefs);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleReset = () => {
        if (confirm('Bạn có chắc muốn khôi phục tất cả về mặc định? Dữ liệu chatbot đã học sẽ bị xóa.')) {
            resetPreferences();
            setPrefs(getPreferences());
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const success = await importProfile(file);
        if (success) {
            setPrefs(getPreferences());
            setImportMsg('✅ Nhập profile thành công!');
        } else {
            setImportMsg('❌ File không hợp lệ');
        }
        setTimeout(() => setImportMsg(''), 3000);
    };

    const updateContent = (update: Partial<ContentPreferences>) => {
        setPrefs(prev => ({ ...prev, contentPreferences: { ...prev.contentPreferences, ...update } }));
    };
    const updateComm = (update: Partial<CommunicationStyle>) => {
        setPrefs(prev => ({ ...prev, communicationStyle: { ...prev.communicationStyle, ...update } }));
    };
    const updatePedagogical = (update: Partial<PedagogicalApproach>) => {
        setPrefs(prev => ({ ...prev, pedagogicalApproach: { ...prev.pedagogicalApproach, ...update } }));
    };
    const updateTechnical = (update: Partial<TechnicalPreferences>) => {
        setPrefs(prev => ({ ...prev, technicalPreferences: { ...prev.technicalPreferences, ...update } }));
    };

    const hasLearned = (key: string) => profile.learnedInsights.some(i => i.key === key);

    const LearnedBadge = () => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full ml-2">
            <Sparkles size={10} /> AI đã học
        </span>
    );

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl text-white">
                            <Brain size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Sở thích cá nhân</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500">Độ cá nhân hóa:</span>
                                <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all" style={{ width: `${personalizationScore}%` }} />
                                </div>
                                <span className="text-xs font-bold text-purple-600">{personalizationScore}%</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100 px-5 gap-1">
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium rounded-t-lg transition-all ${activeTab === tab.key
                                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* TAB: Content Preferences */}
                    {activeTab === 'content' && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center">📝 Sở thích nội dung</h3>

                                {/* Document length */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">
                                        Độ dài tài liệu ưa thích
                                        {hasLearned('detail_low') || hasLearned('detail_high') ? <LearnedBadge /> : null}
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(['short', 'medium', 'long', 'very_long'] as const).map(len => {
                                            const labels = { short: 'Ngắn (200-400)', medium: 'Trung bình (400-700)', long: 'Dài (700-1000)', very_long: 'Rất dài (>1000)' };
                                            return (
                                                <button key={len} onClick={() => updateContent({ documentLength: len })}
                                                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${prefs.contentPreferences.documentLength === len
                                                        ? 'border-purple-300 bg-purple-50 text-purple-700 font-semibold shadow-sm'
                                                        : 'border-gray-200 text-gray-600 hover:border-purple-200'
                                                        }`}>
                                                    {labels[len]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Detail level */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">
                                        Mức độ chi tiết: <strong className="text-purple-600">{prefs.contentPreferences.detailLevel}/5</strong>
                                    </label>
                                    <input type="range" min={1} max={5} step={1}
                                        value={prefs.contentPreferences.detailLevel}
                                        onChange={e => updateContent({ detailLevel: parseInt(e.target.value) })}
                                        className="w-full accent-purple-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Tóm tắt</span><span>Rất chi tiết</span>
                                    </div>
                                </div>

                                {/* Structure preferences */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Cấu trúc ưa thích</label>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'useHeadings', label: 'Tiêu đề và phân đoạn rõ ràng' },
                                            { key: 'useLists', label: 'Danh sách và bullet points' },
                                            { key: 'useTables', label: 'Bảng biểu', learned: hasLearned('use_tables') },
                                            { key: 'useMindMaps', label: 'Sơ đồ tư duy' },
                                            { key: 'useImages', label: 'Hình ảnh minh họa', learned: hasLearned('use_images') },
                                            { key: 'useLatex', label: 'Công thức LaTeX', learned: hasLearned('use_latex') },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                    checked={(prefs.contentPreferences as any)[item.key]}
                                                    onChange={e => updateContent({ [item.key]: e.target.checked } as any)}
                                                    className="rounded accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{item.label}</span>
                                                {item.learned && <LearnedBadge />}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Difficulty distribution */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Phân bố độ khó câu hỏi</label>
                                    {(['nhan_biet', 'thong_hieu', 'van_dung', 'van_dung_cao'] as const).map(level => {
                                        const labels = { nhan_biet: 'Nhận biết', thong_hieu: 'Thông hiểu', van_dung: 'Vận dụng', van_dung_cao: 'Vận dụng cao' };
                                        const val = Math.round(prefs.contentPreferences.difficultyDistribution[level]);
                                        return (
                                            <div key={level} className="flex items-center gap-2 mb-1.5">
                                                <span className="text-[11px] text-gray-600 w-24 shrink-0">{labels[level]}</span>
                                                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all"
                                                        style={{ width: `${val}%` }} />
                                                </div>
                                                <span className="text-[11px] font-bold text-gray-500 w-8 text-right">{val}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Communication */}
                    {activeTab === 'communication' && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-bold text-gray-700 flex items-center">💬 Phong cách giao tiếp</h3>

                                {/* Formality slider */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">
                                        Tone giọng: <strong className="text-purple-600">
                                            {prefs.communicationStyle.formalityScore < 0.3 ? 'Trang trọng' :
                                                prefs.communicationStyle.formalityScore > 0.7 ? 'Thân thiện' : 'Trung lập'}
                                        </strong>
                                    </label>
                                    <input type="range" min={0} max={100} step={5}
                                        value={prefs.communicationStyle.formalityScore * 100}
                                        onChange={e => updateComm({ formalityScore: parseInt(e.target.value) / 100 })}
                                        className="w-full accent-purple-500"
                                    />
                                    <div className="flex justify-between text-[10px] text-gray-400">
                                        <span>Trang trọng</span><span>Thân thiện</span>
                                    </div>
                                </div>

                                {/* Address style */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Cách xưng hô</label>
                                    <div className="space-y-2">
                                        {([
                                            { value: 'ban', label: '"Bạn" (thân thiện)' },
                                            { value: 'thay_co', label: '"Thầy/Cô" (trang trọng)' },
                                            { value: 'anh_chi', label: '"Anh/Chị" (lịch sự)' },
                                        ] as const).map(opt => (
                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="address"
                                                    checked={prefs.communicationStyle.addressStyle === opt.value}
                                                    onChange={() => updateComm({ addressStyle: opt.value })}
                                                    className="accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Explanation length */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Độ dài giải thích</label>
                                    <div className="space-y-2">
                                        {([
                                            { value: 'short', label: 'Ngắn gọn, đi thẳng vào vấn đề' },
                                            { value: 'balanced', label: 'Cân bằng giữa ngắn gọn và chi tiết' },
                                            { value: 'detailed', label: 'Chi tiết, giải thích kỹ từng bước' },
                                        ] as const).map(opt => (
                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="explanation"
                                                    checked={prefs.communicationStyle.explanationLength === opt.value}
                                                    onChange={() => updateComm({ explanationLength: opt.value })}
                                                    className="accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Emoji */}
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox"
                                        checked={prefs.communicationStyle.useEmoji}
                                        onChange={e => updateComm({ useEmoji: e.target.checked })}
                                        className="rounded accent-purple-500"
                                    />
                                    <span className="text-xs text-gray-700">Sử dụng emoji để tăng tính thân thiện 😊</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* TAB: Pedagogical */}
                    {activeTab === 'pedagogical' && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-bold text-gray-700">🎓 Phương pháp sư phạm</h3>

                                {/* Teaching philosophy */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Triết lý giảng dạy</label>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'studentCentered', label: 'Lấy học sinh làm trung tâm' },
                                            { key: 'criticalThinking', label: 'Khuyến khích tư duy phản biện' },
                                            { key: 'realWorldConnection', label: 'Kết nối với thực tế' },
                                            { key: 'examFocused', label: 'Tập trung vào kỹ thuật làm bài thi' },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                    checked={(prefs.pedagogicalApproach as any)[item.key]}
                                                    onChange={e => updatePedagogical({ [item.key]: e.target.checked } as any)}
                                                    className="rounded accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Exercise types */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Loại bài tập ưa thích</label>
                                    <div className="space-y-2">
                                        {[
                                            { value: 'trac_nghiem', label: 'Bài tập trắc nghiệm' },
                                            { value: 'tu_luan', label: 'Bài tập tự luận' },
                                            { value: 'tinh_huong', label: 'Bài tập tình huống thực tế' },
                                            { value: 'du_an_nhom', label: 'Bài tập dự án nhóm' },
                                        ].map(item => (
                                            <label key={item.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                    checked={prefs.pedagogicalApproach.preferredExerciseTypes.includes(item.value)}
                                                    onChange={e => {
                                                        const types = e.target.checked
                                                            ? [...prefs.pedagogicalApproach.preferredExerciseTypes, item.value]
                                                            : prefs.pedagogicalApproach.preferredExerciseTypes.filter(t => t !== item.value);
                                                        updatePedagogical({ preferredExerciseTypes: types });
                                                    }}
                                                    className="rounded accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Assessment frequency */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Tần suất đánh giá</label>
                                    <div className="space-y-2">
                                        {([
                                            { value: 'per_lesson', label: 'Sau mỗi bài (thường xuyên)' },
                                            { value: 'per_chapter', label: 'Sau mỗi chương (định kỳ)' },
                                            { value: 'mid_final', label: 'Giữa kỳ và cuối kỳ' },
                                        ] as const).map(opt => (
                                            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="assessment"
                                                    checked={prefs.pedagogicalApproach.assessmentFrequency === opt.value}
                                                    onChange={() => updatePedagogical({ assessmentFrequency: opt.value })}
                                                    className="accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{opt.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: Technical */}
                    {activeTab === 'technical' && (
                        <div className="space-y-5">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                                <h3 className="text-sm font-bold text-gray-700">⚙️ Tùy chọn kỹ thuật</h3>

                                {/* File format */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Định dạng file ưa thích</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['docx', 'pdf', 'md', 'html'] as const).map(fmt => {
                                            const labels = { docx: 'Word (.docx)', pdf: 'PDF (.pdf)', md: 'Markdown (.md)', html: 'HTML (.html)' };
                                            return (
                                                <button key={fmt} onClick={() => updateTechnical({ preferredFileFormat: fmt })}
                                                    className={`px-3 py-2 text-xs rounded-lg border transition-all ${prefs.technicalPreferences.preferredFileFormat === fmt
                                                        ? 'border-purple-300 bg-purple-50 text-purple-700 font-semibold shadow-sm'
                                                        : 'border-gray-200 text-gray-600 hover:border-purple-200'
                                                        }`}>
                                                    {labels[fmt]}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Notifications */}
                                <div>
                                    <label className="text-xs font-medium text-gray-600 mb-2 block">Thông báo & tự động</label>
                                    <div className="space-y-2">
                                        {[
                                            { key: 'autoSaveDocuments', label: 'Tự động lưu tài liệu vào thư viện' },
                                            { key: 'autoBackupChat', label: 'Tự động sao lưu lịch sử chat' },
                                            { key: 'remindExams', label: 'Nhắc nhở khi có bài kiểm tra sắp tới' },
                                            { key: 'suggestMaterials', label: 'Gợi ý tài liệu dựa trên lịch giảng' },
                                            { key: 'weeklyReport', label: 'Báo cáo hàng tuần về hoạt động' },
                                        ].map(item => (
                                            <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox"
                                                    checked={(prefs.technicalPreferences as any)[item.key]}
                                                    onChange={e => updateTechnical({ [item.key]: e.target.checked } as any)}
                                                    className="rounded accent-purple-500"
                                                />
                                                <span className="text-xs text-gray-700">{item.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Profile Management */}
                            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 space-y-3 border border-purple-100">
                                <h3 className="text-sm font-bold text-purple-700">💾 Quản lý profile</h3>
                                <p className="text-[11px] text-gray-500">Xuất/nhập profile để sao lưu hoặc chuyển thiết bị.</p>
                                <div className="flex gap-2">
                                    <button onClick={exportProfile}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 transition-colors">
                                        <Download size={14} /> Xuất JSON
                                    </button>
                                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-purple-700 text-xs font-medium rounded-lg hover:bg-purple-50 transition-colors border border-purple-200 cursor-pointer">
                                        <Upload size={14} /> Nhập JSON
                                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                    </label>
                                </div>
                                {importMsg && <p className="text-xs font-medium">{importMsg}</p>}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-gray-100">
                    <button onClick={handleReset}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <RotateCcw size={14} /> Khôi phục mặc định
                    </button>
                    <div className="flex items-center gap-2">
                        <button onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                            Hủy
                        </button>
                        <button onClick={handleSave}
                            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
                            <Save size={14} /> {saved ? '✓ Đã lưu!' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
