
import React from 'react';
import { Plus, MessageCircle, Trash2, BookOpen, Bookmark, Settings, User } from 'lucide-react';
import type { TeacherProfile, ChatSession } from '../types';

interface SidebarProps {
    profile: TeacherProfile | null;
    history: ChatSession[];
    onNewChat: () => void;
    onSelectChat: (id: string) => void;
    onDeleteChat: (id: string) => void;
    onOpenSettings: () => void;
    currentChatId: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
    profile,
    history,
    onNewChat,
    onSelectChat,
    onDeleteChat,
    onOpenSettings,
    currentChatId,
}) => {
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
            <div className="p-4">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-medium transition-all shadow-sm active:scale-95"
                >
                    <Plus size={20} />
                    Cuộc trò chuyện mới
                </button>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
                <h4 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Lịch sử chat</h4>
                {history.map((chat) => (
                    <div
                        key={chat.id}
                        onClick={() => onSelectChat(chat.id)}
                        className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${currentChatId === chat.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <MessageCircle size={18} className={currentChatId === chat.id ? 'text-indigo-600' : 'text-gray-400'} />
                        <span className="flex-1 truncate text-sm font-medium">{chat.title}</span>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
                {history.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                        Chưa có lịch sử trò chuyện
                    </div>
                )}
            </div>

            {/* Footer Nav */}
            <div className="p-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs font-medium text-gray-500">
                <button className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-lg gap-1 transition-colors">
                    <BookOpen size={20} className="text-gray-400 mb-1" />
                    Thư viện
                </button>
                <button className="flex flex-col items-center justify-center p-2 hover:bg-gray-50 rounded-lg gap-1 transition-colors">
                    <Bookmark size={20} className="text-gray-400 mb-1" />
                    Đã lưu
                </button>
            </div>
        </aside>
    );
};
