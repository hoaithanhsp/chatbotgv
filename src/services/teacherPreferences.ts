// ========== TEACHER PREFERENCES SERVICE ==========
// Quản lý sở thích & profile cá nhân hóa của giáo viên
// Dựa trên spec: Phần 3 (Thuật toán học phong cách) & Phần 4 (Giao diện preferences)

const PREFS_KEY = 'teacher_preferences';
const STYLE_PROFILE_KEY = 'teacher_style_profile';

// ========== INTERFACES ==========

export interface ContentPreferences {
    documentLength: 'short' | 'medium' | 'long' | 'very_long'; // 200-400, 400-700, 700-1000, >1000
    detailLevel: number; // 1-5
    useHeadings: boolean;
    useLists: boolean;
    useTables: boolean;
    useMindMaps: boolean;
    useImages: boolean;
    useLatex: boolean;
    difficultyDistribution: {
        nhan_biet: number;    // % (0-100)
        thong_hieu: number;
        van_dung: number;
        van_dung_cao: number;
    };
}

export interface CommunicationStyle {
    formalityScore: number; // 0-1, 0=formal, 1=casual
    addressStyle: 'ban' | 'thay_co' | 'anh_chi';
    explanationLength: 'short' | 'balanced' | 'detailed';
    useEmoji: boolean;
}

export interface PedagogicalApproach {
    studentCentered: boolean;
    criticalThinking: boolean;
    realWorldConnection: boolean;
    examFocused: boolean;
    preferredExerciseTypes: string[]; // ['trac_nghiem', 'tu_luan', 'tinh_huong', 'du_an_nhom']
    assessmentFrequency: 'per_lesson' | 'per_chapter' | 'mid_final';
}

export interface TechnicalPreferences {
    preferredFileFormat: 'docx' | 'pdf' | 'md' | 'html';
    imageQuality: 'low' | 'medium' | 'high';
    autoSaveDocuments: boolean;
    autoBackupChat: boolean;
    remindExams: boolean;
    suggestMaterials: boolean;
    weeklyReport: boolean;
}

export interface TeacherPreferences {
    contentPreferences: ContentPreferences;
    communicationStyle: CommunicationStyle;
    pedagogicalApproach: PedagogicalApproach;
    technicalPreferences: TechnicalPreferences;
}

export interface LearnedInsight {
    key: string;
    label: string;
    confidence: number; // 0-1
    learnedAt: string;
    source: 'auto' | 'manual';
}

export interface TeacherStyleProfile {
    preferences: TeacherPreferences;
    confidence: number; // 0-1 overall
    totalInteractions: number;
    learnedInsights: LearnedInsight[];
    lastUpdated: string;
    createdAt: string;
}

// ========== DEFAULT VALUES ==========

export const DEFAULT_CONTENT_PREFS: ContentPreferences = {
    documentLength: 'medium',
    detailLevel: 3,
    useHeadings: true,
    useLists: true,
    useTables: false,
    useMindMaps: false,
    useImages: false,
    useLatex: false,
    difficultyDistribution: {
        nhan_biet: 30,
        thong_hieu: 40,
        van_dung: 20,
        van_dung_cao: 10,
    },
};

export const DEFAULT_COMM_STYLE: CommunicationStyle = {
    formalityScore: 0.5,
    addressStyle: 'ban',
    explanationLength: 'balanced',
    useEmoji: true,
};

export const DEFAULT_PEDAGOGICAL: PedagogicalApproach = {
    studentCentered: true,
    criticalThinking: true,
    realWorldConnection: false,
    examFocused: false,
    preferredExerciseTypes: ['trac_nghiem', 'tu_luan'],
    assessmentFrequency: 'per_chapter',
};

export const DEFAULT_TECHNICAL: TechnicalPreferences = {
    preferredFileFormat: 'docx',
    imageQuality: 'medium',
    autoSaveDocuments: true,
    autoBackupChat: true,
    remindExams: true,
    suggestMaterials: true,
    weeklyReport: false,
};

export const DEFAULT_PREFERENCES: TeacherPreferences = {
    contentPreferences: DEFAULT_CONTENT_PREFS,
    communicationStyle: DEFAULT_COMM_STYLE,
    pedagogicalApproach: DEFAULT_PEDAGOGICAL,
    technicalPreferences: DEFAULT_TECHNICAL,
};

