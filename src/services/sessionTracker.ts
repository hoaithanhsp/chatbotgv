// ========== SESSION TRACKER SERVICE ==========
// Theo dõi phiên chat, phân tích hành vi, thu thập feedback
// Dựa trên spec: Phần 2 (Workflow thu thập dữ liệu)

const SESSIONS_TRACKING_KEY = 'session_tracking_data';
const FEEDBACK_KEY = 'message_feedback_data';

// ========== INTERFACES ==========

export interface SessionTrackingData {
    sessionId: string;
    startTime: string;
    endTime?: string;
    messageCount: number;
    userMessageCount: number;
    aiMessageCount: number;
    topics: string[];
    avgResponseTime?: number;
    dayOfWeek: number; // 0=Sunday, 6=Saturday
    hourOfDay: number; // 0-23
}

export interface MessageFeedback {
    messageId: string;
    sessionId: string;
    feedback: 'like' | 'dislike';
    timestamp: string;
}

export interface SessionAnalytics {
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    peakHours: { hour: number; count: number }[];
    peakDays: { day: string; count: number }[];
    topicFrequency: Record<string, number>;
    feedbackStats: {
        totalLikes: number;
        totalDislikes: number;
        satisfactionRate: number; // 0-100%
    };
    avgSessionDuration: number; // minutes
    weeklyTrend: { week: string; sessions: number }[];
}

// ========== TRACKING DATA CRUD ==========

