# Module Quản lý Đội xe (Fleet)

## Overview
Module Fleet quản lý danh sách các phương tiện (Xe buýt) và định nghĩa các loại xe (BusType) cùng sơ đồ ghế tương ứng.

## Architecture
- CRUD cơ bản thông qua `BusController` và `BusTypeController`.
- Không sử dụng bảng phụ cho sơ đồ ghế để giảm tải database.

## Key Entities / Components
- `@Entity Bus`: Quản lý xe vật lý (`licensePlate`, `status`).
- `@Entity BusType`: Quản lý loại xe (Limousine, Giường nằm) và `totalSeats`.

## Business Rules
- Sơ đồ ghế (`seat_map`) được lưu trực tiếp dưới dạng JSONB trong `bus_type`.
- Xe đang có chuyến chạy không được phép chuyển trạng thái sang ngưng hoạt động (`RETIRED`).
- Vị trí hiện tại của xe (`current_depot`) được nội suy từ chuyến cuối cùng chứ không lưu cứng trên Entity.

## Technical Notes
- Dùng truy vấn Batch (lấy danh sách `BusAssignment` cuối) thay vì N+1 query để lấy vị trí đỗ xe thực tế của toàn bộ danh sách xe.
