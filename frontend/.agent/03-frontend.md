# Rule 06: Frontend Architecture (Next.js Hardcore Enterprise)

> **Mô hình**: Feature-Sliced Design (Lite) + Domain-Driven Design.
> **Quy tắc Vàng**: Chia code theo **Features** (Tính năng), không chia theo File Type.

## 1. Cấu trúc thư mục chuẩn
```text
src/
├── app/                    # Routing Layer (Mỏng & Sạch)
│   ├── (auth)/             # Route group: Login, Register
│   ├── (dashboard)/        # Route group: Admin
│   ├── (public)/           # Route group: Home, Search
│   ├── api/                # Route Handlers (Webhook/Proxy)
│   ├── error.tsx           # Global Error Boundary
│   ├── layout.tsx          # Root Layout (bọc Providers)
│   └── globals.css
│
├── features/               # 🔥 TRÁI TIM CỦA DỰ ÁN (Domain Logic)
│   ├── home/
│   │   ├── components/     # UI Component riêng
│   │   └── index.ts        # Barrel Export
│   ├── booking/
│   │   ├── components/
│   │   ├── hooks/          # Logic state riêng
│   │   ├── server/         # Server Actions (Mutations)
│   │   ├── types.ts        # DTO
│   │   └── index.ts
│   └── auth/
│
├── components/             # Shared UI Base (Dumb Components)
│   ├── ui/                 # Atomic/Shadcn (Button, Input) - KHÔNG chứa business logic
│   ├── form/               # Reusable Form Controls
│   └── layout/             # Header, Footer
│
├── providers/              # Global State & Wrappers
│   ├── theme-provider.tsx
│   ├── query-provider.tsx  # React Query
│   └── auth-provider.tsx
│
├── services/               # HTTP Core Client
│   ├── http/
│   │   ├── axios.ts        # Instance + Interceptors
│   │   └── error.ts
│
└── lib/                    # Utils & Configs
    ├── utils.ts
    ├── env.ts              # Env Validation
    └── constants.ts
```

## 2. Quy tắc Enterprise+ (Mở rộng)

| Thành phần | Khi nào dùng? | Tác dụng |
| :--- | :--- | :--- |
| `features/*/contracts.ts` | Khi có nhiều Consumer | Định nghĩa Schema (Interface) chặt chẽ giữa các module. |
| `services/*/mappers.ts` | Khi Backend DTO phức tạp | Chuyển đổi dữ liệu từ Backend -> Frontend Model (View Model). |
| `lib/logger.ts` | Production | Ghi log tập trung (Sentry/Datadog) thay vì `console.log`. |
| `features/*/tests/` | Team > 5 người | Unit Test riêng cho từng feature để tránh conflict. |

## 3. Best Practices
1.  **Server Actions**: Ưu tiên dùng cho Mutations (POST, PUT, DELETE) thay vì gọi API từ Client.
2.  **Barrel Exports**: Luôn có `index.ts` trong mỗi feature để export gọn gàng (`import { X } from '@/features/booking'`).
3.  **App Router**: File `page.tsx` chỉ làm nhiệm vụ ghép nối (Composition), không viết logic nghiệp vụ dài dòng.
4.  **DRY (Don't Repeat Yourself)**: Bất kỳ đoạn code nào có tính chất "repeat me" (lặp lại) đều phải được tách ra thành component hoặc helper riêng.
## 4. UI/UX Standards & Design Principles (Strict)

### Core Principles
1.  **Mobile First Design**: 
    -   Thiết kế và code ưu tiên màn hình mobile trước (vertical layout).
    -   Responsive mở rộng dần: `sm` (Tablet vertical) → `md` (Tablet horizontal) → `lg` (Desktop) → `xl` (Large Screen).
    -   Tránh code desktop-first rồi dùng `max-width` để sửa cho mobile.

2.  **Modern Aesthetics**:
    -   Phong cách: **RedBus / Omio** (Search-centric, card-based).
    -   Giao diện sạch, hiện đại, thân thiện.
    -   Tránh over-engineering. Code rõ ràng, dễ bảo trì.

### Technical UI Rules
1.  **Styling**: 
    -   Bắt buộc dùng **Tailwind CSS**.
    -   Tuyệt đối **KHÔNG** dùng CSS Framework đóng gói sẵn (Bootstrap, AntD, MUI) gây khó custom.
    -   Không hard-code styles (màu sắc, spacing) rời rạc → Dùng Design System (CSS Variables).

2.  **Component Library**:
    -   Base: **Shadcn/ui** (copy-paste architecture).
    -   Interaction & A11y: **Radix UI** primitives.
    -   Icons: **Lucide React** (thống nhất toàn hệ thống).

3.  **Mobile UX (Touch-friendly)**:
    -   Tap target size ≥ **44px** cho mọi nút bấm/liên kết.
    -   Font size ≥ **16px** cho body text để dễ đọc, tránh zoom in input.
    -   Input type chuẩn (`tel`, `email`, `date`) để kích hoạt bàn phím phù hợp.

4.  **Design System Consistency**:
    -   Spacing: Dùng chuẩn Tailwind (`p-4`, `m-2`, `gap-4`).
    -   Radius: `rounded-lg` hoặc `rounded-xl` cho cards.
    -   Typography: Hệ thống font size rõ ràng (Heading vs Body).
    -   Colors: Sử dụng bảng màu semantic (`text-primary`, `bg-brand-red`).

