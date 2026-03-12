"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, User, Lock } from "lucide-react";

function LoginForm() {
    const { login, isLoading } = useAuth();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const returnUrl = searchParams.get("returnUrl") || undefined;
        await login(formData, returnUrl);
    };

    return (
        <Card className="w-full shadow-xl border border-gray-100 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                    Đăng nhập
                </CardTitle>
                <p className="text-sm text-gray-500">
                    Nhập thông tin tài khoản để tiếp tục
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700">Tên đăng nhập</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="Nhập tên đăng nhập"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="password" className="text-gray-700">Mật khẩu</Label>
                            <Link
                                href="#"
                                className="text-xs font-medium text-brand-blue hover:text-sky-600 hover:underline"
                            >
                                Quên mật khẩu?
                            </Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                            />
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-11 bg-brand-blue hover:bg-sky-600 text-base font-semibold transition-all shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-200/50"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng nhập"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-gray-100 p-6 mt-2">
                <p className="text-sm text-gray-500">
                    Chưa có tài khoản?{" "}
                    <Link href="/register" className="text-brand-blue hover:text-sky-600 font-semibold hover:underline">
                        Đăng ký ngay
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="w-full h-64 animate-pulse bg-gray-100 rounded-lg" />}>
            <LoginForm />
        </Suspense>
    );
}
