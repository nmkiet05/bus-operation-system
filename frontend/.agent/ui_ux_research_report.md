# 🎨 Báo cáo Nghiên cứu UI/UX & Ý tưởng Thiết kế (Figma)

Để chuẩn bị cho việc thiết kế trên Figma, em đã tổng hợp các **Best Practices** từ các trang web đặt vé hàng đầu trong nước (VeXeRe, FUTA) và quốc tế (FlixBus, Busbud).

---

## 1. Phân tích Đối thủ (Competitor Analysis)

### 🇻🇳 Trong nước (Vietnam)
#### **VeXeRe (VXR)**
*   **Phong cách**: Hiện đại, nhiều thông tin, tập trung vào **Khuyến mãi** & **Đánh giá (Review)**.
*   **Điểm mạnh**:
    *   Bộ lọc (Filter) cực kỳ chi tiết: Giờ đi, Nhà xe, Điểm đón/trả, Đánh giá sao.
    *   Hiển thị giá gốc vs giá giảm rõ ràng.
*   **Màu sắc chủ đạo**: Xanh dương (Blue) + Vàng (Yellow) làm điểm nhấn.

#### **FUTA Bus Lines (Phương Trang)**
*   **Phong cách**: Truyền thống, Thương hiệu mạnh (Màu Cam).
*   **Điểm mạnh**:
    *   Quy trình chọn ghế (Seat Selection) rất trực quan (chia 2 tầng).
    *   Tối giản hóa các bước (Search -> Chọn giờ -> Chọn ghế -> Thanh toán).
*   **Màu sắc chủ đạo**: Cam (Orange) + Xanh lá (Green).

### 🌍 Quốc tế (Global)
#### **FlixBus**
*   **Phong cách**: Cực kỳ tối giản (Minimalism), Font chữ to, rõ ràng.
*   **Điểm mạnh**:
    *   Thanh tìm kiếm (Search Bar) rất to ở trang chủ.
    *   Hiển thị lộ trình (Timeline) dạng dọc rất dễ hiểu.
*   **Màu sắc chủ đạo**: Xanh Neon (Lime Green) + Cam.

#### **Busbud**
*   **Phong cách**: Sạch sẽ (Clean), tập trung vào ảnh đẹp của địa điểm.
*   **Điểm mạnh**: So sánh giá giữa các hãng xe rất tốt.

---

## 2. Đề xuất Luồng người dùng (User Flow) cho BOS

Dựa trên nghiên cứu, đây là luồng tối ưu nhất cho hệ thống của chúng ta:

### **Bước 1: Trang chủ (Home)**
*   **Hero Section**: Hình ảnh xe buýt hiện đại hoặc phong cảnh Việt Nam.
*   **Search Widget (Quan trọng nhất)**: Nổi bật giữa màn hình.
    *   Input: Nơi đi (Dropdown/Autocomplete).
    *   Input: Nơi đến.
    *   Input: Ngày đi (Datepicker).
    *   Button: "TÌM CHUYẾN" (To, màu nổi).

### **Bước 2: Trang Kết quả (Search Results)**
*   **Layout**: Chia 2 cột.
    *   **Cột trái (25%)**: Bộ lọc (Giờ, Giá, Loại xe, Điểm đón).
    *   **Cột phải (75%)**: Danh sách chuyến xe.
*   **Thẻ Chuyến xe (Trip Card)**:
    *   Giờ đi - Giờ đến (Duration).
    *   Tên nhà xe / Loại xe (Giường nằm 34 chỗ, Limousine...).
    *   **Giá tiền** (In đậm).
    *   Số ghế trống (Hiển thị màu đỏ nếu còn ít).
    *   Button "CHỌN CHUYẾN".

### **Bước 3: Chi tiết & Chọn ghế (Booking Details)**
*   Khi bấm "Chọn chuyến" -> Mở rộng (Expand) ngay bên dưới hoặc Popup.
*   **Sơ đồ ghế (Seat Map)**:
    *   Chia Tầng 1 / Tầng 2 (Tab).
    *   **Chú giải màu**:
        *   ⚪ Trắng/Xám nhạt: Trống (Available).
        *   🔴 Đỏ/Xám đậm: Đã đặt (Booked).
        *   🟡 Vàng/Xanh: Đang chọn (Selected).
        *   🔵 Xám: Đang được người khác giữ (Locked).
*   **Thông tin đón trả**: Chọn điểm lên xe, xuống xe cụ thể.

### **Bước 4: Thanh toán (Checkout)**
*   **Form**: Thông tin khách hàng (Tên, SĐT, Email).
*   **Tóm tắt đơn hàng**: Tổng tiền, Số ghế.
*   **Phương thức thanh toán**: Ví (Momo/VNPay) hoặc Chuyển khoản (QR Code).

---

## 3. Gợi ý Hệ thống Thiết kế (Design System) cho Figma

Anh có thể dùng thông số này để setup Figma:

