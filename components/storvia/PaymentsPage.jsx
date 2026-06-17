"use client";

import { useEffect, useState } from "react";
import { useAdmin } from "@/context/AdminContext";
import { Card, PrimaryButton, SellerPageScaffold } from "./SellerPageScaffold";

export default function PaymentsPage() {
    const { adminRequest } = useAdmin();
    const [settings, setSettings] = useState({ codEnabled: true, bankTransferEnabled: false, jazzCashEnabled: false, easypaisaEnabled: false, instructions: "", payoutAccount: "" });

    useEffect(() => {
        adminRequest("/seller/payments/settings").then(res => {
            if (res?.success) setSettings(prev => ({ ...prev, ...(res.data || {}) }));
        });
    }, [adminRequest]);

    const save = () => adminRequest("/seller/payments/settings", "PATCH", settings);

    return (
        <SellerPageScaffold title="Payments" description="Manage payment methods, payout account, instructions, tax, and invoice settings." actions={<PrimaryButton onClick={save}>Save payments</PrimaryButton>}>
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <h2 className="text-lg font-black text-[#0F172A]">Payment Methods</h2>
                    <div className="mt-4 space-y-3">
                        {["codEnabled", "bankTransferEnabled", "jazzCashEnabled", "easypaisaEnabled"].map(key => (
                            <label key={key} className="flex items-center justify-between rounded-xl border border-[#E2E8F0] p-3 text-sm font-bold text-[#0F172A]">
                                {key.replace("Enabled", "").replace(/([A-Z])/g, " $1")}
                                <input type="checkbox" checked={Boolean(settings[key])} onChange={event => setSettings(prev => ({ ...prev, [key]: event.target.checked }))} />
                            </label>
                        ))}
                    </div>
                </Card>
                <Card>
                    <h2 className="text-lg font-black text-[#0F172A]">Payout and Instructions</h2>
                    <textarea value={settings.instructions || ""} onChange={event => setSettings(prev => ({ ...prev, instructions: event.target.value }))} className="mt-4 h-32 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4 text-sm font-semibold outline-none focus:border-[#1E8AF7]" placeholder="Payment instructions for customers" />
                    <input value={settings.payoutAccount || ""} onChange={event => setSettings(prev => ({ ...prev, payoutAccount: event.target.value }))} className="mt-3 h-12 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] px-4 text-sm font-semibold outline-none focus:border-[#1E8AF7]" placeholder="Payout account details" />
                </Card>
            </div>
        </SellerPageScaffold>
    );
}
