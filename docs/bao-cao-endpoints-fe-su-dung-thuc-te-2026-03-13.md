# Bao cao endpoint FE su dung thuc te (2026-03-13)

## 1) Pham vi va cach xac dinh
- Pham vi quet: `frontend/src/**/*.{ts,tsx}`.
- Tieu chi "dang su dung thuc te tai FE": endpoint co ham goi API va co call-site tu page/component/hook/provider.
- Tieu chi "nghi ngo mock API": ten endpoint/co de y trong code cho thay tinh chat mo phong, hoac UI dang dung mock data thay vi call API.
- Luu y: day la ket qua static scan (khong bao gom runtime telemetry).

## 2) Danh sach endpoint dang duoc FE goi thuc te

### 2.1 Auth
- `POST /auth/login`
  - Dung tai: `frontend/src/providers/auth-provider.tsx`.
- `POST /auth/register`
  - Dung tai: `frontend/src/providers/auth-provider.tsx`.

### 2.2 Public booking va tim chuyen
- `GET /operation/trips/search`
  - Dung tai: `frontend/src/app/(public)/trips/page.tsx` (search chuyen di/chuyen ve).
  - Dung tai: `frontend/src/app/(public)/booking/[tripId]/page.tsx` (lay chi tiet theo tripId thong qua search + filter tren FE).
- `GET /operation/trips/{tripId}/seat-map`
  - Dung tai: `frontend/src/features/booking/services/booking-service.ts` -> goi tu `frontend/src/app/(public)/booking/[tripId]/page.tsx`.
- `POST /bookings`
  - Dung tai: `frontend/src/app/(public)/booking/[tripId]/page.tsx`.
- `GET /bookings/{code}`
  - Dung tai: `frontend/src/app/(public)/booking/success/page.tsx`.
- `GET /bookings/search?code&phone`
  - Dung tai: `frontend/src/app/(public)/booking/lookup/page.tsx`.
- `POST /bookings/public/{code}/cancel?phone=...`
  - Dung tai: `frontend/src/app/(public)/booking/lookup/page.tsx`.
- `POST /bookings/public/{code}/tickets/{ticketId}/cancel?phone=...`
  - Dung tai: `frontend/src/app/(public)/booking/lookup/page.tsx`.
- `POST /payments/simulate`
  - Dung tai: `frontend/src/app/(public)/booking/[tripId]/page.tsx`.

### 2.3 User dashboard
- `GET /me/bookings`
  - Dung tai: `frontend/src/features/booking/services/booking-service.ts` -> goi tu `frontend/src/app/(dashboard)/bookings/page.tsx`.

### 2.4 Admin - dashboard/check session
- `GET /operation/trips?page=0&size=1`
  - Dung tai truc tiep: `frontend/src/app/(admin)/admin/page.tsx` (check token/session nhe).

### 2.5 Admin - Catalog/Planning/Fleet/Pricing
- `GET /catalog/provinces`
  - Dung tai: `frontend/src/hooks/useMasterData.ts`, `frontend/src/app/(admin)/admin/catalog/stations/page.tsx`.
- `GET /catalog/stations`
  - Dung tai: `frontend/src/features/admin/services/station-service.ts`, `frontend/src/services/api/catalog.ts`.
