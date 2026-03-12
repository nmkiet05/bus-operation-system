# 📚 Tài Liệu Tham Khảo - Frontend Development

> **Mục đích:** Tập hợp tất cả các tài liệu tham khảo được sử dụng trong quá trình phát triển Frontend Bus Operation System (BOS).
> 
> **Cập nhật:** Luôn cập nhật file này khi có thêm tài liệu tham khảo mới.

---

## 🎨 1. UX/UI Design References

### 1.1. [RedBus.vn](https://www.redbus.vn)
**Tham khảo:**
- 🏠 **Trang chủ:** Hero Banner với Search Widget nổi
- 💺 **Chọn ghế:** Sơ đồ ghế 2 tầng trực quan
- 🎨 **Màu sắc:** Màu đỏ chủ đạo `#D84E55`

**Đã áp dụng:**
- ✅ Hero Banner design với floating search widget
- ✅ Seat selection UI với 2-deck layout
- 🔄 Đang điều chỉnh màu về xanh `#0EA5E9` (brand-blue)

---

### 1.2. [Omio.vn](https://www.omio.vn)
**Tham khảo:**
- 🔍 **Trang kết quả:** Filter ngang + Ticket Card nổi
- 💳 **Thanh toán:** Form trái + Summary sticky phải
- 🎨 **Style:** Minimalist, khoa học

**Đã áp dụng:**
- ✅ Trip Card design trên trang search results
- 🔄 Đang plan: Payment page layout (Phase 3)

---

### 1.3. [FUTA Bus](https://futabus.vn)
**Tham khảo:**
- 📍 **Điểm đón/trả:** Dropdown chọn điểm với giờ đón dự kiến
- 🚌 **Quy trình chọn ghế:** UX 2 tầng rõ ràng
- 🎨 **Style:** Truyền thống, dễ hiểu

**Đã áp dụng:**
- ✅ `PickupPointSelector` component (clone FUTA style)
- ✅ `DropoffPointSelector` component
- ✅ Hiển thị giờ đón dự kiến (`calculatePickupTime` utility)

**Code tham khảo:**
```tsx
// src/features/booking/components/PickupPointSelector.tsx
// Logic: Dropdown + Icon + Address + Estimated Time
```

---

### 1.4. [FlixBus](https://www.flixbus.com)
**Tham khảo:**
- 📋 **Timeline lộ trình:** Hiển thị dọc, tối giản
- 🎨 **Font:** To, dễ đọc

**Kế hoạch áp dụng:**
- 🔄 Optional: Timeline component cho route visualization (Phase 4+)

---

### 1.5. [VeXeRe](https://vexere.com)
**Tham khảo:**
- 🔎 **Bộ lọc:** Chi tiết, nhiều tùy chọn
- ⭐ **Đánh giá:** User reviews & ratings

**Kế hoạch áp dụng:**
- 🔄 Phase 4+: Advanced filters
- 🔄 Future: Review system

---

### 1.6. [Busbud](https://www.busbud.com)
**Tham khảo:**
- 💰 **So sánh giá:** Clean UI
- 📸 **Hình ảnh:** Ảnh xe đẹp

**Kế hoạch áp dụng:**
- 🔄 Future: Price comparison features
- 🔄 Future: Bus photo gallery

---

## 📡 2. Backend API Documentation