// ========== CRUD FUNCTIONS ==========

export const getStyleProfile = (): TeacherStyleProfile => {
    try {
        const raw = localStorage.getItem(STYLE_PROFILE_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return createDefaultProfile();
};

export const saveStyleProfile = (profile: TeacherStyleProfile): void => {
    profile.lastUpdated = new Date().toISOString();
    localStorage.setItem(STYLE_PROFILE_KEY, JSON.stringify(profile));
};

export const getPreferences = (): TeacherPreferences => {
    try {
        const raw = localStorage.getItem(PREFS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { /* ignore */ }
    return { ...DEFAULT_PREFERENCES };
};

export const savePreferences = (prefs: TeacherPreferences): void => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    // Also update style profile
    const profile = getStyleProfile();
    profile.preferences = prefs;
    saveStyleProfile(profile);
};

export const resetPreferences = (): void => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    const profile = getStyleProfile();
    profile.preferences = { ...DEFAULT_PREFERENCES };
    profile.learnedInsights = [];
    profile.confidence = 0.3;
    saveStyleProfile(profile);
};

// ========== PROFILE CREATION ==========

const createDefaultProfile = (): TeacherStyleProfile => {
    const profile: TeacherStyleProfile = {
        preferences: { ...DEFAULT_PREFERENCES },
        confidence: 0.3, // Low confidence initially (cold start)
        totalInteractions: 0,
        learnedInsights: [],
        lastUpdated: new Date().toISOString(),
        createdAt: new Date().toISOString(),
    };
    localStorage.setItem(STYLE_PROFILE_KEY, JSON.stringify(profile));
    return profile;
};

// ========== LEARNING FUNCTIONS ==========

/**
 * EMA (Exponential Moving Average) update
 * alpha: learning rate (0.1 = 10% weight cho dữ liệu mới)
 */
const emaUpdate = (oldValue: number, newValue: number, alpha: number = 0.1): number => {
    return alpha * newValue + (1 - alpha) * oldValue;
};

/**
 * Phân tích tin nhắn để trích xuất features
 */
const analyzeMessage = (text: string) => {
    const lower = text.toLowerCase();
    return {
        length: text.length,
        wordCount: text.split(/\s+/).length,
        hasTable: /bảng|table|ma trận/i.test(text),
        hasImage: /hình|ảnh|minh họa|sơ đồ/i.test(text),
        hasLatex: /\$|toán|phương trình|biểu thức/i.test(text),
        hasList: /danh sách|liệt kê|bullet/i.test(text),
        isExamRelated: /đề thi|kiểm tra|trắc nghiệm|tự luận|đề/i.test(text),
        isLessonRelated: /giáo án|bài giảng|tiết dạy|kế hoạch/i.test(text),
        isDetailedRequest: /chi tiết|cụ thể|giải thích|phân tích kỹ/i.test(text),
        isBriefRequest: /ngắn gọn|tóm tắt|vắn tắt|nhanh/i.test(text),
        difficulty: lower.includes('vận dụng cao') ? 'van_dung_cao' :
                    lower.includes('vận dụng') ? 'van_dung' :
                    lower.includes('thông hiểu') ? 'thong_hieu' :
                    lower.includes('nhận biết') ? 'nhan_biet' : null,
        topics: extractTopics(lower),
    };
};

const extractTopics = (text: string): string[] => {
    const topicKeywords: Record<string, string[]> = {
        'đề_thi': ['đề thi', 'kiểm tra', 'trắc nghiệm'],
        'giáo_án': ['giáo án', 'bài giảng', 'kế hoạch'],
        'đánh_giá': ['nhận xét', 'đánh giá', 'học bạ'],
        'phương_pháp': ['phương pháp', 'dạy học', 'stem', 'pbl'],
        'skkn': ['sáng kiến', 'skkn', 'kinh nghiệm'],
        'công_nghệ': ['công cụ', 'phần mềm', 'ai', 'app'],
    };
    const detected: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
            detected.push(topic);
        }
    }
    return detected;
};

