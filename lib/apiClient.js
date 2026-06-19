"use client";

import toast from "react-hot-toast";
import { getApiBaseUrl, getSocketBaseUrl } from "./apiConfig";

export { getApiBaseUrl, getSocketBaseUrl } from "./apiConfig";

const isBrowser = () => typeof window !== "undefined";
const isDevelopment = process.env.NODE_ENV !== "production";

export const normalizeApiResponse = ({ success, data = null, message = "", status = 200, errors = [], endpoint = "" }) => ({
    success,
    data,
    message,
    status,
    errors,
    endpoint,
});

const getStoredToken = () => {
    if (!isBrowser()) return null;
    return localStorage.getItem("token");
};

export async function apiRequest(endpoint, options = {}) {
    const {
        method = "GET",
        body = null,
        token = getStoredToken(),
        storeId,
        headers = {},
        showToast = true,
        redirectOnUnauthorized = false,
    } = options;

    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${getApiBaseUrl()}${normalizedEndpoint}`;
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

    const requestHeaders = {
        ...(body && !isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(storeId ? { "x-store-id": storeId } : {}),
        ...headers,
    };

    try {
        if (isDevelopment) console.debug(`[Storvia API] ${method} ${url}`);

        const response = await fetch(url, {
            method,
            headers: requestHeaders,
            body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
        });

        const contentType = response.headers.get("content-type") || "";
        const payload = contentType.includes("application/json") ? await response.json() : await response.text();
        const isJsonObject = payload && typeof payload === "object" && !Array.isArray(payload);
        const message = isJsonObject ? payload.message || "" : String(payload || "");
        const errors = isJsonObject ? payload.errors || payload.errorDetails || [] : [];

        if (response.status === 401 && isBrowser() && redirectOnUnauthorized) {
            localStorage.removeItem("token");
            if (showToast) toast.error("Session expired. Please login again.");
            const path = window.location.pathname || "";
            if (!path.startsWith("/login") && !path.startsWith("/app/")) {
                window.location.href = "/login";
            }
        } else if (response.status === 401 && isBrowser() && !redirectOnUnauthorized) {
            // Signal session issues without hard-redirecting protected admin routes
            window.dispatchEvent(new CustomEvent("storvia:auth-expired"));
        } else if (response.status === 403 && showToast) {
            toast.error(message || "You do not have permission to perform this action.");
        } else if (response.status === 429 && showToast) {
            toast.error(message || "Too many requests. Please wait and try again.");
        } else if (!response.ok && response.status >= 500 && showToast) {
            toast.error(message || "Server error. Please try again.");
        }

        if (!response.ok) {
            if (isDevelopment) console.warn(`[Storvia API] ${normalizedEndpoint} failed:`, response.status, message);
            return normalizeApiResponse({
                success: false,
                data: isJsonObject ? payload.data ?? payload : null,
                message: message || `Request failed (${response.status})`,
                status: response.status,
                errors,
                endpoint: normalizedEndpoint,
            });
        }

        if (isJsonObject && "success" in payload) {
            return normalizeApiResponse({
                success: Boolean(payload.success),
                data: Object.prototype.hasOwnProperty.call(payload, "data") ? payload.data : payload,
                message,
                status: response.status,
                errors,
                endpoint: normalizedEndpoint,
            });
        }

        return normalizeApiResponse({
            success: true,
            data: payload,
            message,
            status: response.status,
            errors,
            endpoint: normalizedEndpoint,
        });
    } catch (error) {
        const isNetworkError =
            error?.name === "TypeError" &&
            (error?.message === "Failed to fetch" || error?.message?.includes("NetworkError"));

        const message = isNetworkError
            ? `Cannot reach the backend. Start StoreBackend (npm run dev) and restart the frontend. (${normalizedEndpoint})`
            : `Backend request failed. (${normalizedEndpoint})`;

        if (isDevelopment) {
            console.error(`[Storvia API] ${isNetworkError ? "Network" : "Request"} error for ${normalizedEndpoint}:`, error?.message || error);
        }
        if (showToast && isNetworkError) toast.error("Backend is not reachable. Is StoreBackend running on port 5000?");
        else if (showToast && !isNetworkError) toast.error(message);

        return normalizeApiResponse({ success: false, data: null, message, status: 0, errors: [], endpoint: normalizedEndpoint });
    }
}

export const apiClient = {
    get: (endpoint, options) => apiRequest(endpoint, { ...options, method: "GET" }),
    post: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "POST", body }),
    put: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "PUT", body }),
    patch: (endpoint, body, options) => apiRequest(endpoint, { ...options, method: "PATCH", body }),
    delete: (endpoint, options) => apiRequest(endpoint, { ...options, method: "DELETE" }),
};
