"use client";

import { useAdmin } from "@/context/AdminContext";
import { useToast } from "@/context/ToastContext";
import { useState, useEffect } from "react";
import { Search, AlertTriangle, CheckCircle, Package, Trash2, Plus, ArrowLeftRight, Save } from "lucide-react";
import { SearchBar, Button } from "@/components/ui";
import ProductsCatalogNav from "@/components/admin/ProductsCatalogNav";
import Link from "next/link";
import AdminTable from "@/components/admin/AdminTable";
import { resolveImageUrl } from "@/utils/upload";
import { ModalShell, SellerPageScaffold, SecondaryButton } from "@/components/storvia/SellerPageScaffold";

export default function InventoryPage() {
    const { products, updateProduct, deleteProduct, loading, fetchProducts } = useAdmin();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    const { addToast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [localStocks, setLocalStocks] = useState({}); // { productId: stockValue }
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);

    // Sync local stocks when products load
    useEffect(() => {
        if (products.length > 0) {
            const stocks = {};
            products.forEach(p => {
                stocks[p._id] = p.stock;
            });
            setLocalStocks(stocks);
        }
    }, [products]);

    const filteredProducts = products.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleLocalStockChange = (id, newVal) => {
        const val = Math.max(0, parseInt(newVal) || 0);
        setLocalStocks(prev => ({ ...prev, [id]: val }));
    };

    const handleSaveStock = async (id) => {
        setIsUpdating(true);
        const res = await updateProduct(id, { stock: localStocks[id] });
        if (res?.success) addToast('Stock updated successfully', 'success');
        setIsUpdating(false);
    };

    const confirmDelete = (id) => {
        setIdToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const executeDelete = async () => {
        if (idToDelete) {
            const res = await deleteProduct(idToDelete);
            if (res?.success) addToast('Asset decommissioned', 'info');
            setIsDeleteModalOpen(false);
            setIdToDelete(null);
        }
    };

    const handleBatchUpdate = async () => {
        setIsUpdating(true);
        // In a real app we'd have a batch endpoint, for now we do them sequentially but quietly
        for (const [id, stock] of Object.entries(localStocks)) {
            const originalProduct = products.find(p => p._id === id);
            if (originalProduct && originalProduct.stock !== stock) {
                await updateProduct(id, { stock });
            }
        }
        setIsUpdating(false);
        addToast("Inventory synchronized successfully!", "success");
    };

    if (loading && Object.keys(localStocks).length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Auditing Stock Records...</p>
            </div>
        );
    }

    return (
        <SellerPageScaffold title="Inventory" description="Monitor stock health and update available quantities." actions={<div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={handleBatchUpdate} disabled={isUpdating} icon={Save}>Save changes</Button><Link href="/app/products"><Button icon={Plus}>Add product</Button></Link></div>}>
            <ProductsCatalogNav />

            {/* Inventory Alerts Bar */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600"><AlertTriangle size={22} /></div>
                    <div className="relative">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Out of stock</p>
                        <p className="text-2xl font-black text-[#0F172A]">{products.filter(p => p.stock === 0).length} products</p>
                    </div>
                </div>
                <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><ArrowLeftRight size={22} /></div>
                    <div className="relative">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Low stock</p>
                        <p className="text-2xl font-black text-[#0F172A]">{products.filter(p => p.stock > 0 && p.stock < 10).length} products</p>
                    </div>
                </div>
                <div className="relative flex items-center gap-4 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={22} /></div>
                    <div className="relative">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#64748B]">Healthy stock</p>
                        <p className="text-2xl font-black text-[#0F172A]">{products.filter(p => p.stock >= 10).length} products</p>
                    </div>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">
                <div className="border-b border-[#E2E8F0] bg-[#F8FBFF] p-4">
                    <SearchBar
                        placeholder="Search products or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-md"
                    />
                </div>
                <div className="p-3 md:p-4">
                    <AdminTable
                        columns={[
                            {
                                id: 'title',
                                header: 'Product',
                                cell: ({ row }) => (
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-neutral-100 rounded-2xl overflow-hidden relative border border-[#F5F3F0] shadow-inner">
                                            <img
                                                src={resolveImageUrl(row.original.images?.[0])}
                                                alt={row.original.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.src = "https://placehold.co/100x100/F5F3F0/0a4019?text=Error";
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-heading font-bold text-[#0a4019] text-base italic leading-tight mb-1">{row.original.title}</p>
                                            <p className="text-[10px] font-bold text-[#d3d3d3] uppercase tracking-widest">{row.original.category?.name || "Uncategorized"}</p>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                accessorKey: '_id',
                                header: 'Registry ID',
                                cell: ({ row }) => (
                                    <span className="text-[10px] font-mono text-neutral-400 font-bold bg-neutral-50 px-3 py-1.5 rounded-lg border border-neutral-100">
                                        REF:{row.original._id.toString().substring(18).toUpperCase()}
                                    </span>
                                )
                            },
                            {
                                id: 'stock',
                                header: 'Available Units',
                                cell: ({ row }) => {
                                    const product = row.original;
                                    const currentStock = localStocks[product._id] ?? product.stock;
                                    const hasChanged = currentStock !== product.stock;

                                    return (
                                        <div className="flex items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
                                            <button
                                                className="w-10 h-10 rounded-xl border border-neutral-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-[#0a4019] font-bold shadow-sm active:scale-90 bg-neutral-50"
                                                onClick={() => handleLocalStockChange(product._id, currentStock - 1)}
                                            >
                                                -
                                            </button>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={currentStock}
                                                    onChange={(e) => handleLocalStockChange(product._id, e.target.value)}
                                                    className={`w-20 text-center border rounded-xl py-2 font-heading font-bold text-[#0a4019] text-lg transition-all duration-300 shadow-sm ${hasChanged ? 'border-[#d3d3d3] bg-[#d3d3d3]/5 ring-2 ring-[#d3d3d3]/20' : 'border-[#F5F3F0] bg-[#FDFCFB]'}`}
                                                />
                                            </div>
                                            <button
                                                className="w-10 h-10 rounded-xl border border-neutral-200 hover:bg-white hover:shadow-lg transition-all flex items-center justify-center text-[#0a4019] font-bold shadow-sm active:scale-90 bg-neutral-50"
                                                onClick={() => handleLocalStockChange(product._id, currentStock + 1)}
                                            >
                                                +
                                            </button>
                                        </div>
                                    );
                                }
                            },
                            {
                                id: 'status',
                                header: 'Logistics Status',
                                cell: ({ row }) => {
                                    const currentStock = localStocks[row.original._id] ?? row.original.stock;

                                    return (
                                        <span className={`
                                            inline-flex items-center gap-2 px-5 py-2 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] border shadow-sm
                                            ${currentStock === 0 ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                            ${currentStock < 10 && currentStock > 0 ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                            ${currentStock >= 10 ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                        `}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${currentStock === 0 ? 'bg-red-500' : (currentStock < 10 ? 'bg-orange-500' : 'bg-green-500')}`} />
                                            {currentStock === 0 ? 'Inert' : (currentStock < 10 ? 'Unstable' : 'Certified')}
                                        </span>
                                    );
                                }
                            },
                            {
                                id: 'actions',
                                header: 'Operations',
                                cell: ({ row }) => {
                                    const product = row.original;
                                    const currentStock = localStocks[product._id] ?? product.stock;
                                    const hasChanged = currentStock !== product.stock;

                                    return (
                                        <div className="flex items-center justify-end gap-3 transition-all" onClick={e => e.stopPropagation()}>
                                            {hasChanged && (
                                                <button
                                                    onClick={() => handleSaveStock(product._id)}
                                                    disabled={isUpdating}
                                                    className="p-3 bg-[#d3d3d3]/20 text-[#0a4019] rounded-xl hover:bg-[#d3d3d3] transition-all shadow-sm"
                                                    title="Save Individual Change"
                                                >
                                                    <Save size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => confirmDelete(product._id)}
                                                className="p-3 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-100"
                                                title="Decommission Asset"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                }
                            }
                        ]}
                        data={filteredProducts}
                    />
                </div>

            </div>

            {/* Delete Modal */}
            <ModalShell open={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete product from inventory?" description="The product will also be removed from the storefront." size="sm" footer={<><SecondaryButton onClick={() => setIsDeleteModalOpen(false)}>Cancel</SecondaryButton><button onClick={executeDelete} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700">Delete product</button></>}><p className="text-sm leading-6 text-[#475569]">This is permanent and cannot be undone. Historical order records are not affected.</p></ModalShell>
        </SellerPageScaffold>
    );
}
