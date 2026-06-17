"use client";

export function SellerPageScaffold({ title, description, actions, children }) {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#0F172A]">{title}</h1>
                    {description && <p className="mt-2 text-sm text-[#64748B]">{description}</p>}
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

export function PrimaryButton({ children, onClick, type = "button" }) {
    return <button type={type} onClick={onClick} className="rounded-xl bg-[#1E8AF7] px-4 py-3 text-sm font-bold text-white hover:bg-[#0F74D8]">{children}</button>;
}

export function SecondaryButton({ children, onClick, type = "button" }) {
    return <button type={type} onClick={onClick} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7]">{children}</button>;
}
