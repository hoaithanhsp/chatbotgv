
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SetupModal } from './components/SetupModal';
import { SettingsModal } from './components/SettingsModal';
import { ToolLibraryModal } from './components/ToolLibraryModal';
import { setGeminiApiKey, generateResponse, getGeminiApiKey, getAvailableModels, getSelectedModel, setSelectedModel } from './services/gemini';
import { setSupabaseConfig, getTeacherProfile, saveTeacherProfile as saveProfileService } from './services/supabase';
import type { TeacherProfile, ChatSession, AITool, ChatMessage } from './types';
import { Menu, Settings, Key, Cpu } from 'lucide-react';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModelState] = useState(getSelectedModel());

  useEffect(() => {
    const apiKey = getGeminiApiKey();
    const userProfile = getTeacherProfile();

    if (!apiKey) {
      setShowSetup(true);
    } else if (userProfile) {
      setProfile(userProfile);
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
    if (sbUrl && sbKey) {
      setSupabaseConfig(sbUrl, sbKey);
    }
    saveProfileService(newProfile);
    setProfile(newProfile);
    setShowSetup(false);

    setChatHistory([{ id: '1', title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() }]);
    setCurrentChatId('1');
    setMessages([{
      id: 'welcome', role: 'model', text: `Chào ${newProfile.name}! Hệ thống đã sẵn sàng. 🎉`, timestamp: new Date().toISOString()
    }]);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    setSelectedModelState(model);
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
    const newId = Date.now().toString();
    setChatHistory(prev => [{ id: newId, title: 'Cuộc trò chuyện mới', created_at: new Date().toISOString() }, ...prev]);
    setCurrentChatId(newId);
    setMessages([]);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

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

        {/* Settings / API Key Button - ALWAYS VISIBLE */}
        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors group"
        >
          <Key size={16} className="text-gray-500 group-hover:text-indigo-600" />
          <span className="text-xs font-medium text-red-500">Lấy API key để sử dụng app</span>
          <Settings size={14} className="text-gray-400" />
        </button>
      </header>

      {/* === MAIN LAYOUT === */}
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 top-14 z-50 w-80 bg-white transform transition-transform duration-300 ease-in-out md:relative md:top-0 md:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar
            profile={profile}
            history={chatHistory}
            currentChatId={currentChatId}
            onNewChat={handleNewChat}
            onSelectChat={(id) => { setCurrentChatId(id); setSidebarOpen(false); }}
            onDeleteChat={(id) => setChatHistory(prev => prev.filter(c => c.id !== id))}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col h-full relative">
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

      <ToolLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        tools={MOCK_TOOLS}
      />
    </div>
  );
}

export default App;
