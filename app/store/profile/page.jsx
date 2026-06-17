"use client";

import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Store, Eye, Upload, ShieldCheck, Mail, Phone, MapPin, Tag } from "lucide-react";
import toast from "react-hot-toast";

export default function StoreProfilePage() {
    const [profile, setProfile] = useState({
        name: "Fatafat Premium Store",
        slug: "fatafat-premium-store",
        category: "Gourmet & Organic Foods",
        email: "contact@fatafatstore.com",
        phone: "+92 300 1234567",
        address: "74-A Block H, Gulberg III, Lahore, Pakistan",
        status: "Active",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Store identity details updated successfully!");
        }, 800);
    };

    const handlePreview = () => {
        toast.success("Opening live storefront preview...");
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Store Profile</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Configure your public store identity and customer coordinates</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handlePreview} variant="outline" icon={Eye}>
                        Preview Store
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} icon={Store}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Columns - Form Details */}
                <form onSubmit={handleSave} className="lg:col-span-2 space-y-8">
                    {/* Identity Details Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-xl font-heading font-bold text-[#0a4019] italic mb-4">Core Identity</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Store Name"
                                required
                                value={profile.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                                    setProfile({ ...profile, name, slug });
                                }}
                                placeholder="e.g. Fatafat Store"
                            />
                            
                            <div>
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">Store Slug Preview</label>
                                <div className="relative">
                                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#B8A68A] text-xs font-semibold">
                                        fatafat.com/
                                    </div>
                                    <input
                                        type="text"
                                        readOnly
                                        value={profile.slug}
                                        className="w-full pl-[100px] pr-6 py-4 bg-neutral-50 border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019]/70 focus:outline-none cursor-not-allowed shadow-inner"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">Business Category</label>
                                <select
                                    value={profile.category}
                                    onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] shadow-sm focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="Gourmet & Organic Foods">Gourmet & Organic Foods</option>
                                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                                    <option value="Consumer Electronics">Consumer Electronics</option>
                                    <option value="Beauty & Cosmetics">Beauty & Cosmetics</option>
                                    <option value="Home & Lifestyle">Home & Lifestyle</option>
                                </select>
                            </div>
                            
                            <div className="flex flex-col justify-end">
                                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2 ml-1">Public URL Preview</label>
                                <div className="text-xs font-bold text-[#0a4019] bg-[#d3d3d3]/10 px-6 py-4 rounded-2xl border border-[#d3d3d3]/20 flex items-center gap-2">
                                    <Tag size={14} className="text-[#0a4019]" />
                                    <span>https://fatafat.com/store/{profile.slug}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coordinates & Contact Info Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-xl font-heading font-bold text-[#0a4019] italic mb-4">Coordinates & Locations</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Contact Email"
                                type="email"
                                required
                                icon={Mail}
                                value={profile.email}
                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                placeholder="e.g. hello@store.com"
                            />
                            
                            <Input
                                label="Contact Phone"
                                type="tel"
                                required
                                icon={Phone}
                                value={profile.phone}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                placeholder="e.g. +92 300 0000000"
                            />
                        </div>

                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">Physical Business Address</label>
                            <div className="relative">
                                <div className="absolute left-6 top-6 text-[#B8A68A]">
                                    <MapPin size={18} />
                                </div>
                                <textarea
                                    required
                                    rows={3}
                                    value={profile.address}
                                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                    className="w-full pl-14 pr-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                    placeholder="Enter physical business coordinates..."
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Right Column - Status & Media */}
                <div className="space-y-8">
                    {/* Store Status Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#d3d3d3]/10 rounded-full -mr-8 -mt-8" />
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 mb-4 shadow-inner">
                            <ShieldCheck size={28} />
                        </div>
                        <h4 className="text-lg font-heading font-bold text-[#0a4019] italic">Store Status</h4>
                        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0a4019]/10 border border-[#0a4019]/20 text-[#0a4019] text-xs font-bold uppercase tracking-widest">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                            {profile.status}
                        </div>
                        <p className="text-xs text-[#6B6B6B] mt-4 leading-relaxed font-medium">
                            Your store is live and indexed in the Fatafat independent seller network. Customers can check out.
                        </p>
                    </div>

                    {/* Logo Upload Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Store Logo</h3>
                        <div className="border-2 border-dashed border-[#F5F3F0] rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-neutral-50 transition-colors group">
                            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-[#B8A68A] group-hover:text-[#0a4019] transition-colors mb-4">
                                <Upload size={24} />
                            </div>
                            <span className="text-xs font-bold text-[#0a4019] group-hover:underline">Upload High-Res Brand logo</span>
                            <span className="text-[10px] text-neutral-400 mt-2 font-bold uppercase tracking-wider">PNG, JPG up to 2MB</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