### 2.1. Pickup/Dropoff Points API
**File:** [`frontend_handoff_pickup_points.md.resolved`](file:///C:/Users/ADMIN/.gemini/antigravity/brain/c9e5a31d-4140-40a8-bfed-89c4b867a1dd/frontend_handoff_pickup_points.md.resolved)

**Nội dung:**
- 📋 API Endpoints mới (CRUD cho pickup points)
- 🎯 Frontend integration tasks
- 📊 Business rules
- 📦 Sample data (26 records)

**Đã áp dụng:**
- ✅ API Service: [`pickupPoint.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/pickupPoint.ts)
- ✅ TanStack Query Hook: [`usePickupPoints.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/hooks/usePickupPoints.ts)
- ✅ Time Utilities: [`pickupTimeUtils.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/lib/pickupTimeUtils.ts)

---

### 2.2. Trip Search API
**Endpoint:** `GET /api/operation/trips/search`

**Tham số:**
```typescript
{
  fromProvinceId: number;
  toProvinceId: number;
  departureDate: string; // YYYY-MM-DD
  busTypeId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
}
```

**Đã áp dụng:**
- ✅ Service: [`trips.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/trips.ts)
- ✅ Page: [`trips/page.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/app/(public)/trips/page.tsx)

---

### 2.3. Master Data APIs
**Endpoints:**
- `GET /api/catalog/provinces` - Danh sách tỉnh/thành
- `GET /api/catalog/bus-types` - Loại xe
- `GET /api/catalog/bus-stations` - Bến xe

**Đã áp dụng:**
- ✅ Service: [`catalog.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/catalog.ts)
- ✅ Caching: TanStack Query với `staleTime: Infinity`

---

## 🔧 3. Technical Stack References

### 3.1. Next.js 15
**Docs:** [nextjs.org/docs](https://nextjs.org/docs)

**Tính năng đang dùng:**
- App Router
- Server Components (minimal)
- Client Components (majority)
- Dynamic routes: `[tripId]`

---

### 3.2. TanStack Query v5
**Docs:** [tanstack.com/query](https://tanstack.com/query/latest)

**Đã áp dụng:**
- ✅ Master data caching (`useProvinces`)
- ✅ Pickup points caching (`usePickupPoints`)

**Config:** [`query.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/config/query.ts)

---

### 3.3. Framer Motion
**Docs:** [framer.com/motion](https://www.framer.com/motion/)

**Đã áp dụng:**
- ✅ Scroll animations: [`ScrollAnimation.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/components/animations/ScrollAnimation.tsx)

---

### 3.4. Tailwind CSS
**Docs:** [tailwindcss.com](https://tailwindcss.com)

**Custom Config:**
- ✅ Brand colors: `brand-blue`, `main`
- ✅ CSS variables: `--main-color`

**File:** [`tailwind.config.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/tailwind.config.ts)

---

## 📖 4. Design Patterns & Architecture

### 4.1. Frankenstein Strategy
**Concept:** Kết hợp các phần tốt nhất từ nhiều website

```
Trang chủ      = RedBus  (Hero + Search)
Kết quả        = Omio    (Filter + Cards)
Chọn ghế       = RedBus  (2-deck layout)
Điểm đón/trả   = FUTA    (Dropdown + Time)
Thanh toán     = Omio    (Form + Summary)
```

---

### 4.2. Component Structure Pattern
```
features/
  [feature-name]/
    components/
      ComponentName.tsx
    hooks/
      useFeatureName.ts
    server/
      actions.ts (server actions - if needed)
```

**Example:**
```
features/booking/
  components/
    SeatMap.tsx
    PickupPointSelector.tsx
    BookingForm.tsx
```

---

### 4.3. API Service Pattern
```typescript
// services/api/[entity].ts
export interface Entity { ... }
export async function getEntity(): Promise<Entity> { ... }
```

**Files:**
- [`catalog.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/catalog.ts)
- [`trips.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/trips.ts)
- [`pickupPoint.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/services/api/pickupPoint.ts)

---

## 🎯 5. Business Rules Reference

### 5.1. Pickup/Dropoff Points
**Source:** Backend handoff document

| Rule | Detail |
|:-----|:-------|
| **Giá vé** | CỐ ĐỊNH, không thay đổi khi chọn điểm đón/trả |
| **Mặc định** | `null` = Đón/trả tại bến xe |
| **Sorting** | Theo `sequenceOrder` ASC (backend xử lý) |
| **Time calc** | `departureTime + estimatedMinutes` |

**Implementation:**
- ✅ Component: [`PickupPointSelector.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/features/booking/components/PickupPointSelector.tsx#L31-L39)
- ✅ Utility: [`pickupTimeUtils.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/lib/pickupTimeUtils.ts#L10-L23)

---

### 5.2. Seat Selection Rules
| Rule | Detail |
|:-----|:-------|
| **Max seats** | 5 ghế/booking |
| **Status** | AVAILABLE, BOOKED, LOCKED, SELECTED |
| **Deck** | Hỗ trợ 2 tầng (deck 1, deck 2) |

**Implementation:**
- ✅ Component: [`SeatMap.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/features/booking/components/SeatMap.tsx)
- ✅ Logic: [`booking/[tripId]/page.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/app/(public)/booking/[tripId]/page.tsx#L90-L100)

---

## 📁 6. Project Files Reference

### 6.1. Key Implementation Files
| File | Purpose |
|:-----|:--------|
| [`SearchWidget/index.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/features/home/components/search-widget/index.tsx) | Tìm kiếm chuyến xe |
| [`trips/page.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/app/(public)/trips/page.tsx) | Kết quả tìm kiếm |
| [`booking/[tripId]/page.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/app/(public)/booking/[tripId]/page.tsx) | Booking flow |
| [`SeatMap.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/features/booking/components/SeatMap.tsx) | Sơ đồ ghế |
| [`PickupPointSelector.tsx`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/features/booking/components/PickupPointSelector.tsx) | Chọn điểm đón |

---

### 6.2. Configuration Files
| File | Purpose |
|:-----|:--------|
| [`tailwind.config.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/tailwind.config.ts) | Theme, colors |
| [`globals.css`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/app/globals.css) | CSS variables |
| [`query.ts`](file:///d:/CTU/CT201E/bus-operation-system/frontend/src/config/query.ts) | TanStack Query config |

---

## 🔄 7. Changelog & Updates

### 2026-02-13
- ✅ Thêm Pickup/Dropoff Points API integration
- ✅ Tạo `PickupPointSelector` component
- ✅ Tạo `DropoffPointSelector` component
- ✅ Tạo time calculation utilities
- ✅ Cập nhật `sample_data.sql` (APPROVED trips)

### 2026-02-07
- ✅ Tối ưu API calls với TanStack Query
- ✅ Scroll animations cho homepage
- ✅ Standardize UI (hover effects, dropdowns)
- ✅ Global main color variable

---

## 📝 Notes & Best Practices

### Khi thêm tài liệu mới:
1. ✅ Update section tương ứng (UX, API, Tech Stack)
2. ✅ Ghi rõ **tham khảo cái gì**
3. ✅ Link đến code đã implement (nếu có)
4. ✅ Update Changelog

### Testing References:
- Mỗi feature mới cần test với sample data (26 pickup points, trips 13/02-23/02)
- Cross-browser: Chrome, Firefox, Safari
- Mobile: iOS Safari, Android Chrome

---

**Last Updated:** 2026-02-13 15:54  
**Maintained By:** Development Team
