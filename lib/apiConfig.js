/**
 * Central API URL resolution — works locally and on Vercel without swapping .env files.
 *
 * Browser requests use same-origin `/api` (proxied by Next.js → backend).
 * Server-side code talks directly to the backend origin.
 */

export const PRODUCTION_API_URL = (
    process.env.NEXT_PUBLIC_PRODUCTION_API_URL || "https://storvia-backend.vercel.app"
).replace(/\/+$/, "").replace(/\/api$/, "");

export const LOCAL_API_URL = (
    process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://127.0.0.1:5000"
).replace(/\/+$/, "").replace(/\/api$/, "");

export const PRODUCTION_FRONTEND_URL = (
    process.env.NEXT_PUBLIC_PRODUCTION_FRONTEND_URL || "https://storvia-frontend.vercel.app"
).replace(/\/+$/, "");

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

const isPrivateNetworkHost = (hostname = "") => {
    if (!hostname) return false;
    if (LOCAL_HOSTNAMES.has(hostname)) return true;
    if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    return false;
};

export const isLocalHostname = (hostname = "") => isPrivateNetworkHost(hostname);

export const isBrowserLocal = () => {
    if (typeof window === "undefined") return false;
    return isPrivateNetworkHost(window.location.hostname);
};

/** True when this Next.js process is running locally (dev server). */
export const isServerLocal = () => {
    if (process.env.VERCEL) return false;
    if (typeof window !== "undefined") return isBrowserLocal();
    return true;
};

const normalizeBase = (url) => url.replace(/\/+$/, "").replace(/\/api$/, "");

/**
 * Direct backend origin (no /api) — for SSR, sockets, uploads, OAuth callbacks.
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
        return base.replace("localhost", "127.0.0.1");
    }

    if (typeof window !== "undefined") {
        return isBrowserLocal() ? LOCAL_API_URL : PRODUCTION_API_URL;
    }

    return isServerLocal() ? LOCAL_API_URL : PRODUCTION_API_URL;
};

/**
 * API base URL used by fetch().
 * Browser → same-origin proxy (/api). Server → direct backend /api.
 */
export const getApiBaseUrl = () => {
    if (typeof window !== "undefined") {
        return "/api";
    }
    const base = resolveBackendBaseUrl();
    return base.endsWith("/api") ? base : `${base}/api`;
};

export const getSocketBaseUrl = () => resolveBackendBaseUrl();
