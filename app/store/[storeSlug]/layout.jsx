"use client";

import { useParams, usePathname } from "next/navigation";
import PublicStorefront from "@/components/storvia/PublicStorefront";
import { resolveStorefrontView } from "@/lib/resolveStorefrontView";

/**
 * Keep one PublicStorefront instance alive while navigating between store routes.
 * Avoids full remounts, reload flicker, and repeated data fetches on every page change.
 */
export default function StoreSlugLayout() {
    const params = useParams();
    const pathname = usePathname();
    const storeSlug = params?.storeSlug;
    const view = resolveStorefrontView(pathname, storeSlug);

    return <PublicStorefront view={view} />;
}
