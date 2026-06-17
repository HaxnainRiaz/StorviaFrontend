"use client";

import React, { useState } from "react";
import { Button, Input, SearchBar } from "@/components/ui";
import { Plus, Edit2, ToggleLeft, ToggleRight, Trash2, X, FileText, CheckCircle, HelpCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function PagesManagerPage() {
    const [pages, setPages] = useState([
        { id: 1, title: "About Us", slug: "about-us", status: "Published", updated: "2026-05-10 14:30" },
        { id: 2, title: "Contact Us", slug: "contact-us", status: "Published", updated: "2026-05-12 09:15" },
        { id: 3, title: "Shipping Policy", slug: "shipping-policy", status: "Published", updated: "2026-05-15 11:22" },
        { id: 4, title: "Return Policy", slug: "return-policy", status: "Published", updated: "2026-05-18 16:45" },
        { id: 5, title: "Privacy Policy", slug: "privacy-policy", status: "Published", updated: "2026-05-20 10:05" },
        { id: 6, title: "Terms and Conditions", slug: "terms-and-conditions", status: "Draft", updated: "2026-05-25 15:10" },
    ]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ id: null, title: "", slug: "" });
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'

    const handleToggleStatus = (id) => {
        setPages(pages.map(page => {
            if (page.id === id) {
                const newStatus = page.status === "Published" ? "Draft" : "Published";
                toast.success(`Page status changed to ${newStatus}`);
                return { ...page, status: newStatus, updated: new Date().toISOString().slice(0, 16).replace("T", " ") };
            }
            return page;
        }));
    };

    const handleDelete = (id) => {
        if (confirm("Are you sure you want to delete this custom page?")) {
            setPages(pages.filter(page => page.id !== id));
            toast.success("Page deleted successfully!");
        }
    };

    const handleOpenCreate = () => {
        setModalMode("create");
        setFormData({ id: null, title: "", slug: "" });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (page) => {
        setModalMode("edit");
        setFormData({ id: page.id, title: page.title, slug: page.slug });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const currentDate = new Date().toISOString().slice(0, 16).replace("T", " ");

        if (modalMode === "create") {
            const newPage = {
                id: Date.now(),
                title: formData.title,
                slug,
                status: "Draft",
                updated: currentDate
            };
            setPages([newPage, ...pages]);
            toast.success("New custom page created as Draft!");
        } else {
            setPages(pages.map(p => p.id === formData.id ? { ...p, title: formData.title, slug, updated: currentDate } : p));
            toast.success("Page details updated successfully!");
        }
        setIsModalOpen(false);
    };

    const filteredPages = pages.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Pages Manager</h1>
                    <p className="text-[#6B6B6B] text-sm font-medium mt-1">Add, edit, and publish static informative store pages</p>
                </div>
                <div className="flex items-center gap-4">
                    <SearchBar
                        placeholder="Search pages..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-48 md:w-64"
                    />
                    <Button onClick={handleOpenCreate} icon={Plus}>
                        Create Page
                    </Button>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-[2rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-[#F5F3F0] bg-[#FDFCFB]">
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Page Title</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Slug (Route URL)</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Status</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em]">Last Updated</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-[#0a4019] uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#F5F3F0]">
                            {filteredPages.length > 0 ? (
                                filteredPages.map((page) => (
                                    <tr key={page.id} className="hover:bg-neutral-50/50 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-[#d3d3d3]/20 flex items-center justify-center text-[#0a4019]">
                                                    <FileText size={16} />
                                                </div>
                                                <span className="text-sm font-bold text-[#0a4019]">{page.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-neutral-400 font-bold uppercase tracking-wider">
                                            /{page.slug}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${
                                                page.status === "Published"
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                    : "bg-neutral-50 text-neutral-500 border-neutral-200"
                                            }`}>
                                                {page.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-xs text-[#6B6B6B] font-medium">
                                            {page.updated}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(page.id)}
                                                    className="p-2 text-neutral-400 hover:text-[#0a4019] transition-colors"
                                                    title={page.status === "Published" ? "Make Draft" : "Publish"}
                                                >
                                                    {page.status === "Published" ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEdit(page)}
                                                    className="p-2 text-neutral-400 hover:text-[#0a4019] transition-colors"
                                                    title="Edit Page Properties"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(page.id)}
                                                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors"
                                                    title="Delete Page"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="py-24 text-center">
                                        <FileText className="mx-auto text-neutral-200 mb-4" size={48} />
                                        <h3 className="text-xl font-heading font-bold text-[#0a4019]">No Pages Located</h3>
                                        <p className="text-[#6B6B6B] text-xs mt-2 font-medium">Try resetting filters or build a new page tier.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation / Editing Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a4019]/30 backdrop-blur-xl animate-fadeIn">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-[0_16px_60px_rgba(11,47,38,0.15)] max-w-lg w-full mx-4 border border-white animate-scaleIn">
                        <div className="flex items-center justify-between mb-10">
                            <div>
                                <h3 className="text-3xl font-heading font-bold text-[#0a4019] italic">
                                    {modalMode === "create" ? "Build Custom Page" : "Modify Page Tier"}
                                </h3>
                                <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">Expanding Static Archives</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-neutral-100 rounded-full text-neutral-300 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Page Title *"
                                required
                                value={formData.title}
                                onChange={(e) => {
                                    const title = e.target.value;
                                    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
                                    setFormData({ ...formData, title, slug });
                                }}
                                placeholder="e.g. Terms of Use"
                            />

                            <Input
                                label="Custom Page URL Route"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="terms-of-use"
                            />

                            <div className="pt-6 flex gap-4">
                                <Button type="button" onClick={() => setIsModalOpen(false)} variant="ghost" className="flex-1">
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1">
                                    {modalMode === "create" ? "Forge Page" : "Update Page"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
