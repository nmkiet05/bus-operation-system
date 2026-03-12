"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, User, Mail, Lock, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const { register, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        fullName: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu nhập lại không khớp!");
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword: _confirmPassword, ...dataToSend } = formData;
        await register(dataToSend);
    };

    return (
        <Card className="w-full shadow-xl border border-gray-100 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight text-gray-900">
                    Tạo tài khoản mới
                </CardTitle>
                <p className="text-sm text-gray-500">
                    Nhập thông tin cá nhân để đăng ký thành viên
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-gray-700">Họ và tên</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="fullName"
                                placeholder="Nguyễn Văn A"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-gray-700">Tên đăng nhập</Label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                id="username"
                                placeholder="user123 (tối thiểu 3 ký tự)"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                minLength={3}
                                disabled={isLoading}
                                className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700">Mật khẩu</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    minLength={6}
                                    disabled={isLoading}
                                    className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-gray-700">Nhập lại</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-11 pl-9 border-gray-200 focus:border-brand-blue focus:ring-brand-blue/20"
                                />
                            </div>
                        </div>
                    </div>
                    <Button
                        type="submit"
                        className="w-full h-11 bg-brand-blue hover:bg-sky-600 text-base font-semibold mt-2 transition-all shadow-md shadow-sky-200/50 hover:shadow-lg hover:shadow-sky-200/50"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Đăng ký thành viên"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center border-t border-gray-100 p-6 mt-2">
                <p className="text-sm text-gray-500">
                    Đã có tài khoản?{" "}
                    <Link href="/login" className="text-brand-blue hover:text-sky-600 font-semibold hover:underline">
                        Đăng nhập ngay
                    </Link>
                </p>
            </CardFooter>
        </Card>
    );
}
