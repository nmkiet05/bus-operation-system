# Rule 02: Technology Stack & References

## 1. Công nghệ sử dụng

### Backend (Java/Spring Boot)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Spring Boot 3.4.1 |
| **Language** | Java 21 |
| **Database** | PostgreSQL (Supabase/Neon/Railway) |
| **ORM** | Spring Data JPA / Hibernate |
| **Migration** | Flyway |
| **Security** | Spring Security + JWT (jjwt 0.11.5) |
| **Validation** | Jakarta Validation + json-schema-validator |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) |
| **Caching** | Redis |
| **Distributed Lock** | Redisson (Giữ ghế 5 phút) |
| **Real-time** | WebSocket STOMP (Sơ đồ ghế real-time) |
| **Payment** | VNPay Sandbox |
| **Notification** | Firebase FCM + Telegram Bot |
| **Utility** | Lombok |
| **Build Tool** | Maven |
| **Container** | Docker |

### Frontend (Web)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Next.js (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS (Utility-first) |
| **UI Components** | Shadcn/ui + Radix UI (Headless) |
| **Icons** | Lucide React |
| **State** | React Query + Context API |
| **Real-time** | STOMP over WebSocket |
| **Seat Map** | Grid/Flexbox rendering từ JSON |

### Mobile (Flutter)
| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Flutter (GetX/Bloc) |
| **Storage** | Secure Storage (Token) |
| **QR Scanner** | Camera plugin |
| **Notification** | Firebase Cloud Messaging |

### DevOps & Tools
| Tool | Mục đích |
|------|----------|
| **Docker** | Containerization |
| **Render/Railway** | Cloud Deployment |
| **Ngrok** | Local tunnel (Test VNPay IPN) |
| **Postman** | API Testing |

---

## 2. Quy tắc Git

| Quy tắc | Mô tả |
|---------|-------|
| **Auto push** | Sau khi update code, nếu không có lỗi → tự động commit và push lên GitHub |
| **Commit message format** | `type(scope): description` (tiếng Anh) |
| **Commit types** | `feat`, `fix`, `refactor`, `docs`, `test`, `chore` |
| **Kiểm tra trước push** | Chạy `git status` và `mvn compile` để xác nhận |

**Ví dụ commit message:**
- `feat(route): add CRUD endpoints for routes`
- `fix(auth): resolve JWT token expiration issue`
- `refactor(bus): extract validation logic to service`

---

## 3. Quy trình chạy & test

| Lệnh | Mô tả |
|------|-------|
| `./mvnw spring-boot:run` | Chạy ứng dụng (development) |
| `./mvnw test` | Chạy unit tests |
| `./mvnw compile` | Compile để kiểm tra lỗi |
| `./mvnw clean package` | Build JAR file |

**Swagger UI:** Truy cập `http://localhost:8080/swagger-ui.html` sau khi chạy ứng dụng

---

## 4. Reference Repositories (GitHub tham khảo)

### 🚌 Dự án cốt lõi: Bus Reservation System

| Repository | Công nghệ | Giá trị tham khảo |
|------------|-----------|-------------------|
| [safadtm/bus_reservation_springboot](https://github.com/safadtm/bus_reservation_springboot) | Spring Boot, Spring Security, MySQL, JPA | Thiết kế Entity: `Bus` - `Route` - `Schedule`, Booking flow |
| [yoanesber/Spring-Boot-JWT-Auth-PostgreSQL](https://github.com/yoanesber/Spring-Boot-JWT-Auth-PostgreSQL) | Spring Boot 3, PostgreSQL, Spring Security 6 | Cấu hình JWT (Access + Refresh Token) chuẩn PostgreSQL |

### ⚙️ Kỹ thuật nâng cao

| Repository | Công nghệ | Giá trị tham khảo |
|------------|-----------|-------------------|
| [slydeveloper/springboot-flyway-postgres-docker](https://github.com/slydeveloper/springboot-flyway-postgres-docker) | Flyway, Gradle, Docker | Tổ chức thư mục `db/migration`, `V1__init.sql` |
| [kh77/sb-redisson-lock](https://github.com/kh77/sb-redisson-lock) | Redisson, Redis | Annotation `@DistributedLock`, `RLock` chặn transaction song song |
| [callicoder/spring-boot-websocket-chat-demo](https://github.com/callicoder/spring-boot-websocket-chat-demo) | WebSocket STOMP | Cơ chế Broadcast message, subscribe theo room/topic |
| [koushikkothagal/movie-booking-application](https://github.com/koushikkothagal/movie-booking-application) | Microservices | Cấu trúc Entity `Seat`, `Booking` - logic chọn ghế giống xe khách |

### 📚 Tài liệu kỹ thuật

| Chủ đề | Link tham khảo |
|--------|----------------|
| **Bitmasking (Lịch chạy T2-CN)** | [Baeldung - Bitwise Operations in Java](https://www.baeldung.com/java-bitwise-operators) |
| **Logic công thức** | `(bitmap & (1 << (dayOfWeek - 1))) > 0` |
