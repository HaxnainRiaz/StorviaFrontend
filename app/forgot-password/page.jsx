import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-[#F8FBFF] px-4">
            <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-blue-100/50">
                <h1 className="text-2xl font-black text-[#0F172A]">Reset password</h1>
                <p className="mt-2 text-sm text-[#64748B]">Enter your email and contact Storvia support to reset your seller access.</p>
                <input className="mt-6 h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7]" placeholder="seller@example.com" />
                <button className="mt-4 h-12 w-full rounded-xl bg-[#1E8AF7] text-sm font-bold text-white">Request reset</button>
                <Link href="/login" className="mt-4 block text-center text-sm font-bold text-[#1E8AF7]">Back to login</Link>
            </div>
        </main>
    );
}
