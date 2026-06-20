"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import {
    Upload, Eye, Palette, Navigation, Image as ImageIcon,
    ShoppingBag, Search, Globe, History, Layers, Settings,
    CheckCircle2, AlertTriangle, Loader2, RefreshCw, ArrowRight,
    X, Check, Monitor, Tablet, Smartphone, Save, Rocket, FileText,
    ChevronRight, Info, Shield, Package, Link2, ExternalLink,
    HelpCircle, Paintbrush, Lock, Zap
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { resolveAssetUrl } from "@/lib/storeUrl";
import { DEVICE_WIDTHS } from "@/lib/storefrontRoutes";

// ─── Tab definitions ──────────────────────────────────────────────────────────
const TABS = [
    { id: "overview",    label: "Overview",      icon: Layers },
    { id: "import",      label: "Design Import", icon: Upload },
    { id: "content",     label: "Content",        icon: FileText },
    { id: "images",      label: "Images",         icon: ImageIcon },
    { id: "colors",      label: "Colors",         icon: Paintbrush },
    { id: "navigation",  label: "Navigation",     icon: Navigation },
    { id: "products",    label: "Products",       icon: ShoppingBag },
    { id: "links",       label: "Route Map", icon: Link2 },
    { id: "seo",         label: "SEO",            icon: Search },
    { id: "preview",     label: "Preview",        icon: Eye },
    { id: "versions",    label: "Versions",       icon: History },
    { id: "settings",    label: "Settings",       icon: Settings },
];

const TAB_GROUPS = [
    { label: "Start", items: ["overview", "import"] },
    { label: "Build", items: ["content", "images", "colors", "navigation", "products", "links", "seo"] },
    { label: "Review", items: ["preview", "versions"] },
    { label: "Store", items: ["settings"] },
];

