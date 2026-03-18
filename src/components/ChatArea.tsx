
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Send, Loader2, Sparkles, Zap, Mic, MicOff, Paperclip, X, FileIcon, ImageIcon, FileText, Film, Music } from 'lucide-react';
import type { ChatMessage, FileAttachment } from '../types';
import { MessageBubble } from './MessageBubble';
import { SLASH_COMMANDS, PROMPT_TEMPLATES } from '../data/promptTemplates';

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 10;

// Helper: convert File to FileAttachment
const fileToAttachment = (file: File): Promise<FileAttachment> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // result = "data:<mime>;base64,<data>"
            const base64 = result.split(',')[1] || '';
            const isImage = file.type.startsWith('image/');
            resolve({
                name: file.name,
                type: file.type || 'application/octet-stream',
                size: file.size,
                base64,
                isImage,
                previewUrl: isImage ? result : undefined,
            });
        };
        reader.onerror = () => reject(new Error(`Không thể đọc file: ${file.name}`));
        reader.readAsDataURL(file);
    });
};

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// Get icon for file type
const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon size={18} className="text-purple-500" />;
    if (type.startsWith('video/')) return <Film size={18} className="text-blue-500" />;
    if (type.startsWith('audio/')) return <Music size={18} className="text-pink-500" />;
    if (type.includes('pdf') || type.includes('document') || type.includes('text'))
        return <FileText size={18} className="text-orange-500" />;
    return <FileIcon size={18} className="text-gray-500" />;
};

