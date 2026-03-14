export interface LoginRequest {
    username: string;
    password?: string; // Optional because we might handle loading state before sending
}

export interface SignupRequest {
    username: string;
    email: string;
    password?: string;
    fullName: string;
    role?: string[];
}

export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    username: string;
    email: string;
    fullName?: string;
    phone?: string;
    roles: string[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    fullName?: string;
    roles: string[];
    avatar?: string;
}

export interface ApiResponse<T> {
    code: number;
    message: string;
    result: T;
    timestamp?: number;
}
