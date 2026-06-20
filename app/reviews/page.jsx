"use client";

import { useAdmin } from "@/context/AdminContext";
import { Star, MessageSquare, Check, X, Send, User, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, EmptyState, SellerPageScaffold, StatCard } from "@/components/storvia/SellerPageScaffold";

export default function ReviewsPage() {
    const { reviews, updateReview, loading, fetchReviews } = useAdmin();
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSaveStatus = async (id, status, reply = null) => {
        const updateData = { status };
        if (reply !== null) updateData.adminReply = reply;

        const success = await updateReview(id, updateData);
        if (success) {
            setReplyingTo(null);
            setReplyText("");
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-10 h-10 border-4 border-[#0a4019] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-[#0a4019] font-heading font-bold animate-pulse">Filtering Communiqués...</p>
            </div>
        );
    }

    const approved = reviews.filter(review => review.status === "approved").length;
    const pending = reviews.filter(review => review.status === "pending").length;

    return (
        <SellerPageScaffold title="Reviews" description="Moderate customer feedback and respond from one focused workspace.">
            <div className="grid gap-4 sm:grid-cols-3">
                <StatCard label="All reviews" value={reviews.length} icon={MessageSquare} />
                <StatCard label="Awaiting review" value={pending} icon={MessageSquare} tone="amber" />
                <StatCard label="Published" value={approved} icon={Check} tone="green" />
            </div>
            <div className="space-y-4">
                {reviews.length > 0 ? (
                    [...reviews].reverse().map((review) => (
                        <Card key={review._id} className="p-0 overflow-hidden">
                            <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">

                                {/* Review Info */}
                                <div className="space-y-5 p-5 md:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-1 rounded-full bg-[#FFFBEB] px-3 py-1.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={`${i < review.rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#CBD5E1]"}`}
                                                />
                                            ))}
                                            <span className="ml-1 text-xs font-black text-[#92400E]">{review.rating}.0</span>
                                        </div>
                                        <span className="text-xs font-semibold text-[#64748B]">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-black text-[#0F172A]">{review.title || "Customer review"}</h3>
                                        {review.comment && <p className="mt-2 text-sm leading-6 text-[#475569]">{review.comment}</p>}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-5 border-t border-[#E2E8F0] pt-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E8F3FF]">
                                                <User size={13} className="text-[#1E8AF7]" />
                                            </div>
                                            <span className="text-xs font-bold text-[#0F172A]">{review.user?.name || "Verified customer"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F5F9]">
                                                <ShoppingBag size={13} className="text-[#64748B]" />
                                            </div>
                                            <span className="text-xs font-semibold text-[#64748B]">{review.product?.title || "Product unavailable"}</span>
                                        </div>
                                    </div>

                                    {review.adminReply && (
                                        <div className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#1E8AF7]">Your response</p>
                                            <p className="mt-2 text-sm leading-6 text-[#1E3A8A]">{review.adminReply}</p>
                                        </div>
                                    )}

                                    {replyingTo === review._id && (
                                        <div className="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FBFF] p-4 animate-slideDown">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Write a helpful public response..."
                                                className="min-h-28 w-full resize-none rounded-xl border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] outline-none focus:border-[#1E8AF7]"
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => setReplyingTo(null)}
                                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#64748B] hover:bg-white"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, review.status, replyText)}
                                                    disabled={!replyText.trim()}
                                                    className="flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#0F74D8] disabled:opacity-50"
                                                >
                                                    <Send size={14} />
                                                    Publish reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex flex-col items-start justify-center gap-5 border-t border-[#E2E8F0] bg-[#F8FBFF] p-5 lg:border-l lg:border-t-0">
                                    <div className={`
                                        flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em]
                                        ${review.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                        ${review.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                                        ${review.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${review.status === 'approved' ? 'bg-green-500' : (review.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500')}`} />
                                        {review.status}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {review.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, 'approved')}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-green-200 bg-white text-green-600 hover:bg-green-600 hover:text-white"
                                                    title="Approve for Storefront"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, 'rejected')}
                                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 hover:bg-red-600 hover:text-white"
                                                    title="Reject Feedback"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </>
                                        )}
                                        {!review.adminReply && replyingTo !== review._id && (
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(review._id);
                                                    setReplyText("");
                                                }}
                                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#93C5FD] hover:text-[#1E8AF7]"
                                                title="Initiate Dialogue"
                                            >
                                                <MessageSquare size={20} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-[10px] font-semibold text-[#94A3B8]">
                                        ID: {review._id.substring(18).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <EmptyState icon={MessageSquare} title="No reviews yet" description="Customer feedback will appear here after a verified purchase." />
                )}
            </div>
        </SellerPageScaffold>
    );
}
