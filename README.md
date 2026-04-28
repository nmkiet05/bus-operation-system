# 🚌 Bus Operation System (BOS)

> **Nền tảng quản trị hệ thống xe khách chuyên nghiệp (Enterprise-grade)** — Số hóa quá trình vận hành đội xe, điều phối khẩn cấp thời gian thực, bán vé chống trùng lặp và phân tích doanh thu.

<p align="center">
  <img src="https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" />
  <img src="https://img.shields.io/badge/Spring_Boot-3.4.1-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-15-336791?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-Distributed_Lock-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## 📋 Mục lục

- [Tổng quan](#-tổng-quan)
- [Kiến trúc hệ thống](#-kiến-trúc-hệ-thống)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Các Module Backend](#-các-module-backend)
- [Kiến trúc Frontend — 3 Cổng Thông Tin](#-kiến-trúc-frontend--3-cổng-thông-tin)
- [Điểm nhấn Kỹ thuật Kỹ sư](#-điểm-nhấn-kỹ-thuật-kỹ-sư)
- [Thiết kế Cơ sở dữ liệu](#-thiết-kế-cơ-sở-dữ-liệu)
- [Hướng dẫn Cài đặt](#-hướng-dẫn-cài-đặt)
- [Tài liệu API](#-tài-liệu-api)
- [Cấu trúc Dự án](#-cấu-trúc-dự-án)

---

## 🎯 Tổng quan

BOS là một hệ thống full-stack, chuẩn production, bao quát **toàn bộ vòng đời** của một doanh nghiệp vận tải hành khách:

1. **Quản lý Đội xe (Fleet)** — Đăng ký phương tiện, theo dõi bảo hiểm, cấu hình sơ đồ ghế động (JSONB).
2. **Kế hoạch Tuyến (Planning)** — Định nghĩa tuyến đường, mẫu lịch chạy áp dụng theo hệ cơ số nhị phân (bitwise day-of-week).
3. **Vận hành Chuyến (Operations)** — Tự động sinh chuyến xe hàng ngày, phân công tài xế/xe và phát hiện xung đột lịch trình.
4. **Điều phối Khẩn cấp (Dispatching)** — Phân loại 5 cấp độ khẩn cấp (5-Zone) để xử lý thay đổi sự cố theo thời gian thực.
5. **Bán Vé (Sales)** — Luồng thanh toán e-commerce giữ chỗ, thanh toán QR, và xử lý hoàn tiền.
6. **Báo cáo Doanh thu (Analytics)** — Bảng điều khiển BI (Business Intelligence) phân tích doanh thu và hệ số lấp đầy (Load-factor) theo hạng ghế.

---

## 🏗 Kiến trúc hệ thống

```text
┌──────────────────────────────────────────────────────────┐
│                     TẦNG CLIENT                          │
│  ┌──────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  Cổng    │  │   Cổng       │  │   Cổng Đặt Vé      │  │
│  │ Quản Trị │  │   Tài Xế     │  │   (Khách Hàng)     │  │
│  │ (Desktop)│  │  (Mobile)    │  │   (Responsive)     │  │
│  └────┬─────┘  └──────┬───────┘  └─────────┬──────────┘  │
│       │               │                    │             │
│       └───────────────┼────────────────────┘             │
│                       │ Next.js 15 (SSR + CSR)           │
└───────────────────────┼──────────────────────────────────┘
                        │ REST API (JWT Auth)
┌───────────────────────┼──────────────────────────────────┐
│                 TẦNG BACKEND                             │
│          Spring Boot 3.4 — Modular Monolith              │
│  ┌─────────┬──────────┬──────────┬──────────┬─────────┐  │
│  │Identity │  Fleet   │Planning  │Operation │  Sales  │  │
│  │  (Auth) │(Vehicles)│ (Routes) │(Dispatch)│(Tickets)│  │
│  ├─────────┼──────────┼──────────┼──────────┼─────────┤  │
│  │ Pricing │  Reports │ Catalog  │   HR     │ Payment │  │
│  └─────────┴──────────┴──────────┴──────────┴─────────┘  │
└──────────┬────────────────────────────┬──────────────────┘
           │                            │
    ┌──────┴──────┐              ┌──────┴──────┐
    │ PostgreSQL  │              │    Redis    │
    │   15        │              │  (Redisson) │
    │ + Flyway    │              │  Dist. Lock │
    └─────────────┘              └─────────────┘
```

---

## 🛠 Công nghệ sử dụng

### Backend
| Công nghệ | Mục đích |
|:--|:--|
| **Java 21** | Ngôn ngữ lõi với các tính năng hiện đại |
| **Spring Boot 3.4** | Framework xây dựng REST API |
| **Spring Security + JWT** | Xác thực phi trạng thái & Phân quyền RBAC |
| **Spring Data JPA** | ORM (Hibernate 6) |
| **QueryDSL 5** | Trình tạo truy vấn động an toàn kiểu (Type-safe) |
| **Flyway** | Quản lý phiên bản Database (Migrations) |
| **Redisson** | Khóa phân tán (Distributed locking) chống trùng vé |
| **Springdoc OpenAPI** | Tự động tạo giao diện tài liệu Swagger UI |
| **Hypersistence Utils** | Hỗ trợ ánh xạ kiểu dữ liệu JSONB trong Hibernate |

### Frontend
| Công nghệ | Mục đích |
|:--|:--|
| **Next.js 15** | React framework hỗ trợ SSR/SSG |
| **TypeScript** | Đảm bảo an toàn kiểu dữ liệu |
| **Tailwind CSS 3** | Căn chỉnh CSS tiện ích cực nhanh |
| **Radix UI + shadcn/ui** | Thư viện Component với tính truy cập cao |
| **TanStack React Query** | Quản lý trạng thái server & Caching |
| **Recharts** | Trực quan hóa dữ liệu biểu đồ doanh thu |
| **Framer Motion** | Tạo hiệu ứng Animation mượt mà |
| **React Hook Form + Zod** | Xử lý Form và validate dữ liệu chặt chẽ |

---

## 📦 Các Module Backend

Backend tuân thủ kiến trúc **Modular Monolith** — chia làm 11 domain module với ranh giới rõ ràng:

```text
com.bus.system.modules
├── identity/      → Xác thực JWT, RBAC đa cấp độ (ADMIN/STAFF/DRIVER/CUSTOMER)
├── catalog/       → Quản lý danh mục: Tỉnh thành, bến xe, quầy vé, bãi đỗ
├── fleet/         → Loại xe, phương tiện, sơ đồ ghế (JSONB), theo dõi hạn đăng kiểm
├── hr/            → Hồ sơ tài xế, xác thực bằng lái
├── planning/      → Tuyến đường, mẫu lịch chạy sử dụng Bitwise Day-of-Week
├── pricing/       → Cấu hình giá, chính sách phụ thu lễ tết (JSONB logic)
├── operation/     → Sinh chuyến bay, phân công tài xế, điều phối khẩn cấp 5 cấp độ
├── sales/         → Giữ chỗ, vòng đời đơn hàng, xuất vé, hoàn vé
├── payment/       → Tích hợp cổng thanh toán (QR Code)
├── reports/       → Phân tích doanh thu, hệ số lấp đầy (CTE + Native SQL)
└── system/        → Cấu hình hệ thống, nhật ký Audit
```

---

## ⚡ Điểm nhấn Kỹ thuật Kỹ sư

### 1. Xử lý Đồng thời (Concurrency Control) — Tránh bán trùng ghế (Double-booking)
- **Vấn đề:** Hai người dùng chọn cùng một ghế tại cùng một microsecond.
- **Giải pháp:** Sử dụng **Redis Distributed Lock (Redisson)** kết hợp Khóa lạc quan **Optimistic Locking (`@Version`)**.
- Redis Lock tạo một hàng rào chặn việc ghi đè tại mức Database, trong khi `@Version` trên bảng `ticket` làm lưới an toàn dự phòng.

### 2. Hệ thống Điều phối Sự cố Khẩn cấp (5-Zone Emergency Dispatch)
Điều phối thay đổi tài xế/xe theo thời gian thực dựa trên thời gian còn lại đến lúc khởi hành:
- **Z1 (Chuẩn)**: > 60 phút
- **Z2 (Khẩn cấp)**: 15 - 60 phút
- **Z3 (Nguy cấp)**: < 15 phút (Buộc phải leo thang cảnh báo ngay)
- **Z4 (Đã xuất bến)**: Xe đang chạy, yêu cầu cứu hộ giữa đường.

### 3. Tối ưu Báo Cáo Hiệu Suất Cao (High-Performance Reporting)
- Bỏ qua ORM truyền thống (gây lỗi N+1 Queries) để dùng **PostgreSQL CTEs (Common Table Expressions)**.
- Gộp (Aggregate) dữ liệu doanh thu trực tiếp tại tầng Database, giảm thiểu độ trễ truy vấn từ vài giây xuống còn **~15ms** cho dữ liệu 6 tháng.

### 4. Xóa Mềm với Partial Unique Indexes (Soft-Delete)
- Tạo index duy nhất có điều kiện: `WHERE status NOT IN ('CANCELLED', 'EXPIRED')`.
- Cho phép ghế đã bị hủy có thể được đặt lại bởi người khác mà không vi phạm ràng buộc Unique Constraint.

---

## 🚀 Hướng dẫn Cài đặt & Chạy Thử

### Yêu cầu
- Docker & Docker Compose
- Git

### Chạy cực nhanh bằng Docker

```bash
# Tải mã nguồn
git clone https://github.com/nmkiet05/bus-operation-system.git
cd bus-operation-system

# Chạy tất cả các dịch vụ (PostgreSQL, Redis, Backend, Frontend)
docker-compose up --build -d
```

| Cổng / Dịch vụ | URL Truy cập | Tài khoản Mặc định |
|---|---|---|
| **Frontend** | `http://localhost:3000` | N/A |
| **API Swagger** | `http://localhost:8080/swagger-ui.html` | `admin` / `root@123456` |
| **PgAdmin DB** | `http://localhost:5050` | `admin@bos.com` / `Admin@123456` |

---

## 📄 Bản quyền
Dự án được phát triển dưới dạng Đồ án Tốt nghiệp (Thesis Project) tại **Trường Đại học Cần Thơ (Can Tho University)** — Khoa Công nghệ Thông tin và Truyền thông.

<p align="center">
  <sub>Built with ☕ Java, ⚛️ React, and 🐘 PostgreSQL</sub>
</p>
