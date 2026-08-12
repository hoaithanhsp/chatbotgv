
import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { LoginScreen } from './components/LoginScreen';
import { SetupModal } from './components/SetupModal';
import { SettingsModal } from './components/SettingsModal';
import { DocumentManager } from './components/DocumentManager';
import { PromptTemplatePanel } from './components/PromptTemplatePanel';
import { DashboardModal } from './components/DashboardModal';
import { OnboardingTour, shouldShowOnboarding } from './components/OnboardingTour';
import SKKNEditorApp from './skkn/SKKNEditorApp';
import { LessonPlanBuilder } from './components/LessonPlanBuilder';
import { QuizMatrixGenerator } from './components/QuizMatrixGenerator';
import { GamificationEngine } from './components/GamificationEngine';
import { SlideOutlineGenerator } from './components/SlideOutlineGenerator';
import { generateResponse, getGeminiApiKey, getAvailableModels, getSelectedModel, setSelectedModel } from './services/gemini';
import type { GeminiPart } from './services/gemini';
import { setSupabaseConfig, getTeacherProfile, saveTeacherProfile as saveProfileService } from './services/supabase';
import { getCurrentUser, logout as authLogout } from './services/authService';
import type { AuthSession } from './services/authService';
import { buildDocumentContext } from './services/documents';
import { processFilesForGemini } from './services/fileProcessor';
import { initDarkMode, toggleDarkMode, isDarkMode } from './services/darkMode';
import {
  getSessions, saveSessions, deleteSession, renameSession,
  getMessages, saveMessages, generateTitle,
  getBookmarks, saveBookmark, removeBookmark,
  autoDetectTags, updateSessionFolder,
} from './services/chatStorage';
import { downloadMarkdown, downloadWord, downloadPdf } from './services/exportChat';
import type { TeacherProfile, ChatSession, ChatMessage, FileAttachment } from './types';
import { Menu, Settings, Key, Cpu, FileText, Download, Plus, Moon, Sun, Globe, LogOut } from 'lucide-react';

import { RECOMMENDED_AI_TOOLS } from './data/aiTools';

// AI language options
const AI_LANGUAGES: { code: string; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
];

