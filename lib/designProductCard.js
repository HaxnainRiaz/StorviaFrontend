/**
 * Hydrate imported design product-card HTML with live catalog data.
 */

function formatPrice(value) {
    const amount = Number(value) || 0;
    return amount.toLocaleString('en-PK');
}

export function hydrateProductCard(templateHtml, product, { storeSlug, resolveImage }) {
    if (!templateHtml || !product) return '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-storvia-card-root="1">${templateHtml}</div>`, 'text/html');
        const card = doc.querySelector('[data-storvia-card-root]')?.firstElementChild;
        if (!card) return templateHtml;

        const currentPrice =
            product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;
        const originalPrice = product.price;
        const isSale = product.salePrice && product.salePrice < product.price;
        const imageUrl = resolveImage(product.images?.[0], product.category);
        const productPath = `/store/${storeSlug}/products/${product.slug || product._id}`;

        const img = card.querySelector('img');
        if (img) {
            img.setAttribute('src', imageUrl);
            img.setAttribute('alt', product.title || '');
        }

        const titleEl = card.querySelector(
            'h1,h2,h3,h4,h5,h6,[class*="product-title"],[class*="product_name"],[class*="title"],[class*="name"],.product-info h3'
        );
        if (titleEl) titleEl.textContent = product.title || '';

        const categoryTitle =
            typeof product.category === 'object' ? product.category?.title : product.category;
        const tagEl = card.querySelector('.tag, [class*="tag"]');
        if (tagEl && categoryTitle) tagEl.textContent = categoryTitle;

        const descEl = card.querySelector('.product-info > p');
        if (descEl && product.description) {
            const plain = String(product.description)
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            if (plain) descEl.textContent = plain.slice(0, 140);
        }

        card.querySelectorAll('[class*="price"],[class*="amount"],[data-price],.price,span.price').forEach((el) => {
            const text = el.textContent || '';
            if (/\d/.test(text)) {
                el.textContent = text.replace(/[\d,.]+/g, formatPrice(currentPrice));
            }
        });

        card.querySelectorAll('[class*="compare"],[class*="old-price"],[class*="was"],del,s').forEach((el) => {
            if (isSale && /\d/.test(el.textContent || '')) {
                el.textContent = (el.textContent || '').replace(/[\d,.]+/g, formatPrice(originalPrice));
            }
        });

        card.querySelectorAll('a[href]').forEach((link) => {
            const href = link.getAttribute('href') || '';
            const hay = `${link.className || ""} ${link.textContent || ""}`.toLowerCase();
            if (/add[\s_-]?to[\s_-]?(cart|bag)|buy[\s_-]?now/.test(hay)) {
                link.setAttribute('data-storvia-add-cart', String(product._id));
                link.setAttribute('href', '#');
                return;
            }
            if (!href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
                link.setAttribute('href', productPath);
            }
        });

        const actionEl = card.querySelector('button, [class*="cart"], [class*="add"], [class*="bag"], .mini-btn, a.btn');
        if (actionEl) {
            actionEl.setAttribute('type', 'button');
            actionEl.setAttribute('data-storvia-add-cart', String(product._id));
        }

        card.setAttribute('data-storvia-product-id', String(product._id));
        return card.outerHTML;
    } catch {
        return templateHtml;
    }
}

/**
 * Replace only product-card slots inside a section — preserve headings, banners, layout wrappers.
 */
export function injectDesignProductGrid(wrapperHtml, cardTemplate, products, options) {
    if (!cardTemplate || !products.length) return wrapperHtml || '';

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-storvia-grid-root="1">${wrapperHtml || ''}</div>`, 'text/html');
        const root = doc.querySelector('[data-storvia-grid-root]');
        if (!root) return wrapperHtml || '';

        const templateDoc = parser.parseFromString(`<div>${cardTemplate}</div>`, 'text/html');
        const templateCard = templateDoc.body.firstElementChild;
        if (!templateCard) return wrapperHtml || '';

        const gridContainer = root.querySelector(
            '.grid, [class*="product-grid"], [class*="products-grid"], [class*="shop-grid"], [class*="product-list"], [class*="catalog"]'
        );

        if (gridContainer) {
            gridContainer.innerHTML = products
                .map((product) => hydrateProductCard(cardTemplate, product, options))
                .join('');
            return root.innerHTML;
        }

        const tag = templateCard.tagName.toLowerCase();
        const firstClass = (templateCard.className || '').trim().split(/\s+/).filter(Boolean)[0];
        const selector = firstClass ? `${tag}.${firstClass}` : tag;
        const matches = Array.from(root.querySelectorAll(selector));

        if (matches.length > 0) {
            const parent = matches[0].parentElement;
            matches.forEach((node, index) => {
                if (index < products.length) {
                    node.outerHTML = hydrateProductCard(cardTemplate, products[index], options);
                } else {
                    node.remove();
                }
            });
            if (parent && products.length > matches.length) {
                for (let i = matches.length; i < products.length; i += 1) {
                    parent.insertAdjacentHTML('beforeend', hydrateProductCard(cardTemplate, products[i], options));
                }
            }
            return root.innerHTML;
        }

        return wrapperHtml || '';
    } catch {
        return wrapperHtml || '';
    }
}
