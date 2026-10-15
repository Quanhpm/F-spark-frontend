# Tự động tạo Google Calendar và Google Meet từ F-Spark

> Trạng thái: Tạm hoãn, chưa triển khai.

## Tóm tắt

- Mentor kết nối Google Calendar một lần qua OAuth consent riêng. Đăng nhập Google hiện tại chỉ xác thực danh tính bằng ID token nên không đủ quyền Calendar.
- Dùng Google Identity Services Authorization Code Popup Flow; backend lưu refresh token mã hóa để có thể đồng bộ khi người dùng không còn ở trang.
- Khi mentor tạo availability hoặc external meeting, F-Spark tự tạo event trên Calendar chính, sinh Google Meet riêng và lưu link.
- Đồng bộ một chiều: F-Spark là nguồn dữ liệu chuẩn.
- Nếu Google lỗi, không lưu thay đổi nghiệp vụ trên F-Spark.

Tài liệu tham khảo:

- [Google OAuth Code Model](https://developers.google.com/identity/oauth2/web/guides/use-code-model)
- [Google Calendar OAuth scopes](https://developers.google.com/workspace/calendar/api/auth)
- [Google Calendar Events API](https://developers.google.com/workspace/calendar/api/v3/reference/events/insert)

## Backend và database

### Migration V39

Thêm `google_calendar_connections`:

- Một connection cho mỗi mentor account.
- Lưu Google email, refresh token đã mã hóa AES-256-GCM, scopes, trạng thái `CONNECTED | REAUTH_REQUIRED | DISCONNECTED`, thời điểm kết nối/cập nhật/lỗi.
- Token encryption key lấy từ secret môi trường; không lưu token dạng rõ và không ghi token vào log.
- Account bị xóa thì connection bị xóa theo.

Bổ sung cho availability slot và meeting:

- `google_calendar_event_id`.
- `google_calendar_event_url`.
- `google_calendar_synced_at`.
- Các cột nullable để dữ liệu cũ tiếp tục hoạt động.
- Meeting đặt qua slot dùng event ID của slot; external meeting dùng event ID trên meeting.

### OAuth API

Thêm API chỉ dành cho mentor:

- `GET /api/integrations/google-calendar/status`.
- `POST /api/integrations/google-calendar/connect` với body `{ "code": "..." }`.
- `DELETE /api/integrations/google-calendar/connection`.

Quy tắc:

- Frontend dùng `google.accounts.oauth2.initCodeClient()` với popup.
- Scope gồm `openid`, `email` và `https://www.googleapis.com/auth/calendar.events.owned`.
- Backend đổi authorization code lấy access/refresh token bằng client secret.
- Google email phải trùng email F-Spark, không phân biệt hoa thường.
- Nếu không có refresh token mới khi reconnect, giữ token cũ còn hợp lệ; nếu không có token nào thì yêu cầu consent lại.
- Disconnect cố gắng revoke token rồi luôn xóa secret cục bộ; giữ nguyên các event đã tạo.
- Google Sign-In hiện tại vẫn giữ nguyên và tách biệt với bước Connect Calendar.

### Calendar client

Tạo service tập trung xử lý token refresh và Google Calendar REST API:

- Calendar ID dùng `primary`.
- Cache access token trong bộ nhớ đến trước thời điểm hết hạn; database chỉ lưu refresh token mã hóa.
- Timeout ngắn, retry giới hạn cho `429` và `5xx`.
- `401/invalid_grant` chuyển connection sang `REAUTH_REQUIRED`.
- Không trả lỗi hoặc raw response chứa token ra frontend.
- Mỗi event dùng conference request ID riêng với loại `hangoutsMeet` và `conferenceDataVersion=1`.

Google Meet có thể được sinh bất đồng bộ:

- Poll event với backoff trong tối đa khoảng 10 giây.
- Chỉ coi thao tác thành công khi lấy được Meet URL.
- Nếu hết thời gian hoặc Google báo lỗi, xóa event vừa tạo theo cơ chế bù trừ và không lưu thay đổi F-Spark.

## Luồng đồng bộ nghiệp vụ

### Availability

Khi tạo slot:

1. Kiểm tra mentor active và Calendar đang `CONNECTED`.
2. Validate thời gian, overlap và các quy tắc hiện tại.
3. Tạo Calendar event `[F-Spark] Mentor availability`, chưa có attendee.
4. Sinh Meet link.
5. Chỉ sau khi Google thành công mới lưu slot với Meet URL và event ID.

Khi sửa slot:

- Slot đã có event ID: cập nhật thời gian, ghi chú và giữ nguyên Meet.
- Slot legacy chưa có event ID: tạo event mới và thay link thủ công bằng Meet link mới.
- Nếu event đã bị mentor xóa trực tiếp trên Google, F-Spark tự tạo lại event vì F-Spark là nguồn chuẩn.
- Slot đã được book tiếp tục không được chỉnh qua availability.

Khi cancel slot:

- Slot có event ID: xóa Google event trước; `404` được coi là đã xóa.
- Slot legacy không có event ID: chỉ cancel trên F-Spark.
- Google lỗi thì slot giữ nguyên trạng thái.

### Sinh viên book slot

- Khóa group rồi slot theo thứ tự hiện tại.
- Revalidate slot, mentor, hạn sáu giờ, quota và overlap.
- Với Calendar-managed slot:
  - Cập nhật tiêu đề thành `[F-Spark] Mentor meeting - {courseCode} - Group {groupNo} · {groupName}`.
  - Thêm attendee là toàn bộ group member active và instructor active.
  - Deduplicate email, bỏ email mentor organizer và email rỗng.
  - Gửi Calendar update tới tất cả attendee bằng `sendUpdates=all`.
- Chỉ tạo meeting và chuyển slot sang `BOOKED` sau khi Calendar update thành công.
- Nếu token bị revoke hoặc Google lỗi, slot vẫn `AVAILABLE`, meeting không được tạo và frontend hiển thị lý do.
- Slot legacy chưa từng được mentor chỉnh sửa tiếp tục dùng link thủ công và không tạo Calendar event.
- Thành viên tham gia group sau thời điểm booking không tự động được thêm vào invitation; họ vẫn xem được Meet link trên F-Spark.

### External meeting

- Bỏ trường nhập link thủ công; tạo Calendar event và Meet tự động.
- Event tương lai: mời group members active và instructor active, gửi invitation.
- Event đã qua: vẫn tạo Calendar event và Meet nhưng không thêm attendee, không gửi email muộn.
- Sửa external meeting đồng bộ event; bản ghi legacy được tạo event ở lần sửa đầu tiên.
- Cancel xóa event và gửi cập nhật hủy cho attendee.
- Completion, evidence và reopen không thay đổi Calendar event.

### Hủy meeting và lỗi đồng bộ

- Meeting đặt qua slot thao tác trên event của slot.
- External meeting thao tác trên event của meeting.
- Xóa event Google thành công rồi mới chuyển meeting/slot sang `CANCELED`.
- Nếu event đã bị xóa trực tiếp trên Google, coi thao tác xóa là thành công.
- Nếu mentor đã disconnect:
  - Bản ghi Calendar-managed không được sửa/hủy/book cho tới khi reconnect.
  - Bản ghi legacy không có event ID vẫn xử lý theo luồng cũ.
- Dùng event ID và conference request ID xác định trước để retry không tạo duplicate.
- Nếu Google đã thay đổi nhưng commit database thất bại, thực hiện bù trừ:
  - Create: xóa event vừa tạo.
  - Update: khôi phục snapshot cũ.
  - Delete: cố gắng tạo lại từ snapshot cũ.
- Nếu bù trừ cũng thất bại, ghi operations log có resource ID, event ID và correlation ID; tuyệt đối không ghi token.

## API và frontend

### API/DTO

- Request tạo/sửa availability và external meeting giữ `meetLink` ở dạng optional/deprecated để không phá client cũ; frontend mới không gửi trường này.
- Response slot/meeting giữ `meetLink` và thêm:
  - `googleCalendarManaged`.
  - `googleCalendarEventUrl`.
- Thêm `GoogleCalendarConnectionStatusDto` gồm trạng thái, Google email, `connectedAt` và message yêu cầu reconnect.
- Quy ước lỗi:
  - `409`: chưa kết nối hoặc cần reconnect.
  - `400`: authorization code sai hoặc email Google không khớp.
  - `502`: Google Calendar/Meet không phản hồi hoặc tạo conference thất bại.
- Cập nhật OpenAPI về OAuth consent, đồng bộ và lỗi.

### Mentor UI

Trên Availability và Meeting reports:

- Hiển thị banner trạng thái Calendar.
- Nút **Connect Google Calendar**, **Reconnect** hoặc **Disconnect**.
- Popup consent được khởi chạy bằng thao tác click của mentor.
- Disable tạo/sửa Calendar-managed record khi chưa kết nối.
- Loại bỏ input Google Meet/reference link khỏi form.
- Hiển thị “Google Meet and Calendar event will be created automatically”.
- Sau khi lưu thành công, hiển thị **Open Google Calendar** và **Open Google Meet**.
- Slot/meeting legacy có nhãn “Manual link”; lần sửa đầu cảnh báo link cũ sẽ được thay bằng Meet mới.
- Khi API báo reconnect hoặc Google lỗi, hiển thị toast rõ ràng và refresh dữ liệu; không báo thành công.

Student UI tiếp tục dùng `meetLink` hiện có, không gọi Google trực tiếp.

## Cấu hình và triển khai

- Bật Google Calendar API trong cùng Google Cloud project.
- Cấu hình OAuth consent screen và authorized JavaScript origins cho dev/staging/prod.
- Thêm secrets:
  - `GOOGLE_CLIENT_ID`.
  - `GOOGLE_CLIENT_SECRET`.
  - `GOOGLE_OAUTH_REDIRECT_URI` khớp chính xác frontend origin.
  - `GOOGLE_CALENDAR_TOKEN_ENCRYPTION_KEY`.
- Đưa OAuth app sang Internal hoặc Production trước rollout; app External ở trạng thái Testing có thể làm refresh token hết hạn sớm.
- Không backfill hàng loạt event cũ.
- Triển khai backend/migration trước, sau đó frontend; field mới nullable nên frontend cũ vẫn hoạt động trong thời gian chuyển tiếp.

## Kiểm thử và tiêu chí hoàn thành

### Backend

- Connect thành công, email khác bị từ chối, reconnect giữ/thay token đúng, disconnect xóa secret nhưng giữ event.
- Token được mã hóa trong PostgreSQL; không xuất hiện trong API/log.
- Tạo availability sinh đúng Calendar event, Meet riêng và thời gian `Asia/Ho_Chi_Minh`.
- Booking cập nhật đúng event, attendee và `sendUpdates=all`.
- External meeting tương lai có attendee; meeting quá khứ không gửi invitation.
- Update/cancel đồng bộ đúng; xử lý Google `404`, `401`, `403`, `429`, `5xx`, timeout và conference pending.
- Google lỗi không tạo slot/meeting, không đổi trạng thái và không làm tăng quota.
- Hai request create/book đồng thời không tạo duplicate event hoặc vượt quota.
- Dữ liệu legacy vẫn xem/book/cancel được; lần sửa đầu tạo event mới.
- Kiểm tra compensation khi database commit thất bại sau Calendar mutation.
- Chạy test service/controller với mock Google API, full Maven suite và PostgreSQL Flyway V39 regression.

### Frontend

- Connect/reconnect/disconnect và email mismatch hiển thị đúng.
- Form không còn input Meet link.
- Nút tạo/sửa bị khóa đúng khi Calendar chưa sẵn sàng.
- Thành công hiển thị Calendar/Meet link; lỗi không đóng form hoặc báo thành công sai.
- Legacy badge và cảnh báo thay link hoạt động.
- Chạy Vitest, TypeScript typecheck, ESLint và production build.

### Acceptance criteria

- Mentor chỉ cấp quyền Calendar một lần và sau đó tạo lịch F-Spark mà không copy Meet link.
- Mỗi lịch mới có một Google Meet riêng.
- Calendar và F-Spark đồng bộ khi tạo, sửa, book và cancel.
- Không có trạng thái F-Spark thành công khi Google operation tương ứng thất bại.
- Google token được bảo vệ và quyền truy cập giới hạn ở event trên calendar mentor sở hữu.
