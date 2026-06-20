"use client";

import { useAdmin } from "@/context/AdminContext";
import { useState, useEffect } from "react";
import { SearchBar, Button, Input } from "@/components/ui";
import ProductsCatalogNav from "@/components/admin/ProductsCatalogNav";
import { Plus, Edit2, Trash2, Tag, Layers } from "lucide-react";
import { Card, EmptyState, ModalShell, PageToolbar, SellerPageScaffold, SecondaryButton } from "@/components/storvia/SellerPageScaffold";

export default function CategoriesPage() {
    const { categories, addCategory, updateCategory, deleteCategory, loading, fetchCategories } = useAdmin();
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: "", description: "", slug: "" });

    const filteredCategories = categories.filter(c =>
        (c.title || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openCreateModal = () => {
        setModalMode("create");
        setFormData({ title: "", description: "", slug: "" });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setModalMode("edit");
        setFormData({
            title: category.title,
            description: category.description || "",
            slug: category.slug || ""
        });
        setEditingId(category._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this collection? This action cannot be undone.")) {
            await deleteCategory(id);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const slug = formData.slug || formData.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        const dataPayload = { ...formData, slug };

        if (modalMode === 'create') {
            await addCategory(dataPayload);
        } else {
            await updateCategory(editingId, dataPayload);
        }
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Organizing Collections...</p>
            </div>
        );
    }

    return (
        <SellerPageScaffold
            title="Categories"
            description="Organize your catalog into clear storefront collections."
            actions={<Button onClick={openCreateModal} icon={Plus}>Add category</Button>}
        >
            <ProductsCatalogNav />
            <PageToolbar><SearchBar placeholder="Search categories..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full md:max-w-sm" /><p className="text-xs font-bold text-[#64748B]">{filteredCategories.length} categories</p></PageToolbar>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                        <Card key={category._id} className="group p-5 transition hover:border-[#93C5FD] hover:shadow-md">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E8F3FF] text-[#1E8AF7]">
                                    <Layers size={20} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => openEditModal(category)} className="rounded-lg p-2 text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#1E8AF7]" title="Edit category">
                                        <Edit2 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(category._id)} className="rounded-lg p-2 text-[#64748B] hover:bg-red-50 hover:text-red-600" title="Delete category">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="mt-4 text-base font-black text-[#0F172A]">{category.title}</h3>
                            <p className="mt-1 min-h-10 line-clamp-2 text-sm leading-5 text-[#64748B]">
                                {category.description || "No description has been added yet."}
                            </p>
                            <div className="mt-5 flex items-center justify-between border-t border-[#E2E8F0] pt-4">
                                <div className="flex items-center gap-2">
                                    <Tag size={13} className="text-[#94A3B8]" />
                                    <span className="truncate text-xs font-semibold text-[#64748B]">/{category.slug}</span>
                                </div>
                                <span className="rounded-full bg-[#DCFCE7] px-2.5 py-1 text-[10px] font-black uppercase text-[#166534]">Active</span>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full"><EmptyState icon={Layers} title="No categories found" description="Create a category to make your catalog easier to browse." action={<Button onClick={openCreateModal} icon={Plus}>Add category</Button>} /></div>
                )}
            </div>

            <ModalShell open={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalMode === 'create' ? 'Add category' : 'Edit category'} description="Categories help customers browse related products.">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Category name"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Skincare"
                                />

                                <Input
                                    label="URL slug"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    placeholder="skincare"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-bold text-[#0F172A]">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="min-h-28 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-[#1E8AF7]"
                                    placeholder="What products belong in this category?"
                                />
                            </div>
                            <div className="flex justify-end gap-2 border-t border-[#E2E8F0] pt-4">
                                <SecondaryButton type="button" onClick={() => setIsModalOpen(false)}>Cancel</SecondaryButton>
                                <Button type="submit">
                                    {modalMode === 'create' ? 'Save Collection' : 'Update Collection'}
                                </Button>
                            </div>
                        </form>
            </ModalShell>
        </SellerPageScaffold>
    );
}
