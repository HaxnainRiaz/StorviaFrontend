"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    ArrowLeft, Monitor, Tablet, Smartphone, Save, Rocket, Eye,
    Loader2, Layers, Image as ImageIcon, Palette, Map, MousePointer2,
    Type, Link2, RefreshCw, ChevronRight
} from "lucide-react";
import { useAdmin } from "@/context/AdminContext";
import { resolveAssetUrl } from "@/lib/storeUrl";
import { DEVICE_WIDTHS } from "@/lib/storefrontRoutes";

const LEFT_TABS = [
    { id: "pages", label: "Pages", icon: Layers },
    { id: "layers", label: "Layers", icon: MousePointer2 },
    { id: "assets", label: "Assets", icon: ImageIcon },
    { id: "colors", label: "Colors", icon: Palette },
    { id: "mappings", label: "Mappings", icon: Map },
];

function buildCanvasHtml(page, editableFields, assets = []) {
    if (!page?.sections?.length) return "";
    const fieldMap = new globalThis.Map();
    for (const f of editableFields.filter((e) => e.pageId === page.id)) {
        fieldMap.set(`${f.sectionId}__${f.fieldKey}`, f);
    }

    return page.sections.map((section) => {
        let html = section.html || "";
        if (!html) return "";
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div id="wrap">${html}</div>`, "text/html");
            const wrap = doc.getElementById("wrap");
            const textEls = wrap.querySelectorAll("h1,h2,h3,h4,h5,h6,p,a,button,span,li");
            const imgEls = wrap.querySelectorAll("img");

            (section.editableFields || []).forEach((field) => {
                const meta = fieldMap.get(`${section.id}__${field.key}`) || field;
                const parts = field.key.split("_");
                const idx = parseInt(parts[parts.length - 1], 10);
                if (field.type === "text" && !isNaN(idx) && textEls[idx]) {
                    textEls[idx].textContent = meta.draftValue ?? field.value ?? textEls[idx].textContent;
                    textEls[idx].setAttribute("data-storvia-editable-id", `${page.id}__${section.id}__${field.key}`);
                    textEls[idx].setAttribute("data-storvia-field-type", "text");
                    textEls[idx].classList.add("storvia-editable");
                }
                if (field.type === "image" && !isNaN(idx) && imgEls[idx]) {
                    const src = meta.draftValue ?? field.value;
                    if (src) imgEls[idx].setAttribute("src", resolveAssetUrl(src));
                    imgEls[idx].setAttribute("data-storvia-editable-id", `${page.id}__${section.id}__${field.key}`);
                    imgEls[idx].setAttribute("data-storvia-field-type", "image");
                    imgEls[idx].classList.add("storvia-editable");
                }
            });

            wrap.querySelectorAll("a[href]").forEach((a) => {
                if (!a.getAttribute("data-storvia-editable-id")) {
                    a.setAttribute("data-storvia-field-type", "link");
                    a.classList.add("storvia-editable-link");
                }
            });

            return wrap.innerHTML;
        } catch {
            return html;
        }
    }).join("");
}

export default function VisualStorefrontEditor() {
    const { adminRequest, activeStore } = useAdmin();
    const [schema, setSchema] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPageId, setCurrentPageId] = useState("home");
    const [leftTab, setLeftTab] = useState("pages");
    const [device, setDevice] = useState("desktop");
    const [selectedField, setSelectedField] = useState(null);
    const [editMode, setEditMode] = useState("select");
    const [dirty, setDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [publishing, setPublishing] = useState(false);
    const [publishChecklist, setPublishChecklist] = useState(null);
    const [commerceBindings, setCommerceBindings] = useState([]);
    const [inlineEdit, setInlineEdit] = useState(null);
    const canvasRef = useRef(null);

    const storeSlug = activeStore?.storeSlug || schema?.storeSlug;

    const loadSchema = useCallback(async (pageId = currentPageId) => {
        setLoading(true);
        try {
            const res = await adminRequest(`/seller/managed-storefront/editor-schema?pageId=${pageId}`);
            if (res?.success && res.data) {
                setSchema(res.data);
                setCurrentPageId(res.data.currentPageId || pageId);
            }
        } catch {
            toast.error("Failed to load editor.");
        } finally {
            setLoading(false);
        }
    }, [adminRequest, currentPageId]);

    useEffect(() => { loadSchema("home"); }, []);

    const loadCommerceBindings = useCallback(async () => {
        try {
            const res = await adminRequest("/seller/managed-storefront/commerce-bindings");
            if (res?.success) {
                setCommerceBindings(res.data || []);
                setPublishChecklist(res.checklist || null);
            }
        } catch { /* non-fatal */ }
    }, [adminRequest]);

    useEffect(() => { loadCommerceBindings(); }, [loadCommerceBindings]);

    const currentPage = useMemo(() => {
        if (!schema) return null;
        return schema.currentPage || schema.pages?.find((p) => p.id === currentPageId);
    }, [schema, currentPageId]);

    const pageFields = useMemo(() => {
        return (schema?.editableFields || []).filter((f) => f.pageId === currentPageId);
    }, [schema, currentPageId]);

    const canvasHtml = useMemo(() => {
        if (!currentPage) return "";
        return buildCanvasHtml(currentPage, schema?.editableFields || [], schema?.assets);
    }, [currentPage, schema]);

    const scopedCss = useMemo(() => {
        const raw = schema?.scopedCss || "";
        const slug = storeSlug || "store";
        return raw
            .replace(/\bhtml\b/g, `.storvia-editor-canvas-${slug}`)
            .replace(/\bbody\b/g, `.storvia-editor-canvas-${slug}`);
    }, [schema, storeSlug]);

    const handleCanvasClick = (e) => {
        const el = e.target.closest("[data-storvia-editable-id]");
        if (!el) {
            setSelectedField(null);
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        const fieldId = el.getAttribute("data-storvia-editable-id");
        const field = schema?.editableFields?.find((f) => f.id === fieldId);
        if (field) {
            setSelectedField(field);
            if (editMode === "text" && field.type === "text") {
                setInlineEdit({ fieldId, value: field.draftValue ?? "" });
            }
        }
    };

    const handleCanvasDoubleClick = (e) => {
        const el = e.target.closest("[data-storvia-field-type='text']");
        if (!el) return;
        e.preventDefault();
        const fieldId = el.getAttribute("data-storvia-editable-id");
        const field = schema?.editableFields?.find((f) => f.id === fieldId);
        if (field) {
            setSelectedField(field);
            setInlineEdit({ fieldId, value: field.draftValue ?? "" });
        }
    };

    const saveField = async (field, value) => {
        if (!field) return;
        setSaving(true);
        const res = await adminRequest(`/seller/managed-storefront/editable-fields/${field.id}`, "PATCH", {
            draftValue: value,
            pageId: field.pageId,
            sectionId: field.sectionId,
            fieldKey: field.fieldKey,
        });
        setSaving(false);
        if (res?.success) {
            setDirty(true);
            setSchema((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    editableFields: prev.editableFields.map((f) =>
                        f.id === field.id ? { ...f, draftValue: value } : f
                    ),
                };
            });
            toast.success("Saved to draft.");
            setInlineEdit(null);
        } else {
            toast.error("Could not save field.");
        }
    };

    const saveDraft = async () => {
        toast.success("Draft is saved automatically.");
        setDirty(false);
    };

    const publish = async () => {
        setPublishing(true);
        await adminRequest("/seller/managed-storefront/commerce-bindings/auto-detect", "POST");
        const res = await adminRequest("/seller/managed-storefront/publish", "POST", { strict: true });
        setPublishing(false);
        if (res?.success) {
            toast.success("Storefront published.");
            setDirty(false);
            window.dispatchEvent(new Event("storvia:store-updated"));
            loadCommerceBindings();
        } else {
            if (res?.checklist) setPublishChecklist(res.checklist);
            toast.error(res?.message || "Publish failed. Check commerce binding checklist.");
        }
    };

    const autoDetectBindings = async () => {
        const res = await adminRequest("/seller/managed-storefront/commerce-bindings/auto-detect", "POST");
        if (res?.success) {
            setCommerceBindings(res.data || []);
            setPublishChecklist(res.checklist || null);
            toast.success("Commerce bindings auto-detected.");
            loadSchema(currentPageId);
        } else {
            toast.error(res?.message || "Auto-detect failed.");
        }
    };

    const switchPage = (pageId) => {
        setCurrentPageId(pageId);
        setSelectedField(null);
        loadSchema(pageId);
    };

    if (loading && !schema) {
        return (
            <div className="flex h-screen items-center justify-center gap-2 text-sm font-bold text-[#64748B]">
                <Loader2 className="animate-spin" /> Loading visual editor…
            </div>
        );
    }

    if (!schema?.pages?.length) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 p-8 text-center">
                <Layers className="h-12 w-12 text-[#CBD5E1]" />
                <h2 className="text-lg font-black text-[#0F172A]">No imported store to edit</h2>
                <p className="max-w-md text-sm text-[#64748B]">Upload a design package first, then return here to edit visually.</p>
                <Link href="/app/storefront/import" className="rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-sm font-bold text-white">
                    Import design
                </Link>
            </div>
        );
    }

    const deviceSpec = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;

    return (
        <div className="flex h-screen flex-col bg-[#F1F5F9]">
            {/* Top toolbar */}
            <header className="flex h-16 shrink-0 items-center gap-3 border-b border-[#E2E8F0] bg-white px-4">
                <Link href="/app/storefront" className="flex items-center gap-1.5 text-xs font-bold text-[#64748B] hover:text-[#1E8AF7]">
                    <ArrowLeft size={14} /> Back
                </Link>
                <select
                    value={currentPageId}
                    onChange={(e) => switchPage(e.target.value)}
                    className="h-9 rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] px-3 text-xs font-bold"
                >
                    {schema.pages.map((p) => (
                        <option key={p.id} value={p.id}>{p.title || p.id}</option>
                    ))}
                </select>
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] p-1">
                    {[["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]].map(([d, Icon]) => (
                        <button key={d} onClick={() => setDevice(d)} className={`rounded-md p-1.5 ${device === d ? "bg-[#1E8AF7] text-white" : "text-[#64748B]"}`}>
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] p-1">
                    {[["select", MousePointer2], ["text", Type], ["image", ImageIcon]].map(([m, Icon]) => (
                        <button key={m} onClick={() => setEditMode(m)} title={m} className={`rounded-md p-1.5 ${editMode === m ? "bg-[#1E8AF7] text-white" : "text-[#64748B]"}`}>
                            <Icon size={14} />
                        </button>
                    ))}
                </div>
                {dirty && <span className="text-[10px] font-bold text-[#F59E0B]">Unsaved changes</span>}
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={() => loadSchema(currentPageId)} className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#64748B]">
                        <RefreshCw size={13} /> Reload
                    </button>
                    <button onClick={saveDraft} disabled={saving} className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0F172A]">
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save draft
                    </button>
                    {storeSlug && (
                        <a href={`/store/${storeSlug}?preview=true`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-bold text-[#0F172A]">
                            <Eye size={13} /> Preview
                        </a>
                    )}
                    <button onClick={publish} disabled={publishing} className="flex items-center gap-1 rounded-lg bg-[#16A34A] px-4 py-2 text-xs font-bold text-white">
                        {publishing ? <Loader2 size={13} className="animate-spin" /> : <Rocket size={13} />} Publish
                    </button>
                </div>
            </header>

            <div className="flex flex-1 min-h-0">
                {/* Left panel */}
                <aside className="w-[300px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col">
                    <div className="flex border-b border-[#E2E8F0]">
                        {LEFT_TABS.map(({ id, label, icon: Icon }) => (
                            <button key={id} onClick={() => setLeftTab(id)} title={label} className={`flex-1 p-2.5 ${leftTab === id ? "border-b-2 border-[#1E8AF7] text-[#1E8AF7]" : "text-[#94A3B8]"}`}>
                                <Icon size={15} className="mx-auto" />
                            </button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-auto p-3">
                        {leftTab === "pages" && schema.pages.map((p) => (
                            <button key={p.id} onClick={() => switchPage(p.id)} className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-bold ${currentPageId === p.id ? "bg-[#EFF6FF] text-[#1E8AF7]" : "text-[#64748B] hover:bg-[#F8FBFF]"}`}>
                                <span>{p.title || p.id}</span>
                                <ChevronRight size={12} />
                            </button>
                        ))}
                        {leftTab === "layers" && pageFields.map((f) => (
                            <button key={f.id} onClick={() => setSelectedField(f)} className={`mb-1 block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold ${selectedField?.id === f.id ? "bg-[#EFF6FF] text-[#1E8AF7]" : "text-[#64748B]"}`}>
                                <span className="uppercase text-[9px] text-[#94A3B8]">{f.type}</span>
                                <br />{f.label || f.fieldKey}
                            </button>
                        ))}
                        {leftTab === "colors" && (schema.colorTokens || []).map((c) => (
                            <div key={c.id} className="mb-2 flex items-center gap-2 rounded-lg border border-[#E2E8F0] p-2">
                                <span className="h-8 w-8 shrink-0 rounded-md border border-[#E2E8F0]" style={{ background: c.currentColor || c.originalColor }} />
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-bold text-[#0F172A]">{c.normalizedHex || c.originalColor}</p>
                                    <p className="text-[10px] text-[#94A3B8]">{c.source} · {c.usageCount || 1} uses</p>
                                </div>
                            </div>
                        ))}
                        {leftTab === "assets" && (schema.assets || []).slice(0, 30).map((a, i) => (
                            <div key={i} className="mb-2 rounded-lg border border-[#E2E8F0] p-2">
                                <img src={resolveAssetUrl(a.safeUrl)} alt="" className="h-16 w-full rounded object-cover" />
                                <p className="mt-1 truncate text-[10px] text-[#64748B]">{a.originalName}</p>
                            </div>
                        ))}
                        {leftTab === "mappings" && (
                            <div className="space-y-3">
                                <button onClick={autoDetectBindings} className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FBFF] py-2 text-xs font-bold text-[#1E8AF7] hover:bg-[#EFF6FF]">
                                    Auto-detect commerce bindings
                                </button>
                                <div className="rounded-lg border border-[#E2E8F0] p-3 space-y-2">
                                    <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Publish checklist</p>
                                    {(publishChecklist?.issues || []).length === 0 ? (
                                        <p className="text-xs font-bold text-emerald-600">Ready to publish</p>
                                    ) : (
                                        publishChecklist.issues.map((issue, i) => (
                                            <p key={i} className="text-xs font-semibold text-amber-700">{issue.message}</p>
                                        ))
                                    )}
                                </div>
                                {commerceBindings.map((b, i) => (
                                    <div key={i} className="rounded-lg border border-[#E2E8F0] p-2 text-xs">
                                        <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${b.status === "mapped" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {b.status}
                                        </span>
                                        <p className="mt-1 font-bold text-[#0F172A]">{b.bindingType}</p>
                                        <p className="text-[10px] text-[#94A3B8]">{b.sourceLabel || b.sourceSelector}</p>
                                    </div>
                                ))}
                                <Link href="/app/storefront/links" className="block text-xs font-bold text-[#1E8AF7] hover:underline">
                                    Open Route Map →
                                </Link>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Canvas */}
                <main className="flex-1 overflow-auto bg-[#1E1E1E] p-6 flex justify-center">
                    <div style={{ width: deviceSpec.width, maxWidth: deviceSpec.maxWidth }} className="transition-all duration-300">
                        <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400">{deviceSpec.label}</p>
                        <div
                            ref={canvasRef}
                            className={`storvia-editor-canvas-${storeSlug || "store"} bg-white shadow-2xl rounded-lg overflow-hidden`}
                            onClick={handleCanvasClick}
                            onDoubleClick={handleCanvasDoubleClick}
                        >
                            <style dangerouslySetInnerHTML={{ __html: scopedCss + `
                                .storvia-editable { outline: 2px dashed transparent; cursor: pointer; transition: outline .15s; }
                                .storvia-editable:hover { outline-color: #93C5FD; }
                                [data-storvia-editable-id].storvia-selected { outline: 2px solid #1E8AF7 !important; }
                            `}} />
                            <div dangerouslySetInnerHTML={{ __html: canvasHtml }} />
                            {inlineEdit && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                                    <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-2xl">
                                        <p className="mb-2 text-xs font-black text-[#0F172A]">Edit text</p>
                                        <textarea
                                            autoFocus
                                            value={inlineEdit.value}
                                            onChange={(e) => setInlineEdit({ ...inlineEdit, value: e.target.value })}
                                            className="h-28 w-full rounded-lg border border-[#E2E8F0] p-3 text-sm"
                                        />
                                        <div className="mt-3 flex justify-end gap-2">
                                            <button onClick={() => setInlineEdit(null)} className="rounded-lg px-3 py-1.5 text-xs font-bold text-[#64748B]">Cancel</button>
                                            <button
                                                onClick={() => {
                                                    const field = schema.editableFields.find((f) => f.id === inlineEdit.fieldId);
                                                    if (field) saveField(field, inlineEdit.value);
                                                }}
                                                className="rounded-lg bg-[#1E8AF7] px-4 py-1.5 text-xs font-bold text-white"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                {/* Right inspector */}
                <aside className="w-[360px] shrink-0 border-l border-[#E2E8F0] bg-white p-4 overflow-auto">
                    <h3 className="text-sm font-black text-[#0F172A]">Inspector</h3>
                    {!selectedField ? (
                        <div className="mt-4 space-y-3 text-xs text-[#64748B]">
                            <p>Click any highlighted text or image on the canvas to edit it here.</p>
                            <p><strong>{pageFields.length}</strong> editable fields on this page.</p>
                            <p><strong>{schema.colorTokens?.length || 0}</strong> colors extracted from your design CSS.</p>
                        </div>
                    ) : selectedField.type === "text" ? (
                        <div className="mt-4 space-y-3">
                            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Text</p>
                            <label className="block text-xs font-bold text-[#0F172A]">{selectedField.label}</label>
                            <textarea
                                value={selectedField.draftValue ?? ""}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setSelectedField({ ...selectedField, draftValue: v });
                                    setSchema((prev) => ({
                                        ...prev,
                                        editableFields: prev.editableFields.map((f) =>
                                            f.id === selectedField.id ? { ...f, draftValue: v } : f
                                        ),
                                    }));
                                }}
                                className="h-32 w-full rounded-lg border border-[#E2E8F0] p-3 text-sm"
                            />
                            <button onClick={() => saveField(selectedField, selectedField.draftValue)} className="w-full rounded-lg bg-[#1E8AF7] py-2 text-xs font-bold text-white">
                                Save to draft
                            </button>
                        </div>
                    ) : selectedField.type === "image" ? (
                        <div className="mt-4 space-y-3">
                            <p className="text-[10px] font-bold uppercase text-[#94A3B8]">Image</p>
                            <img src={resolveAssetUrl(selectedField.draftValue)} alt="" className="w-full rounded-lg border border-[#E2E8F0]" />
                            <p className="text-xs text-[#64748B]">Use Images tab or asset library for full replacement workflow.</p>
                            <Link href="/app/storefront/images" className="block text-center text-xs font-bold text-[#1E8AF7]">
                                Open asset manager →
                            </Link>
                        </div>
                    ) : (
                        <p className="mt-4 text-xs text-[#64748B]">Inspector for {selectedField.type} coming soon.</p>
                    )}
                </aside>
            </div>
        </div>
    );
}
