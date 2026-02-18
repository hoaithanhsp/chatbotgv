
import React, { useRef, useEffect, useState } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (text: string) => void;
    userName: string;
    onBookmark?: (msg: ChatMessage) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, onSendMessage, userName, onBookmark }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || isTyping) return;

        onSendMessage(input);
        setInput('');
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
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
        <div className="relative w-full h-full bg-slate-50/50">
            {/* Scrollable content area */}
            <div
                className="absolute inset-0 bottom-[110px] overflow-y-auto custom-scrollbar scroll-smooth"
            >
                {/* Welcome Screen if no messages */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center min-h-full p-8 animate-in fade-in duration-500">
                        <div className="relative mb-8 group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl ring-1 ring-slate-900/5">
                                <span className="text-5xl animate-bounce-slow">🤖</span>
                            </div>
                        </div>

                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-4 text-center tracking-tight">
                            Xin chào, {userName || 'Thầy/Cô'}!
                        </h1>
                        <p className="text-slate-500 max-w-lg mx-auto text-lg mb-10 text-center leading-relaxed">
                            Tôi là trợ lý AI cá nhân của bạn. Hôm nay chúng ta sẽ cùng nhau soạn giáo án, tạo đề thi hay làm gì nhỉ?
                        </p>

                        <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                            {[
                                { icon: '📝', title: 'Soạn giáo án', text: 'Hỗ trợ soạn giáo án chi tiết theo công văn mới', color: 'bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300' },
                                { icon: '📋', title: 'Tạo đề thi', text: 'Tạo đề trắc nghiệm và tự luận có ma trận', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300' },
                                { icon: '💡', title: 'Ý tưởng dạy học', text: 'Gợi ý phương pháp dạy học tích cực', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:border-amber-300' },
                            ].map((action, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onSendMessage(action.title)}
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
                    </div>
                )}

                {/* Messages */}
                {messages.length > 0 && (
                    <div className="max-w-4xl mx-auto py-6 px-4">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} onBookmark={onBookmark} />
                        ))}

                        {isTyping && (
                            <div className="flex gap-4 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                    <Sparkles size={18} className="animate-pulse" />
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-5 py-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-indigo-50 p-4 z-10 transition-all duration-300">
                <div className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl opacity-20 group-focus-within:opacity-40 transition duration-300 blur"></div>
                    <div className="relative flex items-end gap-2 p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <textarea
                            ref={textareaRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                                setInput(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi hoặc yêu cầu của thầy cô..."
                            className="w-full max-h-48 bg-transparent border-0 text-slate-800 placeholder:text-slate-400 focus:ring-0 resize-none py-3 px-3 custom-scrollbar leading-relaxed"
                            style={{ minHeight: 44 }}
                        />
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!input.trim() || isTyping}
                            className={`p-3 rounded-xl transition-all duration-200 mb-0.5 shrink-0 ${input.trim() && !isTyping
                                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2 font-medium tracking-wide uppercase">
                        AI có thể mắc lỗi • Hãy kiểm tra thông tin quan trọng
                    </p>
                </div>
            </div>
        </div>
    );
};
