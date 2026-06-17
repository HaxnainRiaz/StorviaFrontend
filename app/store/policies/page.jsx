"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui";
import { ScrollText, Save, RefreshCw, Undo2, Truck, Banknote, ShieldAlert, Scale, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function StorePoliciesPage() {
    const [policies, setPolicies] = useState({
        returnPolicy: "We offer a 7-day hassle-free return policy. Items must be unused, in original packaging, and with invoice receipt attached.",
        shippingPolicy: "Orders are dispatched within 24-48 business hours. Deliveries inside major cities take 2-3 business days, others up to 5 business days.",
        codPolicy: "Cash on Delivery is available across Pakistan. Please verify your order through phone confirmation when requested.",
        privacyPolicy: "We collect customer details strictly to fulfill shipments and secure checkout. We never lease or sell user credentials to advertising networks.",
        termsConditions: "By completing a checkout, customers agree to receive status notifications via SMS and email. All products remain Fatafat property until settled.",
        warrantyPolicy: "Official manufacturer warranty applies where specified. Fatafat offers a 3-day troubleshooting assistance period.",
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = (e) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Customer-facing store policies updated successfully!");
        }, 800);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Store Policies</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Establish clear terms and logistical standards for your retail storefront</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button onClick={handleSave} disabled={isSaving} icon={Save}>
                        {isSaving ? "Saving..." : "Save Policies"}
                    </Button>
                </div>
            </div>

            {/* Grid Layout of Policies */}
            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. Return Policy */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <Undo2 size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Return & Exchange Policy</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.returnPolicy}
                        onChange={(e) => setPolicies({ ...policies, returnPolicy: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Define conditions for returns or refunds..."
                    />
                </div>

                {/* 2. Shipping Policy */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <Truck size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Shipping & Dispatch Schedule</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.shippingPolicy}
                        onChange={(e) => setPolicies({ ...policies, shippingPolicy: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Outline shipment courier speeds, delivery areas..."
                    />
                </div>

                {/* 3. COD Policy */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <Banknote size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Cash on Delivery (COD) Rules</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.codPolicy}
                        onChange={(e) => setPolicies({ ...policies, codPolicy: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Provide details on cash validation and limits..."
                    />
                </div>

                {/* 4. Privacy Policy */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <ShieldAlert size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Privacy & Security Protocols</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.privacyPolicy}
                        onChange={(e) => setPolicies({ ...policies, privacyPolicy: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Detail user data encryption and privacy parameters..."
                    />
                </div>

                {/* 5. Terms & Conditions */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <Scale size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Terms & Service Clauses</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.termsConditions}
                        onChange={(e) => setPolicies({ ...policies, termsConditions: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Detail legal checkouts and purchase compliance..."
                    />
                </div>

                {/* 6. Warranty Policy */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                            <ShieldCheck size={18} />
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">Warranty & Repair Guarantee</h3>
                    </div>
                    <textarea
                        required
                        rows={4}
                        value={policies.warrantyPolicy}
                        onChange={(e) => setPolicies({ ...policies, warrantyPolicy: e.target.value })}
                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] placeholder-[#B8A68A] shadow-sm hover:shadow-md focus:outline-none focus:ring-1 focus:ring-[#0a4019]/20"
                        placeholder="Define item defect parameters and support warranties..."
                    />
                </div>
            </form>
        </div>
    );
}
