// Cấu hình 4 tính năng chuyên biệt cho giáo viên
export interface TeacherFeature {
    id: string;
    title: string;
    shortTitle: string;
    description: string;
    icon: string;
    color: string;          // tailwind color class prefix (teal, purple, orange, blue)
    gradient: string;       // gradient for header
    bgLight: string;        // light bg for card
    borderColor: string;    // border hover color
}

export const TEACHER_FEATURES: TeacherFeature[] = [
    {
        id: 'lesson-plan',
        title: 'Thiết kế Giáo án Chuẩn',
        shortTitle: 'Giáo án',
        description: 'Soạn giáo án chi tiết theo CV 5512, STEM, 5E, PBL — có tùy chọn phân hóa và tích hợp CNTT',
        icon: '🎓',
        color: 'teal',
        gradient: 'from-teal-500 to-emerald-600',
        bgLight: 'bg-teal-50',
        borderColor: 'hover:border-teal-300',
    },
    {
        id: 'quiz-matrix',
        title: 'Tạo Đề thi & Ma trận',
        shortTitle: 'Đề thi',
        description: 'Sinh đề thi tự động với ma trận đặc tả NB-TH-VD-VDC, có đáp án và hướng dẫn chấm',
        icon: '📋',
        color: 'purple',
        gradient: 'from-purple-500 to-violet-600',
        bgLight: 'bg-purple-50',
        borderColor: 'hover:border-purple-300',
    },
    {
        id: 'gamification',
        title: 'Trò chơi Khởi động & Nhóm',
        shortTitle: 'Trò chơi',
        description: 'Tạo trò chơi khởi động, ice-breaker, hoạt động nhóm vui nhộn cho lớp học',
        icon: '🎮',
        color: 'orange',
        gradient: 'from-orange-500 to-amber-600',
        bgLight: 'bg-orange-50',
        borderColor: 'hover:border-orange-300',
    },
    {
        id: 'slide-outline',
        title: 'Thiết kế Slide Bài giảng',
        shortTitle: 'Slide',
        description: 'Tạo dàn ý slide chuyên nghiệp với câu hỏi tương tác và gợi ý hình minh họa',
        icon: '🖥️',
        color: 'blue',
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50',
        borderColor: 'hover:border-blue-300',
    },
];

// Danh sách môn học phổ biến
export const SUBJECT_OPTIONS = [
    'Toán', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học',
    'Sinh học', 'Lịch sử', 'Địa lý', 'GDCD/GDKTPL', 'Tin học',
    'Công nghệ', 'Giáo dục thể chất', 'Âm nhạc', 'Mĩ thuật',
    'Tiếng Pháp', 'Tiếng Nhật', 'Tiếng Trung',
    'Khoa học tự nhiên', 'Lịch sử và Địa lý',
    'Hoạt động trải nghiệm',
];

// Danh sách lớp
export const GRADE_OPTIONS = [
    'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
    'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
    'Lớp 10', 'Lớp 11', 'Lớp 12',
];
