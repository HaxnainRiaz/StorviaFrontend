"use client";

import React, { useState } from "react";
import { Button, Input } from "@/components/ui";
import { Wallet, DollarSign, Calendar, ArrowUpRight, ArrowDownLeft, X, ShieldAlert, CreditCard } from "lucide-react";
import toast from "react-hot-toast";

export default function WalletPage() {
    const [pendingFee, setPendingFee] = useState(4500);
    const [paidFee, setPaidFee] = useState(32000);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [selectedTx, setSelectedTx] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("card");

    const creditLimit = 50000;
    const restrictionStatus = pendingFee > 4000 ? "WARNING: Restricting soon" : "CLEAR";

    const [transactions, setTransactions] = useState([
        { id: "TX10023", date: "2026-05-28", desc: "Weekly Commission settlement", amount: "PKR -4,200", type: "debit" },
        { id: "TX10022", date: "2026-05-21", desc: "Customs Clearance Fee payment", amount: "PKR -1,500", type: "debit" },
        { id: "TX10021", date: "2026-05-15", desc: "Subscription Fee Renewal", amount: "PKR -2,500", type: "debit" },
        { id: "TX10020", date: "2026-05-08", desc: "Customer Refund Settle", amount: "PKR +4,200", type: "credit" }
    ]);

    const handlePayFeeSubmit = (e) => {
        e.preventDefault();
        toast.success(`Processing settlement through ${paymentMethod.toUpperCase()}...`);
        setTimeout(() => {
            setPaidFee(prev => prev + pendingFee);
            setPendingFee(0);
            setIsPayOpen(false);
            const settlementTx = {
                id: "TX" + Math.floor(10000 + Math.random() * 90000),
                date: new Date().toISOString().slice(0, 10),
                desc: "Platform Fee Settlement",
                amount: `PKR -${pendingFee}`,
                type: "debit"
            };
            setTransactions([settlementTx, ...transactions]);
            toast.success("Platform fee settled successfully!");
        }, 1200);
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Store Wallet</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Review pending service charges, credit caps, and payouts</p>
                </div>
                {pendingFee > 0 && (
                    <Button onClick={() => setIsPayOpen(true)} icon={Wallet}>
                        Pay Pending Fee
                    </Button>
                )}
            </div>

            {/* Wallet metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* 1. Pending Fee */}
                <div className={`p-6 rounded-[2rem] border relative overflow-hidden flex flex-col justify-between min-h-[140px] bg-white ${
                    pendingFee > 0 ? "border-red-200 shadow-md shadow-red-50" : "border-[#F5F3F0] shadow-sm"
                }`}>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Pending Platform Fee</span>
                        <span className={`text-2xl font-heading font-bold italic mt-1 block ${pendingFee > 0 ? "text-red-600" : "text-[#0a4019]"}`}>
                            PKR {pendingFee.toLocaleString()}
                        </span>
                    </div>
                    {pendingFee > 0 && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-red-600 uppercase tracking-widest bg-red-50 py-1 px-3 rounded-full w-max border border-red-100">
                            <ShieldAlert size={10} />
                            <span>Action Required</span>
                        </div>
                    )}
                </div>

                {/* 2. Paid Fee */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Total Settle Fees</span>
                        <span className="text-2xl font-heading font-bold text-[#0a4019] italic mt-1 block">
                            PKR {paidFee.toLocaleString()}
                        </span>
                    </div>
                    <span className="text-[9px] text-[#6B6B6B] font-bold uppercase tracking-wider block">Cumulative Ledger</span>
                </div>

                {/* 3. Credit Limit */}
                <div className="bg-white p-6 rounded-[2rem] border border-[#F5F3F0] shadow-sm flex flex-col justify-between min-h-[140px]">
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Store Credit Limit</span>
                        <span className="text-2xl font-heading font-bold text-[#0a4019] italic mt-1 block">
                            PKR {creditLimit.toLocaleString()}
                        </span>
                    </div>
                    <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Remaining cap: PKR {(creditLimit - pendingFee).toLocaleString()}</span>
                </div>

                {/* 4. Wallet restriction status */}
                <div className={`p-6 rounded-[2rem] border flex flex-col justify-between min-h-[140px] bg-white ${
                    pendingFee > 4000 ? "border-amber-200 shadow-md shadow-amber-50" : "border-[#F5F3F0] shadow-sm"
                }`}>
                    <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Restrictions Status</span>
                        <span className={`text-base font-bold italic mt-2 block ${pendingFee > 4000 ? "text-amber-700" : "text-emerald-700"}`}>
                            {pendingFee > 4000 ? "WARNING: LIMIT NEAR" : "CLEAR & SECURE"}
                        </span>
                    </div>
                    <p className="text-[8px] text-[#6B6B6B] font-medium leading-normal">
                        * Stores with unpaid fees above credit caps will encounter temporary checkout freezes.
                    </p>
                </div>
            </div>

            {/* Transactions Log Section */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="px-8 py-5 border-b border-[#F5F3F0] flex items-center justify-between">
                    <h3 className="text-xl font-heading font-bold text-[#0a4019] italic">Recent Ledger Logs</h3>
                    <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Store billing history</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Transaction ID</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Logged Date</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Description</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Delta Amount</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="px-8 py-5 text-sm font-bold text-[#0a4019]">
                                        {tx.id}
                                    </td>
                                    <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium flex items-center gap-1.5 pt-6">
                                        <Calendar size={12} className="text-[#B8A68A]" />
                                        <span>{tx.date}</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm font-medium text-[#6B6B6B]">
                                        {tx.desc}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`text-xs font-bold flex items-center gap-1 ${
                                            tx.type === "credit" ? "text-emerald-700" : "text-red-700"
                                        }`}>
                                            {tx.type === "credit" ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                                            {tx.amount}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <button
                                            onClick={() => setSelectedTx(tx)}
                                            className="px-3.5 py-1.5 bg-[#d3d3d3]/20 border border-[#d3d3d3]/15 text-[#0a4019] text-[10px] font-bold rounded-full uppercase tracking-wider hover:bg-[#0a4019] hover:text-white transition-all"
                                        >
                                            View Logs
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {isPayOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">Settle Platform Fee</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Platform service clearance</p>
                            </div>
                            <button onClick={() => setIsPayOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handlePayFeeSubmit} className="space-y-6">
                            <div className="p-6 bg-[#051712] rounded-3xl text-center text-white relative overflow-hidden">
                                <span className="text-[10px] text-[#F5F3F0]/65 uppercase tracking-widest block font-bold mb-1">Due Settlement Balance</span>
                                <span className="text-3xl font-heading font-bold text-emerald-400 italic">PKR {pendingFee.toLocaleString()}</span>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] ml-1">Payment Method</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("card")}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                            paymentMethod === "card"
                                                ? "border-[#0a4019] bg-[#0a4019]/5 text-[#0a4019]"
                                                : "border-[#F5F3F0] hover:border-neutral-300"
                                        }`}
                                    >
                                        <CreditCard size={20} />
                                        <span className="text-xs font-bold">Credit/Debit Card</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("wallet")}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                            paymentMethod === "wallet"
                                                ? "border-[#0a4019] bg-[#0a4019]/5 text-[#0a4019]"
                                                : "border-[#F5F3F0] hover:border-neutral-300"
                                        }`}
                                    >
                                        <Wallet size={20} />
                                        <span className="text-xs font-bold">JazzCash / EasyPaisa</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setIsPayOpen(false)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    Confirm Settlement
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Transaction Logs details modal */}
            {selectedTx && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">Ledger Log Sheet</h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Audit proof transaction specifics</p>
                            </div>
                            <button onClick={() => setSelectedTx(null)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6 text-sm">
                            <div className="flex justify-between items-center py-2.5 border-b border-[#F5F3F0]">
                                <span className="text-[#6B6B6B] font-bold">Log Record ID:</span>
                                <span className="font-bold text-[#0a4019]">{selectedTx.id}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-[#F5F3F0]">
                                <span className="text-[#6B6B6B] font-bold">Logged Date:</span>
                                <span className="font-bold text-[#0a4019]">{selectedTx.date}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5 border-b border-[#F5F3F0]">
                                <span className="text-[#6B6B6B] font-bold">Event Description:</span>
                                <span className="font-bold text-[#0a4019]">{selectedTx.desc}</span>
                            </div>
                            <div className="flex justify-between items-center py-2.5">
                                <span className="text-[#6B6B6B] font-bold">Delta Amount:</span>
                                <span className={`font-bold ${selectedTx.type === "credit" ? "text-emerald-700" : "text-red-700"}`}>
                                    {selectedTx.amount}
                                </span>
                            </div>

                            <div className="pt-6">
                                <Button onClick={() => setSelectedTx(null)} className="w-full">
                                    Dismiss Record
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
