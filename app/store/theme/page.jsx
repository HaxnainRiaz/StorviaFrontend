"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { Palette, RotateCcw, Save, Sparkles, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ThemeSettingsPage() {
    // Theme state
    const [primaryColor, setPrimaryColor] = useState("emerald");
    const [secondaryColor, setSecondaryColor] = useState("amber");
    const [buttonStyle, setButtonStyle] = useState("pill");
    const [cardStyle, setCardStyle] = useState("elevated");
    const [borderRadius, setBorderRadius] = useState("xl");
    const [headerStyle, setHeaderStyle] = useState("minimal");
    const [footerStyle, setFooterStyle] = useState("compact");

    const [isSaving, setIsSaving] = useState(false);

    const colorsMap = {
        emerald: { hex: "#0a4019", name: "Imperial Green" },
        ruby: { hex: "#8b1a1a", name: "Royal Crimson" },
        sapphire: { hex: "#1e3a8a", name: "Bespoke Navy" },
        amber: { hex: "#b45309", name: "Vintage Amber" },
        rose: { hex: "#9d174d", name: "Rose Quartz" }
    };

    const secondaryColorsMap = {
        amber: { hex: "#d3d3d3", name: "Platinum Dust" },
        gold: { hex: "#B8A68A", name: "Antique Gold" },
        charcoal: { hex: "#262626", name: "Dark Charcoal" },
        sky: { hex: "#38bdf8", name: "Soft Sky" }
    };

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Theme settings stored successfully!");
        }, 800);
    };

    const handleReset = () => {
        setPrimaryColor("emerald");
        setSecondaryColor("amber");
        setButtonStyle("pill");
        setCardStyle("elevated");
        setBorderRadius("xl");
        setHeaderStyle("minimal");
        setFooterStyle("compact");
        toast.success("Theme reverted to default parameters");
    };

    // Derived preview styles
    const getBorderRadiusClass = () => {
        if (borderRadius === "none") return "rounded-none";
        if (borderRadius === "md") return "rounded-md";
        return "rounded-[1.5rem]";
    };

    const getBtnStyleClass = () => {
        let base = "text-xs font-bold uppercase tracking-wider py-2 px-4 shadow-sm transition-all ";
        if (buttonStyle === "pill") return base + "rounded-full";
        if (buttonStyle === "sharp") return base + "rounded-none";
        return base + "rounded-lg";
    };

    const getCardStyleClass = () => {
        if (cardStyle === "elevated") return "bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)] border border-[#F5F3F0]";
        if (cardStyle === "flat") return "bg-white border-2 border-[#F5F3F0]";
        return "bg-white/40 backdrop-blur-md border border-white/20 shadow-inner";
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Theme Settings</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Refine your custom storefront styling tokens and preview adjustments in real-time</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleReset} variant="outline" icon={RotateCcw}>
                        Reset to Default
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                        {isSaving ? "Saving..." : "Save Theme"}
                    </Button>
                </div>
            </div>

            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left - Visual Settings Config */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Colors Selector Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-xl font-heading font-bold text-[#0a4019] italic flex items-center gap-2">
                            <Palette size={20} />
                            Color Palette Selectors
                        </h3>

                        {/* Primary Palette */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">
                                Primary Accent Color
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(colorsMap).map(([key, item]) => (
                                    <button
                                        key={key}
                                        onClick={() => setPrimaryColor(key)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all ${
                                            primaryColor === key
                                                ? "border-[#0a4019] bg-[#0a4019]/5 shadow-sm"
                                                : "border-[#F5F3F0] bg-white hover:border-neutral-300"
                                        }`}
                                    >
                                        <span
                                            className="w-4 h-4 rounded-full border shadow-inner"
                                            style={{ backgroundColor: item.hex }}
                                        />
                                        <span className="text-xs font-bold text-[#0a4019]">{item.name}</span>
                                        {primaryColor === key && <Check size={12} className="text-[#0a4019]" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Secondary Palette */}
                        <div className="space-y-3 pt-2">
                            <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">
                                Secondary Detail Color
                            </label>
                            <div className="flex flex-wrap gap-4">
                                {Object.entries(secondaryColorsMap).map(([key, item]) => (
                                    <button
                                        key={key}
                                        onClick={() => setSecondaryColor(key)}
                                        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border transition-all ${
                                            secondaryColor === key
                                                ? "border-[#0a4019] bg-[#0a4019]/5 shadow-sm"
                                                : "border-[#F5F3F0] bg-white hover:border-neutral-300"
                                        }`}
                                    >
                                        <span
                                            className="w-4 h-4 rounded-full border shadow-inner"
                                            style={{ backgroundColor: item.hex }}
                                        />
                                        <span className="text-xs font-bold text-[#0a4019]">{item.name}</span>
                                        {secondaryColor === key && <Check size={12} className="text-[#0a4019]" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Component Styles Card */}
                    <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <h3 className="text-xl font-heading font-bold text-[#0a4019] italic">Component Stylings</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Button Style */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Button Contour</label>
                                <select
                                    value={buttonStyle}
                                    onChange={(e) => setButtonStyle(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="pill">Pill Shape (Rounded-Full)</option>
                                    <option value="rounded">Rounded Corners (Rounded-Lg)</option>
                                    <option value="sharp">Sharp Contour (Rounded-None)</option>
                                </select>
                            </div>

                            {/* Product Card Style */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Product Card Theme</label>
                                <select
                                    value={cardStyle}
                                    onChange={(e) => setCardStyle(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="elevated">Soft Elevated Shadow Card</option>
                                    <option value="flat">Minimal Outline Flat Card</option>
                                    <option value="glassmorphic">Glassmorphic Frosted Card</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Border Radius */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Global Border Radius</label>
                                <select
                                    value={borderRadius}
                                    onChange={(e) => setBorderRadius(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="none">No Rounded Corners (0px)</option>
                                    <option value="md">Moderate Rounded Corners (8px)</option>
                                    <option value="xl">Luxurious Curved Corners (24px)</option>
                                </select>
                            </div>

                            {/* Header Structure */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Header Structural Layout</label>
                                <select
                                    value={headerStyle}
                                    onChange={(e) => setHeaderStyle(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="minimal">Minimal Clean Nav (Logo Left)</option>
                                    <option value="centered">Elegant Centered Nav (Logo Mid)</option>
                                    <option value="classic">Classic Top Header (Full Width)</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Footer style */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Footer Structure</label>
                                <select
                                    value={footerStyle}
                                    onChange={(e) => setFooterStyle(e.target.value)}
                                    className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                                >
                                    <option value="compact">Compact Single Line Footer</option>
                                    <option value="detailed">Multi-column Corporate Footer</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Live Preview Card */}
                <div>
                    <div className="sticky top-6 bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-[#F5F3F0]">
                            <h3 className="text-lg font-heading font-bold text-[#0a4019] italic flex items-center gap-2">
                                <Sparkles size={18} className="text-[#0a4019]" />
                                Live Style Preview
                            </h3>
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                Live Canvas
                            </span>
                        </div>

                        {/* Interactive Widget Box */}
                        <div className="bg-[#F5F3F0]/20 rounded-3xl p-6 border border-[#F5F3F0] space-y-6">
                            
                            {/* Preview Header mockup */}
                            <div className="p-3 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-between">
                                {headerStyle === "centered" ? (
                                    <>
                                        <div className="w-10 h-2 bg-neutral-200 rounded" />
                                        <div className="text-[10px] font-heading font-bold italic" style={{ color: colorsMap[primaryColor].hex }}>StoreLogo</div>
                                        <div className="w-10 h-2 bg-neutral-200 rounded" />
                                    </>
                                ) : (
                                    <>
                                        <div className="text-[10px] font-heading font-bold italic" style={{ color: colorsMap[primaryColor].hex }}>StoreLogo</div>
                                        <div className="flex gap-2">
                                            <div className="w-6 h-2 bg-neutral-200 rounded" />
                                            <div className="w-6 h-2 bg-neutral-200 rounded" />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Preview Product Card mockup */}
                            <div className={`p-4 transition-all duration-300 ${getCardStyleClass()} ${getBorderRadiusClass()}`}>
                                <div className="aspect-square bg-neutral-100 rounded-xl mb-4 relative overflow-hidden flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-200">
                                    Product Image Placeholder
                                    <span
                                        className="absolute top-2 right-2 text-[8px] font-bold text-white px-2 py-0.5 rounded-full"
                                        style={{ backgroundColor: colorsMap[primaryColor].hex }}
                                    >
                                        NEW
                                    </span>
                                </div>
                                <h4 className="text-xs font-bold text-[#0a4019] mb-1">Elixir Botanical Nectar</h4>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xs font-bold" style={{ color: colorsMap[primaryColor].hex }}>$24.00</span>
                                    <span className="text-[9px] line-through text-neutral-300 font-bold">$32.00</span>
                                </div>
                                
                                <button
                                    className={`${getBtnStyleClass()}`}
                                    style={{
                                        backgroundColor: colorsMap[primaryColor].hex,
                                        color: "#ffffff"
                                    }}
                                >
                                    Add to Cart
                                </button>
                            </div>

                            {/* Preview Footer mockup */}
                            <div className="p-3 bg-neutral-900 rounded-xl text-center text-white">
                                {footerStyle === "compact" ? (
                                    <p className="text-[8px] opacity-50 tracking-wider">© 2026 Storefront Inc.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2 text-left">
                                        <div>
                                            <p className="text-[8px] font-bold" style={{ color: secondaryColorsMap[secondaryColor].hex }}>STORE</p>
                                            <p className="text-[6px] opacity-40 mt-1">About Us</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-bold" style={{ color: secondaryColorsMap[secondaryColor].hex }}>SUPPORT</p>
                                            <p className="text-[6px] opacity-40 mt-1">Contact coordinates</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-[10px] text-[#6B6B6B] text-center font-medium leading-relaxed">
                            Fine-tune the custom storefront appearance parameters. Click <strong>Save Theme</strong> to publish immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