// ─── Tiny shared primitives ───────────────────────────────────────────────────
function Field({ label, helper, error, children }) {
    return (
        <label className="block">
            {label && <span className="text-xs font-black text-[#0F172A]">{label}</span>}
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
    return <textarea {...props} className={`min-h-20 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] p-3 text-xs font-semibold text-[#0F172A] outline-none focus:border-[#1E8AF7] focus:bg-white resize-none ${props.className || ""}`} />;
}

function Banner({ icon: Icon, color = "blue", children }) {
    const cols = {
        blue: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]",
        amber: "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]",
        green: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
        red: "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]",
    };
    return (
        <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs font-semibold ${cols[color]}`}>
            {Icon && <Icon className="h-4 w-4 mt-0.5 shrink-0" />}
            <div>{children}</div>
        </div>
    );
}

function SaveBar({ dirty, saving, onSave, onDiscard }) {
    if (!dirty) return null;
    return (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-2xl border-t border-[#E2E8F0] bg-white px-5 py-3">
            <p className="text-xs font-bold text-[#64748B]">Unsaved changes</p>
            <div className="flex gap-2">
                <button onClick={onDiscard} className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-black text-[#64748B] hover:border-[#CBD5E1]">Discard</button>
                <button onClick={onSave} disabled={saving} className="flex items-center gap-1.5 rounded-lg bg-[#1E8AF7] px-4 py-1.5 text-xs font-black text-white disabled:opacity-60">
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
            </div>
        </div>
    );
}

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function TabOverview({ storefrontStatus, importRecord, storeSlug, onGoTo }) {
    const managed = storefrontStatus?.status === "published";
    const converted = storefrontStatus?.status === "converted";
    const hasImport = !!importRecord;

    const statuses = [
        { label: "Design imported", done: hasImport },
        { label: "Design validated", done: importRecord?.status === "validated" || importRecord?.status === "converted" || importRecord?.status === "published" },
        { label: "Schema converted", done: importRecord?.status === "converted" || importRecord?.status === "published" },
        { label: "Store published",  done: managed },
    ];

    return (
        <div className="space-y-5">
            {/* Status card */}
            <div className={`rounded-2xl border p-5 ${managed ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E2E8F0] bg-white"}`}>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-black text-[#64748B]">STOREFRONT STATUS</p>
                        <p className={`mt-1 text-2xl font-black ${managed ? "text-[#16A34A]" : converted ? "text-[#1E8AF7]" : "text-[#0F172A]"}`}>
                            {managed ? "Live & Published" : converted ? "Converted — Not published" : hasImport ? "Import in progress" : "No design imported"}
                        </p>
                        {storeSlug && (
                            <a href={`/store/${storeSlug}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs font-black text-[#1E8AF7] hover:underline">
                                storvia.com/store/{storeSlug} <ExternalLink size={11} />
                            </a>
                        )}
                    </div>
                    {managed && (
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7]">
                            <CheckCircle2 className="h-7 w-7 text-[#16A34A]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Progress checklist */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#0F172A]">Import pipeline status</p>
                <div className="space-y-2">
                    {statuses.map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-3 rounded-lg bg-[#F8FBFF] px-3 py-2.5">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-[#E2E8F0] text-[#94A3B8]"}`}>
                                {done ? <Check size={11} /> : <div className="h-2 w-2 rounded-full bg-current" />}
                            </span>
                            <span className={`text-xs font-bold ${done ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{label}</span>
                            {done && <CheckCircle2 size={13} className="ml-auto text-[#16A34A]" />}
                        </div>
                    ))}
                </div>
            </div>

            {/* Primary CTA */}
            {hasImport && (
                <a
                    href="/app/storefront/editor"
                    className="flex items-center justify-between rounded-2xl border border-[#1E8AF7] bg-gradient-to-r from-[#EFF6FF] to-white p-5 transition hover:shadow-md"
                >
                    <div>
                        <p className="text-sm font-black text-[#0F172A]">Open Visual Editor</p>
                        <p className="mt-0.5 text-xs text-[#64748B]">Click text and images directly on your store canvas — like Canva.</p>
                    </div>
                    <ChevronRight className="text-[#1E8AF7]" />
                </a>
            )}

            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {[
                    { tab: "import",     icon: Upload,       label: "Re-import Design",   description: "Upload a new or updated design package",    color: "blue" },
                    { href: "/app/storefront/editor", icon: Eye, label: "Visual Editor", description: "Edit text & images on the live canvas", color: "blue" },
                    { tab: "content",    icon: FileText,     label: "Edit Content",       description: "Update text, headings, and copy",           color: "blue" },
                    { tab: "images",     icon: ImageIcon,    label: "Replace Images",     description: "Swap design images with your brand photos",  color: "blue" },
                    { tab: "colors",     icon: Paintbrush,   label: "Change Colors",      description: "Adjust color palette and brand colours",     color: "blue" },
                    { tab: "seo",        icon: Search,       label: "SEO Settings",       description: "Meta title, description, and social preview", color: "blue" },
                    { tab: "preview",    icon: Eye,          label: "Preview Store",      description: "See how your store looks to customers",       color: "blue" },
                ].map((item) => {
                    const { tab, href, icon: Icon, label, description } = item;
                    const cls = "flex items-start gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 text-left transition hover:border-[#93C5FD] hover:bg-[#EFF6FF]";
                    const inner = (
                        <>
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F3FF]">
                                <Icon size={16} className="text-[#1E8AF7]" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-xs font-black text-[#0F172A]">{label}</p>
                                <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">{description}</p>
                            </div>
                        </>
                    );
                    if (href) return <a key={label} href={href} className={cls}>{inner}</a>;
                    return <button key={tab} onClick={() => onGoTo(tab)} className={cls}>{inner}</button>;
                })}
            </div>

            {/* What Storvia manages */}
            <div className="rounded-xl border border-[#E8F3FF] bg-[#EFF6FF] p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-black text-[#1E40AF]">
                    <Lock size={13} /> Storvia-managed (cannot be overridden by your design)
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                    {["Checkout & payment processing", "Order management", "Shipping & tracking", "Product inventory", "SEO & robots.txt", "SSL & security", "Fraud detection", "Customer accounts"].map(item => (
                        <div key={item} className="flex items-center gap-2 text-[11px] font-semibold text-[#1E40AF]">
                            <CheckCircle2 size={12} className="shrink-0" /> {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── TAB: Design Import ───────────────────────────────────────────────────────
function TabImport({ importRecord, onImportSuccess, adminRequest }) {
    const [file, setFile] = useState(null);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [converting, setConverting] = useState(false);
    const fileRef = useRef(null);

    const handleDrop = e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f?.name.endsWith(".zip")) setFile(f); };
    const handleSelect = e => { const f = e.target.files?.[0]; if (f) setFile(f); };

    const upload = async () => {
        if (!file) return;
        setUploading(true); setProgress(20);
        const fd = new FormData();
        fd.append("designPackage", file);
        const res = await adminRequest("/seller/design-import/upload", "POST", fd);
        setProgress(100);
        setUploading(false);
        if (res?.success || res?.data) {
            toast.success("Design package uploaded and scanned!");
            onImportSuccess(res.data || res);
        } else {
            toast.error(res?.message || "Upload failed.");
        }
        setProgress(0);
    };

    const convert = async (id) => {
        setConverting(true);
        const res = await adminRequest(`/seller/design-import/${id}/convert`, "POST");
        setConverting(false);
        if (res?.success) { toast.success("Converted to managed schema!"); onImportSuccess({ ...importRecord, status: "converted" }); }
        else toast.error(res?.message || "Conversion failed.");
    };

    return (
        <div className="space-y-5">
            <Banner icon={Info} color="blue">
                <strong>Storvia is not a website builder.</strong> Bring your design from Claude, Lovable, v0, Bolt, Framer, Webflow, or a developer. Storvia imports it and connects it to your commerce operations.
            </Banner>

            {/* Security policy */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#0F172A]">What is and isn&apos;t allowed in your design package</p>
                <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                        <p className="mb-2 text-[11px] font-black text-[#16A34A]">✓ Allowed</p>
                        {["HTML structure and layout", "CSS stylesheets", "Images (JPG, PNG, WebP, SVG)", "Web fonts (woff, woff2, ttf)", "Multi-page HTML files", "Inline CSS styles"].map(v => (
                            <p key={v} className="text-[11px] font-semibold text-[#374151]">• {v}</p>
                        ))}
                    </div>
                    <div>
                        <p className="mb-2 text-[11px] font-black text-[#DC2626]">✗ Not allowed (auto-rejected)</p>
                        {["JavaScript files (.js)", "Script tags in HTML", "Inline event handlers (onclick, etc.)", "External CDN/script imports", "PHP or server-side code", "Iframes", "External CSS @imports"].map(v => (
                            <p key={v} className="text-[11px] font-semibold text-[#374151]">• {v}</p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Upload zone */}
            <div
                className={`relative flex min-h-44 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 text-center transition ${file ? "border-[#1E8AF7] bg-[#E8F3FF]" : "border-[#CBD5E1] bg-[#F8FBFF] hover:border-[#1E8AF7]"}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
            >
                <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleSelect} />
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-md ${file ? "bg-[#1E8AF7] text-white" : "bg-white text-[#1E8AF7]"}`}>
                    <Upload size={22} />
                </div>
                <div>
                    <p className="text-sm font-black text-[#0F172A]">{file ? file.name : "Drop ZIP or click to browse"}</p>
                    <p className="text-[11px] text-[#64748B]">{file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : "Max 20MB · .zip only"}</p>
                </div>
                {file && <button type="button" onClick={e => { e.stopPropagation(); setFile(null); }} className="flex items-center gap-1 rounded-lg border border-[#FCA5A5] bg-white px-3 py-1.5 text-[11px] font-bold text-[#DC2626]"><X size={11} /> Remove</button>}
            </div>
            {progress > 0 && (
                <div className="h-2 overflow-hidden rounded-full bg-[#E2E8F0]">
                    <div className="h-full rounded-full bg-[#1E8AF7] transition-all" style={{ width: `${progress}%` }} />
                </div>
            )}
            <button onClick={upload} disabled={uploading || !file} className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
                {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />} Upload & Scan
            </button>

            {/* Existing import */}
            {importRecord && (
                <div className={`rounded-xl border p-4 ${importRecord.status === "rejected" ? "border-[#FCA5A5] bg-[#FEF2F2]" : "border-[#BBF7D0] bg-[#F0FDF4]"}`}>
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-black text-[#0F172A]">Current import — {importRecord.originalFilename}</p>
                            <p className="mt-1 text-[11px] text-[#64748B]">Status: <span className="font-black capitalize">{importRecord.status}</span></p>
                        </div>
                        {importRecord.status === "validated" && (
                            <button onClick={() => convert(importRecord._id)} disabled={converting} className="flex items-center gap-1.5 rounded-lg bg-[#1E8AF7] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
                                {converting ? <Loader2 size={12} className="animate-spin" /> : null} Convert to Managed Schema
                            </button>
                        )}
                    </div>
                    {importRecord.status === "rejected" && importRecord.rejectionReasons?.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                            {importRecord.rejectionReasons.map((r, i) => (
                                <li key={i} className="text-[11px] font-semibold text-[#991B1B]">• {r}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── TAB: Content editor ──────────────────────────────────────────────────────
function TabContent({ storefrontId, adminRequest }) {
    const [pages, setPages] = useState([]);
    const [selected, setSelected] = useState(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/pages");
            setLoading(false);
            if (res?.success) {
                setPages(res.data || []);
                if (res.data?.length) setSelected(res.data[0].pageId);
            }
        };
        load();
    }, [adminRequest]);

    useEffect(() => {
        if (!selected) return;
        const load = async () => {
            const res = await adminRequest(`/seller/managed-storefront/sections/${selected}`);
            if (res?.success) setSections(res.data || []);
        };
        load();
    }, [selected, adminRequest]);

    const updateSection = (sIdx, field, value) => {
        setSections(prev => {
            const next = [...prev];
            next[sIdx] = { ...next[sIdx], editedContent: { ...(next[sIdx].editedContent || {}), [field]: value } };
            return next;
        });
        setDirty(true);
    };

    const saveContent = async () => {
        setSaving(true);
        for (const section of sections.filter(s => s.editedContent)) {
            await adminRequest("/seller/managed-storefront/section", "PATCH", {
                pageId: selected,
                sectionId: section.sectionId,
                editedContent: section.editedContent,
            });
        }
        setSaving(false);
        setDirty(false);
        toast.success("Content saved.");
    };

    if (loading) return <div className="flex items-center gap-2 py-10 text-sm font-bold text-[#64748B]"><Loader2 className="animate-spin" size={18} /> Loading content…</div>;

    return (
        <div className="space-y-5">
            <Banner icon={Info} color="blue">
                Only text content can be edited here. Layout, structure, and JavaScript remain as-imported. Storvia applies edits non-destructively on top of your imported schema.
            </Banner>

            {/* Page selector */}
            {pages.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                    {pages.map(p => (
                        <button key={p.pageId} onClick={() => setSelected(p.pageId)} className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${selected === p.pageId ? "bg-[#1E8AF7] text-white" : "border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#1E8AF7]"}`}>
                            {p.title || p.pageId}
                        </button>
                    ))}
                </div>
            )}

            {sections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
                    <FileText className="mx-auto h-8 w-8 text-[#94A3B8]" />
                    <p className="mt-2 text-sm font-bold text-[#64748B]">No editable text sections detected.</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">Import and convert a design first to enable content editing.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sections.map((section, sIdx) => (
                        <div key={section.sectionId || sIdx} className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                            <p className="mb-3 text-xs font-black text-[#0F172A]">{section.label || `Section ${sIdx + 1}`}</p>
                            <div className="space-y-3">
                                {(section.textNodes || []).map((node, nIdx) => (
                                    <Field key={nIdx} label={node.tag?.toUpperCase() || "TEXT"} helper={`Selector: ${node.selector}`}>
                                        {node.tag === "p" || node.tag === "span" ? (
                                            <TA
                                                value={(section.editedContent?.[node.id] ?? node.text) || ""}
                                                onChange={e => updateSection(sIdx, node.id, e.target.value)}
                                            />
                                        ) : (
                                            <TI
                                                value={(section.editedContent?.[node.id] ?? node.text) || ""}
                                                onChange={e => updateSection(sIdx, node.id, e.target.value)}
                                            />
                                        )}
                                    </Field>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <SaveBar dirty={dirty} saving={saving} onSave={saveContent} onDiscard={() => { setSections([]); setDirty(false); }} />
        </div>
    );
}

// ─── TAB: Images ─────────────────────────────────────────────────────────────
function TabImages({ storefrontId, adminRequest }) {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState({});
    const [filterPage, setFilterPage] = useState("all");
    const [search, setSearch] = useState("");
    const fileRefs = useRef({});

    const loadImages = useCallback(async () => {
        setLoading(true);
        try {
            const res = await adminRequest("/seller/managed-storefront/images");
            if (res?.success) setImages(res.data || []);
        } catch {
            toast.error("Could not load images. Check that the backend is running.");
        } finally {
            setLoading(false);
        }
    }, [adminRequest]);

    useEffect(() => { loadImages(); }, [loadImages]);

    const pageOptions = useMemo(() => {
        const pages = new globalThis.Map();
        images.forEach((img) => {
            if (img.pageId) pages.set(img.pageId, img.pageTitle || img.pageId);
        });
        return Array.from(pages.entries());
    }, [images]);

    const filteredImages = useMemo(() => {
        return images.filter((img) => {
            const matchesPage = filterPage === "all" || img.pageId === filterPage;
            const hay = `${img.alt || ""} ${img.originalName || ""} ${img.pageTitle || ""} ${img.sectionLabel || ""}`.toLowerCase();
            const matchesSearch = !search.trim() || hay.includes(search.trim().toLowerCase());
            return matchesPage && matchesSearch;
        });
    }, [images, filterPage, search]);

    const displayUrl = (img) => resolveAssetUrl(img.replacedUrl || img.originalUrl);

    const replaceImage = async (imageId, file, pageId, sectionId) => {
        if (String(imageId).startsWith("asset_")) {
            toast.error("Pick a mapped slot below to replace. Library assets are read-only references.");
            return;
        }
        setSaving((prev) => ({ ...prev, [imageId]: true }));
        const fd = new FormData();
        fd.append("image", file);
        fd.append("imageId", imageId);
        if (pageId) fd.append("pageId", pageId);
        if (sectionId) fd.append("sectionId", sectionId);
        const res = await adminRequest("/seller/managed-storefront/image", "PATCH", fd);
        setSaving((prev) => ({ ...prev, [imageId]: false }));
        if (res?.success) {
            toast.success("Image replaced.");
            await loadImages();
            window.dispatchEvent(new Event("storvia:store-updated"));
        } else {
            toast.error(res?.message || "Failed to replace image.");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-10 text-sm font-bold text-[#64748B]">
                <Loader2 className="animate-spin" size={18} /> Loading images…
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <Banner icon={Info} color="blue">
                All images detected in your imported design appear here. Replace any image with your brand photo — changes apply to draft and live store after publish.
            </Banner>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setFilterPage("all")}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filterPage === "all" ? "bg-[#1E8AF7] text-white" : "border border-[#E2E8F0] bg-white text-[#64748B]"}`}
                    >
                        All ({images.length})
                    </button>
                    {pageOptions.map(([id, title]) => (
                        <button
                            key={id}
                            onClick={() => setFilterPage(id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${filterPage === id ? "bg-[#1E8AF7] text-white" : "border border-[#E2E8F0] bg-white text-[#64748B]"}`}
                        >
                            {title}
                        </button>
                    ))}
                </div>
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search images…"
                    className="h-9 w-full sm:w-48 rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-semibold outline-none focus:border-[#1E8AF7]"
                />
            </div>

            {filteredImages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-[#94A3B8]" />
                    <p className="mt-2 text-sm font-bold text-[#64748B]">No images found.</p>
                    <p className="mt-1 text-xs text-[#94A3B8]">Import a design package or adjust your filters.</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredImages.map((img) => {
                        const isLibrary = img.isLibraryAsset;
                        const url = displayUrl(img);
                        return (
                            <div key={`${img.pageId}_${img.imageId}`} className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
                                <div className="relative aspect-[4/3] w-full bg-[#F8FBFF]">
                                    <img
                                        src={url}
                                        alt={img.alt || img.originalName || "Design image"}
                                        className="h-full w-full object-contain p-2"
                                        onError={(e) => { e.currentTarget.src = "https://placehold.co/400x300?text=Image+unavailable"; }}
                                    />
                                    {img.replacedUrl && (
                                        <span className="absolute top-2 right-2 rounded-full bg-[#16A34A] px-2 py-0.5 text-[10px] font-black text-white">Replaced</span>
                                    )}
                                    {isLibrary && (
                                        <span className="absolute top-2 left-2 rounded-full bg-[#64748B] px-2 py-0.5 text-[10px] font-black text-white">Asset</span>
                                    )}
                                </div>
                                <div className="space-y-2 border-t border-[#E2E8F0] p-3">
                                    <p className="text-xs font-black text-[#0F172A] truncate">{img.alt || img.originalName || "Image"}</p>
                                    <p className="text-[10px] font-semibold text-[#94A3B8] truncate">
                                        {img.pageTitle || img.pageId}{img.sectionLabel ? ` · ${img.sectionLabel}` : ""}
                                    </p>
                                    {!isLibrary && (
                                        <>
                                            <input
                                                ref={(el) => { fileRefs.current[img.imageId] = el; }}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        replaceImage(img.imageId, e.target.files[0], img.pageId, img.sectionId);
                                                        e.target.value = "";
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => fileRefs.current[img.imageId]?.click()}
                                                disabled={saving[img.imageId]}
                                                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] py-2 text-[11px] font-black text-[#0F172A] hover:border-[#1E8AF7] disabled:opacity-60"
                                            >
                                                {saving[img.imageId] ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                                                Replace Image
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ─── TAB: Colors ─────────────────────────────────────────────────────────────
function TabColors({ adminRequest }) {
    const [colors, setColors] = useState({ primary: "#1E8AF7", secondary: "#0F172A", accent: "#F59E0B", background: "#FFFFFF", text: "#0F172A", muted: "#64748B" });
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/colors");
            if (res?.success && res.data) setColors(prev => ({ ...prev, ...res.data }));
        };
        load();
    }, [adminRequest]);

    const update = (k, v) => { setColors(prev => ({ ...prev, [k]: v })); setDirty(true); };

    const save = async () => {
        setSaving(true);
        const res = await adminRequest("/seller/managed-storefront/colors", "PATCH", { colors });
        setSaving(false);
        if (res?.success) { toast.success("Colors saved."); setDirty(false); }
        else toast.error("Failed to save colors.");
    };

    const colorEntries = [
        { key: "primary", label: "Primary (buttons, links, accents)" },
        { key: "secondary", label: "Secondary (dark backgrounds)" },
        { key: "accent", label: "Accent (highlights, badges)" },
        { key: "background", label: "Page background" },
        { key: "text", label: "Body text" },
        { key: "muted", label: "Muted / secondary text" },
    ];

    return (
        <div className="space-y-5">
            <Banner icon={Info} color="amber">
                Colors apply CSS variable overrides on top of your imported design. They won&apos;t replace hardcoded hex values in your CSS — only values using CSS custom properties (var(--color-*)) will be affected.
            </Banner>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-4">
                {colorEntries.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-4">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#E2E8F0] shadow-sm">
                            <input type="color" value={colors[key] || "#000000"} onChange={e => update(key, e.target.value)} className="absolute inset-0 h-full w-full cursor-pointer border-0 p-0 opacity-100" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-[#0F172A]">{label}</p>
                            <p className="text-[10px] font-bold text-[#94A3B8]">--color-{key}</p>
                        </div>
                        <input value={colors[key] || ""} onChange={e => update(key, e.target.value)} className="h-8 w-28 rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-2 text-xs font-black outline-none focus:border-[#1E8AF7]" />
                    </div>
                ))}
            </div>
            <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setDirty(false)} />
        </div>
    );
}

// ─── TAB: Navigation ─────────────────────────────────────────────────────────
function TabNavigation({ adminRequest }) {
    const [items, setItems] = useState([]);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/navigation");
            if (res?.success) setItems(res.data || []);
        };
        load();
    }, [adminRequest]);

    const addItem = () => { setItems(prev => [...prev, { label: "", url: "", isExternal: false }]); setDirty(true); };
    const updateItem = (i, k, v) => { setItems(prev => { const n = [...prev]; n[i] = { ...n[i], [k]: v }; return n; }); setDirty(true); };
    const removeItem = i => { setItems(prev => prev.filter((_, idx) => idx !== i)); setDirty(true); };

    const save = async () => {
        setSaving(true);
        const res = await adminRequest("/seller/managed-storefront/navigation", "PATCH", { items });
        setSaving(false);
        if (res?.success) { toast.success("Navigation saved."); setDirty(false); }
        else toast.error("Failed to save navigation.");
    };

    return (
        <div className="space-y-5">
            <Banner icon={Info} color="blue">
                Navigation is managed by Storvia. These links replace the navigation in your imported design. Internal Storvia pages (checkout, account, cart) are always available.
            </Banner>
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-3">
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                            <TI value={item.label} onChange={e => updateItem(i, "label", e.target.value)} placeholder="Link label (e.g. Shop)" />
                            <TI value={item.url} onChange={e => updateItem(i, "url", e.target.value)} placeholder="/shop or https://…" />
                        </div>
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-[#64748B]">
                            <input type="checkbox" checked={item.isExternal || false} onChange={e => updateItem(i, "isExternal", e.target.checked)} /> External
                        </label>
                        <button onClick={() => removeItem(i)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#DC2626]">
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <button onClick={addItem} className="w-full rounded-xl border-2 border-dashed border-[#E2E8F0] py-3 text-sm font-bold text-[#64748B] hover:border-[#1E8AF7] hover:text-[#1E8AF7]">
                    + Add navigation link
                </button>
            </div>
            <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setDirty(false)} />
        </div>
    );
}

