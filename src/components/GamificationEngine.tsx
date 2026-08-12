import React, { useState } from 'react';
import { X, Sparkles, Eye, EyeOff, Gamepad2 } from 'lucide-react';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../data/teacherFeatures';
import { FileAttachmentWidget } from './FileAttachmentWidget';
import type { FileAttachment } from '../types';

interface GamificationEngineProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (prompt: string, files?: FileAttachment[]) => void;
}

const GAME_TYPES = [
    { id: 'khoi-dong', label: 'Khởi động đầu giờ', icon: '🚀', desc: 'Warm-up 3-5 phút' },
    { id: 'nhom', label: 'Hoạt động nhóm', icon: '👥', desc: 'Teamwork vui nhộn' },
    { id: 'ice-breaker', label: 'Ice-breaker', icon: '🧊', desc: 'Phá băng lớp học' },
    { id: 'review', label: 'Review Game', icon: '🎯', desc: 'Ôn bài dạng trò chơi' },
    { id: 'thi-dua', label: 'Thi đua đội', icon: '🏆', desc: 'Cạnh tranh lành mạnh' },
    { id: 'sang-tao', label: 'Sáng tạo tự do', icon: '🎨', desc: 'HS tự thiết kế' },
];

const TIME_SLOTS = ['3', '5', '10', '15', '20'];

export const GamificationEngine: React.FC<GamificationEngineProps> = ({ isOpen, onClose, onSubmit }) => {
    const [gameType, setGameType] = useState('khoi-dong');
    const [subject, setSubject] = useState('');
    const [grade, setGrade] = useState('');
    const [lessonName, setLessonName] = useState('');
    const [classSize, setClassSize] = useState('35');
    const [duration, setDuration] = useState('5');
    const [count, setCount] = useState('3');
    const [needProps, setNeedProps] = useState(false);
    const [canOnline, setCanOnline] = useState(false);
    const [notes, setNotes] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);

    const buildPrompt = () => {
        const gt = GAME_TYPES.find(t => t.id === gameType);
        let p = `Hãy tạo ${count} trò chơi/hoạt động dạng "${gt?.label}" cho lớp học.\n\n`;
        p += `## THÔNG TIN:\n- Môn: ${subject || 'Không giới hạn'}\n- Lớp: ${grade || 'Không giới hạn'}\n`;
        if (lessonName.trim()) p += `- Bài/Chủ đề: ${lessonName}\n`;
        p += `- Sĩ số: ${classSize} HS\n- Thời gian: ${duration} phút/trò chơi\n`;
        p += `- ${needProps ? 'CÓ THỂ dùng đạo cụ' : 'KHÔNG cần đạo cụ (chỉ dùng bảng, phấn, giấy)'}\n`;
        if (canOnline) p += '- Có thể chơi online (Kahoot/Quizizz/Mentimeter)\n';
        p += `\n## YÊU CẦU MỖI TRÒ CHƠI:\n`;
        p += `1. Tên trò chơi (sáng tạo, hấp dẫn)\n`;
        p += `2. Luật chơi chi tiết (từng bước)\n`;
        p += `3. Cách chia đội/nhóm\n`;
        p += `4. Cách tính điểm\n`;
        p += `5. Kết nối với nội dung bài học\n`;
        p += `6. Mẹo để trò chơi thành công\n`;
        if (attachedFiles.length > 0) {
            p += `\n## 📎 TÀI LIỆU THAM KHẢO:\nCó ${attachedFiles.length} file đính kèm (${attachedFiles.map(f => f.name).join(', ')}). Hãy dựa vào nội dung tài liệu để thiết kế trò chơi gắn liền với kiến thức bài học.\n`;
        }
        if (notes.trim()) p += `\nGhi chú: ${notes}\n`;
        p += '\nViết chi tiết, sinh động, có thể áp dụng ngay. Format Markdown đẹp.';
        return p;
    };

    const handleSubmit = () => {
        onSubmit(buildPrompt(), attachedFiles.length > 0 ? attachedFiles : undefined);
        onClose();
        setGameType('khoi-dong'); setSubject(''); setGrade(''); setLessonName('');
        setClassSize('35'); setDuration('5'); setCount('3');
        setNeedProps(false); setCanOnline(false); setNotes(''); setShowPreview(false);
        setAttachedFiles([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
            <div className="bg-white w-full sm:w-[90vw] sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-orange-500 to-amber-600 sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><Gamepad2 size={22} className="text-white" /></div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Trò chơi Khởi động & Nhóm</h2>
                            <p className="text-xs text-white/80">Tạo hoạt động vui nhộn cho lớp học</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} className="text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Loại hoạt động</label>
                        <div className="grid grid-cols-3 gap-2">
                            {GAME_TYPES.map(t => (
                                <button key={t.id} onClick={() => setGameType(t.id)} className={`flex flex-col items-center p-2.5 rounded-xl border transition-all ${gameType === t.id ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-200' : 'border-gray-200 hover:border-orange-200'}`}>
                                    <span className="text-xl mb-1">{t.icon}</span>
                                    <span className="text-[11px] font-semibold text-gray-800 text-center leading-tight">{t.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Môn học</label>
                            <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="">Không giới hạn</option>
                                {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Lớp</label>
                            <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                                <option value="">Không giới hạn</option>
                                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Bài/Chủ đề (tùy chọn)</label>
                        <input type="text" value={lessonName} onChange={e => setLessonName(e.target.value)} placeholder="VD: Phương trình bậc hai..." className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Sĩ số</label>
                            <input type="number" value={classSize} onChange={e => setClassSize(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Thời gian</label>
                            <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t} phút</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Số trò chơi</label>
                            <select value={count} onChange={e => setCount(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-orange-500">
                                {['1','2','3','4','5'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setNeedProps(!needProps)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${needProps ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            🎪 {needProps ? 'Có đạo cụ' : 'Không đạo cụ'}
                        </button>
                        <button onClick={() => setCanOnline(!canOnline)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${canOnline ? 'bg-orange-50 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            💻 {canOnline ? 'Có online' : 'Chỉ offline'}
                        </button>
                    </div>
                    <FileAttachmentWidget files={attachedFiles} onFilesChange={setAttachedFiles} accentColor="orange" />
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">Ghi chú</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="VD: Lớp năng động, thích cạnh tranh..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm resize-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    {showPreview && (
                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                            <p className="text-xs font-semibold text-gray-500 mb-1">👁️ Prompt:</p>
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap max-h-32 overflow-y-auto">{buildPrompt()}</pre>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-100 flex items-center gap-3">
                    <button onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium hover:bg-gray-200">
                        {showPreview ? <EyeOff size={14}/> : <Eye size={14}/>} {showPreview ? 'Ẩn' : 'Xem prompt'}
                    </button>
                    <div className="flex-1" />
                    <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">Hủy</button>
                    <button onClick={handleSubmit} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all">
                        <Sparkles size={16}/>Tạo Trò chơi
                    </button>
                </div>
            </div>
        </div>
    );
};
