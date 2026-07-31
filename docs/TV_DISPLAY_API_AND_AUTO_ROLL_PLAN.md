# Kế hoạch API pagination và auto-roll card cho TV Display

> Trạng thái: **Đề xuất, chưa triển khai**  
> Phạm vi: `/admin/tv-display`  
> Nguyên tắc chính: **giữ nguyên UI hiện tại, không autoscroll, không thêm thư viện ngoài**

## 1. Mục tiêu

1. Giữ nguyên bố cục, component card, màu sắc, kích thước, header, footer, search và cách mở dialog hiện tại.
2. Thay nguồn dữ liệu hiện tại bằng API TV Showcase có pagination.
3. Chỉ cột trái **Tiến độ dự án** tự chuyển card nổi bật.
4. Mỗi 1 giây chuyển từ card hiện tại sang card kế tiếp.
5. Không thay đổi `scrollTop`, không tạo chuyển động cuộn liên tục và không hiển thị scrollbar.
6. Khi card đang chạy gần cuối dữ liệu đã tải, gọi page tiếp theo và nối dữ liệu vào danh sách.
7. Cột phải **Tuyển thành viên** giữ nguyên hành vi hiện tại, không có timer auto-roll riêng.

## 2. Những thay đổi không được thực hiện

- Không đổi JSX và Tailwind class của `ProjectCard`, `RecruitmentCard` hoặc khung trang.
- Không bỏ search, tab, footer hoặc các thông tin đang có trên màn hình.
- Không thêm `react-window`, carousel package hay thư viện autoscroll.
- Không chuyển danh sách sang native scroll hoặc virtualized scroll.
- Không đồng bộ chuyển động hai cột.
- Không tự gọi DOM `.focus()` mỗi giây vì sẽ giành focus bàn phím và gây nhiễu cho screen reader.

Khái niệm “focus card” trong kế hoạch này là **trạng thái active về mặt hình ảnh**: card giữa sáng, rõ viền và shadow; các card xung quanh giữ cách hiển thị mờ hiện tại.

## 3. Hiện trạng cần thay đổi

`useTvDisplay()` hiện gọi song song:

```text
GET /api/dashboard/admin/groups
GET /api/groups
```

Frontend tự ghép hai response và refetch mỗi 60 giây. Cách này tải toàn bộ dữ liệu, không có pagination và có rủi ro lệch dữ liệu giữa hai request.

`VerticalCarousel` hiện hỗ trợ wheel, touch, keyboard và custom momentum. Component đã có sẵn:

- `anchorIndex` để xác định card ở giữa.
- Active state tại slot `offset === 0`.
- Modulo để quay vòng danh sách.
- Style opacity, scale và vị trí cho các card xung quanh.

Phương án mới tái sử dụng carousel này, chỉ bổ sung bộ điều khiển auto-roll theo index. Không dựng một hệ thống scroll mới.

## 4. API pagination

### 4.1. Endpoint

```http
GET /api/dashboard/tv-showcase
Authorization: Bearer <accessToken>
```

Query:

| Field | Giá trị |
| --- | --- |
| `page` | Bắt đầu từ `0` |
| `size` | Cố định `20` |
| `term` | Tùy chọn |
| `courseCode` | Tùy chọn |

API layer tiếp tục dùng `apiGet` sẵn có để tự dùng access token và cơ chế xử lý lỗi chung của dự án.

### 4.2. Infinite query

Đổi `useQuery` sang `useInfiniteQuery` của TanStack Query đang có sẵn trong repo:

```ts
initialPageParam: 0

getNextPageParam: (lastPage) =>
  lastPage.hasNext ? lastPage.number + 1 : undefined
```

Query key phải chứa toàn bộ filter ảnh hưởng tới dữ liệu:

```ts
["tv-display", "showcase", { term, courseCode, size: 20 }]
```

Các page đã tải được giữ trong cache của query. Không sao chép cache sang một React state khác.