// ─── TAB: Products ────────────────────────────────────────────────────────────
function TabProducts({ adminRequest }) {
    const [config, setConfig] = useState({ source: "newest_products", limit: 8, showPrice: true, showAddToCart: true, gridColumns: 4, pageId: "home", sectionId: "" });
    const [availableSections, setAvailableSections] = useState([]);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/product-mapping");
            if (res?.success && res.data) {
                setConfig((prev) => ({ ...prev, ...res.data }));
            }
            if (res?.availableSections) {
                setAvailableSections(res.availableSections);
            }
        };
        load();
    }, [adminRequest]);

    const update = (k, v) => { setConfig(prev => ({ ...prev, [k]: v })); setDirty(true); };

    const save = async () => {
        setSaving(true);
        const res = await adminRequest("/seller/managed-storefront/product-mapping", "PATCH", config);
        setSaving(false);
        if (res?.success) { toast.success("Product grid settings saved."); setDirty(false); }
        else toast.error(res?.message || "Failed to save product settings.");
    };

    return (
        <div className="space-y-5">
            <Banner icon={Shield} color="green">
                <strong>Commerce is always Storvia-controlled.</strong> Product data, inventory, cart, checkout, payments, and order management are fully managed by Storvia. Your imported design only displays products.
            </Banner>
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-5">
                {availableSections.length > 1 && (
                    <Field label="Product grid section">
                        <select value={config.sectionId || ""} onChange={(e) => update("sectionId", e.target.value)} className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold outline-none focus:border-[#1E8AF7]">
                            {availableSections.map((s) => (
                                <option key={s.sectionId} value={s.sectionId}>{s.label || s.sectionId} ({s.pageId})</option>
                            ))}
                        </select>
                    </Field>
                )}
                <Field label="Product source for homepage grid">
                    <div className="grid gap-2 sm:grid-cols-2">
                        {[["newest_products", "Newest products"], ["best_sellers", "Best sellers"], ["new_arrival", "New arrivals"], ["featured_products", "Featured products"], ["manual_products", "Manually selected"]].map(([v, l]) => (
                            <button key={v} onClick={() => update("source", v)} className={`rounded-xl border p-3 text-left transition text-xs font-black ${config.source === v ? "border-[#1E8AF7] bg-[#E8F3FF]" : "border-[#E2E8F0] bg-white hover:border-[#93C5FD]"}`}>
                                {config.source === v && <Check size={12} className="inline mr-1 text-[#1E8AF7]" />}{l}
                            </button>
                        ))}
                    </div>
                </Field>
                <Field label="Number of products to display">
                    <select value={config.limit} onChange={e => update("limit", Number(e.target.value))} className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold outline-none focus:border-[#1E8AF7]">
                        {[4, 8, 12, 16, 24].map(n => <option key={n} value={n}>{n} products</option>)}
                    </select>
                </Field>
                <Field label="Grid columns (desktop)">
                    <div className="flex gap-2">
                        {[2, 3, 4].map(n => (
                            <button key={n} onClick={() => update("gridColumns", n)} className={`flex-1 rounded-lg border py-2 text-xs font-black transition ${config.gridColumns === n ? "border-[#1E8AF7] bg-[#E8F3FF] text-[#1E8AF7]" : "border-[#E2E8F0] bg-white text-[#64748B]"}`}>{n} cols</button>
                        ))}
                    </div>
                </Field>
                <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                        <input type="checkbox" checked={config.showPrice} onChange={e => update("showPrice", e.target.checked)} /> Show price
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                        <input type="checkbox" checked={config.showAddToCart} onChange={e => update("showAddToCart", e.target.checked)} /> Show Add to Cart button
                    </label>
                </div>
            </div>
            <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setDirty(false)} />
        </div>
    );
}

