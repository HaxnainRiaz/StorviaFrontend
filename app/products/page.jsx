"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import ProductTable from "@/components/admin/ProductTable";
import ProductsCatalogNav from "@/components/admin/ProductsCatalogNav";
import { SearchBar, Button, Dropdown, Input } from "@/components/ui";
import {
    Plus, X, Save, ArrowLeft, Trash2, Upload, Loader2,
    Globe, Package, Tag, Image as ImageIcon,
} from "lucide-react";
import "react-quill-new/dist/quill.snow.css";
import { uploadImage, validateImageFile, resolveImageUrl } from "@/utils/upload";
import { loadQuillContent } from "@/utils/quill";

const ReactQuill = dynamic(() => import("react-quill-new"), {
    ssr: false,
    loading: () => <div className="p-10 flex items-center justify-center text-neutral-500">Loading editor...</div>,
});

const fontSizes = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "30px", "36px", "48px", "60px", "72px"];

const quillFormats = [
    "header", "size",
    "bold", "italic", "underline", "strike",
    "color", "background",
    "list", "indent",
    "align",
    "link", "image",
    "styled-quote",
];

const PRODUCT_TYPES = [
    { value: "standard", label: "Standard" },
    { value: "featured", label: "Featured" },
    { value: "best_seller", label: "Best seller" },
    { value: "new_arrival", label: "New arrival" },
];

function slugify(text) {
    return String(text || "")
        .toLowerCase()
        .trim()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
}

function resolveProductType(product) {
    if (product?.productType && product.productType !== "standard") return product.productType;
    if (product?.isFeatured) return "featured";
    if (product?.isBestSeller) return "best_seller";
    if (product?.isNewArrival) return "new_arrival";
    return "standard";
}

function resolveCategoryId(product) {
    if (!product?.category) return "";
    if (Array.isArray(product.category)) {
        const first = product.category[0];
        return typeof first === "object" ? first._id : first;
    }
    return typeof product.category === "object" ? product.category._id : product.category;
}

const emptyProduct = {
    title: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    stock: "",
    category: "",
    mainImage: "",
    secondaryImages: [],
    productType: "standard",
    metaTitle: "",
    metaDescription: "",
    visibilityStatus: "published",
};

