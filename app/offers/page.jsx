"use client";

import React, { useState } from "react";
import { Button, Input, SearchBar } from "@/components/ui";
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, X, BadgePercent, Gift, Calendar } from "lucide-react";
import toast from "react-hot-toast";

export default function OffersPage() {
    const [offers, setOffers] = useState([
        { id: 1, title: "Summer Harvest Bonanza", type: "Percentage", value: "15%", start: "2026-06-01", end: "2026-06-30", active: true },
        { id: 2, title: "First Customer Treat", type: "Fixed Amount", value: "PKR 500", start: "2026-05-15", end: "2026-12-31", active: true },
        { id: 3, title: "Elixir BOGO Trial", type: "Buy One Get One", value: "Free Product", start: "2026-06-10", end: "2026-06-15", active: false },
        { id: 4, title: "Organic Wholesale Bulk", type: "Percentage", value: "25%", start: "2026-06-05", end: "2026-06-25", active: true },
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [formData, setFormData] = useState({ id: null, title: "", type: "Percentage", value: "", start: "", end: "" });

    const handleToggleActive = (id) => {
        setOffers(offers.map(off => {
            if (off.id === id) {
                const newStatus = !off.active;
                toast.success(newStatus ? "Offer activated successfully!" : "Offer disabled successfully!");
                return { ...off, active: newStatus };
            }
            return off;
        }));
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to retire this promotional offer?")) {
            setOffers(offers.filter(off => off.id !== id));
            toast.success("Promo offer removed");
        }
    };

    const handleOpenCreate = () => {
        setModalMode("create");
        setFormData({ id: null, title: "", type: "Percentage", value: "", start: "", end: "" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (offer) => {
        setModalMode("edit");
        setFormData({
            id: offer.id,
            title: offer.title,
            type: offer.type,
            value: offer.value,
            start: offer.start,
            end: offer.end
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (modalMode === "create") {
            const newOffer = {
                id: Date.now(),
                title: formData.title,
                type: formData.type,
                value: formData.value,
                start: formData.start || new Date().toISOString().slice(0, 10),
                end: formData.end || new Date(Date.now() + 30*24*60*60*1000).toISOString().slice(0, 10),
                active: true
            };
            setOffers([newOffer, ...offers]);
            toast.success("Promotional offer forged and active!");
        } else {
            setOffers(offers.map(o => o.id === formData.id ? { ...o, title: formData.title, type: formData.type, value: formData.value, start: formData.start, end: formData.end } : o));
            toast.success("Promotional offer updated!");
        }
        setIsModalOpen(false);
    };

    const filteredOffers = offers.filter(off =>
        off.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        off.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Store Offers</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Configure and monitor platform promotional discount tiers</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchBar
                        placeholder="Filter promotions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 md:w-64"
                    />
                    <Button onClick={handleOpenCreate} icon={Plus}>
                        Create Offer
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Promo Name</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Offer Model</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Discount Value</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Valid Duration</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {filteredOffers.length > 0 ? (
                                filteredOffers.map((off) => (
                                    <tr key={off.id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                                    <BadgePercent size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-[#0a4019]">{off.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                            {off.type}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-sm font-bold text-[#0a4019] bg-[#d3d3d3]/20 px-3 py-1 rounded-full">
                                                {off.value}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-1.5 text-xs text-[#6B6B6B] font-medium">
                                                <Calendar size={12} className="text-[#B8A68A]" />
                                                <span>{off.start} ~ {off.end}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                                off.active
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-red-50 text-red-700 border-red-100"
                                            }`}>
                                                {off.active ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleActive(off.id)}
                                                    className="p-2 text-neutral-400 hover:text-[#0a4019] transition-colors"
                                                    title={off.active ? "Disable Offer" : "Enable Offer"}
                                                >
                                                    {off.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(off)}
                                                    className="p-2 text-neutral-400 hover:text-[#0a4019] transition-colors"
                                                    title="Modify Promotion"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(off.id)}
                                                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                                                    title="Delete Promotion"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="py-24 text-center">
                                        <Gift className="mx-auto text-neutral-200 mb-4" size={48} />
                                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">No Promotions Defined</h3>
                                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">Click Create Offer to launch store wide deals.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">
                                    {modalMode === "create" ? "Forge Promo Offer" : "Modify Promo Details"}
                                </h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Expanding Sales Incentives</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Offer Campaign Name *"
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g. Eid Mubarak Special"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Discount Model</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-6 py-4 bg-white border border-[#F5F3F0] rounded-2xl text-sm font-medium text-[#0a4019] focus:outline-none"
                                    >
                                        <option value="Percentage">Percentage (%)</option>
                                        <option value="Fixed Amount">Fixed Amount (PKR)</option>
                                        <option value="Buy One Get One">Buy 1 Get 1 (BOGO)</option>
                                    </select>
                                </div>
                                <Input
                                    label="Discount Value *"
                                    required
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    placeholder="e.g. 15% or 500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Launch Date"
                                    type="date"
                                    value={formData.start}
                                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                                />
                                <Input
                                    label="Expiry Date"
                                    type="date"
                                    value={formData.end}
                                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                                />
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {modalMode === "create" ? "Forge Offer" : "Update Offer"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
