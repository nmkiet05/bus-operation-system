"use client";

import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { User, LoginRequest, SignupRequest } from "@/features/auth/types";
import { authService } from "@/features/auth/services/auth-service";
import { toast } from "sonner";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginRequest, returnUrl?: string) => Promise<void>;
    register: (data: SignupRequest) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load user from storage on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                const storedUserStr = localStorage.getItem("user");
                const token = Cookies.get("token");

                if (token && storedUserStr) {
                    const storedUser = JSON.parse(storedUserStr);

                    // Legacy migration: Nếu có role (string) mà chưa có roles (array)
                    if (storedUser.role && !storedUser.roles) {
                        console.log("[AuthProvider] Migrating legacy user data...");
                        storedUser.roles = [storedUser.role];
                        delete storedUser.role;
                    }

                    // Enforce ROLE_ prefix (Fix cho trường hợp data cũ là "ADMIN" thay vì "ROLE_ADMIN")
                    if (storedUser.roles && Array.isArray(storedUser.roles)) {
                        storedUser.roles = storedUser.roles.map((r: string) =>
                            r.startsWith("ROLE_") ? r : `ROLE_${r}`
                        );
                        // Save normalized data back to storage
                        localStorage.setItem("user", JSON.stringify(storedUser));
                    }

                    setUser(storedUser);
                }
            } catch (error) {
                console.error("[AuthProvider] Error parsing user data:", error);
                // Nếu lỗi data, force logout để an toàn
                Cookies.remove("token");
                localStorage.removeItem("user");
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = async (data: LoginRequest, returnUrl?: string) => {
        try {
            setIsLoading(true);
            const res = await authService.login(data);
            console.log("[Auth] Login response:", res);

            // Save token to Cookie (for Middleware) and User to LocalStorage (for UI)
            Cookies.set("token", res.token, { expires: 7, sameSite: 'Strict' });
            localStorage.setItem("user", JSON.stringify(res));

            setUser(res);
            toast.success("Đăng nhập thành công!");

            // Redirect logic - use replace to prevent going back to login page
            const destination = returnUrl || "/";
            console.log("[Auth] Redirecting to:", destination);
            router.replace(destination);
        } catch (error: unknown) {
            console.error("[Auth] Login error:", error);
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Đăng nhập thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: SignupRequest) => {
        try {
            setIsLoading(true);
            await authService.register(data);
            toast.success("Đăng ký thành công! Vui lòng đăng nhập.");
            router.push("/login");
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || "Đăng ký thất bại");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        Cookies.remove("token");
        localStorage.removeItem("user");
        setUser(null);
        router.push("/login");
        toast.info("Đã đăng xuất");
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
