import React, { useState } from 'react';
import { X, Sparkles, Eye, EyeOff, Presentation } from 'lucide-react';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../data/teacherFeatures';
import { FileAttachmentWidget } from './FileAttachmentWidget';
import type { FileAttachment } from '../types';

interface SlideOutlineGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string, files?: FileAttachment[]) => void;
}

const STYLES = [
    { id: 'minimalist', label: 'Tối giản', icon: '⬜', desc: 'Ít chữ, nhiều hình' },
    { id: 'colorful', label: 'Nhiều màu sắc', icon: '🌈', desc: 'Sinh động, vui tươi' },
    { id: 'academic', label: 'Học thuật', icon: '📐', desc: 'Chuẩn mực, trang trọng' },
    { id: 'interactive', label: 'Tương tác', icon: '🎯', desc: 'Nhiều câu hỏi, quiz' },
];

export const SlideOutlineGenerator: React.FC<SlideOutlineGeneratorProps> = ({ isOpen, onClose, onSubmit }) => {
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [lessonName, setLessonName] = useState('');
    const [slideCount, setSlideCount] = useState('10');
    const [style, setStyle] = useState('minimalist');
    const [hasInteractive, setHasInteractive] = useState(true);
    const [hasImages, setHasImages] = useState(true);
    const [hasSpeakerNotes, setHasSpeakerNotes] = useState(false);
    const [hasAnimation, setHasAnimation] = useState(false);
    const [notes, setNotes] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

    const buildPrompt = () => {
        const st = STYLES.find(s => s.id === style);
        let p = `Hãy tạo dàn ý slide ${slideCount} trang cho bài "${lessonName}" môn ${subject} ${grade}.\n\n`;
        p += `## PHONG CÁCH: ${st?.label} - ${st?.desc}\n\n`;
        p += `## YÊU CẦU MỖI TRANG SLIDE:\n`;
        p += `1. Tiêu đề slide\n`;
        p += `2. 3-5 ý chính (ngắn gọn, dễ đọc)\n`;
        if (hasInteractive) p += `3. 1 câu hỏi tương tác cho HS\n`;
        if (hasImages) p += `4. Gợi ý hình ảnh/icon minh họa\n`;
        if (hasSpeakerNotes) p += `5. Ghi chú cho GV (speaker notes)\n`;
        if (hasAnimation) p += `6. Gợi ý animation/chuyển slide\n`;
        p += `\n## CẤU TRÚC SLIDE:\n`;
        p += `- Slide 1: Trang bìa (tên bài, GV, lớp)\n`;
        p += `- Slide 2: Mục tiêu bài học\n`;
        p += `- Slide 3-${parseInt(slideCount)-2}: Nội dung chính\n`;
        p += `- Slide ${parseInt(slideCount)-1}: Tổng kết / Sơ đồ tư duy\n`;
        p += `- Slide ${slideCount}: Bài tập / Câu hỏi ôn tập\n`;
        if (attachedFiles.length > 0) {
            p += `\n## 📎 TÀI LIỆU THAM KHẢO:\nCó ${attachedFiles.length} file đính kèm (${attachedFiles.map(f => f.name).join(', ')}). Hãy dựa vào nội dung tài liệu để xây dựng slide chính xác, đầy đủ kiến thức.\n`;
        }
        if (notes.trim()) p += `\nGhi chú: ${notes}\n`;
        p += '\nViết CHI TIẾT nội dung từng slide. Format Markdown đẹp, dễ copy vào PowerPoint/Google Slides.';
        return p;
    };

    const handleSubmit = () => {
        if (!subject || !grade || !lessonName.trim()) return;
        onSubmit(buildPrompt(), attachedFiles.length > 0 ? attachedFiles : undefined);
        onClose();
        setSubject(''); setGrade(''); setLessonName(''); setSlideCount('10');
        setStyle('minimalist'); setHasInteractive(true); setHasImages(true);
        setHasSpeakerNotes(false); setHasAnimation(false); setNotes(''); setShowPreview(false);
        setAttachedFiles([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-blue-500 to-indigo-600 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><Presentation size={22} className="text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Thiết kế Slide Bài giảng</h2>
                            <p className="text-xs text-white/80">Tạo dàn ý slide chuyên nghiệp</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} className="text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Môn học *</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Chọn --</option>
                                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Lớp *</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="">-- Chọn --</option>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tên bài *</label>
                        <input type="text" value={lessonName} onChange={e => setLessonName(e.target.value)} placeholder="VD: Phương trình bậc hai..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Số trang: {slideCount}</label>
                        <input type="range" min="5" max="20" value={slideCount} onChange={e => setSlideCount(e.target.value)} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1"><span>5</span><span>10</span><span>15</span><span>20</span></div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Phong cách</label>
                        <div className="grid grid-cols-2 gap-2">
                            {STYLES.map(s => (
                                <button key={s.id} onClick={() => setStyle(s.id)} className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${style === s.id ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-200' : 'border-gray-200 hover:border-blue-200'}`}>
                                    <span className="text-lg">{s.icon}</span>
                                    <div><span className="text-sm font-semibold text-gray-800">{s.label}</span><p className="text-[11px] text-gray-500">{s.desc}</p></div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Tùy chọn</label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                {v: hasInteractive, s: setHasInteractive, l: '🎯 Câu hỏi tương tác'},
                                {v: hasImages, s: setHasImages, l: '🖼️ Gợi ý hình ảnh'},
                                {v: hasSpeakerNotes, s: setHasSpeakerNotes, l: '📝 Speaker notes'},
                                {v: hasAnimation, s: setHasAnimation, l: '✨ Animation'},
                            ].map((o,i) => (
                                <button key={i} onClick={() => o.s(!o.v)} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${o.v ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300' : 'bg-gray-100 text-gray-500'}`}>{o.l}</button>
                            ))}
                        </div>
                    </div>
                    <FileAttachmentWidget files={attachedFiles} onFilesChange={setAttachedFiles} accentColor="blue" />
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="VD: Thêm phần thí nghiệm ảo..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    {showPreview && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-1">👁️ Prompt:</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{subject && grade && lessonName ? buildPrompt() : 'Điền thông tin...'}</pre>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                        {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>} {showPreview ? 'Ẩn' : 'Xem prompt'}
                    </button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Hủy</button>
                    <button onClick={handleSubmit} disabled={!subject || !grade || !lessonName.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                        <Sparkles size={16}/>Tạo Slide
                    </button>
                </div>
            </div>
        </div>
    );
};
