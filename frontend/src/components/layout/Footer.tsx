/**
 * Footer Component - Bus Operation System
 * Includes Bus Operators, Bus Stations sections with brand background
 * and main footer links with white background
 */

export function Footer() {
    return (
        <footer className="w-full">
            {/* Top Section - Bus Operators & Stations (Red Background) */}
            <div className="bg-gradient-to-r from-brand-blue to-sky-600 py-12 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Mobile: Horizontal Scroll, Desktop: Grid */}
                    <div className="overflow-x-auto md:overflow-x-visible scrollbar-hide">
                        <div className="flex gap-8 md:grid md:grid-cols-2 lg:grid-cols-4 min-w-max md:min-w-0">
                            {/* Bus Operators */}
                            <div className="min-w-[200px] md:min-w-0">
                                <h3 className="mb-4 text-lg font-bold">Các nhà xe phổ biến</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:underline">Xe Phương Trang</a></li>
                                    <li><a href="#" className="hover:underline">Xe Thành Bưởi</a></li>
                                    <li><a href="#" className="hover:underline">Xe Kim Mã</a></li>
                                    <li><a href="#" className="hover:underline">Xe Mai Linh</a></li>
                                    <li><a href="#" className="hover:underline">Xe Kumho Samco</a></li>
                                    <li><a href="#" className="hover:underline">Xe Hoàng Long</a></li>
                                </ul>
                            </div>

                            {/* More Operators */}
                            <div className="min-w-[200px] md:min-w-0">
                                <h3 className="mb-4 text-lg font-bold">Nhà xe uy tín</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:underline">Xe Hà Linh</a></li>
                                    <li><a href="#" className="hover:underline">Xe Thuận Tiện</a></li>
                                    <li><a href="#" className="hover:underline">Xe Tân Thanh</a></li>
                                    <li><a href="#" className="hover:underline">Xe Hưng Thành</a></li>
                                    <li><a href="#" className="hover:underline">Xe Minh Tâm</a></li>
                                    <li><a href="#" className="hover:underline">Xe Đức Phát</a></li>
                                </ul>
                            </div>

                            {/* Bus Stations */}
                            <div className="min-w-[200px] md:min-w-0">
                                <h3 className="mb-4 text-lg font-bold">Bến xe khách</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:underline">Bến xe Miền Tây</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Miền Đông</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Cần Thơ</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe An Sương</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Mỹ Đình</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Giáp Bát</a></li>
                                </ul>
                            </div>

                            {/* More Stations */}
                            <div className="min-w-[200px] md:min-w-0">
                                <h3 className="mb-4 text-lg font-bold">Bến xe nội thành</h3>
                                <ul className="space-y-2 text-sm">
                                    <li><a href="#" className="hover:underline">Bến xe Chợ Lớn</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Nước Ngầm</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Yên Nghĩa</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Gia Lâm</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Lương Yên</a></li>
                                    <li><a href="#" className="hover:underline">Bến xe Nước Mặn</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer - Links & Copyright (White Background) */}
            <div className="bg-white py-8 text-gray-700">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Footer Links */}
                    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div>
                            <h4 className="mb-3 font-semibold text-gray-900">Về chúng tôi</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-blue">Giới thiệu</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Tuyển dụng</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Tin tức</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-3 font-semibold text-gray-900">Hỗ trợ</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-blue">Liên hệ</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Hướng dẫn</a></li>
                                <li><a href="#" className="hover:text-brand-blue">FAQs</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-3 font-semibold text-gray-900">Điều khoản</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-blue">Điều khoản sử dụng</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Chính sách bảo mật</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Chính sách hoàn tiền</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-3 font-semibold text-gray-900">Kết nối</h4>
                            <ul className="space-y-2 text-sm">
                                <li><a href="#" className="hover:text-brand-blue">Facebook</a></li>
                                <li><a href="#" className="hover:text-brand-blue">Instagram</a></li>
                                <li><a href="#" className="hover:text-brand-blue">YouTube</a></li>
                            </ul>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-600">
                        <p>© 2026 Bus Operation System. All rights reserved.</p>
                        <p className="mt-1">Hệ thống Vận hành & Đặt vé xe khách số 1 tại Cần Thơ</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
