
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
        <aside className="w-80 bg-white border-r border-gray-200 flex flex-col h-full hidden md:flex font-sans">
            {/* Profile Card */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-xl">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : <User size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{profile?.name || 'Giáo viên'}</h3>
                        <p className="text-xs text-indigo-600 truncate">{profile?.subject || 'Chưa cập nhật'} - {profile?.school_level || ''}</p>
                    </div>
                    <button
                        onClick={onOpenSettings}
                        className="p-1.5 text-gray-500 hover:bg-white hover:text-indigo-600 rounded-lg transition-colors"
                    >
                        <Settings size={18} />
                    </button>
                </div>
            </div>

            {/* New Chat Button */}
            <div className="p-4 pb-2">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-sm active:scale-95"
                >
                    <Plus size={20} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            {/* Search Bar */}
            <div className="px-4 pb-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder="Tìm cuộc trò chuyện..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => onSearchChange('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                <h4 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lịch sử chat</h4>
                {history.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => editingId !== chat.id && onSelectChat(chat.id)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <MessageCircle size={18} className={currentChatId === chat.id ? 'text-indigo-600' : 'text-gray-400'} />

                        {editingId === chat.id ? (
                            <div className="flex-1 flex items-center gap-1">
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
                                    className="flex-1 text-sm px-2 py-1 border border-indigo-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <button onClick={(e) => { e.stopPropagation(); confirmRename(); }} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                    <Check size={14} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <span className="flex-1 truncate text-sm font-medium">{chat.title}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startRename(chat.id, chat.title); }}
                                        className="p-1 text-gray-400 hover:text-indigo-500 rounded transition-colors"
                                        title="Đổi tên"
                                    >
                                        <Pencil size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                                        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
                                        title="Xóa"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        {searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có lịch sử trò chuyện'}
                    </div>
                )}
            </div>

            {/* Footer Nav */}
            <div className="p-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs font-medium text-gray-500">
                <button
                    onClick={onOpenSettings}
                    className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-lg gap-1 transition-colors"
                >
                    <BookOpen size={20} className="text-gray-400 mb-1" />
                    Thư viện
                </button>
                <button
                    onClick={onShowBookmarks}
                    className="flex flex-col items-center justify-center p-2 hover:bg-indigo-50 rounded-lg gap-1 transition-colors hover:text-indigo-600"
                >
                    <Bookmark size={20} className="text-gray-400 mb-1" />
                    Đã lưu
                </button>
            </div>
        </aside>
    );
};
