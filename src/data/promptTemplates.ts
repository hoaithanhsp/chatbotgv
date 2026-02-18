export interface PromptTemplate {
    id: string;
    title: string;
    description: string;
    category: 'giao-an' | 'de-thi' | 'nhan-xet' | 'skkn' | 'phuong-phap' | 'khac';
    icon: string;
    prompt: string;
    variables?: string[];
    subjects?: string[];
    levels?: string[];
    slashCommand?: string;
}

export const TEMPLATE_CATEGORIES = [
    { id: 'all', label: 'Tất cả', icon: '📚' },
    { id: 'giao-an', label: 'Giáo án', icon: '📝' },
    { id: 'de-thi', label: 'Đề thi', icon: '📋' },
    { id: 'nhan-xet', label: 'Nhận xét', icon: '💬' },
    { id: 'skkn', label: 'SKKN', icon: '📖' },
    { id: 'phuong-phap', label: 'Phương pháp', icon: '💡' },
    { id: 'khac', label: 'Khác', icon: '🔧' },
] as const;

export const PROMPT_TEMPLATES: PromptTemplate[] = [
    // ==================== GIÁO ÁN ====================
    {
        id: 'giao-an-5512',
        title: 'Giáo án theo CV 5512',
        description: 'Soạn giáo án đầy đủ 4 hoạt động theo Công văn 5512',
        category: 'giao-an',
        icon: '📝',
        prompt: 'Hãy soạn giáo án bài "[tên bài]" môn [môn học] lớp [lớp] theo chuẩn Công văn 5512. Yêu cầu:\n- Gồm 4 hoạt động: Khởi động, Hình thành kiến thức mới, Luyện tập, Vận dụng\n- Mỗi hoạt động ghi rõ: Mục tiêu, Nội dung, Sản phẩm, Tổ chức thực hiện\n- Tích hợp phương pháp dạy học tích cực\n- Phân bổ thời gian hợp lý cho [số tiết] tiết',
        variables: ['tên bài', 'môn học', 'lớp', 'số tiết'],
        slashCommand: '/giaoan',
    },
    {
        id: 'ke-hoach-bai-day',
        title: 'Kế hoạch bài dạy',
        description: 'Lập kế hoạch bài dạy chi tiết với mục tiêu và năng lực cần đạt',
        category: 'giao-an',
        icon: '📋',
        prompt: 'Hãy lập kế hoạch bài dạy cho bài "[tên bài]" môn [môn học] lớp [lớp]. Bao gồm:\n1. Mục tiêu (kiến thức, năng lực, phẩm chất)\n2. Thiết bị và học liệu cần chuẩn bị\n3. Tiến trình dạy học chi tiết\n4. Phiếu học tập / bài tập vận dụng\n5. Rút kinh nghiệm sau tiết dạy',
        variables: ['tên bài', 'môn học', 'lớp'],
    },
    {
        id: 'giao-an-stem',
        title: 'Giáo án STEM',
        description: 'Thiết kế bài dạy STEM tích hợp liên môn',
        category: 'giao-an',
        icon: '🔬',
        prompt: 'Hãy thiết kế bài dạy STEM cho chủ đề "[chủ đề]" dành cho học sinh lớp [lớp]. Yêu cầu:\n- Xác định vấn đề thực tiễn cần giải quyết\n- Tích hợp kiến thức: Khoa học, Công nghệ, Kỹ thuật, Toán\n- Quy trình 5 bước: Xác định vấn đề → Nghiên cứu → Đề xuất giải pháp → Thực hiện → Đánh giá\n- Rubric đánh giá sản phẩm STEM\n- Phiếu hướng dẫn cho học sinh',
        variables: ['chủ đề', 'lớp'],
    },
    {
        id: 'giao-an-du-an',
        title: 'Dạy học dự án (PBL)',
        description: 'Thiết kế dự án học tập theo phương pháp Project-Based Learning',
        category: 'giao-an',
        icon: '🎯',
        prompt: 'Hãy thiết kế dự án học tập (PBL) cho chủ đề "[chủ đề]" môn [môn học] lớp [lớp]. Bao gồm:\n1. Câu hỏi dẫn dắt (Driving Question)\n2. Mục tiêu năng lực cần đạt\n3. Kế hoạch thực hiện theo tuần (thời gian [số tuần] tuần)\n4. Phân công nhóm và vai trò\n5. Sản phẩm dự án kỳ vọng\n6. Rubric đánh giá (cá nhân + nhóm)\n7. Tài nguyên hỗ trợ',
        variables: ['chủ đề', 'môn học', 'lớp', 'số tuần'],
    },
    {
        id: 'phan-phoi-chuong-trinh',
        title: 'Phân phối chương trình',
        description: 'Lập phân phối chương trình cả năm hoặc theo học kỳ',
        category: 'giao-an',
        icon: '📅',
        prompt: 'Hãy lập phân phối chương trình môn [môn học] lớp [lớp] cho [học kỳ/cả năm]. Bao gồm:\n- Tuần, tiết, tên bài/chủ đề\n- Yêu cầu cần đạt theo chương trình GDPT 2018\n- Ghi chú điều chỉnh (nếu có)\n- Trình bày dạng bảng rõ ràng',
        variables: ['môn học', 'lớp', 'học kỳ/cả năm'],
        slashCommand: '/phanphoi',
    },

    // ==================== ĐỀ THI ====================
    {
        id: 'de-thi-ma-tran',
        title: 'Đề thi theo ma trận',
        description: 'Tạo đề kiểm tra có ma trận đặc tả 4 mức độ NB-TH-VD-VDC',
        category: 'de-thi',
        icon: '📊',
        prompt: 'Hãy tạo đề kiểm tra môn [môn học] lớp [lớp] thời gian [thời gian] phút với:\n1. Ma trận đặc tả (bảng) gồm: Nội dung kiến thức, Mức độ (Nhận biết - Thông hiểu - Vận dụng - Vận dụng cao), Số câu, Điểm\n2. Bảng đặc tả chi tiết từng câu hỏi\n3. Đề kiểm tra hoàn chỉnh ([số câu TN] câu trắc nghiệm + [số câu TL] câu tự luận)\n4. Đáp án và hướng dẫn chấm chi tiết\n\nPhạm vi kiến thức: [nội dung]',
        variables: ['môn học', 'lớp', 'thời gian', 'số câu TN', 'số câu TL', 'nội dung'],
        slashCommand: '/dethi',
    },
    {
        id: 'de-trac-nghiem',
        title: 'Đề trắc nghiệm',
        description: 'Tạo bộ câu hỏi trắc nghiệm 4 phương án',
        category: 'de-thi',
        icon: '✅',
        prompt: 'Hãy tạo [số câu] câu hỏi trắc nghiệm (4 phương án A, B, C, D) môn [môn học] lớp [lớp] về nội dung "[nội dung]". Yêu cầu:\n- Phân bố mức độ: 40% Nhận biết, 30% Thông hiểu, 20% Vận dụng, 10% Vận dụng cao\n- Đáp án phân bố đều giữa A, B, C, D\n- Có giải thích chi tiết cho từng đáp án đúng\n- Đánh số thứ tự rõ ràng',
        variables: ['số câu', 'môn học', 'lớp', 'nội dung'],
    },
    {
        id: 'de-tu-luan',
        title: 'Đề tự luận',
        description: 'Tạo đề kiểm tra tự luận có thang điểm chi tiết',
        category: 'de-thi',
        icon: '✍️',
        prompt: 'Hãy tạo đề kiểm tra tự luận môn [môn học] lớp [lớp] thời gian [thời gian] phút, gồm [số câu] câu. Nội dung: "[nội dung]".\n\nYêu cầu:\n- Mỗi câu ghi rõ số điểm\n- Tổng điểm = 10\n- Có phần đáp án và hướng dẫn chấm chi tiết (chia nhỏ ý, mỗi ý có điểm)\n- Câu hỏi phân hóa từ dễ đến khó',
        variables: ['môn học', 'lớp', 'thời gian', 'số câu', 'nội dung'],
    },
    {
        id: 'de-phan-hoa',
        title: 'Đề phân hóa',
        description: 'Tạo đề kiểm tra phân hóa theo năng lực học sinh',
        category: 'de-thi',
        icon: '📈',
        prompt: 'Hãy tạo bộ đề kiểm tra phân hóa môn [môn học] lớp [lớp] về nội dung "[nội dung]" gồm 3 mức:\n1. **Đề cơ bản** (dành cho HS yếu-TB): [số câu] câu mức NB-TH\n2. **Đề nâng cao** (dành cho HS khá): thêm câu VD\n3. **Đề thử thách** (dành cho HS giỏi): thêm câu VDC\n\nKèm đáp án và hướng dẫn chấm cho cả 3 đề.',
        variables: ['môn học', 'lớp', 'nội dung', 'số câu'],
    },
    {
        id: 'ngan-hang-cau-hoi',
        title: 'Ngân hàng câu hỏi',
        description: 'Xây dựng ngân hàng câu hỏi theo chương/bài',
        category: 'de-thi',
        icon: '🏦',
        prompt: 'Hãy xây dựng ngân hàng [số câu] câu hỏi môn [môn học] lớp [lớp] cho nội dung "[nội dung]". Phân loại theo:\n- Mức 1 (Nhận biết): ~30% câu\n- Mức 2 (Thông hiểu): ~30% câu\n- Mức 3 (Vận dụng): ~25% câu\n- Mức 4 (Vận dụng cao): ~15% câu\n\nMỗi câu ghi rõ: Mức độ, Dạng (TN/TL), Nội dung câu hỏi, Đáp án.',
        variables: ['số câu', 'môn học', 'lớp', 'nội dung'],
    },

    // ==================== NHẬN XÉT ====================
    {
        id: 'nhan-xet-hoc-ba',
        title: 'Nhận xét học bạ',
        description: 'Viết nhận xét học bạ cuối kỳ cho học sinh',
        category: 'nhan-xet',
        icon: '💬',
        prompt: 'Hãy viết nhận xét học bạ cuối [kỳ/năm] cho học sinh với các thông tin sau:\n- Tên: [tên HS]\n- Học lực: [giỏi/khá/TB/yếu]\n- Hạnh kiểm: [tốt/khá/TB]\n- Điểm mạnh: [điểm mạnh]\n- Cần cải thiện: [cần cải thiện]\n\nYêu cầu: Viết 3-5 câu, ngôn ngữ tích cực, khích lệ, đúng phong cách nhận xét học bạ Việt Nam. Không trùng lặp với các nhận xét khác.',
        variables: ['kỳ/năm', 'tên HS', 'giỏi/khá/TB/yếu', 'tốt/khá/TB', 'điểm mạnh', 'cần cải thiện'],
        slashCommand: '/nhanxet',
    },
    {
        id: 'nhan-xet-batch',
        title: 'Nhận xét hàng loạt',
        description: 'Tạo nhận xét cho nhiều học sinh cùng lúc',
        category: 'nhan-xet',
        icon: '📊',
        prompt: 'Hãy viết nhận xét học bạ cuối [kỳ/năm] cho danh sách học sinh sau. Mỗi nhận xét 3-5 câu, KHÔNG TRÙNG LẶP giữa các em, ngôn ngữ tích cực khích lệ:\n\n[Dán danh sách HS ở đây, mỗi dòng gồm: Tên - Học lực - Nhận xét ngắn]\n\nVí dụ:\n1. Nguyễn Văn A - Giỏi - Chăm chỉ, năng nổ\n2. Trần Thị B - Khá - Cần tập trung hơn\n...',
        variables: ['kỳ/năm'],
    },
    {
        id: 'nhan-xet-nang-luc',
        title: 'Đánh giá năng lực',
        description: 'Viết đánh giá theo từng năng lực, phẩm chất',
        category: 'nhan-xet',
        icon: '🎯',
        prompt: 'Hãy viết đánh giá năng lực và phẩm chất cho học sinh [tên HS] lớp [lớp] theo các tiêu chí:\n\n**Năng lực chung:**\n- Tự chủ và tự học: [mức độ]\n- Giao tiếp và hợp tác: [mức độ]\n- Giải quyết vấn đề: [mức độ]\n\n**Phẩm chất:**\n- Yêu nước: [mức độ]\n- Nhân ái: [mức độ]\n- Chăm chỉ: [mức độ]\n- Trung thực: [mức độ]\n- Trách nhiệm: [mức độ]\n\nMức độ: Tốt / Đạt / Cần cố gắng',
        variables: ['tên HS', 'lớp'],
    },
    {
        id: 'loi-phe-so-lien-lac',
        title: 'Lời phê sổ liên lạc',
        description: 'Viết lời phê hàng tháng cho phụ huynh',
        category: 'nhan-xet',
        icon: '📬',
        prompt: 'Hãy viết lời phê sổ liên lạc tháng [tháng] cho học sinh [tên HS] lớp [lớp] với thông tin:\n- Điểm TB tháng: [điểm]\n- Số buổi vắng: [số buổi]\n- Thái độ học tập: [thái độ]\n- Đặc điểm nổi bật: [đặc điểm]\n\nYêu cầu: 2-3 câu, ngắn gọn, khen trước góp ý sau, gợi ý cách phối hợp với phụ huynh.',
        variables: ['tháng', 'tên HS', 'lớp', 'điểm', 'số buổi', 'thái độ', 'đặc điểm'],
    },

    // ==================== SKKN ====================
    {
        id: 'skkn-dan-y',
        title: 'Dàn ý SKKN',
        description: 'Xây dựng dàn ý chi tiết cho SKKN',
        category: 'skkn',
        icon: '📖',
        prompt: 'Hãy xây dựng dàn ý chi tiết cho sáng kiến kinh nghiệm với đề tài:\n"[tên đề tài]"\n\nMôn: [môn học] | Cấp: [cấp học]\n\nDàn ý gồm:\n1. Phần mở đầu (lý do chọn đề tài, mục đích, đối tượng, phương pháp)\n2. Nội dung (cơ sở lý luận, thực trạng, giải pháp, kết quả)\n3. Kết luận và kiến nghị\n\nMỗi mục ghi rõ các ý chính cần triển khai.',
        variables: ['tên đề tài', 'môn học', 'cấp học'],
        slashCommand: '/skkn',
    },
    {
        id: 'skkn-viet-chuong',
        title: 'Viết nội dung chương SKKN',
        description: 'Viết chi tiết từng chương/mục trong SKKN',
        category: 'skkn',
        icon: '✏️',
        prompt: 'Hãy viết chi tiết phần "[tên phần]" trong SKKN đề tài "[tên đề tài]". \n\nYêu cầu:\n- Văn phong khoa học, mạch lạc\n- Có trích dẫn tài liệu tham khảo (nếu phù hợp)\n- Có ví dụ minh họa cụ thể\n- Dài khoảng [số từ] từ\n- Phù hợp với ngữ cảnh giáo dục Việt Nam',
        variables: ['tên phần', 'tên đề tài', 'số từ'],
    },
    {
        id: 'skkn-thuc-trang',
        title: 'Phân tích thực trạng',
        description: 'Viết phần phân tích thực trạng cho SKKN',
        category: 'skkn',
        icon: '🔍',
        prompt: 'Hãy viết phần "Thực trạng" cho SKKN đề tài "[tên đề tài]" môn [môn học] tại [trường/đơn vị]. Bao gồm:\n1. Khảo sát thực trạng (mô tả tình hình hiện tại)\n2. Nguyên nhân của thực trạng\n3. Số liệu minh họa (bảng thống kê trước khi áp dụng giải pháp)\n4. Nhận định và đánh giá\n\nSử dụng số liệu giả định hợp lý nếu cần.',
        variables: ['tên đề tài', 'môn học', 'trường/đơn vị'],
    },

    // ==================== PHƯƠNG PHÁP ====================
    {
        id: 'ppdh-tich-cuc',
        title: 'Phương pháp dạy học tích cực',
        description: 'Gợi ý và hướng dẫn áp dụng PPDH tích cực cho bài cụ thể',
        category: 'phuong-phap',
        icon: '💡',
        prompt: 'Hãy gợi ý 3-5 phương pháp dạy học tích cực phù hợp cho bài "[tên bài]" môn [môn học] lớp [lớp]. Với mỗi phương pháp:\n1. Tên và mô tả ngắn\n2. Cách áp dụng cụ thể cho bài này\n3. Ưu điểm và lưu ý\n4. Ví dụ hoạt động mẫu\n\nCác PPDH tích cực: Dạy học theo trạm, Khăn trải bàn, Mảnh ghép, Lớp học đảo ngược, Think-Pair-Share, v.v.',
        variables: ['tên bài', 'môn học', 'lớp'],
    },
    {
        id: 'tich-hop-cntt',
        title: 'Tích hợp CNTT vào dạy học',
        description: 'Hướng dẫn sử dụng công nghệ trong tiết dạy cụ thể',
        category: 'phuong-phap',
        icon: '💻',
        prompt: 'Hãy hướng dẫn cách tích hợp CNTT vào giảng dạy bài "[tên bài]" môn [môn học] lớp [lớp]. Bao gồm:\n1. Công cụ/phần mềm phù hợp (miễn phí ưu tiên)\n2. Cách sử dụng cụ thể trong từng hoạt động\n3. Kịch bản sử dụng chi tiết\n4. Mẹo xử lý khi gặp sự cố kỹ thuật\n5. Link tải/truy cập công cụ',
        variables: ['tên bài', 'môn học', 'lớp'],
    },
    {
        id: 'day-hoc-phan-hoa',
        title: 'Dạy học phân hóa',
        description: 'Thiết kế hoạt động phân hóa theo năng lực học sinh',
        category: 'phuong-phap',
        icon: '🎯',
        prompt: 'Hãy thiết kế hoạt động dạy học phân hóa cho bài "[tên bài]" môn [môn học] lớp [lớp]. Chia theo 3 nhóm đối tượng:\n\n1. **Nhóm cơ bản** (HS yếu-TB): Hoạt động, bài tập, hỗ trợ cần thiết\n2. **Nhóm nâng cao** (HS khá): Hoạt động mở rộng, bài tập tư duy\n3. **Nhóm thử thách** (HS giỏi): Hoạt động sáng tạo, nghiên cứu\n\nKèm phiếu học tập cho từng nhóm.',
        variables: ['tên bài', 'môn học', 'lớp'],
    },

    // ==================== KHÁC ====================
    {
        id: 'tom-tat-tai-lieu',
        title: 'Tóm tắt tài liệu',
        description: 'Tóm tắt nội dung tài liệu đã upload',
        category: 'khac',
        icon: '📄',
        prompt: 'Hãy tóm tắt tài liệu mà tôi đã upload ở trên. Yêu cầu:\n1. Tóm tắt nội dung chính (5-10 ý chính)\n2. Những điểm quan trọng cần lưu ý\n3. Gợi ý cách sử dụng nội dung này trong giảng dạy\n4. Tạo 5 câu hỏi ôn tập dựa trên tài liệu',
        slashCommand: '/tomtat',
    },
    {
        id: 'viet-bao-cao',
        title: 'Viết báo cáo chuyên môn',
        description: 'Soạn báo cáo tổng kết, báo cáo chuyên đề',
        category: 'khac',
        icon: '📑',
        prompt: 'Hãy soạn [loại báo cáo] cho [nội dung]. Bao gồm:\n1. Tiêu đề và thông tin đơn vị\n2. Đặt vấn đề / Mở đầu\n3. Nội dung chính (có số liệu minh họa)\n4. Đánh giá ưu điểm, hạn chế\n5. Phương hướng / Kiến nghị\n6. Kết luận\n\nVăn phong hành chính, trang trọng.',
        variables: ['loại báo cáo', 'nội dung'],
    },
    {
        id: 'ke-hoach-chu-nhiem',
        title: 'Kế hoạch chủ nhiệm',
        description: 'Lập kế hoạch công tác chủ nhiệm lớp',
        category: 'khac',
        icon: '📋',
        prompt: 'Hãy lập kế hoạch công tác chủ nhiệm lớp [lớp] cho [kỳ/năm học]. Bao gồm:\n1. Đặc điểm tình hình lớp\n2. Mục tiêu (học lực, hạnh kiểm, phong trào)\n3. Biện pháp thực hiện theo tháng\n4. Kế hoạch hoạt động ngoại khóa\n5. Kế hoạch phối hợp với phụ huynh\n6. Kế hoạch giáo dục học sinh cá biệt',
        variables: ['lớp', 'kỳ/năm học'],
    },
    {
        id: 'sinh-hoat-chuyen-mon',
        title: 'Sinh hoạt chuyên môn',
        description: 'Chuẩn bị nội dung sinh hoạt tổ/nhóm chuyên môn',
        category: 'khac',
        icon: '👥',
        prompt: 'Hãy chuẩn bị nội dung sinh hoạt chuyên môn theo nghiên cứu bài học cho bài "[tên bài]" môn [môn học] lớp [lớp]. Bao gồm:\n1. Mục tiêu bài học (đối chiếu CT GDPT 2018)\n2. Phương án dạy học đề xuất\n3. Câu hỏi thảo luận cho tổ/nhóm\n4. Phiếu quan sát giờ dạy\n5. Gợi ý cải tiến sau dự giờ',
        variables: ['tên bài', 'môn học', 'lớp'],
    },
    {
        id: 'tao-phieu-hoc-tap',
        title: 'Tạo phiếu học tập',
        description: 'Thiết kế phiếu học tập, phiếu bài tập cho học sinh',
        category: 'khac',
        icon: '📝',
        prompt: 'Hãy tạo phiếu học tập cho bài "[tên bài]" môn [môn học] lớp [lớp]. Yêu cầu:\n- [số phiếu] phiếu, mỗi phiếu cho 1 hoạt động/nhóm\n- Mỗi phiếu gồm: Tên phiếu, Mục tiêu, Hướng dẫn, Câu hỏi/Bài tập, Phần trả lời\n- Phiếu có thể in được (format bảng rõ ràng)\n- Phù hợp với năng lực học sinh',
        variables: ['tên bài', 'môn học', 'lớp', 'số phiếu'],
    },
    {
        id: 'rubric-danh-gia',
        title: 'Rubric đánh giá',
        description: 'Tạo rubric đánh giá cho hoạt động/sản phẩm học tập',
        category: 'khac',
        icon: '📊',
        prompt: 'Hãy tạo Rubric đánh giá cho [hoạt động/sản phẩm] môn [môn học] lớp [lớp]. Format bảng gồm:\n- Tiêu chí đánh giá (4-6 tiêu chí)\n- 4 mức độ: Xuất sắc (4đ), Tốt (3đ), Đạt (2đ), Cần cố gắng (1đ)\n- Mô tả cụ thể cho từng mức của từng tiêu chí\n- Tổng điểm và xếp loại',
        variables: ['hoạt động/sản phẩm', 'môn học', 'lớp'],
    },
];

// Lấy danh sách slash commands từ templates
export const SLASH_COMMANDS = PROMPT_TEMPLATES
    .filter(t => t.slashCommand)
    .map(t => ({
        command: t.slashCommand!,
        title: t.title,
        description: t.description,
        icon: t.icon,
        templateId: t.id,
    }));
