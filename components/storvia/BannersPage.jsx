"use client";

import { useAdmin } from "@/context/AdminContext";
import { Card, PrimaryButton, SellerPageScaffold } from "./SellerPageScaffold";

export default function BannersPage() {
    const { banners = [], addBanner, deleteBanner } = useAdmin();

    const create = () => addBanner?.({
        title: "New storefront banner",
        subtitle: "Announce an offer or campaign",
        buttonText: "Shop now",
        buttonLink: "/products",
        isActive: true
    });

    return (
        <SellerPageScaffold title="Banners" description="Schedule homepage and campaign banners for the current store." actions={<PrimaryButton onClick={create}>Create banner</PrimaryButton>}>
            <div className="grid gap-4 md:grid-cols-2">
                {banners.map(banner => (
                    <Card key={banner._id}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-lg font-black text-[#0F172A]">{banner.title}</p>
                                <p className="mt-1 text-sm text-[#64748B]">{banner.subtitle || "No subtitle"}</p>
                            </div>
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${banner.isActive ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#F1F5F9] text-[#64748B]"}`}>{banner.isActive ? "Active" : "Draft"}</span>
                        </div>
                        <button onClick={() => deleteBanner?.(banner._id)} className="mt-4 text-sm font-bold text-[#DC2626]">Delete</button>
                    </Card>
                ))}
                {!banners.length && <Card className="md:col-span-2 text-center text-sm font-semibold text-[#64748B]">No banners yet.</Card>}
            </div>
        </SellerPageScaffold>
    );
}