export default function ProductsPage() {
    const { products, addProduct, updateProduct, deleteProduct, categories, refreshData, fetchCategories } = useAdmin();
    const { addToast } = useToast();

    useEffect(() => {
        if (refreshData) refreshData();
        if (fetchCategories) fetchCategories();
    }, [refreshData, fetchCategories]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        Promise.all([
            import("react-quill-new"),
            import("@/utils/quill-custom-blots"),
        ]).then(([QuillNamespace, CustomBlots]) => {
            const Quill = QuillNamespace.default.Quill || QuillNamespace.Quill;
            CustomBlots.registerCustomBlots(Quill);
            const Size = Quill.import("attributors/style/size");
            Size.whitelist = fontSizes;
            Quill.register(Size, true);
        });
    }, []);

    const quillModules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            [{ size: fontSizes }],
            ["bold", "italic", "underline", "strike"],
            [{ color: [] }, { background: [] }],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            [{ align: [] }],
            ["link", "image"],
            ["clean"],
        ],
    }), []);

    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [bulkDeleteIds, setBulkDeleteIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState("");
    const [uploadingMain, setUploadingMain] = useState(false);
    const [uploadingGallery, setUploadingGallery] = useState(false);

    const handleEdit = (product) => {
        const images = Array.isArray(product.images) ? product.images : [];
        setCurrentProduct({
            ...emptyProduct,
            ...product,
            category: resolveCategoryId(product),
            mainImage: images[0] || "",
            secondaryImages: images.slice(1),
            productType: resolveProductType(product),
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
            visibilityStatus: product.status === "inactive" ? "draft" : "published",
        });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentProduct({ ...emptyProduct });
        setIsEditing(true);
    };

    const confirmDelete = (id) => {
        setProductToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const confirmBulkDelete = (ids) => {
        setBulkDeleteIds(ids);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (productToDelete) {
            const id = productToDelete;
            setProductToDelete(null);
            setIsDeleteModalOpen(false);
            const res = await deleteProduct(id);
            if (res?.success) addToast("Product deleted successfully", "info");
        } else if (bulkDeleteIds.length > 0) {
            const ids = [...bulkDeleteIds];
            setBulkDeleteIds([]);
            setIsDeleteModalOpen(false);
            let successCount = 0;
            for (const id of ids) {
                const res = await deleteProduct(id);
                if (res?.success) successCount++;
            }
            addToast(`Successfully deleted ${successCount} products`, "info");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setSaveError("");

        const finalSlug = currentProduct.slug || slugify(currentProduct.title);
        if (!finalSlug) {
            setSaveError("Title and slug are required.");
            setIsSaving(false);
            return;
        }

        const descriptionText = String(currentProduct.description || "").trim();
        if (!descriptionText || descriptionText === "[]" || descriptionText === '{"ops":[]}') {
            setSaveError("Product description is required.");
            setIsSaving(false);
            return;
        }

        const productData = {
            title: currentProduct.title.trim(),
            slug: finalSlug,
            description: descriptionText || "No description provided.",
            price: Number(currentProduct.price),
            salePrice: currentProduct.salePrice ? Number(currentProduct.salePrice) : null,
            stock: Number(currentProduct.stock),
            category: currentProduct.category || null,
            mainImage: currentProduct.mainImage || "",
            secondaryImages: currentProduct.secondaryImages || [],
            productType: currentProduct.productType || "standard",
            metaTitle: currentProduct.metaTitle || "",
            metaDescription: currentProduct.metaDescription || "",
            status: currentProduct.visibilityStatus === "draft" ? "inactive" : "active",
        };

        let res;
        if (currentProduct._id) {
            res = await updateProduct(currentProduct._id, productData);
        } else {
            res = await addProduct(productData);
        }

        if (res?.success) {
            setIsEditing(false);
            setCurrentProduct(null);
            addToast(`Product ${currentProduct._id ? "updated" : "created"} successfully`, "success");
        } else {
            setSaveError(res?.message || "Failed to save product. Check required fields.");
            addToast("Failed to save product", "error");
        }
        setIsSaving(false);
    };

    const uploadSingleImage = async (file, target) => {
        const validation = validateImageFile(file);
        if (!validation.valid) {
            addToast(`${file.name}: ${validation.error}`, "error");
            return;
        }

        const setUploading = target === "main" ? setUploadingMain : setUploadingGallery;
        setUploading(true);
        const preview = URL.createObjectURL(file);

        if (target === "main") {
            setCurrentProduct((prev) => ({ ...prev, mainImage: preview }));
        } else {
            setCurrentProduct((prev) => ({
                ...prev,
                secondaryImages: [...(prev.secondaryImages || []), preview],
            }));
        }

        try {
            const serverUrl = await uploadImage(file);
            if (target === "main") {
                setCurrentProduct((prev) => ({
                    ...prev,
                    mainImage: prev.mainImage === preview ? serverUrl : serverUrl,
                }));
            } else {
                setCurrentProduct((prev) => ({
                    ...prev,
                    secondaryImages: (prev.secondaryImages || []).map((img) =>
                        img === preview ? serverUrl : img
                    ),
                }));
            }
        } catch (err) {
            if (target === "main") {
                setCurrentProduct((prev) => ({ ...prev, mainImage: "" }));
            } else {
                setCurrentProduct((prev) => ({
                    ...prev,
                    secondaryImages: (prev.secondaryImages || []).filter((img) => img !== preview),
                }));
            }
            addToast(`Upload failed: ${err.message}`, "error");
        } finally {
            URL.revokeObjectURL(preview);
            setUploading(false);
        }
    };

    const handleMainUpload = async (e) => {
        const file = e.target.files?.[0];
        if (file) await uploadSingleImage(file, "main");
        e.target.value = "";
    };

    const handleGalleryUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            await uploadSingleImage(file, "gallery");
        }
        e.target.value = "";
    };

    const removeSecondaryImage = (index) => {
        setCurrentProduct((prev) => ({
            ...prev,
            secondaryImages: (prev.secondaryImages || []).filter((_, i) => i !== index),
        }));
    };

    const filteredProducts = products.filter((p) => {
        const titleMatch = (p.title || "").toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = Array.isArray(p.category)
            ? p.category.some((c) => (typeof c === "object" ? c.title : "").toLowerCase().includes(searchTerm.toLowerCase()))
            : false;
        return titleMatch || categoryMatch;
    });

    if (!isEditing) {
        return (
            <div className="space-y-6">
                <ProductsCatalogNav />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[#0F172A]">Products</h1>
                        <p className="text-[#64748B] text-sm">Manage your store catalog</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <SearchBar
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                        />
                        <Button onClick={handleAddNew} icon={Plus}>Add Product</Button>
                    </div>
                </div>
                <ProductTable
                    products={filteredProducts}
                    onEdit={handleEdit}
                    onDelete={confirmDelete}
                    onBulkDelete={confirmBulkDelete}
                />
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl border border-[#E2E8F0]">
                            <h3 className="text-lg font-bold text-[#0F172A] mb-2">
                                Delete {bulkDeleteIds.length > 0 ? `${bulkDeleteIds.length} products` : "product"}
                            </h3>
                            <p className="text-sm text-[#64748B] mb-6">
                                This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setIsDeleteModalOpen(false); setProductToDelete(null); setBulkDeleteIds([]); }}
                                    className="px-4 py-2 rounded-xl border border-[#E2E8F0] text-sm font-bold"
                                >
                                    Cancel
                                </button>
                                <button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-neutral-100 rounded-full">
                    <ArrowLeft size={20} className="text-[#0F172A]" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">
                        {currentProduct._id ? "Edit product" : "Add product"}
                    </h1>
                    <p className="text-sm text-[#64748B]">Unified product fields for any store type</p>
                </div>
            </div>

            {saveError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                    {saveError}
                </div>
            )}

            <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Basic information</h2>
                        <Input
                            label="Title *"
                            value={currentProduct.title}
                            onChange={(e) => {
                                const title = e.target.value;
                                setCurrentProduct((prev) => ({
                                    ...prev,
                                    title,
                                    slug: prev.slug || slugify(title),
                                }));
                            }}
                            required
                        />
                        <Input
                            label="Slug (URL) *"
                            value={currentProduct.slug}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, slug: slugify(e.target.value) })}
                            required
                        />
                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Description *</label>
                            <div className="quill-premium-wrapper">
                                <ReactQuill
                                    theme="snow"
                                    value={loadQuillContent(currentProduct.description)}
                                    onChange={(content, delta, source, editor) => {
                                        const deltaJson = JSON.stringify(editor.getContents().ops);
                                        setCurrentProduct({ ...currentProduct, description: deltaJson });
                                    }}
                                    modules={quillModules}
                                    formats={quillFormats}
                                />
                            </div>
                        </div>
                        <Dropdown
                            label="Category"
                            value={currentProduct.category}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                            options={[
                                { value: "", label: "Select category" },
                                ...categories.map((cat) => ({ value: cat._id, label: cat.title })),
                            ]}
                        />
                    </section>

                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Pricing & inventory</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                label="Price *"
                                type="number"
                                min="0"
                                value={currentProduct.price}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, price: e.target.value })}
                                required
                            />
                            <Input
                                label="Discounted price"
                                type="number"
                                min="0"
                                value={currentProduct.salePrice || ""}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, salePrice: e.target.value })}
                                placeholder="Optional"
                            />
                            <Input
                                label="Available items *"
                                type="number"
                                min="0"
                                value={currentProduct.stock}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, stock: e.target.value })}
                                required
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 space-y-4">
                        <div className="flex items-center gap-2">
                            <Globe size={16} className="text-[#1E8AF7]" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">SEO</h2>
                        </div>
                        <Input
                            label="Meta title"
                            value={currentProduct.metaTitle}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, metaTitle: e.target.value })}
                            placeholder="Page title for search engines"
                        />
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Meta description</label>
                            <textarea
                                rows={3}
                                value={currentProduct.metaDescription}
                                onChange={(e) => setCurrentProduct({ ...currentProduct, metaDescription: e.target.value })}
                                className="w-full px-4 py-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#1E8AF7]"
                                placeholder="Short summary for search results (150–160 characters)"
                            />
                        </div>
                    </section>
                </div>

                <div className="space-y-6">
                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <ImageIcon size={16} className="text-[#1E8AF7]" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Images</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Main image *</label>
                            <div className="relative aspect-square rounded-xl border-2 border-dashed border-[#CBD5E1] overflow-hidden bg-[#F8FBFF]">
                                {currentProduct.mainImage ? (
                                    <>
                                        <img
                                            src={currentProduct.mainImage.startsWith("blob:") ? currentProduct.mainImage : resolveImageUrl(currentProduct.mainImage)}
                                            alt="Main"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCurrentProduct({ ...currentProduct, mainImage: "" })}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <label className="flex flex-col items-center justify-center h-full cursor-pointer hover:bg-[#EFF6FF] transition">
                                        {uploadingMain ? <Loader2 className="animate-spin text-[#1E8AF7]" /> : <Upload size={24} className="text-[#94A3B8]" />}
                                        <span className="mt-2 text-[10px] font-bold text-[#64748B] uppercase">Upload main image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleMainUpload} disabled={uploadingMain} />
                                    </label>
                                )}
                            </div>
                            {currentProduct.mainImage && (
                                <label className="block text-center text-[10px] font-bold text-[#1E8AF7] cursor-pointer uppercase">
                                    Replace main image
                                    <input type="file" accept="image/*" className="hidden" onChange={handleMainUpload} disabled={uploadingMain} />
                                </label>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
                                Secondary images ({currentProduct.secondaryImages?.length || 0})
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {(currentProduct.secondaryImages || []).map((img, idx) => (
                                    <div key={`${img}-${idx}`} className="relative aspect-square rounded-lg overflow-hidden border border-[#E2E8F0]">
                                        <img
                                            src={img.startsWith("blob:") ? img : resolveImageUrl(img)}
                                            alt={`Gallery ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSecondaryImage(idx)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square rounded-lg border-2 border-dashed border-[#CBD5E1] flex flex-col items-center justify-center cursor-pointer hover:bg-[#F8FBFF]">
                                    {uploadingGallery ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} className="text-[#94A3B8]" />}
                                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleGalleryUpload} disabled={uploadingGallery} />
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Tag size={16} className="text-[#1E8AF7]" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Product type</h2>
                        </div>
                        <div className="grid gap-2">
                            {PRODUCT_TYPES.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setCurrentProduct({ ...currentProduct, productType: value })}
                                    className={`rounded-xl border p-3 text-left text-xs font-bold transition ${
                                        currentProduct.productType === value
                                            ? "border-[#1E8AF7] bg-[#E8F3FF] text-[#1E8AF7]"
                                            : "border-[#E2E8F0] text-[#64748B] hover:border-[#93C5FD]"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <p className="text-[10px] text-[#94A3B8]">
                            Used for storefront sections: featured, best sellers, and new arrivals.
                        </p>
                    </section>

                    <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5 space-y-4">
                        <div className="flex items-center gap-2">
                            <Package size={16} className="text-[#1E8AF7]" />
                            <h2 className="text-sm font-black uppercase tracking-wider text-[#64748B]">Visibility</h2>
                        </div>
                        <Dropdown
                            label="Status"
                            value={currentProduct.visibilityStatus}
                            onChange={(e) => setCurrentProduct({ ...currentProduct, visibilityStatus: e.target.value })}
                            options={[
                                { value: "published", label: "Published" },
                                { value: "draft", label: "Draft" },
                            ]}
                        />
                    </section>

                    <Button
                        type="submit"
                        disabled={isSaving || uploadingMain || uploadingGallery}
                        variant="primary"
                        className="w-full h-12"
                        icon={isSaving ? null : Save}
                    >
                        {isSaving ? "Saving..." : "Save product"}
                    </Button>
                    <Button type="button" onClick={() => setIsEditing(false)} variant="outline" className="w-full">
                        Cancel
                    </Button>
                </div>
            </form>

            <style jsx global>{`
                .quill-premium-wrapper .ql-toolbar.ql-snow {
                    border: 1px solid #E2E8F0;
                    border-bottom: none;
                    background: white;
                    border-radius: 1rem 1rem 0 0;
                }
                .quill-premium-wrapper .ql-container.ql-snow {
                    border: 1px solid #E2E8F0;
                    min-height: 220px;
                    border-radius: 0 0 1rem 1rem;
                    background: white;
                    font-family: inherit;
                }
                .quill-premium-wrapper .ql-editor {
                    padding: 20px;
                    min-height: 220px;
                    color: #0F172A;
                    line-height: 1.7;
                }
                .quill-premium-wrapper .ql-snow .ql-picker.ql-size { width: 100px; }
                .quill-premium-wrapper .ql-snow .ql-stroke { stroke: #0F172A; }
                .quill-premium-wrapper .ql-snow .ql-fill { fill: #0F172A; }
                .quill-premium-wrapper .ql-snow .ql-picker { color: #0F172A; font-weight: 600; }
            `}</style>
        </div>
    );
}
