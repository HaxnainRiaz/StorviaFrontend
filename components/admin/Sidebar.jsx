"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAdmin } from "@/context/AdminContext";
import { buildStoreUrl } from "@/lib/storeUrl";
import {
    BarChart3,
    Boxes,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Facebook,
    LayoutDashboard,
    LogOut,
    Megaphone,
    Menu,
    MessageCircle,
    Package,
    Search,
    Settings,
    Shield,
    ShoppingBag,
    Star,
    Store,
    Tag,
    TicketPercent,
    Truck,
    Users,
    X,
} from "lucide-react";

const navGroups = [
    {
        title: "Main",
        items: [
            { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
            { label: "Orders", href: "/app/orders", icon: ShoppingBag },
            { label: "Customers", href: "/app/customers", icon: Users },
        ],
    },
    {
        title: "Catalog",
        items: [
            { label: "Products", href: "/app/products", icon: Package },
            { label: "Categories", href: "/app/products/categories", icon: Tag },
            { label: "Inventory", href: "/app/products/inventory", icon: Boxes },
        ],
    },
    {
        title: "Store",
        items: [
            { label: "Storefront", href: "/app/storefront", icon: Store },
            { label: "SEO", href: "/app/seo", icon: Search },
            { label: "Reviews", href: "/app/reviews", icon: Star },
            { label: "Support", href: "/app/support", icon: MessageCircle },
        ],
    },
    {
        title: "Growth",
        items: [
            { label: "Discounts", href: "/app/marketing/coupons", icon: TicketPercent },
            { label: "Marketing", href: "/app/marketing/banners", icon: Megaphone },
            { label: "Meta", href: "/app/meta", icon: Facebook },
            { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
        ],
    },
    {
        title: "Operations",
        items: [
            { label: "Delivery", href: "/app/delivery", icon: Truck },
            { label: "Payments", href: "/app/payments", icon: CreditCard },
            { label: "Staff", href: "/app/staff", icon: Shield },
        ],
    },
    {
        title: "System",
        items: [
            { label: "Settings", href: "/app/settings", icon: Settings },
            { label: "Audit Logs", href: "/app/audit-logs", icon: Shield },
        ],
    },
];

function isNavItemActive(pathname, href) {
    if (pathname === href) return true;
    if (href === "/app/products") {
        const catalogOnly = ["/app/products/categories", "/app/products/inventory", "/app/products/collections"];
        if (catalogOnly.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return false;
    }
    if (href === "/app/marketing/coupons") {
        return pathname.startsWith("/app/marketing/");
    }
    return pathname.startsWith(`${href}/`);
}
function SidebarGroup({ group, pathname, collapsed, defaultOpen = false, closeMobile }) {
    const [open, setOpen] = useState(defaultOpen);
    const hasActive = group.items.some((item) => isNavItemActive(pathname, item.href));
    const expanded = open || hasActive;

    if (collapsed) {
        return (
            <div className="space-y-1">
                {group.items.map(item => {
                    const active = isNavItemActive(pathname, item.href);
                    return (
                        <Link key={item.href} href={item.href} title={item.label} onClick={closeMobile} className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${active ? "bg-[#1E8AF7] text-white shadow-md shadow-blue-100" : "text-[#64748B] hover:bg-white hover:text-[#0F172A]"}`}>
                            <item.icon size={18} />
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div>
            <button type="button" onClick={() => setOpen(value => !value)} className="mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[11px] font-black uppercase tracking-wider text-[#94A3B8] hover:bg-white">
                {group.title}
                <ChevronDown className={`h-3.5 w-3.5 transition ${expanded ? "rotate-180" : ""}`} />
            </button>
            {expanded && (
                <div className="space-y-1">
                    {group.items.map(item => {
                        const active = isNavItemActive(pathname, item.href);
                        return (
                            <Link key={item.href} href={item.href} onClick={closeMobile} className={`flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold transition ${active ? "bg-[#1E8AF7] text-white shadow-md shadow-blue-100" : "text-[#475569] hover:bg-white hover:text-[#0F172A]"}`}>
                                <item.icon size={18} />
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function StoreStatusCard({ activeStore, collapsed }) {
    const [open, setOpen] = useState(false);
    const progress = activeStore?.setupStatus === "completed" ? 100 : activeStore?.setupCompletedSteps?.length ? Math.min(95, activeStore.setupCompletedSteps.length * 12) : 15;
    
    if (collapsed) {
        return (
            <Link href="/app/storefront" title={activeStore?.storeName || "Current store"} className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#1E8AF7]">
                {(activeStore?.storeName || "S").slice(0, 1).toUpperCase()}
            </Link>
        );
    }
    
    return (
        <div className="rounded-2xl border border-[#E2E8F0] bg-white p-2">
            <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-3 text-left">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#E8F3FF] text-xs font-black text-[#1E8AF7]">
                    {(activeStore?.storeName || "S").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-black text-[#0F172A]">{activeStore?.storeName || "Your store"}</p>
                    <span className="inline-flex rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[9px] font-black text-[#64748B]">{activeStore?.status || "draft"}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-[#64748B] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
            </button>
            
            {open && (
                <div className="mt-3 border-t border-[#F1F5F9] pt-3">
                    <div className="flex justify-between items-center text-[10px] text-[#64748B] font-bold">
                        <span>Setup progress</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#E2E8F0]">
                        <div className="h-full rounded-full bg-[#1E8AF7]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="mt-3 flex gap-2">
                        <Link href="/app/onboarding" className="flex-1 rounded-lg bg-[#E8F3FF] px-2 py-2 text-center text-[11px] font-black text-[#1E8AF7]">Setup</Link>
                        <Link href={buildStoreUrl(activeStore)} className="flex-1 rounded-lg border border-[#E2E8F0] px-2 py-2 text-center text-[11px] font-black text-[#0F172A]">View</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname() || "";
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const { logout, user } = useAuth();
    const { activeStore } = useAdmin();

    const firstGroupWithActive = useMemo(() => navGroups.findIndex(group => group.items.some(item => isNavItemActive(pathname, item.href))), [pathname]);

    const content = (
        <aside className={`flex h-full flex-col border-r border-[#E2E8F0] bg-[#F6FAFF] px-3 py-4 transition-all ${collapsed ? "w-[76px]" : "w-72"}`}>
            <div className={`mb-4 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
                <Link href="/app/dashboard" className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1E8AF7] text-white shadow-lg shadow-blue-200">
                        <Store size={22} />
                    </div>
                    {!collapsed && (
                        <div>
                            <p className="text-xl font-black tracking-tight text-[#0F172A]">Storvia</p>
                            <p className="text-[11px] font-semibold text-[#64748B]">Seller Dashboard</p>
                        </div>
                    )}
                </Link>
                {!collapsed && (
                    <button type="button" onClick={() => setCollapsed(true)} className="hidden rounded-lg p-2 text-[#64748B] hover:bg-white lg:block" aria-label="Collapse sidebar">
                        <ChevronLeft size={17} />
                    </button>
                )}
            </div>

            {collapsed && (
                <button type="button" onClick={() => setCollapsed(false)} className="mb-3 hidden h-10 w-11 items-center justify-center rounded-xl text-[#64748B] hover:bg-white lg:flex" aria-label="Expand sidebar">
                    <ChevronRight size={17} />
                </button>
            )}

            <StoreStatusCard activeStore={activeStore} collapsed={collapsed} />

            <nav className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                {navGroups.map((group, index) => (
                    <SidebarGroup key={group.title} group={group} pathname={pathname} collapsed={collapsed} defaultOpen={index === 0 || index === firstGroupWithActive} closeMobile={() => setMobileOpen(false)} />
                ))}
            </nav>

            <div className={`mt-auto pt-4 border-t border-[#E2E8F0] ${collapsed ? "px-0" : "px-1"}`}>
                <div className="flex items-center justify-between gap-3">
                    {!collapsed && (
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E8F3FF] text-xs font-black text-[#1E8AF7]">
                                {(user?.name || user?.email || "S").slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#0F172A]">{user?.name || "Store owner"}</p>
                                <p className="truncate text-[10px] text-[#64748B]">{user?.email || "seller account"}</p>
                            </div>
                        </div>
                    )}
                    <button onClick={logout} title="Logout" className={`flex h-9 items-center justify-center gap-1 rounded-xl transition ${collapsed ? "w-11 bg-[#FEF2F2] border border-[#FEE2E2] text-[#DC2626]" : "px-3 bg-transparent hover:bg-[#FEF2F2] text-[#DC2626] text-xs font-black"}`}>
                        <LogOut size={16} />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <>
            <button onClick={() => setMobileOpen(true)} className="fixed left-4 top-4 z-[70] flex h-11 w-11 items-center justify-center rounded-xl bg-[#1E8AF7] text-white shadow-lg lg:hidden" aria-label="Open navigation">
                <Menu size={20} />
            </button>

            <div className="fixed inset-y-0 left-0 z-[60] hidden lg:block">{content}</div>

            {mobileOpen && (
                <div className="fixed inset-0 z-[80] lg:hidden">
                    <button className="absolute inset-0 bg-[#0F172A]/40" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />
                    <div className="relative h-full w-72">
                        <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#0F172A] shadow" aria-label="Close navigation">
                            <X size={18} />
                        </button>
                        {content}
                    </div>
                </div>
            )}
        </>
    );
}
