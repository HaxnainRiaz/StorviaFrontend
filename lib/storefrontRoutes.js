/**
 * Client-side Storvia storefront route resolution for imported stores.
 */

const BLOCKED_EXTENSIONS = new Set([
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.json', '.map', '.php', '.asp', '.aspx', '.exe', '.sh', '.bat'
]);

export function normalizeImportedHref(href) {
    if (!href || typeof href !== 'string') return '';
    const trimmed = href.trim();
    if (!trimmed || trimmed === '#') return '';
    if (/^(javascript:|data:|file:|vbscript:)/i.test(trimmed)) return 'blocked:unsafe-protocol';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
        return trimmed;
    }
    let path = trimmed.split('?')[0].split('#')[0].replace(/\\/g, '/');
    path = path.replace(/^\.\//, '').replace(/^\/+/, '');
    return path || 'index.html';
}

function basename(href) {
    const clean = String(href).split('?')[0].split('#')[0].replace(/\\/g, '/');
    const parts = clean.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
}

export function isBlockedPath(normalizedPath) {
    const ext = normalizedPath.includes('.')
        ? '.' + normalizedPath.split('.').pop().toLowerCase()
        : '';
    if (BLOCKED_EXTENSIONS.has(ext)) return true;
    if (/\.(css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(normalizedPath)) return true;
    return false;
}

export function publicPathForRoute(storeSlug, storviaRoute) {
    const base = `/store/${storeSlug}`;
    if (!storviaRoute || storviaRoute === '/') return base;
    return `${base}${storviaRoute.startsWith('/') ? storviaRoute : `/${storviaRoute}`}`;
}

export function lookupRoute(routeMap, href) {
    const normalized = normalizeImportedHref(href);
    if (!normalized) return null;
    const base = basename(normalized);
    return (routeMap || []).find(r =>
        r.originalHref === href ||
        r.originalHref === normalized ||
        r.normalizedPath === normalized ||
        r.normalizedPath === base ||
        basename(r.originalHref) === base
    ) || null;
}

export function resolveNavigationTarget({ href, storeSlug, routeMap, pages = [] }) {
    const normalized = normalizeImportedHref(href);
    if (!normalized) return { action: 'ignore' };
    if (normalized.startsWith('blocked:') || isBlockedPath(normalized)) {
        return { action: 'blocked', message: 'This link points to an unsupported file and cannot be opened.' };
    }
    if (/^https?:\/\//i.test(normalized) || normalized.startsWith('//')) {
        return { action: 'external', url: href };
    }

    const route = lookupRoute(routeMap, href);
    if (route?.storviaRoute) {
        return { action: 'navigate', path: publicPathForRoute(storeSlug, route.storviaRoute) };
    }

    const base = basename(normalized).replace(/\.html$/i, '');
    const page = pages.find(p =>
        p.fileName === normalized ||
        basename(p.fileName) === basename(normalized) ||
        p.slug === base ||
        p.id === base
    );
    if (page?.storviaRoute) {
        return { action: 'navigate', path: publicPathForRoute(storeSlug, page.storviaRoute) };
    }

    if (base === 'index' || base === 'home' || normalized === 'index.html') {
        return { action: 'navigate', path: publicPathForRoute(storeSlug, '') };
    }

    const knownRoutes = {
        about: '/pages/about',
        contact: '/contact',
        cart: '/cart',
        checkout: '/checkout',
        products: '/products',
        shop: '/products',
        collections: '/products',
    };
    if (knownRoutes[base]) {
        return { action: 'navigate', path: publicPathForRoute(storeSlug, knownRoutes[base]) };
    }
    if (base && !isBlockedPath(normalized)) {
        return { action: 'navigate', path: publicPathForRoute(storeSlug, `/pages/${base}`) };
    }

    return { action: 'unmapped', message: 'This page is not mapped yet. Please configure it in Storefront Manager → Navigation.' };
}

export function rewriteHtmlLinksClient(html, routeMap, storeSlug, pages = []) {
    if (!html || typeof html !== 'string') return html;
    if (typeof window === 'undefined') return html;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div id="storvia-root">${html}</div>`, 'text/html');
        const root = doc.getElementById('storvia-root');
        root.querySelectorAll('a[href]').forEach(anchor => {
            const href = anchor.getAttribute('href') || '';
            const target = resolveNavigationTarget({ href, storeSlug, routeMap, pages });
            if (target.action === 'external') {
                anchor.setAttribute('target', '_blank');
                anchor.setAttribute('rel', 'noopener noreferrer');
                return;
            }
            if (target.action === 'blocked') {
                anchor.setAttribute('href', '#');
                anchor.setAttribute('data-storvia-blocked', 'true');
                return;
            }
            if (target.action === 'navigate') {
                anchor.setAttribute('href', target.path);
                anchor.setAttribute('data-storvia-managed', 'true');
                return;
            }
            if (target.action === 'unmapped') {
                anchor.setAttribute('href', '#');
                anchor.setAttribute('data-storvia-unmapped', 'true');
                anchor.setAttribute('data-original-href', href);
            }
        });
        return root.innerHTML;
    } catch {
        return html;
    }
}

export const DEVICE_WIDTHS = {
    desktop: { label: 'Desktop', width: '100%', maxWidth: '1280px' },
    tablet: { label: 'Tablet', width: '768px', maxWidth: '768px' },
    mobile: { label: 'Mobile', width: '390px', maxWidth: '390px' },
};

function matchPagePattern(pages, pattern) {
    return pages.find((p) =>
        pattern.test(p.fileName || '') ||
        pattern.test(p.id || '') ||
        pattern.test(p.slug || '')
    ) || null;
}

/** Resolve which imported HTML page should render for a public storefront view. */
export function resolvePageForView(view, pageSlug, pages = []) {
    if (!pages.length) return null;

    if (view === 'home') {
        return pages.find((p) => p.id === 'home' || p.type === 'home' || p.slug === '' || p.slug === 'home') || pages[0];
    }

    if (view === 'products') {
        return pages.find((p) => p.type === 'products')
            || matchPagePattern(pages, /^(shop|products|store)(\.html)?$/i)
            || pages.find((p) => ['shop', 'products', 'store'].includes(p.slug) || ['shop', 'products'].includes(p.id));
    }

    if (view === 'contact') {
        return pages.find((p) => p.type === 'contact') || matchPagePattern(pages, /^contact/i);
    }

    if (view === 'cart') {
        return pages.find((p) => p.type === 'cart') || matchPagePattern(pages, /^cart/i);
    }

    if (view === 'checkout') {
        return pages.find((p) => p.type === 'checkout') || matchPagePattern(pages, /^checkout/i);
    }

    if (view === 'page' && pageSlug) {
        const slug = String(pageSlug).toLowerCase().replace(/\.html$/, '');
        return pages.find((p) =>
            String(p.slug || '').toLowerCase() === slug ||
            String(p.id || '').toLowerCase() === slug ||
            String(p.fileName || '').toLowerCase().replace(/\.html$/, '').replace(/\//g, '-') === slug ||
            String(p.fileName || '').toLowerCase() === `${slug}.html` ||
            String(p.fileName || '').toLowerCase().endsWith(`/${slug}.html`)
        ) || null;
    }

    return pages.find((p) => p.type === view || p.id === view) || null;
}

/** Views that should render the full imported HTML page (not Storvia fallback chrome). */
export function shouldRenderFullImportedPage(view, page) {
    if (!page) return false;
    if (['home', 'products', 'contact', 'cart', 'page'].includes(view)) return true;
    if (view === 'checkout' && (page.type === 'checkout' || /checkout/i.test(page.fileName || ''))) return true;
    return false;
}
