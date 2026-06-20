"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
    ArrowLeft, ArrowRight, Check, CheckCircle2, Eye, Upload,
    Loader2, Package, Rocket, Store, Truck, Wallet, Shield,
    AlertTriangle, X, RefreshCw, Map, ShoppingBag, Search,
    FileText, Globe, Monitor, Tablet, Smartphone, ChevronRight,
    Info, Link2, Navigation, Image as ImageIcon, Palette
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { buildStoreUrl } from "@/lib/storeUrl";

// ─── Step definitions ────────────────────────────────────────────────────────
const steps = [
    { key: "store_identity",      label: "Store Identity",     description: "Name, URL, business type",        icon: Store },
    { key: "design_source",       label: "Import Design",      description: "Upload your store design package", icon: Upload },
    { key: "design_validation",   label: "Validate Design",    description: "Safety & compatibility check",    icon: Shield },
    { key: "sandbox_preview",     label: "Preview Design",     description: "Review before converting",        icon: Eye },
    { key: "design_mapping",      label: "Map Areas",          description: "Link design to commerce zones",   icon: Map },
    { key: "commerce_connection", label: "Connect Products",   description: "Attach products & collections",   icon: ShoppingBag },
    { key: "business_settings",   label: "Business Settings",  description: "Shipping, payments & policies",   icon: Wallet },
    { key: "seo_and_tracking",    label: "SEO & Tracking",     description: "Meta, SEO, social preview",       icon: Search },
    { key: "final_preview",       label: "Final Preview",      description: "Full rendered storefront check",  icon: Monitor },
    { key: "publish",             label: "Publish",            description: "Launch your managed store",       icon: Rocket },
];

const SETUP_PHASES = [
    { label: "Basics", description: "Store identity", start: 0, end: 0, icon: Store },
    { label: "Design", description: "Import and prepare", start: 1, end: 5, icon: Palette },
    { label: "Operations", description: "Delivery and discovery", start: 6, end: 7, icon: Truck },
    { label: "Launch", description: "Review and publish", start: 8, end: 9, icon: Rocket },
];

