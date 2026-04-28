# Frontend (Next.js)

This is the frontend application for the Bus Operation System (BOS), built with Next.js 15, Tailwind CSS, and shadcn/ui.

## 3-Portal Architecture
1. `/(admin)` - Management Portal for internal staff and administrators.
2. `/(driver)` - Mobile-first portal for drivers to view trips and submit vehicle handover reports.
3. `/(public)` - Responsive e-commerce portal for customers to book tickets and make payments.

## Getting Started

### Prerequisites
- Node.js 20+
- `NEXT_PUBLIC_API_URL` environment variable correctly pointing to the Backend API.

### Installation
```bash
npm install
```

### Running Locally
```bash
# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```
