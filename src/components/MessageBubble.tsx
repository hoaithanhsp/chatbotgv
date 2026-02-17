
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, Star } from 'lucide-react';
import type { ChatMessage } from '../types';
import { isBookmarked } from '../services/chatStorage';

interface MessageBubbleProps {
    message: ChatMessage;
    onBookmark?: (msg: ChatMessage) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onBookmark }) => {
    const isUser = message.role === 'user';
    const [copied, setCopied] = React.useState(false);
    const [starred, setStarred] = React.useState(() => isBookmarked(message.id));

    const handleCopy = () => {
        // Copy raw text (keeps LaTeX formulas as-is)
        navigator.clipboard.writeText(message.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleStar = () => {
        if (onBookmark) {
            onBookmark(message);
            setStarred(true);
        }
    };

    return (
        <div className={`flex gap-4 p-6 ${isUser ? 'bg-white' : 'bg-gray-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                {isUser ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div className="flex-1 max-w-3xl space-y-2 overflow-hidden">
                <div className="font-medium text-sm text-gray-900 mb-1">
                    {isUser ? 'Bạn' : 'Trợ lý GV'}
                    <span className="text-xs text-gray-400 font-normal ml-2">
                        {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                </div>

                <div className={`prose prose-sm max-w-none text-gray-700 leading-7 ${isUser ? 'whitespace-pre-wrap' : ''
                    }`}>
                    {isUser ? (
                        message.text
                    ) : (
                        <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[[rehypeKatex, { strict: false }]]}
                            components={{
                                h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-gray-900 mt-6 mb-4" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-gray-800 mt-5 mb-3" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-base font-bold text-gray-800 mt-4 mb-2" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-4 space-y-1" {...props} />,
                                li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                                p: ({ node, ...props }) => <p className="mb-4 last:mb-0" {...props} />,
                                // Table styling
                                table: ({ node, ...props }) => (
                                    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200">
                                        <table className="min-w-full divide-y divide-gray-200 text-sm" {...props} />
                                    </div>
                                ),
                                thead: ({ node, ...props }) => <thead className="bg-indigo-50" {...props} />,
                                tbody: ({ node, ...props }) => <tbody className="bg-white divide-y divide-gray-100" {...props} />,
                                tr: ({ node, ...props }) => <tr className="hover:bg-gray-50 transition-colors" {...props} />,
                                th: ({ node, ...props }) => (
                                    <th className="px-4 py-2.5 text-left font-semibold text-indigo-800 text-xs uppercase tracking-wider border-b-2 border-indigo-200" {...props} />
                                ),
                                td: ({ node, ...props }) => (
                                    <td className="px-4 py-2.5 text-gray-700 border-b border-gray-100" {...props} />
                                ),
                                code: ({ node, inline, className, children, ...props }: any) => {
                                    return !inline ? (
                                        <div className="bg-gray-900 rounded-lg p-4 my-4 overflow-x-auto text-gray-100 text-sm font-mono">
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        </div>
                                    ) : (
                                        <code className="bg-gray-100 text-red-500 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                                            {children}
                                        </code>
                                    )
                                },
                                blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 my-4 italic text-gray-600 bg-indigo-50/50 rounded-r-lg" {...props} />,
                                a: ({ node, ...props }) => <a className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                            }}
                        >
                            {message.text}
                        </ReactMarkdown>
                    )}
                </div>

                {!isUser && (
                    <div className="flex items-center gap-2 pt-2 mt-2 border-t border-gray-100">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
                            title="Sao chép (giữ nguyên LaTeX)"
                        >
                            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                            {copied ? 'Đã sao chép' : 'Sao chép'}
                        </button>
                        <button
                            onClick={handleStar}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${starred
                                ? 'text-yellow-600 bg-yellow-50'
                                : 'text-gray-500 hover:bg-gray-100'
                                }`}
                            title="Ghim tin nhắn"
                        >
                            <Star size={14} fill={starred ? 'currentColor' : 'none'} />
                            {starred ? 'Đã ghim' : 'Ghim'}
                        </button>
                        <div className="flex-1" />
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <ThumbsUp size={16} />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                            <ThumbsDown size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
