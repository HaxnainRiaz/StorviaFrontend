"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [activeStore, setActiveStore] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [setupStatus, setSetupStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hydrated, setHydrated] = useState(false);

    const buildCookie = (tokenValue = "", maxAge = 0) => {
        const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
        return `token=${tokenValue}; Path=/; SameSite=Lax; Max-Age=${maxAge}${isSecure ? "; Secure" : ""}`;
    };

    const setAuthCookie = (tokenValue) => {
        document.cookie = buildCookie(tokenValue, 60 * 60 * 24 * 7);
    };

    const clearAuthCookie = () => {
        document.cookie = buildCookie("", 0);
    };

    const applySession = useCallback((sessionData, tokenValue) => {
        const sessionUser = sessionData?.user || sessionData;
        const store = sessionData?.activeStore || sessionData?.store || sessionData?.storeContext?.store || null;
        const perms = sessionData?.permissions || sessionData?.storeContext?.permissions || [];

        setUser(sessionUser || null);
        setActiveStore(store);
        setPermissions(perms);
        setSetupStatus(sessionData?.setupStatus || store?.setupStatus || null);
        if (tokenValue) setAuthCookie(tokenValue);
    }, []);

    const refreshSession = useCallback(async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return null;
        const res = await apiRequest("/auth/me", {
            token,
            showToast: false,
            redirectOnUnauthorized: false,
        });
        if (res.success && res.data) applySession(res.data, token);
        return res;
    }, [applySession]);

    useEffect(() => {
        if (typeof window === "undefined") {
            setHydrated(true);
            return;
        }

        const initAuth = async () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setLoading(false);
                setHydrated(true);
                return;
            }

            const res = await apiRequest("/auth/me", {
                token,
                showToast: false,
                redirectOnUnauthorized: false,
            });

            if (res.success && res.data) {
                applySession(res.data, token);
            } else {
                localStorage.removeItem("token");
                clearAuthCookie();
                setUser(null);
                setActiveStore(null);
                setPermissions([]);
                setSetupStatus(null);
            }

            setLoading(false);
            setHydrated(true);
        };

        initAuth();
    }, [applySession]);

    useEffect(() => {
        if (typeof window === "undefined") return undefined;
        const handleStoreUpdate = () => { refreshSession(); };
        window.addEventListener("storvia:store-updated", handleStoreUpdate);
        return () => window.removeEventListener("storvia:store-updated", handleStoreUpdate);
    }, [refreshSession]);

    const login = useCallback(async (email, password) => {
        const res = await apiRequest("/auth/login", {
            method: "POST",
            body: { email, password },
            token: null,
            redirectOnUnauthorized: false,
        });

        if (!res.success) {
            return { success: false, message: res.message || "Login failed" };
        }

        const token = res.token || res.data?.token;
        const loginUser = res.user || res.data?.user || null;

        if (!token) {
            return { success: false, message: "Login response did not include a session token." };
        }

        localStorage.setItem("token", token);
        setAuthCookie(token);
        setUser(loginUser);

        const me = await apiRequest("/auth/me", {
            token,
            showToast: false,
            redirectOnUnauthorized: false,
        });

        if (me.success && me.data) {
            applySession(me.data, token);
        }

        return { success: true };
    }, [applySession]);

    const logout = useCallback(async () => {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
            await apiRequest("/auth/logout", {
                method: "POST",
                token,
                showToast: false,
                redirectOnUnauthorized: false,
            });
        }
        localStorage.removeItem("token");
        clearAuthCookie();
        setUser(null);
        setActiveStore(null);
        setPermissions([]);
        setSetupStatus(null);
    }, []);

    const value = useMemo(() => ({
        user,
        activeStore,
        permissions,
        setupStatus,
        loading,
        login,
        logout,
        refreshSession,
        hydrated,
    }), [user, activeStore, permissions, setupStatus, loading, login, logout, refreshSession, hydrated]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        return {
            user: null,
            activeStore: null,
            permissions: [],
            setupStatus: null,
            loading: true,
            login: async () => ({ success: false, message: "Auth not initialized" }),
            logout: () => {},
            hydrated: false,
        };
    }

    return context;
};

export const ProtectedRoute = ({ children, isLoginPage = false }) => {
    const { user, activeStore, setupStatus, loading, hydrated } = useAuth();
    const pathname = usePathname();
    const [canRender, setCanRender] = useState(false);

    useEffect(() => {
        if (!hydrated) return;

        const publicPaths = ["/", "/features", "/pricing", "/examples", "/contact", "/signup", "/forgot-password"];
        const isPublicPath = publicPaths.includes(pathname) || pathname?.startsWith("/store/");

        if (isPublicPath) {
            setCanRender(true);
            return;
        }

        const isOnboarding = pathname === "/app/onboarding";
        const storeExists = Boolean(activeStore);

        // Login page: if user is logged in, offer continue — but DO NOT auto-redirect
        // We only redirect if they just logged in (handled by login() callback)
        if (isLoginPage) {
            setCanRender(true);
            return;
        }

        // Not authenticated
        if (!loading && !user) {
            window.location.replace("/login");
            return;
        }

        // Authenticated but no store at all → go to onboarding
        if (user && !storeExists && !isOnboarding) {
            window.location.replace("/app/onboarding");
            return;
        }

        // Authenticated + store exists → allow access to ALL /app/* routes
        // (setup checklist will show inside the page, not as a redirect)
        setCanRender(true);
    }, [user, activeStore, setupStatus, loading, hydrated, isLoginPage, pathname]);

    if (isLoginPage) return <>{children}</>;

    if (!hydrated || loading || !canRender) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8FBFF]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1E8AF7] border-t-transparent" />
            </div>
        );
    }

    return <>{children}</>;
};
