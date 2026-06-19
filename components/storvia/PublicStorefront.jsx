"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useMemo, useRef, useCallback, Fragment } from "react";
import toast from "react-hot-toast";
import { 
    Search, ShoppingBag, Store, X, ChevronRight, Plus, Minus, 
    Heart, ArrowRight, Lock, Check, Sparkles, Clock, Truck, 
    ShieldCheck, Trash2, User, Home, LayoutGrid, Star, 
    CheckCircle2, AlertTriangle, MessageSquare, Send
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { resolveAssetUrl } from "@/lib/storeUrl";
import { rewriteHtmlLinksClient, resolveNavigationTarget, resolvePageForView, shouldRenderFullImportedPage, isHomePageSlug, normalizeImportedHref } from "@/lib/storefrontRoutes";
import { resolveProductsForSection } from "@/lib/commerceProductSource";
import { injectDesignProductGrid } from "@/lib/designProductCard";
import {
    extractDesignCommercePatterns,
    designUsesNativeCartDrawer,
    buildCartDrawerPanelHtml,
    getCommerceLayoutCss,
} from "@/lib/designCommerceFallback";
import {
    stripRichText,
    findProductBySlugLoose,
    resolveProductFromClickTarget,
    isAddToCartClick,
    isWishlistToggleClick,
    isPlaceOrderClick,
    getPageCommerceKind,
    hydrateImportedSectionHtml,
    readImportedCheckoutForm,
    readImportedReviewForm,
    updateHeaderCommerceBadges,
    sectionMatchesCommerce,
} from "@/lib/storefrontCommerceBridge";

// Pakistan-specific provinces list
const PAKISTAN_PROVINCES = [
    "Punjab", 
    "Sindh", 
    "KPK", 
    "Balochistan", 
    "Gilgit-Baltistan", 
    "AJK", 
    "Islamabad Capital Territory"
];

// Curated verified Unsplash high-resolution placeholder images
const PREMIUM_UNSPLASH_PLACEHOLDERS = {
    fashion: [
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&auto=format&fit=crop&q=80"
    ],
    beauty: [
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1608248597481-496100c8c836?w=800&auto=format&fit=crop&q=80"
    ],
    electronics: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&auto=format&fit=crop&q=80"
    ],
    food: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop&q=80"
    ],
    home: [
        "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80"
    ],
    sports: [
        "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80"
    ],
    default: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80"
    ]
};

const getPlaceholderImage = (category, index = 0) => {
    const categoriesMap = {
        fashion: "fashion", clothing: "fashion", apparel: "fashion",
        beauty: "beauty", cosmetics: "beauty", skincare: "beauty",
        electronics: "electronics", gadget: "electronics", technology: "electronics",
        food: "food", home: "home", furniture: "home",
        sports: "sports", workout: "sports"
    };
    const mapped = categoriesMap[String(category).toLowerCase()] || "default";
    const arr = PREMIUM_UNSPLASH_PLACEHOLDERS[mapped] || PREMIUM_UNSPLASH_PLACEHOLDERS.default;
    return arr[index % arr.length];
};

const getImageUrl = (source, category = "default", index = 0) => {
    const candidate = typeof source === "string"
        ? source
        : source?.url || source?.imageUrl || source?.path || source?.src;
    return resolveAssetUrl(candidate, getPlaceholderImage(category, index));
};

// ─── Storefront session cache (reduces latency, prevents blank screens) ────────
// Stores: storefront info, products, categories keyed by slug (5min TTL)
// Schema cached separately with 10min TTL (contains heavy CSS)
const SF_TTL = 5 * 60 * 1000;       // 5 minutes
const SCHEMA_TTL = 10 * 60 * 1000;  // 10 minutes

const sfCache = {
    _key: (slug) => `storiva_sf_${slug}`,
    get(slug) {
        if (typeof window === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(this._key(slug));
            if (!raw) return null;
            const { d, ts } = JSON.parse(raw);
            if (Date.now() - ts > SF_TTL) { sessionStorage.removeItem(this._key(slug)); return null; }
            return d;
        } catch { return null; }
    },
    set(slug, data) {
        if (typeof window === 'undefined') return;
        try {
            const payload = JSON.stringify({ d: data, ts: Date.now() });
            sessionStorage.setItem(this._key(slug), payload);
        } catch { /* quota exceeded or private browsing — silently skip */ }
    },
    clear(slug) {
        if (typeof window === 'undefined') return;
        try { sessionStorage.removeItem(this._key(slug)); } catch {}
    }
};

const schemaCache = {
    _key: (slug, preview) => `storiva_schema_${slug}_${preview ? 'p' : 'l'}`,
    get(slug, preview) {
        if (typeof window === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(this._key(slug, preview));
            if (!raw) return null;
            const { d, ts } = JSON.parse(raw);
            if (Date.now() - ts > SCHEMA_TTL) { sessionStorage.removeItem(this._key(slug, preview)); return null; }
            return d;
        } catch { return null; }
    },
    set(slug, preview, data) {
        if (typeof window === 'undefined') return;
        try {
            // Store schema without the raw CSS blob to reduce storage size;
            // scopedCss alone can be large — store it separately if needed
            const minified = { ...data };
            sessionStorage.setItem(this._key(slug, preview), JSON.stringify({ d: minified, ts: Date.now() }));
        } catch {
            // If quota exceeded, try storing without scopedCss (it gets rebuilt server-side anyway)
            try {
                const slim = { ...data, scopedCss: '', globalStyles: { ...data.globalStyles, rawCss: '' } };
                sessionStorage.setItem(this._key(slug, preview), JSON.stringify({ d: slim, ts: Date.now() }));
            } catch { /* private browsing */ }
        }
    },
    clear(slug, preview) {
        if (typeof window === 'undefined') return;
        try { sessionStorage.removeItem(this._key(slug, preview)); } catch {}
    }
};