// ─── TAB: SEO ─────────────────────────────────────────────────────────────────

// ─── TAB: Route Map ───────────────────────────────────────────────────────────
const STORIVA_ROUTE_SUGGESTIONS = [
    { label: "Home", value: "/" },
    { label: "Product catalog", value: "/products" },
    { label: "About (custom page)", value: "/pages/about" },
    { label: "Contact", value: "/contact" },
    { label: "Cart", value: "/cart" },
    { label: "Checkout", value: "/checkout" },
    { label: "Track order", value: "/order-tracking" },
    { label: "FAQ (custom page)", value: "/pages/faq" },
    { label: "Wishlist (custom page)", value: "/pages/wishlist" },
    { label: "Privacy (custom page)", value: "/pages/privacy-policy" },
    { label: "Terms (custom page)", value: "/pages/terms" },
    { label: "Custom page", value: "/pages/your-page" },
];

function TabLinks({ adminRequest }) {
    const [data, setData] = useState({ pages: [], links: [], uniqueRoutes: [], stats: {} });
    const [loadingLinks, setLoadingLinks] = useState(true);
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [autoMapping, setAutoMapping] = useState(false);

    const load = async () => {
        setLoadingLinks(true);
        const res = await adminRequest("/seller/managed-storefront/links");
        if (res?.success) setData(res.data || { pages: [], links: [], uniqueRoutes: [], stats: {} });
        setLoadingLinks(false);
    };

    useEffect(() => { load(); }, [adminRequest]);

    const updatePageRoute = (pageId, route) => {
        setData(prev => ({
            ...prev,
            pages: prev.pages.map(p => p.id === pageId ? { ...p, storivaRoute: route } : p)
        }));
        setDirty(true);
    };

    const autoMapAll = async () => {
        setAutoMapping(true);
        const res = await adminRequest("/seller/managed-storefront/route-map/auto-generate", "POST");
        setAutoMapping(false);
        if (res?.success) {
            toast.success("All routes auto-mapped.");
            await load();
            setDirty(false);
        } else {
            toast.error("Could not auto-map routes.");
        }
    };

    const save = async () => {
        setSaving(true);
        const pageMappings = data.pages.map(p => ({ pageId: p.id, storivaRoute: p.storivaRoute || "" }));
        const res = await adminRequest("/seller/managed-storefront/links", "PATCH", { pageMappings });
        setSaving(false);
        if (res?.success) {
            toast.success("Route map saved.");
            setDirty(false);
            await load();
        } else {
            toast.error("Failed to save route map.");
        }
    };

    const stats = data.stats || {};
    const mappedCount = stats.mappedLinks ?? data.links.filter(l => l.storivaRoute).length;
    const totalLinks = stats.totalLinks ?? data.links.length;

    if (loadingLinks) return (
        <div className="flex items-center justify-center gap-3 py-20 text-sm font-bold text-[#64748B]">
            <Loader2 className="animate-spin h-5 w-5" /> Loading route map…
        </div>
    );

    if (!data.pages.length) return (
        <div className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FBFF] p-10 text-center">
            <Link2 className="mx-auto mb-3 h-8 w-8 text-[#CBD5E1]" />
            <p className="text-sm font-bold text-[#64748B]">No pages detected yet</p>
            <p className="mt-1 text-xs text-[#94A3B8]">Upload and convert a design ZIP first. Storiva will detect your HTML pages and map navigation automatically.</p>
        </div>
    );

    return (
        <div className="space-y-5">
            <Banner icon={Link2} color="blue">
                <strong>What this does:</strong> Your imported HTML uses filenames like <code>about.html</code> and <code>shop.html</code>. Storiva needs each page mapped to a real store URL (e.g. <code>/pages/about</code>, <code>/products</code>). Once mapped here, the same route applies to every nav link across all pages — you do not map each link separately.
                {totalLinks > 0 && (
                    <> <strong>{mappedCount}/{totalLinks}</strong> navigation links covered from <strong>{data.pages.length}</strong> page routes.</>
                )}
            </Banner>

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="button"
                    onClick={autoMapAll}
                    disabled={autoMapping}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-4 py-2 text-xs font-bold text-white hover:bg-[#1570CD] disabled:opacity-60"
                >
                    {autoMapping ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Auto-map all routes
                </button>
                <p className="text-[11px] text-[#64748B]">Detects page types and assigns Storiva URLs. Publish after saving.</p>
            </div>

            <div>
                <p className="mb-2 text-xs font-black text-[#0F172A]">Imported pages → Storiva routes</p>
                <div className="space-y-2">
                    {data.pages.map(page => {
                        const pageFile = page.fileName || (page.id === "home" ? "index.html" : page.id + ".html");
                        return (
                            <div
                                key={page.id}
                                className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white p-4 sm:flex-row sm:items-center"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <code className="rounded bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-mono font-bold text-[#334155]">{pageFile}</code>
                                        {page.id === "home" && <span className="rounded bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-bold text-[#166534]">Homepage</span>}
                                        {page.storivaRoute && <span className="flex items-center gap-1 rounded bg-[#E0F2FE] px-2 py-0.5 text-[10px] font-bold text-[#0369A1]"><CheckCircle2 size={10} /> {page.storivaRoute}</span>}
                                    </div>
                                    <p className="mt-0.5 text-[11px] text-[#64748B]">{page.title}</p>
                                </div>
                                <div className="flex items-center gap-2 sm:w-64 shrink-0">
                                    <input
                                        type="text"
                                        list={"routes-" + page.id}
                                        value={page.storivaRoute || ""}
                                        onChange={e => updatePageRoute(page.id, e.target.value)}
                                        placeholder={page.id === "home" ? "/" : `/pages/${page.slug || page.id}`}
                                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold text-[#0F172A] outline-none focus:border-[#1E8AF7] focus:bg-white"
                                    />
                                    <datalist id={"routes-" + page.id}>
                                        {STORIVA_ROUTE_SUGGESTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </datalist>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {data.uniqueRoutes?.length > 0 && (
                <details className="rounded-xl border border-[#E2E8F0]">
                    <summary className="flex cursor-pointer items-center justify-between gap-3 p-4 text-xs font-black text-[#0F172A] hover:bg-[#F8FBFF]">
                        <span>Unique link targets ({data.uniqueRoutes.length}) — usually matches pages above</span>
                        <ChevronRight size={14} className="text-[#94A3B8]" />
                    </summary>
                    <div className="overflow-x-auto border-t border-[#E2E8F0]">
                        <table className="w-full text-xs">
                            <thead className="bg-[#F8FBFF]">
                                <tr>
                                    <th className="px-3 py-2 text-left font-black text-[#475569]">Original href</th>
                                    <th className="px-3 py-2 text-left font-black text-[#475569]">Storiva route</th>
                                    <th className="px-3 py-2 text-left font-black text-[#475569]">Used on</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F1F5F9]">
                                {data.uniqueRoutes.map((route, i) => (
                                    <tr key={i} className="hover:bg-[#F8FBFF]">
                                        <td className="px-3 py-2"><code className="text-[10px] text-[#64748B]">{route.originalHref}</code></td>
                                        <td className="px-3 py-2"><code className="text-[10px] text-[#0369A1]">{route.storivaRoute || "—"}</code></td>
                                        <td className="px-3 py-2 text-[#64748B]">{route.usedOnPages} page{route.usedOnPages !== 1 ? "s" : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </details>
            )}

            <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => { setDirty(false); load(); }} />
        </div>
    );
}

function TabSEO({ adminRequest }) {
    const [seo, setSeo] = useState({ title: "", description: "", image: "", indexingEnabled: true });
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/seo");
            if (res?.success && res.data) setSeo(prev => ({ ...prev, ...res.data }));
        };
        load();
    }, [adminRequest]);

    const update = (k, v) => { setSeo(prev => ({ ...prev, [k]: v })); setDirty(true); };

    const save = async () => {
        setSaving(true);
        const res = await adminRequest("/seller/managed-storefront/seo", "PATCH", { pageId: "home", ...seo });
        setSaving(false);
        if (res?.success) { toast.success("SEO settings saved."); setDirty(false); }
        else toast.error("Failed to save SEO settings.");
    };

    return (
        <div className="space-y-5">
            <Banner icon={Lock} color="blue">
                Storvia fully controls SEO: sitemaps, robots.txt, canonical URLs, and structured data. Your imported design cannot override these.
            </Banner>
            <div className="space-y-4">
                <Field label="SEO title" helper="Appears in search results. ~60 characters recommended.">
                    <TI value={seo.title} onChange={e => update("title", e.target.value)} placeholder="Your Store Name | Tagline" maxLength={70} />
                    <p className="mt-1 text-[11px] text-[#94A3B8]">{seo.title.length}/70</p>
                </Field>
                <Field label="Meta description" helper="Appears below your title in search results. ~155 characters recommended.">
                    <TA value={seo.description} onChange={e => update("description", e.target.value)} placeholder="Describe your store for search engines." maxLength={165} />
                    <p className="mt-1 text-[11px] text-[#94A3B8]">{seo.description.length}/165</p>
                </Field>
                <Field label="Social preview image URL" helper="OG image for social sharing. 1200×630px recommended.">
                    <TI value={seo.image} onChange={e => update("image", e.target.value)} placeholder="https://…" />
                </Field>
                <label className="flex items-center gap-2 text-xs font-bold text-[#0F172A]">
                    <input type="checkbox" checked={seo.indexingEnabled} onChange={e => update("indexingEnabled", e.target.checked)} />
                    Allow search engines to index this store
                </label>
            </div>
            {/* Social preview card */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
                <p className="mb-3 text-xs font-black text-[#0F172A]">Search result preview</p>
                <div className="rounded-lg border border-[#E2E8F0] p-3">
                    <p className="text-sm font-black text-[#1A73E8]">{seo.title || "Your Store Title"}</p>
                    <p className="text-xs text-[#0D6E4F]">storvia.com/store/your-store</p>
                    <p className="mt-1 text-xs text-[#4B4B4B]">{seo.description || "Your store meta description will appear here."}</p>
                </div>
            </div>
            <SaveBar dirty={dirty} saving={saving} onSave={save} onDiscard={() => setDirty(false)} />
        </div>
    );
}

// ─── Shared store preview frame ───────────────────────────────────────────────
function StorePreviewFrame({ storeSlug, device = "desktop", iframeKey = 0, compact = false }) {
    const [frameLoading, setFrameLoading] = useState(true);
    const spec = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;
    const frameHeight = device === "mobile" ? 700 : device === "tablet" ? 640 : 620;

    useEffect(() => {
        setFrameLoading(true);
    }, [iframeKey, device, storeSlug]);

    if (!storeSlug) {
        return (
            <div className="flex h-64 w-full items-center justify-center rounded-xl bg-[#2A2A2A] text-sm font-bold text-gray-400">
                Store not published yet — complete setup to preview.
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center">
            {!compact && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {spec.label} · {device === "desktop" ? "1280px max" : spec.maxWidth}
                </p>
            )}
            <div
                className="relative overflow-hidden rounded-xl bg-white shadow-2xl transition-all duration-300"
                style={{ width: spec.width, maxWidth: spec.maxWidth, height: frameHeight }}
            >
                {frameLoading && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-white">
                        <Loader2 className="h-6 w-6 animate-spin text-[#1E8AF7]" />
                        <span className="text-[11px] font-bold text-[#64748B]">Loading preview…</span>
                    </div>
                )}
                <iframe
                    key={`${iframeKey}-${device}`}
                    src={`/store/${storeSlug}?preview=true&embed=1`}
                    title="Store preview"
                    onLoad={() => setFrameLoading(false)}
                    style={{ width: "100%", height: "100%", border: "none", display: "block" }}
                />
            </div>
        </div>
    );
}

// ─── TAB: Preview ─────────────────────────────────────────────────────────────
function TabPreview({ storeSlug }) {
    const [device, setDevice] = useState("desktop");
    const [iframeKey, setIframeKey] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const refresh = () => setIframeKey((k) => k + 1);
        window.addEventListener("storvia:store-updated", refresh);
        return () => window.removeEventListener("storvia:store-updated", refresh);
    }, []);

    return (
        <div className="space-y-4">
            <Banner icon={Eye} color="blue">
                Preview uses your <strong>draft</strong> storefront. Device buttons resize the frame — desktop caps at 1280px, tablet at 768px, mobile at 390px.
            </Banner>
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-2">
                {[["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]].map(([d, Icon, label]) => (
                    <button key={d} onClick={() => setDevice(d)} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition ${device === d ? "bg-[#1E8AF7] text-white" : "text-[#64748B] hover:bg-[#F8FBFF]"}`}>
                        <Icon size={14} /> {label}
                    </button>
                ))}
                <div className="ml-auto flex items-center gap-2">
                    <button type="button" onClick={() => setIframeKey((k) => k + 1)} className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#64748B] hover:border-[#1E8AF7]">
                        <RefreshCw size={13} /> Reload
                    </button>
                    {storeSlug && (
                        <a href={`/store/${storeSlug}?preview=true`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-black text-[#0F172A] hover:border-[#1E8AF7]">
                            <ExternalLink size={13} /> Open full tab
                        </a>
                    )}
                </div>
            </div>
            <div className="overflow-auto rounded-2xl border border-[#E2E8F0] bg-[#1E1E1E] p-6 flex items-start justify-center" style={{ minHeight: 680 }}>
                <StorePreviewFrame storeSlug={storeSlug} device={device} iframeKey={iframeKey} />
            </div>
        </div>
    );
}

// ─── TAB: Versions ────────────────────────────────────────────────────────────
function TabVersions({ adminRequest }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rolling, setRolling] = useState(null);

    useEffect(() => {
        const load = async () => {
            const res = await adminRequest("/seller/managed-storefront/versions");
            setLoading(false);
            if (res?.success) setVersions(res.data || []);
        };
        load();
    }, [adminRequest]);

    const rollback = async (versionId) => {
        setRolling(versionId);
        const res = await adminRequest(`/seller/managed-storefront/rollback/${versionId}`, "POST");
        setRolling(null);
        if (res?.success) toast.success("Rolled back successfully.");
        else toast.error(res?.message || "Rollback failed.");
    };

    if (loading) return <div className="flex items-center gap-2 py-10 text-sm font-bold text-[#64748B]"><Loader2 className="animate-spin" size={18} /> Loading versions…</div>;

    return (
        <div className="space-y-5">
            <Banner icon={History} color="blue">
                Every publish creates a version snapshot. You can roll back to any previous version without data loss.
            </Banner>
            {versions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E2E8F0] p-8 text-center">
                    <History className="mx-auto h-8 w-8 text-[#94A3B8]" />
                    <p className="mt-2 text-sm font-bold text-[#64748B]">No versions yet. Publish your store to create the first version snapshot.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {versions.map((v, i) => (
                        <div key={v._id} className={`flex items-center justify-between gap-3 rounded-xl border p-4 ${i === 0 ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E2E8F0] bg-white"}`}>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-black text-[#0F172A]">Version {v.version}</p>
                                    {i === 0 && <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[10px] font-black text-[#16A34A]">Current</span>}
                                </div>
                                <p className="mt-0.5 text-[11px] text-[#64748B]">{new Date(v.createdAt).toLocaleString()}</p>
                                {v.label && <p className="text-[11px] font-semibold text-[#64748B]">{v.label}</p>}
                            </div>
                            {i > 0 && (
                                <button onClick={() => rollback(v._id)} disabled={rolling === v._id} className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-black text-[#0F172A] hover:border-[#1E8AF7] disabled:opacity-60">
                                    {rolling === v._id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />} Rollback
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── TAB: Settings ────────────────────────────────────────────────────────────
function TabSettings({ storefrontId, adminRequest, importRecord }) {
    const [publishing, setPublishing] = useState(false);
    const [resyncing, setResyncing] = useState(false);

    const publish = async () => {
        setPublishing(true);
        await adminRequest("/seller/managed-storefront/resync-schema", "POST");
        const res = importRecord?._id
            ? await adminRequest(`/seller/design-import/${importRecord._id}/publish`, "POST")
            : await adminRequest("/seller/managed-storefront/publish", "POST");
        setPublishing(false);
        if (res?.success) {
            toast.success("Storefront published!");
            window.dispatchEvent(new Event("storvia:store-updated"));
        } else toast.error(res?.message || "Publish failed.");
    };

    const resyncSchema = async () => {
        setResyncing(true);
        const res = await adminRequest("/seller/managed-storefront/resync-schema", "POST");
        setResyncing(false);
        if (res?.success) {
            toast.success("Routes and assets resynced.");
            window.dispatchEvent(new Event("storvia:store-updated"));
        } else {
            toast.error(res?.message || "Resync failed.");
        }
    };

    return (
        <div className="space-y-5">
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 space-y-4">
                <p className="text-sm font-black text-[#0F172A]">Publish controls</p>
                <Banner icon={Zap} color="blue">
                    Publishing applies all your content, color, navigation, and product configuration to the live storefront. A version snapshot is created automatically.
                </Banner>
                <div className="flex flex-wrap gap-2">
                    <button onClick={publish} disabled={publishing} className="flex items-center gap-2 rounded-xl bg-[#16A34A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#15803D] disabled:opacity-60">
                        {publishing ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />} Publish Storefront
                    </button>
                    <button onClick={resyncSchema} disabled={resyncing} className="flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 py-2.5 text-sm font-bold text-[#0F172A] hover:border-[#93C5FD] disabled:opacity-60">
                        {resyncing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Resync routes &amp; assets
                    </button>
                </div>
            </div>
            <div className="rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-5 space-y-3">
                <p className="text-sm font-black text-[#92400E]">Danger zone</p>
                <p className="text-xs font-semibold text-[#92400E]">Removing your imported design will revert your storefront to a blank placeholder. Product, order, and customer data will not be affected.</p>
                <button className="flex items-center gap-2 rounded-xl border border-[#FCA5A5] bg-white px-4 py-2 text-xs font-bold text-[#DC2626] hover:bg-[#FEF2F2]">
                    <X size={13} /> Remove imported design
                </button>
            </div>
        </div>
    );
}

// ─── Main ImportedStoreManager component ─────────────────────────────────────
export default function ImportedStoreManager({ initialTab = "overview" }) {
    const { adminRequest, activeStore } = useAdmin();
    const [tab, setTab] = useState(initialTab || "overview");
    const [storefrontStatus, setStorefrontStatus] = useState(null);
    const [importRecord, setImportRecord] = useState(null);
    const [loading, setLoading] = useState(true);
    const [liveDevice, setLiveDevice] = useState("desktop");
    const [iframeKey, setIframeKey] = useState(0);

    const storeSlug = activeStore?.storeSlug;
    const storefrontId = storefrontStatus?._id;

    const loadStatus = useCallback(async () => {
        setLoading(true);
        try {
            const [sfRes, impRes] = await Promise.allSettled([
                adminRequest("/seller/managed-storefront"),
                adminRequest("/seller/design-import"),
            ]);
            if (sfRes.status === "fulfilled" && sfRes.value?.success) setStorefrontStatus(sfRes.value.data);
            if (impRes.status === "fulfilled" && impRes.value?.success && impRes.value.data?.length > 0) {
                setImportRecord(impRes.value.data[0]);
            }
            if (sfRes.status === "rejected" && impRes.status === "rejected") {
                toast.error("Could not reach the server. Is the backend running?");
            }
        } catch {
            toast.error("Failed to load storefront manager.");
        } finally {
            setLoading(false);
        }
    }, [adminRequest]);

    useEffect(() => { loadStatus(); }, [loadStatus]);

    // Sync tab only when route-provided initialTab changes (not on every internal tab click)
    useEffect(() => {
        setTab(initialTab || "overview");
    }, [initialTab]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const handleUpdate = () => {
            setIframeKey(prev => prev + 1);
        };
        window.addEventListener("storvia:store-updated", handleUpdate);
        return () => window.removeEventListener("storvia:store-updated", handleUpdate);
    }, []);

    const handleImportSuccess = (record) => {
        setImportRecord(record);
        setTab("overview");
        loadStatus();
    };

    const renderTab = () => {
        switch (tab) {
            case "overview": return <TabOverview storefrontStatus={storefrontStatus} importRecord={importRecord} storeSlug={storeSlug} onGoTo={setTab} />;
            case "import": return <TabImport importRecord={importRecord} onImportSuccess={handleImportSuccess} adminRequest={adminRequest} />;
            case "content": return <TabContent storefrontId={storefrontId} adminRequest={adminRequest} />;
            case "images": return <TabImages storefrontId={storefrontId} adminRequest={adminRequest} />;
            case "colors": return <TabColors adminRequest={adminRequest} />;
            case "navigation": return <TabNavigation adminRequest={adminRequest} />;
            case "products": return <TabProducts adminRequest={adminRequest} />;
            case "links": return <TabLinks adminRequest={adminRequest} />;
            case "seo": return <TabSEO adminRequest={adminRequest} />;
            case "preview": return <TabPreview storeSlug={storeSlug} />;
            case "versions": return <TabVersions adminRequest={adminRequest} />;
            case "settings": return <TabSettings storefrontId={storefrontId} adminRequest={adminRequest} importRecord={importRecord} />;
            default: return null;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center gap-3 py-20 text-sm font-bold text-[#64748B]">
            <Loader2 className="animate-spin h-5 w-5" /> Loading storefront manager…
        </div>
    );

    const activeTab = TABS.find(t => t.id === tab);
    const isEditingTab = ["content", "images", "colors", "navigation", "products", "seo"].includes(tab);

    return (
        <div className="flex min-h-[720px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm lg:flex-row">
            {/* Sidebar tabs */}
            <aside className="shrink-0 border-b border-[#E2E8F0] bg-[#F8FBFF] lg:w-56 lg:border-b-0 lg:border-r">
                <div className="border-b border-[#E2E8F0] px-4 py-4">
                    <p className="text-xs font-black text-[#0F172A]">Storefront</p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#64748B]">Build, review, then publish.</p>
                </div>
                <div className="flex gap-2 overflow-x-auto p-3 lg:block lg:space-y-4">
                    {TAB_GROUPS.map(group => (
                        <div key={group.label} className="min-w-max lg:min-w-0">
                            <p className="mb-1 hidden px-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#94A3B8] lg:block">{group.label}</p>
                            <div className="flex gap-1 lg:block lg:space-y-0.5">
                                {group.items.map(id => {
                                    const item = TABS.find(entry => entry.id === id);
                                    const Icon = item.icon;
                                    return (
                                        <button key={id} onClick={() => setTab(id)} className={`flex min-w-max shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition lg:w-full lg:min-w-0 ${tab === id ? "bg-[#1E8AF7] text-white shadow-sm" : "text-[#64748B] hover:bg-white hover:text-[#1E8AF7]"}`}>
                                            <Icon size={15} className="shrink-0" />
                                            <span className="text-xs font-black">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Content & optional preview split */}
            <div className="flex-1 flex flex-col min-w-0">
                <div className="border-b border-[#E2E8F0] bg-white px-5 py-4">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold text-[#1E8AF7]">Storefront Manager</p>
                            <h2 className="text-lg font-black text-[#0F172A]">{activeTab?.label}</h2>
                        </div>
                        {storefrontStatus?.status === "published" && <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-[10px] font-black text-[#166534]">Live</span>}
                    </div>
                </div>
                
                <div className="flex-1 flex flex-col lg:flex-row min-h-0">
                    {/* Editor Panel */}
                    <div className={`p-5 overflow-auto ${isEditingTab ? "lg:w-[min(100%,480px)] lg:shrink-0 lg:border-r lg:border-[#E2E8F0]" : "flex-1"}`}>
                        {renderTab()}
                    </div>

                    {/* Split-pane Live Preview */}
                    {isEditingTab && (
                        <div className="hidden lg:flex flex-col flex-1 bg-[#1E1E1E] p-4 items-center justify-start sticky top-0 overflow-auto" style={{ height: "calc(100vh - 73px)" }}>
                            <div className="w-full flex items-center justify-between mb-3 text-white px-2 shrink-0">
                                <span className="text-xs font-black bg-[#1E8AF7] px-2.5 py-1 rounded-full">Live draft preview</span>
                                <div className="flex items-center gap-1.5 bg-[#2A2A2A] rounded-lg p-1">
                                    {[["desktop", Monitor, "Desktop"], ["tablet", Tablet, "Tablet"], ["mobile", Smartphone, "Mobile"]].map(([d, Icon, tooltip]) => (
                                        <button key={d} onClick={() => setLiveDevice(d)} title={tooltip} className={`p-1.5 rounded-md text-xs font-bold transition ${liveDevice === d ? "bg-[#1E8AF7] text-white" : "text-gray-400 hover:text-white"}`}>
                                            <Icon size={14} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <StorePreviewFrame storeSlug={storeSlug} device={liveDevice} iframeKey={iframeKey} compact />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
