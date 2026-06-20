"use client";

import { X } from "lucide-react";

export function SellerPageScaffold({ title, description, actions, children }) {
    return (
        <div className="seller-page space-y-6 pb-12">
            <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-[#0F172A]">{title}</h1>
                    {description && <p className="mt-1.5 max-w-2xl text-sm font-medium text-[#64748B]">{description}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
            </div>
            {children}
        </div>
    );
}

export function Card({ children, className = "" }) {
    return <div className={`rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function PageToolbar({ children, className = "" }) {
    return <div className={`flex flex-col gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between ${className}`}>{children}</div>;
}

export function StatCard({ label, value, icon: Icon, tone = "blue", helper }) {
    const tones = {
        blue: "bg-[#E8F3FF] text-[#1E8AF7]",
        green: "bg-[#DCFCE7] text-[#16A34A]",
        amber: "bg-[#FEF3C7] text-[#D97706]",
        red: "bg-[#FEE2E2] text-[#DC2626]",
    };
    return (
        <Card className="flex items-center gap-4 p-4">
            {Icon && <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone] || tones.blue}`}><Icon size={20} /></span>}
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#64748B]">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#0F172A]">{value}</p>
                {helper && <p className="mt-0.5 text-xs font-medium text-[#64748B]">{helper}</p>}
            </div>
        </Card>
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="rounded-2xl border border-dashed border-[#CBD5E1] bg-white px-6 py-16 text-center">
            {Icon && <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F3FF] text-[#1E8AF7]"><Icon size={22} /></span>}
            <h3 className="mt-4 text-base font-black text-[#0F172A]">{title}</h3>
            {description && <p className="mx-auto mt-1 max-w-md text-sm font-medium text-[#64748B]">{description}</p>}
            {action && <div className="mt-5 flex justify-center">{action}</div>}
        </div>
    );
}

export function ModalShell({ open, onClose, title, description, children, footer, size = "md" }) {
    if (!open) return null;
    const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-5xl" };
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A]/45 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}>
            <div className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl ${widths[size] || widths.md}`}>
                <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4">
                    <div><h2 className="text-lg font-black text-[#0F172A]">{title}</h2>{description && <p className="mt-1 text-sm text-[#64748B]">{description}</p>}</div>
                    <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FBFF] hover:text-[#0F172A]" aria-label="Close"><X size={17} /></button>
                </div>
                <div className="overflow-y-auto p-5">{children}</div>
                {footer && <div className="flex justify-end gap-2 border-t border-[#E2E8F0] bg-[#F8FBFF] px-5 py-4">{footer}</div>}
            </div>
        </div>
    );
}

export function PrimaryButton({ children, onClick, type = "button" }) {
    return <button type={type} onClick={onClick} className="rounded-xl bg-[#1E8AF7] px-4 py-3 text-sm font-bold text-white hover:bg-[#0F74D8]">{children}</button>;
}

export function SecondaryButton({ children, onClick, type = "button" }) {
    return <button type={type} onClick={onClick} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7]">{children}</button>;
}
