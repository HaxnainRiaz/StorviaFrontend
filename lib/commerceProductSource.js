/**
 * Resolve live seller products for a mapped product grid section.
 */

export function resolveProductsForSection(products = [], config = {}) {
    const source = config.source || 'newest_products';
    const limit = Number(config.limit) || 8;
    const collectionId = config.collectionId;

    let list = Array.isArray(products) ? [...products] : [];

    switch (source) {
        case 'best_sellers':
        case 'best_seller':
            list = list.filter((p) => p.isBestSeller || p.productType === 'best_seller');
            list.sort((a, b) => (b.soldCount || b.orderCount || 0) - (a.soldCount || a.orderCount || 0));
            break;
        case 'new_arrival':
        case 'new_arrivals':
            list = list.filter((p) => p.isNewArrival || p.productType === 'new_arrival');
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
        case 'featured_products':
        case 'featured':
            list = list.filter((p) => p.isFeatured || p.productType === 'featured');
            break;
        case 'discounted_products':
        case 'discounted':
            list = list.filter((p) => p.salePrice && p.salePrice < p.price);
            break;
        case 'manual_products':
        case 'manual':
            if (config.productIds?.length) {
                list = config.productIds
                    .map((id) => list.find((p) => String(p._id) === String(id)))
                    .filter(Boolean);
            }
            break;
        case 'category':
            if (config.categoryId) {
                list = list.filter(
                    (p) =>
                        String(p.category?._id || p.category) === String(config.categoryId)
                );
            }
            break;
        case 'collection':
            if (collectionId && config.collectionProductIds?.length) {
                list = config.collectionProductIds
                    .map((id) => list.find((p) => String(p._id) === String(id)))
                    .filter(Boolean);
            }
            break;
        case 'newest_products':
        case 'newest':
        default:
            list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            break;
    }

    return list.slice(0, limit);
}

export const PRODUCT_SOURCE_OPTIONS = [
    { value: 'newest_products', label: 'Newest products' },
    { value: 'best_sellers', label: 'Best sellers' },
    { value: 'new_arrival', label: 'New arrivals' },
    { value: 'featured_products', label: 'Featured products' },
    { value: 'discounted_products', label: 'Discounted products' },
    { value: 'manual_products', label: 'Manually selected' },
    { value: 'category', label: 'By category' },
    { value: 'collection', label: 'By collection' },
];
