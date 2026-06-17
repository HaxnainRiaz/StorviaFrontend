"use client";

import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Search, Save, AlertTriangle, CheckCircle, Sparkles, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SEOCenterPage() {
    const [seo, setSeo] = useState({
        title: "Fatafat Gourmet | Organic Organic Foods & Pure Elixirs",
        description: "Procure the finest organic products, pure raw honey, organic botanical elixirs, and bespoke gourmet foods directly from Fatafat Premium Store. Fast Delivery.",
    });

    const [isSaving, setIsSaving] = useState(false);

    // Hardcoded statistics/audit list
    const seoScore = 88;
    const missingMetas = ["Raw Sidr Honey (250g)", "Organic Chamomile Tea Bag Pack", "Bespoke Almond Extracts"];
    const missingAltTexts = ["Organic Rosemary Extract Hero Image", "Gourmet Herbs Thumbnail Banner"];

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Store SEO indexes and meta tags updated!");
        }, 800);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">SEO Center</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Optimize metadata index parameters and audit search engine discoverability</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                        {isSaving ? "Saving..." : "Save SEO Settings"}
                    </Button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Config Form & Google Preview */}
                <div className="lg:col-span-2 space-y-8">
                    {/* SEO Metadata Form */}
                    <form onSubmit={handleSave} className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-xl font-heading font-bold text-[#0a4019] italic flex items-center gap-2">
                            <Search size={20} />
                            Store Metadata Parameters
                        </h3>

                        <Input
                            label="SEO Title Tag"
                            required
                            value={seo.title}
                            onChange={(e) => setSeo({ ...seo, title: e.target.value })}
                            placeholder="Store title as indexed by search crawlers..."
                        />

                        <div>
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] mb-2 ml-1">SEO Meta Description</label>
                            <textarea
                                required
                                rows={4}
                                value={seo.description}
                                onChange={(e) => setSeo({ ...seo, description: e.target.value })}
                                className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                placeholder="Write a short summary (150-160 characters) of your shop..."
                            />
                            <div className="flex justify-between mt-2 px-1 text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                                <span>Length Guidelines: 150-160 characters</span>
                                <span className={seo.description.length > 160 ? "text-amber-600" : "text-emerald-600"}>
                                    Current length: {seo.description.length} chars
                                </span>
                            </div>
                        </div>
                    </form>

                    {/* Google Search Snippet Preview Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-[#F5F3F0]">
                            <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Google Search Result Snippet</h3>
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Live Preview Card</span>
                        </div>
                        
                        <div className="p-6 bg-[#FDFCFB] border border-[#F5F3F0] rounded-2xl shadow-inner max-w-2xl">
                            {/* URL */}
                            <div className="text-xs text-neutral-600 font-medium flex items-center gap-1.5 mb-1.5">
                                <span>https://fatafat.com/store/gourmet</span>
                                <span className="text-[10px] text-neutral-400">▼</span>
                            </div>
                            {/* Title */}
                            <h4 className="text-lg text-blue-800 hover:underline cursor-pointer font-semibold leading-snug line-clamp-1 mb-1">
                                {seo.title || "Specify your SEO Title Tag"}
                            </h4>
                            {/* Description */}
                            <p className="text-xs text-neutral-600 leading-relaxed font-medium line-clamp-2">
                                {seo.description || "Specify your SEO Meta Description to optimize organic click-through rate."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right - Audit Results & Score Card */}
                <div className="space-y-8">
                    {/* SEO Score Gauge Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#d3d3d3]/10 rounded-full -mr-8 -mt-8" />
                        
                        <div className="relative w-28 h-28 mx-auto flex items-center justify-center mb-4">
                            {/* Circular indicator mock */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="56" cy="56" r="48" stroke="#F5F3F0" strokeWidth="8" fill="transparent" />
                                <circle cx="56" cy="56" r="48" stroke="#0a4019" strokeWidth="8" fill="transparent"
                                        strokeDasharray="301" strokeDashoffset={301 - (301 * seoScore) / 100} />
                            </svg>
                            <span className="absolute text-2xl font-heading font-bold text-[#0a4019] italic">{seoScore}%</span>
                        </div>

                        <h4 className="text-lg font-heading font-bold text-[#0a4019] italic">Store SEO Score</h4>
                        <p className="text-xs text-[#6B6B6B] mt-2 font-medium leading-relaxed px-2">
                            Excellent organic parameters! Your tags cover crucial queries, and product accessibility scores are great.
                        </p>
                    </div>

                    {/* SEO Auditing Issues Report Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Optimization Audit</h3>
                        
                        {/* Missing Metas */}
                        <div className="space-y-3">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <AlertTriangle size={12} className="text-amber-500" />
                                Missing Meta Descriptions ({missingMetas.length})
                            </span>
                            <div className="space-y-1.5">
                                {missingMetas.map((item, idx) => (
                                    <div key={idx} className="text-[11px] font-bold text-[#0a4019] bg-[#d3d3d3]/10 border border-[#d3d3d3]/20 px-3 py-1.5 rounded-lg flex justify-between items-center">
                                        <span className="truncate">{item}</span>
                                        <span className="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Fix</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Missing Alt Texts */}
                        <div className="space-y-3 pt-3 border-t border-[#F5F3F0]">
                            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <AlertTriangle size={12} className="text-amber-500" />
                                Missing Image Alt Tags ({missingAltTexts.length})
                            </span>
                            <div className="space-y-1.5">
                                {missingAltTexts.map((item, idx) => (
                                    <div key={idx} className="text-[11px] font-bold text-[#0a4019] bg-[#d3d3d3]/10 border border-[#d3d3d3]/20 px-3 py-1.5 rounded-lg flex justify-between items-center">
                                        <span className="truncate">{item}</span>
                                        <span className="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Fix</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
