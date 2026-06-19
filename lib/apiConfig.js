/**
 * Central API URL resolution — works locally and on Vercel without swapping .env files.
 *
 * Local:  frontend localhost → http://localhost:5000
 * Prod:   storvia-frontend.vercel.app → https://storvia-backend.vercel.app
 *
 * Set NEXT_PUBLIC_API_URL only when you need a fixed override.
 */

export const PRODUCTION_API_URL = (
    process.env.NEXT_PUBLIC_PRODUCTION_API_URL || "https://storvia-backend.vercel.app"
).replace(/\/+$/, "").replace(/\/api$/, "");

export const LOCAL_API_URL = (
    process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://localhost:5000"
).replace(/\/+$/, "").replace(/\/api$/, "");

export const PRODUCTION_FRONTEND_URL = (
    process.env.NEXT_PUBLIC_PRODUCTION_FRONTEND_URL || "https://storvia-frontend.vercel.app"
).replace(/\/+$/, "");

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

export const isLocalHostname = (hostname = "") => LOCAL_HOSTNAMES.has(hostname);

export const isBrowserLocal = () => {
    if (typeof window === "undefined") return false;
    return isLocalHostname(window.location.hostname);
};

/** True when this Next.js process is running locally (dev server). */
export const isServerLocal = () => {
    if (process.env.VERCEL) return false;
    if (typeof window !== "undefined") return isBrowserLocal();
    return true;
};

const normalizeBase = (url) => url.replace(/\/+$/, "").replace(/\/api$/, "");

/**
 * Backend origin without /api — used for sockets, uploads, OAuth callbacks.
 */
export const resolveBackendBaseUrl = () => {
    const configured = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SOCKET_URL;
    if (configured) {
        let base = normalizeBase(configured);
        if (typeof window !== "undefined" && !isBrowserLocal() && base.includes("localhost")) {
            base = PRODUCTION_API_URL;
        } else if (typeof window === "undefined" && !isServerLocal() && base.includes("localhost")) {
            base = PRODUCTION_API_URL;
        }
        return base;
    }

    if (typeof window !== "undefined") {
        return isBrowserLocal() ? LOCAL_API_URL : PRODUCTION_API_URL;
    }

    return isServerLocal() ? LOCAL_API_URL : PRODUCTION_API_URL;
};

export const getApiBaseUrl = () => {
    const base = resolveBackendBaseUrl();
    return base.endsWith("/api") ? base : `${base}/api`;
};

export const getSocketBaseUrl = () => resolveBackendBaseUrl();
