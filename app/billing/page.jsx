"use client";

import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { CreditCard, Award, Percent, Calendar, ShieldCheck, X } from "lucide-react";
import toast from "react-hot-toast";

export default function BillingPage() {
    const [billing, setBilling] = useState({
        plan: "Fatafat Growth Tier",
        cycle: "Monthly Subscription",
        commissionRate: "3.5%",
        nextBilling: "2026-06-30",
        paymentMethod: "Visa ending in 8899",
        cardName: "Fatafat Gourmet Enterprise",
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [cardDetails, setCardDetails] = useState({ number: "4242 8899 1234 5678", expiry: "12/29", cvc: "123" });

    const handleUpdateBilling = (e) => {
        e.preventDefault();
        const lastFour = cardDetails.number.replace(/\s/g, "").slice(-4);
        setBilling({
            ...billing,
            paymentMethod: `Visa ending in ${lastFour}`
        });
        setIsModalOpen(false);
        toast.success("Billing credentials and card details updated!");
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Billing Overview</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Configure subscription plans, platform commissions, and payment coordinates</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} icon={CreditCard}>
                    Update Billing Info
                </Button>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Plan Card */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.06)] flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Active Subscription tier</span>
                            <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                <Award size={16} />
                            </div>
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-[#0a4019] italic">{billing.plan}</h3>
                        <p className="text-xs text-[#6B6B6B] mt-2 font-medium">Bespoke store features, unlimited catalog products, and dedicated logistics hooks.</p>
                    </div>
                    <div className="pt-4 border-t border-[#F5F3F0] text-xs font-bold text-[#0a4019] flex justify-between">
                        <span>Cycle: {billing.cycle}</span>
                        <span className="text-emerald-700">ACTIVE</span>
                    </div>
                </div>

                {/* Commission rate card */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.06)] flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Platform Take rate</span>
                            <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                <Percent size={16} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">{billing.commissionRate}</h3>
                        <p className="text-xs text-[#6B6B6B] mt-2 font-medium">Charged strictly per successful shipment checkout. Zero fixed maintenance surcharges apply.</p>
                    </div>
                    <span className="text-[10px] text-neutral-400 font-bold block uppercase tracking-wider">Standard Fatafat seller hook</span>
                </div>

                {/* Payment card */}
                <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.06)] flex flex-col justify-between min-h-[220px]">
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Payment Instrument</span>
                            <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                <CreditCard size={16} />
                            </div>
                        </div>
                        <h3 className="text-lg font-heading font-bold text-[#0a4019] italic">{billing.paymentMethod}</h3>
                        <p className="text-xs text-[#6B6B6B] mt-1 font-medium">Owner: {billing.cardName}</p>
                    </div>
                    <div className="pt-4 border-t border-[#F5F3F0] text-xs font-bold text-[#6B6B6B] flex items-center gap-1.5">
                        <Calendar size={12} className="text-[#B8A68A]" />
                        <span>Next billing date: {billing.nextBilling}</span>
                    </div>
                </div>
            </div>

            {/* Invoices Breakdown Table Card */}
            <div className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#F5F3F0]">
                    <h3 className="text-xl font-heading font-bold text-[#0a4019] italic">Billing Ledger Breakdown</h3>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Pricing specifics</span>
                </div>
                
                <div className="space-y-4 max-w-xl text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                        <span className="text-[#6B6B6B] font-medium">Base Subscription Fee</span>
                        <span className="font-bold text-[#0a4019]">PKR 2,500 / month</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                        <span className="text-[#6B6B6B] font-medium">PostEx Logistics Hook Surcharge</span>
                        <span className="font-bold text-[#0a4019]">PKR 0 (Included)</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                        <span className="text-[#6B6B6B] font-medium">Platform Referral Commission</span>
                        <span className="font-bold text-[#0a4019]">3.5% per item sold</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-[#6B6B6B] font-bold">Encrypted Compliance</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck size={14} /> PCI-DSS Secure
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">Update Card Credentials</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">PCI Compliant Secured Tunnel</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateBilling} className="space-y-6">
                            <Input
                                label="Card Number *"
                                required
                                value={cardDetails.number}
                                onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                placeholder="xxxx xxxx xxxx xxxx"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Expiry Code *"
                                    required
                                    value={cardDetails.expiry}
                                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                    placeholder="MM/YY"
                                />
                                <Input
                                    label="CVC Security *"
                                    required
                                    type="password"
                                    value={cardDetails.cvc}
                                    onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                    placeholder="•••"
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Update Card
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