### **Màu sắc (Color Palette) - Gợi ý "Premium & Trust"**
*   **Primary (Chủ đạo)**: `#0F172A` (Slate 900) - Sang trọng, tin cậy.
*   **Secondary (Hành động)**: `#3B82F6` (Blue 500) - Nút bấm, Link.
*   **Accent (Điểm nhấn)**: `#F59E0B` (Amber 500) - Giá tiền, Khuyến mãi.
*   **Success**: `#10B981` (Emerald 500) - Ghế đang chọn.
*   **Error**: `#EF4444` (Red 500) - Ghế đã bán.

### **Typography (Font chữ)**
*   **Font**: `Inter` hoặc `Roboto` (Dễ đọc trên Web/Mobile).
*   **H1 (Tiêu đề)**: Bold, 32px.
*   **Body**: Regular, 16px.

### **Spacing (Khoảng cách)**
*   Dùng hệ số 4px (4, 8, 12, 16, 24, 32, 64...).

---

## 5. 🧬 Chiến lược "Frankenstein" V2 (Style: RedBus + Omio)

Theo yêu cầu của anh, chúng ta sẽ chuyển hướng sang "ăn cắp" những điểm mạnh nhất của **redBus.vn** (tối ưu cho xe khách) và **omio.vn** (trải nghiệm người dùng Quốc tế cực mượt).

### 5.1. Trang Chủ (Copy **RedBus VN**)
*   **Mô tả vẽ Figma** (Dựa trên ảnh anh cung cấp):
    *   **Banner**: Ảnh bìa phong cảnh/graphic chiếm 40% màn hình trên cùng. Text "Ứng dụng đặt xe số 1 thế giới" màu trắng nổi bật.
    *   **Search Widget (Khung tìm kiếm)**:
        *   Nằm **đè lên** ranh giới giữa Banner và phần nền trắng bên dưới (Floating style).
        *   Hình dáng: Hình chữ nhật bo góc tròn (`rounded-xl`), nền trắng, đổ bóng nhẹ.
        *   **Cấu trúc Input**: Chia làm 3 phần ngăn cách bởi vạch dọc:
            1.  **Nơi đi**: Icon xe buýt + Text "Từ".
            2.  **Nơi đến**: Icon bến xe + Text "Đến".
            3.  **Ngày đi**: Icon lịch + Text ngày tháng + 2 nút nhỏ "Hôm nay", "Ngày mai".
    *   **Nút Tìm Kiếm**: Nằm **tách rời**, đè lên viền dưới của khung tìm kiếm, canh giữa. Màu đỏ `#D84E55`. Bo tròn hoàn toàn (Pill shape).

### 5.2. Trang Kết quả (Copy layout **Omio**)
*   **Tại sao?**: Omio trình bày thẻ vé (Ticket Card) cực kỳ khoa học, không bị rối như VeXeRe.
*   **Mô tả vẽ Figma**:
    *   **Bộ lọc (Top Bar)**: Thay vì để cột trái, Omio hay để thanh lọc ngang ở trên cùng (Giờ đi | Giá tiền | Loại xe). Anh có thể làm theo cách này cho rộng chỗ hiển thị vé.
    *   **Thẻ Chuyến xe (Ticket Card)**:
        *   Thiết kế dạng thẻ nổi (Shadow), bo góc.
        *   **Bố cục**:
            *   Góc Trái: Giờ Đi (To) ----> Giờ Đến (To). Ở giữa là thời gian chạy (8h).
            *   Góc Phải: **GIÁ TIỀN** (Màu đỏ RedBus).
            *   Bottom Card: Logo nhà xe + Tiện ích (Wifi, AC).

### 5.3. Chọn ghế (Copy **RedBus**)
*   **Tại sao?**: RedBus có giao diện chọn ghế rất trực quan, hiển thị rõ ghế V.I.P và ghế thường.
*   **Mô tả vẽ Figma**:
    *   Vẫn chia 2 tầng (như FUTA) nhưng Style hiện đại hơn.
    *   **Ghế Trống**: Viền xám nhạt (Stroke).
    *   **Ghế Đã đặt**: Màu xám xịt (Filled Gray).
    *   **Đang chọn**: Màu Đỏ/Hồng (Màu thương hiệu).
    *   **Chú giải giá tiền**: Ví dụ ghế đầu xe 300k, ghế cuối xe 250k (RedBus hay làm cái này).

### 5.4. Thanh toán (Minimalist style Omio)
*   **Phong cách**: Tối giản, chỉ hiện những gì cần thiết.
*   **Mô tả**:
    *   Form điền thông tin khách hàng ở bên Trái.
    *   Tóm tắt đơn hàng (Summary) "dính" (Sticky) ở bên Phải.
    *   Nút thanh toán to, rõ ràng.

---

## 6. Bảng màu đề xuất (Palette RedBus mix Omio)
*   **Primary (Màu chính)**: `#D84E55` (Đỏ RedBus) - Dùng cho nút bấm, giá tiền.
*   **Secondary (Màu phụ)**: `#132968` (Xanh Omio) - Dùng cho Header, Text tiêu đề.
*   **Background**: `#F8F9FA` (Xám rất nhạt) - Giúp nổi bật các thẻ Card trắng.