interface ChatAreaProps {
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (text: string, attachments?: FileAttachment[]) => void;
    userName: string;
    onBookmark?: (msg: ChatMessage) => void;
    onOpenTemplates?: () => void;
    onOpenTemplatesWithCategory?: (category: string) => void;
    pendingInput?: string;
    onPendingInputConsumed?: () => void;
    onRegenerate?: (messageId: string) => void;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, onSendMessage, userName, onBookmark, onOpenTemplates, onOpenTemplatesWithCategory, pendingInput, onPendingInputConsumed, onRegenerate, onFeedback }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashFilter, setSlashFilter] = useState('');
    const [selectedSlashIdx, setSelectedSlashIdx] = useState(0);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // File attachments state
    const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [fileError, setFileError] = useState<string | null>(null);
    const dragCounterRef = useRef(0);

    // Web Speech API setup
    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            setInput(prev => {
                if (event.results[event.results.length - 1].isFinal) {
                    return prev + transcript + ' ';
                }
                return prev;
            });
        };

        recognition.onerror = () => {
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
    }, []);

    const toggleVoice = () => {
        if (!recognitionRef.current) return;
        if (isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        } else {
            recognitionRef.current.start();
            setIsListening(true);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Handle pending input from template selection
    useEffect(() => {
        if (pendingInput) {
            setInput(pendingInput);
            onPendingInputConsumed?.();
            setTimeout(() => {
                textareaRef.current?.focus();
                if (textareaRef.current) {
                    textareaRef.current.style.height = 'auto';
                    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 192) + 'px';
                }
            }, 100);
        }
    }, [pendingInput]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    // Clear file error after 5 seconds
    useEffect(() => {
        if (fileError) {
            const timer = setTimeout(() => setFileError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [fileError]);

    // ========== FILE HANDLING ==========
    const processFiles = async (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const newErrors: string[] = [];

        // Check total count
        if (attachedFiles.length + fileArray.length > MAX_FILES) {
            setFileError(`Tối đa ${MAX_FILES} file mỗi lần gửi. Bạn đã có ${attachedFiles.length} file.`);
            return;
        }

        const validFiles: File[] = [];
        for (const file of fileArray) {
            if (file.size > MAX_FILE_SIZE) {
                newErrors.push(`"${file.name}" vượt quá 20MB (${formatFileSize(file.size)})`);
            } else {
                validFiles.push(file);
            }
        }

        if (newErrors.length > 0) {
            setFileError(newErrors.join('. '));
        }

        if (validFiles.length === 0) return;

        try {
            const attachments = await Promise.all(validFiles.map(fileToAttachment));
            setAttachedFiles(prev => [...prev, ...attachments].slice(0, MAX_FILES));
        } catch (err: any) {
            setFileError(err.message || 'Lỗi khi đọc file');
        }
    };

    const removeFile = (index: number) => {
        setAttachedFiles(prev => prev.filter((_, i) => i !== index));
    };

    // Drag & Drop handlers
    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (e.dataTransfer.types.includes('Files')) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current = 0;
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    };

    // Paste handler (Ctrl+V for images)
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    imageFiles.push(file);
                }
            }
        }

        if (imageFiles.length > 0) {
            e.preventDefault(); // prevent pasting image as text
            processFiles(imageFiles);
        }
    };

    // File input handler
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Slash command filtering
    const filteredCommands = useMemo(() => {
        if (!slashFilter) return SLASH_COMMANDS;
        const q = slashFilter.toLowerCase();
        return SLASH_COMMANDS.filter(c =>
            c.command.toLowerCase().includes(q) ||
            c.title.toLowerCase().includes(q)
        );
    }, [slashFilter]);

    // Reset selected index when filter changes
    useEffect(() => {
        setSelectedSlashIdx(0);
    }, [slashFilter]);

    const handleInputChange = (value: string) => {
        setInput(value);

        if (value.startsWith('/')) {
            setShowSlashMenu(true);
            setSlashFilter(value.slice(1));
        } else {
            setShowSlashMenu(false);
            setSlashFilter('');
        }
    };

    const handleSelectSlashCommand = (templatePrompt: string) => {
        setInput(templatePrompt);
        setShowSlashMenu(false);
        setSlashFilter('');
        setTimeout(() => {
            textareaRef.current?.focus();
            adjustHeight();
        }, 50);
    };


    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && attachedFiles.length === 0) || isTyping) return;

        // Check if input is a slash command exactly
        const exactMatch = SLASH_COMMANDS.find(c => c.command === input.trim());
        if (exactMatch) {
            import('../data/promptTemplates').then(({ PROMPT_TEMPLATES }) => {
                const template = PROMPT_TEMPLATES.find(t => t.id === exactMatch.templateId);
                if (template) {
                    setInput(template.prompt);
                    setShowSlashMenu(false);
                    textareaRef.current?.focus();
                    setTimeout(adjustHeight, 50);
                }
            });
            return;
        }

        onSendMessage(input, attachedFiles.length > 0 ? attachedFiles : undefined);
        setInput('');
        setAttachedFiles([]);
        setShowSlashMenu(false);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Handle slash menu navigation
        if (showSlashMenu && filteredCommands.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedSlashIdx(prev => (prev + 1) % filteredCommands.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedSlashIdx(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                const selected = filteredCommands[selectedSlashIdx];
                if (selected) {
                    import('../data/promptTemplates').then(({ PROMPT_TEMPLATES }) => {
                        const template = PROMPT_TEMPLATES.find(t => t.id === selected.templateId);
                        if (template) {
                            handleSelectSlashCommand(template.prompt);
                        }
                    });
                }
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowSlashMenu(false);
                return;
            }
        }

        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 192) + 'px';
        }
    };


    return (
        <div
            className="relative w-full h-full bg-slate-50/50"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Drag overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-teal-500/10 backdrop-blur-sm z-50 flex items-center justify-center border-2 border-dashed border-teal-400 rounded-xl m-2 pointer-events-none">
                    <div className="text-center animate-in zoom-in-95 duration-200">
                        <div className="w-20 h-20 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Paperclip size={36} className="text-teal-600" />
                        </div>
                        <p className="text-teal-700 font-bold text-lg">Thả file vào đây</p>
                        <p className="text-teal-500 text-sm mt-1">Hỗ trợ tất cả định dạng • Tối đa 20MB/file</p>
                    </div>
                </div>
            )}

            {/* Scrollable content area */}
            <div
                className="absolute inset-0 bottom-[110px] overflow-y-auto custom-scrollbar scroll-smooth"
            >
                {/* Welcome Screen if no messages */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-full p-8 animate-in fade-in duration-500">
                        <div className="relative mb-8 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl ring-1 ring-slate-900/5">
                                <span className="text-5xl animate-bounce-slow">🤖</span>
                            </div>
                        </div>

                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-cyan-600 mb-4 text-center tracking-tight">
                            Xin chào, {userName || 'Thầy/Cô'}!
                        </h1>
                        <p className="text-slate-500 max-w-lg mx-auto text-lg mb-10 text-center leading-relaxed">
                            Tôi là trợ lý AI cá nhân của bạn. Hôm nay chúng ta sẽ cùng nhau soạn giáo án, tạo đề thi hay làm gì nhỉ?
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                            {[
                                { icon: '📝', title: 'Soạn giáo án', text: 'Hỗ trợ soạn giáo án chi tiết theo công văn mới', color: 'bg-teal-50 text-teal-600 border-teal-100 hover:border-teal-300', category: 'giao-an' },
                                { icon: '📋', title: 'Tạo đề thi', text: 'Tạo đề trắc nghiệm và tự luận có ma trận', color: 'bg-cyan-50 text-cyan-600 border-cyan-100 hover:border-cyan-300', category: 'de-thi' },
                                { icon: '💡', title: 'Ý tưởng dạy học', text: 'Gợi ý phương pháp dạy học tích cực', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300', category: 'phuong-phap' },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onOpenTemplatesWithCategory?.(action.category)}
                                    className={`flex flex-col items-start p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-1 ${action.color.split(' ')[3]}`}
                                >
                                    <div className={`p-3 rounded-xl mb-3 ${action.color.split(' ').slice(0, 2).join(' ')}`}>
                                        <span className="text-2xl">{action.icon}</span>
                                    </div>
                                    <span className="font-bold text-slate-800 mb-1">{action.title}</span>
                                    <span className="text-sm text-slate-500 text-left leading-snug">{action.text}</span>
                                </button>
                            ))}
                        </div>

                        {/* Templates CTA */}
                        {onOpenTemplates && (
                            <button
                                onClick={onOpenTemplates}
                                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-teal-700 rounded-full text-sm font-medium hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                            >
                                <Zap size={16} />
                                Xem tất cả Templates ({PROMPT_TEMPLATES.length}+)
                            </button>
                        )}
                    </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                    <div className="max-w-4xl mx-auto py-6 px-4">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} onBookmark={onBookmark} onRegenerate={onRegenerate} onFeedback={onFeedback} />
                        ))}

                        {isTyping && (
                            <div className="flex gap-4 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Sparkles size={18} className="animate-pulse" />
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                    <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-teal-600 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className={`absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-teal-50 p-4 z-10 transition-all duration-300 ${attachedFiles.length > 0 ? 'pb-3' : ''}`}>
                <div className="max-w-4xl mx-auto relative group">
                    {/* Slash Command Menu */}
                    {showSlashMenu && filteredCommands.length > 0 && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150 z-20">
                            <div className="px-3 py-2 border-b border-gray-100 bg-gray-50">
                                <span className="text-xs font-medium text-gray-500">⚡ Lệnh nhanh</span>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {filteredCommands.map((cmd, idx) => (
                                    <button
                                        key={cmd.command}
                                        onClick={() => {
                                            import('../data/promptTemplates').then(({ PROMPT_TEMPLATES }) => {
                                                const template = PROMPT_TEMPLATES.find(t => t.id === cmd.templateId);
                                                if (template) {
                                                    handleSelectSlashCommand(template.prompt);
                                                }
                                            });
                                        }}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === selectedSlashIdx
                                            ? 'bg-teal-50 border-l-2 border-teal-500'
                                            : 'hover:bg-gray-50 border-l-2 border-transparent'
                                            }`}
                                    >
                                        <span className="text-lg">{cmd.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-semibold text-teal-600">{cmd.command}</span>
                                                <span className="text-sm font-medium text-gray-800">{cmd.title}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{cmd.description}</p>
                                        </div>
                                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Enter ↵</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* File Error Message */}
                    {fileError && (
                        <div className="absolute bottom-full mb-2 left-0 right-0 bg-red-50 border border-red-200 rounded-xl shadow-sm px-4 py-3 animate-in fade-in slide-in-from-bottom-2 duration-150 z-20 flex items-start gap-2">
                            <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
                            <p className="text-sm text-red-600 flex-1">{fileError}</p>
                            <button onClick={() => setFileError(null)} className="text-red-400 hover:text-red-600 shrink-0">
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Attached Files Preview */}
                    {attachedFiles.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2 animate-in fade-in duration-200">
                            {attachedFiles.map((file, idx) => (
                                <div
                                    key={idx}
                                    className="relative group/file bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    {file.isImage && file.previewUrl ? (
                                        <div className="w-20 h-20 relative">
                                            <img
                                                src={file.previewUrl}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover/file:bg-black/20 transition-colors" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2.5 max-w-[200px]">
                                            {getFileIcon(file.type)}
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-gray-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-gray-400">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                    )}
                                    {/* Remove button */}
                                    <button
                                        onClick={() => removeFile(idx)}
                                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/file:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                                    >
                                        <X size={12} />
                                    </button>
                                    {/* File name tooltip for images */}
                                    {file.isImage && (
                                        <div className="px-2 py-1 bg-gray-50 border-t border-gray-100">
                                            <p className="text-[10px] text-gray-500 truncate">{file.name}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl opacity-20 group-focus-within:opacity-40 transition duration-300 blur"></div>
                    <div className="relative flex items-end gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                        {/* Template Button */}
                        {onOpenTemplates && (
                            <button
                                onClick={onOpenTemplates}
                                title="Kho Prompt Templates"
                                className="p-3 rounded-xl text-teal-500 hover:bg-teal-50 transition-colors mb-0.5 shrink-0"
                            >
                                <Zap size={20} />
                            </button>
                        )}

                        {/* Attach File Button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Đính kèm file (kéo thả hoặc Ctrl+V cho ảnh)"
                            className="p-3 rounded-xl text-gray-400 hover:text-teal-500 hover:bg-teal-50 transition-colors mb-0.5 shrink-0"
                        >
                            <Paperclip size={20} />
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileInputChange}
                            accept="*/*"
                        />

                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                handleInputChange(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            onPaste={handlePaste}
                            placeholder={attachedFiles.length > 0 ? "Thêm mô tả cho file đính kèm..." : "Nhập câu hỏi hoặc gõ / để dùng lệnh nhanh..."}
                            className="w-full max-h-48 bg-transparent border-0 text-slate-800 placeholder:text-slate-400 focus:ring-0 resize-none py-3 px-3 custom-scrollbar leading-relaxed"
                            style={{ minHeight: 44 }}
                        />
                        {/* Voice Input Button */}
                        <button
                            onClick={toggleVoice}
                            title={isListening ? 'Dừng ghi âm' : 'Nói để nhập văn bản'}
                            className={`p-3 rounded-xl transition-all duration-200 mb-0.5 shrink-0 ${isListening
                                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                                : 'text-gray-400 hover:text-teal-500 hover:bg-teal-50'
                                }`}
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                        <button
                            onClick={() => handleSubmit()}
                            disabled={(!input.trim() && attachedFiles.length === 0) || isTyping}
                            className={`p-3 rounded-xl transition-all duration-200 mb-0.5 shrink-0 ${(input.trim() || attachedFiles.length > 0) && !isTyping
                                ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-lg hover:shadow-teal-200 hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2 font-medium tracking-wide uppercase">
                        AI có thể mắc lỗi • Gõ <kbd className="bg-gray-100 px-1 rounded font-mono">/</kbd> để xem lệnh nhanh • <kbd className="bg-gray-100 px-1 rounded font-mono">Ctrl+V</kbd> để dán ảnh
                    </p>
                </div>
            </div>
        </div>
    );
};
