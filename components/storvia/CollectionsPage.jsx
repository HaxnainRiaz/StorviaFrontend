"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card, PrimaryButton, SellerPageScaffold } from "./SellerPageScaffold";

export default function CollectionsPage() {
    const { adminRequest } = useAdmin();
    const [collections, setCollections] = useState([]);
    const [title, setTitle] = useState("");

    const load = async () => {
        const res = await adminRequest("/seller/collections");
        if (res?.success) setCollections(res.data || []);
    };

    useEffect(() => { load(); }, []);

    const create = async (event) => {
        event.preventDefault();
        if (!title) return;
        await adminRequest("/seller/collections", "POST", { title, type: "manual", status: "active" });
        setTitle("");
        load();
    };

    return (
        <SellerPageScaffold title="Collections" description="Create manual or automatic product groups for your independent storefront.">
            <Card>
                <form onSubmit={create} className="flex flex-col gap-3 md:flex-row">
                    <input value={title} onChange={event => setTitle(event.target.value)} className="h-12 flex-1 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7]" placeholder="Collection title" />
                    <PrimaryButton type="submit">Create collection</PrimaryButton>
                </form>
            </Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {collections.map(collection => (
                    <Card key={collection._id}>
                        <p className="text-lg font-black text-[#0F172A]">{collection.title}</p>
                        <p className="mt-2 text-sm text-[#64748B]">{collection.type || "manual"} collection</p>
                    </Card>
                ))}
                {!collections.length && <Card className="md:col-span-2 xl:col-span-3 text-center text-sm font-semibold text-[#64748B]">No collections yet.</Card>}
            </div>
        </SellerPageScaffold>
    );
}
