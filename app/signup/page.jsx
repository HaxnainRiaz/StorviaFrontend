"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Store } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
        business_type: "",
        store_category: ""
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        if (form.password !== form.confirm_password) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        try {
            const res = await apiRequest("/auth/register-seller", {
                method: "POST",
                token: null,
                redirectOnUnauthorized: false,
                body: {
                    name: form.full_name,
                    email: form.email,
                    phone: form.phone,
                    password: form.password,
                    businessType: form.business_type,
                    storeCategory: form.store_category,
                    storeName: `${form.full_name.split(" ")[0] || "My"} Store`
                }
            });
            if (!res.success) throw new Error(res.message || "Signup failed");
            const token = res.data?.token || res.token;
            if (token) localStorage.setItem("token", token);
            router.replace("/app/onboarding");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#F8FBFF] px-4 py-10">
            <form onSubmit={handleSubmit} className="mx-auto max-w-2xl rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-blue-100/50">
                <Link href="/" className="mb-7 flex w-max items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E8AF7] text-white"><Store size={22} /></span>
                    <span className="text-2xl font-black text-[#0F172A]">Storvia</span>
                </Link>
                <h1 className="text-3xl font-black text-[#0F172A]">Create your seller account</h1>
                <p className="mt-2 text-sm text-[#64748B]">Your independent store starts with setup, products, delivery, payments, and publishing.</p>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {[
                        ["full_name", "Full name"],
                        ["email", "Email"],
                        ["phone", "Phone"],
                        ["business_type", "Business type"],
                        ["store_category", "Store category"]
                    ].map(([key, label]) => (
                        <label key={key} className="block">
                            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#64748B]">{label}</span>
                            <input className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white" value={form[key]} onChange={event => update(key, event.target.value)} required={key !== "phone"} />
                        </label>
                    ))}
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#64748B]">Password</span>
                        <input type="password" className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white" value={form.password} onChange={event => update("password", event.target.value)} required />
                    </label>
                    <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#64748B]">Confirm password</span>
                        <input type="password" className="h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white" value={form.confirm_password} onChange={event => update("confirm_password", event.target.value)} required />
                    </label>
                </div>
                {error && <div className="mt-4 rounded-xl border border-[#FEE2E2] bg-[#FEF2F2] p-3 text-sm font-bold text-[#DC2626]">{error}</div>}
                <button disabled={loading} className="mt-6 h-12 w-full rounded-xl bg-[#1E8AF7] text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    {loading ? "Creating account..." : "Create account"}
                </button>
                <p className="mt-4 text-center text-sm font-semibold text-[#64748B]">Already have an account? <Link href="/login" className="text-[#1E8AF7]">Login</Link></p>
            </form>
        </main>
    );
}
