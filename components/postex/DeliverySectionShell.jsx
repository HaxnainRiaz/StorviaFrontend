"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, Box, Cable, MapPin, Truck } from "lucide-react";

const items = [
    { href: "/app/delivery/postex", label: "Overview", icon: Cable },
    { href: "/app/delivery/shipments", label: "Shipments", icon: Box },
    { href: "/app/delivery/tracking", label: "Tracking", icon: MapPin },
    { href: "/app/delivery/failed-logs", label: "Failed logs", icon: AlertTriangle },
];

export default function DeliverySectionShell({ children }) {
    const pathname = usePathname();
    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-black text-[#1E8AF7]"><Truck size={15} /> Delivery operations</div>
                    <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">PostEx delivery</h1>
                    <p className="mt-1.5 text-sm font-medium text-[#64748B]">Configure shipping, book parcels, and resolve delivery exceptions.</p>
                </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white p-1.5 shadow-sm">
                {items.map(({ href, label, icon: Icon }) => {
                    const active = pathname === href;
                    return <Link key={href} href={href} className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${active ? "bg-[#1E8AF7] text-white shadow-sm" : "text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#1E8AF7]"}`}><Icon size={14} />{label}</Link>;
                })}
            </nav>
            <div className="delivery-page">{children}</div>
        </div>
    );
}
