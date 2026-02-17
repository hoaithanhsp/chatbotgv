
import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SetupModal } from './components/SetupModal';
import { SettingsModal } from './components/SettingsModal';
import { DocumentManager } from './components/DocumentManager';
import { setGeminiApiKey, generateResponse, getGeminiApiKey, getAvailableModels, getSelectedModel, setSelectedModel } from './services/gemini';
import { setSupabaseConfig, getTeacherProfile, saveTeacherProfile as saveProfileService } from './services/supabase';
import { buildDocumentContext } from './services/documents';
import type { TeacherProfile, ChatSession, ChatMessage } from './types';
import { Menu, Settings, Key, Cpu, FileText } from 'lucide-react';

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
      // Build document context if any docs selected
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

        {/* Settings / API Key Button - ALWAYS VISIBLE */}
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

      <DocumentManager
        isOpen={showDocManager}
        onClose={() => setShowDocManager(false)}
        selectedDocIds={selectedDocIds}
        onSelectionChange={setSelectedDocIds}
      />
    </div>
  );
}

export default App;
