"use client";

import React, { useState } from "react";
import { ReceiptText, Download, Calendar, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function InvoicesPage() {
    const [invoices] = useState([
        { id: "INV-2026-005", date: "2026-05-31", amount: "PKR 2,500", status: "Paid" },
        { id: "INV-2026-004", date: "2026-04-30", amount: "PKR 4,200", status: "Paid" },
        { id: "INV-2026-003", date: "2026-03-31", amount: "PKR 5,800", status: "Paid" },
        { id: "INV-2026-002", date: "2026-02-28", amount: "PKR 3,500", status: "Paid" },
        { id: "INV-2026-001", date: "2026-01-31", amount: "PKR 2,500", status: "Paid" }
    ]);

    const handleDownload = (id) => {
        toast.loading(`Formulating invoice PDF ${id}...`, { id: "invoice-dl" });
        setTimeout(() => {
            toast.success(`Invoice PDF ${id} downloaded successfully!`, { id: "invoice-dl" });
        }, 1000);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Store Invoices</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Review and download tax-compliant platform subscription and payout invoices</p>
                </div>
            </div>

            {/* Invoices Table Card */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Invoice ID</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Billing Date</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Amount Invoiced</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Settlement</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Download</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {invoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                                <ReceiptText size={16} />
                                            </div>
                                            <span className="text-sm font-bold text-[#0a4019]">{inv.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium flex items-center gap-1.5 pt-6">
                                        <Calendar size={12} className="text-[#B8A68A]" />
                                        <span>{inv.date}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-bold text-[#0a4019]">
                                        {inv.amount}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-max">
                                            <CheckCircle size={10} />
                                            {inv.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => handleDownload(inv.id)}
                                            className="p-2.5 bg-[#d3d3d3]/20 border border-[#d3d3d3]/15 text-[#0a4019] rounded-xl hover:bg-[#0a4019] hover:text-white transition-all inline-flex items-center justify-center"
                                            title="Download Invoice PDF"
                                        >
                                            <Download size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
