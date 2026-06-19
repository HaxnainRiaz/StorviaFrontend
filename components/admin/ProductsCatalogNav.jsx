"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, Tag, Boxes } from "lucide-react";

const tabs = [
    { label: "Products", href: "/app/products", icon: Package },
    { label: "Categories", href: "/app/products/categories", icon: Tag },
    { label: "Inventory", href: "/app/products/inventory", icon: Boxes },
];

export default function ProductsCatalogNav() {
    const pathname = usePathname() || "";

    return (
        <nav className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-4">
            {tabs.map(({ label, href, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(`${href}/`);
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                            active
                                ? "bg-[#1E8AF7] text-white shadow-sm"
                                : "bg-white text-[#64748B] border border-[#E2E8F0] hover:border-[#93C5FD] hover:text-[#1E8AF7]"
                        }`}
                    >
                        <Icon size={14} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
