import React, { useState } from 'react';
import { X, Sparkles, Eye, EyeOff, BookOpen } from 'lucide-react';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../data/teacherFeatures';

interface LessonPlanBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string) => void;
}

const MODELS = [
    { id: 'cv5512', label: 'Công văn 5512', icon: '📝', desc: '4 hoạt động chuẩn' },
    { id: 'stem', label: 'STEM', icon: '🔬', desc: 'Tích hợp liên môn' },
    { id: '5e', label: 'Mô hình 5E', icon: '🔄', desc: 'Engage→Evaluate' },
    { id: 'pbl', label: 'Dự án PBL', icon: '🎯', desc: 'Project-Based' },
];

const EXTRAS = [
    { id: 'cntt', label: 'Tích hợp CNTT', icon: '💻' },
    { id: 'phan-hoa', label: 'Phân hóa HS', icon: '🎯' },
    { id: 'danh-gia', label: 'Đánh giá TX', icon: '📊' },
    { id: 'phieu-ht', label: 'Phiếu học tập', icon: '📄' },
    { id: 'rubric', label: 'Rubric', icon: '✅' },
];

export const LessonPlanBuilder: React.FC<LessonPlanBuilderProps> = ({ isOpen, onClose, onSubmit }) => {
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [lessonName, setLessonName] = useState('');
    const [periods, setPeriods] = useState('1');
    const [model, setModel] = useState('cv5512');
    const [extras, setExtras] = useState<string[]>([]);
    const [notes, setNotes] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const toggleExtra = (id: string) => {
        setExtras(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const buildPrompt = () => {
        const m = MODELS.find(x => x.id === model);
        const extLabels = extras.map(id => EXTRAS.find(o => o.id === id)?.label).filter(Boolean);
        let p = `Hãy soạn giáo án chi tiết bài "${lessonName}" môn ${subject} ${grade}, ${periods} tiết.\n\nMô hình: ${m?.label}.\n`;
        if (model === 'cv5512') p += 'Theo CV 5512: Khởi động → Hình thành kiến thức → Luyện tập → Vận dụng. Mỗi hoạt động ghi rõ Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện.\n';
        else if (model === 'stem') p += 'STEM: Xác định vấn đề → Nghiên cứu → Giải pháp → Thực hiện → Đánh giá.\n';
        else if (model === '5e') p += '5E: Engage–Explore–Explain–Elaborate–Evaluate. Mỗi E có mục tiêu, thời lượng, câu hỏi dẫn dắt.\n';
        else p += 'PBL: Câu hỏi dẫn dắt, kế hoạch, phân nhóm, sản phẩm, rubric.\n';
        p += '\nYêu cầu: Mục tiêu (kiến thức, năng lực, phẩm chất), thiết bị, tiến trình CHI TIẾT (có thời gian).\n';
        if (extLabels.length > 0) p += `\nTích hợp thêm: ${extLabels.join(', ')}.\n`;
        if (notes.trim()) p += `\nGhi chú: ${notes}\n`;
        p += '\nViết HOÀN CHỈNH, chi tiết, format Markdown đẹp.';
        return p;
    };

    const handleSubmit = () => {
        if (!subject || !grade || !lessonName.trim()) return;
        onSubmit(buildPrompt());
        onClose();
        setSubject(''); setGrade(''); setLessonName(''); setPeriods('1');
        setModel('cv5512'); setExtras([]); setNotes(''); setShowPreview(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-teal-500 to-emerald-600 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><BookOpen size={22} className="text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Thiết kế Giáo án Chuẩn</h2>
                            <p className="text-xs text-white/80">Nhập thông tin → AI soạn hoàn chỉnh</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} className="text-white" /></button>
                </div>
                {/* Form */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Môn học *</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500">
                                <option value="">-- Chọn --</option>
                                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Lớp *</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500">
                                <option value="">-- Chọn --</option>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên bài *</label>
                        <input type="text" value={lessonName} onChange={e => setLessonName(e.target.value)} placeholder="VD: Phương trình bậc hai..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Số tiết</label>
                        <div className="flex gap-2">
                            {['1','2','3','4'].map(p => (
                                <button key={p} onClick={() => setPeriods(p)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${periods === p ? 'bg-teal-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p} tiết</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Mô hình dạy học</label>
                        <div className="grid grid-cols-2 gap-2">
                            {MODELS.map(m => (
                                <button key={m.id} onClick={() => setModel(m.id)} className={`flex items-center gap-2 p-3 rounded-xl text-left border transition-all ${model === m.id ? 'bg-teal-50 border-teal-300 ring-1 ring-teal-200' : 'border-gray-200 hover:border-teal-200'}`}>
                                    <span className="text-lg">{m.icon}</span>
                                    <div><span className="text-sm font-semibold text-gray-800">{m.label}</span><p className="text-[11px] text-gray-500">{m.desc}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tùy chọn</label>
                        <div className="flex flex-wrap gap-2">
                            {EXTRAS.map(o => (
                                <button key={o.id} onClick={() => toggleExtra(o.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${extras.includes(o.id) ? 'bg-teal-100 text-teal-700 ring-1 ring-teal-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    <span>{o.icon}</span>{o.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Yêu cầu riêng..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 resize-none" />
                    </div>
                    {showPreview && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-1">👁️ Prompt:</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{subject && grade && lessonName ? buildPrompt() : 'Điền đầy đủ thông tin...'}</pre>
                        </div>
                    )}
                </div>
                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                        {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>} {showPreview ? 'Ẩn' : 'Xem prompt'}
                    </button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Hủy</button>
                    <button onClick={handleSubmit} disabled={!subject || !grade || !lessonName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        <Sparkles size={16}/>Tạo Giáo án
                    </button>
                </div>
            </div>
        </div>
    );
};