// System Prompt Construction
const constructSystemPrompt = (profile: TeacherProfile, hasDocuments: boolean, aiLang: string = 'vi') => {
  const toolsList = RECOMMENDED_AI_TOOLS.map(t => `- **${t.name}**: ${t.description} (Link: ${t.url})`).join('\n');
  const langInstruction = aiLang !== 'vi'
    ? `\n\n## NGÔN NGỮ TRẢ LỜI\nHãy trả lời TOÀN BỘ bằng ${AI_LANGUAGES.find(l => l.code === aiLang)?.label || aiLang}. Dù user hỏi bằng tiếng Việt, bạn vẫn phải trả lời bằng ${AI_LANGUAGES.find(l => l.code === aiLang)?.label || aiLang}.`
    : '';

  return `Bạn là trợ lý AI thông minh và toàn diện dành cho giáo viên Việt Nam.

## VAI TRÒ
Bạn là một chuyên gia giáo dục, có thể:
- Hỗ trợ soạn giáo án, bài giảng, đề kiểm tra
- Tư vấn phương pháp giảng dạy hiện đại
- Gợi ý công cụ AI, phần mềm, website hữu ích
- Phân tích, tóm tắt, giải thích tài liệu giáo dục
- Trả lời câu hỏi chuyên môn liên quan đến việc dạy và học

## DANH SÁCH CÔNG CỤ AI ĐỀ XUẤT (ƯU TIÊN GIỚI THIỆU)
Dưới đây là danh sách các công cụ AI hữu ích mà bạn nên ưu tiên giới thiệu khi phù hợp với ngữ cảnh:
${toolsList}

## NGUYÊN TẮC
1. **Đa dạng nguồn**: Ngoài danh sách trên, bạn vẫn có thể gợi ý công cụ khác từ Google, Microsoft, Canva, v.v. nếu phù hợp hơn.
2. **Thực tế**: Đề xuất giải pháp thực tế, dễ áp dụng cho giáo viên Việt Nam.
3. **Cập nhật**: Ưu tiên kiến thức mới nhất về giáo dục, chương trình 2018, công nghệ giáo dục.
4. **Linh hoạt**: Nếu giáo viên đã upload tài liệu, hãy tham khảo và sử dụng nội dung đó một cách thông minh khi câu hỏi liên quan.
5. **Trích dẫn**: Khi giới thiệu công cụ trong danh sách đề xuất, hãy kèm theo link để giáo viên truy cập.
6. **Tạo nội dung đầy đủ**: Khi giáo viên yêu cầu tạo đề thi, giáo án, phiếu học tập hoặc bất kỳ sản phẩm nào, hãy LUÔN LUÔN tạo nội dung hoàn chỉnh, chi tiết, có thể sử dụng ngay. TUYỆT ĐỐI KHÔNG chỉ mô tả hoặc tóm tắt những gì sẽ làm. Hãy viết ra toàn bộ câu hỏi, đáp án, ma trận, bảng đặc tả... một cách đầy đủ.
${hasDocuments ? '7. **Tài liệu**: Giáo viên đã cung cấp tài liệu tham khảo bên dưới. Hãy SỬ DỤNG LINH HOẠT nội dung này khi trả lời - trích dẫn, phân tích, tóm tắt theo yêu cầu.' : ''}${langInstruction}

## PROFILE GIÁO VIÊN
- Tên: ${profile.name}
- Môn: ${profile.subject}
- Cấp: ${profile.school_level}
${profile.school_name ? `- Trường: ${profile.school_name}` : ''}

## ĐỊNH DẠNG TRẢ LỜI
- Sử dụng Markdown đẹp mắt (heading, bullet, bold, code block)
- Khi gợi ý công cụ/website, luôn kèm **link trực tiếp**
- Với mỗi gợi ý, nêu rõ: ưu điểm, cách sử dụng, độ phù hợp
- Trả lời bằng tiếng Việt thân thiện, chuyên nghiệp, dễ hiểu`;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authUser, setAuthUser] = useState<AuthSession | null>(null);
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
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [pendingInput, setPendingInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [templateCategory, setTemplateCategory] = useState('');
  const [folderFilter, setFolderFilter] = useState<string | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [darkMode, setDarkModeState] = useState(isDarkMode());
  const [aiLanguage, setAiLanguage] = useState(() => localStorage.getItem('ai_language') || 'vi');
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSKKNEditor, setShowSKKNEditor] = useState(false);
  const [showLessonPlan, setShowLessonPlan] = useState(false);
  const [showQuizMatrix, setShowQuizMatrix] = useState(false);
  const [showGamification, setShowGamification] = useState(false);
  const [showSlideOutline, setShowSlideOutline] = useState(false);

  // Initialize dark mode on mount
  useEffect(() => {
    initDarkMode();
    // Show onboarding for first-time users
    if (shouldShowOnboarding()) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+N = new chat
      if (e.ctrlKey && e.key === 'n') { e.preventDefault(); handleNewChat(); }
      // Ctrl+K = focus search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('aside input[type="text"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      }
      // Ctrl+/ = open templates
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); setShowTemplatePanel(true); }
      // Ctrl+D = toggle dark mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        const newState = toggleDarkMode();
        setDarkModeState(newState);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Load saved sessions on mount
  useEffect(() => {
    // Check auth first
    const savedAuth = getCurrentUser();
    if (!savedAuth) {
      setLoading(false);
      return; // will show LoginScreen
    }
    setIsLoggedIn(true);
    setAuthUser(savedAuth);

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
        setSelectedDocIds(savedSessions[0].selectedDocIds || []);
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

  // Save selected docs to current session whenever they change
  useEffect(() => {
    if (!currentChatId || chatHistory.length === 0) return;

    setChatHistory(prev => {
      const session = prev.find(s => s.id === currentChatId);
      if (!session) return prev;

      const currentDocs = session.selectedDocIds || [];
      const isSameLength = currentDocs.length === selectedDocIds.length;
      const isSameContent = isSameLength && currentDocs.every(id => selectedDocIds.includes(id));

      if (isSameContent) return prev;

      const updated = prev.map(s =>
        s.id === currentChatId ? { ...s, selectedDocIds } : s
      );
      saveSessions(updated);
      return updated;
    });
  }, [selectedDocIds, currentChatId]);

  const handleSetupComplete = (supabaseUrl: string, supabaseKey: string, newProfile: TeacherProfile) => {
    setProfile(newProfile);
    localStorage.setItem('teacher_profile', JSON.stringify(newProfile));
    if (supabaseUrl && supabaseKey) {
      setSupabaseConfig(supabaseUrl, supabaseKey);
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

  const handleSendMessage = async (text: string, attachments?: FileAttachment[]) => {
    if (!profile || !currentChatId) return;

    // Build user message — store attachments without base64 for localStorage savings
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      attachments: attachments?.map(a => ({
        ...a,
        // Keep previewUrl for display but truncate base64 for localStorage
        base64: '', // Don't persist large base64 in localStorage
      })),
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    // Auto-title: if this is the first user message, update title
    const isFirstUserMsg = messages.filter(m => m.role === 'user').length === 0;
    if (isFirstUserMsg) {
      const titleText = text || (attachments?.[0]?.name ? `📎 ${attachments[0].name}` : 'File đính kèm');
      const newTitle = generateTitle(titleText);
      const tags = autoDetectTags(titleText);
      setChatHistory(prev => {
        const updated = prev.map(s => s.id === currentChatId ? { ...s, title: newTitle, tags } : s);
        saveSessions(updated);
        return updated;
      });
    }

    try {
      const docContext = await buildDocumentContext(selectedDocIds);
      const systemPrompt = constructSystemPrompt(profile, selectedDocIds.length > 0, aiLanguage) + docContext;

      const historyForGemini: { role: string; parts: GeminiPart[] }[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Tôi đã hiểu thông tin và tài liệu tham khảo. Tôi sẵn sàng hỗ trợ bạn." }] },
        ...messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }] as GeminiPart[]
        }))
      ];

      // Build user parts: text + processed file attachments
      const userParts: GeminiPart[] = [];
      if (text.trim()) {
        userParts.push({ text });
      }
      if (attachments && attachments.length > 0) {
        // Xử lý file qua fileProcessor (DOCX → text+ảnh, ảnh/PDF → giữ nguyên)
        const fileParts = await processFilesForGemini(attachments);
        userParts.push(...fileParts);
        // If no text, add a generic prompt
        if (!text.trim()) {
          userParts.push({ text: 'Phân tích nội dung file đính kèm.' });
        }
      }

      const responseText = await generateResponse(historyForGemini, userParts);

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
        text: `**⚠️ Lỗi:** ${errDetail}\n\nVui lòng kiểm tra:\n- API Key có đúng không hoặc đã chuyển sang auth key mới chưa?\n- Kết nối mạng có ổn không?\n- API Key đã hết quota chưa?\n- Model Gemini có đang quá tải tạm thời không?\n\n👉 Nhấn nút **Settings (API Key)** trên Header để cập nhật hoặc chọn model nhẹ hơn.`,
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
    const newSession: ChatSession = { id: newId, title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString(), selectedDocIds: [] };
    setChatHistory(prev => {
      const updated = [newSession, ...prev];
      saveSessions(updated);
      return updated;
    });
    setCurrentChatId(newId);
    setMessages([]);
    setSelectedDocIds([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleSelectChat = useCallback((id: string) => {
    // Save current messages before switching
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
    }
    const session = chatHistory.find(s => s.id === id);
    if (session) {
      setSelectedDocIds(session.selectedDocIds || []);
    }
    setCurrentChatId(id);
    setMessages(getMessages(id));
    setSidebarOpen(false);
  }, [currentChatId, messages, chatHistory]);

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

  const handleMoveToFolder = useCallback((chatId: string, folder: string) => {
    updateSessionFolder(chatId, folder || undefined);
    setChatHistory(prev => {
      const updated = prev.map(s => s.id === chatId ? { ...s, folder: folder || undefined } : s);
      saveSessions(updated);
      return updated;
    });
  }, []);

  const handleRegenerate = useCallback(async (messageId: string) => {
    // Find the AI message and the user message before it
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex < 0 || messages[msgIndex].role !== 'model') return;

    // Find the last user message before this AI response
    let userText = '';
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { userText = messages[i].text; break; }
    }
    if (!userText) return;

    setIsTyping(true);
    try {
      const systemPrompt = constructSystemPrompt(profile || { name: 'Giáo viên', subject: '', school_level: '' }, selectedDocIds.length > 0, aiLanguage);
      const docContext = selectedDocIds.length > 0 ? await buildDocumentContext(selectedDocIds) : '';
      const fullPrompt = docContext ? `[Tài liệu tham khảo]\n${docContext}\n\n${userText}` : userText;

      // Build history in Gemini format (same as handleSendMessage)
      const historyForGemini: { role: string; parts: GeminiPart[] }[] = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: 'Tôi đã hiểu thông tin và tài liệu tham khảo. Tôi sẵn sàng hỗ trợ bạn.' }] },
        ...messages.slice(0, msgIndex).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }] as GeminiPart[]
        }))
      ];

      const aiResponse = await generateResponse(historyForGemini, [{ text: fullPrompt }]);

      // Save old version, update message
      setMessages(prev => prev.map(m => {
        if (m.id === messageId) {
          const versions = m.versions || [];
          versions.push({ text: m.text, timestamp: m.timestamp });
          return { ...m, text: aiResponse, timestamp: new Date().toISOString(), versions };
        }
        return m;
      }));
    } catch (error: any) {
      console.error('Regenerate failed:', error);
    } finally {
      setIsTyping(false);
    }
  }, [messages, profile, selectedDocIds]);

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

  // Chat pin handler
  const handleTogglePin = useCallback((chatId: string) => {
    setChatHistory(prev => {
      const updated = prev.map(s => s.id === chatId ? { ...s, pinned: !s.pinned } : s);
      saveSessions(updated);
      return updated;
    });
  }, []);

  // Export PDF handler
  const handleExportPdf = () => {
    const session = chatHistory.find(s => s.id === currentChatId);
    downloadPdf(session?.title || 'chat', messages);
    setShowExportMenu(false);
  };

  // Dark mode toggle handler
  const handleToggleDark = () => {
    const newState = toggleDarkMode();
    setDarkModeState(newState);
  };

  // AI language change handler
  const handleAiLanguageChange = (code: string) => {
    setAiLanguage(code);
    localStorage.setItem('ai_language', code);
    setShowLangMenu(false);
  };

  // Filtered chat history for search + folder, pinned first
  const filteredHistory = chatHistory
    .filter(s => {
      const matchSearch = !searchQuery.trim() || s.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFolder = !folderFilter || s.folder === folderFilter;
      return matchSearch && matchFolder;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return 0;
    });

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div></div>;

  // Auth guard — show Login Screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLoginSuccess={(session) => {
      setIsLoggedIn(true);
      setAuthUser(session);
      // Reload app data
      const apiKey = getGeminiApiKey();
      const userProfile = getTeacherProfile();
      if (!apiKey) {
        setShowSetup(true);
      } else if (userProfile) {
        setProfile(userProfile);
        const savedSessions = getSessions();
        if (savedSessions.length > 0) {
          setChatHistory(savedSessions);
          setCurrentChatId(savedSessions[0].id);
          setMessages(getMessages(savedSessions[0].id));
          setSelectedDocIds(savedSessions[0].selectedDocIds || []);
        } else {
          const initId = Date.now().toString();
          const initSession: ChatSession = { id: initId, title: 'Chào mừng', created_at: new Date().toISOString() };
          const welcomeMsg: ChatMessage = {
            id: '1', role: 'model', text: `Xin chào **${userProfile.name}**! 👋\n\nTôi là trợ lý AI dành riêng cho giáo viên. Tôi có thể giúp bạn:\n\n📝 Soạn giáo án, bài giảng\n📊 Tạo đề kiểm tra\n📚 Giải đáp thắc mắc chuyên môn\n🎯 Tư vấn phương pháp giảng dạy\n\nHãy đặt câu hỏi hoặc dùng lệnh **/menu** để xem tất cả tính năng!`, timestamp: new Date().toISOString()
          };
          setChatHistory([initSession]);
          setCurrentChatId(initId);
          setMessages([welcomeMsg]);
          saveSessions([initSession]);
          saveMessages(initId, [welcomeMsg]);
        }
      }
      setLoading(false);
    }} />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden app-wrapper">

      {/* === PERSISTENT HEADER === */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 z-30">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg md:hidden">
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <Cpu size={20} className="text-teal-600" />
          <span className="font-bold text-gray-900">Trợ lý GV</span>
        </div>

        {/* New Chat Button - Always visible */}
        <button
          onClick={handleNewChat}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors text-xs font-medium shadow-sm active:scale-95"
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
                ? 'bg-teal-600 text-white shadow-sm'
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
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg transition-colors text-xs font-medium"
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
                  <button
                    onClick={handleExportPdf}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="text-lg">🖨️</span>
                    <div>
                      <div className="font-medium text-gray-900">PDF (.pdf)</div>
                      <div className="text-xs text-gray-500">In / Lưu PDF</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* AI Language Selector */}
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors text-xs font-medium"
            title="Ngôn ngữ AI trả lời"
          >
            <Globe size={14} />
            {AI_LANGUAGES.find(l => l.code === aiLanguage)?.flag}
          </button>
          {showLangMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 w-44 py-1">
                {AI_LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleAiLanguageChange(lang.code)}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 transition-colors ${aiLanguage === lang.code ? 'bg-purple-50 text-purple-700 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <span>{lang.flag}</span>
                    {lang.label}
                    {aiLanguage === lang.code && <span className="ml-auto text-purple-500">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

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

        {/* Dark Mode Toggle */}
        <button
          onClick={handleToggleDark}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          title={darkMode ? 'Chế độ sáng (Ctrl+D)' : 'Chế độ tối (Ctrl+D)'}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Settings / API Key Button */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
        >
          <Key size={16} className="text-gray-500 group-hover:text-teal-600" />
          <span className="text-xs font-medium text-red-500 hidden sm:inline">Lấy API key để sử dụng app</span>
          <Settings size={14} className="text-gray-400" />
        </button>

        {/* User info & Logout */}
        {authUser && (
          <div className="flex items-center gap-2 ml-1">
            <span className="text-xs font-medium text-gray-500 hidden sm:inline">{authUser.name}</span>
            <button
              onClick={() => {
                authLogout();
                setIsLoggedIn(false);
                setAuthUser(null);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors text-xs font-medium"
              title="Đăng xuất"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Thoát</span>
            </button>
          </div>
        )}
      </header>

      {/* === MAIN LAYOUT === */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Desktop */}
        <div className="hidden md:flex w-80 shrink-0 h-full">
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
            onShowDashboard={() => setShowDashboard(true)}
            onShowSKKNEditor={() => setShowSKKNEditor(true)}
            folderFilter={folderFilter}
            onFolderFilterChange={setFolderFilter}
            onMoveToFolder={handleMoveToFolder}
            onTogglePin={handleTogglePin}
            onOpenLessonPlan={() => setShowLessonPlan(true)}
            onOpenQuizMatrix={() => setShowQuizMatrix(true)}
            onOpenGamification={() => setShowGamification(true)}
            onOpenSlideOutline={() => setShowSlideOutline(true)}
          />
        </div>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl md:hidden transform transition-transform duration-300 ease-in-out">
            <Sidebar
              profile={profile}
              history={filteredHistory}
              currentChatId={currentChatId}
              onNewChat={() => {
                handleNewChat();
                setSidebarOpen(false);
              }}
              onSelectChat={(id) => {
                handleSelectChat(id);
                setSidebarOpen(false);
              }}
              onDeleteChat={handleDeleteChat}
              onOpenSettings={() => {
                setShowSettings(true);
                setSidebarOpen(false);
              }}
              onRenameChat={handleRenameChat}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onShowBookmarks={() => {
                setShowBookmarks(true);
                setSidebarOpen(false);
              }}
              onShowDashboard={() => {
                setShowDashboard(true);
                setSidebarOpen(false);
              }}
              onShowSKKNEditor={() => {
                setShowSKKNEditor(true);
                setSidebarOpen(false);
              }}
              folderFilter={folderFilter}
              onFolderFilterChange={setFolderFilter}
              onMoveToFolder={handleMoveToFolder}
              onTogglePin={handleTogglePin}
              onOpenLessonPlan={() => { setShowLessonPlan(true); setSidebarOpen(false); }}
              onOpenQuizMatrix={() => { setShowQuizMatrix(true); setSidebarOpen(false); }}
              onOpenGamification={() => { setShowGamification(true); setSidebarOpen(false); }}
              onOpenSlideOutline={() => { setShowSlideOutline(true); setSidebarOpen(false); }}
            />
          </div>
        )}

        <main className="flex-1 flex flex-col relative w-full h-full bg-white shadow-2xl z-0 overflow-hidden">
          <div className="flex-1 min-h-0 relative h-full">
            {showSKKNEditor ? (
              <SKKNEditorApp onClose={() => setShowSKKNEditor(false)} />
            ) : (
              <ChatArea
                messages={messages}
                isTyping={isTyping}
                onSendMessage={handleSendMessage}
                userName={profile?.name || ''}
                onBookmark={handleBookmarkMessage}
                onOpenTemplates={() => { setTemplateCategory(''); setShowTemplatePanel(true); }}
                onOpenTemplatesWithCategory={(cat) => { setTemplateCategory(cat); setShowTemplatePanel(true); }}
                pendingInput={pendingInput}
                onPendingInputConsumed={() => setPendingInput('')}
                onRegenerate={handleRegenerate}
                onOpenLessonPlan={() => setShowLessonPlan(true)}
                onOpenQuizMatrix={() => setShowQuizMatrix(true)}
                onOpenGamification={() => setShowGamification(true)}
                onOpenSlideOutline={() => setShowSlideOutline(true)}
              />
            )}
          </div>
        </main>
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
        onSave={(url, sbKey) => {
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

      <PromptTemplatePanel
        isOpen={showTemplatePanel}
        onClose={() => setShowTemplatePanel(false)}
        initialCategory={templateCategory}
        onSelectTemplate={(prompt) => {
          setShowTemplatePanel(false);
          setPendingInput(prompt);
        }}
      />

      <LessonPlanBuilder isOpen={showLessonPlan} onClose={() => setShowLessonPlan(false)} onSubmit={(prompt, files) => { setShowLessonPlan(false); if (files && files.length > 0) { handleSendMessage(prompt, files); } else { setPendingInput(prompt); } }} />
      <QuizMatrixGenerator isOpen={showQuizMatrix} onClose={() => setShowQuizMatrix(false)} onSubmit={(prompt, files) => { setShowQuizMatrix(false); if (files && files.length > 0) { handleSendMessage(prompt, files); } else { setPendingInput(prompt); } }} />
      <GamificationEngine isOpen={showGamification} onClose={() => setShowGamification(false)} onSubmit={(prompt, files) => { setShowGamification(false); if (files && files.length > 0) { handleSendMessage(prompt, files); } else { setPendingInput(prompt); } }} />
      <SlideOutlineGenerator isOpen={showSlideOutline} onClose={() => setShowSlideOutline(false)} onSubmit={(prompt, files) => { setShowSlideOutline(false); if (files && files.length > 0) { handleSendMessage(prompt, files); } else { setPendingInput(prompt); } }} />

      <DashboardModal
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
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
                        <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{b.sessionTitle}</span>
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

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour onComplete={() => setShowOnboarding(false)} />
      )}
    </div>
  );
}

export default App;