const REQUIRED_STEPS = ["store_identity", "business_settings"];
const slugify = (v) => String(v || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const MAPPING_TARGETS = ["Header", "Logo", "Navigation", "Hero", "ProductGrid", "FeaturedProducts", "CollectionLinks", "CartButton", "SearchButton", "Footer", "ContactSection", "PolicyLinks"];

// ─── Small reusable UI primitives ─────────────────────────────────────────────
function Field({ label, helper, error, children }) {
    return (
        <label className="block">
            <span className="text-xs font-black text-[#0F172A]">{label}</span>
            {helper && <span className="mt-1 block text-[11px] font-semibold leading-4 text-[#64748B]">{helper}</span>}
            <div className="mt-1.5">{children}</div>
            {error && <p className="mt-1.5 text-[11px] font-bold text-[#DC2626]">{error}</p>}
        </label>
    );
}

function TI({ ...props }) {
    return <input {...props} className={`h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#1E8AF7] focus:bg-white ${props.className || ""}`} />;
}

function TA({ ...props }) {
    return <textarea {...props} className={`min-h-20 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] p-3 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#1E8AF7] focus:bg-white ${props.className || ""}`} />;
}

function ToggleCard({ checked, title, description, onChange, children }) {
    return (
        <button type="button" onClick={() => onChange(!checked)} className={`min-w-0 rounded-xl border p-3 text-left transition ${checked ? "border-[#1E8AF7] bg-[#EFF6FF]" : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="break-words text-xs font-black leading-4 text-[#0F172A]">{title}</p>
                    {description && <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#64748B]">{description}</p>}
                </div>
                <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-[#1E8AF7]" : "bg-[#CBD5E1]"}`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition ${checked ? "left-5" : "left-1"}`} />
                </span>
            </div>
            {checked && children && <div className="mt-3">{children}</div>}
        </button>
    );
}

function SelectCard({ active, title, description, onClick }) {
    return (
        <button type="button" onClick={onClick} className={`min-w-0 rounded-xl border p-3 text-left transition ${active ? "border-[#1E8AF7] bg-[#E8F3FF] shadow-sm" : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"}`}>
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="break-words text-xs font-black leading-4 text-[#0F172A]">{title}</p>
                    {description && <p className="mt-1 break-words text-[11px] font-semibold leading-4 text-[#64748B]">{description}</p>}
                </div>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#1E8AF7]" />}
            </div>
        </button>
    );
}

function InfoBanner({ icon: Icon, color, children }) {
    const colors = {
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]",
        amber: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
        red: "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
    };
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-semibold ${colors[color || "blue"]}`}>
            {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" />}
            <div>{children}</div>
        </div>
    );
}

// ─── Stepper sidebar ──────────────────────────────────────────────────────────
function Stepper({ current, completed, goTo }) {
    const activePhase = SETUP_PHASES.findIndex(phase => current >= phase.start && current <= phase.end);
    const phase = SETUP_PHASES[activePhase];
    return (
        <aside className="rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-sm lg:sticky lg:top-24">
            <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">Setup journey</p>
            <div className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                {SETUP_PHASES.map((item, phaseIndex) => {
                    const Icon = item.icon;
                    const done = steps.slice(item.start, item.end + 1).every(step => completed.includes(step.key));
                    const active = phaseIndex === activePhase;
                    return (
                        <button key={item.label} onClick={() => goTo(item.start)} className={`flex items-center gap-3 rounded-xl p-3 text-left transition ${active ? "bg-[#EFF6FF] ring-1 ring-[#93C5FD]" : "hover:bg-[#F8FBFF]"}`}>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${done ? "bg-[#DCFCE7] text-[#16A34A]" : active ? "bg-[#1E8AF7] text-white" : "bg-[#F1F5F9] text-[#64748B]"}`}>
                                {done ? <Check size={15} /> : <Icon size={15} />}
                            </span>
                            <span className="min-w-0">
                                <span className={`block text-xs font-black ${active ? "text-[#1E8AF7]" : "text-[#0F172A]"}`}>{phaseIndex + 1}. {item.label}</span>
                                <span className="block truncate text-[10px] font-semibold text-[#64748B]">{item.description}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
            <div className="my-3 border-t border-[#E2E8F0]" />
            <p className="px-2 pb-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#94A3B8]">{phase.label} tasks</p>
            <div className="space-y-1">
                {steps.slice(phase.start, phase.end + 1).map((step, offset) => {
                    const idx = phase.start + offset;
                    const Icon = step.icon;
                    const done = completed.includes(step.key);
                    const active = current === idx;
                    return (
                        <button key={step.key} onClick={() => goTo(idx)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition ${active ? "bg-[#1E8AF7] text-white" : "hover:bg-[#F8FBFF]"}`}>
                            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${active ? "bg-white/20" : done ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#E8F3FF] text-[#1E8AF7]"}`}>
                                {done ? <Check size={11} /> : <Icon size={11} />}
                            </span>
                            <span className={`truncate text-[11px] font-black ${active ? "text-white" : "text-[#0F172A]"}`}>{step.label}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

// ─── Main onboarding component ────────────────────────────────────────────────
export default function OnboardingPage() {
    const { adminRequest, activeStore, fetchMe } = useAdmin();
    const [idx, setIdx] = useState(0);
    const [completed, setCompleted] = useState([]);
    const [saving, setSaving] = useState(false);
    const [successPublished, setSuccessPublished] = useState(false);

    // Step-specific state
    const [form, setForm] = useState({
        storeName: "", storeSlug: "", businessType: "", storeCategory: "", description: "",
        businessEmail: "", businessPhone: "", whatsappNumber: "", sameWhatsapp: false,
        businessAddress: { street: "", city: "", state: "", postalCode: "", country: "Pakistan" },
        socialLinks: { instagram: "", facebook: "", tiktok: "", youtube: "", website: "" },
        shippingFee: 200, freeShippingEnabled: false, freeShippingThreshold: 5000,
        allowedCities: [], estimatedDeliveryDays: "3-5",
        codEnabled: true, bankTransferEnabled: false, bankName: "", accountTitle: "", accountNumber: "", iban: "",
        jazzCashEnabled: false, jazzCashNumber: "", jazzCashTitle: "",
        easypaisaEnabled: false, easypaisaNumber: "", easypaisaTitle: "",
        paymentInstructions: "",
        seoTitle: "", seoDescription: "", socialPreviewImage: "", indexingEnabled: true, metaPixelId: "",
    });
    const [errors, setErrors] = useState({});

    // Design import state
    const [uploadMode, setUploadMode] = useState("zip"); // zip | blank
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [importRecord, setImportRecord] = useState(null);
    const [uploadDone, setUploadDone] = useState(false);

    // Mapping state
    const [mappings, setMappings] = useState({});
    const [detectedSections, setDetectedSections] = useState([]);

    // Product connection state
    const [productSource, setProductSource] = useState("newest");
    const [productLimit, setProductLimit] = useState(8);
    const [previewDevice, setPreviewDevice] = useState("desktop");
    const [previewToken, setPreviewToken] = useState("");
    const [tokenLoading, setTokenLoading] = useState(false);

    const fileInputRef = useRef(null);
    const step = steps[idx];

    // Load existing setup status on mount
    useEffect(() => {
        const load = async () => {
            const status = await adminRequest("/seller/store/setup-status");
            if (status?.success) {
                const savedSteps = status.data.completedSteps || [];
                setCompleted(savedSteps.includes("delivery_settings") && savedSteps.includes("payment_settings")
                    ? [...new Set([...savedSteps, "business_settings"])]
                    : savedSteps);
                const store = status.data.store || activeStore || {};
                setForm(prev => ({
                    ...prev,
                    storeName: store.storeName || prev.storeName,
                    storeSlug: store.storeSlug || prev.storeSlug,
                    businessType: store.businessType || prev.businessType,
                    storeCategory: store.storeCategory || prev.storeCategory,
                    description: store.description || prev.description,
                    businessEmail: store.businessEmail || prev.businessEmail,
                    businessPhone: store.businessPhone || prev.businessPhone,
                    whatsappNumber: store.whatsappNumber || prev.whatsappNumber,
                    businessAddress: { ...prev.businessAddress, ...(store.businessAddress || {}) },
                    socialLinks: { ...prev.socialLinks, ...(store.socialLinks || {}) },
                }));
            }
            // Load existing import if any
            const imports = await adminRequest("/seller/design-import");
            if (imports?.success && imports.data?.length > 0) {
                const latest = imports.data[0];
                setImportRecord(latest);
                if (latest.detectedSections?.length) setDetectedSections(latest.detectedSections);
                if (["validated", "converted", "published"].includes(latest.status)) setUploadDone(true);
            }
        };
        load();
    }, [adminRequest, activeStore]);

    useEffect(() => {
        if (step?.key === "sandbox_preview" && importRecord?._id) {
            const fetchToken = async () => {
                setTokenLoading(true);
                try {
                    const res = await adminRequest(`/seller/design-import/${importRecord._id}/preview-token`);
                    if (res?.success && res.data?.token) {
                        setPreviewToken(res.data.token);
                    } else {
                        toast.error(res?.message || "Failed to generate preview session token.");
                    }
                } catch (err) {
                    console.error("Token fetch error:", err);
                    toast.error("Failed to load design preview: " + err.message);
                } finally {
                    setTokenLoading(false);
                }
            };
            fetchToken();
        }
    }, [step?.key, importRecord?._id, adminRequest]);

    const update = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
    const nestedUpdate = (group, key, value) => setForm(prev => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
    const markStep = async (stepKey, data = {}) => adminRequest("/seller/store/setup-step", "PATCH", { stepKey, data });
    const syncStoreContext = async () => {
        await fetchMe?.();
        if (typeof window !== "undefined") window.dispatchEvent(new Event("storvia:store-updated"));
    };
    const completeLocalSteps = (...keys) => setCompleted(prev => [...new Set([...prev, ...keys])]);
    const saveSetupSteps = async (entries) => {
        const responses = await Promise.all(entries.map(([key, data = {}]) => markStep(key, data)));
        const failed = responses.find(response => !response?.success);
        if (failed) throw new Error(failed.message || "Setup progress could not be saved.");
        completeLocalSteps(...entries.map(([key]) => key));
        await syncStoreContext();
        return responses;
    };

    const validate = () => {
        const errs = {};
        if (step.key === "store_identity") {
            if (!form.storeName.trim()) errs.storeName = "Store name is required.";
            if (!form.storeSlug.trim()) errs.storeSlug = "Store URL is required.";
            if (form.storeSlug && !/^[a-z0-9-]+$/.test(form.storeSlug)) errs.storeSlug = "Use lowercase letters, numbers, and hyphens only.";
            if (!form.businessType) errs.businessType = "Choose a business type.";
            if (!form.storeCategory) errs.storeCategory = "Choose a store category.";
        }
        if (step.key === "business_settings" && !form.codEnabled && !form.bankTransferEnabled && !form.jazzCashEnabled && !form.easypaisaEnabled) {
            errs.payment = "Enable at least one payment method.";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleFileSelect = (file) => {
        if (!file) return;
        if (!file.name.endsWith(".zip")) { toast.error("Only .zip packages are accepted."); return; }
        if (file.size > 20 * 1024 * 1024) { toast.error("Package must be under 20MB."); return; }
        setUploadFile(file);
    };

    const uploadDesignPackage = async () => {
        if (!uploadFile) { toast.error("Please select a ZIP package first."); return; }
        setSaving(true);
        setUploadProgress(10);

        const formData = new FormData();
        formData.append("designPackage", uploadFile);

        try {
            setUploadProgress(40);
            const res = await adminRequest("/seller/design-import/upload", "POST", formData);
            setUploadProgress(90);
            if (res?.success) {
                const record = res.data;
                setImportRecord(record);
                if (record.detectedSections?.length) setDetectedSections(record.detectedSections);
                setUploadDone(record.status !== "rejected" && record.status !== "failed");
                setUploadProgress(100);
                if (record.status === "rejected") {
                    toast.error("Design package failed security checks. See rejection details below.");
                } else {
                    await saveSetupSteps([["design_source"], ["design_validation"]]);
                    toast.success("Design package uploaded and validated!");
                    setTimeout(() => setIdx(2), 800); // auto-advance to validation
                }
            } else {
                toast.error(res?.message || "Upload failed.");
                setUploadProgress(0);
            }
        } catch (e) {
            toast.error("Upload failed: " + e.message);
            setUploadProgress(0);
        } finally {
            setSaving(false);
        }
    };

    const convertDesign = async () => {
        if (!importRecord?._id) return;
        setSaving(true);
        const res = await adminRequest(`/seller/design-import/${importRecord._id}/convert`, "POST");
        setSaving(false);
        if (res?.success) {
            await saveSetupSteps([["sandbox_preview"], ["theme_selection"]]);
            toast.success("Design converted to managed schema!");
            setImportRecord(prev => ({ ...prev, status: "converted" }));
            setTimeout(() => setIdx(4), 600);
        } else {
            toast.error(res?.message || "Conversion failed.");
        }
    };

    const saveMapping = async () => {
        if (!importRecord?._id) return;
        const mappingArray = Object.entries(mappings).map(([targetType, sourceSelector]) => ({
            targetType,
            sourceSelector,
            sourceType: sourceSelector.startsWith("#") ? "id" : "class",
        }));
        setSaving(true);
        const res = await adminRequest(`/seller/design-import/${importRecord._id}/mapping`, "PATCH", { mappings: mappingArray });
        setSaving(false);
        if (res?.success) {
            await saveSetupSteps([["design_mapping"]]);
            toast.success("Mappings saved.");
            setIdx(5);
        } else {
            toast.error(res?.message || "Mapping save failed.");
        }
    };

    const saveProductConnection = async () => {
        setSaving(true);
        await adminRequest("/seller/managed-storefront/commerce-bindings/auto-detect", "POST");
        const res = await adminRequest("/seller/managed-storefront/product-mapping", "PATCH", {
            source: productSource === "newest" ? "newest_products" : productSource,
            limit: productLimit,
        });
        setSaving(false);
        if (res?.success) {
            await saveSetupSteps([["commerce_connection"]]);
            toast.success("Product connection saved.");
            setIdx(6);
        } else {
            // Non-fatal – proceed anyway if storefront not yet converted
            setIdx(6);
        }
    };

    const saveBusinessSettings = async () => {
        if (!validate()) return;
        setSaving(true);
        const settingResponses = await Promise.all([
            adminRequest("/seller/shipping/settings", "PATCH", {
                fee: Number(form.shippingFee || 0),
                freeShippingEnabled: form.freeShippingEnabled,
                freeShippingThreshold: Number(form.freeShippingThreshold || 0),
                allowedCities: form.allowedCities,
                estimatedDeliveryDays: form.estimatedDeliveryDays,
            }),
            adminRequest("/seller/payments/settings", "PATCH", {
                codEnabled: form.codEnabled,
                bankTransferEnabled: form.bankTransferEnabled,
                jazzCashEnabled: form.jazzCashEnabled,
                easypaisaEnabled: form.easypaisaEnabled,
                bankName: form.bankName, accountTitle: form.accountTitle,
                accountNumber: form.accountNumber, iban: form.iban,
                jazzCashNumber: form.jazzCashNumber, jazzCashTitle: form.jazzCashTitle,
                easypaisaNumber: form.easypaisaNumber, easypaisaTitle: form.easypaisaTitle,
                instructions: form.paymentInstructions,
            }),
        ]);
        const failedSetting = settingResponses.find(response => !response?.success);
        if (failedSetting) {
            setSaving(false);
            toast.error(failedSetting.message || "Business settings could not be saved.");
            return;
        }
        try {
            await saveSetupSteps([["delivery_settings"], ["payment_settings"]]);
            completeLocalSteps("business_settings");
            toast.success("Business settings saved.");
            setIdx(7);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const saveSEO = async () => {
        setSaving(true);
        const seoResponse = await adminRequest("/seller/managed-storefront/seo", "PATCH", {
                pageId: "home",
                title: form.seoTitle,
                description: form.seoDescription,
                image: form.socialPreviewImage,
            });
        if (!seoResponse?.success) {
            setSaving(false);
            toast.error(seoResponse?.message || "SEO settings could not be saved.");
            return;
        }
        try {
            await saveSetupSteps([["seo_and_tracking"]]);
            toast.success("SEO settings saved.");
            setIdx(8);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const publishStore = async () => {
        setSaving(true);
        try {
            // Publish design import if available, else publish store directly
            let publishRes;
            if (importRecord?._id) {
                publishRes = await adminRequest(`/seller/design-import/${importRecord._id}/publish`, "POST");
            }
            // Also publish the store identity
            const storeRes = await adminRequest("/seller/store/publish", "POST");
            setSaving(false);
            if (storeRes?.success || publishRes?.success) {
                await fetchMe?.();
                setSuccessPublished(true);
                toast.success("Your Storvia store is live!");
            } else {
                toast.error((storeRes || publishRes)?.message || "Publish failed. Ensure all required steps are complete.");
            }
        } catch (e) {
            setSaving(false);
            toast.error("Publish failed: " + e.message);
        }
    };

    const saveIdentity = async () => {
        if (!validate()) return;
        setSaving(true);
        const res = await markStep("store_identity", {
            storeName: form.storeName, storeSlug: form.storeSlug,
            businessType: form.businessType, storeCategory: form.storeCategory, description: form.description,
        });
        setSaving(false);
        if (res?.success) {
            completeLocalSteps("store_identity");
            await syncStoreContext();
            toast.success("Store identity saved!");
            setIdx(1);
        } else {
            toast.error(res?.message || "Save failed.");
        }
    };

    const COUNTABLE_STEP_KEYS = steps.map(s => s.key).filter(k => k !== "publish");
    const countedCompleted = completed.filter(k => COUNTABLE_STEP_KEYS.includes(k));
    const progress = Math.min(100, Math.round((countedCompleted.length / COUNTABLE_STEP_KEYS.length) * 100));

    // ── Step renderers ─────────────────────────────────────────────────────────
    const renderStep = () => {
        // ── Step 1: Store Identity ─────────────────────────────────────────────
        if (step.key === "store_identity") return (
            <div className="space-y-5">
                <InfoBanner icon={Info} color="blue">
                    Set up your store&apos;s public identity. This is how customers will find and recognise your brand.
                </InfoBanner>
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Store name" error={errors.storeName} helper="Appears on your store header and invoices.">
                        <TI value={form.storeName} onChange={e => { update("storeName", e.target.value); if (!form.storeSlug) update("storeSlug", slugify(e.target.value)); }} placeholder="e.g. Luminelle Skincare" />
                    </Field>
                    <Field label="Store URL" error={errors.storeSlug} helper="storvia.com/store/your-slug">
                        <div className="flex overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FBFF]">
                            <span className="flex items-center bg-white px-2.5 text-[11px] font-black text-[#64748B]">/store/</span>
                            <input value={form.storeSlug} onChange={e => update("storeSlug", slugify(e.target.value))} className="h-10 min-w-0 flex-1 bg-transparent px-2 text-xs font-black outline-none" placeholder="your-store" />
                        </div>
                    </Field>
                    <Field label="Business type" error={errors.businessType}>
                        <div className="grid grid-cols-2 gap-2">
                            {["Individual Seller", "Small Business", "Brand", "Agency/Reseller"].map(t => (
                                <SelectCard key={t} active={form.businessType === t} title={t} onClick={() => update("businessType", t)} />
                            ))}
                        </div>
                    </Field>
                    <Field label="Store category" error={errors.storeCategory}>
                        <div className="grid grid-cols-2 gap-2">
                            {["Skincare", "Fashion", "Electronics", "Home Decor", "Food", "Beauty", "Fitness", "Accessories"].map(c => (
                                <SelectCard key={c} active={form.storeCategory === c} title={c} onClick={() => update("storeCategory", c)} />
                            ))}
                        </div>
                    </Field>
                    <div className="md:col-span-2">
                        <Field label="Store description" helper={`${form.description.length}/220 characters`}>
                            <TA maxLength={220} value={form.description} onChange={e => update("description", e.target.value)} placeholder="Tell customers what your store sells and why they should trust you." />
                        </Field>
                    </div>
                </div>
                <button onClick={saveIdentity} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                    Save & Continue <ArrowRight size={15} />
                </button>
            </div>
        );

        // ── Step 2: Import Design ──────────────────────────────────────────────
        if (step.key === "design_source") return (
            <div className="space-y-5">
                <InfoBanner icon={Info} color="blue">
                    <strong>Storvia does not generate store designs.</strong> You bring your own design from Claude, Lovable, v0, Bolt, Framer, Webflow, or a developer. Storvia safely imports it and connects it to ecommerce operations.
                </InfoBanner>

                <div className="grid gap-3 md:grid-cols-2">
                    <SelectCard active={uploadMode === "zip"} title="Upload ZIP Package" description="Upload a .zip file containing HTML, CSS, images, and fonts." onClick={() => setUploadMode("zip")} />
                    <SelectCard active={uploadMode === "blank"} title="Continue with Blank Placeholder" description="Skip design import and use a minimal placeholder for now." onClick={() => setUploadMode("blank")} />
                </div>

                {uploadMode === "zip" && (
                    <div className="space-y-4">
                        <InfoBanner icon={Shield} color="amber">
                            <strong>Security notice:</strong> JavaScript files (.js, .mjs), server-side code, script tags, inline event handlers, external scripts, and iframes are <strong>not allowed</strong> and will be automatically rejected. Only HTML, CSS, images, and fonts are accepted.
                        </InfoBanner>

                        {/* Accepted format guide */}
                        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                            <p className="mb-3 text-xs font-black text-[#0F172A]">Expected package structure</p>
                            <pre className="overflow-auto rounded-lg bg-[#0F172A] p-3 text-[11px] text-[#94A3B8]">{`your-store.zip
├── index.html        ← Main storefront page
├── style.css         ← Your styles
├── images/
│   ├── hero.jpg
│   └── product.png
└── fonts/
    └── brand.woff2`}</pre>
                        </div>

                        <div
                            className={`group relative flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${uploadFile ? "border-[#1E8AF7] bg-[#E8F3FF]" : "border-[#CBD5E1] bg-[#F8FBFF] hover:border-[#1E8AF7] hover:bg-[#EFF6FF]"}`}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => { e.preventDefault(); handleFileSelect(e.dataTransfer.files?.[0]); }}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input ref={fileInputRef} type="file" accept=".zip" className="hidden" onChange={e => handleFileSelect(e.target.files?.[0])} />
                            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${uploadFile ? "bg-[#1E8AF7] text-white" : "bg-white text-[#1E8AF7]"} shadow-md`}>
                                <Upload size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#0F172A]">
                                    {uploadFile ? uploadFile.name : "Drop your ZIP here or click to browse"}
                                </p>
                                <p className="mt-1 text-[11px] text-[#64748B]">{uploadFile ? `${(uploadFile.size / 1024 / 1024).toFixed(2)}MB` : "Max 20MB · .zip files only"}</p>
                            </div>
                            {uploadFile && (
                                <button type="button" onClick={e => { e.stopPropagation(); setUploadFile(null); setUploadDone(false); setImportRecord(null); }}
                                    className="flex items-center gap-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#FEE2E2]">
                                    <X size={12} /> Remove
                                </button>
                            )}
                        </div>

                        {uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-[#64748B]">
                                    <span>Uploading & scanning…</span><span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                                    <div className="h-full rounded-full bg-[#1E8AF7] transition-all" style={{ width: `${uploadProgress}%` }} />
                                </div>
                            </div>
                        )}

                        <button onClick={uploadDesignPackage} disabled={saving || !uploadFile} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                            {saving ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                            Upload & Scan Package
                        </button>
                    </div>
                )}

                {uploadMode === "blank" && (
                    <div className="space-y-4">
                        <InfoBanner icon={Info} color="amber">
                            A blank placeholder will be used for your storefront until you import a real design. Products, checkout, and commerce operations will still function.
                        </InfoBanner>
                        <button onClick={() => { setIdx(6); toast("Skipped design import — you can add it later from Storefront → Design Import."); }}
                            className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white">
                            Continue without design <ArrowRight size={15} />
                        </button>
                    </div>
                )}
            </div>
        );

        // ── Step 3: Design Validation ──────────────────────────────────────────
        if (step.key === "design_validation") return (
            <div className="space-y-5">
                {!importRecord && (
                    <InfoBanner icon={AlertTriangle} color="amber">
                        No design package uploaded yet. <button onClick={() => setIdx(1)} className="underline font-black">Go back to upload a design</button>.
                    </InfoBanner>
                )}
                {importRecord && (
                    <>
                        <div className={`rounded-2xl border p-5 ${importRecord.status === "rejected" ? "border-[#FCA5A5] bg-[#FEF2F2]" : importRecord.status === "validated" || importRecord.status === "converted" || importRecord.status === "published" ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#FDE68A] bg-[#FFFBEB]"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${importRecord.status === "rejected" ? "bg-[#FCA5A5] text-[#991B1B]" : importRecord.status === "validated" || importRecord.status === "converted" ? "bg-[#BBF7D0] text-[#166534]" : "bg-[#FDE68A] text-[#92400E]"}`}>
                                    {importRecord.status === "rejected" ? <X size={20} /> : importRecord.status === "validated" || importRecord.status === "converted" || importRecord.status === "published" ? <CheckCircle2 size={20} /> : <Loader2 size={20} className="animate-spin" />}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-[#0F172A]">
                                        {importRecord.status === "rejected" ? "Design rejected — security issues found" :
                                            importRecord.status === "validated" ? "Design validated and safe" :
                                                importRecord.status === "converted" || importRecord.status === "published" ? "Design validated and converted" :
                                                    "Scanning design package…"}
                                    </p>
                                    <p className="text-[11px] text-[#64748B]">{importRecord.originalFilename}</p>
                                </div>
                            </div>
                        </div>

                        {/* Security scan results */}
                        {importRecord.securityReport && (
                            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                                <p className="mb-3 text-xs font-black text-[#0F172A]">Security Scan Report</p>
                                <div className="space-y-2">
                                    {[
                                        { label: "No JavaScript files", pass: !importRecord.rejectionReasons?.some(r => r.includes(".js") || r.includes("executable")) },
                                        { label: "No script tags", pass: !importRecord.rejectionReasons?.some(r => r.toLowerCase().includes("script tag")) },
                                        { label: "No inline event handlers", pass: !importRecord.rejectionReasons?.some(r => r.toLowerCase().includes("event handler")) },
                                        { label: "No iframes", pass: !importRecord.rejectionReasons?.some(r => r.toLowerCase().includes("iframe")) },
                                        { label: "No unsafe external imports", pass: !importRecord.rejectionReasons?.some(r => r.toLowerCase().includes("@import")) },
                                        { label: "File count within limits", pass: !importRecord.rejectionReasons?.some(r => r.includes("file count")) },
                                        { label: "Total size within limits", pass: !importRecord.rejectionReasons?.some(r => r.includes("size")) },
                                    ].map(({ label, pass }) => (
                                        <div key={label} className="flex items-center gap-2">
                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${pass ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#FEE2E2] text-[#DC2626]"}`}>
                                                {pass ? <Check size={11} /> : <X size={11} />}
                                            </span>
                                            <span className="text-xs font-semibold text-[#0F172A]">{label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* File manifest summary */}
                        {importRecord.assetReport && (
                            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                                <p className="mb-2 text-xs font-black text-[#0F172A]">Package Summary</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-[#F8FBFF] p-3">
                                        <p className="text-[11px] font-bold text-[#64748B]">Files detected</p>
                                        <p className="text-xl font-black text-[#0F172A]">{importRecord.assetReport.count || 0}</p>
                                    </div>
                                    <div className="rounded-lg bg-[#F8FBFF] p-3">
                                        <p className="text-[11px] font-bold text-[#64748B]">Total size</p>
                                        <p className="text-xl font-black text-[#0F172A]">{((importRecord.assetReport.totalSize || 0) / 1024 / 1024).toFixed(2)}MB</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {importRecord.packageAnalysis && (
                            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                                <p className="mb-3 text-xs font-black text-[#0F172A]">Detected Store Content</p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                    {[
                                        ["HTML pages", importRecord.packageAnalysis.htmlFiles?.length || 0],
                                        ["Stylesheets", importRecord.packageAnalysis.cssFiles?.length || 0],
                                        ["Images", importRecord.packageAnalysis.imageFiles?.length || 0],
                                        ["Fonts", importRecord.packageAnalysis.fontFiles?.length || 0],
                                    ].map(([label, value]) => (
                                        <div key={label} className="rounded-lg bg-[#F8FBFF] p-3">
                                            <p className="text-[10px] font-bold text-[#64748B]">{label}</p>
                                            <p className="text-lg font-black text-[#0F172A]">{value}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 space-y-1 text-[11px] font-semibold text-[#475569]">
                                    <p><span className="font-black text-[#0F172A]">Entry file:</span> {importRecord.packageAnalysis.entryFile || "Not detected"}</p>
                                    {importRecord.packageAnalysis.pageTitles?.length > 0 && <p><span className="font-black text-[#0F172A]">Page titles:</span> {importRecord.packageAnalysis.pageTitles.join(", ")}</p>}
                                    {importRecord.packageAnalysis.fontFamilies?.length > 0 && <p><span className="font-black text-[#0F172A]">Fonts:</span> {importRecord.packageAnalysis.fontFamilies.join(", ")}</p>}
                                </div>
                                {importRecord.packageAnalysis.colors?.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {importRecord.packageAnalysis.colors.slice(0, 12).map(color => (
                                            <span key={color} className="flex items-center gap-1 rounded-md border border-[#E2E8F0] px-2 py-1 text-[10px] font-bold text-[#475569]">
                                                <span className="h-3 w-3 rounded-sm border border-black/10" style={{ backgroundColor: color }} />{color}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {importRecord.status === "rejected" && importRecord.rejectionReasons?.length > 0 && (
                            <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4">
                                <p className="mb-2 text-xs font-black text-[#991B1B]">Rejection reasons — fix these and re-upload</p>
                                <ul className="space-y-1.5">
                                    {importRecord.rejectionReasons.map((r, i) => (
                                        <li key={i} className="flex items-start gap-2 text-[11px] font-semibold text-[#7F1D1D]">
                                            <X size={12} className="mt-0.5 shrink-0 text-[#DC2626]" /> {r}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => setIdx(1)} className="mt-4 flex items-center gap-2 rounded-lg border border-[#FCA5A5] bg-white px-4 py-2 text-xs font-black text-[#DC2626] hover:bg-[#FEF2F2]">
                                    <RefreshCw size={13} /> Re-upload Design
                                </button>
                            </div>
                        )}

                        {(importRecord.status === "validated" || importRecord.status === "converted") && (
                            <div className="flex gap-3">
                                <button onClick={() => setIdx(3)} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8]">
                                    Preview Design <ArrowRight size={15} />
                                </button>
                                <button onClick={convertDesign} disabled={saving || importRecord.status === "converted"} className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7] disabled:opacity-60">
                                    {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                                    {importRecord.status === "converted" ? "Already converted ✓" : "Convert to Managed Schema"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        );

        // ── Step 4: Sandbox Preview ────────────────────────────────────────────
        if (step.key === "sandbox_preview") return (
            <div className="space-y-5">
                <InfoBanner icon={Shield} color="blue">
                    <strong>Sandboxed preview</strong> — JavaScript is completely disabled. This shows only the visual layout of your imported design. No scripts, popups, or forms will function here.
                </InfoBanner>
                <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2">
                    {[["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]].map(([d, Icon, label]) => (
                        <button key={d} type="button" onClick={() => setPreviewDevice(d)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${previewDevice === d ? "bg-[#1E8AF7] text-white" : "text-[#64748B] hover:bg-[#F8FBFF]"}`}>
                            <Icon size={14} /> {label}
                        </button>
                    ))}
                </div>
                {importRecord?._id ? (
                    <div className="relative overflow-auto rounded-2xl border border-[#E2E8F0] bg-[#1E1E1E] p-4 flex items-center justify-center" style={{ height: 550 }}>
                        {tokenLoading ? (
                            <div className="flex flex-col items-center gap-2 text-white">
                                <Loader2 className="animate-spin text-[#1E8AF7]" size={32} />
                                <span className="text-xs font-bold text-gray-400">Generating secure sandbox session...</span>
                            </div>
                        ) : previewToken ? (
                            <iframe
                                src={`/api/seller/design-import/preview/${importRecord._id}/index.html?token=${previewToken}`}
                                style={{
                                    width: previewDevice === "mobile" ? 390 : previewDevice === "tablet" ? 768 : "100%",
                                    height: "100%",
                                    border: "none",
                                    display: "block",
                                    margin: "0 auto"
                                }}
                                className="rounded-xl bg-white shadow-xl transition-all duration-300"
                                sandbox="allow-same-origin allow-popups"
                                title="Design Raw Preview"
                            />
                        ) : (
                            <div className="text-center text-red-500 font-bold text-xs">
                                Preview session expired. Please refresh the page to try again.
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FBFF]">
                        <div className="text-center">
                            <Eye className="mx-auto mb-2 h-8 w-8 text-[#94A3B8]" />
                            <p className="text-sm font-bold text-[#64748B]">No design imported yet</p>
                            <button onClick={() => setIdx(1)} className="mt-2 text-xs font-black text-[#1E8AF7] underline">Upload a design</button>
                        </div>
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={() => setIdx(1)} className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#0F172A] hover:border-[#1E8AF7]">
                        <RefreshCw size={14} /> Re-upload
                    </button>
                    <button onClick={() => importRecord?.status === "converted" ? setIdx(4) : convertDesign()} disabled={saving || !importRecord} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                        {importRecord?.status === "converted" ? "Converted ✓ — Continue" : "Approve & Convert Design"}
                        <ArrowRight size={15} />
                    </button>
                </div>
            </div>
        );

        // ── Step 5: Design Mapping ─────────────────────────────────────────────
        if (step.key === "design_mapping") return (
            <div className="space-y-5">
                <InfoBanner icon={Map} color="blue">
                    Map areas of your design to Storvia-managed commerce zones. This tells Storvia where to inject products, navigation, cart, and checkout.
                </InfoBanner>
                {detectedSections.length > 0 && (
                    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                        <p className="mb-3 text-xs font-black text-[#0F172A]">Detected sections in your design</p>
                        <div className="flex flex-wrap gap-2">
                            {detectedSections.map(s => (
                                <span key={s.id} className="rounded-full bg-[#E8F3FF] px-3 py-1 text-[11px] font-black text-[#1E8AF7]">{s.selector}</span>
                            ))}
                        </div>
                    </div>
                )}
                <div className="space-y-3">
                    <p className="text-xs font-black text-[#0F172A]">Map your design selectors to Storvia zones</p>
                    {MAPPING_TARGETS.map(target => (
                        <div key={target} className="grid grid-cols-2 items-center gap-3">
                            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 py-2.5">
                                <p className="text-[11px] font-black text-[#0F172A]">{target}</p>
                                <p className="text-[10px] font-semibold text-[#64748B]">Storvia managed zone</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link2 size={14} className="shrink-0 text-[#94A3B8]" />
                                <input
                                    value={mappings[target] || ""}
                                    onChange={e => setMappings(prev => ({ ...prev, [target]: e.target.value }))}
                                    placeholder=".hero-section or #header"
                                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-[11px] font-bold text-[#0F172A] outline-none focus:border-[#1E8AF7]"
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={saveMapping} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                        Save Mappings <ArrowRight size={15} />
                    </button>
                    <button onClick={() => setIdx(5)} className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-sm font-bold text-[#64748B] hover:border-[#1E8AF7]">
                        Skip for now
                    </button>
                </div>
            </div>
        );

        // ── Step 6: Commerce Connection ────────────────────────────────────────
        if (step.key === "commerce_connection") return (
            <div className="space-y-5">
                <InfoBanner icon={ShoppingBag} color="blue">
                    Connect your product catalog to the imported design. Storvia manages all product data, inventory, and checkout — your design just displays them.
                </InfoBanner>
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-4">
                    <div>
                        <p className="mb-2 text-xs font-black text-[#0F172A]">Product grid source</p>
                        <div className="grid gap-2 md:grid-cols-2">
                            {[["newest", "Newest products"], ["best_sellers", "Best sellers"], ["featured", "Featured products"], ["manual", "Manually selected"]].map(([v, l]) => (
                                <SelectCard key={v} active={productSource === v} title={l} onClick={() => setProductSource(v)} />
                            ))}
                        </div>
                    </div>
                    <Field label="Products to display">
                        <select value={productLimit} onChange={e => setProductLimit(Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-bold outline-none focus:border-[#1E8AF7]">
                            {[4, 8, 12, 16].map(n => <option key={n} value={n}>{n} products</option>)}
                        </select>
                    </Field>
                    <InfoBanner icon={Shield} color="green">
                        <strong>Checkout is Storvia-controlled.</strong> Cart, order creation, payment processing, and shipping remain fully managed by Storvia. Your imported design cannot control these.
                    </InfoBanner>
                </div>
                <button onClick={saveProductConnection} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                    Save & Continue <ArrowRight size={15} />
                </button>
            </div>
        );

        // ── Step 7: Business Settings ──────────────────────────────────────────
        if (step.key === "business_settings") return (
            <div className="space-y-5">
                {errors.payment && <InfoBanner icon={AlertTriangle} color="red">{errors.payment}</InfoBanner>}
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <p className="text-sm font-black text-[#0F172A]">Delivery Settings</p>
                    <div className="grid gap-3 md:grid-cols-2">
                        <Field label="Shipping fee (PKR)">
                            <div className="flex rounded-lg border border-[#E2E8F0] bg-[#F8FBFF]">
                                <span className="flex items-center bg-white px-3 text-xs font-black text-[#64748B]">PKR</span>
                                <input value={form.shippingFee} onChange={e => update("shippingFee", e.target.value)} className="h-10 flex-1 bg-transparent px-3 text-xs font-black outline-none" />
                            </div>
                        </Field>
                        <Field label="Estimated delivery">
                            <select value={form.estimatedDeliveryDays} onChange={e => update("estimatedDeliveryDays", e.target.value)} className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold outline-none">
                                <option value="1-2">1-2 days</option>
                                <option value="3-5">3-5 days</option>
                                <option value="5-7">5-7 days</option>
                            </select>
                        </Field>
                    </div>
                    <ToggleCard checked={form.freeShippingEnabled} title="Free shipping threshold" description="Offer free shipping above a cart amount." onChange={v => update("freeShippingEnabled", v)}>
                        <TI value={form.freeShippingThreshold} onChange={e => update("freeShippingThreshold", e.target.value)} placeholder="5000" />
                    </ToggleCard>
                </div>
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-3">
                    <p className="text-sm font-black text-[#0F172A]">Payment Methods</p>
                    <ToggleCard checked={form.codEnabled} title="Cash on Delivery" description="Customers pay when order arrives." onChange={v => update("codEnabled", v)} />
                    <ToggleCard checked={form.bankTransferEnabled} title="Bank Transfer" onChange={v => update("bankTransferEnabled", v)}>
                        <div className="grid gap-2 md:grid-cols-2">
                            <TI value={form.bankName} onChange={e => update("bankName", e.target.value)} placeholder="Bank name" />
                            <TI value={form.accountTitle} onChange={e => update("accountTitle", e.target.value)} placeholder="Account title" />
                            <TI value={form.accountNumber} onChange={e => update("accountNumber", e.target.value)} placeholder="Account number" />
                            <TI value={form.iban} onChange={e => update("iban", e.target.value)} placeholder="IBAN" />
                        </div>
                    </ToggleCard>
                    <ToggleCard checked={form.jazzCashEnabled} title="JazzCash" onChange={v => update("jazzCashEnabled", v)}>
                        <div className="grid gap-2 md:grid-cols-2">
                            <TI value={form.jazzCashNumber} onChange={e => update("jazzCashNumber", e.target.value)} placeholder="JazzCash number" />
                            <TI value={form.jazzCashTitle} onChange={e => update("jazzCashTitle", e.target.value)} placeholder="Account title" />
                        </div>
                    </ToggleCard>
                    <ToggleCard checked={form.easypaisaEnabled} title="Easypaisa" onChange={v => update("easypaisaEnabled", v)}>
                        <div className="grid gap-2 md:grid-cols-2">
                            <TI value={form.easypaisaNumber} onChange={e => update("easypaisaNumber", e.target.value)} placeholder="Easypaisa number" />
                            <TI value={form.easypaisaTitle} onChange={e => update("easypaisaTitle", e.target.value)} placeholder="Account title" />
                        </div>
                    </ToggleCard>
                </div>
                <button onClick={saveBusinessSettings} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                    Save Settings <ArrowRight size={15} />
                </button>
            </div>
        );

        // ── Step 8: SEO & Tracking ─────────────────────────────────────────────
        if (step.key === "seo_and_tracking") return (
            <div className="space-y-5">
                <InfoBanner icon={Info} color="blue">
                    Storvia fully controls SEO metadata, sitemaps, robots.txt, and canonical URLs. Your imported design cannot override these settings.
                </InfoBanner>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Field label="Store SEO title" helper="Appears in browser tab and Google search results.">
                            <TI value={form.seoTitle} onChange={e => update("seoTitle", e.target.value)} placeholder="e.g. Luminelle Skincare | Premium Natural Skincare Pakistan" />
                        </Field>
                    </div>
                    <div className="md:col-span-2">
                        <Field label="SEO description" helper="155 characters max.">
                            <TA maxLength={155} value={form.seoDescription} onChange={e => update("seoDescription", e.target.value)} placeholder="Describe your store for search engines." />
                        </Field>
                    </div>
                    <Field label="Meta Pixel ID (optional)">
                        <TI value={form.metaPixelId} onChange={e => update("metaPixelId", e.target.value)} placeholder="123456789012345" />
                    </Field>
                    <ToggleCard checked={form.indexingEnabled} title="Allow search indexing" description="Let search engines find your store." onChange={v => update("indexingEnabled", v)} />
                </div>
                <InfoBanner icon={Shield} color="green">
                    <strong>Meta Pixel security:</strong> Your imported design cannot inject Meta Pixel manually. Pixel loading happens through Storvia&apos;s store-scoped integration only.
                </InfoBanner>
                <button onClick={saveSEO} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                    Save & Continue <ArrowRight size={15} />
                </button>
            </div>
        );

        // ── Step 9: Final Preview ──────────────────────────────────────────────
        if (step.key === "final_preview") return (
            <div className="space-y-5">
                <InfoBanner icon={Monitor} color="blue">
                    This preview renders your storefront through Storvia&apos;s managed renderer — the same way it appears to your customers.
                </InfoBanner>
                <div className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2">
                    {[["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]].map(([d, Icon]) => (
                        <button key={d} type="button" onClick={() => setPreviewDevice(d)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${previewDevice === d ? "bg-[#1E8AF7] text-white" : "text-[#64748B] hover:bg-[#F8FBFF]"}`}>
                            <Icon size={14} /> {d.charAt(0).toUpperCase() + d.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="overflow-auto rounded-2xl border border-[#E2E8F0] bg-[#1E1E1E] p-4 flex items-center justify-center" style={{ height: 550 }}>
                    {form.storeSlug ? (
                        <iframe
                            src={`/store/${form.storeSlug || activeStore?.storeSlug}?preview=true`}
                            style={{
                                width: previewDevice === "mobile" ? 390 : previewDevice === "tablet" ? 768 : "100%",
                                height: "100%",
                                border: "none",
                                display: "block",
                                margin: "0 auto"
                            }}
                            className="rounded-xl bg-white shadow-xl transition-all duration-300"
                            title="Final Storefront Preview"
                        />
                    ) : (
                        <div className="flex h-64 items-center justify-center text-sm font-bold text-gray-400">
                            Save your store identity first to preview.
                        </div>
                    )}
                </div>
                {/* Checklist */}
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                    <p className="mb-3 text-xs font-black text-[#0F172A]">Launch checklist</p>
                    <div className="space-y-2">
                        {[
                            ["store_identity", "Store identity"],
                            ["business_settings", "Business settings"],
                            ["seo_and_tracking", "SEO configured"],
                        ].map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between rounded-lg bg-[#F8FBFF] px-3 py-2">
                                <span className="text-xs font-bold text-[#0F172A]">{label}</span>
                                {completed.includes(key) ? <CheckCircle2 size={16} className="text-[#16A34A]" /> :
                                    <button onClick={() => setIdx(steps.findIndex(s => s.key === key))} className="rounded-lg bg-[#FEF2F2] px-2 py-1 text-[11px] font-black text-[#DC2626]">Fix</button>}
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={async () => {
                    setSaving(true);
                    try {
                        await saveSetupSteps([["preview_store"]]);
                        setIdx(9);
                    } catch (error) {
                        toast.error(error.message);
                    } finally {
                        setSaving(false);
                    }
                }} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-60">
                    Proceed to Publish <ArrowRight size={15} />
                </button>
            </div>
        );

        // ── Step 10: Publish ───────────────────────────────────────────────────
        return (
            <div className="space-y-5">
                {successPublished ? (
                    <div className="rounded-2xl border border-[#BBF7D0] bg-[#F0FDF4] p-8 text-center">
                        <CheckCircle2 className="mx-auto h-14 w-14 text-[#16A34A]" />
                        <h2 className="mt-4 text-2xl font-black text-[#0F172A]">Your store is live!</h2>
                        <p className="mt-2 text-sm font-semibold text-[#64748B]">Your managed imported storefront has been published on Storvia.</p>
                        <div className="mt-6 flex flex-wrap justify-center gap-3">
                            <Link href={buildStoreUrl(activeStore)} className="rounded-xl bg-[#1E8AF7] px-5 py-3 text-sm font-bold text-white">View Live Store</Link>
                            <Link href="/app/dashboard" className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#0F172A]">Go to Dashboard</Link>
                            <Link href="/app/storefront" className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#0F172A]">Manage Storefront</Link>
                        </div>
                    </div>
                ) : (
                    <>
                        <InfoBanner icon={Rocket} color="blue">
                            Publishing makes your managed storefront live. Only Storvia-rendered content will be served — your raw uploaded files do not execute on the live store.
                        </InfoBanner>
                        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                            <p className="mb-3 text-sm font-black text-[#0F172A]">Final publish checklist</p>
                            {[["store_identity", "Store identity"], ["business_settings", "Shipping & payment configured"]].map(([key, label]) => (
                                <div key={key} className="flex items-center justify-between rounded-lg bg-[#F8FBFF] px-3 py-2 mb-2">
                                    <span className="text-xs font-bold text-[#0F172A]">{label}</span>
                                    {completed.includes(key) ? <CheckCircle2 size={16} className="text-[#16A34A]" /> :
                                        <button onClick={() => setIdx(steps.findIndex(s => s.key === key))} className="rounded-lg bg-[#FEF2F2] px-2 py-1 text-[11px] font-black text-[#DC2626]">Fix</button>}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={publishStore} disabled={saving} className="flex items-center gap-2 rounded-xl bg-[#16A34A] px-6 py-3 text-sm font-bold text-white hover:bg-[#15803D] disabled:opacity-60">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                                Publish Storefront
                            </button>
                            <button onClick={() => setIdx(8)} className="rounded-xl border border-[#E2E8F0] bg-white px-5 py-3 text-sm font-bold text-[#64748B]">
                                Back to Preview
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    };

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="pb-16">
            {/* Top bar */}
            <div className="mx-auto max-w-7xl px-4 pt-2">
                <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2E8F0] bg-white px-4 py-3 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#1E8AF7]">Store setup wizard</p>
                        <h1 className="truncate text-lg font-black text-[#0F172A]">{form.storeName || activeStore?.storeName || "Set up your Storvia store"}</h1>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <div className="flex h-7 w-32 overflow-hidden rounded-full bg-[#E2E8F0]">
                            <div className="h-full rounded-full bg-[#1E8AF7] transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-[11px] font-black text-[#64748B]">{progress}%</span>
                        <Link href="/app/dashboard" className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[11px] font-black text-[#64748B] hover:border-[#1E8AF7]">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-7xl px-4 py-6">
                <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
                    <Stepper current={idx} completed={completed} goTo={setIdx} />

                    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                        {/* Step header */}
                        <div className="border-b border-[#E2E8F0] bg-[#F8FBFF] p-5">
                            <div className="mb-1 flex items-center gap-2">
                                {idx > 0 && (
                                    <button onClick={() => setIdx(idx - 1)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] hover:border-[#1E8AF7] hover:text-[#1E8AF7]">
                                        <ArrowLeft size={13} />
                                    </button>
                                )}
                                <span className="text-[11px] font-black text-[#1E8AF7]">Step {idx + 1} of {steps.length}</span>
                            </div>
                            <h2 className="text-xl font-black text-[#0F172A]">{step.label}</h2>
                            <p className="mt-1 text-sm font-semibold text-[#64748B]">{step.description}</p>
                        </div>

                        {/* Step content */}
                        <div className="p-5 md:p-6">
                            {renderStep()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
