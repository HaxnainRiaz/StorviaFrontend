"use client";

import { useAdmin } from "@/context/AdminContext";
import { Star, MessageSquare, Check, X, Send, User, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

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

    return (
        <div className="space-y-10 animate-fadeIn">
            <div>
                <h1 className="text-4xl font-heading font-bold text-[#0a4019] italic">Feedback Stream</h1>
                <p className="text-[#6B6B6B] text-sm font-medium mt-1">Moderate customer sentiments and curate brand reputation</p>
            </div>

            <div className="space-y-8">
                {reviews.length > 0 ? (
                    [...reviews].reverse().map((review) => (
                        <div key={review._id} className="bg-white rounded-[2.5rem] p-10 shadow-[0_4px_20px_rgba(11,47,38,0.08)] border border-[#F5F3F0] hover:shadow-[0_16px_60px_rgba(11,47,38,0.15)] transition-all duration-500 group">
                            <div className="flex flex-col lg:flex-row gap-10">

                                {/* Review Info */}
                                <div className="flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-full border border-neutral-100">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    size={14}
                                                    className={`${i < review.rating ? "text-[#d3d3d3] fill-[#d3d3d3]" : "text-neutral-200"}`}
                                                />
                                            ))}
                                            <span className="text-[10px] font-bold text-[#0a4019] ml-1">{review.rating}.0</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest bg-white border border-[#F5F3F0] px-3 py-1 rounded-lg">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-sm md:text-md font-heading text-[#6B6B6B] leading-tight italic">{review.title}</h3>
                                        {review.comment && <p className="text-[#6B6B6B] text-base leading-relaxed font-medium italic mt-2">&ldquo;{review.comment}&rdquo;</p>}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#F5F3F0]/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#d3d3d3]/20 flex items-center justify-center">
                                                <User size={12} className="text-[#0a4019]" />
                                            </div>
                                            <span className="text-[10px] font-bold text-[#0a4019] uppercase tracking-wider">{review.user?.name || "Verified Client"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-[#0a4019]/10 flex items-center justify-center">
                                                <ShoppingBag size={12} className="text-[#0a4019]" />
                                            </div>
                                            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Acquisition: {review.product?.title || "Limited Release"}</span>
                                        </div>
                                    </div>

                                    {review.adminReply && (
                                        <div className="mt-8 p-6 bg-[#FDFCFB]/30 rounded-[2rem] border border-[#d3d3d3]/20 relative shadow-inner">
                                            <div className="absolute -top-3 left-6 px-4 py-1 bg-[#0a4019] text-[9px] font-bold text-[#d3d3d3] tracking-[0.2em] uppercase rounded-full shadow-sm">
                                                Admin Response
                                            </div>
                                            <p className="text-sm text-[#0a4019] font-bold italic leading-relaxed">{review.adminReply}</p>
                                        </div>
                                    )}

                                    {replyingTo === review._id && (
                                        <div className="mt-8 space-y-4 animate-slideDown bg-neutral-50 p-6 rounded-[2rem] border border-[#F5F3F0]">
                                            <textarea
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder="Craft a personalized response from the StorVia concierge..."
                                                className="w-full p-6 text-sm border border-neutral-200 rounded-2xl min-h-[120px] bg-white font-medium text-[#0a4019] shadow-[0_4px_20px_rgba(11,47,38,0.08)]"
                                            />
                                            <div className="flex justify-end gap-3">
                                                <button
                                                    onClick={() => setReplyingTo(null)}
                                                    className="px-6 py-3 text-[10px] font-bold text-neutral-400 hover:text-primary transition-colors uppercase tracking-widest"
                                                >
                                                    Discard
                                                </button>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, review.status, replyText)}
                                                    disabled={!replyText.trim()}
                                                    className="flex items-center gap-2 bg-[#0a4019] text-[#d3d3d3] px-8 py-3 rounded-xl hover:bg-[#051712] transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-[#0a4019]/10 active:scale-95"
                                                >
                                                    <Send size={14} />
                                                    Transmit Reply
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex flex-col items-center justify-center border-t lg:border-t-0 lg:border-l border-[#F5F3F0] pt-8 lg:pt-0 lg:pl-10 lg:min-w-[220px] gap-6">
                                    <div className={`
                                        flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border shadow-sm transition-all duration-500
                                        ${review.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' : ''}
                                        ${review.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : ''}
                                        ${review.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' : ''}
                                    `}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${review.status === 'approved' ? 'bg-green-500' : (review.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500')}`} />
                                        {review.status}
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {review.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, 'approved')}
                                                    className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl hover:bg-green-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-green-100"
                                                    title="Approve for Storefront"
                                                >
                                                    <Check size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleSaveStatus(review._id, 'rejected')}
                                                    className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center border border-red-100"
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
                                                className="w-12 h-12 bg-neutral-50 text-neutral-400 hover:bg-[#0a4019] hover:text-[#d3d3d3] rounded-2xl transition-all shadow-sm flex items-center justify-center border border-neutral-100"
                                                title="Initiate Dialogue"
                                            >
                                                <MessageSquare size={20} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="text-[9px] text-neutral-300 font-bold uppercase tracking-[0.2em] mt-2 italic">
                                        Review Node: {review._id.substring(18).toUpperCase()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-32 bg-white rounded-[3rem] border border-[#F5F3F0] shadow-[0_4px_20px_rgba(11,47,38,0.08)]">
                        <div className="w-20 h-20 bg-[#FDFCFB] rounded-full flex items-center justify-center mx-auto mb-6">
                            <MessageSquare className="text-neutral-200" size={32} />
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-[#0a4019] italic">Atmospheric Silence</h3>
                        <p className="text-[#6B6B6B] max-w-sm mx-auto mt-2 font-medium">No customer feedback detected in the current transmission cycle.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
