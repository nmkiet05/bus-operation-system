# Bao Cao Giai Thich Middleware Tung Dong - 2026-03-16

## Pham vi
- Tap trung vao cac file middleware moi:
  - CorrelationIdFilter
  - RequestLoggingInterceptor
  - ServiceExecutionAspect
- Bo sung phan wiring trong WebMvcConfig va SecurityConfig.

## 1) CorrelationIdFilter
File: backend/src/main/java/com/bus/system/common/web/filter/CorrelationIdFilter.java

- Dong 1: Khai bao package cho nhom filter.
- Dong 2: Dong trong tach khoi import.
- Dong 3: Import FilterChain de tiep tuc chuoi filter sau khi xu ly.
- Dong 4: Import ServletException cho chu ky ham filter.
- Dong 5: Import HttpServletRequest de doc header/attribute request.
- Dong 6: Import HttpServletResponse de set header response.
- Dong 7: Import MDC de gan context log theo request.
- Dong 8: Import Ordered de dat thu tu filter.
- Dong 9: Import Order annotation.
- Dong 10: Import Component de Spring tu dong quan ly bean.
- Dong 11: Import StringUtils de check chuoi co noi dung.
- Dong 12: Import OncePerRequestFilter de dam bao 1 request chay 1 lan filter.
- Dong 13: Dong trong.
- Dong 14: Import IOException theo chu ky filter.
- Dong 15: Import UUID de tao request id moi.
- Dong 16: Dong trong.
- Dong 17: Danh dau class la bean Spring.
- Dong 18: Dat filter o muc uu tien cao nhat.
- Dong 19: Khai bao class filter, ke thua OncePerRequestFilter.
- Dong 20: Dong trong.
- Dong 21: Hang ten header request id.
- Dong 22: Hang key dung trong MDC.
- Dong 23: Dong trong.
- Dong 24: Override ham xu ly chinh cua filter.
- Dong 25: Tham so request.
- Dong 26: Tham so response.
- Dong 27: Tham so filterChain + throws exception can thiet.
- Dong 28: Lay request id tu header neu client gui len.
- Dong 29: Neu header rong/khong co thi tao id moi.
- Dong 30: Tao UUID lam request id.
- Dong 31: Ket thuc if tao moi.
- Dong 32: Dong trong.
- Dong 33: Day request id vao MDC de log xuyen suot.
- Dong 34: Gan request id vao request attribute cho lop sau dung lai.
- Dong 35: Tra request id ve response header de client va log gateway doi chieu.
- Dong 36: Dong trong.
- Dong 37: Bat dau khoi try de dam bao cleanup MDC.
- Dong 38: Chuyen request den filter tiep theo/handler.
- Dong 39: finally de cleanup du co loi hay khong.
- Dong 40: Xoa request id khoi MDC tranh leak context qua request khac.
- Dong 41: Ket thuc finally.
- Dong 42: Ket thuc ham.
- Dong 43: Ket thuc class.

## 2) RequestLoggingInterceptor
File: backend/src/main/java/com/bus/system/common/web/interceptor/RequestLoggingInterceptor.java

- Dong 1: Khai bao package cho nhom interceptor.
- Dong 2: Dong trong.
- Dong 3: Import CorrelationIdFilter de dung chung key requestId.
- Dong 4: Import HttpServletRequest.
- Dong 5: Import HttpServletResponse.
- Dong 6: Import Logger interface.
- Dong 7: Import LoggerFactory de tao logger.
- Dong 8: Import Component de dang ky bean.
- Dong 9: Import HandlerInterceptor cua Spring MVC.
- Dong 10: Dong trong.
- Dong 11: Danh dau bean Spring.
- Dong 12: Khai bao class interceptor.
- Dong 13: Dong trong.
- Dong 14: Tao logger cho class.
- Dong 15: Key attribute de luu thoi gian bat dau request.
- Dong 16: Nguong canh bao request cham (1000ms).
- Dong 17: Dong trong.
- Dong 18: Override preHandle.
- Dong 19: Chu ky preHandle voi request/response/handler.
- Dong 20: Luu timestamp bat dau vao request attribute.
- Dong 21: Tra true de tiep tuc xu ly request.
- Dong 22: Ket thuc preHandle.
- Dong 23: Dong trong.
- Dong 24: Override afterCompletion.
- Dong 25: Tham so request.
- Dong 26: Tham so response.
- Dong 27: Tham so handler.
- Dong 28: Tham so exception neu co.
- Dong 29: Doc lai startTime da luu o preHandle.
- Dong 30: Neu khong ep kieu duoc Long thi bo qua an toan.
- Dong 31: return som neu thieu du lieu.
- Dong 32: Ket thuc if.
- Dong 33: Dong trong.
- Dong 34: Tinh tong thoi gian request (ms).
- Dong 35: Lay HTTP method.
- Dong 36: Lay request URI.
- Dong 37: Lay status code response.
- Dong 38: Lay requestId tu request attribute.
- Dong 39: Dong trong.
- Dong 40: Neu co exception trong qua trinh xu ly.
- Dong 41: Log muc error kem requestId, method, path, status, duration.
- Dong 42: Ghi them ten class exception.
- Dong 43: return de ket thuc nhanh khi da log exception.
- Dong 44: Ket thuc if ex.
- Dong 45: Dong trong.
- Dong 46: Neu request cham hon nguong.
- Dong 47: Log warn de de theo doi hieu nang.
- Dong 48: Nhanh else cho request binh thuong.
- Dong 49: Log info cho request binh thuong.
- Dong 50: Ket thuc if/else.
- Dong 51: Ket thuc afterCompletion.
- Dong 52: Ket thuc class.

