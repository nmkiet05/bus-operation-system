import { Star, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function DownloadApp() {
    return (
        <section className="py-16 bg-gray-900 text-white overflow-hidden relative">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 opacity-30 bg-[url('/images/bus-bg.jpg')] bg-cover bg-center"></div>

            <div className="mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] lg:w-[calc(100%-4rem)] max-w-7xl relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">

                    {/* Left Content */}
                    <div className="max-w-xl space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm font-medium backdrop-blur-sm border border-white/10">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span>Được tin dùng bởi 36 triệu khách hàng</span>
                        </div>

                        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
                            Tải ứng dụng BOS
                        </h2>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-lg font-medium text-gray-200">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span>Giảm giá tới 30% + hoàn tiền 10%</span>
                            </div>
                            <div className="flex items-center gap-3 text-lg font-medium text-gray-200">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span>Theo dõi vị trí xe thời gian thực</span>
                            </div>
                            <div className="flex items-center gap-3 text-lg font-medium text-gray-200">
                                <CheckCircle2 className="w-6 h-6 text-green-400" />
                                <span>Thanh toán bảo mật & an toàn</span>
                            </div>
                        </div>

                        <div className="pt-6 flex flex-col sm:flex-row gap-4">
                            <div className="flex gap-4">
                                <Link href="#" className="transition-opacity hover:opacity-80">
                                    <Image
                                        src="/images/app-store.png"
                                        alt="Download on the App Store"
                                        width={140}
                                        height={42}
                                        className="h-[42px] w-auto object-contain"
                                    />
                                </Link>
                                <Link href="#" className="transition-opacity hover:opacity-80">
                                    <Image
                                        src="/images/google-play.png"
                                        alt="Get it on Google Play"
                                        width={140}
                                        height={42}
                                        className="h-[42px] w-auto object-contain"
                                    />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Right Image (Phone Mockup) - Placeholder */}
                    <div className="hidden md:block relative">
                        <div className="relative w-[300px] h-[600px] bg-black rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden">
                            <div className="absolute top-0 w-full h-[100px] bg-gradient-to-b from-brand-blue to-sky-600 flex items-center justify-center text-white font-bold">
                                BOS App
                            </div>
                            <div className="absolute inset-0 top-[100px] bg-gray-100 flex items-center justify-center text-gray-400">
                                [App Screen UI]
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
