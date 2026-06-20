"use client";

import Sidebar from "./Sidebar";
import { Bell, CircleHelp, Eye, Search } from "lucide-react";
import Link from "next/link";
import { useAdmin } from "@/context/AdminContext";
import { buildStoreUrl } from "@/lib/storeUrl";

export default function SidebarWrapper({ children, isLoginPage }) {
    const { activeStore } = useAdmin();

    return (
        <div className="min-h-screen bg-[#F8FBFF] text-[#475569] font-body font-sans">
            {!isLoginPage && <Sidebar />}
            <main className={!isLoginPage ? "transition-all duration-300 lg:ml-72 min-h-screen p-4 sm:p-6 lg:p-8" : ""}>
                <div className={!isLoginPage ? "seller-app max-w-7xl mx-auto animate-fadeIn" : ""}>
                    {!isLoginPage && (
                        <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" size={18} />
                                <input
                                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] pl-10 pr-4 text-sm font-medium text-[#0F172A] outline-none transition focus:border-[#1E8AF7] focus:bg-white"
                                    placeholder="Search products, orders, customers..."
                                />
                            </div>
                            <div className="flex items-center justify-between gap-2 md:justify-end">
                                <Link
                                    href={buildStoreUrl(activeStore)}
                                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-bold text-[#0F172A] hover:border-[#1E8AF7] hover:text-[#1E8AF7]"
                                >
                                    <Eye size={16} />
                                    Preview
                                </Link>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#1E8AF7]" aria-label="Notifications">
                                    <Bell size={17} />
                                </button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#475569] hover:text-[#1E8AF7]" aria-label="Help">
                                    <CircleHelp size={17} />
                                </button>
                            </div>
                        </header>
                    )}
                    {children}
                </div>
            </main>
        </div>
    );
}
