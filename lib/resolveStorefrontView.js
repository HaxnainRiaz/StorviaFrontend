/**
 * Map a storefront URL path to the PublicStorefront view key.
 */
export function resolveStorefrontView(pathname = "", storeSlug = "") {
    const base = `/store/${storeSlug}`;
    if (!pathname || !storeSlug || !pathname.startsWith(base)) {
        return "home";
    }

    const rest = pathname.slice(base.length).replace(/^\//, "");
    if (!rest) return "home";
    if (rest === "products") return "products";
    if (rest === "cart") return "cart";
    if (rest === "checkout") return "checkout";
    if (rest === "contact") return "contact";
    if (rest === "order-tracking") return "order-tracking";
    if (rest.startsWith("products/")) return "product";
    if (rest.startsWith("collections/")) return "collection";
    if (rest.startsWith("categories/")) return "products";
    if (rest.startsWith("pages/")) return "page";

    const catchAll = rest.split("/").filter(Boolean);
    if (catchAll.length) return "page";

    return "home";
}