### 4.3. Chuẩn hóa dữ liệu

Các page được nối theo đúng thứ tự:

```ts
const items = data.pages.flatMap((page) => page.content);
```

Sau đó dùng `useMemo` để tạo:

- `projects`: dữ liệu cho cột trái.
- `recruitments`: item có thông tin tuyển thành viên cho cột phải.

Dedupe theo khóa ổn định như `groupId` để phòng trường hợp dữ liệu ở ranh giới hai offset page bị trùng khi backend có cập nhật đồng thời.

Swagger hiện có khả năng mô tả sai schema `content[]`. API boundary phải nhận `unknown`, kiểm tra shape và chỉ trả DTO hợp lệ vào query cache. UI không đọc trực tiếp raw response.

## 5. Auto-roll card ở cột trái

### 5.1. Nhịp chuyển card

`VerticalCarousel` nhận các prop tùy chọn mới, ví dụ:

```ts
autoAdvanceMs?: number;
onApproachingEnd?: (activeIndex: number) => void;
```

Chỉ danh sách cột trái truyền:

```ts
autoAdvanceMs={1_000}
```

Cột phải không truyền prop này nên không phát sinh timer.

Mỗi tick:

```text
card 1 active
  -> sau 1 giây
card 2 active
  -> sau 1 giây
card 3 active
```

Chuyển động dùng state/index và transform/opacity sẵn có của carousel. Tuyệt đối không tăng `scrollTop` và không tạo vòng lặp `requestAnimationFrame` để cuộn theo pixel.

### 5.2. Quy tắc hoạt động

- `0 item`: hiển thị empty state hiện tại, không tạo timer.
- `1 item`: giữ card duy nhất ở trạng thái active, không tạo timer thừa.
- Từ `2 item`: tăng active index sau mỗi 1.000 ms.
- Khi người dùng wheel, touch hoặc dùng phím điều hướng ở cột trái, giữ hành vi thủ công hiện tại và bắt đầu lại đủ 1 giây trước lần auto-roll tiếp theo.
- Khi dialog chi tiết mở, dừng timer; khi đóng dialog, bắt đầu lại sau 1 giây.
- Khi tab/browser bị ẩn, dừng timer để tránh nhảy nhiều card khi quay lại.
- Với `prefers-reduced-motion: reduce`, vẫn đổi active card để TV tiếp tục trình chiếu nhưng đổi tức thời, không nội suy chuyển động.

Timer phải được cleanup khi component unmount hoặc khi danh sách/filter thay đổi. Không để nhiều interval chạy đồng thời.

### 5.3. Giữ vị trí khi nối page

Hiện tại `VerticalCarousel` reset về card đầu khi tham chiếu `items` thay đổi. Logic này phải được sửa để pagination không làm màn hình nhảy về đầu.

Quy tắc mới:

1. Lưu `id` của card đang active.
2. Khi page mới được append, tìm lại card đó trong danh sách mới.
3. Giữ nguyên card active và tiếp tục tick kế tiếp.
4. Chỉ về index `0` khi filter/query thực sự đổi hoặc card cũ không còn tồn tại.

## 6. Gọi API khi gần cuối

Ngưỡng prefetch mặc định: còn **5 card** trong dữ liệu đã tải.

```text
remaining = loadedProjectCount - activeProjectIndex - 1

fetchNextPage khi:
remaining <= 5
AND hasNextPage === true
AND isFetchingNextPage === false
```

Yêu cầu chống gọi trùng:

- Dùng trạng thái `isFetchingNextPage` của TanStack Query.
- Không gọi lại cùng page từ nhiều tick liên tiếp.
- Page mới append vào cuối và không thay đổi active card hiện tại.

Nếu active card chạm item cuối trong lúc page tiếp theo chưa trả về:

- Giữ item cuối active.
- Không quay về đầu khi `hasNextPage` vẫn là `true`.
- Khi page mới render xong, tiếp tục sang item đầu tiên của page mới.

