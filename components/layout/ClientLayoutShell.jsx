'use client';

import { useEffect, useState } from 'react';
import SidebarWrapper from '@/components/admin/SidebarWrapper';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { ProtectedRoute } from '@/context/AuthContext';

const OrderSlider = dynamic(() => import('@/components/admin/OrderSlider').then((mod) => mod.default), {
    ssr: false,
    loading: () => null,
});

/**
 * ClientLayoutShell - Main layout wrapper
 * - Handles sidebar visibility based on route
 * - Does NOT handle authentication (that's done at page level)
 */
export default function ClientLayoutShell({ children }) {
    const pathname = usePathname();
    const [isLoginPage, setIsLoginPage] = useState(false);
    const [isPublicPage, setIsPublicPage] = useState(false);
    const [isEmbedFrame, setIsEmbedFrame] = useState(() => {
        if (typeof window === "undefined") return false;
        return new URLSearchParams(window.location.search).get("embed") === "1";
    });

    useEffect(() => {
        const authPath = ['/login', '/signup', '/forgot-password'].includes(pathname);
        const publicPath = ['/', '/features', '/pricing', '/examples', '/contact'].includes(pathname) || pathname?.startsWith('/store/');
        const embed = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('embed') === '1';
        setIsLoginPage(authPath);
        setIsPublicPage(publicPath || authPath);
        setIsEmbedFrame(embed);
    }, [pathname]);

    if (isEmbedFrame) {
        return <>{children}</>;
    }

    const layoutContent = (
        <SidebarWrapper isLoginPage={isPublicPage}>
            {children}
            {!isPublicPage && <OrderSlider />}
        </SidebarWrapper>
    );

    return (
        <ProtectedRoute isLoginPage={isLoginPage}>
            {layoutContent}
        </ProtectedRoute>
    );
}
