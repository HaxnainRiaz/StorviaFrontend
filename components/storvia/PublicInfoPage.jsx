import Link from "next/link";
import { Store } from "lucide-react";

const copy = {
    features: ["Seller dashboard", "Storefront builder", "Products and inventory", "Orders and PostEx", "Meta Pixel and CAPI", "SEO audit", "Staff permissions", "Analytics"],
    pricing: ["Free setup while in beta", "No marketplace listing fees", "Independent storefront tools", "Delivery and tracking modules"],
    examples: ["Fashion store", "Beauty store", "Electronics store", "Home goods store"],
    contact: ["Email support", "Seller onboarding help", "Integration guidance", "Store setup consultation"]
};

export default function PublicInfoPage({ type }) {
    const items = copy[type] || copy.features;
    const title = type === "pricing" ? "Simple Pricing" : type === "examples" ? "Example Stores" : type === "contact" ? "Contact Storvia" : "Storvia Features";
    return (
        <main className="min-h-screen bg-[#F8FBFF] px-5 py-8">
            <nav className="mx-auto mb-10 flex max-w-6xl items-center justify-between">
                <Link href="/" className="flex items-center gap-3 text-xl font-black text-[#0F172A]"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#1E8AF7] text-white"><Store size={20} /></span>Storvia</Link>
                <Link href="/signup" className="rounded-xl bg-[#1E8AF7] px-4 py-2 text-sm font-bold text-white">Start free</Link>
            </nav>
            <section className="mx-auto max-w-6xl">
                <h1 className="text-4xl font-black text-[#0F172A] md:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#475569]">Everything is designed for independent stores, not marketplace discovery.</p>
                <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {items.map(item => <div key={item} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 text-sm font-bold text-[#0F172A] shadow-sm">{item}</div>)}
                </div>
            </section>
        </main>
    );
}
