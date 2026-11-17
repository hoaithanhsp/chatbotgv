# Báo cáo Rà soát — chatbotgv
*TRẦN HOÀI THANH — November 17, 2026*

Ngày: 2026-11-17  
Repo: https://github.com/hoaithanhsp/chatbotgv

## Tóm tắt

Đã sửa các vấn đề chính về validator API key, model mặc định và fallback, cấu hình Gemini, phân loại lỗi 502/503/504/429 và log trong hai mô-đun Gemini/SKKN. Tuy nhiên, chưa thể xác nhận bản sửa hoạt động hoàn chỉnh: build bị chặn do thiếu `tsc`, phạm vi log toàn repo chưa được kiểm tra đầy đủ và chưa thực hiện commit/push cuối cùng.

Các thay đổi được ghi nhận trên nhánh `fix/review-and-improvements`, trong `gemini.ts` và `skknGeminiService.ts`. Trạng thái “đã sửa” dưới đây phản ánh kết quả chỉnh sửa được cung cấp, không đồng nghĩa đã vượt qua kiểm thử đầu cuối.

## 1. Lỗi đã phát hiện và sửa

### 1.1 Lỗi API Key & Model

Bảng dưới tổng hợp các thay đổi về kiểm tra key và lựa chọn model. Dữ liệu không cung cấp số dòng chính xác.

| Hạng mục | Thay đổi đã thực hiện | Dòng |
|---|---|---|
| Validator API key | Chấp nhận tiền tố `AIzaSy` và `AQ` | Chưa ghi rõ |
| Kiểm tra key nhất quán | Hàm set/check dùng chung validator | Chưa ghi rõ |
| Model mặc định | Đổi sang `gemini-3.8-flash` | Chưa ghi rõ |
| Chuỗi fallback | Cập nhật theo thứ tự được yêu cầu | Chưa ghi rõ |
| Danh sách hiển thị | Loại các model được ghi nhận đã shutdown/không còn dùng | Chưa ghi rõ |

Validator được cập nhật thành `^(?:AIzaSy|AQ)\S{8,}$`. Việc dùng chung validator cho các hàm set/check key giúp tránh khác biệt hành vi giữa các điểm tiếp nhận và kiểm tra key.

Chuỗi fallback đã cập nhật:

`gemini-3.8-flash → gemini-3.7-flash → gemini-3.5-flash-lite → gemini-3.6-flash → gemini-3.5-flash → gemini-3.1-flash-lite → gemini-2.5-flash`

Dữ liệu không nêu tên từng model đã bị loại khỏi danh sách hiển thị; vì vậy, chưa thể đối chiếu chi tiết phần này.

### 1.2 Lỗi Code

Các thay đổi tập trung vào cấu hình theo nhóm model và phân loại lỗi để quyết định fallback đúng trường hợp.

| Hạng mục | Thay đổi đã thực hiện | Dòng |
|---|---|---|
| Cấu hình `gemini-3*` | Chỉ giữ `thinkingLevel`; bỏ `temperature/topP/topK` | Chưa ghi rõ |
| Model ngoài `gemini-3*` | Giữ cấu hình nhiệt độ, `topP`, `topK` như cũ | Chưa ghi rõ |
| Lỗi 502/503/504 | Tiếp tục fallback; không coi nhầm là key sai | Chưa ghi rõ |
| Lỗi 429 | Giữ xử lý cooldown/quota; không đánh dấu invalid key | Chưa ghi rõ |
| Phân loại lỗi | Tách lỗi quota và lỗi key không hợp lệ rõ hơn | Chưa ghi rõ |
| Luồng SKKN | Đồng bộ tiêu chí fallback và quota | Chưa ghi rõ |
| Sinh text/JSON của SKKN | Loại bỏ tham số `temperature` | Chưa ghi rõ |

Điểm quan trọng là lỗi máy chủ/quá tải và lỗi quota không còn bị xử lý như bằng chứng key không hợp lệ. Thông báo cho lỗi 429 cũng đã được chỉnh để tránh gây hiểu nhầm.

Trong cấu hình `thinkingConfig` cho nhóm `gemini-3*`, chỉ giữ `thinkingLevel`; đồng thời không truyền các tham số suy luận nêu trên. Với các model ngoài nhóm này, cấu hình cũ được giữ lại nhằm tránh thay đổi hành vi hiện tại.