export default function PublicStorefront({ view = "home" }) {
    const params = useParams();
    const router = useRouter();
    const storeSlug = params?.storeSlug;
    const productSlug = params?.productSlug;
    const collectionSlug = params?.collectionSlug;
    const pageSlug = params?.pageSlug || (Array.isArray(params?.slug) ? params.slug[params.slug.length - 1] : params?.slug);

    // Core states
    const [storefront, setStorefront] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [managedSchema, setManagedSchema] = useState(null);
    const [isManaged, setIsManaged] = useState(false);
    const [routeMap, setRouteMap] = useState([]);

    // E-commerce states
    const [cart, setCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchExpanded, setSearchExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [announcementVisible, setAnnouncementVisible] = useState(true);
    
    // Store configuration settings
    const [shippingSettings, setShippingSettings] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState(null);

    // Active category for filtering
    const [selectedCategory, setSelectedCategory] = useState("All");

    // Product page specific
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [activeProductTab, setActiveProductTab] = useState("description"); // description, reviews
    const [reviewName, setReviewName] = useState("");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [productReviews, setProductReviews] = useState([]);

    // Checkout Page Form States
    const [checkoutEmail, setCheckoutEmail] = useState("");
    const [checkoutPhone, setCheckoutPhone] = useState("+92 ");
    const [checkoutFullName, setCheckoutFullName] = useState("");
    const [checkoutAddress, setCheckoutAddress] = useState("");
    const [checkoutCity, setCheckoutCity] = useState("");
    const [checkoutProvince, setCheckoutProvince] = useState("Punjab");
    const [checkoutPostal, setCheckoutPostal] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("COD"); // COD, Card, JazzCash, EasyPaisa
    const [walletPhone, setWalletPhone] = useState("");
    const [cardNo, setCardNo] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    
    // Coupon system
    const [couponCodeInput, setCouponCodeInput] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    // Checkout Submit State
    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [orderSuccessData, setOrderSuccessData] = useState(null);
    const [checkoutError, setCheckoutError] = useState("");
    const [trackingNo, setTrackingNo] = useState("");
    const [trackResult, setTrackResult] = useState(null);
    const [trackingError, setTrackingError] = useState("");
    const [searchingTrack, setSearchingTrack] = useState(false);
    const [isEmbed, setIsEmbed] = useState(false);

    // ── Cache-first data fetching ──────────────────────────────────────────────
    // Strategy:
    //   1. Populate state from sessionStorage cache → renders instantly (no spinner)
    //   2. Fetch fresh data in background → update cache + state
    //   3. Only show error if BOTH cache miss AND API fail
    //   4. Shipping/payments fetched lazily (only when view needs them)
    useEffect(() => {
        if (!storeSlug) return;
        let active = true;

        const isPreview = typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("preview") === "true";
        const embedMode = typeof window !== "undefined" &&
            new URLSearchParams(window.location.search).get("embed") === "1";
        setIsEmbed(embedMode);

        // ── Step 1: Load cache immediately ────────────────────────────────────
        const cached = sfCache.get(storeSlug);
        const cachedSchema = schemaCache.get(storeSlug, isPreview);
        const hasCache = !!cached;

        if (cached) {
            // Hydrate state from cache — user sees content instantly
            if (cached.storefront) setStorefront(cached.storefront);
            if (cached.products)   setProducts(cached.products);
            if (cached.categories) setCategories(cached.categories);
            if (cached.shipping)   setShippingSettings(cached.shipping);
            if (cached.payments)   setPaymentSettings(cached.payments);
            setLoading(false); // ← no loading spinner if cache hit
        } else {
            setLoading(true);
        }

        if (cachedSchema) {
            setManagedSchema(cachedSchema);
            setIsManaged(true);
            setRouteMap(cachedSchema.routeMap || []);
        }

        setError("");

        // ── Step 2: Fetch fresh data (foreground if no cache, background if cached) ─
        const needsShipping = view === "checkout" || view === "cart";
        const needsPayments = view === "checkout";

        const requests = [
            apiClient.get(`/storefront/${storeSlug}`,             { showToast: false, redirectOnUnauthorized: false }),
            apiClient.get(`/storefront/${storeSlug}/products`,    { showToast: false, redirectOnUnauthorized: false }),
            apiClient.get(`/storefront/${storeSlug}/categories`,  { showToast: false, redirectOnUnauthorized: false }),
            // Shipping and payments: lazy — only fetch if this view needs them
            needsShipping
                ? apiClient.get(`/storefront/${storeSlug}/shipping/options`, { showToast: false, redirectOnUnauthorized: false })
                : Promise.resolve({ success: false, _skipped: true }),
            needsPayments
                ? apiClient.get(`/storefront/${storeSlug}/payments/options`, { showToast: false, redirectOnUnauthorized: false })
                : Promise.resolve({ success: false, _skipped: true }),
            // Schema: always fetch fresh (asset URL + route-map fixes apply server-side)
            apiClient.get(`/storefront/${storeSlug}/render-schema${isPreview ? "?preview=true" : ""}`, { showToast: false, redirectOnUnauthorized: false }),
        ];

        Promise.allSettled(requests).then((
            [storeRes, productsRes, categoriesRes, shippingRes, paymentsRes, renderSchemaRes]
        ) => {
            if (!active) return;

            const storeVal      = storeRes.status      === "fulfilled" ? storeRes.value      : null;
            const productsVal   = productsRes.status   === "fulfilled" ? productsRes.value   : null;
            const categoriesVal = categoriesRes.status === "fulfilled" ? categoriesRes.value : null;
            const shippingVal   = shippingRes.status   === "fulfilled" ? shippingRes.value   : null;
            const paymentsVal   = paymentsRes.status   === "fulfilled" ? paymentsRes.value   : null;
            const schemaVal     = renderSchemaRes.status === "fulfilled" ? renderSchemaRes.value : null;

            // ── Storefront info ──────────────────────────────────────────────
            if (storeVal?.success) {
                setStorefront(storeVal.data);
            } else if (!hasCache) {
                // Only show error when there is no cached fallback to show
                setError(storeVal?.message || "This storefront is not available.");
            }
            // If API failed but cache exists → silently keep cached data; no error shown

            // ── Products & categories ─────────────────────────────────────────
            const freshProducts   = productsVal?.success   ? (Array.isArray(productsVal.data)   ? productsVal.data   : []) : (cached?.products   || []);
            const freshCategories = categoriesVal?.success ? (Array.isArray(categoriesVal.data) ? categoriesVal.data : []) : (cached?.categories || []);
            const freshShipping   = (shippingVal?.success && !shippingVal?._skipped) ? shippingVal.data  : (cached?.shipping || null);
            const freshPayments   = (paymentsVal?.success && !paymentsVal?._skipped) ? paymentsVal.data  : (cached?.payments || null);

            setProducts(freshProducts);
            setCategories(freshCategories);
            if (freshShipping)  setShippingSettings(freshShipping);
            if (freshPayments)  setPaymentSettings(freshPayments);

            // ── Schema ────────────────────────────────────────────────────────
            if (schemaVal?.success && schemaVal.data) {
                setManagedSchema(schemaVal.data);
                setIsManaged(true);
                setRouteMap(schemaVal.data.routeMap || []);
                schemaCache.set(storeSlug, isPreview, schemaVal.data);
            } else if (cachedSchema) {
                setManagedSchema(cachedSchema);
                setIsManaged(true);
                setRouteMap(cachedSchema.routeMap || []);
            }

            // ── Update cache with fresh data ──────────────────────────────────
            if (storeVal?.success) {
                sfCache.set(storeSlug, {
                    storefront:  storeVal.data,
                    products:    freshProducts,
                    categories:  freshCategories,
                    shipping:    freshShipping,
                    payments:    freshPayments,
                });
            }

            setLoading(false);
        });

        return () => { active = false; };
    }, [storeSlug]); // ← only re-fetch when slug changes, NOT on view changes

    // ── Lazy-load shipping/payments when user enters checkout ─────────────────
    useEffect(() => {
        if (!storeSlug) return;
        if (view !== 'checkout' && view !== 'cart') return;
        if (shippingSettings && paymentSettings) return; // already loaded
        let active = true;
        Promise.allSettled([
            shippingSettings ? Promise.resolve(null) :
                apiClient.get(`/storefront/${storeSlug}/shipping/options`, { showToast: false, redirectOnUnauthorized: false }),
            paymentSettings ? Promise.resolve(null) :
                apiClient.get(`/storefront/${storeSlug}/payments/options`, { showToast: false, redirectOnUnauthorized: false }),
        ]).then(([shippingRes, paymentsRes]) => {
            if (!active) return;
            const sv = shippingRes.status === 'fulfilled' ? shippingRes.value : null;
            const pv = paymentsRes.status === 'fulfilled' ? paymentsRes.value : null;
            if (sv?.success) setShippingSettings(sv.data);
            if (pv?.success) setPaymentSettings(pv.data);
        });
        return () => { active = false; };
    }, [storeSlug, view]);



    // Fetch detail routes (product, collection, page)
    useEffect(() => {
        if (!storeSlug) return;
        let active = true;
        setDetail(null);

        const loadDetail = async (endpoint) => {
            const res = await apiClient.get(endpoint, { showToast: false, redirectOnUnauthorized: false });
            if (!active) return;
            if (res.success) {
                setDetail(res.data);
                if (view === "product") {
                    const revRes = await apiClient.get(`/storefront/${storeSlug}/products/${res.data._id}/reviews`, { showToast: false, redirectOnUnauthorized: false });
                    if (revRes.success) setProductReviews(revRes.data);
                }
            } else {
                setError(res.message || "Requested storefront page was not found.");
            }
        };

        if (view === "product" && productSlug) {
            loadDetail(`/storefront/${storeSlug}/products/${productSlug}`);
        }
        if (view === "collection" && collectionSlug) {
            loadDetail(`/storefront/${storeSlug}/collections/${collectionSlug}`);
        }
        if (view === "page" && pageSlug) {
            loadDetail(`/storefront/${storeSlug}/pages/${pageSlug}`);
        }

        return () => { active = false; };
    }, [storeSlug, view, productSlug, collectionSlug, pageSlug]);

    // LocalStorage cart/wishlist sync
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedCart = localStorage.getItem(`storiva_cart_${storeSlug}`);
            if (storedCart) {
                try { setCart(JSON.parse(storedCart)); } catch (e) { setCart([]); }
            } else {
                setCart([]);
            }

            const storedWish = localStorage.getItem(`storiva_wishlist_${storeSlug}`);
            if (storedWish) {
                try { setWishlist(JSON.parse(storedWish)); } catch (e) { setWishlist([]); }
            } else {
                setWishlist([]);
            }
        }
    }, [storeSlug]);

    const store = storefront?.store || {};

    const updateCartState = (newCart) => {
        setCart(newCart);
        localStorage.setItem(`storiva_cart_${storeSlug}`, JSON.stringify(newCart));
    };

    // Reconcile cart entries with live catalog data (title, image, price)
    useEffect(() => {
        if (!products.length || !cart.length) return;
        const enriched = cart.map((item) => {
            const live = products.find((p) => String(p._id) === String(item.product?._id));
            return live ? { ...item, product: live } : item;
        });
        const changed = enriched.some((item, idx) => item.product !== cart[idx]?.product);
        if (changed) updateCartState(enriched);
    }, [products, cart.length]);

    const addToCart = (product, qty = 1) => {
        if (product.stock <= 0) {
            toast.error("Sorry, this item is sold out!");
            return;
        }
        const existing = cart.find(item => item.product._id === product._id);
        let nextCart;
        if (existing) {
            if (existing.quantity + qty > product.stock) {
                toast.error(`Only ${product.stock} items left in stock.`);
                return;
            }
            nextCart = cart.map(item => item.product._id === product._id ? { ...item, quantity: item.quantity + qty } : item);
        } else {
            nextCart = [...cart, { product, quantity: qty }];
        }
        updateCartState(nextCart);
        toast.success(`${product.title} added to cart!`);
        setIsCartOpen(true);
    };

    const removeFromCart = (productId) => {
        const nextCart = cart.filter(item => item.product._id !== productId);
        updateCartState(nextCart);
        toast.success("Item removed from cart");
    };

    const updateQuantity = (productId, qty, maxStock) => {
        if (qty <= 0) {
            removeFromCart(productId);
            return;
        }
        if (qty > maxStock) {
            toast.error(`Only ${maxStock} items left in stock.`);
            return;
        }
        const nextCart = cart.map(item => item.product._id === productId ? { ...item, quantity: qty } : item);
        updateCartState(nextCart);
    };

    const clearCart = () => {
        updateCartState([]);
    };

    const toggleWishlist = (product) => {
        const isWish = wishlist.some(item => item._id === product._id);
        let nextWish;
        if (isWish) {
            nextWish = wishlist.filter(item => item._id !== product._id);
            toast.success("Removed from wishlist");
        } else {
            nextWish = [...wishlist, product];
            toast.success("Saved to wishlist");
        }
        setWishlist(nextWish);
        localStorage.setItem(`storiva_wishlist_${storeSlug}`, JSON.stringify(nextWish));
    };

    const cartSubtotal = useMemo(() => {
        return cart.reduce((sum, item) => {
            const price = item.product.salePrice && item.product.salePrice < item.product.price ? item.product.salePrice : item.product.price;
            return sum + price * item.quantity;
        }, 0);
    }, [cart]);

    const shippingFee = useMemo(() => {
        if (!shippingSettings) return 0;
        let fee = Number(shippingSettings.fee || 0);
        const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        let isFree = false;
        if (shippingSettings.freeShippingEnabled) {
            const amountMet = Number(shippingSettings.freeShippingThreshold || 0) > 0 && cartSubtotal >= Number(shippingSettings.freeShippingThreshold);
            const qtyMet = Number(shippingSettings.freeShippingQuantityThreshold || 0) > 0 && totalQty >= Number(shippingSettings.freeShippingQuantityThreshold);
            const mode = shippingSettings.freeShippingMode || 'either';
            
            if (mode === 'amount' && amountMet) isFree = true;
            else if (mode === 'quantity' && qtyMet) isFree = true;
            else if (mode === 'both' && amountMet && qtyMet) isFree = true;
            else if (mode === 'either' && (amountMet || qtyMet)) isFree = true;
        }
        
        if (appliedCoupon && appliedCoupon.discountType === 'free_shipping') {
            isFree = true;
        }
        
        return isFree ? 0 : fee;
    }, [shippingSettings, cartSubtotal, cart, appliedCoupon]);

    const couponDiscount = useMemo(() => {
        if (!appliedCoupon) return 0;
        let discount = 0;
        if (appliedCoupon.discountType === 'percentage') {
            discount = (cartSubtotal * appliedCoupon.discountValue) / 100;
        } else if (appliedCoupon.discountType === 'fixed') {
            discount = appliedCoupon.discountValue;
        }
        if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
            discount = appliedCoupon.maxDiscount;
        }
        return Math.min(discount, cartSubtotal);
    }, [appliedCoupon, cartSubtotal]);

    const checkoutPricing = useMemo(() => ({
        subtotal: cartSubtotal,
        shippingFee,
        discount: couponDiscount,
        total: Math.max(cartSubtotal + shippingFee - couponDiscount, 0),
        appliedCoupon,
        couponCode: couponCodeInput,
    }), [cartSubtotal, shippingFee, couponDiscount, appliedCoupon, couponCodeInput]);

    const validateCoupon = useCallback(async (codeOverride) => {
        const code = String(codeOverride ?? couponCodeInput).trim().toUpperCase();
        if (!code) return;
        setCouponCodeInput(code);
        setValidatingCoupon(true);
        try {
            const res = await apiClient.post(`/storefront/${storeSlug}/coupons/validate`, {
                code,
                subtotal: cartSubtotal
            }, { showToast: false });
            if (res.success) {
                setAppliedCoupon(res.data);
                toast.success("Coupon code applied successfully!");
            } else {
                toast.error(res.message || "Invalid coupon code for this store.");
                setAppliedCoupon(null);
            }
        } catch (e) {
            toast.error("Unable to validate coupon code.");
        } finally {
            setValidatingCoupon(false);
        }
    }, [storeSlug, cartSubtotal, couponCodeInput]);

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewName.trim() || !reviewComment.trim()) {
            toast.error("Please fill in all fields.");
            return;
        }
        setSubmittingReview(true);
        try {
            const res = await apiClient.post(`/storefront/${storeSlug}/products/${detail._id}/reviews`, {
                name: reviewName,
                rating: reviewRating,
                comment: reviewComment
            });
            if (res.success) {
                toast.success("Review submitted! Thank you.");
                setReviewName("");
                setReviewComment("");
                const revRes = await apiClient.get(`/storefront/${storeSlug}/products/${detail._id}/reviews`, { showToast: false });
                if (revRes.success) setProductReviews(revRes.data);
            } else {
                toast.error(res.message || "Could not submit review.");
            }
        } catch (err) {
            toast.error("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    const submitImportedCheckout = useCallback(async (form) => {
        if (!cart.length) {
            toast.error("Your bag is empty.");
            return;
        }
        const address = readImportedCheckoutForm(form);
        if (!address.fullName || !address.phone || !address.city || !address.street) {
            toast.error("Please complete all checkout fields.");
            return;
        }

        setSubmittingOrder(true);
        setCheckoutError("");
        const orderPayload = {
            items: cart.map((item) => ({
                product: item.product._id,
                quantity: item.quantity,
                price:
                    item.product.salePrice && item.product.salePrice < item.product.price
                        ? item.product.salePrice
                        : item.product.price,
            })),
            shippingAddress: {
                fullName: address.fullName,
                email: address.email,
                phone: address.phone,
                street: address.street,
                city: address.city,
                state: address.province,
                postalCode: address.postalCode,
                country: address.country,
            },
            paymentMethod: address.paymentMethod === "Bank Transfer" ? "Card" : "COD",
            coupon: appliedCoupon ? appliedCoupon.code : undefined,
        };

        try {
            const res = await apiClient.post(`/storefront/${storeSlug}/orders`, orderPayload);
            if (res.success) {
                setOrderSuccessData(res.data);
                clearCart();
                toast.success("Order placed successfully!");
                router.push(`/store/${storeSlug}/pages/thank-you`);
            } else {
                setCheckoutError(res.message || "Failed to complete checkout.");
                toast.error(res.message || "Checkout failed.");
            }
        } catch {
            setCheckoutError("Checkout failed due to server connection issues.");
            toast.error("Checkout failed due to server connection issues.");
        } finally {
            setSubmittingOrder(false);
        }
    }, [cart, storeSlug, router, clearCart, appliedCoupon]);

    useEffect(() => {
        if (!isManaged || typeof window === "undefined") return undefined;
        const root = document.querySelector(`.store-${storeSlug}.storvia-managed-root`);
        if (!root) return undefined;

        updateHeaderCommerceBadges(root, cart);

        const onSubmit = (event) => {
            const form = event.target?.closest?.("form[data-storvia-checkout-form]");
            if (form && root.contains(form)) {
                event.preventDefault();
                submitImportedCheckout(form);
                return;
            }

            const reviewForm = event.target?.closest?.("form[data-storvia-review-form]");
            if (reviewForm && root.contains(reviewForm)) {
                event.preventDefault();
                const payload = readImportedReviewForm(reviewForm);
                if (!payload?.name || !payload?.comment || !payload?.productId) {
                    toast.error("Please fill in all review fields.");
                    return;
                }
                apiClient
                    .post(`/storefront/${storeSlug}/products/${payload.productId}/reviews`, {
                        name: payload.name,
                        rating: payload.rating,
                        comment: payload.comment,
                    })
                    .then(async (res) => {
                        if (res.success) {
                            toast.success("Review submitted! Thank you.");
                            reviewForm.reset();
                            const revRes = await apiClient.get(
                                `/storefront/${storeSlug}/products/${payload.productId}/reviews`,
                                { showToast: false }
                            );
                            if (revRes.success) setProductReviews(revRes.data);
                        } else {
                            toast.error(res.message || "Could not submit review.");
                        }
                    })
                    .catch(() => toast.error("Failed to submit review."));
            }
        };

        const onClick = (event) => {
            const couponBtn = event.target?.closest?.("[data-storvia-apply-coupon]");
            if (couponBtn && root.contains(couponBtn)) {
                event.preventDefault();
                const input = root.querySelector("[data-storvia-coupon-input]");
                const code = input?.value?.trim();
                if (code) validateCoupon(code);
                return;
            }

            const ratingBtn = event.target?.closest?.("[data-storvia-rating-picker] [data-rating]");
            if (ratingBtn && root.contains(ratingBtn)) {
                event.preventDefault();
                const form = ratingBtn.closest("form[data-storvia-review-form]");
                const rating = Number(ratingBtn.getAttribute("data-rating") || 5);
                form?.querySelector('[name="rating"]')?.setAttribute("value", String(rating));
                ratingBtn.parentElement?.querySelectorAll("[data-rating]").forEach((btn) => {
                    btn.classList.toggle("active", btn === ratingBtn);
                });
                return;
            }

            if (event.target?.closest?.("[data-storvia-place-order]")) {
                event.preventDefault();
                const form = root.querySelector("form[data-storvia-checkout-form]");
                if (form) submitImportedCheckout(form);
            }
        };

        root.addEventListener("submit", onSubmit, true);
        root.addEventListener("click", onClick, true);
        return () => {
            root.removeEventListener("submit", onSubmit, true);
            root.removeEventListener("click", onClick, true);
        };
    }, [cart, isManaged, storeSlug, submitImportedCheckout, validateCoupon]);

    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        setCheckoutError("");

        if (!checkoutEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            setCheckoutError("Please enter a valid email address.");
            return;
        }

        setSubmittingOrder(true);
        const orderPayload = {
            items: cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.salePrice && item.product.salePrice < item.product.price ? item.product.salePrice : item.product.price
            })),
            shippingAddress: {
                fullName: checkoutFullName,
                email: checkoutEmail,
                phone: checkoutPhone,
                street: checkoutAddress,
                city: checkoutCity,
                state: checkoutProvince,
                postalCode: checkoutPostal,
                country: "Pakistan"
            },
            paymentMethod: paymentMethod === "Card" ? "Card" : "COD",
            coupon: appliedCoupon ? appliedCoupon.code : undefined,
            transactionNotes: paymentMethod !== "COD" && paymentMethod !== "Card" ? `${paymentMethod} number: ${walletPhone}` : ""
        };

        try {
            const res = await apiClient.post(`/storefront/${storeSlug}/orders`, orderPayload);
            if (res.success) {
                setOrderSuccessData(res.data);
                clearCart();
                toast.success("Order placed successfully!");
            } else {
                setCheckoutError(res.message || "Failed to complete checkout.");
            }
        } catch (err) {
            setCheckoutError("Checkout failed due to server connection issues.");
        } finally {
            setSubmittingOrder(false);
        }
    };

    const featuredProducts = useMemo(() => products.slice(0, 8), [products]);

    const filteredProducts = useMemo(() => {
        if (selectedCategory === "All") return products;
        return products.filter(p => p.category === selectedCategory || (p.category && p.category.title === selectedCategory));
    }, [products, selectedCategory]);

    const activeCategories = useMemo(() => {
        const list = new Set(products.map(p => typeof p.category === "object" ? p.category?.title : p.category).filter(Boolean));
        return ["All", ...Array.from(list)];
    }, [products]);

    const shopProductsForView = useMemo(() => {
        if (selectedCategory === "All") return products;
        return products.filter(
            (p) =>
                p.category === selectedCategory ||
                (p.category && p.category.title === selectedCategory)
        );
    }, [products, selectedCategory]);

    // -------------------------------------------------------------------------
    // SUB-COMPONENTS
    // -------------------------------------------------------------------------

    const AnnouncementBar = () => {
        if (!announcementVisible) return null;
        return (
            <div className="relative flex items-center justify-center bg-[#1E8AF7] text-white px-8 py-2 text-center text-xs font-semibold z-30 transition">
                <span className="truncate max-w-4xl">
                    🎉 Free delivery inside Pakistan on orders over Rs. 5,000
                </span>
                <button onClick={() => setAnnouncementVisible(false)} className="absolute right-3 p-1 rounded-full hover:bg-white/10 text-current transition">
                    <X size={14} />
                </button>
            </div>
        );
    };

    const Header = () => {
        return (
            <header className="sticky top-0 z-20 w-full border-b backdrop-blur-md bg-white/90 border-[#E2E8F0]">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Link href={`/store/${storeSlug}`} className="flex items-center gap-3 transition hover:opacity-95">
                        {store.logo ? (
                            <img src={resolveAssetUrl(store.logo)} alt={store.storeName} className="h-10 w-10 rounded-xl object-cover border border-[#E2E8F0]" />
                        ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white bg-[#1E8AF7] shadow-sm">
                                <Store size={18} />
                            </span>
                        )}
                        <span className="text-xl font-bold tracking-tight text-[#0F172A]">
                            {store.storeName || "Storiva Store"}
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#64748B]">
                        <Link href={`/store/${storeSlug}`} className={`transition ${view === "home" ? "text-[#1E8AF7]" : "hover:text-[#1E8AF7]"}`}>Home</Link>
                        <Link href={`/store/${storeSlug}/products`} className={`transition ${view === "products" ? "text-[#1E8AF7]" : "hover:text-[#1E8AF7]"}`}>Products</Link>
                        <Link href={`/store/${storeSlug}/order-tracking`} className={`transition ${view === "order-tracking" ? "text-[#1E8AF7]" : "hover:text-[#1E8AF7]"}`}>Track Order</Link>
                        <Link href={`/store/${storeSlug}/contact`} className={`transition ${view === "contact" ? "text-[#1E8AF7]" : "hover:text-[#1E8AF7]"}`}>Contact Us</Link>
                    </nav>

                    <div className="flex items-center gap-3">
                        <button onClick={() => setIsCartOpen(true)} className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[#E2E8F0] hover:bg-neutral-50 transition text-[#0F172A]">
                            <ShoppingBag size={16} />
                            {cart.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white bg-[#1E8AF7] shadow-sm">
                                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </header>
        );
    };

    const Footer = () => {
        return (
            <footer className="pt-16 pb-8 border-t border-[#E2E8F0] bg-[#FAFBFC] text-[#64748B] z-10 relative">
                <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-base font-bold tracking-tight text-[#0F172A]">{store.storeName}</h3>
                        <p className="text-xs font-semibold leading-relaxed max-w-xs">{store.description || "Discover premium custom products directly delivered to your home."}</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Quick Links</h4>
                        <ul className="space-y-2 text-xs font-semibold">
                            <li><Link href={`/store/${storeSlug}`} className="hover:underline">Home</Link></li>
                            <li><Link href={`/store/${storeSlug}/products`} className="hover:underline">Products</Link></li>
                            <li><Link href={`/store/${storeSlug}/order-tracking`} className="hover:underline">Track Order</Link></li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Contact</h4>
                        <p className="text-xs font-semibold">Email: support@storiva.com</p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F172A]">Secure Payments</h4>
                        <div className="flex gap-2.5 items-center opacity-60">
                            <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-1 rounded font-bold">JazzCash</span>
                            <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-1 rounded font-bold">EasyPaisa</span>
                            <span className="text-[10px] bg-neutral-200 text-neutral-800 px-2 py-1 rounded font-bold">COD</span>
                        </div>
                    </div>
                </div>
                <div className="mx-auto max-w-7xl px-6 border-t border-[#E2E8F0] mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-[11px] font-semibold">© {new Date().getFullYear()} {store.storeName || "Storiva"}. Powered by Storiva.</p>
                </div>
            </footer>
        );
    };

    const MobileBottomTab = () => {
        return (
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center border-t bg-white border-[#E2E8F0] py-2 shadow-lg h-16">
                <button onClick={() => router.push(`/store/${storeSlug}`)} className={`flex flex-col items-center justify-center flex-1 transition ${view === "home" ? "text-[#1E8AF7]" : "text-neutral-400"}`}>
                    <Home size={20} />
                    <span className="text-[9px] font-semibold mt-1">Home</span>
                </button>
                <button onClick={() => router.push(`/store/${storeSlug}/products`)} className={`flex flex-col items-center justify-center flex-1 transition ${view === "products" ? "text-[#1E8AF7]" : "text-neutral-400"}`}>
                    <LayoutGrid size={20} />
                    <span className="text-[9px] font-semibold mt-1">Shop</span>
                </button>
                <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center justify-center flex-1 relative text-neutral-400">
                    <ShoppingBag size={20} />
                    {cart.length > 0 && (
                        <span className="absolute top-0.5 right-6 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white bg-[#1E8AF7]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
                    )}
                    <span className="text-[9px] font-semibold mt-1">Cart</span>
                </button>
            </div>
        );
    };

    const ProductCard = ({ product, showPrice = true, showAddToCart = true }) => {
        const currentPrice = product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
        const originalPrice = product.price;
        const isSale = product.salePrice && product.salePrice < product.price;
        const isSoldOut = (product.stock || 0) <= 0;
        const productPath = `/store/${storeSlug}/products/${product.slug || product._id}`;
        return (
            <div className="group flex flex-col bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden hover:shadow-lg transition duration-200">
                <Link href={productPath} className="aspect-[4/5] bg-[#F8FBFF] relative overflow-hidden block">
                    <img src={getImageUrl(product.images?.[0], product.category)} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    {isSale && <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">SALE</span>}
                    {isSoldOut && <span className="absolute top-2 right-2 bg-neutral-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-md">SOLD OUT</span>}
                </Link>
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                        <Link href={productPath} className="text-xs font-bold text-neutral-800 line-clamp-2 hover:text-[#1E8AF7]">{product.title}</Link>
                        <p className="text-[10px] text-neutral-400 mt-0.5 font-bold uppercase tracking-wider">{typeof product.category === "object" ? product.category?.title : product.category || "General"}</p>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        {showPrice ? (
                            <div className="flex flex-col">
                                {isSale ? (
                                    <>
                                        <span className="text-xs font-black text-red-600">Rs. {currentPrice.toLocaleString()}</span>
                                        <span className="text-[10px] text-neutral-400 line-through">Rs. {originalPrice.toLocaleString()}</span>
                                    </>
                                ) : (
                                    <span className="text-xs font-black text-neutral-800">Rs. {originalPrice.toLocaleString()}</span>
                                )}
                            </div>
                        ) : <span />}
                        {showAddToCart && (
                            <button onClick={() => addToCart(product, 1)} disabled={isSoldOut} className="p-2 bg-[#1E8AF7] hover:bg-[#0F74D8] text-white rounded-xl transition disabled:opacity-50">
                                <Plus size={12} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const CartDrawer = () => {
        if (!isCartOpen) return null;
        return (
            <div className="fixed inset-0 z-[100] flex justify-end bg-black/50">
                <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-hero-text">
                    <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#0F172A]">Your Shopping Cart</h3>
                        <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-neutral-100 rounded-full text-neutral-500"><X size={18} /></button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-center space-y-2 text-neutral-400">
                                <ShoppingBag size={36} />
                                <p className="text-xs font-bold">Your cart is empty</p>
                            </div>
                        ) : (
                            cart.map(item => {
                                const currentPrice = item.product.salePrice && item.product.salePrice < item.product.price ? item.product.salePrice : item.product.price;
                                return (
                                    <div key={item.product._id} className="flex gap-3 justify-between items-center text-xs font-semibold text-neutral-600 border-b pb-3 border-[#E2E8F0]">
                                        <div className="flex gap-3 items-center min-w-0">
                                            <div className="h-12 w-12 rounded bg-neutral-50 border overflow-hidden shrink-0">
                                                <img src={getImageUrl(item.product.images?.[0], item.product.category)} alt={item.product.title} className="h-full w-full object-cover" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-neutral-800 truncate">{item.product.title}</p>
                                                <p className="text-[10px] text-neutral-400 mt-0.5">Rs. {currentPrice.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.product.stock)} className="p-1 border rounded hover:bg-neutral-50"><Minus size={10} /></button>
                                            <span className="text-xs font-bold text-neutral-800 w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.product.stock)} className="p-1 border rounded hover:bg-neutral-50"><Plus size={10} /></button>
                                            <button onClick={() => removeFromCart(item.product._id)} className="p-1 text-red-500 hover:bg-red-50 rounded ml-2"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {cart.length > 0 && (
                        <div className="p-4 border-t border-[#E2E8F0] space-y-4">
                            <div className="flex justify-between text-xs font-bold text-neutral-700">
                                <span>Subtotal</span>
                                <span>Rs. {cartSubtotal.toLocaleString()}</span>
                            </div>
                            <Link href={`/store/${storeSlug}/checkout`} onClick={() => setIsCartOpen(false)} className="w-full flex items-center justify-center gap-2 bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-3 rounded-xl text-center text-xs font-bold transition">
                                Proceed To Checkout <Lock size={12} />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const DesignCartDrawer = () => {
        if (!isCartOpen || !isManaged || !managedSchema) return null;
        const rawCss = managedSchema.scopedCss || managedSchema.globalStyles?.rawCss || "";
        const scopedCss = rawCss
            .replace(/\bhtml\b/g, `.store-${storeSlug}`)
            .replace(/\bbody\b/g, `.store-${storeSlug}`);
        const panelHtml = buildCartDrawerPanelHtml(cart, {
            designPatterns: designCommercePatterns,
            storeBase: `/store/${storeSlug}`,
            storeSlug,
            resolveImage: (src, category) => getImageUrl(src, category),
        });
        return (
            <div
                className="fixed inset-0 z-[100] flex justify-end bg-black/50"
                onClick={() => setIsCartOpen(false)}
            >
                <div
                    className={`store-${storeSlug} w-full max-w-md h-full overflow-auto shadow-2xl`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <style dangerouslySetInnerHTML={{ __html: scopedCss + getCommerceLayoutCss(storeSlug) }} />
                    <div dangerouslySetInnerHTML={{ __html: panelHtml }} />
                </div>
            </div>
        );
    };

    const ContactForm = () => {
        const [contactName, setContactName] = useState("");
        const [contactEmail, setContactEmail] = useState("");
        const [contactMsg, setContactMsg] = useState("");
        const [sendingMsg, setSendingMsg] = useState(false);

        const handleContactSubmit = async (e) => {
            e.preventDefault();
            setSendingMsg(true);
            try {
                const res = await apiClient.post(`/storefront/${storeSlug}/support/tickets`, {
                    name: contactName,
                    email: contactEmail,
                    message: contactMsg,
                    subject: "Storefront Enquiry"
                });
                if (res.success) {
                    toast.success("Message sent successfully!");
                    setContactName("");
                    setContactEmail("");
                    setContactMsg("");
                } else {
                    toast.error(res.message || "Failed to submit request.");
                }
            } catch (err) {
                toast.error("Failed to connect to store helpdesk.");
            } finally {
                setSendingMsg(false);
            }
        };

        return (
            <form onSubmit={handleContactSubmit} className="p-6 md:p-8 rounded-2xl border bg-white space-y-4 border-[#E2E8F0]">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Your Name</label>
                    <input type="text" required value={contactName} onChange={(e) => setContactName(e.target.value)} className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg bg-[#F8FBFF] text-xs font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white transition" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Email Address</label>
                    <input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg bg-[#F8FBFF] text-xs font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white transition" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Message Details</label>
                    <textarea required rows={4} value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} className="w-full p-3 border border-[#E2E8F0] rounded-lg bg-[#F8FBFF] text-xs font-semibold outline-none focus:border-[#1E8AF7] focus:bg-white transition resize-none" />
                </div>
                <button type="submit" disabled={sendingMsg} className="w-full bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-2.5 rounded-xl text-xs font-bold transition">
                    {sendingMsg ? "Sending..." : "Send Message"}
                </button>
            </form>
        );
    };

    const renderViewBody = () => {
        if (view === "product" && detail) {
            const currentProductPrice = detail.salePrice && detail.salePrice < detail.price ? detail.salePrice : detail.price;
            const originalProductPrice = detail.price;
            const isProductSale = detail.salePrice && detail.salePrice < detail.price;
            const totalStock = detail.stock || 0;
            const isProductSoldOut = totalStock <= 0;

            const gallImages = detail.images && detail.images.length > 0 ? detail.images : [null];

            return (
                <div className="space-y-12">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
                        <Link href={`/store/${storeSlug}`} className="hover:text-[#1E8AF7]">Home</Link>
                        <ChevronRight size={12} />
                        <Link href={`/store/${storeSlug}/products`} className="hover:text-[#1E8AF7]">Products</Link>
                        <ChevronRight size={12} />
                        <span className="text-neutral-600 truncate">{detail.title}</span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-start">
                        <div className="space-y-4">
                            <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[#F8FBFF] border border-[#E2E8F0] relative">
                                <img src={getImageUrl(gallImages[activeImageIndex], detail.category, activeImageIndex)} alt={detail.title} className="h-full w-full object-cover" />
                                {isProductSoldOut && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                        <span className="bg-neutral-800 text-white font-bold text-sm tracking-wider uppercase px-4 py-2 rounded-xl shadow-lg">Sold Out</span>
                                    </div>
                                )}
                            </div>
                            
                            {gallImages.length > 1 && (
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {gallImages.map((img, idx) => (
                                        <button key={idx} onClick={() => setActiveImageIndex(idx)} className={`h-16 w-16 rounded-xl border overflow-hidden bg-neutral-50 shrink-0 transition ${activeImageIndex === idx ? "border-[#1E8AF7]" : "border-neutral-200"}`}>
                                            <img src={getImageUrl(img, detail.category, idx)} alt={`${detail.title} ${idx + 1}`} className="h-full w-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-[0.15em]">{typeof detail.category === "object" ? detail.category?.title : detail.category || "General"}</span>
                                <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">{detail.title}</h1>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex text-amber-500 gap-0.5">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.floor(detail.rating || 5) ? "currentColor" : "transparent"} className="text-amber-500" />
                                    ))}
                                </div>
                                <span className="text-xs font-semibold text-neutral-400">{productReviews.length} Verified Customer Reviews</span>
                            </div>

                            <div className="flex items-center gap-3 py-3 border-y border-[#E2E8F0]">
                                {isProductSale ? (
                                    <>
                                        <span className="text-2xl font-extrabold text-red-600">Rs. {currentProductPrice.toLocaleString()}</span>
                                        <span className="text-sm text-neutral-400 line-through">Rs. {originalProductPrice.toLocaleString()}</span>
                                    </>
                                ) : (
                                    <span className="text-2xl font-extrabold text-[#0F172A]">Rs. {originalProductPrice.toLocaleString()}</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${isProductSoldOut ? "bg-red-500" : "bg-emerald-500"}`} />
                                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: isProductSoldOut ? "#DC2626" : "#16A34A" }}>
                                    {isProductSoldOut ? "Out of Stock / Sold Out" : `In Stock (${totalStock} available)`}
                                </span>
                            </div>

                            <p className="text-sm font-medium leading-relaxed text-[#64748B]">{stripRichText(detail.description) || "No specific detailed description provided for this item."}</p>

                            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center">
                                <button onClick={() => addToCart(detail, 1)} disabled={isProductSoldOut} className="w-full sm:flex-1 flex items-center justify-center gap-2 bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-4 rounded-xl text-center text-sm font-bold transition disabled:opacity-55">
                                    {isProductSoldOut ? "Sold Out" : "Add to Cart"} <ShoppingBag size={16} />
                                </button>
                                <button onClick={() => toggleWishlist(detail)} className="w-full sm:w-auto flex items-center justify-center gap-2 border border-[#E2E8F0] hover:bg-neutral-50 py-4 px-6 rounded-xl text-xs font-bold text-[#0F172A] transition">
                                    <Heart size={16} /> Save Product
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden">
                        <div className="flex border-b bg-neutral-50/50 border-[#E2E8F0]">
                            <button onClick={() => setActiveProductTab("description")} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeProductTab === "description" ? "border-[#1E8AF7] text-[#1E8AF7]" : "border-transparent text-neutral-400"}`}>Specifications</button>
                            <button onClick={() => setActiveProductTab("reviews")} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition ${activeProductTab === "reviews" ? "border-[#1E8AF7] text-[#1E8AF7]" : "border-transparent text-neutral-400"}`}>Customer Reviews ({productReviews.length})</button>
                        </div>

                        <div className="p-6 md:p-8 bg-white">
                            {activeProductTab === "description" && (
                                <div className="space-y-4">
                                    {detail.specifications && Object.keys(detail.specifications).length > 0 ? (
                                        <div className="max-w-2xl divide-y text-xs font-semibold divide-[#E2E8F0]">
                                            {Object.entries(detail.specifications).map(([key, val]) => (
                                                <div key={key} className="grid grid-cols-3 py-3">
                                                    <span className="text-neutral-400 uppercase tracking-wider">{key}</span>
                                                    <span className="col-span-2 text-neutral-700 font-bold">{val}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs font-semibold text-neutral-400">No specifications provided for this product.</p>
                                    )}
                                </div>
                            )}

                            {activeProductTab === "reviews" && (
                                <div className="space-y-8">
                                    <div className="space-y-4 divide-y divide-[#E2E8F0]">
                                        {productReviews.length === 0 ? (
                                            <p className="text-xs font-semibold text-neutral-400 py-4">Be the first to review this product!</p>
                                        ) : (
                                            productReviews.map(rev => (
                                                <div key={rev._id} className="py-4 space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-neutral-800">{rev.name || "Customer"}</span>
                                                        <span className="text-[10px] text-neutral-400 font-semibold">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex text-amber-500 gap-0.5">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "transparent"} className="text-amber-500" />
                                                        ))}
                                                    </div>
                                                    <p className="text-xs font-medium text-neutral-600 leading-relaxed">{rev.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    <form onSubmit={handleSubmitReview} className="p-6 rounded-xl bg-neutral-50/50 border border-[#E2E8F0] max-w-lg space-y-4">
                                        <h3 className="text-sm font-bold text-neutral-700">Write a customer review</h3>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Your Name</label>
                                            <input type="text" required value={reviewName} onChange={(e) => setReviewName(e.target.value)} className="w-full h-10 px-3 border border-[#E2E8F0] rounded-lg bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Rating Star Score</label>
                                            <div className="flex gap-1.5 pt-1 text-neutral-300">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button key={star} type="button" onClick={() => setReviewRating(star)} className="hover:scale-110 active:scale-95 transition" style={{ color: star <= reviewRating ? "#F59E0B" : undefined }}>
                                                        <Star size={18} fill={star <= reviewRating ? "currentColor" : "transparent"} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Review Comments</label>
                                            <textarea required rows={3} value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="w-full p-3 border border-[#E2E8F0] rounded-lg bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition resize-none" placeholder="Write details of your experience..." />
                                        </div>
                                        <button type="submit" disabled={submittingReview} className="flex items-center gap-2 bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-2 px-6 rounded-xl text-xs font-bold transition">
                                            {submittingReview ? "Submitting..." : "Submit Review"} <Send size={12} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        if (view === "checkout") {
            if (cart.length === 0 && !orderSuccessData) {
                return (
                    <div className="py-20 text-center space-y-4 max-w-sm mx-auto">
                        <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300" />
                        <h2 className="text-xl font-bold text-[#0F172A]">Checkout is empty</h2>
                        <p className="text-xs text-neutral-400">You must add some items to your shopping cart before accessing checkout.</p>
                        <Link href={`/store/${storeSlug}/products`} className="w-full flex items-center justify-center bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-3 rounded-xl font-bold text-xs">Return to Shop</Link>
                    </div>
                );
            }

            if (orderSuccessData) {
                return (
                    <div className="py-16 text-center max-w-xl mx-auto space-y-6 animate-hero-text">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                            <CheckCircle2 size={36} />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">Order Confirmed!</h1>
                            <p className="text-xs text-neutral-400 font-bold">Order number: <span className="text-[#1E8AF7]">{orderSuccessData.orderNumber}</span></p>
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-[#64748B]">Thank you for shopping at our store, <span className="font-bold text-neutral-700">{checkoutFullName}</span>! Your order request has been received.</p>
                        
                        <div className="border rounded-2xl p-6 bg-neutral-50 text-left space-y-3 font-semibold text-xs text-neutral-600 border-[#E2E8F0]">
                            <p className="font-bold text-neutral-800 border-b pb-2 mb-1 border-[#E2E8F0]">Delivery Address</p>
                            <p><span className="text-neutral-400">Recipient Name:</span> {checkoutFullName}</p>
                            <p><span className="text-neutral-400">Street Address:</span> {checkoutAddress}, {checkoutCity}</p>
                            <p><span className="text-neutral-400">Contact Phone:</span> {checkoutPhone}</p>
                            <p><span className="text-neutral-400">Payment Option:</span> {paymentMethod}</p>
                            <p className="border-t pt-2 border-[#E2E8F0]"><span className="text-neutral-400">Invoice Amount Paid:</span> <span className="text-[#0F172A] font-bold">Rs. {orderSuccessData.totalAmount?.toLocaleString()}</span></p>
                        </div>

                        <div className="flex gap-4 pt-4 justify-center">
                            <Link href={`/store/${storeSlug}`} className="bg-[#1E8AF7] hover:bg-[#0F74D8] text-white px-6 py-3 rounded-xl font-bold text-xs">Return to Home</Link>
                            <Link href={`/store/${storeSlug}/order-tracking`} className="border border-[#E2E8F0] hover:bg-neutral-50 text-neutral-700 px-6 py-3 rounded-xl font-bold text-xs">Track Shipment</Link>
                        </div>
                    </div>
                );
            }

            const cartItemsTotal = cartSubtotal;
            const deliveryFee = shippingFee;
            const discountAmt = couponDiscount;
            const finalTotal = Math.max(cartItemsTotal + deliveryFee - discountAmt, 0);

            return (
                <div className="space-y-12">
                    <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400 border-b pb-4 border-[#E2E8F0]">
                        <Link href={`/store/${storeSlug}`} className="hover:text-[#1E8AF7]">Cart</Link>
                        <ChevronRight size={10} />
                        <span className="text-neutral-700 font-bold">Checkout Information</span>
                    </div>

                    <div className="grid lg:grid-cols-5 gap-12 items-start">
                        <form id="checkout-form" onSubmit={handleCheckoutSubmit} className="lg:col-span-3 space-y-8 p-6 md:p-8 rounded-2xl border bg-white border-[#E2E8F0]">
                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-[#0F172A]">1. Contact Information</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Email Address</label>
                                        <input type="email" required value={checkoutEmail} onChange={(e) => setCheckoutEmail(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="customer@domain.com" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Phone Number (+92 Prefix)</label>
                                        <input type="tel" required value={checkoutPhone} onChange={(e) => setCheckoutPhone(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="+92 300 1234567" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-[#0F172A]">2. Shipping Address</h3>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                                        <input type="text" required value={checkoutFullName} onChange={(e) => setCheckoutFullName(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="Receiver Name" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Street Address</label>
                                        <input type="text" required value={checkoutAddress} onChange={(e) => setCheckoutAddress(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="House 123, Street 4" />
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Province</label>
                                            <select value={checkoutProvince} onChange={(e) => setCheckoutProvince(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-bold outline-none focus:border-[#1E8AF7] transition">
                                                {PAKISTAN_PROVINCES.map(prov => (
                                                    <option key={prov} value={prov}>{prov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">City</label>
                                            <input type="text" required value={checkoutCity} onChange={(e) => setCheckoutCity(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="Lahore" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Postal Code</label>
                                            <input type="text" required value={checkoutPostal} onChange={(e) => setCheckoutPostal(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="54000" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-base font-bold text-[#0F172A]">3. Payment Method</h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setPaymentMethod("COD")} className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${paymentMethod === "COD" ? "border-[#1E8AF7] bg-[#1E8AF7]/5" : "border-neutral-200"}`}>
                                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === "COD" ? "border-[#1E8AF7] text-[#1E8AF7]" : "border-neutral-300"}`}>
                                            {paymentMethod === "COD" && <span className="h-2 w-2 rounded-full bg-current" />}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-[#0F172A]">Cash On Delivery (COD)</p>
                                            <p className="text-[10px] font-medium text-neutral-400 mt-1">Pay cash when courier delivers the package to your door.</p>
                                        </div>
                                    </button>

                                    <button type="button" onClick={() => setPaymentMethod("JazzCash")} className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${paymentMethod === "JazzCash" ? "border-[#1E8AF7] bg-[#1E8AF7]/5" : "border-neutral-200"}`}>
                                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === "JazzCash" ? "border-[#1E8AF7] text-[#1E8AF7]" : "border-neutral-300"}`}>
                                            {paymentMethod === "JazzCash" && <span className="h-2 w-2 rounded-full bg-current" />}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-[#0F172A]">JazzCash Wallet</p>
                                            <p className="text-[10px] font-medium text-neutral-400 mt-1">Pay using JazzCash registered phone number.</p>
                                        </div>
                                    </button>

                                    <button type="button" onClick={() => setPaymentMethod("EasyPaisa")} className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition ${paymentMethod === "EasyPaisa" ? "border-[#1E8AF7] bg-[#1E8AF7]/5" : "border-neutral-200"}`}>
                                        <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${paymentMethod === "EasyPaisa" ? "border-[#1E8AF7] text-[#1E8AF7]" : "border-neutral-300"}`}>
                                            {paymentMethod === "EasyPaisa" && <span className="h-2 w-2 rounded-full bg-current" />}
                                        </span>
                                        <div>
                                            <p className="text-xs font-bold text-[#0F172A]">EasyPaisa Wallet</p>
                                            <p className="text-[10px] font-medium text-neutral-400 mt-1">Pay using EasyPaisa registered phone number.</p>
                                        </div>
                                    </button>
                                </div>

                                {(paymentMethod === "JazzCash" || paymentMethod === "EasyPaisa") && (
                                    <div className="p-4 rounded-xl border border-[#1E8AF7] bg-[#1E8AF7]/5 space-y-3">
                                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">Registered Account Phone Number</label>
                                        <input type="tel" value={walletPhone} onChange={(e) => setWalletPhone(e.target.value)} className="w-full h-11 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" placeholder="03001234567" />
                                    </div>
                                )}
                            </div>

                            {checkoutError && (
                                <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={14} /> {checkoutError}
                                </div>
                            )}

                            <div className="pt-4 border-t border-[#E2E8F0]">
                                <button type="submit" disabled={submittingOrder} className="w-full bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-4 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                    {submittingOrder ? "Processing Order..." : "Confirm & Place Order"} <CheckCircle2 size={16} />
                                </button>
                            </div>
                        </form>

                        <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl border bg-neutral-50 space-y-6 border-[#E2E8F0]">
                            <h3 className="text-base font-bold text-[#0F172A]">Order Summary</h3>
                            
                            <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                                {cart.map(item => {
                                    const original = Number(item.product.price);
                                    const sale = Number(item.product.salePrice);
                                    const current = sale && sale < original ? sale : original;
                                    return (
                                        <div key={item.product._id} className="flex gap-3 justify-between items-center text-xs font-semibold text-neutral-600">
                                            <div className="flex gap-3 items-center min-w-0">
                                                <div className="h-12 w-12 rounded bg-white border border-[#E2E8F0] shrink-0 overflow-hidden">
                                                    <img src={getImageUrl(item.product.images?.[0], item.product.category)} alt={item.product.title} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-neutral-800 truncate">{item.product.title}</p>
                                                    <p className="text-[10px] text-neutral-400 mt-0.5">Qty: {item.quantity}</p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-neutral-800 font-bold">Rs. {(current * item.quantity).toLocaleString()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-y py-4 space-y-3 border-[#E2E8F0]">
                                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Discount Code / Coupon</p>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="Type code (e.g. DISCOUNT)" value={couponCodeInput} onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())} className="flex-1 h-10 px-3 border border-[#E2E8F0] rounded-xl bg-white text-xs font-semibold outline-none focus:border-[#1E8AF7] transition" />
                                    <button type="button" onClick={validateCoupon} disabled={validatingCoupon || !couponCodeInput} className="bg-[#1E8AF7] hover:bg-[#0F74D8] text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60">{validatingCoupon ? "Validating..." : "Apply"}</button>
                                </div>
                                {appliedCoupon && (
                                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-between text-xs text-emerald-800 font-bold">
                                        <span>✓ Code {appliedCoupon.code} active ({appliedCoupon.discountValue}% OFF)</span>
                                        <button onClick={() => setAppliedCoupon(null)} className="text-emerald-600 hover:text-emerald-800 p-1"><X size={12} /></button>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2.5 text-xs font-semibold text-neutral-500">
                                <div className="flex justify-between">
                                    <span>Subtotal</span>
                                    <span className="text-neutral-800 font-bold">Rs. {cartItemsTotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Shipping Fee</span>
                                    <span className="text-neutral-800 font-bold">{deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee.toLocaleString()}`}</span>
                                </div>
                                {discountAmt > 0 && (
                                    <div className="flex justify-between text-emerald-600">
                                        <span>Coupon Discount</span>
                                        <span>- Rs. {discountAmt.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm font-bold pt-3 border-t border-[#E2E8F0] text-neutral-800">
                                    <span>Total Amount</span>
                                    <span className="text-[#1E8AF7]">Rs. {finalTotal.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (view === "products") {
            return (
                <div className="space-y-8 animate-hero-text">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6 border-[#E2E8F0]">
                        <div>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block mb-1">STORE CATALOG</span>
                            <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A]">{selectedCategory === "All" ? "All Products" : selectedCategory}</h1>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-1 max-w-full">
                            {activeCategories.map(cat => (
                                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-4 py-2 rounded-full border text-xs font-bold shrink-0 transition ${selectedCategory === cat ? "border-[#1E8AF7] bg-[#1E8AF7]/5 text-[#1E8AF7]" : "border-neutral-200 hover:border-neutral-300 text-neutral-700"}`}>{cat}</button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {filteredProducts.map((prod) => (
                            <ProductCard key={prod._id} product={prod} />
                        ))}

                        {filteredProducts.length === 0 && (
                            <div className="col-span-full py-16 text-center text-xs font-bold text-neutral-400 border border-dashed rounded-2xl bg-neutral-50/50">No products found matching your active filter.</div>
                        )}
                    </div>
                </div>
            );
        }

        if (view === "order-tracking") {
            const handleTrack = async (e) => {
                e.preventDefault();
                setTrackingError("");
                setTrackResult(null);
                if (!trackingNo.trim()) return;

                setSearchingTrack(true);
                try {
                    const res = await apiClient.get(`/storefront/${storeSlug}/order-tracking?orderNumber=${encodeURIComponent(trackingNo)}`, {
                        showToast: false, redirectOnUnauthorized: false
                    });
                    if (res.success) {
                        setTrackResult(res.data);
                    } else {
                        setTrackingError(res.message || "No matching order record found.");
                    }
                } catch (err) {
                    setTrackingError("Error connecting to shipment tracker.");
                } finally {
                    setSearchingTrack(false);
                }
            };

            return (
                <div className="max-w-xl mx-auto space-y-8 py-12 animate-hero-text">
                    <div className="text-center space-y-2">
                        <Truck className="mx-auto h-8 w-8 text-neutral-400" />
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Track Your Shipment Package</h1>
                        <p className="text-xs text-neutral-400 font-medium leading-relaxed">Enter your Storvia order confirmation number (e.g. #C29A10) to review real-time booking courier updates.</p>
                    </div>

                    <form onSubmit={handleTrack} className="flex gap-3 bg-white p-2 rounded-2xl border border-[#E2E8F0]">
                        <input type="text" required placeholder="Type order number (e.g. #C29)" value={trackingNo} onChange={(e) => setTrackingNo(e.target.value)} className="flex-1 px-4 outline-none text-xs font-semibold text-[#0F172A]" />
                        <button type="submit" disabled={searchingTrack} className="bg-[#1E8AF7] hover:bg-[#0F74D8] text-white py-2.5 px-6 rounded-xl text-xs font-bold disabled:opacity-60">{searchingTrack ? "Searching..." : "Track Package"}</button>
                    </form>

                    {trackingError && (
                        <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-600 flex items-center gap-2">
                            <AlertTriangle size={14} /> {trackingError}
                        </div>
                    )}

                    {trackResult && (
                        <div className="p-6 rounded-2xl border bg-white space-y-4 animate-hero-text border-[#E2E8F0]">
                            <div className="flex items-center justify-between border-b pb-3 border-[#E2E8F0]">
                                <h3 className="text-xs font-bold text-neutral-800">Order Booking Status</h3>
                                <span className="text-[10px] uppercase font-bold bg-[#1E8AF7]/10 text-[#1E8AF7] px-2.5 py-0.5 rounded-full">{trackResult.orderStatus}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-y-3 text-xs font-semibold text-neutral-600">
                                <p><span className="text-neutral-400">Order Number:</span> {trackResult.orderNumber}</p>
                                <p><span className="text-neutral-400">Invoice Sum:</span> Rs. {trackResult.totalAmount?.toLocaleString()}</p>
                                <p><span className="text-neutral-400">Delivery Status:</span> <span className="text-emerald-600 font-bold">{trackResult.deliveryStatus || "Not Booked"}</span></p>
                                <p><span className="text-neutral-400">Payment Status:</span> {trackResult.paymentStatus}</p>
                                {trackResult.postex?.trackingNumber && (
                                    <p className="col-span-2 font-bold text-neutral-800 mt-2">PostEx Airway Bill tracking code: <span className="underline select-all text-[#1E8AF7]">{trackResult.postex.trackingNumber}</span></p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (view === "contact") {
            return (
                <div className="max-w-xl mx-auto space-y-8 py-8 animate-hero-text">
                    <div className="text-center space-y-2">
                        <MessageSquare className="mx-auto h-8 w-8 text-neutral-400" />
                        <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Send Us A Message</h1>
                        <p className="text-xs text-neutral-400 font-medium">Have questions about our collections, sizing, or checkout payments? Send us a ticket.</p>
                    </div>
                    <ContactForm />
                </div>
            );
        }

        if (view === "cart") {
            return (
                <div className="max-w-2xl mx-auto space-y-6 py-10">
                    <h1 className="text-2xl font-extrabold text-[#0F172A]">Your Cart</h1>
                    {cart.length === 0 ? (
                        <p className="text-sm font-semibold text-neutral-400">Your cart is empty.</p>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((item) => (
                                <div key={item.product._id} className="flex items-center gap-4 border border-[#E2E8F0] rounded-xl p-4">
                                    <img src={getImageUrl(item.product.images?.[0], item.product.category)} alt={item.product.title} className="h-16 w-16 rounded-lg object-cover" />
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-[#0F172A]">{item.product.title}</p>
                                        <p className="text-xs text-neutral-400">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold">Rs. {(item.product.salePrice || item.product.price).toLocaleString()}</p>
                                </div>
                            ))}
                            <Link href={`/store/${storeSlug}/checkout`} className="inline-flex items-center justify-center bg-[#1E8AF7] hover:bg-[#0F74D8] text-white px-6 py-3 rounded-xl text-sm font-bold">
                                Proceed to Checkout
                            </Link>
                        </div>
                    )}
                </div>
            );
        }

        return <EmptyState />;
    };

    const EmptyState = () => {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white rounded-3xl border border-dashed border-neutral-200">
                <Store size={48} className="text-neutral-400 mb-4" />
                <h2 className="text-xl font-black text-neutral-800">No storefront design imported</h2>
                <p className="text-xs font-semibold text-neutral-400 max-w-sm mt-2">
                    Please go to your Admin Panel and upload an HTML/CSS design package to set up this store&apos;s interface.
                </p>
                <a href="/app/storefront" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#1E8AF7] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#0F74D8]">
                    Go to Storefront Manager
                </a>
            </div>
        );
    };

    const activePage = useMemo(() => {
        if (!managedSchema?.pages?.length) return null;
        return resolvePageForView(view, pageSlug, managedSchema.pages, productSlug);
    }, [managedSchema, pageSlug, view, productSlug]);

    const pageCommerceKind = useMemo(
        () => getPageCommerceKind(activePage, view, pageSlug),
        [activePage, view, pageSlug]
    );

    const designCommercePatterns = useMemo(
        () => (managedSchema ? extractDesignCommercePatterns(managedSchema) : null),
        [managedSchema]
    );

    const usesNativeCartDrawer = useMemo(
        () => Boolean(designCommercePatterns?.hasCartDrawer),
        [designCommercePatterns]
    );

    const openCartExperience = useCallback(() => {
        if (isManaged && !usesNativeCartDrawer) {
            router.push(`/store/${storeSlug}/cart`);
            return;
        }
        setIsCartOpen(true);
    }, [isManaged, usesNativeCartDrawer, router, storeSlug]);

    useEffect(() => {
        if (!storeSlug || view !== "page" || !pageSlug) return;
        if (isHomePageSlug(pageSlug, storeSlug)) {
            router.replace(`/store/${storeSlug}`);
        }
    }, [view, pageSlug, storeSlug, router]);

    const useFullImportedRender = useMemo(() => {
        if (!isManaged || !activePage) return false;
        if (view === "product" && activePage) return true;
        return shouldRenderFullImportedPage(view, activePage);
    }, [isManaged, view, activePage]);

    const renderSectionContent = (section) => {
        const renderHtmlBlock = (html, binding) => (
            <div
                key={binding || section.id}
                data-binding={binding || undefined}
                style={{ display: "contents" }}
                dangerouslySetInnerHTML={{ __html: html }}
            />
        );

        const applyEdits = (rawHtml) => {
            if (!rawHtml) return "";
            if (typeof window === "undefined") return rawHtml;
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(`<div>${rawHtml}</div>`, "text/html");
                const container = doc.body.firstChild;
                const edits = section.editedContent || {};

                // Only apply seller edits — never re-apply import-time placeholder text by index
                (section.editableFields || []).forEach((field) => {
                    if (edits[field.key] === undefined) return;
                    if (field.type === "text" && field.selector) {
                        const matches = container.querySelectorAll(field.selector);
                        const parts = field.key.split("_");
                        const nodeIdx = parseInt(parts[parts.length - 1], 10);
                        const target = !Number.isNaN(nodeIdx) && matches[nodeIdx] ? matches[nodeIdx] : matches[0];
                        if (target) target.textContent = edits[field.key];
                    } else if (field.type === "image") {
                        const images = container.querySelectorAll("img");
                        const parts = field.key.split("_");
                        const nodeIdx = parseInt(parts[parts.length - 1], 10);
                        const target = !Number.isNaN(nodeIdx) && images[nodeIdx] ? images[nodeIdx] : images[0];
                        if (target) target.setAttribute("src", edits[field.key]);
                    }
                });

                container.querySelectorAll('img[src]').forEach((img) => {
                    try {
                        const src = img.getAttribute('src') || '';
                        if (src.startsWith('http') || src.startsWith('data:')) return;
                        if (src.startsWith('/api/')) {
                            img.setAttribute('src', resolveAssetUrl(src));
                            return;
                        }
                        const normalized = src.replace(/^\.\//, '');
                        const matched = (managedSchema?.assets || []).find((a) =>
                            a.originalName === normalized ||
                            a.originalName?.endsWith(`/${normalized}`) ||
                            a.originalName?.split('/').pop() === normalized.split('/').pop()
                        );
                        img.setAttribute('src', resolveAssetUrl(matched?.safeUrl || src));
                    } catch {
                        // Keep original src if URL resolution fails
                    }
                });

                let outputHtml = container.innerHTML;
                if (managedSchema?.assets) {
                    managedSchema.assets.forEach(asset => {
                        if (asset.originalName && asset.safeUrl) {
                            const safeUrl = resolveAssetUrl(asset.safeUrl);
                            const escapedName = asset.originalName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                            const regex = new RegExp(`(['"\\s])(${escapedName})(['"\\s?])`, "g");
                            outputHtml = outputHtml.replace(regex, `$1${safeUrl}$3`);
                            const baseName = asset.originalName.split('/').pop();
                            if (baseName && baseName !== asset.originalName) {
                                const bnRegex = new RegExp(`(['"\\s/])(${baseName.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})(['"\\s?])`, "g");
                                outputHtml = outputHtml.replace(bnRegex, `$1${safeUrl}$3`);
                            }
                        }
                    });
                }
                outputHtml = rewriteHtmlLinksClient(
                    outputHtml,
                    routeMap,
                    storeSlug,
                    managedSchema?.pages || []
                );
                return outputHtml;
            } catch (err) {
                console.error("Error applying edits to HTML:", err);
                return rawHtml;
            }
        };

        switch (section.type) {
            case "dynamic_header":
                if (section.html || section.originalHtml) {
                    return renderHtmlBlock(applyEdits(section.html || section.originalHtml || ""), "header");
                }
                return <Header />;
            case "dynamic_footer":
                if (section.html || section.originalHtml) {
                    return renderHtmlBlock(applyEdits(section.html || section.originalHtml || ""), "footer");
                }
                return <Footer />;
            case "dynamic_product_grid":
            case "dynamic_featured_products": {
                const gridConfig = section.config || {};
                const gridProducts = resolveProductsForSection(products, gridConfig);
                const cardTemplate = gridConfig.cardTemplate || section.cardTemplate || managedSchema?.importedProducts?.cardTemplate;
                const staticFallback = applyEdits(section.originalHtml || section.html || "");
                const useDesignTemplate = gridConfig.useDesignTemplate !== false && Boolean(cardTemplate);

                if (useDesignTemplate && gridProducts.length > 0) {
                    const gridHtml = injectDesignProductGrid(staticFallback, cardTemplate, gridProducts, {
                        storeSlug,
                        resolveImage: (src, category) => getImageUrl(src, category),
                    });
                    if (gridHtml) {
                        return renderHtmlBlock(gridHtml, "product_grid");
                    }
                }

                if (staticFallback) {
                    return renderHtmlBlock(staticFallback, "product_grid_static");
                }

                if (!isManaged) {
                    const cols = gridConfig.gridColumns || 4;
                    const colClass = cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2 md:grid-cols-4";
                    return (
                        <div className="storvia-product-grid mx-auto max-w-7xl px-6 py-10" data-binding="product_grid">
                            {gridProducts.length === 0 ? (
                                <div className="py-12 text-center text-xs font-bold text-neutral-400 border border-dashed rounded-2xl">
                                    No products available yet. Add products in your admin panel.
                                </div>
                            ) : (
                                <div className={`grid ${colClass} gap-6`}>
                                    {gridProducts.map((prod) => (
                                        <ProductCard
                                            key={prod._id}
                                            product={prod}
                                            showPrice={gridConfig.showPrice !== false}
                                            showAddToCart={gridConfig.showAddToCart !== false}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }

                return renderHtmlBlock(staticFallback || "", "product_grid_empty");
            }
            case "dynamic_contact":
                if (section.html || section.originalHtml) {
                    return renderHtmlBlock(applyEdits(section.html || section.originalHtml || ""), "contact");
                }
                return (
                    <div className="mx-auto max-w-xl px-6 py-10">
                        <ContactForm />
                    </div>
                );
            case "dynamic_cart_button":
                return (
                    <button
                        type="button"
                        onClick={openCartExperience}
                        className="storvia-cart-button relative flex items-center gap-2"
                        data-binding="cart_button"
                        aria-label="Open cart"
                    >
                        <ShoppingBag size={18} />
                        {cart.length > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white bg-[#1E8AF7]">
                                {cart.reduce((sum, item) => sum + item.quantity, 0)}
                            </span>
                        )}
                    </button>
                );
            case "dynamic_search_button":
                return (
                    <button
                        type="button"
                        onClick={() => router.push(`/store/${storeSlug}/products`)}
                        className="storvia-search-button flex items-center gap-2"
                        data-binding="search_input"
                        aria-label="Search products"
                    >
                        <Search size={18} />
                    </button>
                );
            case "static_or_mapped":
            default: {
                let html = applyEdits(section.html);
                if (pageCommerceKind && sectionMatchesCommerce(section, pageCommerceKind)) {
                    html = hydrateImportedSectionHtml(html, {
                        commerceKind: pageCommerceKind,
                        cart,
                        wishlist,
                        detail,
                        reviews: productReviews,
                        checkoutPricing:
                            pageCommerceKind === "cart"
                                ? {
                                      subtotal: cartSubtotal,
                                      shippingFee,
                                      discount: couponDiscount,
                                      total: Math.max(cartSubtotal + shippingFee - couponDiscount, 0),
                                  }
                                : checkoutPricing,
                        designPatterns: designCommercePatterns,
                        shopProducts: shopProductsForView,
                        categories: activeCategories,
                        selectedCategory,
                        cardTemplate:
                            section.cardTemplate ||
                            managedSchema?.importedProducts?.cardTemplate ||
                            designCommercePatterns?.productCardTemplate ||
                            '<article class="product"><a href="#"><img alt=""><h3></h3><p></p><strong></strong></a></article>',
                        storeSlug,
                        resolveImage: (src, category) => getImageUrl(src, category),
                    });
                }
                return renderHtmlBlock(html);
            }
        }
    };

    const handleManagedLinkClick = useCallback((event) => {
        if (!isManaged) return;
        const target = event.target;

        if (target.closest?.("[data-storvia-close-drawer]")) {
            event.preventDefault();
            event.stopPropagation();
            setIsCartOpen(false);
            return;
        }

        if (target.closest?.(".cart-trigger, .cart-btn-zone button, a.cart, .quick a[href*='cart']")) {
            event.preventDefault();
            event.stopPropagation();
            openCartExperience();
            return;
        }

        const filterEl = target.closest?.("[data-storvia-category-filter]");
        if (filterEl) {
            event.preventDefault();
            event.stopPropagation();
            setSelectedCategory(filterEl.getAttribute("data-storvia-category-filter") || "All");
            return;
        }

        if (isPlaceOrderClick(target)) {
            event.preventDefault();
            event.stopPropagation();
            const root = target.closest(`.store-${storeSlug}.storvia-managed-root`);
            const form = root?.querySelector("form[data-storvia-checkout-form]");
            if (form) submitImportedCheckout(form);
            return;
        }

        if (isAddToCartClick(target)) {
            const product =
                (view === "product" && detail) ? detail : resolveProductFromClickTarget(target, products, storeSlug, detail);
            if (product) {
                event.preventDefault();
                event.stopPropagation();
                addToCart(product, 1);
                return;
            }
        }

        if (isWishlistToggleClick(target)) {
            const product = resolveProductFromClickTarget(target, products, storeSlug, detail);
            if (product) {
                event.preventDefault();
                event.stopPropagation();
                toggleWishlist(product);
                return;
            }
        }

        const addCartEl = target.closest?.("[data-storvia-add-cart]");
        if (addCartEl) {
            event.preventDefault();
            event.stopPropagation();
            const productId = addCartEl.getAttribute("data-storvia-add-cart");
            const product = products.find((p) => String(p._id) === String(productId)) || detail;
            if (product) addToCart(product, 1);
            return;
        }

        const wishEl = target.closest?.("[data-storvia-wishlist]");
        if (wishEl) {
            event.preventDefault();
            event.stopPropagation();
            const productId = wishEl.getAttribute("data-storvia-wishlist");
            const product = products.find((p) => String(p._id) === String(productId)) || detail;
            if (product) toggleWishlist(product);
            return;
        }

        const anchor = target.closest?.("a[href]");
        if (!anchor) return;
        const href = anchor.getAttribute("href") || "";

        const normalized = normalizeImportedHref(href);
        const fileBase = normalized.replace(/\.html$/i, "").split("/").pop()?.toLowerCase();
        if (fileBase) {
            const product = findProductBySlugLoose(products, fileBase);
            const productPage = managedSchema?.pages?.find((p) => {
                const pageFile = String(p.fileName || "")
                    .replace(/\.html$/i, "")
                    .split("/")
                    .pop()
                    ?.toLowerCase();
                return pageFile === fileBase && p.sections?.some((s) => /product-page/i.test(s.html || ""));
            });
            if (product && productPage) {
                event.preventDefault();
                router.push(`/store/${storeSlug}/products/${product.slug}`);
                return;
            }
        }

        const targetNav = resolveNavigationTarget({
            href,
            storeSlug,
            routeMap,
            pages: managedSchema?.pages || [],
        });

        if (targetNav.action === "external") {
            anchor.setAttribute("target", "_blank");
            anchor.setAttribute("rel", "noopener noreferrer");
            return;
        }
        if (targetNav.action === "blocked") {
            event.preventDefault();
            toast.error(targetNav.message || "Blocked unsafe link.");
            return;
        }
        if (targetNav.action === "unmapped") {
            event.preventDefault();
            toast(targetNav.message || "Page not mapped yet.");
            return;
        }
        if (targetNav.action === "navigate" && targetNav.path) {
            event.preventDefault();
            if (targetNav.path.endsWith("/cart")) {
                router.push(targetNav.path);
                return;
            }
            if (targetNav.path.includes("/wishlist")) {
                router.push(targetNav.path);
                return;
            }
            router.push(targetNav.path);
        }
    }, [
        isManaged,
        managedSchema?.pages,
        routeMap,
        router,
        storeSlug,
        products,
        addToCart,
        toggleWishlist,
        detail,
        view,
        submitImportedCheckout,
        openCartExperience,
        setSelectedCategory,
    ]);

    const managedFontLinks = useMemo(() => {
        const links = new Set();
        for (const page of managedSchema?.pages || []) {
            for (const href of page.googleFontsLinks || []) {
                if (href) links.add(href);
            }
        }
        return Array.from(links);
    }, [managedSchema]);

    const renderManagedStorefront = () => {
        if (!managedSchema) return null;
        // Use activePage if available, otherwise fall back to all home-page sections
        const page = activePage || managedSchema.pages?.[0];
        if (!page) return null;
        const rawCss = managedSchema.scopedCss || managedSchema.globalStyles?.rawCss || '';
        const scopedCss = rawCss
            .replace(/\bhtml\b/g, `.store-${storeSlug}`)
            .replace(/\bbody\b/g, `.store-${storeSlug}`);
        const cssVars = `
            .store-${storeSlug} {
                --color-primary: ${managedSchema.globalStyles?.colors?.primary || '#211815'};
                --color-secondary: ${managedSchema.globalStyles?.colors?.secondary || '#E8F3FF'};
                --color-background: ${managedSchema.globalStyles?.colors?.background || '#fbf7f0'};
                --color-text: ${managedSchema.globalStyles?.colors?.text || '#211815'};
            }
        `;
        const commerceCss = getCommerceLayoutCss(storeSlug);
        return (
            <div className={`store-${storeSlug} storvia-managed-root`} onClickCapture={handleManagedLinkClick}>
                <style dangerouslySetInnerHTML={{ __html: cssVars + scopedCss + commerceCss }} />

                {managedFontLinks.map((href, idx) => (
                    <link key={`${href}-${idx}`} rel="stylesheet" href={href} />
                ))}

                {(page.sections || []).map((section, idx) => (
                    <Fragment key={section.id || idx}>
                        {renderSectionContent(section)}
                    </Fragment>
                ))}
            </div>
        );
    };

    const renderManagedLayout = (bodyContent) => {
        if (!managedSchema) {
            return (
                <div className="flex flex-col min-h-screen bg-white">
                    <AnnouncementBar />
                    <Header />
                    <main className="flex-1 mx-auto max-w-7xl w-full px-6 py-10">
                        {bodyContent}
                    </main>
                    <Footer />
                    <MobileBottomTab />
                </div>
            );
        }

        const homeSections = managedSchema.pages?.find(p => p.id === 'home' || p.type === 'home')?.sections
            || managedSchema.pages?.[0]?.sections
            || [];
        const headerSec = homeSections.find(s =>
            s.type === "dynamic_header" ||
            s.tagName === "header" ||
            s.tagName === "nav" ||
            (s.html && /<nav[\s>]/i.test(s.html)) ||
            s.id === "section_0"
        );
        const footerSec = homeSections.find(s =>
            s.type === "dynamic_footer" ||
            s.tagName === "footer" ||
            (s.html && /<footer[\s>]/i.test(s.html)) ||
            s.id?.includes("footer") ||
            s.id === `section_${homeSections.length - 1}`
        );

        const rawCss = managedSchema.scopedCss || managedSchema.globalStyles?.rawCss || '';
        const scopedCss = rawCss
            .replace(/\bhtml\b/g, `.store-${storeSlug}`)
            .replace(/\bbody\b/g, `.store-${storeSlug}`);
        const cssVars = `
            .store-${storeSlug} {
                --color-primary: ${managedSchema.globalStyles?.colors?.primary || '#211815'};
                --color-secondary: ${managedSchema.globalStyles?.colors?.secondary || '#E8F3FF'};
                --color-background: ${managedSchema.globalStyles?.colors?.background || '#fbf7f0'};
                --color-text: ${managedSchema.globalStyles?.colors?.text || '#211815'};
            }
        `;
        const commerceCss = getCommerceLayoutCss(storeSlug);
        return (
            <div className={`store-${storeSlug} storvia-managed-root min-h-screen flex flex-col`} onClickCapture={handleManagedLinkClick}>
                <style dangerouslySetInnerHTML={{ __html: cssVars + scopedCss + commerceCss }} />

                {/* Google Fonts */}
                {(managedSchema.pages?.[0]?.googleFontsLinks || []).map((href, idx) => (
                    <link key={idx} rel="stylesheet" href={href} />
                ))}

                {/* Imported header — rendered as raw HTML fragment */}
                {headerSec ? (
                    <div style={{ display: "contents" }}>{renderSectionContent(headerSec)}</div>
                ) : <Header />}

                {/* Body content (product listing, cart, checkout, etc.) */}
                <main className="flex-1">
                    {bodyContent}
                </main>

                {/* Imported footer */}
                {footerSec ? (
                    <div style={{ display: "contents" }}>{renderSectionContent(footerSec)}</div>
                ) : <Footer />}

                <MobileBottomTab />
            </div>
        );
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-[#F8FBFF] flex flex-col">
                <div className="h-16 bg-white border-b border-[#E2E8F0] animate-pulse" />
                <div className="mx-auto max-w-7xl w-full px-6 py-10 space-y-10 flex-1">
                    <div className="h-80 bg-neutral-100 rounded-3xl animate-pulse" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, idx) => (
                            <div key={idx} className="space-y-3">
                                <div className="aspect-[4/5] bg-neutral-100 rounded-2xl animate-pulse" />
                                <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        );
    }

    if (error && !storefront) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#F8FBFF] px-6">
                <div className="max-w-md w-full rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center shadow-lg space-y-4">
                    <AlertTriangle size={32} className="mx-auto text-red-500" />
                    <h1 className="text-xl font-extrabold text-[#0F172A]">Store Unavailable</h1>
                    <p className="text-xs font-semibold text-neutral-400">{error}</p>
                </div>
            </main>
        );
    }

    return (
        <div className={`storefront-container ${isEmbed ? "" : "pb-20 md:pb-0"}`}>
            {!isManaged && !isEmbed && <AnnouncementBar />}

            {useFullImportedRender ? (
                renderManagedStorefront()
            ) : isManaged ? (
                renderManagedLayout(renderViewBody())
            ) : (
                renderManagedLayout(<EmptyState />)
            )}

            {!isEmbed && isManaged && !usesNativeCartDrawer && <DesignCartDrawer />}
            {!isEmbed && (!isManaged || usesNativeCartDrawer) && <CartDrawer />}
        </div>
    );
}