## 3) ServiceExecutionAspect
File: backend/src/main/java/com/bus/system/common/aspect/ServiceExecutionAspect.java

- Dong 1: Khai bao package cho nhom aspect.
- Dong 2: Dong trong.
- Dong 3: Import Slf4j de dung log qua Lombok.
- Dong 4: Import ProceedingJoinPoint cho around advice.
- Dong 5: Import Around annotation.
- Dong 6: Import Aspect annotation.
- Dong 7: Import MDC de doc requestId.
- Dong 8: Import Component de Spring quan ly bean.
- Dong 9: Dong trong.
- Dong 10: Danh dau class la Aspect.
- Dong 11: Dang ky bean Spring.
- Dong 12: Tao logger tu dong.
- Dong 13: Khai bao class.
- Dong 14: Dong trong.
- Dong 15: Nguong danh dau service cham 300ms.
- Dong 16: Dong trong.
- Dong 17: Pointcut: bat moi ham trong modules..service..*(..).
- Dong 18: Ham around bao quanh viec goi service.
- Dong 19: Luu thoi gian bat dau theo nano giay.
- Dong 20: Lay requestId tu MDC de trace lien ket voi log request.
- Dong 21: Lay ten ngan gon method dang chay.
- Dong 22: Dong trong.
- Dong 23: Bat dau try de xu ly thanh cong.
- Dong 24: Goi ham service thuc te.
- Dong 25: Tinh thoi gian xu ly theo ms.
- Dong 26: Dong trong.
- Dong 27: Neu cham hon nguong.
- Dong 28: Log warn cho service cham.
- Dong 29: Nhanh else.
- Dong 30: Log debug cho service binh thuong.
- Dong 31: Ket thuc if/else.
- Dong 32: Dong trong.
- Dong 33: Tra ket qua goc cua service.
- Dong 34: Bat loi moi loai throwable.
- Dong 35: Tinh duration den luc loi.
- Dong 36: Log error gom requestId, service, duration.
- Dong 37: Ghi ten class loi.
- Dong 38: Nem lai loi de khong thay doi hanh vi nghiep vu.
- Dong 39: Ket thuc catch.
- Dong 40: Ket thuc ham around.
- Dong 41: Ket thuc class.

## 4) Wiring trong WebMvcConfig
File: backend/src/main/java/com/bus/system/config/WebMvcConfig.java

- Dong 3: Import RequestLoggingInterceptor tu package moi.
- Dong 9-11: Danh dau config Spring MVC.
- Dong 13: Inject interceptor.
- Dong 16-17: Dang ky interceptor vao chuoi MVC.
- Dong 18-22: Loai tru endpoint docs/error de giam nhieu log khong can thiet.

## 5) Wiring trong SecurityConfig
File: backend/src/main/java/com/bus/system/config/SecurityConfig.java

- Dong 3: Import CorrelationIdFilter tu package filter moi.
- Dong 34: Inject bean CorrelationIdFilter.
- Dong 127: Dat CorrelationIdFilter chay truoc AuthTokenFilter.
- Dong 128: Dat JWT AuthTokenFilter truoc UsernamePasswordAuthenticationFilter.

## Ghi chu
- Thu tu xu ly tong quat:
  1) CorrelationIdFilter tao requestId.
  2) JWT filter xac thuc nguoi dung.
  3) RequestLoggingInterceptor do va log request o tang MVC.
  4) ServiceExecutionAspect log hieu nang o tang service.
- Muc tieu: de truy vet loi nhanh, quan sat hieu nang ro rang, va giu hanh vi nghiep vu khong doi.
