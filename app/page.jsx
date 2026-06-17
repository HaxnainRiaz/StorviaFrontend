import Link from "next/link";
import {
    BarChart3,
    CheckCircle2,
    Facebook,
    Globe2,
    LayoutDashboard,
    Package,
    Search,
    ShoppingBag,
    Star,
    Store,
    Truck
} from "lucide-react";

const features = [
    { title: "Store setup", icon: Store, text: "Launch an independent webstore with your own branding, URL, pages, policies, and theme." },
    { title: "Products and inventory", icon: Package, text: "Manage products, categories, collections, stock alerts, media, variants, and SEO fields." },
    { title: "Orders and delivery", icon: ShoppingBag, text: "Keep the operational order flow, payment statuses, PostEx booking, and shipment tracking." },
    { title: "Meta tracking", icon: Facebook, text: "Connect Pixel and Conversions API per store without exposing tokens to the browser." },
    { title: "SEO controls", icon: Search, text: "Edit metadata, preview search results, audit missing tags, and publish safe sitemaps." },
    { title: "Analytics", icon: BarChart3, text: "Track seller-scoped revenue, customers, conversion, products, traffic, and support activity." }
];

export default function PublicLandingPage() {
    return (
        <main className="min-h-screen bg-[#F8FBFF] text-[#0F172A]">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                <Link href="/" className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E8AF7] text-white">
                        <Store size={20} />
                    </span>
                    <span className="text-xl font-black">Storvia</span>
                </Link>
                <div className="hidden items-center gap-6 text-sm font-semibold text-[#475569] md:flex">
                    <Link href="/features">Features</Link>
                    <Link href="/pricing">Pricing</Link>
                    <Link href="/examples">Examples</Link>
                    <Link href="/contact">Contact</Link>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/login" className="rounded-xl px-4 py-2 text-sm font-bold text-[#0F172A] hover:bg-white">Login</Link>
                    <Link href="/signup" className="rounded-xl bg-[#1E8AF7] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-[#0F74D8]">Start free</Link>
                </div>
            </nav>

            <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-10 lg:grid-cols-[1fr_0.9fr] lg:items-center">
                <div>
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#E8F3FF] px-4 py-2 text-xs font-bold text-[#1E8AF7]">
                        <Globe2 size={15} />
                        One platform, independent stores
                    </div>
                    <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-[#0F172A] md:text-6xl">
                        Create your own online store without technical complexity
                    </h1>
                    <p className="mt-5 max-w-2xl text-lg leading-8 text-[#475569]">
                        Storvia gives sellers a private ecommerce dashboard, independent storefront, delivery tools, Meta tracking, SEO, staff permissions, and analytics. It is not a marketplace, and your products never compete in a global listing.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link href="/signup" className="rounded-xl bg-[#1E8AF7] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-100 hover:bg-[#0F74D8]">Start your store</Link>
                        <Link href="/login" className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7]">Login</Link>
                        <Link href="/examples" className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7]">View demo</Link>
                    </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-2xl shadow-blue-100/60">
                    <div className="rounded-xl bg-[#F8FBFF] p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">Seller dashboard</p>
                                <p className="text-xl font-black">BluePeak Store</p>
                            </div>
                            <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-xs font-bold text-[#16A34A]">Published</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {["Revenue", "Orders", "Customers", "Low stock"].map((item, index) => (
                                <div key={item} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                                    <p className="text-xs font-bold text-[#64748B]">{item}</p>
                                    <p className="mt-2 text-2xl font-black text-[#0F172A]">{["PKR 1.2M", "438", "1,820", "6"][index]}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 rounded-xl border border-[#E2E8F0] bg-white p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <p className="text-sm font-bold">Sales overview</p>
                                <span className="text-xs font-bold text-[#1E8AF7]">Last 30 days</span>
                            </div>
                            <div className="flex h-28 items-end gap-2">
                                {[35, 55, 44, 76, 62, 88, 71, 95, 84].map((height, index) => (
                                    <div key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#1E8AF7] to-[#93C5FD]" style={{ height: `${height}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-12">
                <div className="grid gap-4 md:grid-cols-3">
                    {features.map(feature => (
                        <div key={feature.title} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF] text-[#1E8AF7]">
                                <feature.icon size={22} />
                            </div>
                            <h3 className="text-lg font-black">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[#475569]">{feature.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-5 py-12">
                <div className="rounded-2xl bg-[#0F172A] p-8 text-white md:p-10">
                    <h2 className="text-3xl font-black">Your store stays independent</h2>
                    <div className="mt-6 grid gap-4 md:grid-cols-5">
                        {["Signup", "Setup store", "Add products", "Publish", "Start selling"].map(step => (
                            <div key={step} className="flex items-center gap-2 rounded-xl bg-white/10 p-3 text-sm font-bold">
                                <CheckCircle2 size={18} className="text-[#93C5FD]" />
                                {step}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="border-t border-[#E2E8F0] bg-white px-5 py-8 text-center text-sm font-semibold text-[#64748B]">
                Storvia independent store platform. No marketplace product discovery.
            </footer>
        </main>
    );
}
