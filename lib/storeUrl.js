"use client";

import { getSocketBaseUrl } from "./apiClient";

export function getStoreSlug(activeStore = {}) {
    return activeStore?.storeSlug || activeStore?.slug || activeStore?.domain?.slug || "";
}

export function buildStoreUrl(activeStore = {}, options = {}) {
    const { previewFallback = true, absolute = false } = options;
    const slug = getStoreSlug(activeStore);
    const path = slug && activeStore?.status === "published"
        ? `/store/${slug}`
        : previewFallback
            ? "/app/storefront/preview"
            : slug
                ? `/store/${slug}`
                : "/app/storefront/preview";

    if (!absolute || typeof window === "undefined") return path;
    return new URL(path, window.location.origin).toString();
}

export function buildDraftPreviewUrl(activeStore = {}) {
    const slug = getStoreSlug(activeStore);
    return slug ? `/app/storefront/preview?store=${encodeURIComponent(slug)}` : "/app/storefront/preview";
}

export function resolveAssetUrl(src, placeholder = "https://placehold.co/600x600?text=Image") {
    if (!src || typeof src !== "string") return placeholder;
    if (src.startsWith("blob:") || src.startsWith("data:") || /^https?:\/\//i.test(src)) return src;

    const apiBase = getApiBaseUrl().replace(/\/api$/, "");
    if (src.startsWith("/api/storefront/") || src.startsWith("/api/")) {
        return `${apiBase}${src}`;
    }

    const baseUrl = getSocketBaseUrl().replace(/\/+$/, "");
    const cleanPath = src.replace(/^\/+/, "");
    if (cleanPath.startsWith("uploads/") || cleanPath.startsWith("api/")) return `${baseUrl}/${cleanPath}`;
    return `${baseUrl}/uploads/${cleanPath}`;
}
