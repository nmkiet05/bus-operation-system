# System Overview (Bus Operation System)

## 1. Overview
Hệ thống **Bus Operation System (BOS)** là một nền tảng quản trị vận hành xe khách liên tỉnh, bao gồm quản lý đội xe, điều độ hành trình, bán vé và phân tích dữ liệu. Tài liệu này mô tả tổng quan kiến trúc và công nghệ được sử dụng, dựa trên cấu hình thực tế của dự án.

## 2. Technology Stack

Công nghệ được xác thực từ `backend/pom.xml`, `docker-compose.yml`, và `package.json`:

### Backend (Java Ecosystem)
- **Ngôn ngữ:** Java 21
- **Framework Core:** Spring Boot 3.4.1
- **Bảo mật:** Spring Security + JJWT (0.11.5) cho Stateless JWT Authentication
- **Data Access:** Spring Data JPA + Hibernate
- **Dynamic Queries:** QueryDSL 5.1.0 (sử dụng annotation processor sinh `Q-Classes`)
- **JSON Type Support:** Hypersistence Utils 3.9.0 (hỗ trợ `jsonb` trên PostgreSQL)
- **Concurrency & Cache:** Redis + Redisson 3.35.0 (Distributed Locks)

### Database & Migrations
- **Database:** PostgreSQL 15 (Alpine)
- **Migration Tool:** Flyway (quản lý versioning qua `db/migration` và `db/seed`)

### Frontend
- **Framework:** Next.js (React)
- **State/Fetch:** (Xác thực qua source code Next.js frontend)

## 3. Deployment Architecture

Kiến trúc triển khai chuẩn được định nghĩa tại `docker-compose.yml` bao gồm 5 container chạy trong chung mạng lưới ảo `bos-network`:

1. **bos_postgres:** Database chính (port `5432`).
2. **bos_redis:** Cache & Distributed Lock Server (port `6379`).
3. **bos_backend:** Spring Boot REST API (port `8080`).
4. **bos_frontend:** Next.js Web App (port `3000`).
5. **bos_pgadmin:** Công cụ quản trị Database UI (port `5050`).

## 4. Key Business Configurations

Dựa trên thiết lập trong `backend/src/main/resources/application.yml`:

### Quy tắc Đặt vé (Booking)
- **Thời gian giữ chỗ:** 15 phút (`booking.expiry-minutes`).
- **Idempotency Cache TTL:** 1 giờ.
- **Distributed Lock:** Wait timeout 10 giây, Lease time 300 giây (5 phút).

### Quy tắc Điều độ Chuyến xe (Operation)
- **Khoảng thời gian khẩn cấp (Urgent Window):** 60 phút trước giờ chạy.
- **Auto-escalation Timeout:** 10 phút. Khoảng thời gian Job quét để escalate các thay đổi chưa được xử lý.
- **Anti-spam Cooldown:** 15 phút giữa các lần yêu cầu đổi xe/tài xế.

### Quy định Thời gian lái xe (Driver Duty - Nghị định 10/2020)
- **Tối đa liên tục:** 240 phút (4 giờ).
- **Tối đa trong ngày:** 600 phút (10 giờ).
- **Tối đa trong tuần:** 2880 phút (48 giờ).
- **Thời gian nghỉ tối thiểu:** 15 phút giữa các ca chạy.

## 5. Security & Stability Policies
- **Rate Limiting:** Giới hạn 60 requests/phút (cấu hình `security.rate-limit.max-requests-per-minute`).
- **Flyway Development Flow:** Kích hoạt `clean-on-validation-error: true` giúp tự động reset database khi phát hiện file migration (`V1__...` hoặc `V999__...`) thay đổi lúc phát triển.