- `POST /catalog/stations`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/stations/page.tsx`.
- `DELETE /catalog/stations/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/stations/page.tsx`.

- `GET /planning/routes`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/routes/page.tsx`, `frontend/src/app/(admin)/admin/planning/schedules/page.tsx`, `frontend/src/app/(admin)/admin/operation/trips/page.tsx`, `frontend/src/app/(admin)/admin/sales/fare-config/page.tsx`.
- `POST /planning/routes`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/routes/page.tsx`.
- `PUT /planning/routes/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/routes/page.tsx`.
- `DELETE /planning/routes/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/routes/page.tsx`.

- `GET /planning/routes/{routeId}/pickup-points`
  - Dung tai: `frontend/src/hooks/usePickupPoints.ts`, `frontend/src/features/admin/components/PickupPointsDialog.tsx`.
- `POST /planning/routes/{routeId}/pickup-points`
  - Dung tai: `frontend/src/features/admin/components/PickupPointsDialog.tsx`.
- `PUT /planning/routes/{routeId}/pickup-points/{id}`
  - Dung tai: `frontend/src/features/admin/components/PickupPointsDialog.tsx`.
- `DELETE /planning/routes/{routeId}/pickup-points/{id}`
  - Dung tai: `frontend/src/features/admin/components/PickupPointsDialog.tsx`.

- `GET /planning/schedules?routeId=...`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/schedules/page.tsx`, `frontend/src/app/(admin)/admin/operation/trips/page.tsx`.
- `POST /planning/schedules`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/schedules/page.tsx`.
- `PUT /planning/schedules/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/schedules/page.tsx`.
- `DELETE /planning/schedules/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/planning/schedules/page.tsx`.

- `GET /fleet/buses`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/buses/page.tsx`.
- `POST /fleet/buses`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/buses/page.tsx`.
- `PUT /fleet/buses/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/buses/page.tsx`.
- `DELETE /fleet/buses/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/buses/page.tsx`.

- `GET /fleet/bus-types`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/bus-types/page.tsx`, `frontend/src/app/(admin)/admin/fleet/buses/page.tsx`.
- `POST /fleet/bus-types`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/bus-types/page.tsx`.
- `PUT /fleet/bus-types/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/bus-types/page.tsx`.
- `DELETE /fleet/bus-types/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/fleet/bus-types/page.tsx`.

- `GET /depots`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/depots/page.tsx`.
- `POST /depots`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/depots/page.tsx`.
- `PUT /depots/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/depots/page.tsx`.
- `DELETE /depots/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/catalog/depots/page.tsx`.

- `GET /pricing/fares`
  - Dung tai: `frontend/src/app/(admin)/admin/sales/fare-config/page.tsx`.
- `POST /pricing/fares/upsert`
  - Dung tai: `frontend/src/app/(admin)/admin/sales/fare-config/page.tsx`.

### 2.6 Admin - Operation/Sales
- `GET /bookings`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bookings/page.tsx`, `frontend/src/app/(admin)/admin/sales/bookings/page.tsx`.
- `POST /bookings/{bookingId}/cancel`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bookings/page.tsx`, `frontend/src/app/(admin)/admin/sales/bookings/page.tsx`.

- `GET /operation/trips`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx`, `frontend/src/app/(admin)/admin/operation/crew/page.tsx`, `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`, `frontend/src/app/(admin)/admin/operation/assignments/page.tsx`.
- `POST /operation/trips`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx` (create manual trip).
- `POST /operation/trips/generate`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx` (payload object).
  - Dung tai: `frontend/src/app/(admin)/admin/planning/schedules/page.tsx` (params `fromDate`, `toDate`).
- `POST /operation/trips/{id}/approve`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx`.
- `POST /operation/trips/{id}/start`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx`.
- `POST /operation/trips/{id}/complete`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx`.
- `POST /operation/trips/{id}/cancel`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trips/page.tsx`.
- `PATCH /operation/trips/{id}/assignment`
  - Dung tai: `frontend/src/features/admin/components/AssignmentForm.tsx`.
- `GET /operation/trips/{id}/resources/drivers/available`
  - Dung tai: `frontend/src/features/admin/components/AssignmentForm.tsx`, `frontend/src/app/(admin)/admin/operation/crew/page.tsx`.
- `GET /operation/trips/{id}/resources/buses/available`
  - Dung tai: `frontend/src/features/admin/components/AssignmentForm.tsx`.

