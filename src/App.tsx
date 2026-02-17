
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SetupModal } from './components/SetupModal';
import { SettingsModal } from './components/SettingsModal';
import { DocumentManager } from './components/DocumentManager';
import { setGeminiApiKey, generateResponse, getGeminiApiKey, getAvailableModels, getSelectedModel, setSelectedModel } from './services/gemini';
import { setSupabaseConfig, getTeacherProfile, saveTeacherProfile as saveProfileService } from './services/supabase';
import { buildDocumentContext } from './services/documents';
import {
  getSessions, saveSessions, deleteSession, renameSession,
  getMessages, saveMessages, generateTitle,
  getBookmarks, saveBookmark, removeBookmark,
} from './services/chatStorage';
import { downloadMarkdown, downloadWord } from './services/exportChat';
import type { TeacherProfile, ChatSession, ChatMessage } from './types';
import { Menu, Settings, Key, Cpu, FileText, Download, Plus } from 'lucide-react';

// System Prompt Construction
const constructSystemPrompt = (profile: TeacherProfile, hasDocuments: boolean) => {
  return `Bạn là trợ lý AI thông minh và toàn diện dành cho giáo viên Việt Nam.

## VAI TRÒ
Bạn là một chuyên gia giáo dục, có thể:
- Hỗ trợ soạn giáo án, bài giảng, đề kiểm tra
- Tư vấn phương pháp giảng dạy hiện đại
- Gợi ý công cụ AI, phần mềm, website hữu ích từ BẤT KỲ nguồn nào (Google, Microsoft, Canva, Quizlet, Kahoot, ChatGPT, v.v.)
- Phân tích, tóm tắt, giải thích tài liệu giáo dục
- Trả lời câu hỏi chuyên môn liên quan đến việc dạy và học

## NGUYÊN TẮC
1. **Đa dạng nguồn**: KHÔNG giới hạn gợi ý ở một hệ thống/website cụ thể nào. Hãy gợi ý công cụ/tài nguyên TỐT NHẤT từ mọi nguồn (miễn phí, có phí đều được - ưu tiên miễn phí).
2. **Thực tế**: Đề xuất giải pháp thực tế, dễ áp dụng cho giáo viên Việt Nam.
3. **Cập nhật**: Ưu tiên kiến thức mới nhất về giáo dục, chương trình 2018, công nghệ giáo dục.
4. **Linh hoạt**: Nếu giáo viên đã upload tài liệu, hãy tham khảo và sử dụng nội dung đó một cách thông minh khi câu hỏi liên quan.
${hasDocuments ? '5. **Tài liệu**: Giáo viên đã cung cấp tài liệu tham khảo bên dưới. Hãy SỬ DỤNG LINH HOẠT nội dung này khi trả lời - trích dẫn, phân tích, tóm tắt theo yêu cầu.' : ''}

## PROFILE GIÁO VIÊN
- Tên: ${profile.name}
- Môn: ${profile.subject}
- Cấp: ${profile.school_level}
${profile.school_name ? `- Trường: ${profile.school_name}` : ''}

## ĐỊNH DẠNG TRẢ LỜI
- Sử dụng Markdown đẹp mắt (heading, bullet, bold, code block)
- Khi gợi ý công cụ/website, luôn kèm **link trực tiếp** nếu có
- Với mỗi gợi ý, nêu rõ: ưu điểm, cách sử dụng, độ phù hợp
- Trả lời bằng tiếng Việt thân thiện, chuyên nghiệp, dễ hiểu`;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModelState] = useState(getSelectedModel());
  const [showDocManager, setShowDocManager] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Load saved sessions on mount
  useEffect(() => {
    const apiKey = getGeminiApiKey();
    const userProfile = getTeacherProfile();

    if (!apiKey) {
      setShowSetup(true);
    } else if (userProfile) {
      setProfile(userProfile);

      // Load persisted sessions
      const savedSessions = getSessions();
      if (savedSessions.length > 0) {
        setChatHistory(savedSessions);
        const lastId = savedSessions[0].id;
        setCurrentChatId(lastId);
        setMessages(getMessages(lastId));
      } else {
        // First time — create initial chat
        const initId = Date.now().toString();
        const initSession: ChatSession = { id: initId, title: 'Chào mừng', created_at: new Date().toISOString() };
        const welcomeMsg: ChatMessage = {
          id: 'welcome', role: 'model',
          text: `Chào thầy/cô ${userProfile.name}! Tôi có thể giúp gì cho thầy/cô hôm nay?`,
          timestamp: new Date().toISOString(),
        };
        setChatHistory([initSession]);
        setCurrentChatId(initId);
        setMessages([welcomeMsg]);
        saveSessions([initSession]);
        saveMessages(initId, [welcomeMsg]);
      }
    }
    setLoading(false);
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
    }
  }, [messages, currentChatId]);

  const handleSetupComplete = (apiKey: string, sbUrl: string, sbKey: string, newProfile: TeacherProfile) => {
    setGeminiApiKey(apiKey);
    if (sbUrl && sbKey) {
      setSupabaseConfig(sbUrl, sbKey);
    }
    saveProfileService(newProfile);
    setProfile(newProfile);
    setShowSetup(false);

    const initId = Date.now().toString();
    const initSession: ChatSession = { id: initId, title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() };
    const welcomeMsg: ChatMessage = {
      id: 'welcome_setup', role: 'model',
      text: `Chào ${newProfile.name}! Hệ thống đã sẵn sàng. 🎉`,
      timestamp: new Date().toISOString(),
    };
    setChatHistory([initSession]);
    setCurrentChatId(initId);
    setMessages([welcomeMsg]);
    saveSessions([initSession]);
    saveMessages(initId, [welcomeMsg]);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedModelState(model);
  };

  const handleSendMessage = async (text: string) => {
    if (!profile || !currentChatId) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    // Auto-title: if this is the first user message, update title
    const isFirstUserMsg = messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMsg) {
      const newTitle = generateTitle(text);
      setChatHistory(prev => {
        const updated = prev.map(s => s.id === currentChatId ? { ...s, title: newTitle } : s);
        saveSessions(updated);
        return updated;
      });
    }

    try {
      const docContext = await buildDocumentContext(selectedDocIds);
      const systemPrompt = constructSystemPrompt(profile, selectedDocIds.length > 0) + docContext;

      const historyForGemini = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Tôi đã hiểu thông tin và tài liệu tham khảo. Tôi sẵn sàng hỗ trợ bạn." }] },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      ];

      const responseText = await generateResponse(historyForGemini, text);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error(error);
      const errDetail = error?.message || 'Lỗi không xác định';
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: `**⚠️ Lỗi:** ${errDetail}\n\nVui lòng kiểm tra:\n- API Key có đúng không?\n- Kết nối mạng có ổn không?\n- API Key đã hết quota chưa?\n\n👉 Nhấn nút **Settings (API Key)** trên Header để cập nhật.`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    // Save current chat before switching
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
    }
    const newId = Date.now().toString();
    const newSession: ChatSession = { id: newId, title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() };
    setChatHistory(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setCurrentChatId(newId);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectChat = useCallback((id: string) => {
    // Save current messages before switching
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
    }
    setCurrentChatId(id);
    setMessages(getMessages(id));
    setSidebarOpen(false);
  }, [currentChatId, messages]);

  const handleDeleteChat = useCallback((id: string) => {
    deleteSession(id);
    setChatHistory(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveSessions(updated);
      if (id === currentChatId) {
        if (updated.length > 0) {
          setCurrentChatId(updated[0].id);
          setMessages(getMessages(updated[0].id));
        } else {
          handleNewChat();
        }
      }
      return updated;
    });
  }, [currentChatId]);

  const handleRenameChat = useCallback((id: string, newTitle: string) => {
    renameSession(id, newTitle);
    setChatHistory(prev => {
      const updated = prev.map(s => s.id === id ? { ...s, title: newTitle } : s);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const handleBookmarkMessage = useCallback((msg: ChatMessage) => {
    const session = chatHistory.find(s => s.id === currentChatId);
    saveBookmark(currentChatId || '', session?.title || '', msg);
  }, [currentChatId, chatHistory]);

  const handleRemoveBookmark = useCallback((messageId: string) => {
    removeBookmark(messageId);
  }, []);

  // Export handlers
  const handleExportMarkdown = () => {
    const session = chatHistory.find(s => s.id === currentChatId);
    downloadMarkdown(session?.title || 'chat', messages);
    setShowExportMenu(false);
  };

  const handleExportWord = async () => {
    const session = chatHistory.find(s => s.id === currentChatId);
    await downloadWord(session?.title || 'chat', messages);
    setShowExportMenu(false);
  };

  // Filtered chat history for search
  const filteredHistory = searchQuery.trim()
    ? chatHistory.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatHistory;

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">

      {/* === PERSISTENT HEADER === */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 z-30">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Cpu size={20} className="text-indigo-600" />
          <span className="font-bold text-gray-900">Trợ lý GV</span>
        </div>

        {/* New Chat Button - Always visible */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm active:scale-95"
        >
          <Plus size={15} />
          <span className="hidden sm:inline">Mới</span>
        </button>

        {/* Model Selector */}
        <div className="hidden sm:flex items-center gap-1 ml-4 bg-gray-100 rounded-lg p-0.5">
          {getAvailableModels().map(model => (
            <button
              key={model}
              onClick={() => handleModelChange(model)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${selectedModel === model
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
            >
              {model.replace('gemini-', '').replace('-preview', '')}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Export Button */}
        {messages.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs font-medium"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Tải xuống</span>
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-52 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={handleExportMarkdown}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">📝</span>
                    <div>
                      <div className="font-medium text-gray-900">Markdown (.md)</div>
                      <div className="text-xs text-gray-500">Dạng văn bản thuần</div>
                    </div>
                  </button>
                  <button
                    onClick={handleExportWord}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">📄</span>
                    <div>
                      <div className="font-medium text-gray-900">Word (.docx)</div>
                      <div className="text-xs text-gray-500">Có định dạng đẹp</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Documents Button */}
        <button
          onClick={() => setShowDocManager(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors text-xs font-medium"
        >
          <FileText size={15} />
          <span className="hidden sm:inline">Tài liệu</span>
          {selectedDocIds.length > 0 && (
            <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {selectedDocIds.length}
            </span>
          )}
        </button>

        {/* Settings / API Key Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
        >
          <Key size={16} className="text-gray-500 group-hover:text-indigo-600" />
          <span className="text-xs font-medium text-red-500 hidden sm:inline">Lấy API key để sử dụng app</span>
          <Settings size={14} className="text-gray-400" />
        </button>
      </header>

      {/* === MAIN LAYOUT === */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar - Desktop: always visible, Mobile: slide-in overlay */}
        <div className="hidden md:flex md:relative md:top-0 w-80 bg-white shrink-0 h-full">
          <Sidebar
            profile={profile}
            history={filteredHistory}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onOpenSettings={() => setShowSettings(true)}
            onRenameChat={handleRenameChat}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onShowBookmarks={() => setShowBookmarks(true)}
          />
        </div>
        {/* Mobile Sidebar */}
        <div className={`fixed inset-y-0 left-0 top-14 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            profile={profile}
            history={filteredHistory}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onOpenSettings={() => setShowSettings(true)}
            onRenameChat={handleRenameChat}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onShowBookmarks={() => setShowBookmarks(true)}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Mobile Model Selector */}
          <div className="sm:hidden flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto">
            {getAvailableModels().map(model => (
              <button
                key={model}
                onClick={() => handleModelChange(model)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-all ${selectedModel === model
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
              >
                {model.replace('gemini-', '').replace('-preview', '')}
              </button>
            ))}
          </div>

          <ChatArea
            messages={messages}
            isTyping={isTyping}
            onSendMessage={handleSendMessage}
            userName={profile?.name || ''}
            onBookmark={handleBookmarkMessage}
          />
        </div>
      </div>

      {/* === MODALS === */}
      {showSetup && (
        <>
          <div className="fixed inset-0 z-50 bg-white" />
          <SetupModal onSubmit={handleSetupComplete} />
        </>
      )}

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={(key, url, sbKey) => {
          setGeminiApiKey(key);
          if (url && sbKey) {
            setSupabaseConfig(url, sbKey);
          }
        }}
      />

      <DocumentManager
        isOpen={showDocManager}
        onClose={() => setShowDocManager(false)}
        selectedDocIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
      />

      {/* Bookmarks Modal */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBookmarks(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">⭐ Tin nhắn đã lưu</h2>
              <button onClick={() => setShowBookmarks(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <span className="text-gray-500 text-xl">✕</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {getBookmarks().length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-4xl mb-3">📌</p>
                  <p>Chưa có tin nhắn nào được ghim.</p>
                  <p className="text-sm mt-1">Nhấn nút ⭐ trên tin nhắn AI để ghim.</p>
                </div>
              ) : (
                getBookmarks().map(b => (
                  <div key={b.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{b.sessionTitle}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(b.bookmarkedAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <button
                        onClick={() => { handleRemoveBookmark(b.message.id); setShowBookmarks(false); setTimeout(() => setShowBookmarks(true), 50); }}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Bỏ ghim
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">{b.message.text.substring(0, 300)}{b.message.text.length > 300 ? '...' : ''}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
