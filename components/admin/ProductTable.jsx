"use client";

import { Edit, Trash2, Globe, EyeOff, FileText } from "lucide-react";
import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import AdminTable from "./AdminTable";
import { resolveImageUrl } from "@/utils/upload";
import { useAdmin } from "@/context/AdminContext";

const PRODUCT_TYPE_LABELS = {
    featured: "Featured",
    best_seller: "Best seller",
    new_arrival: "New arrival",
    standard: "Standard",
};

function resolveProductType(product) {
    if (product?.productType && product.productType !== "standard") return product.productType;
    if (product?.isFeatured) return "featured";
    if (product?.isBestSeller) return "best_seller";
    if (product?.isNewArrival) return "new_arrival";
    return "standard";
}

const ProductTable = ({ products, onEdit, onDelete, onBulkDelete }) => {
    const [selectedProducts, setSelectedProducts] = useState([]);
    const { categories } = useAdmin();

    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(products.map(p => p._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const toggleSelect = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(sid => sid !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'active':
            case 'published': return 'bg-green-50 text-green-700 border-green-200';
            case 'inactive':
            case 'draft': return 'bg-neutral-100 text-neutral-600 border-neutral-200';
            case 'hidden': return 'bg-gray-100 text-gray-500 border-gray-200';
            case 'low stock': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
            case 'out of stock': return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-neutral-50 text-neutral-500 border-neutral-200';
        }
    };

    const getStatusIcon = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'active':
            case 'published': return <Globe size={12} />;
            case 'hidden': return <EyeOff size={12} />;
            case 'inactive':
            case 'draft': return <FileText size={12} />;
            default: return null;
        }
    };

    const getStatusLabel = (status) => {
        const s = status?.toLowerCase();
        if (s === 'active') return 'Published';
        if (s === 'inactive') return 'Draft';
        return status || 'Unknown';
    };

    const resolveCategoryTitle = (productCategory) => {
        if (productCategory == null) return "Uncategorized";

        // If it's an array (multiple categories)
        if (Array.isArray(productCategory)) {
            if (productCategory.length === 0) return "Uncategorized";
            const titles = productCategory.map(cat => {
                if (cat == null) return "Uncategorized";
                if (typeof cat === 'object' && cat.title) return cat.title;
                if (typeof cat === 'string') {
                    const found = categories?.find(c => c._id === cat);
                    return found ? found.title : cat;
                }
                return "Unknown";
            });
            return titles.join(", ");
        }

        // Single object/string handling (legacy or single category)
        if (productCategory && typeof productCategory === 'object' && productCategory.title) return productCategory.title;

        if (typeof productCategory === 'string' && categories?.length > 0) {
            const found = categories.find(c => c._id === productCategory);
            if (found) return found.title;
        }

        if (typeof productCategory === 'string' && productCategory.length < 20) return productCategory;

        return "Uncategorized";
    };

    return (
        <div className="space-y-4">
            {selectedProducts.length > 0 && (
                <div className="bg-[#1E8AF7] text-white px-6 py-3 rounded-xl flex items-center justify-between animate-fadeIn">
                    <span className="text-sm font-medium">{selectedProducts.length} products selected</span>
                    <div className="flex gap-4">
                        <button className="text-sm hover:underline font-bold">Bulk Publish</button>
                        <button onClick={() => onBulkDelete(selectedProducts)} className="text-sm hover:underline font-bold text-red-300">Bulk Delete</button>
                    </div>
                </div>
            )}

            <AdminTable
                    columns={[
                        {
                            id: 'select',
                            header: ({ table }) => (
                                <input
                                    type="checkbox"
                                    onChange={table.getToggleAllRowsSelectedHandler()}
                                    checked={table.getIsAllRowsSelected()}
                                    className="w-4 h-4 rounded border-neutral-300 text-[#1E8AF7] cursor-pointer"
                                />
                            ),
                            cell: ({ row }) => (
                                <input
                                    type="checkbox"
                                    checked={row.getIsSelected()}
                                    onChange={row.getToggleSelectedHandler()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-4 h-4 rounded border-neutral-300 text-[#1E8AF7] cursor-pointer"
                                />
                            ),
                        },
                        {
                            id: 'title',
                            header: 'Product',
                            cell: ({ row }) => {
                                const product = row.original;
                                return (
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-[#E2E8F0]">
                                            <img
                                                src={resolveImageUrl(product.images?.[0])}
                                                alt={product.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = "https://placehold.co/100x100/F8FBFF/64748B?text=No+Image";
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-bold text-[#0F172A]">{product.title}</p>
                                            <p className="text-xs text-[#64748B] mt-0.5">{product.slug}</p>
                                        </div>
                                    </div>
                                );
                            }
                        },
                        {
                            accessorKey: 'category',
                            header: 'Category',
                            cell: ({ row }) => (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-100">
                                    {resolveCategoryTitle(row.original.category)}
                                </span>
                            )
                        },
                        {
                            id: 'price',
                            header: 'Price',
                            cell: ({ row }) => {
                                const product = row.original;
                                return (
                                    <div className="flex flex-col">
                                        <span className="font-bold text-[#0F172A]">
                                            {formatPrice(product.salePrice ?? product.price)}
                                        </span>
                                        {product.salePrice && (
                                            <span className="text-[10px] text-neutral-400 line-through">{formatPrice(product.price)}</span>
                                        )}
                                    </div>
                                );
                            }
                        },
                        {
                            id: 'productType',
                            header: 'Type',
                            cell: ({ row }) => {
                                const type = resolveProductType(row.original);
                                const label = PRODUCT_TYPE_LABELS[type] || 'Standard';
                                const tone = type === 'featured'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : type === 'best_seller'
                                        ? 'bg-orange-50 text-orange-700 border-orange-200'
                                        : type === 'new_arrival'
                                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                                            : 'bg-neutral-50 text-neutral-500 border-neutral-200';
                                return (
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${tone}`}>
                                        {label}
                                    </span>
                                );
                            }
                        },
                        {
                            id: 'stock',
                            header: 'Stock',
                            cell: ({ row }) => (
                                <div className="flex flex-col">
                                    <span className={`text-sm font-bold ${row.original.stock < 5 ? 'text-red-500' : 'text-neutral-700'}`}>
                                        {row.original.stock}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 font-medium tracking-wider uppercase">Units</span>
                                </div>
                            )
                        },
                        {
                            accessorKey: 'status',
                            header: 'Status',
                            cell: ({ row }) => (
                                <span
                                    className={`
                                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border
                                        ${getStatusStyles(row.original.status)}
                                    `}
                                >
                                    {getStatusIcon(row.original.status)}
                                    {getStatusLabel(row.original.status)}
                                </span>
                            )
                        },
                        {
                            id: 'actions',
                            header: 'Actions',
                            cell: ({ row }) => (
                                <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                    <button
                                        onClick={() => onEdit(row.original)}
                                        className="p-2 text-neutral-400 hover:text-[#1E8AF7] hover:bg-[#E8F3FF] rounded-xl transition-all"
                                        title="Edit Product"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => onDelete(row.original._id)}
                                        className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Product"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            )
                        }
                    ]}
                    data={products}
                />
        </div>
    );
};

export default ProductTable;
