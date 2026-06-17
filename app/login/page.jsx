"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Eye, EyeOff, Lock, Mail, Store } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);
        const result = await login(email, password);
        setIsLoading(false);
        if (!result.success) {
            setError(result.message);
            return;
        }
        router.replace("/app/dashboard");
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F8FBFF] px-4 py-10">
            <div className="w-full max-w-md">
                <Link href="/" className="mx-auto mb-8 flex w-max items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1E8AF7] text-white">
                        <Store size={24} />
                    </span>
                    <span className="text-2xl font-black text-[#0F172A]">Storvia</span>
                </Link>

                <form onSubmit={handleSubmit} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-blue-100/50">
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-[#0F172A]">Login to your store</h1>
                        <p className="mt-2 text-sm text-[#64748B]">Manage orders, products, delivery, Meta, SEO, and storefront publishing.</p>
                    </div>

                    <label className="mb-4 block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#64748B]">Email or phone</span>
                        <span className="relative block">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                            <input
                                className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] pl-10 pr-4 text-sm font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                required
                                placeholder="seller@example.com"
                            />
                        </span>
                    </label>

                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#64748B]">Password</span>
                        <span className="relative block">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                            <input
                                className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] pl-10 pr-12 text-sm font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                                placeholder="Enter password"
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B]">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </span>
                    </label>

                    {error && <div className="mt-4 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-sm font-bold text-[#DC2626]">{error}</div>}

                    <button disabled={isLoading} className="mt-6 h-12 w-full rounded-xl bg-[#1E8AF7] text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-[#0F74D8] disabled:opacity-60">
                        {isLoading ? "Logging in..." : "Login"}
                    </button>

                    <div className="mt-5 flex items-center justify-between text-sm font-semibold">
                        <Link href="/forgot-password" className="text-[#1E8AF7]">Forgot password?</Link>
                        <Link href="/signup" className="text-[#0F172A]">Create new account</Link>
                    </div>
                </form>
            </div>
        </main>
    );
}
