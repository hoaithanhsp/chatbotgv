import type { ChatMessage, ChatSession } from '../types';

const SESSIONS_KEY = 'chat_sessions';
const MESSAGES_PREFIX = 'chat_messages_';
const BOOKMARKS_KEY = 'chat_bookmarks';

// ========== SESSIONS ==========

export const getSessions = (): ChatSession[] => {
    try {
        const raw = localStorage.getItem(SESSIONS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveSessions = (sessions: ChatSession[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const deleteSession = (id: string) => {
    const sessions = getSessions().filter(s => s.id !== id);
    saveSessions(sessions);
    localStorage.removeItem(MESSAGES_PREFIX + id);
};

export const renameSession = (id: string, title: string) => {
    const sessions = getSessions().map(s =>
        s.id === id ? { ...s, title } : s
    );
    saveSessions(sessions);
};

// ========== MESSAGES ==========

export const getMessages = (sessionId: string): ChatMessage[] => {
    try {
        const raw = localStorage.getItem(MESSAGES_PREFIX + sessionId);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveMessages = (sessionId: string, messages: ChatMessage[]) => {
    localStorage.setItem(MESSAGES_PREFIX + sessionId, JSON.stringify(messages));
};

// ========== AUTO TITLE ==========

export const generateTitle = (firstMessage: string): string => {
    // Take first 40 chars, clean up
    const clean = firstMessage.replace(/\n/g, ' ').trim();
    if (clean.length <= 40) return clean;
    return clean.substring(0, 40) + '...';
};

// ========== BOOKMARKS ==========

export interface BookmarkedMessage {
    id: string;
    sessionId: string;
    sessionTitle: string;
    message: ChatMessage;
    bookmarkedAt: string;
}

export const getBookmarks = (): BookmarkedMessage[] => {
    try {
        const raw = localStorage.getItem(BOOKMARKS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

export const saveBookmark = (sessionId: string, sessionTitle: string, message: ChatMessage) => {
    const bookmarks = getBookmarks();
    // Don't duplicate
    if (bookmarks.some(b => b.message.id === message.id)) return;
    bookmarks.unshift({
        id: Date.now().toString(),
        sessionId,
        sessionTitle,
        message,
        bookmarkedAt: new Date().toISOString(),
    });
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const removeBookmark = (messageId: string) => {
    const bookmarks = getBookmarks().filter(b => b.message.id !== messageId);
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
};

export const isBookmarked = (messageId: string): boolean => {
    return getBookmarks().some(b => b.message.id === messageId);
};
