# Bao Cao Rui Ro Bao Mat - 2026-03-16

## Pham vi danh gia
- He thong: Backend + Frontend
- Da loai tru khoi pham vi rui ro: 
  - frontend/src/app/(public)/payment/confirm/page.tsx
  - frontend/src/app/(public)/payment/qr/page.tsx
- Ly do loai tru: day la mock gia lap thanh toan ngan hang, khong tinh vao danh gia rui ro production.

## Tong quan
- Da bo sung khung ky thuat cho Filter + Interceptor + AOP o backend.
- Muc do rui ro hien tai (sau khi loai tru 2 page mock): TRUNG BINH.

## Rui ro chinh con lai
1. /api/auth/** dang permitAll qua rong
- Vi tri: backend/src/main/java/com/bus/system/config/SecurityConfig.java
- Anh huong: endpoint nhay cam (vi du /api/auth/me) de bi truy cap sai ngu canh neu khong co rang buoc ro rang.
- Khuyen nghi: permitAll theo endpoint cu the (login/register/refresh), cac endpoint con lai bat buoc authenticated.

2. Frontend middleware chi kiem tra co token, chua check role
- Vi tri: frontend/src/middleware.ts
- Anh huong: route admin/driver co the bi truy cap UI khi co token nhung sai role (backend van chan, nhung UX va be mat tan cong khong toi uu).
- Khuyen nghi: bo sung role guard tai middleware hoac route layout.

3. Cookie token dang set tu client side, khong phai HttpOnly
- Vi tri: frontend/src/providers/auth-provider.tsx
- Anh huong: neu xay ra XSS, token de bi doc.
- Khuyen nghi: chuyen qua cookie HttpOnly tu backend (Set-Cookie), giam luu token o JS runtime.

4. Public booking endpoint can tiep tuc siet
- Vi tri: backend/src/main/java/com/bus/system/config/SecurityConfig.java va backend/src/main/java/com/bus/system/modules/sales/controller/BookingController.java
- Anh huong: bo mat thong tin booking neu endpoint tra cuu qua de doan.
- Khuyen nghi: bat buoc cap doi thong tin xac thuc (code + phone/OTP), bo sung rate limit.

## Cac bo sung da thuc hien cho backend
1. Correlation ID Filter
- backend/src/main/java/com/bus/system/common/web/filter/CorrelationIdFilter.java

2. Request Logging Interceptor
- backend/src/main/java/com/bus/system/common/web/interceptor/RequestLoggingInterceptor.java
- backend/src/main/java/com/bus/system/config/WebMvcConfig.java

3. Service Execution Aspect
- backend/src/main/java/com/bus/system/common/aspect/ServiceExecutionAspect.java
- backend/pom.xml (them spring-boot-starter-aop)

## Trang thai kiem chung
- Backend compile: PASS (mvnw -DskipTests compile).
- Frontend lint: chua thuc hien duoc do thieu eslint binary trong moi truong hien tai.
