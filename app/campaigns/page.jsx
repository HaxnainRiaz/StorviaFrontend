"use client";

import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Plus, Megaphone, Calendar, DollarSign, BarChart2, Users, Eye, X, Award } from "lucide-react";
import toast from "react-hot-toast";
import MarketingSubNav from "@/components/admin/MarketingSubNav";

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([
        {
            id: 1,
            name: "Eid Elixir Buzz",
            channel: "Instagram Ads",
            budget: "PKR 15,000",
            status: "Active",
            start: "2026-06-01",
            end: "2026-06-15",
            reach: "18.4K users",
            conversions: "450 orders",
            ctr: "3.4%"
        },
        {
            id: 2,
            name: "Organic Gourmet Reach",
            channel: "Facebook Paid Ads",
            budget: "PKR 25,000",
            status: "Active",
            start: "2026-06-03",
            end: "2026-06-25",
            reach: "12.2K users",
            conversions: "280 orders",
            ctr: "2.8%"
        },
        {
            id: 3,
            name: "Gourmet Newsletter Push",
            channel: "Email & SMS Marketing",
            budget: "PKR 5,000",
            status: "Closed",
            start: "2026-05-10",
            end: "2026-05-15",
            reach: "4.5K emails",
            conversions: "180 orders",
            ctr: "12.5%"
        },
    ]);

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [newCampaign, setNewCampaign] = useState({ name: "", channel: "Instagram Ads", budget: "", start: "", end: "" });

    const handleCreate = (e) => {
        e.preventDefault();
        const created = {
            id: Date.now(),
            name: newCampaign.name,
            channel: newCampaign.channel,
            budget: `PKR ${parseFloat(newCampaign.budget || 0).toLocaleString()}`,
            status: "Active",
            start: newCampaign.start || new Date().toISOString().slice(0, 10),
            end: newCampaign.end || new Date(Date.now() + 10*24*60*60*1000).toISOString().slice(0, 10),
            reach: "0 users",
            conversions: "0 orders",
            ctr: "0%"
        };
        setCampaigns([created, ...campaigns]);
        setIsCreateOpen(false);
        setNewCampaign({ name: "", channel: "Instagram Ads", budget: "", start: "", end: "" });
        toast.success("Marketing campaign authorized and active!");
    };

    const handleViewDetails = (camp) => {
        setSelectedCampaign(camp);
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <MarketingSubNav />
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Ad Campaigns</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Deploy, monitor, and evaluate retail outreach advertising campaigns</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} icon={Plus}>
                    Create Campaign
                </Button>
            </div>

            {/* Overall stats counters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Combined Budget Allocated</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">PKR 45,000</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <Users size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Aggregated Audience Reach</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">35,100 users</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.04)] flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                        <Award size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Customer Conversions</span>
                        <span className="text-lg font-heading font-bold text-[#0a4019] italic">910 checkouts</span>
                    </div>
                </div>
            </div>

            {/* Grid of Campaign Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {campaigns.map((camp) => (
                    <div
                        key={camp.id}
                        className="bg-white p-8 rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.06)] hover:shadow-[0_16px_60px_rgba(11,47,38,0.12)] transition-all duration-500 group relative overflow-hidden flex flex-col justify-between min-h-[350px]"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 bg-[#FDFCFB]/50 rounded-full -mr-10 -mt-10 group-hover:bg-[#d3d3d3]/10 transition-colors" />

                        {/* Card Upper */}
                        <div>
                            <div className="flex items-center justify-between mb-6 relative">
                                <div className="w-12 h-12 rounded-2xl bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                    <Megaphone size={20} />
                                </div>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                    camp.status === "Active"
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                        : "bg-neutral-50 text-neutral-500 border-neutral-200"
                                }`}>
                                    {camp.status.toUpperCase()}
                                </span>
                            </div>

                            <h3 className="text-xl font-heading font-bold text-[#0a4019] mb-1 italic">{camp.name}</h3>
                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{camp.channel}</span>

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Budget Cap:</span>
                                    <span className="font-bold text-[#0a4019]">{camp.budget}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">Campaign Span:</span>
                                    <span className="font-medium text-[#6B6B6B] flex items-center gap-1">
                                        <Calendar size={10} /> {camp.start} ~ {camp.end}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Card Lower / Stats Summary */}
                        <div className="mt-8 pt-6 border-t border-[#F5F3F0]/80 flex items-center justify-between">
                            <div>
                                <span className="text-[9px] text-neutral-400 block font-bold uppercase tracking-wider">Campaign CTR</span>
                                <span className="text-sm font-bold text-[#0a4019]">{camp.ctr}</span>
                            </div>
                            <Button onClick={() => handleViewDetails(camp)} variant="ghost" className="px-4 py-2" icon={Eye}>
                                Details
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Campaign Creation Modal */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">Deploy Ad Campaign</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Expanding Platform Reach</p>
                            </div>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-6">
                            <Input
                                label="Campaign Name *"
                                required
                                value={newCampaign.name}
                                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                placeholder="e.g. Spring Nectar Push"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Traffic Channel</label>
                                    <select
                                        value={newCampaign.channel}
                                        onChange={(e) => setNewCampaign({ ...newCampaign, channel: e.target.value })}
                                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none"
                                    >
                                        <option value="Instagram Ads">Instagram Premium Ads</option>
                                        <option value="Facebook Paid Ads">Facebook Paid Ads</option>
                                        <option value="Email & SMS Marketing">Email & SMS Blast</option>
                                        <option value="Google Search PPC">Google Search PPC</option>
                                    </select>
                                </div>
                                <Input
                                    label="Budget (PKR) *"
                                    type="number"
                                    required
                                    value={newCampaign.budget}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, budget: e.target.value })}
                                    placeholder="e.g. 15000"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Launch Date"
                                    type="date"
                                    value={newCampaign.start}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, start: e.target.value })}
                                />
                                <Input
                                    label="Termination Date"
                                    type="date"
                                    value={newCampaign.end}
                                    onChange={(e) => setNewCampaign({ ...newCampaign, end: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setIsCreateOpen(false)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Deploy Campaign
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Campaign Details Modal */}
            {selectedCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">{selectedCampaign.name}</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Comprehensive Campaign Performance</p>
                            </div>
                            <button onClick={() => setSelectedCampaign(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-6 bg-[#F5F3F0]/30 rounded-2xl border border-[#F5F3F0] grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <span className="text-[8px] text-neutral-400 block font-bold uppercase tracking-wider mb-1">CTR Rate</span>
                                    <span className="text-lg font-heading font-bold text-[#0a4019]">{selectedCampaign.ctr}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] text-neutral-400 block font-bold uppercase tracking-wider mb-1">Audience Reach</span>
                                    <span className="text-lg font-heading font-bold text-[#0a4019]">{selectedCampaign.reach.split(" ")[0]}</span>
                                </div>
                                <div>
                                    <span className="text-[8px] text-neutral-400 block font-bold uppercase tracking-wider mb-1">Sales Orders</span>
                                    <span className="text-lg font-heading font-bold text-[#0a4019]">{selectedCampaign.conversions.split(" ")[0]}</span>
                                </div>
                            </div>

                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                                    <span className="text-[#6B6B6B] font-bold">Marketing Channel:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedCampaign.channel}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                                    <span className="text-[#6B6B6B] font-bold">Allocated Budget:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedCampaign.budget}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-[#F5F3F0]">
                                    <span className="text-[#6B6B6B] font-bold">Start Date:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedCampaign.start}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-[#6B6B6B] font-bold">Expiry Date:</span>
                                    <span className="font-bold text-[#0a4019]">{selectedCampaign.end}</span>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button onClick={() => setSelectedCampaign(null)} className="w-full">
                                    Dismiss Review
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