Nếu đã hết toàn bộ dữ liệu (`hasNextPage === false`), tick sau item cuối quay về item đầu để bắt đầu vòng trình chiếu mới.

Nếu fetch page tiếp theo lỗi, giữ danh sách đã có và hiển thị theo cơ chế lỗi hiện tại; không xóa cache và không nhảy card.

## 7. Cột phải Tuyển thành viên

- Không auto-roll.
- Không autoscroll.
- Không có timer riêng.
- Giữ nguyên wheel, touch, keyboard và active state hiện tại.
- Khi cột trái tải thêm page, dữ liệu recruitment mới từ cùng response được append vào nguồn dữ liệu cột phải, nhưng cột phải không tự đổi card.

## 8. File dự kiến thay đổi khi triển khai

| File | Nội dung |
| --- | --- |
| `src/modules/tv-display/api/tv-display.api.ts` | Hàm gọi `/api/dashboard/tv-showcase` |
| `src/modules/tv-display/api/index.ts` | Export API nội bộ module |
| `src/modules/tv-display/types/index.ts` | DTO raw, page response, query và display model |
| `src/modules/tv-display/hooks/use-tv-display.ts` | `useInfiniteQuery`, flatten, dedupe và mapping |
| `src/modules/tv-display/components/vertical-carousel.tsx` | Timer auto-roll tùy chọn, giữ active item khi append page |
| `src/modules/tv-display/components/tv-display-page.tsx` | Bật auto-roll 1 giây và near-end callback chỉ cho cột trái |
| `docs/API.md` | Ghi nhận contract API sau khi xác nhận với backend |

Không thay đổi `package.json` hoặc `package-lock.json` vì không cần thư viện mới.

## 9. Thứ tự triển khai

1. Xác nhận payload thật của TV Showcase và pagination metadata.
2. Viết defensive parser tại API boundary.
3. Chuyển data hook sang infinite query, page size 20.
4. Flatten và dedupe các page bằng khóa ổn định.
5. Bổ sung chế độ auto-roll tùy chọn cho `VerticalCarousel`.
6. Chỉ bật `autoAdvanceMs={1_000}` ở cột trái.
7. Thêm prefetch khi còn 5 card và khóa request trùng.
8. Đảm bảo append page không reset active card.
9. Kiểm tra timer, dialog, tab ẩn, thao tác thủ công và reduced motion.
10. Chạy typecheck, lint, build và kiểm tra trực quan trên viewport TV.

## 10. Tiêu chí nghiệm thu

### UI

- Giao diện trước và sau triển khai không thay đổi về bố cục, màu sắc, card, header, footer và search.
- Không xuất hiện scrollbar mới.
- Không có chuyển động cuộn theo pixel.
- Chỉ card active thay đổi lần lượt, khoảng 1 giây/card.
- Chỉ cột trái tự chuyển card; cột phải đứng yên.

### Pagination

- Lần đầu chỉ gọi `page=0&size=20`.
- Khi active card còn cách cuối dữ liệu đã tải tối đa 5 item, gọi page tiếp theo đúng một lần.
- Page mới nối vào cuối mà không làm card active nhảy về đầu.
- Không gọi page mới khi `hasNextPage=false`.
- Các page đã tải được đọc từ cache, không request lại khi vòng hiển thị quay qua dữ liệu cũ.

### Trạng thái đặc biệt

- Một card duy nhất luôn sáng và không chạy timer thừa.
- Khi page mới đang tải, item cuối được giữ ổn định.
- Mở dialog thì auto-roll dừng; đóng dialog thì chạy lại sau 1 giây.
- Tương tác thủ công không bị timer giành quyền ngay lập tức.
- Cột phải không tự chuyển ngay cả khi nhận thêm dữ liệu.

### Kiểm tra kỹ thuật

```bash
npm run typecheck
npm run lint
npm run build
```

Kiểm tra trực quan tối thiểu ở `1024x768`, `1440x900` và màn hình TV thực tế.