/**
 * Cập nhật preferences từ tương tác chat
 * Gọi sau mỗi tin nhắn user gửi
 */
export const updatePreferencesFromInteraction = (
    userMessage: string,
    aiResponse: string
): void => {
    const profile = getStyleProfile();
    const features = analyzeMessage(userMessage);
    const prefs = profile.preferences;

    // Adaptive learning rate based on interaction count (Phase 1: fast, Phase 2+: slower)
    const alpha = profile.totalInteractions < 5 ? 0.3 :
                  profile.totalInteractions < 20 ? 0.2 : 0.1;

    // --- Update Content Preferences ---

    // Detail level
    if (features.isDetailedRequest) {
        prefs.contentPreferences.detailLevel = emaUpdate(prefs.contentPreferences.detailLevel, 5, alpha);
        addInsightIfNew(profile, 'detail_high', 'Bạn thường yêu cầu giải thích chi tiết');
    }
    if (features.isBriefRequest) {
        prefs.contentPreferences.detailLevel = emaUpdate(prefs.contentPreferences.detailLevel, 1, alpha);
        addInsightIfNew(profile, 'detail_low', 'Bạn thích nội dung ngắn gọn, súc tích');
    }

    // Structure preferences
    if (features.hasTable) {
        prefs.contentPreferences.useTables = true;
        addInsightIfNew(profile, 'use_tables', 'Bạn thích sử dụng bảng biểu');
    }
    if (features.hasImage) {
        prefs.contentPreferences.useImages = true;
        addInsightIfNew(profile, 'use_images', 'Bạn thích dùng hình ảnh minh họa');
    }
    if (features.hasLatex) {
        prefs.contentPreferences.useLatex = true;
        addInsightIfNew(profile, 'use_latex', 'Bạn hay dùng công thức toán LaTeX');
    }

    // Document length from AI response length
    const aiWordCount = aiResponse.split(/\s+/).length;
    if (aiWordCount < 400) {
        // no change - could be a short answer
    } else if (aiWordCount < 700 && features.isBriefRequest) {
        prefs.contentPreferences.documentLength = 'short';
    } else if (aiWordCount > 1000 && features.isDetailedRequest) {
        prefs.contentPreferences.documentLength = 'very_long';
    }

    // Difficulty preference
    if (features.difficulty) {
        const distKey = features.difficulty as keyof typeof prefs.contentPreferences.difficultyDistribution;
        prefs.contentPreferences.difficultyDistribution[distKey] =
            Math.min(60, prefs.contentPreferences.difficultyDistribution[distKey] + 2);
        // Normalize
        const total = Object.values(prefs.contentPreferences.difficultyDistribution).reduce((a, b) => a + b, 0);
        if (total > 100) {
            const scale = 100 / total;
            prefs.contentPreferences.difficultyDistribution.nhan_biet *= scale;
            prefs.contentPreferences.difficultyDistribution.thong_hieu *= scale;
            prefs.contentPreferences.difficultyDistribution.van_dung *= scale;
            prefs.contentPreferences.difficultyDistribution.van_dung_cao *= scale;
        }
    }

    // --- Update counters ---
    profile.totalInteractions += 1;
    profile.preferences = prefs;

    // --- Update confidence ---
    profile.confidence = calculateConfidence(profile);

    saveStyleProfile(profile);
    savePreferences(prefs);
};

// ========== CONFIDENCE CALCULATION ==========

/**
 * Tính độ tin cậy dựa trên:
 * - Số lượng tương tác (max tại 50)
 * - Số insights đã học
 * - Thời gian sử dụng
 */
