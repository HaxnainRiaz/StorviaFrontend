"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAdmin } from "@/context/AdminContext";
import { formatCompactPrice, formatPrice } from "@/lib/utils";
import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Facebook,
    Package,
    Search,
    ShoppingBag,
    Store,
    Truck,
    Users
} from "lucide-react";

const quickActions = [
    { label: "Add Product", href: "/app/products/new", icon: Package },
    { label: "View Orders", href: "/app/orders", icon: ShoppingBag },
    { label: "Customize Storefront", href: "/app/storefront", icon: Store },
    { label: "Connect Meta", href: "/app/meta", icon: Facebook },
    { label: "Connect PostEx", href: "/app/delivery/postex", icon: Truck },
    { label: "SEO Audit", href: "/app/seo", icon: Search }
];

export default function SellerDashboardPage() {
    const { stats = {}, orders = [], products = [], customers = [], activeStore, loading } = useAdmin();

    const lowStock = useMemo(() => products.filter(product => Number(product.stock || 0) < 10).slice(0, 5), [products]);
    const recentOrders = useMemo(() => orders.slice(0, 6), [orders]);
    const salesPoints = useMemo(() => {
        const raw = stats.revenueProgress || stats.salesOverview || stats.chartData || [];
        if (!Array.isArray(raw)) return [];
        const values = raw.map(item => Number(item.revenue || item.totalRevenue || item.sales || item.value || 0));
        const max = Math.max(...values, 0);
        return values.map(value => max ? Math.max(8, Math.round((value / max) * 100)) : 0);
    }, [stats]);

    const cards = [
        { label: "Total Revenue", value: formatCompactPrice(Number(stats.totalRevenue || 0)), icon: BarChart3, tone: "blue" },
        { label: "Orders", value: Number(stats.totalOrders || orders.length || 0), icon: ShoppingBag, tone: "green" },
        { label: "Customers", value: Number(stats.totalCustomers || customers.length || 0), icon: Users, tone: "amber" },
        { label: "Products", value: Number(stats.totalProducts || products.length || 0), icon: Package, tone: "slate" }
    ];

    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map(item => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white" />)}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-bold text-[#1E8AF7]">Seller dashboard</p>
                    <h1 className="mt-1 text-3xl font-black text-[#0F172A] md:text-4xl">{activeStore?.storeName || "Your store"}</h1>
                    <p className="mt-2 text-sm text-[#64748B]">Store-scoped overview for products, orders, customers, delivery, and storefront readiness.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/app/storefront/preview" className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#0F172A]">Preview Store</Link>
                    <Link href="/app/storefront/publish" className="rounded-xl bg-[#1E8AF7] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100">Publish</Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {cards.map(card => (
                    <div key={card.label} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider text-[#64748B]">{card.label}</p>
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F3FF] text-[#1E8AF7]">
                                <card.icon size={20} />
                            </div>
                        </div>
                        <p className="mt-5 text-3xl font-black text-[#0F172A]">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-[#0F172A]">Sales Overview</h2>
                            <p className="text-sm text-[#64748B]">Recent seller-scoped activity</p>
                        </div>
                        <Link href="/app/analytics" className="text-sm font-bold text-[#1E8AF7]">View analytics</Link>
                    </div>
                    {salesPoints.length ? (
                        <div className="flex h-64 items-end gap-2 rounded-xl bg-[#F8FBFF] p-4">
                            {salesPoints.map((height, index) => (
                                <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#1E8AF7] to-[#93C5FD]" style={{ height: `${height}%` }} />
                            ))}
                        </div>
                    ) : (
                        <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FBFF] p-4 text-center text-sm font-bold text-[#64748B]">
                            Sales chart data will appear after orders are placed.
                        </div>
                    )}
                </section>

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-black text-[#0F172A]">Store Setup Checklist</h2>
                    <div className="mt-4 space-y-3">
                        {["Store identity", "Delivery settings", "Payment methods", "First product", "Storefront preview"].map((item, index) => (
                            <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-3">
                                <CheckCircle2 size={18} className={index < 3 ? "text-[#16A34A]" : "text-[#94A3B8]"} />
                                <span className="text-sm font-bold text-[#0F172A]">{item}</span>
                            </div>
                        ))}
                    </div>
                    <Link href="/app/onboarding" className="mt-4 inline-flex w-full justify-center rounded-xl bg-[#1E8AF7] px-4 py-3 text-sm font-bold text-white">Continue setup</Link>
                </section>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm xl:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-black text-[#0F172A]">Recent Orders</h2>
                        <Link href="/app/orders" className="text-sm font-bold text-[#1E8AF7]">View all</Link>
                    </div>
                    <div className="space-y-2">
                        {recentOrders.length ? recentOrders.map(order => (
                            <Link key={order._id} href={`/app/orders/${order._id}`} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3 hover:border-[#1E8AF7]">
                                <div>
                                    <p className="font-bold text-[#0F172A]">{order.orderNumber || order._id?.slice(-6)}</p>
                                    <p className="text-xs text-[#64748B]">{order.customerName || order.shippingAddress?.fullName || "Guest customer"}</p>
                                </div>
                                <p className="font-black text-[#0F172A]">{formatPrice(order.totalAmount || 0)}</p>
                            </Link>
                        )) : <p className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center text-sm font-semibold text-[#64748B]">No orders yet.</p>}
                    </div>
                </section>

                <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                        <AlertTriangle size={18} className="text-[#F59E0B]" />
                        <h2 className="text-lg font-black text-[#0F172A]">Low Stock Alerts</h2>
                    </div>
                    <div className="space-y-2">
                        {lowStock.length ? lowStock.map(product => (
                            <Link key={product._id} href={`/app/products/${product._id}`} className="flex items-center justify-between rounded-xl bg-[#FEF3C7]/40 p-3">
                                <span className="text-sm font-bold text-[#0F172A]">{product.title}</span>
                                <span className="rounded-full bg-[#FEF3C7] px-2 py-1 text-xs font-bold text-[#B45309]">{product.stock} left</span>
                            </Link>
                        )) : <p className="rounded-xl border border-dashed border-[#E2E8F0] p-6 text-center text-sm font-semibold text-[#64748B]">Inventory looks healthy.</p>}
                    </div>
                </section>
            </div>

            <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {quickActions.map(action => (
                    <Link key={action.label} href={action.href} className="rounded-2xl border border-[#E2E8F0] bg-white p-4 text-sm font-bold text-[#0F172A] shadow-sm hover:border-[#1E8AF7] hover:text-[#1E8AF7]">
                        <action.icon className="mb-3 text-[#1E8AF7]" size={22} />
                        {action.label}
                    </Link>
                ))}
            </section>
        </div>
    );
}