- `GET /operation/trip-changes`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`.
- `POST /operation/trip-changes/{id}/approve`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`.
- `POST /operation/trip-changes/{id}/reject?reason=...`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/trip-changes/page.tsx`.

- `GET /driver-assignments/trip/{tripId}/crew`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/crew/page.tsx`.
- `POST /driver-assignments/trip/{tripId}/crew`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/crew/page.tsx`.
- `POST /driver-assignments/trip/{tripId}/crew/batch`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/crew/page.tsx`.
- `PATCH /driver-assignments/{assignmentId}/cancel`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/crew/page.tsx`.

- `GET /bus-assignments?date=...&busId=...`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `POST /bus-assignments`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `PUT /bus-assignments/{id}`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `POST /bus-assignments/{assignmentId}/trips/{tripId}`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `DELETE /bus-assignments/{assignmentId}/trips/{tripId}`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `PATCH /bus-assignments/{id}/check-in`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `PATCH /bus-assignments/{id}/check-out`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.
- `PATCH /bus-assignments/{id}/end-early`
  - Dung tai: `frontend/src/app/(admin)/admin/operation/bus-schedule/page.tsx`.

## 3) Endpoint co trong code nhung chua thay duoc goi thuc te
- `POST /bookings/{code}/confirm` (`bookingService.confirmBooking`).
- `POST /bookings/tickets/{ticketId}/cancel` (`bookingService.cancelTicket`).
- `POST /bookings/{bookingId}/cancel-tickets` (`bookingService.cancelTickets`).
- `GET /operation/trips/{id}` qua `tripService.getTripById` (ham co dinh nghia, chua thay call-site).
- `GET /operation/trips/resources/drivers/available` (legacy fallback theo time range).
- `GET /operation/trips/resources/buses/available` (legacy fallback theo time range).
- `POST /operation/trip-changes` (`tripChangeService.create`).
- `POST /operation/trip-changes/{id}/rollback` (`tripChangeService.rollback`).
- `PATCH /driver-assignments/{assignmentId}/replace` (`crewService.replaceDriver`).
- `GET /fleet/bus-types/{id}` (`busTypeService.getById`).
- `GET /planning/routes/{id}` (`routeService.getById`).
- `GET /planning/pickup-points/{id}` (`getPickupPointById` trong `services/api/pickupPoint.ts`).
- `POST /planning/routes/{routeId}/pickup-points` (`createPickupPoint` trong `services/api/pickupPoint.ts`, ban API nay khong thay goi truc tiep; FE admin dang goi version service khac).
- `PUT /planning/pickup-points/{id}` (`updatePickupPoint` trong `services/api/pickupPoint.ts`).
- `DELETE /planning/pickup-points/{id}` (`deletePickupPoint` trong `services/api/pickupPoint.ts`).
- `GET /catalog/stations?provinceId=...` (`getStationsByProvince`).
- `GET /catalog/bus-types` qua `services/api/catalog.getBusTypes` (khac voi luong admin dang dung `/fleet/bus-types`).
- `GET /me/bookings` qua `meService.getMyBookings` (hien FE dang dung bookingService cho cung endpoint).
- `GET /operation/trips/{tripId}/seat-map` qua ham deprecated `services/api/trips.getSeatMap`.

## 4) Nghi ngo mock API / mock data

### 4.1 Endpoint nghi ngo mock
- `POST /payments/simulate`
  - Ly do: ten endpoint chua "simulate" va code co comment "Process Payment (Simulated)".
  - Vi tri: `frontend/src/services/api/payment.ts`, `frontend/src/app/(public)/booking/[tripId]/page.tsx`.

### 4.2 UI dung mock data (khong goi API that)
- `frontend/src/features/home/components/TrendingRoutes.tsx`
  - Dang dung `TRENDING_ROUTES` hardcoded, co comment "Mock data - se thay bang API sau".
- `frontend/src/app/(admin)/admin/page.tsx`
  - So lieu dashboard (`stats`) dang hardcoded, co TODO "Ket noi API thong ke".
- `frontend/src/hooks/useMasterData.ts`
  - `useBusTypes` dang tra `[]` va TODO implement API call.
- `frontend/src/app/(dashboard)/bookings/page.tsx`
  - Co comment cho thay 1 phan hien thi duoc "mocked mostly" theo du lieu co san.

## 5) Ghi chu nhanh de doi chieu BE
- Co 2 nhom endpoint pickup-point trong FE:
  - Nhom A: `/planning/routes/{routeId}/pickup-points/{id}` (dang duoc admin su dung).
  - Nhom B: `/planning/pickup-points/{id}` (co dinh nghia trong service khac, chua thay goi).
- Co 2 nhom endpoint bus type:
  - Nhom A: `/fleet/bus-types` (dang su dung thuc te admin).
  - Nhom B: `/catalog/bus-types` (co dinh nghia trong catalog service, chua thay goi).