const getTrackingData = (): SessionTrackingData[] => {
    try {
        const raw = localStorage.getItem(SESSIONS_TRACKING_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveTrackingData = (data: SessionTrackingData[]): void => {
    // Keep only last 200 sessions to avoid localStorage bloat
    const trimmed = data.slice(-200);
    localStorage.setItem(SESSIONS_TRACKING_KEY, JSON.stringify(trimmed));
};

// ========== FEEDBACK CRUD ==========

const getFeedbackData = (): MessageFeedback[] => {
    try {
        const raw = localStorage.getItem(FEEDBACK_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
};

const saveFeedbackData = (data: MessageFeedback[]): void => {
    // Keep only last 500 feedback entries
    const trimmed = data.slice(-500);
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(trimmed));
};

// ========== SESSION TRACKING ==========

/**
 * Ghi nhận bắt đầu phiên chat mới
 */
export const trackSessionStart = (sessionId: string): void => {
    const data = getTrackingData();
    const now = new Date();

    // Check if session already tracked
    if (data.some(d => d.sessionId === sessionId)) return;

    data.push({
        sessionId,
        startTime: now.toISOString(),
        messageCount: 0,
        userMessageCount: 0,
        aiMessageCount: 0,
        topics: [],
        dayOfWeek: now.getDay(),
        hourOfDay: now.getHours(),
    });
    saveTrackingData(data);
};

/**
 * Ghi nhận kết thúc phiên chat
 */
export const trackSessionEnd = (sessionId: string): void => {
    const data = getTrackingData();
    const session = data.find(d => d.sessionId === sessionId);
    if (session && !session.endTime) {
        session.endTime = new Date().toISOString();
        saveTrackingData(data);
    }
};

/**
 * Ghi nhận tin nhắn được gửi
 */
export const trackMessageSent = (
    sessionId: string,
    role: 'user' | 'model',
    _text: string,
    topics?: string[]
): void => {
    const data = getTrackingData();
    const session = data.find(d => d.sessionId === sessionId);
    if (session) {
        session.messageCount += 1;
        if (role === 'user') session.userMessageCount += 1;
        else session.aiMessageCount += 1;

        // Merge topics
        if (topics && topics.length > 0) {
            session.topics = [...new Set([...session.topics, ...topics])];
        }
        saveTrackingData(data);
    }
};

/**
 * Lưu feedback cho tin nhắn AI
 */
export const trackFeedback = (
    messageId: string,
    sessionId: string,
    feedback: 'like' | 'dislike'
): void => {
    const data = getFeedbackData();

    // Update existing or add new
    const existing = data.findIndex(f => f.messageId === messageId);
    if (existing >= 0) {
        data[existing].feedback = feedback;
        data[existing].timestamp = new Date().toISOString();
    } else {
        data.push({
            messageId,
            sessionId,
            feedback,
            timestamp: new Date().toISOString(),
        });
    }
    saveFeedbackData(data);
};

/**
 * Lấy feedback của một tin nhắn
 */
export const getMessageFeedback = (messageId: string): 'like' | 'dislike' | null => {
    const data = getFeedbackData();
    const fb = data.find(f => f.messageId === messageId);
    return fb?.feedback || null;
};

// ========== ANALYTICS ==========

/**
 * Phân tích toàn bộ dữ liệu tracking
 */
export const getSessionAnalytics = (): SessionAnalytics => {
    const trackingData = getTrackingData();
    const feedbackData = getFeedbackData();

    const totalSessions = trackingData.length;
    const totalMessages = trackingData.reduce((sum, s) => sum + s.messageCount, 0);
    const avgMessagesPerSession = totalSessions > 0 ? Math.round(totalMessages / totalSessions * 10) / 10 : 0;

    // Peak hours
    const hourCounts: Record<number, number> = {};
    trackingData.forEach(s => {
        hourCounts[s.hourOfDay] = (hourCounts[s.hourOfDay] || 0) + 1;
    });
    const peakHours = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Peak days
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const dayCounts: Record<number, number> = {};
    trackingData.forEach(s => {
        dayCounts[s.dayOfWeek] = (dayCounts[s.dayOfWeek] || 0) + 1;
    });
    const peakDays = Object.entries(dayCounts)
        .map(([day, count]) => ({ day: dayNames[parseInt(day)], count }))
        .sort((a, b) => b.count - a.count);

    // Topic frequency
    const topicFrequency: Record<string, number> = {};
    trackingData.forEach(s => {
        s.topics.forEach(t => {
            topicFrequency[t] = (topicFrequency[t] || 0) + 1;
        });
    });

    // Feedback stats
    const totalLikes = feedbackData.filter(f => f.feedback === 'like').length;
    const totalDislikes = feedbackData.filter(f => f.feedback === 'dislike').length;
    const totalFeedback = totalLikes + totalDislikes;
    const satisfactionRate = totalFeedback > 0 ? Math.round((totalLikes / totalFeedback) * 100) : 100;

    // Average session duration
    let totalDuration = 0;
    let durationCount = 0;
    trackingData.forEach(s => {
        if (s.endTime) {
            const duration = (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / (1000 * 60);
            if (duration > 0 && duration < 300) { // ignore outliers > 5 hours
                totalDuration += duration;
                durationCount += 1;
            }
        }
    });
    const avgSessionDuration = durationCount > 0 ? Math.round(totalDuration / durationCount * 10) / 10 : 0;

    // Weekly trend (last 4 weeks)
    const weeklyTrend: { week: string; sessions: number }[] = [];
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (w * 7 + now.getDay()));
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        const count = trackingData.filter(s => {
            const d = new Date(s.startTime);
            return d >= weekStart && d < weekEnd;
        }).length;

        weeklyTrend.push({
            week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
            sessions: count,
        });
    }

    return {
        totalSessions,
        totalMessages,
        avgMessagesPerSession,
        peakHours,
        peakDays,
        topicFrequency,
        feedbackStats: { totalLikes, totalDislikes, satisfactionRate },
        avgSessionDuration,
        weeklyTrend,
    };
};

// ========== LEARNED INSIGHTS ==========

/**
 * Rút ra insights từ dữ liệu tracking
 */
export const getLearnedInsights = (): string[] => {
    const analytics = getSessionAnalytics();
    const insights: string[] = [];

    // Peak time insight
    if (analytics.peakHours.length > 0) {
        const topHour = analytics.peakHours[0];
        const timeStr = `${topHour.hour}:00 - ${topHour.hour + 1}:00`;
        insights.push(`⏰ Bạn thường sử dụng nhiều nhất vào ${timeStr}`);
    }

    // Peak day insight
    if (analytics.peakDays.length > 0) {
        insights.push(`📅 Ngày bạn dùng nhiều nhất: ${analytics.peakDays[0].day}`);
    }

    // Session duration insight
    if (analytics.avgSessionDuration > 0) {
        insights.push(`⏱️ Thời gian trung bình mỗi phiên: ${analytics.avgSessionDuration} phút`);
    }

    // Messages per session
    if (analytics.avgMessagesPerSession > 0) {
        insights.push(`💬 Trung bình ${analytics.avgMessagesPerSession} tin nhắn/phiên`);
    }

    // Top topics
    const topTopics = Object.entries(analytics.topicFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
    if (topTopics.length > 0) {
        const topicLabels: Record<string, string> = {
            'đề_thi': 'Đề thi',
            'giáo_án': 'Giáo án',
            'đánh_giá': 'Đánh giá',
            'phương_pháp': 'Phương pháp',
            'skkn': 'SKKN',
            'công_nghệ': 'Công nghệ',
        };
        const names = topTopics.map(([t]) => topicLabels[t] || t);
        insights.push(`📊 Chủ đề hay hỏi nhất: ${names.join(', ')}`);
    }

    // Satisfaction rate
    if (analytics.feedbackStats.totalLikes + analytics.feedbackStats.totalDislikes > 0) {
        insights.push(`👍 Tỷ lệ hài lòng: ${analytics.feedbackStats.satisfactionRate}%`);
    }

    return insights;
};
