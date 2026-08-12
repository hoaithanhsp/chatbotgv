import React, { useState } from 'react';
import { X, Sparkles, Eye, EyeOff, ClipboardList } from 'lucide-react';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../data/teacherFeatures';
import { FileAttachmentWidget } from './FileAttachmentWidget';
import type { FileAttachment } from '../types';

interface QuizMatrixGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string, files?: FileAttachment[]) => void;
}

const TIME_OPTIONS = ['15', '45', '60', '90', '120'];
const QUIZ_TYPES = [
    { id: 'tn-tl', label: 'TN + Tự luận', icon: '📋' },
    { id: 'tn', label: 'Trắc nghiệm', icon: '✅' },
    { id: 'tl', label: 'Tự luận', icon: '✍️' },
    { id: 'phan-hoa', label: 'Phân hóa 3 mức', icon: '📈' },
];

export const QuizMatrixGenerator: React.FC<QuizMatrixGeneratorProps> = ({ isOpen, onClose, onSubmit }) => {
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [time, setTime] = useState('45');
    const [quizType, setQuizType] = useState('tn-tl');
    const [tnCount, setTnCount] = useState('28');
    const [tlCount, setTlCount] = useState('4');
    const [content, setContent] = useState('');
    const [hasMatrix, setHasMatrix] = useState(true);
    const [hasSpec, setHasSpec] = useState(true);
    const [hasAnswer, setHasAnswer] = useState(true);
    const [levels, setLevels] = useState({ nb: 40, th: 30, vd: 20, vdc: 10 });
    const [notes, setNotes] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

    const buildPrompt = () => {
        const typeInfo = QUIZ_TYPES.find(t => t.id === quizType);
        let p = `Hãy tạo đề kiểm tra môn ${subject} ${grade}, thời gian ${time} phút.\n\n`;
        p += `## DẠNG ĐỀ: ${typeInfo?.label}\n`;
        if (quizType === 'tn-tl' || quizType === 'tn') p += `- Số câu trắc nghiệm: ${tnCount}\n`;
        if (quizType === 'tn-tl' || quizType === 'tl') p += `- Số câu tự luận: ${tlCount}\n`;
        if (quizType === 'phan-hoa') p += '- Tạo 3 đề: Cơ bản (yếu-TB), Nâng cao (khá), Thử thách (giỏi)\n';
        p += `\n## PHÂN BỔ MỨC ĐỘ:\n- Nhận biết: ${levels.nb}%\n- Thông hiểu: ${levels.th}%\n- Vận dụng: ${levels.vd}%\n- Vận dụng cao: ${levels.vdc}%\n`;
        p += `\n## PHẠM VI:\n${content || 'Toàn bộ chương trình'}\n`;
        const extras = [];
        if (hasMatrix) extras.push('Ma trận đề (bảng)');
        if (hasSpec) extras.push('Bảng đặc tả chi tiết');
        if (hasAnswer) extras.push('Đáp án + hướng dẫn chấm');
        if (extras.length > 0) p += `\n## YÊU CẦU THÊM:\n${extras.map(e => `- ${e}`).join('\n')}\n`;
        if (attachedFiles.length > 0) {
            p += `\n## 📎 TÀI LIỆU THAM KHẢO:\nCó ${attachedFiles.length} file đính kèm (${attachedFiles.map(f => f.name).join(', ')}). Hãy dựa vào nội dung tài liệu đính kèm để tạo đề thi chính xác, phù hợp.\n`;
        }
        if (notes.trim()) p += `\nGhi chú: ${notes}\n`;
        p += '\nViết ĐẦY ĐỦ toàn bộ câu hỏi, đáp án. Format Markdown đẹp, bảng rõ ràng.';
        return p;
    };

    const handleSubmit = () => {
        if (!subject || !grade) return;
        onSubmit(buildPrompt(), attachedFiles.length > 0 ? attachedFiles : undefined);
        onClose();
        setSubject(''); setGrade(''); setTime('45'); setQuizType('tn-tl');
        setTnCount('28'); setTlCount('4'); setContent(''); setNotes('');
        setHasMatrix(true); setHasSpec(true); setHasAnswer(true);
        setLevels({ nb: 40, th: 30, vd: 20, vdc: 10 }); setShowPreview(false);
        setAttachedFiles([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-purple-500 to-violet-600 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><ClipboardList size={22} className="text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Tạo Đề thi & Ma trận</h2>
                            <p className="text-xs text-white/80">Sinh đề tự động với ma trận NB-TH-VD-VDC</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} className="text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Môn học *</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                                <option value="">-- Chọn --</option>
                                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Lớp *</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500">
                                <option value="">-- Chọn --</option>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Thời gian</label>
                        <div className="flex gap-2">
                            {TIME_OPTIONS.map(t => (
                                <button key={t} onClick={() => setTime(t)} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${time === t ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t} phút</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Dạng đề</label>
                        <div className="grid grid-cols-2 gap-2">
                            {QUIZ_TYPES.map(t => (
                                <button key={t.id} onClick={() => setQuizType(t.id)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${quizType === t.id ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-200' : 'border-gray-200 hover:border-purple-200'}`}>
                                    <span className="text-lg">{t.icon}</span>
                                    <span className="text-sm font-semibold text-gray-800">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    {(quizType === 'tn-tl' || quizType === 'tn') && (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Số câu TN</label>
                                <input type="number" value={tnCount} onChange={e => setTnCount(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500" />
                            </div>
                            {quizType === 'tn-tl' && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Số câu TL</label>
                                    <input type="number" value={tlCount} onChange={e => setTlCount(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500" />
                                </div>
                            )}
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tỷ lệ mức độ (%)</label>
                        <div className="grid grid-cols-4 gap-2">
                            {([['nb','NB'],['th','TH'],['vd','VD'],['vdc','VDC']] as const).map(([key, label]) => (
                                <div key={key}>
                                    <span className="block text-[10px] text-gray-500 text-center mb-0.5">{label}</span>
                                    <input type="number" value={levels[key]} onChange={e => setLevels({...levels, [key]: parseInt(e.target.value)||0})} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-center focus:ring-2 focus:ring-purple-500" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phạm vi nội dung</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="VD: Chương 1-3, Hàm số bậc nhất..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 resize-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Bao gồm</label>
                        <div className="flex flex-wrap gap-2">
                            {[{v: hasMatrix, s: setHasMatrix, l: '📊 Ma trận'}, {v: hasSpec, s: setHasSpec, l: '📋 Đặc tả'}, {v: hasAnswer, s: setHasAnswer, l: '✅ Đáp án'}].map((o,i) => (
                                <button key={i} onClick={() => o.s(!o.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${o.v ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : 'bg-gray-100 text-gray-500'}`}>{o.l}</button>
                            ))}
                        </div>
                    </div>
                    <FileAttachmentWidget files={attachedFiles} onFilesChange={setAttachedFiles} accentColor="purple" />
                    {showPreview && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-1">👁️ Prompt:</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{subject && grade ? buildPrompt() : 'Điền thông tin...'}</pre>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                        {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>} {showPreview ? 'Ẩn' : 'Xem prompt'}
                    </button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Hủy</button>
                    <button onClick={handleSubmit} disabled={!subject || !grade} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        <Sparkles size={16}/>Tạo Đề thi
                    </button>
                </div>
            </div>
        </div>
    );
};
