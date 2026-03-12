# Deployment Guide - BOS (Bus Operation System)

## 📋 Tổng quan

Hệ thống BOS có thể triển khai theo 2 cách:
1. **Docker** (Development & Quick Deployment)
2. **Production Server** (VPS/Cloud như AWS, DigitalOcean, Azure)

---

## 🐳 Triển khai bằng Docker

### Bước 1: Cấu hình Environment Variables

#### Backend (.env)
```bash
# Copy template
cp backend/.env.example backend/.env

# Chỉnh sửa file backend/.env
nano backend/.env
```

**Lưu ý quan trọng:**
- `APP_JWT_SECRET`: Tạo secret key mới cho production: `openssl rand -hex 32`
- `CORS_ALLOWED_ORIGINS`: Thêm domain production của bạn

#### Frontend (.env.local)
```bash
# Copy template
cp frontend/.env.example frontend/.env.local

# Chỉnh sửa file frontend/.env.local
nano frontend/.env.local
```

### Bước 2: Build và Chạy

```bash
# Build và chạy tất cả services
docker-compose up --build -d

# Kiểm tra logs
docker-compose logs -f

# Dừng services
docker-compose down
```

### Bước 3: Truy cập

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080/api
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **PgAdmin**: http://localhost:5050

---

## 🚀 Triển khai lên Production Server

### Kiến trúc khuyến nghị

```
[Client Browser] 
    ↓
[Nginx Reverse Proxy - Port 80/443]
    ↓
    ├─→ [Frontend - Port 3000]
    └─→ [Backend API - Port 8080]
         ↓
    ├─→ [PostgreSQL - Port 5432]
    └─→ [Redis - Port 6379]
```

### Option 1: Docker trên Production Server

#### 1.1 Cấu hình Environment Variables

**Backend** (`backend/.env`):
```bash
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/bos_db
CORS_ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
APP_JWT_SECRET=<your-new-production-secret-here>
```

**Frontend** (`frontend/.env.production`):
```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
WATCHPACK_POLLING=false
NODE_ENV=production
```

**Docker Compose** (`docker-compose.yml`):
Cập nhật environment variables:
```yaml
backend:
  environment:
    CORS_ALLOWED_ORIGINS: https://yourdomain.com
```

#### 1.2 Setup Nginx Reverse Proxy

Tạo file `/etc/nginx/sites-available/bos`:

```nginx
# Backend API
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

# Frontend
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

Enable site và SSL:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bos /etc/nginx/sites-enabled/

# Install SSL với Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Restart nginx
sudo systemctl restart nginx
```

#### 1.3 Deploy

```bash
# Pull code mới nhất
git pull origin main

# Rebuild và deploy
docker-compose down
docker-compose up --build -d

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

### Option 2: Native Deployment (không dùng Docker)

#### 2.1 Backend Setup

**Yêu cầu:**
- Java 21+
- PostgreSQL 15+
- Redis

**Build:**
```bash
cd backend
./mvnw clean package -DskipTests

# Chạy JAR file
java -jar target/backend-0.0.1-SNAPSHOT.jar \
  --spring.datasource.url=jdbc:postgresql://localhost:5432/bos_db \
  --spring.datasource.username=admin \
  --spring.datasource.password=YourPassword \
  --app.jwtSecret=YourProductionSecret \
  --cors.allowed.origins=https://yourdomain.com
```

Hoặc dùng systemd service (`/etc/systemd/system/bos-backend.service`):
```ini
[Unit]
Description=BOS Backend Service
After=postgresql.service redis.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/var/www/bos/backend
Environment="SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/bos_db"
Environment="CORS_ALLOWED_ORIGINS=https://yourdomain.com"
ExecStart=/usr/bin/java -jar /var/www/bos/backend/target/backend.jar
Restart=always

[Install]
WantedBy=multi-user.target
```

#### 2.2 Frontend Setup

**Yêu cầu:**
- Node.js 24+

**Build:**
```bash
cd frontend

# Tạo production build
npm run build

# Chạy production server
npm run start
```

Hoặc dùng PM2:
```bash
# Install PM2
npm install -g pm2

# Start app
pm2 start npm --name "bos-frontend" -- start

# Save PM2 config
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### 1. CORS Error
**Triệu chứng:** Browser console hiện "CORS policy blocked"

**Giải pháp:**
```bash
# Kiểm tra CORS_ALLOWED_ORIGINS trong backend
docker exec bos_backend printenv CORS_ALLOWED_ORIGINS

# Nếu sai, cập nhật docker-compose.yml và restart
docker-compose restart backend
```

### 2. API Connection Failed
**Triệu chứng:** Frontend không kết nối được backend

**Checklist:**
- [ ] Backend đang chạy? `docker ps` hoặc `curl http://localhost:8080/api/catalog/stations`
- [ ] NEXT_PUBLIC_API_URL đúng chưa? Phải là domain có thể access từ browser
- [ ] CORS configured đúng chưa?

### 3. Database Connection Error
```bash
# Kiểm tra PostgreSQL
docker exec bos_postgres pg_isready

# Kiểm tra credentials
docker exec -it bos_postgres psql -U admin -d bos_db
```

---

## 📊 Monitoring & Logs

### Docker Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Backend Health Check
```bash
# API status
curl http://localhost:8080/actuator/health

# Swagger UI
http://localhost:8080/swagger-ui.html
```

---

## 🔐 Security Checklist

Trước khi deploy production:

- [ ] Đã đổi `APP_JWT_SECRET` thành giá trị mới
- [ ] Đã đổi database password mặc định
- [ ] Đã cấu hình CORS đúng với domain production
- [ ] Đã enable HTTPS/SSL
- [ ] Đã disable `show-sql` trong application.yml (production)
- [ ] Đã set `logging.level.root=WARN` (production)
- [ ] Không commit file `.env` vào Git

---

## 📝 Cheat Sheet

```bash
# Development
docker-compose up -d              # Start all services
docker-compose logs -f backend    # View backend logs
docker-compose restart backend    # Restart backend only
docker-compose down               # Stop all services

# Production rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Database backup
docker exec bos_postgres pg_dump -U admin bos_db > backup.sql

# Database restore
docker exec -i bos_postgres psql -U admin bos_db < backup.sql
```
