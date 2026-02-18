
import React, { useState } from 'react';
import { Plus, MessageCircle, Trash2, BookOpen, Bookmark, Settings, User, Search, Pencil, Check, X } from 'lucide-react';
import type { TeacherProfile, ChatSession } from '../types';

interface SidebarProps {
    profile: TeacherProfile | null;
    history: ChatSession[];
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onOpenSettings: () => void;
    currentChatId: string | null;
    onRenameChat: (id: string, newTitle: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onShowBookmarks: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    profile,
    history,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onOpenSettings,
    currentChatId,
    onRenameChat,
    searchQuery,
    onSearchChange,
    onShowBookmarks,
}) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');

    const startRename = (id: string, currentTitle: string) => {
        setEditingId(id);
        setEditTitle(currentTitle);
    };

    const confirmRename = () => {
        if (editingId && editTitle.trim()) {
            onRenameChat(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const cancelRename = () => {
        setEditingId(null);
    };

    return (
        <aside className="w-80 h-full flex flex-col bg-white/90 border-r border-teal-50/50 backdrop-blur-sm shadow-xl z-20 font-sans">
            {/* Profile Card */}
            <div className="p-5 border-b border-teal-50/50">
                <div className="flex items-center gap-3 bg-gradient-to-br from-teal-50 to-white p-3 rounded-2xl border border-teal-100 shadow-sm transition-all hover:shadow-md group">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-teal-200">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={22} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate text-base group-hover:text-teal-700 transition-colors">{profile?.name || 'Giáo viên'}</h3>
                        <p className="text-xs font-medium text-slate-500 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                            {profile?.subject ? `${profile.subject} - ${profile.school_level}` : 'Trực tuyến'}
                        </p>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-lg transition-all shadow-sm opacity-0 group-hover:opacity-100"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="px-5 pt-5 pb-3">
                <button
                    onClick={onNewChat}
                    className="w-full relative overflow-hidden group flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3.5 rounded-2xl font-semibold shadow-lg shadow-teal-200 transition-all hover:shadow-teal-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    <Plus size={20} className="relative z-10" />
                    <span className="relative z-10">Cuộc trò chuyện mới</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-5 pb-4">
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-500 transition-colors" size={16} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-100 focus:border-teal-500 focus:bg-white transition-all shadow-sm"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar pb-4">
                <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                    Lịch sử chat
                    <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px]">{history.length}</span>
                </h4>
                {history.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => editingId !== chat.id && onSelectChat(chat.id)}
                        className={`group relative flex items-center gap-3 p-3 mx-1 rounded-xl cursor-pointer transition-all duration-200 border ${currentChatId === chat.id
                            ? 'bg-teal-50/80 border-teal-100 text-teal-700 shadow-sm'
                            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                            }`}
                    >
                        {currentChatId === chat.id && (
                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-teal-500 rounded-r-full shadow-[0_0_8px_rgba(20,184,166,0.5)]"></div>
                        )}

                        <MessageCircle size={18} className={`shrink-0 transition-colors ${currentChatId === chat.id ? 'text-teal-600' : 'text-slate-400 group-hover:text-teal-500'}`} />

                        {editingId === chat.id ? (
                            <div className="flex-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
                                    className="flex-1 text-sm px-2 py-1 bg-white border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-100 outline-none shadow-sm"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); confirmRename(); }} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                    <Check size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="flex-1 truncate text-sm font-medium leading-relaxed">{chat.title}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity bg-gradient-to-l from-white/90 via-white/50 to-transparent pl-2 backdrop-blur-[1px]">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startRename(chat.id, chat.title); }}
                                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                        title="Đổi tên"
                                    >
                                        <Pencil size={13} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Xóa"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm gap-2 opacity-60">
                        <MessageCircle size={32} strokeWidth={1.5} />
                        <p>{searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử trò chuyện'}</p>
                    </div>
                )}
            </div>

            {/* Footer Nav */}
            <div className="p-4 border-t border-teal-50/50 bg-slate-50/50 backdrop-blur-sm">
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={onOpenSettings}
                        className="flex flex-col items-center justify-center p-3 hover:bg-white rounded-xl gap-1.5 transition-all text-slate-500 hover:text-teal-600 hover:shadow-sm border border-transparent hover:border-teal-100 group"
                    >
                        <BookOpen size={20} className="text-slate-400 group-hover:text-teal-500 transition-colors" />
                        <span className="text-xs font-semibold">Thư viện</span>
                    </button>
                    <button
                        onClick={onShowBookmarks}
                        className="flex flex-col items-center justify-center p-3 hover:bg-white rounded-xl gap-1.5 transition-all text-slate-500 hover:text-cyan-600 hover:shadow-sm border border-transparent hover:border-cyan-100 group"
                    >
                        <Bookmark size={20} className="text-slate-400 group-hover:text-cyan-500 transition-colors" />
                        <span className="text-xs font-semibold">Đã lưu</span>
                    </button>
                </div>
            </div>
        </aside>
    );
};
