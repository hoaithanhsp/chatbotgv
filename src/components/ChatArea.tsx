
import React, { useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
    messages: ChatMessage[];
    isTyping: boolean;
    onSendMessage: (text: string) => void;
    userName: string;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ messages, isTyping, onSendMessage, userName }) => {
    const [input, setInput] = React.useState('');
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
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    };

    return (
        <main className="flex-1 flex flex-col h-full bg-white relative">
            {/* Welcome Screen if no messages */}
            {messages.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <span className="text-4xl">🤖</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Xin chào, {userName || 'Thầy/Cô'}!
                    </h1>
                    <p className="text-gray-500 max-w-md mx-auto text-lg mb-8">
                        Tôi là trợ lý AI cá nhân của bạn. Hãy cho tôi biết bạn đang gặp vấn đề gì trong công việc giảng dạy?
                    </p>

                    <div className="grid md:grid-cols-3 gap-4 w-full max-w-4xl px-4">
                        {[
                            { icon: '📝', text: 'Tôi muốn soạn giáo án...' },
                            { icon: '📋', text: 'Tôi cần tạo đề thi...' },
                            { icon: '📚', text: 'Tôi muốn tạo tài liệu...' },
                        ].map((action, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSendMessage(action.text)}
                                className="flex flex-col items-center p-6 bg-white border border-gray-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all group text-left"
                            >
                                <span className="text-2xl mb-3 group-hover:scale-110 transition-transform">{action.icon}</span>
                                <span className="font-medium text-gray-700 group-hover:text-indigo-600">{action.text}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Messages List */}
            {messages.length > 0 && (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="min-h-full pb-32">
                        {messages.map((msg) => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}

                        {isTyping && (
                            <div className="flex gap-4 p-6 bg-gray-50 animate-in fade-in slide-in-from-bottom-2">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                    <Sparkles size={16} className="animate-pulse" />
                                </div>
                                <div className="flex items-center gap-1 bg-white px-4 py-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                    <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 pb-6 md:px-8 md:pb-8">
                <div className="max-w-4xl mx-auto relative group">
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                            adjustHeight();
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Nhập câu hỏi của bạn..."
                        className="w-full bg-white border border-gray-300 text-gray-900 rounded-2xl pl-6 pr-14 py-4 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none max-h-48 custom-scrollbar transition-all"
                        style={{ minHeight: '56px' }}
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isTyping}
                        className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all ${input.trim() && !isTyping
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isTyping ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">
                    AI có thể mắc lỗi. Hãy kiểm tra thông tin quan trọng.
                </p>
            </div>
        </main>
    );
};