### 1.3 Vấn đề Bảo mật

Đã giảm chi tiết log liên quan đến Gemini/SKKN: chỉ ghi trạng thái model thất bại, không in API key trong phạm vi đã chỉnh sửa. Dòng thay đổi chính xác: **Chưa ghi rõ**.

Vẫn còn các lệnh `console.log` và `console.error` tại một số mô-đun khác. Chưa có căn cứ kết luận các log đó làm lộ dữ liệu nhạy cảm, nhưng cũng chưa đủ cơ sở xác nhận toàn repo an toàn về log.

## 2. Lỗi chưa sửa được (nếu có)

| Vấn đề còn mở | Trạng thái ghi nhận | Ảnh hưởng |
|---|---|---|
| Kiểm tra build | `npm run build` dừng với `tsc: not found` | Chưa xác nhận build đầu cuối |
| Rà soát log toàn repo | Chưa kiểm tra đầy đủ các mô-đun UI khác | Chưa kết luận bảo mật log toàn cục |
| Báo cáo trong repo | Bản ghi thực hiện cho biết chưa tạo báo cáo gốc | Chưa xác nhận lưu báo cáo vào repo |
| Commit/push | Chưa thực hiện bước cuối | Chưa xác nhận thay đổi trên remote |

Lỗi build được ghi nhận là thiếu trình biên dịch TypeScript trong môi trường, không phải bằng chứng xác định mã nguồn có lỗi biên dịch. Tương tự, việc đã có nội dung báo cáo này không chứng minh tài liệu đã được lưu, commit hoặc push vào repo.

## 3. Đề xuất cải thiện thêm

- **Hoàn tất xác minh:** cài `typescript`, chạy lại `npm run build` và chạy `npm run lint`; ghi nhận kết quả trước khi chốt thay đổi.
- **Bổ sung kiểm thử:** tập trung vào validator API key, thứ tự fallback và phân loại lỗi 429/502/503/504.
- **Rà soát log còn lại:** kiểm tra các lệnh `console.log`/`console.error` ngoài Gemini/SKKN để tránh lộ dữ liệu nhạy cảm khi chạy.
- **Chuẩn hóa cấu hình Gemini:** tách helper cấu hình theo nhóm model nhằm giảm rủi ro truyền sai tham số.
- **Hoàn tất bàn giao:** lưu báo cáo vào repo, kiểm tra thay đổi rồi thực hiện commit/push nếu có thể.

Ưu tiên trước hết là khôi phục khả năng build và kiểm thử các nhánh lỗi đã sửa. Chỉ sau bước đó mới có đủ căn cứ nâng mức xác nhận từ “đã chỉnh sửa” sang “đã kiểm chứng”.

## 4. Checklist tuân thủ api.md

Dữ liệu không cung cấp nội dung `api.md` hoặc nguyên văn tám tiêu chí của đề bài. Checklist dưới đây đối chiếu tám nhóm yêu cầu thể hiện trong kết quả sửa, **không thay thế việc xác nhận tuân thủ đầy đủ `api.md`**. Dấu `[x]` biểu thị đã có ghi nhận chỉnh sửa; không biểu thị đã kiểm thử thành công.

- [x] Validator chấp nhận `AIzaSy` và `AQ`; các hàm set/check dùng chung validator.
- [x] Model mặc định được đổi sang `gemini-3.8-flash`.
- [x] Chuỗi fallback được cập nhật đúng thứ tự đã nêu; danh sách hiển thị được rà soát.
- [x] Cấu hình `gemini-3*` chỉ giữ `thinkingLevel`, không truyền `temperature/topP/topK`.
- [x] Lỗi 502/503/504 được nhận diện để tiếp tục fallback, kể cả luồng SKKN.
- [x] Lỗi 429 được xử lý theo cooldown/quota, không đánh dấu key không hợp lệ.
- [ ] Xác nhận toàn repo không ghi API key hoặc dữ liệu nhạy cảm vào log.
- [ ] Hoàn tất build, lint và đối chiếu trực tiếp đầy đủ yêu cầu trong `api.md`.