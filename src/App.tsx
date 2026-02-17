
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SetupModal } from './components/SetupModal';
import { SettingsModal } from './components/SettingsModal';
import { ToolLibraryModal } from './components/ToolLibraryModal';
import { setGeminiApiKey, generateResponse, getGeminiApiKey } from './services/gemini';
import { setSupabaseConfig, getTeacherProfile, saveTeacherProfile as saveProfileService } from './services/supabase';
import type { TeacherProfile, ChatSession, AITool, ChatMessage } from './types';
import { Menu } from 'lucide-react';

// Mock tools for now (or load from local constant/DB)
const MOCK_TOOLS: AITool[] = [
  {
    id: '1', name: 'Giáo án năng lực số', description: 'Ứng dụng AI hỗ trợ soạn bài giảng hiệu quả...',
    url: 'https://khbdnlstht.vercel.app/', category: 'Soạn giáo án', tags: ['giáo án', 'soạn bài'],
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIE44YLmhCRlZ3Pw7oTgkNrrvG2N7wte06c-7AJmQQYVooZ1qgYN12zdWNPybDN3kr-mYvbqXmt5kHPjyE93rYbf0tGJzU5WL8GhAjjMiFIo8qboNMzZiZdoLf1ynES93GEZC5x1wT8eGCr8vWXTPbLBsqOcUZMir1MvMpeAk2Ga2MPmQfE7j_fbx3bgL7DkQ_FYD9hp4u5Ke9zJHLBvC3xSgVO2hbeDpalY4fL-eC6I-txIYiCUHOCPuAlOCixQhRlGd9Ew_sOk_h',
    is_popular: true
  },
  {
    id: '2', name: 'Sinh đề biến thể', description: 'Trợ lý AI đắc lực giúp giáo viên tạo đề thi thông minh...',
    url: 'https://examgenprotht.vercel.app/', category: 'Tạo đề thi', tags: ['đề thi', 'biến thể'],
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARmaOhszpY5Z1FkUe1znQlRZLVn8C4RMzAgLTs-HWwKFKrXP26zFIDJerKO8i7cWs7sgXydetMwKtJCx2wFwe4WqxTlR19qtcTbnECIau7vuzCqQrSQzKuj_7yvmqpFwbQFv42hQsrSc8r5jRXLKlskN7Y8pCUn34-VodBqo1Kk2HGtMw-8hYXCPPo9cHDbfoyzy90uScgcII5Ymt7ABrHHVSU41m_qqvFew-VF9Ewvk4R7F9I4HYxOjhtSJ5n-XM6SvrldjMqtci3'
  },
  // Add more from the list if needed
];

// System Prompt Construction
const constructSystemPrompt = (profile: TeacherProfile, tools: AITool[]) => {
  return `Bạn là trợ lý AI chuyên nghiệp dành cho giáo viên Việt Nam.
  NHIỆM VỤ:
  1. Lắng nghe vấn đề của giáo viên.
  2. Phân tích nhu cầu và gợi ý công cụ AI phù hợp từ thư viện (nếu có).
  3. Hướng dẫn chi tiết cách sử dụng.
  4. Trả lời câu hỏi follow-up.
  
  PROFILE GIÁO VIÊN:
  Tên: ${profile.name}
  Môn: ${profile.subject}
  Cấp: ${profile.school_level}
  
  THƯ VIỆN CÔNG CỤ:
  ${JSON.stringify(tools.map(t => ({ name: t.name, description: t.description, url: t.url, category: t.category })), null, 2)}
  
  Hãy trả lời bằng tiếng Việt thân thiện, chuyên nghiệp. Định dạng Markdown đẹp mắt.`;
};

function App() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Current session messages
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check initialization
    const apiKey = getGeminiApiKey();
    const userProfile = getTeacherProfile();

    if (!apiKey || !userProfile) {
      setShowSetup(true);
    } else {
      setProfile(userProfile);
      // Load chat history from Supabase or LocalStorage (mock for now)
      setChatHistory([
        { id: '1', title: 'Chào mừng', created_at: new Date().toISOString() }
      ]);
      setCurrentChatId('1');
      setMessages([{
        id: 'welcome', role: 'model', text: `Chào thầy/cô ${userProfile.name}! Tôi có thể giúp gì cho thầy/cô hôm nay?`, timestamp: new Date().toISOString()
      }]);
    }
    setLoading(false);
  }, []);

  const handleSetupComplete = (apiKey: string, sbUrl: string, sbKey: string, newProfile: TeacherProfile) => {
    setGeminiApiKey(apiKey);
    setSupabaseConfig(sbUrl, sbKey);
    saveProfileService(newProfile);
    setProfile(newProfile);
    setShowSetup(false);

    // Initial Greeting
    setChatHistory([{ id: '1', title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() }]);
    setCurrentChatId('1');
    setMessages([{
      id: 'welcome', role: 'model', text: `Chào ${newProfile.name}! Hệ thống đã sẵn sàng.`, timestamp: new Date().toISOString()
    }]);
  };

  const handleSendMessage = async (text: string) => {
    if (!profile) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setIsTyping(true);

    try {
      // Prepare history for Gemini
      const historyForGemini = [
        { role: 'user', parts: [{ text: constructSystemPrompt(profile, MOCK_TOOLS) }] },
        { role: 'model', parts: [{ text: "Tôi đã hiểu thông tin. Tôi sẵn sàng hỗ trợ bạn." }] },
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
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "**Lỗi:** Không thể kết nối với AI. Vui lòng kiểm tra API Key hoặc kết nối mạng.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    setChatHistory(prev => [{ id: newId, title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() }, ...prev]);
    setCurrentChatId(newId);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:relative md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar
          profile={profile}
          history={chatHistory}
          currentChatId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={(id) => { setCurrentChatId(id); setSidebarOpen(false); /* Load real history here */ }}
          onDeleteChat={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))}
          onOpenSettings={() => setShowSettings(true)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden h-14 bg-white border-b border-gray-200 flex items-center px-4 justify-between shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
            <Menu size={24} />
          </button>
          <span className="font-semibold text-gray-900">Trợ lý GV</span>
          <div className="w-8" /> {/* Spacer */}
        </div>

        <ChatArea
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          userName={profile?.name || ''}
        />
      </div>

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
          setSupabaseConfig(url, sbKey);
        }}
      />

      <ToolLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        tools={MOCK_TOOLS}
      />
    </div>
  );
}

export default App;
