# Deployment Guide - BOS (Bus Operation System)

Tài liệu hướng dẫn triển khai hệ thống Bus Operation System trên môi trường Local (Phát triển) và Production (Thực tế).

---

## 📋 Yêu Cầu Hệ Thống (Prerequisites)

- **Docker & Docker Compose** (Bắt buộc cho cả Local và Production nếu dùng Container)
- **Java 21+** (Nếu chạy Backend native)
- **Node.js 20+** (LTS) (Nếu chạy Frontend native)
- **PostgreSQL 15+**
- **Redis 7+**

---

## 🐳 Triển Khai Môi Trường Local (Bằng Docker)

Cách nhanh nhất để khởi chạy toàn bộ hệ thống (Database, Redis, Backend, Frontend) trên máy tính cá nhân.

### Bước 1: Khởi Chạy Hệ Thống

Tại thư mục gốc của dự án, mở Terminal/Command Prompt và chạy lệnh sau:

```bash
# Build và chạy tất cả các dịch vụ (chạy ngầm)
docker-compose up --build -d
```

### Bước 2: Kiểm Tra Trạng Thái

```bash
# Xem log của tất cả dịch vụ
docker-compose logs -f

# Xem trạng thái các container đang chạy
docker ps
```

### Bước 3: Truy Cập Ứng Dụng

Sau khi các container báo trạng thái `running`, bạn có thể truy cập:

| Dịch Vụ | Địa Chỉ | Mô Tả |
|---|---|---|
| **Frontend** | `http://localhost:3000` | Giao diện Next.js cho Admin/User |
| **Backend API** | `http://localhost:8080/api` | API Endpoint (Spring Boot) |
| **Swagger UI** | `http://localhost:8080/swagger-ui/index.html` | Tài liệu API tự động |
| **PgAdmin** | `http://localhost:5050` | Giao diện quản lý Database |

*Lưu ý:* Thông tin đăng nhập PgAdmin mặc định là `admin@bos.com` / `Admin@123456` (được cấu hình trong `docker-compose.yml`).

### Bước 4: Dừng Hệ Thống

```bash
# Dừng và gỡ bỏ các container
docker-compose down
```

---

## 🚀 Triển Khai Lên Production Server (VPS/Cloud)

Để đưa ứng dụng lên môi trường thực tế (như AWS EC2, DigitalOcean Droplet), chúng ta cần thiết lập Reverse Proxy và HTTPS.

### Kiến Trúc Production Đề Xuất

```text
[Client Browser] 
    ↓ (HTTPS : 443)
[Nginx Reverse Proxy]
    ↓
    ├─→ [Frontend Next.js - Port 3000]
    └─→ [Backend API Spring Boot - Port 8080]
         ↓
    ├─→ [PostgreSQL - Port 5432]
    └─→ [Redis - Port 6379]
```

### 1. Cấu Hình Environment Variables

Trước khi deploy, bạn PHẢI tạo/cập nhật các tệp môi trường (`.env`) và ghi đè cấu hình bảo mật.

**Backend (`backend/src/main/resources/application-prod.yml` hoặc `.env`):**
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/bos_db
    username: admin
    password: <MẬT_KHẨU_DB_THẬT>
app:
  jwtSecret: <TẠO_CHUỖI_BÍ_MẬT_MỚI_DÀI_ÍP_NHẤT_32_KÝ_TỰ>
cors:
  allowed:
    origins: "https://yourdomain.com"
```

**Frontend (`frontend/.env.production`):**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
NODE_ENV=production
```

### 2. Thiết Lập Nginx Reverse Proxy (Kèm SSL)

Cài đặt Nginx và Certbot trên server:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

Tạo file cấu hình `/etc/nginx/sites-available/bos`:

```nginx
# Cấu hình cho Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Cấu hình cho Frontend Next.js
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt cấu hình và cấp chứng chỉ SSL:
```bash
sudo ln -s /etc/nginx/sites-available/bos /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com
sudo systemctl restart nginx
```

### 3. Deploy Bằng Docker Compose (Production)

Tại máy chủ, clone code về và chạy:

```bash
git clone https://github.com/nmkiet05/bus-operation-system.git
cd bus-operation-system

# Chạy build
docker-compose -f docker-compose.yml up --build -d
```

---

## 🔧 Xử Lý Sự Cố Thường Gặp (Troubleshooting)

### 1. Lỗi CORS (Cross-Origin Resource Sharing)
**Triệu chứng:** Frontend gọi API nhưng trình duyệt báo đỏ lỗi `CORS policy blocked`.
**Giải pháp:** Đảm bảo biến `CORS_ALLOWED_ORIGINS` của Backend đã bao gồm đúng chính xác Domain của Frontend (VD: `https://yourdomain.com`). Không được có dấu `/` ở cuối.

### 2. Frontend Không Thể Fetch Data
**Triệu chứng:** Màn hình loading mãi hoặc trắng trang.
**Giải pháp:** Kiểm tra biến `NEXT_PUBLIC_API_URL` trong Frontend. Biến này dùng để trình duyệt gọi thẳng đến Backend, do đó nó phải là địa chỉ Public (VD: `https://api.yourdomain.com/api` hoặc `http://localhost:8080/api`), không được dùng `http://backend:8080/api` (vì trình duyệt không hiểu Docker networking).

### 3. Database Double-Booking / Lỗi Lock
**Triệu chứng:** Màn hình đặt vé báo lỗi `Lock acquisition failed`.
**Giải pháp:** Đảm bảo container Redis đang chạy khỏe mạnh. Kiểm tra logs: `docker logs bos_redis`. Nếu Redis chết, tính năng chống Double-booking sẽ từ chối bán vé để đảm bảo an toàn toàn vẹn dữ liệu.

---

## 🔐 Check-List Bảo Mật Trực Tuyến

- [ ] KHÔNG commit các file `.env` thực chứa mật khẩu lên Github.
- [ ] Xóa bỏ/Sửa thông tin mặc định của tài khoản Database (`admin/Admin@123456`) trong `docker-compose.yml` trước khi chạy thực tế.
- [ ] Chắc chắn rằng cổng `5432` (Postgres) và `6379` (Redis) không bị phơi bày ra mạng Internet (Nên chặn bằng Firewall ufw, chỉ cho Docker internal network gọi).
- [ ] Tắt tính năng in câu lệnh SQL (`spring.jpa.show-sql=false`) trên Production để tránh rò rỉ cấu trúc DB và tiết kiệm tài nguyên ghi log.
