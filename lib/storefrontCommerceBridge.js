/**
 * Connect imported HTML commerce UI (AURA VALE-style designs) to live Storvia cart/checkout/wishlist.
 */

import { hydrateProductCard, injectDesignProductGrid } from "./designProductCard";
import { ensureCartPageStructure } from "./designCommerceFallback";

export function stripRichText(value) {
    if (!value) return "";
    if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map((op) => op.insert || "").join("").trim();
                }
            } catch {
                /* plain text */
            }
        }
        return trimmed;
    }
    return String(value);
}

export function sectionMatchesCommerce(section, commerceKind) {
    if (!commerceKind || !section) return false;
    const html = `${section.html || ""} ${section.originalHtml || ""}`.toLowerCase();
    const tag = String(section.tagName || "").toLowerCase();
    switch (commerceKind) {
        case "cart":
            return (
                tag === "main" ||
                /\.cart-item|cart-layout|your bag|shopping bag|order summary/i.test(html)
            );
        case "checkout":
            return tag === "main" || /<form|form-card|checkout/.test(html);
        case "wishlist":
            return /wishlist/.test(html) && /class=["'][^"']*grid|article\.product/.test(html);
        case "product":
            return /product-page|product-detail|main-product-img/.test(html);
        case "shop":
            return (
                tag === "main" ||
                /\.filters|article\.product|class=["'][^"']*product|shop all|product-grid/i.test(html)
            );
        default:
            return false;
    }
}

export function formatPkr(amount) {
    return `PKR ${(Number(amount) || 0).toLocaleString("en-PK")}`;
}

const CHECKOUT_LAYOUT_STYLES = `
.storvia-checkout-layout.cart-layout{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,380px);gap:28px;align-items:start}
.storvia-checkout-form-col{background:#fff;border:1px solid #eadccb;border-radius:22px;padding:24px}
.storvia-checkout-summary{background:#fff;border:1px solid #eadccb;border-radius:22px;padding:22px;position:sticky;top:96px}
.storvia-checkout-summary h2{margin:0 0 16px;font-size:22px}
.storvia-order-items{display:flex;flex-direction:column;gap:12px;margin-bottom:18px;max-height:360px;overflow:auto;padding-right:4px}
.storvia-order-item-card{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px;background:#fbf7f0;border:1px solid #eadccb;border-radius:16px}
.storvia-order-item-card img{width:72px;height:72px;object-fit:cover;border-radius:12px}
.storvia-order-item-body h3{margin:0 0 4px;font-size:15px;line-height:1.3}
.storvia-order-item-qty,.storvia-order-item-unit{margin:0;font-size:12px;color:#7a6558}
.storvia-order-item-total{font-size:14px;white-space:nowrap}
.storvia-coupon-row{display:flex;gap:8px;margin:14px 0}
.storvia-coupon-row input{flex:1;min-width:0;padding:12px 14px;border:1px solid #eadccb;border-radius:12px;background:#fff}
.storvia-coupon-row button{padding:12px 16px;border:none;border-radius:12px;background:#211815;color:#f9e8cf;font-weight:700;cursor:pointer}
.storvia-coupon-applied{margin:0 0 12px;font-size:12px;color:#2f6b3b;font-weight:700}
.storvia-totals{border-top:1px solid #eadccb;padding-top:14px;display:flex;flex-direction:column;gap:8px}
.storvia-totals p,.storvia-totals h3{margin:0;display:flex;justify-content:space-between;gap:12px;font-size:14px}
.storvia-totals h3{font-size:18px;margin-top:6px;padding-top:10px;border-top:1px solid #eadccb}
.storvia-checkout-empty{margin:0;color:#7a6558}
@media (max-width:900px){.storvia-checkout-layout.cart-layout{grid-template-columns:1fr}.storvia-checkout-summary{position:static}}
`;

function buildCheckoutItemCard(item, resolveImage) {
    const unitPrice =
        item.product.salePrice && item.product.salePrice < item.product.price
            ? item.product.salePrice
            : item.product.price;
    const imageUrl = resolveImage
        ? resolveImage(item.product.images?.[0], item.product.category)
        : item.product.images?.[0] || "";
    const title = item.product.title || "Product";

    return `<div class="storvia-order-item-card" data-storvia-cart-item="${item.product._id}">
      <img src="${imageUrl}" alt="${title.replace(/"/g, "&quot;")}" />
      <div class="storvia-order-item-body">
        <h3>${title}</h3>
        <p class="storvia-order-item-qty">Qty: ${item.quantity}</p>
        <p class="storvia-order-item-unit">${formatPkr(unitPrice)} each</p>
      </div>
      <strong class="storvia-order-item-total">${formatPkr(unitPrice * item.quantity)}</strong>
    </div>`;
}

function buildCheckoutSummaryPanel(cart = [], pricing = {}, options = {}) {
    const {
        subtotal = 0,
        shippingFee = 0,
        discount = 0,
        total = 0,
        appliedCoupon = null,
        couponCode = "",
    } = pricing;

    if (!cart.length) {
        return `<aside class="summary storvia-checkout-summary"><h2>Order Summary</h2><p class="storvia-checkout-empty">Your bag is empty.</p></aside>`;
    }

    const resolveImage = options.resolveImage || ((src) => src || "");
    const itemsHtml = cart.map((item) => buildCheckoutItemCard(item, resolveImage)).join("");

    const couponLabel = appliedCoupon
        ? appliedCoupon.discountType === "percentage"
            ? `${appliedCoupon.code} (${appliedCoupon.discountValue}% off)`
            : appliedCoupon.discountType === "free_shipping"
              ? `${appliedCoupon.code} (free shipping)`
              : `${appliedCoupon.code} (${formatPkr(appliedCoupon.discountValue)} off)`
        : "";

    return `<aside class="summary storvia-checkout-summary">
      <h2>Order Summary</h2>
      <div class="storvia-order-items">${itemsHtml}</div>
      <div class="storvia-coupon-row">
        <input type="text" data-storvia-coupon-input placeholder="Promo code" value="${String(couponCode || "").replace(/"/g, "&quot;")}" />
        <button type="button" data-storvia-apply-coupon>Apply</button>
      </div>
      ${appliedCoupon ? `<p class="storvia-coupon-applied">✓ ${couponLabel}</p>` : ""}
      <div class="storvia-totals">
        <p><span>Subtotal</span><span>${formatPkr(subtotal)}</span></p>
        ${discount > 0 ? `<p><span>Discount</span><span>- ${formatPkr(discount)}</span></p>` : ""}
        <p><span>Shipping</span><span>${shippingFee === 0 ? "Free" : formatPkr(shippingFee)}</span></p>
        <h3><span>Total</span><span>${formatPkr(total)}</span></h3>
      </div>
    </aside>`;
}

function buildReviewSectionHtml(reviews = [], productId = "") {
    const listHtml =
        reviews.length === 0
            ? '<p class="storvia-no-reviews">Be the first to review this product.</p>'
            : reviews
                  .map(
                      (rev) => `<div class="quote-card storvia-review" data-review-id="${rev._id}">
            <p>“${String(rev.comment || "").replace(/"/g, "&quot;")}”</p>
            <strong>${rev.name || "Customer"}</strong>
            <span>${"★".repeat(rev.rating || 0)}${"☆".repeat(5 - (rev.rating || 0))}</span>
          </div>`
                  )
                  .join("");

    return `<div class="storvia-reviews-block" data-storvia-product-id="${productId}">
      <div class="testimonials storvia-review-list">${listHtml}</div>
      <form class="storvia-review-form" data-storvia-review-form="${productId}">
        <h3>Write a review</h3>
        <input type="text" name="name" placeholder="Your name" required />
        <div class="storvia-rating-picker" data-storvia-rating-picker>
          ${[1, 2, 3, 4, 5].map((n) => `<button type="button" data-rating="${n}" aria-label="${n} stars">★</button>`).join("")}
        </div>
        <input type="hidden" name="rating" value="5" />
        <textarea name="comment" rows="3" placeholder="Share your experience..." required></textarea>
        <button type="submit" class="btn primary">Submit Review</button>
      </form>
    </div>`;
}

export function findProductBySlugLoose(products = [], slug = "") {
    if (!slug) return null;
    const exact = products.find((p) => p.slug === slug || String(p._id) === slug);
    if (exact) return exact;
    const base = String(slug).replace(/-\d+$/, "");
    return (
        products.find((p) => p.slug === base || p.slug?.startsWith(`${base}-`)) ||
        products.find((p) => p.title && p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").includes(base))
    );
}

export function resolveProductSlugFromHref(href = "", storeSlug = "") {
    const clean = String(href);
    const storeMatch = clean.match(new RegExp(`/store/${storeSlug}/products/([^/?#]+)`, "i"));
    if (storeMatch) return storeMatch[1];
    const generic = clean.match(/products?\/([^/?#]+)/i);
    if (generic) return generic[1];
    const file = clean.split("?")[0].split("#")[0].split("/").pop() || "";
    return file.replace(/\.html$/i, "") || null;
}

export function resolveProductFromClickTarget(target, products = [], storeSlug = "", detail = null) {
    if (!target) return detail || null;

    const addEl = target.closest?.("[data-storvia-add-cart]");
    if (addEl) {
        const id = addEl.getAttribute("data-storvia-add-cart");
        return products.find((p) => String(p._id) === String(id)) || detail;
    }

    const wishEl = target.closest?.("[data-storvia-wishlist]");
    if (wishEl) {
        const id = wishEl.getAttribute("data-storvia-wishlist");
        return products.find((p) => String(p._id) === String(id)) || detail;
    }

    const card = target.closest?.(
        'article.product, [class*="product-card"], [class*="product-item"], .product, [data-storvia-product-id]'
    );
    if (card) {
        const id = card.getAttribute("data-storvia-product-id");
        if (id) return products.find((p) => String(p._id) === String(id));

        const link = card.querySelector('a[href]');
        if (link) {
            const slug = resolveProductSlugFromHref(link.getAttribute("href") || "", storeSlug);
            const found = findProductBySlugLoose(products, slug);
            if (found) return found;
        }

        const titleEl = card.querySelector("h1,h2,h3,h4,h5,h6");
        if (titleEl) {
            const title = titleEl.textContent.trim().toLowerCase();
            const found = products.find((p) => p.title?.toLowerCase() === title);
            if (found) return found;
        }
    }

    const anchor = target.closest?.("a[href]");
    if (anchor) {
        const slug = resolveProductSlugFromHref(anchor.getAttribute("href") || "", storeSlug);
        const found = findProductBySlugLoose(products, slug);
        if (found) return found;
    }

    return detail || null;
}

function actionHaystack(el) {
    if (!el) return "";
    return `${el.className || ""} ${el.textContent || ""} ${el.getAttribute("aria-label") || ""} ${el.getAttribute("href") || ""}`.toLowerCase();
}

export function isAddToCartClick(target) {
    const el = target.closest?.("button, a, [role='button']");
    if (!el) return false;
    if (el.hasAttribute("data-storvia-add-cart")) return true;
    const hay = actionHaystack(el);
    return /add[\s_-]?to[\s_-]?(cart|bag)|buy[\s_-]?now|add[\s_-]?to[\s_-]?bag/.test(hay);
}

export function isWishlistToggleClick(target) {
    const el = target.closest?.("button, a, [role='button']");
    if (!el) return false;
    if (el.hasAttribute("data-storvia-wishlist")) return true;
    const hay = actionHaystack(el);
    if (/wishlist\.html|\/pages\/wishlist|\/wishlist/.test(hay) && !/add/.test(hay)) return false;
    return /add[\s_-]?to[\s_-]?wishlist|save[\s_-]?product|wishlist/.test(hay) && !/view[\s_-]?product/.test(hay);
}

export function isPlaceOrderClick(target) {
    const el = target.closest?.("button, a, [role='button']");
    if (!el) return false;
    const hay = actionHaystack(el);
    return /place[\s_-]?order|complete[\s_-]?order|confirm[\s_-]?order|pay[\s_-]?now/.test(hay);
}

export function getPageCommerceKind(page, view, pageSlug = "") {
    if (view === "cart" || page?.type === "cart") return "cart";
    if (view === "checkout" || page?.type === "checkout") return "checkout";
    if (view === "product") return "product";
    if (view === "products" || page?.type === "products") return "shop";
    if (view === "page" && String(pageSlug).toLowerCase() === "wishlist") return "wishlist";
    if (page?.type === "wishlist" || page?.slug === "wishlist") return "wishlist";
    return null;
}

export function findImportedProductPage(pages = [], productSlug = "", product = null) {
    const bases = [productSlug, product?.slug, String(productSlug || "").replace(/-\d+$/, "")]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

    for (const base of bases) {
        const page = pages.find((p) => {
            const slug = String(p.slug || p.id || "").toLowerCase();
            const file = String(p.fileName || "").replace(/\.html$/i, "").split("/").pop()?.toLowerCase();
            return slug === base || file === base;
        });
        if (page) return page;
    }

    return (
        pages.find((p) => p.sections?.some((s) => /product-page|class=["']product-page/i.test(s.html || ""))) || null
    );
}

function hydrateCartItem(templateHtml, item, options) {
    const price =
        item.product.salePrice && item.product.salePrice < item.product.price
            ? item.product.salePrice
            : item.product.price;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-wrap="1">${templateHtml}</div>`, "text/html");
        const el = doc.querySelector("[data-wrap]")?.firstElementChild;
        if (!el) throw new Error("invalid cart template");

        el.classList.add("cart-item");
        el.setAttribute("data-storvia-cart-item", String(item.product._id));

        const img = el.querySelector("img");
        if (img) {
            img.setAttribute("src", options.resolveImage(item.product.images?.[0], item.product.category));
            img.setAttribute("alt", item.product.title || "");
        }

        const title = el.querySelector("h3");
        if (title) title.textContent = item.product.title || "";

        const desc = el.querySelector("p");
        if (desc) {
            const sizeMatch = (desc.textContent || "").match(/\d+\s*ml/i);
            const sizeLabel = sizeMatch ? sizeMatch[0] : "";
            const qtyLabel = item.quantity > 1 ? `Qty ${item.quantity}` : "Qty 1";
            desc.textContent = sizeLabel ? `${sizeLabel} · ${qtyLabel}` : qtyLabel;
        }

        const strong = el.querySelector("strong");
        if (strong) {
            strong.textContent =
                item.quantity > 1
                    ? `${formatPkr(price * item.quantity)} (${formatPkr(price)} each)`
                    : formatPkr(price);
        }

        return el.outerHTML;
    } catch {
        return `<div class="cart-item" data-storvia-cart-item="${item.product._id}"><div><h3>${item.product.title}</h3><p>Qty: ${item.quantity}</p><strong>${formatPkr(price * item.quantity)}</strong></div></div>`;
    }
}

function replaceCartItems(root, cart, template, options) {
    const cartItems = Array.from(root.querySelectorAll(".cart-item"));
    const summary = root.querySelector(".summary, aside.summary");
    const container = cartItems[0]?.parentElement || root.querySelector(".cart-layout, .container");

    if (!container) return;

    cartItems.forEach((item) => item.remove());
    container.querySelector(".storvia-empty-cart")?.remove();

    if (!cart.length) {
        const note = root.ownerDocument.createElement("p");
        note.className = "storvia-empty-cart";
        note.textContent = "Your bag is empty.";
        if (summary) container.insertBefore(note, summary);
        else container.appendChild(note);
        return;
    }

    const markup = cart.map((item) => hydrateCartItem(template, item, options)).join("");
    if (summary) summary.insertAdjacentHTML("beforebegin", markup);
    else container.insertAdjacentHTML("afterbegin", markup);
}

export function hydrateCartHtml(html, cart = [], options = {}) {
    if (!html) return "";
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-root="1">${html}</div>`, "text/html");
        const root = doc.querySelector("[data-root]");
        if (!root) return html;

        const structure = ensureCartPageStructure(root, cart, options);
        const itemsCol = structure?.itemsCol || root.querySelector(".storvia-cart-items-col");
        const container = structure?.container || root.querySelector(".cart-layout, .container");

        const template =
            options.designPatterns?.cartItemTemplate ||
            root.querySelector(".cart-item")?.outerHTML ||
            '<div class="cart-item"><img alt=""><div><h3></h3><p></p><strong></strong></div></div>';

        if (itemsCol) {
            itemsCol.querySelectorAll(".cart-item").forEach((node) => node.remove());
            itemsCol.querySelector(".storvia-empty-cart")?.remove();

            if (!cart.length) {
                const note = doc.createElement("p");
                note.className = "storvia-empty-cart";
                note.textContent = "Your bag is empty.";
                itemsCol.appendChild(note);
            } else {
                const markup = cart.map((item) => hydrateCartItem(template, item, options)).join("");
                itemsCol.insertAdjacentHTML("afterbegin", markup);
            }
        } else if (template) {
            replaceCartItems(root, cart, template, options);
        }

        const subtotal = cart.reduce((sum, item) => {
            const price =
                item.product.salePrice && item.product.salePrice < item.product.price
                    ? item.product.salePrice
                    : item.product.price;
            return sum + price * item.quantity;
        }, 0);

        const pricing = options.pricing || {};
        const shippingFee = pricing.shippingFee ?? 0;
        const discount = pricing.discount ?? 0;
        const total = pricing.total ?? Math.max(subtotal + shippingFee - discount, 0);

        const summary = root.querySelector(".summary, aside.summary");
        if (summary) {
            summary.querySelectorAll("p, h3").forEach((node) => {
                const text = node.textContent || "";
                if (/subtotal/i.test(text)) node.textContent = `Subtotal: ${formatPkr(subtotal)}`;
                if (/discount/i.test(text)) node.textContent = `Discount: -${formatPkr(discount)}`;
                if (/total/i.test(text) && !/subtotal/i.test(text)) node.textContent = `Total: ${formatPkr(total)}`;
                if (/shipping/i.test(text)) {
                    node.textContent = shippingFee === 0 ? "Shipping: Free" : `Shipping: ${formatPkr(shippingFee)}`;
                }
            });
            const checkoutBtn = summary.querySelector('a[href*="checkout"], a.btn.primary, .btn.primary');
            if (checkoutBtn) {
                checkoutBtn.setAttribute("href", `${options.storeBase || ""}/checkout`);
                checkoutBtn.textContent = checkoutBtn.textContent?.trim() || "Checkout";
                checkoutBtn.setAttribute("data-storvia-managed", "true");
            }
        }

        ensureCartPageStructure(root, cart, options);
        return root.innerHTML;
    } catch {
        return html;
    }
}

export function hydrateWishlistHtml(html, wishlist = [], options = {}) {
    const cardTemplate =
        options.cardTemplate ||
        '<article class="product"><a href="#"><img alt=""><h3></h3><p></p><strong></strong></a></article>';

    const wrapper = html || "";
    if (!wishlist.length) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div data-root="1">${wrapper}</div>`, "text/html");
            const root = doc.querySelector("[data-root]");
            const grid = root?.querySelector(".grid, [class*='product-grid']");
            if (grid) {
                grid.innerHTML = '<p class="storvia-empty-wishlist">Your wishlist is empty.</p>';
                return root.innerHTML;
            }
        } catch {
            /* fall through */
        }
        return wrapper;
    }

    return injectDesignProductGrid(
        wrapper,
        cardTemplate.includes("article") ? cardTemplate : `<article class="product">${cardTemplate}</article>`,
        wishlist,
        options
    );
}

export function hydrateProductDetailHtml(html, product, options = {}) {
    if (!html || !product) return html || "";
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-root="1">${html}</div>`, "text/html");
        const root = doc.querySelector("[data-root]");
        if (!root) return html;

        const price =
            product.salePrice && product.salePrice < product.price ? product.salePrice : product.price;

        const mainImg = root.querySelector(".main-product-img, .product-gallery img, .product-page img");
        if (mainImg) {
            mainImg.setAttribute("src", options.resolveImage(product.images?.[0], product.category));
            mainImg.setAttribute("alt", product.title || "");
        }

        const title = root.querySelector(".product-detail h1, .product-page h1, h1");
        if (title) title.textContent = product.title || "";

        const priceEl = root.querySelector(".product-detail h2, .product-page h2, h2");
        if (priceEl && /pkr|rs|₹|\$|\d/i.test(priceEl.textContent || "")) {
            priceEl.textContent = formatPkr(price);
        }

        const lead = root.querySelector(".lead, .product-detail p, .product-page p");
        if (lead) lead.textContent = stripRichText(product.description);

        root.querySelectorAll('.actions a, .actions button, a.btn.primary, a[href*="cart"]').forEach((el) => {
            const hay = actionHaystack(el);
            if (/add[\s_-]?to[\s_-]?(cart|bag)|buy[\s_-]?now/.test(hay) || el.classList.contains("primary")) {
                el.setAttribute("data-storvia-add-cart", String(product._id));
                el.setAttribute("href", "#");
            }
        });

        root.querySelectorAll('.actions a:not(.primary), a[href*="wishlist"]').forEach((el) => {
            const hay = actionHaystack(el);
            if (/wishlist|save/.test(hay)) {
                el.setAttribute("data-storvia-wishlist", String(product._id));
                el.setAttribute("href", "#");
            }
        });

        const reviewHost =
            root.querySelector(".testimonials")?.closest(".container") ||
            root.querySelector(".section .container:last-of-type");
        if (reviewHost) {
            const reviewHtml = buildReviewSectionHtml(options.reviews || [], product._id);
            const existing = reviewHost.querySelector(".storvia-reviews-block");
            if (existing) existing.outerHTML = reviewHtml;
            else reviewHost.insertAdjacentHTML("beforeend", reviewHtml);
        }

        return root.innerHTML;
    } catch {
        return html;
    }
}

export function hydrateCheckoutHtml(html, cart = [], options = {}) {
    if (!html) return "";
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-root="1">${html}</div>`, "text/html");
        const root = doc.querySelector("[data-root]");
        if (!root) return html;

        if (!root.querySelector("style[data-storvia-checkout-styles]")) {
            const style = doc.createElement("style");
            style.setAttribute("data-storvia-checkout-styles", "true");
            style.textContent = CHECKOUT_LAYOUT_STYLES;
            root.insertBefore(style, root.firstChild);
        }

        const form = root.querySelector("form");
        if (form) {
            form.setAttribute("data-storvia-checkout-form", "true");
            form.setAttribute("action", "#");
        }

        root.querySelectorAll('a[href*="thank"], .btn.primary').forEach((el) => {
            if (isPlaceOrderClick(el)) {
                el.setAttribute("data-storvia-place-order", "true");
                el.setAttribute("href", "#");
            }
        });

        const container = root.querySelector(".section .container") || form?.closest(".container");
        const formCard = container?.querySelector(".form-card") || form?.parentElement;

        if (container && formCard) {
            container.classList.add("cart-layout", "storvia-checkout-layout");
            formCard.classList.add("storvia-checkout-form-col");

            container.querySelector(".storvia-checkout-summary")?.remove();

            const wrapper = doc.createElement("div");
            wrapper.innerHTML = buildCheckoutSummaryPanel(cart, options.pricing || {}, options);
            const summary = wrapper.firstElementChild;
            if (summary) container.appendChild(summary);
        }

        return root.innerHTML;
    } catch {
        return html;
    }
}

function hydrateShopFilters(root, categories = [], selectedCategory = "All") {
    const filters = root.querySelector(".filters");
    if (!filters) return;

    const realCategories = categories.filter((c) => c && c !== "All");
    if (!realCategories.length) return;

    const templateLink = filters.querySelector("a");
    const linkClass = templateLink?.className || "";
    const labels = ["All", ...realCategories];

    filters.innerHTML = labels
        .map((label) => {
            const isActive =
                label === selectedCategory ||
                (label === "All" && (selectedCategory === "All" || !selectedCategory));
            return `<a href="#" class="${linkClass}${isActive ? " storvia-filter-active" : ""}" data-storvia-category-filter="${label}" data-storvia-managed="true">${label}</a>`;
        })
        .join("");
}

export function hydrateShopHtml(html, products = [], options = {}) {
    if (!html) return "";
    const cardTemplate =
        options.cardTemplate ||
        '<article class="product"><a href="#"><img alt=""><div class="product-info"><span class="tag"></span><h3></h3><p></p><span class="price"></span></div></article>';

    let output = html;
    if (products.length) {
        output = injectDesignProductGrid(output, cardTemplate, products, options);
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-root="1">${output}</div>`, "text/html");
        const root = doc.querySelector("[data-root]");
        if (!root) return output;

        hydrateShopFilters(root, options.categories || [], options.selectedCategory || "All");

        if (!root.querySelector("style[data-storvia-shop-styles]")) {
            const style = doc.createElement("style");
            style.setAttribute("data-storvia-shop-styles", "true");
            style.textContent = `.filters a{cursor:pointer}`;
            root.insertBefore(style, root.firstChild);
        }

        return root.innerHTML;
    } catch {
        return output;
    }
}

export function hydrateImportedSectionHtml(html, context = {}) {
    const {
        commerceKind,
        cart = [],
        wishlist = [],
        detail,
        cardTemplate,
        storeSlug,
        resolveImage,
        reviews = [],
        checkoutPricing = null,
        shopProducts = [],
        categories = [],
        selectedCategory = "All",
    } = context;
    const options = {
        storeSlug,
        storeBase: storeSlug ? `/store/${storeSlug}` : "",
        resolveImage,
        cardTemplate,
        reviews,
        pricing: checkoutPricing,
        designPatterns: context.designPatterns,
    };

    switch (commerceKind) {
        case "cart":
            return hydrateCartHtml(html, cart, options);
        case "wishlist":
            return hydrateWishlistHtml(html, wishlist, options);
        case "product":
            return hydrateProductDetailHtml(html, detail, options);
        case "checkout":
            return hydrateCheckoutHtml(html, cart, options);
        case "shop":
            return hydrateShopHtml(html, shopProducts, {
                ...options,
                categories,
                selectedCategory,
            });
        default:
            return html;
    }
}

export function readImportedReviewForm(form) {
    if (!form) return null;
    const name = form.querySelector('[name="name"]')?.value?.trim() || "";
    const comment = form.querySelector('[name="comment"]')?.value?.trim() || "";
    const rating = Number(form.querySelector('[name="rating"]')?.value || 5);
    const productId = form.getAttribute("data-storvia-review-form");
    return { name, comment, rating, productId };
}

export function readImportedCheckoutForm(form) {
    if (!form) return null;
    const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
    const byPlaceholder = (needle) =>
        inputs.find((el) => (el.getAttribute("placeholder") || "").toLowerCase().includes(needle))?.value?.trim() || "";

    return {
        fullName: byPlaceholder("full name") || byPlaceholder("name"),
        phone: byPlaceholder("phone"),
        city: byPlaceholder("city"),
        street: byPlaceholder("address"),
        email: byPlaceholder("email") || "customer@storefront.local",
        province: "Punjab",
        postalCode: "00000",
        country: "Pakistan",
        paymentMethod: form.querySelector("select")?.value || "COD",
    };
}

export function updateHeaderCommerceBadges(root, cart = []) {
    if (!root) return;
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    root.querySelectorAll('a.cart, .quick a, [class*="cart"], [href*="cart"], .cart-badge, .cart-trigger').forEach((el) => {
        const text = el.textContent || "";
        if (/bag|cart/i.test(text) || el.classList.contains("cart-badge")) {
            if (el.classList.contains("cart-badge")) {
                el.textContent = String(count);
                el.setAttribute("aria-label", `${count} items in cart`);
            } else {
                el.textContent = count > 0 ? `Bag ${count}` : "Bag";
            }
        }
    });
}