const calculateConfidence = (profile: TeacherStyleProfile): number => {
    // Factor 1: Sample size (max at 50 sessions)
    const sampleFactor = Math.min(profile.totalInteractions / 50, 1.0);

    // Factor 2: Number of insights learned
    const insightFactor = Math.min(profile.learnedInsights.length / 10, 1.0);

    // Factor 3: Recency
    const daysSinceLastUpdate = (Date.now() - new Date(profile.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.exp(-daysSinceLastUpdate / 30);

    // Weighted average
    const confidence = 0.4 * sampleFactor + 0.3 * insightFactor + 0.3 * recencyFactor;
    return Math.round(confidence * 100) / 100; // 2 decimal places
};

// ========== INSIGHT MANAGEMENT ==========

const addInsightIfNew = (profile: TeacherStyleProfile, key: string, label: string): void => {
    if (!profile.learnedInsights.some(i => i.key === key)) {
        profile.learnedInsights.push({
            key,
            label,
            confidence: 0.5,
            learnedAt: new Date().toISOString(),
            source: 'auto',
        });
    } else {
        // Increase confidence of existing insight
        const insight = profile.learnedInsights.find(i => i.key === key);
        if (insight) {
            insight.confidence = Math.min(1, insight.confidence + 0.05);
        }
    }
};

// ========== PERSONALIZATION SCORE ==========

/**
 * Tính % cá nhân hóa (hiển thị trên dashboard)
 */
export const getPersonalizationScore = (): number => {
    const profile = getStyleProfile();
    return Math.round(profile.confidence * 100);
};

// ========== EXPORT / IMPORT ==========

export const exportProfile = (): void => {
    const profile = getStyleProfile();
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teacher_profile_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importProfile = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string) as TeacherStyleProfile;
                if (imported.preferences && imported.confidence !== undefined) {
                    saveStyleProfile(imported);
                    savePreferences(imported.preferences);
                    resolve(true);
                } else {
                    resolve(false);
                }
            } catch {
                resolve(false);
            }
        };
        reader.readAsText(file);
    });
};

// ========== BUILD PROMPT FROM PREFERENCES ==========

/**
 * Tạo phần prompt bổ sung dựa trên preferences
 */
export const buildPreferencesPrompt = (): string => {
    const profile = getStyleProfile();
    if (profile.confidence < 0.2) return ''; // Chưa đủ dữ liệu

    const prefs = profile.preferences;
    const parts: string[] = [];

    parts.push('\n## SỞ THÍCH CÁ NHÂN CỦA GIÁO VIÊN (Chatbot đã học)');

    // Content
    const lengthMap = { short: '200-400 từ', medium: '400-700 từ', long: '700-1000 từ', very_long: 'trên 1000 từ' };
    parts.push(`- Độ dài tài liệu ưa thích: ${lengthMap[prefs.contentPreferences.documentLength]}`);
    parts.push(`- Mức độ chi tiết: ${prefs.contentPreferences.detailLevel}/5`);

    const structures: string[] = [];
    if (prefs.contentPreferences.useTables) structures.push('bảng biểu');
    if (prefs.contentPreferences.useImages) structures.push('hình ảnh');
    if (prefs.contentPreferences.useLatex) structures.push('LaTeX');
    if (prefs.contentPreferences.useLists) structures.push('danh sách');
    if (structures.length > 0) parts.push(`- Thích dùng: ${structures.join(', ')}`);

    // Communication
    if (prefs.communicationStyle.formalityScore > 0.6) {
        parts.push('- Phong cách: Thân thiện, gần gũi');
    } else if (prefs.communicationStyle.formalityScore < 0.4) {
        parts.push('- Phong cách: Trang trọng, chuyên nghiệp');
    }

    const addressMap = { ban: 'bạn', thay_co: 'thầy/cô', anh_chi: 'anh/chị' };
    parts.push(`- Xưng hô: Gọi giáo viên là "${addressMap[prefs.communicationStyle.addressStyle]}"`);

    if (prefs.communicationStyle.useEmoji) parts.push('- Có thể dùng emoji 😊');

    // Difficulty distribution
    const diff = prefs.contentPreferences.difficultyDistribution;
    parts.push(`- Phân bố độ khó: NB ${Math.round(diff.nhan_biet)}% / TH ${Math.round(diff.thong_hieu)}% / VD ${Math.round(diff.van_dung)}% / VDC ${Math.round(diff.van_dung_cao)}%`);

    // Pedagogical
    if (prefs.pedagogicalApproach.realWorldConnection) {
        parts.push('- Thích kết nối với thực tế');
    }
    if (prefs.pedagogicalApproach.examFocused) {
        parts.push('- Tập trung vào kỹ thuật làm bài thi');
    }

    return parts.join('\n');
};
