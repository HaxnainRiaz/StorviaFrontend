/**
 * Extract commerce UI patterns from any imported storefront schema and
 * synthesize missing cart/checkout blocks in the original design language.
 */

function formatPkr(amount) {
    return `PKR ${(Number(amount) || 0).toLocaleString("en-PK")}`;
}

const CART_DRAWER_MARKERS = /cart-drawer|cart_drawer|mini-cart|minicart|side-cart|bag-drawer|drawer-cart/i;

function parseHtmlFragment(html) {
    if (!html || typeof window === "undefined") return null;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(`<div data-storvia-parse="1">${html}</div>`, "text/html");
        return doc.querySelector("[data-storvia-parse]");
    } catch {
        return null;
    }
}

function firstOuterHtml(root, selector) {
    if (!root) return "";
    const el = root.querySelector(selector);
    return el?.outerHTML || "";
}

/**
 * Scan all pages in a published schema for reusable design fragments.
 */
export function extractDesignCommercePatterns(schema) {
    const patterns = {
        hasCartDrawer: false,
        hasCartPage: false,
        hasCheckoutPage: false,
        hasShopPage: false,
        cartItemTemplate: "",
        summaryTemplate: "",
        productCardTemplate: "",
        formCardTemplate: "",
        pageHeroTemplate: "",
        buttonPrimaryClass: "btn primary",
        buttonOutlineClass: "btn",
        cartLayoutClass: "cart-layout",
        containerClass: "container",
        sectionClass: "section",
    };

    for (const page of schema?.pages || []) {
        const pageHtml = (page.sections || []).map((s) => s.html || "").join("\n");
        const pageHay = `${page.type || ""} ${page.slug || ""} ${page.fileName || ""} ${pageHtml}`.toLowerCase();

        if (CART_DRAWER_MARKERS.test(pageHay)) patterns.hasCartDrawer = true;
        if (/cart-layout|cart-item|your bag|shopping bag/i.test(pageHay)) patterns.hasCartPage = true;
        if (/checkout|form-card|place order/i.test(pageHay)) patterns.hasCheckoutPage = true;
        if (/shop|product-grid|class=["']product|product-card/i.test(pageHay)) patterns.hasShopPage = true;

        const root = parseHtmlFragment(pageHtml);
        if (!root) continue;

        if (!patterns.cartItemTemplate) {
            patterns.cartItemTemplate =
                firstOuterHtml(root, ".cart-item") ||
                firstOuterHtml(root, "[class*='cart-item']");
        }
        if (!patterns.summaryTemplate) {
            patterns.summaryTemplate =
                firstOuterHtml(root, "aside.summary") ||
                firstOuterHtml(root, ".summary");
        }
        if (!patterns.productCardTemplate) {
            patterns.productCardTemplate =
                page.importedProducts?.cardTemplate ||
                schema?.importedProducts?.cardTemplate ||
                firstOuterHtml(root, "article.product") ||
                firstOuterHtml(root, "[class*='product-card']") ||
                firstOuterHtml(root, ".product");
        }
        if (!patterns.formCardTemplate) {
            patterns.formCardTemplate = firstOuterHtml(root, ".form-card");
        }
        if (!patterns.pageHeroTemplate) {
            patterns.pageHeroTemplate = firstOuterHtml(root, ".page-hero");
        }
    }

    if (!patterns.cartItemTemplate) {
        patterns.cartItemTemplate =
            '<div class="cart-item"><img alt=""><div><h3>Product</h3><p>50ml · Qty 1</p><strong>PKR 0</strong></div></div>';
    }
    if (!patterns.summaryTemplate) {
        patterns.summaryTemplate =
            '<aside class="summary"><h2>Order Summary</h2><p>Subtotal: PKR 0</p><p>Shipping: Free</p><h3>Total: PKR 0</h3><a class="btn primary" href="#">Checkout</a></aside>';
    }

    return patterns;
}

export function designUsesNativeCartDrawer(schema) {
    return extractDesignCommercePatterns(schema).hasCartDrawer;
}

const DRAWER_PANEL_CSS = `
.storvia-design-drawer-panel{display:flex;flex-direction:column;height:100%;padding:22px;gap:16px}
.storvia-design-drawer-head{display:flex;align-items:center;justify-content:space-between;gap:12px}
.storvia-design-drawer-head h2{margin:0;font-family:inherit}
.storvia-design-drawer-items{display:flex;flex-direction:column;gap:12px;flex:1;overflow:auto}
.storvia-design-drawer-summary{margin-top:auto}
.storvia-filter-active{opacity:1;font-weight:800}
`;

const CART_LAYOUT_FIX_CSS = `
.cart-layout.storvia-cart-layout-fixed,
.storvia-cart-layout-fixed.cart-layout,
.container.cart-layout.storvia-cart-layout-fixed{
  display:grid!important;
  grid-template-columns:minmax(0,1fr) minmax(280px,340px)!important;
  gap:20px;
  align-items:start
}
.storvia-cart-items-col{display:flex;flex-direction:column;gap:14px;grid-column:1}
.storvia-cart-items-col .cart-item{width:100%}
.storvia-generated-summary,.cart-layout .summary,aside.summary{grid-column:2;position:sticky;top:96px}
@media(max-width:850px){
  .cart-layout.storvia-cart-layout-fixed,.storvia-cart-layout-fixed.cart-layout{grid-template-columns:1fr!important}
  .storvia-generated-summary,.cart-layout .summary,aside.summary{grid-column:1;position:static}
}
`;

export function getCommerceLayoutCss(storeSlug = "") {
    const combined = `${CART_LAYOUT_FIX_CSS}\n${DRAWER_PANEL_CSS}`;
    if (!storeSlug) return combined;
    const scope = `.store-${storeSlug}`;
    return combined.replace(/(^|})\s*([^@}{][^{}]*\{)/g, (match, brace, selectorBlock) => {
        if (selectorBlock.trim().startsWith("@")) return match;
        const scoped = selectorBlock
            .split(",")
            .map((sel) => {
                const trimmed = sel.trim();
                if (!trimmed) return trimmed;
                return `${scope} ${trimmed}`;
            })
            .join(", ");
        return `${brace} ${scoped}{`;
    });
}

function extractCssColor(rawCss, selector) {
    if (!rawCss) return "";
    const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}[^{]*\\{[^}]*?color\\s*:\\s*([^;\\}]+)`, "i");
    const match = rawCss.match(re);
    return match?.[1]?.trim() || "";
}

/** Side-panel cart markup using the uploaded design's own classes. */
export function buildCartDrawerPanelHtml(cart = [], options = {}) {
    const patterns = options.designPatterns || {};
    const validCart = (cart || []).filter((item) => item?.product?._id);
    const itemTemplate = patterns.cartItemTemplate || '<div class="cart-item"><img alt=""><div><h3></h3><p></p><strong></strong></div></div>';
    const subtotal = validCart.reduce((sum, item) => {
        const price =
            item.product.salePrice && item.product.salePrice < item.product.price
                ? item.product.salePrice
                : item.product.price;
        return sum + price * item.quantity;
    }, 0);

    const itemsHtml = validCart.length
        ? validCart
              .map((item) => {
                  try {
                      const price =
                          item.product.salePrice && item.product.salePrice < item.product.price
                              ? item.product.salePrice
                              : item.product.price;
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(`<div>${itemTemplate}</div>`, "text/html");
                      const el = doc.body.firstElementChild;
                      if (!el) return "";
                      const img = el.querySelector("img");
                      if (img && options.resolveImage) {
                          img.setAttribute("src", options.resolveImage(item.product.images?.[0], item.product.category));
                          img.setAttribute("alt", item.product.title || "");
                      }
                      const title = el.querySelector("h3");
                      if (title) title.textContent = item.product.title || "";
                      const desc = el.querySelector("p");
                      if (desc) desc.textContent = `Qty ${item.quantity}`;
                      const strong = el.querySelector("strong");
                      if (strong) strong.textContent = formatPkr(price * item.quantity);
                      return el.outerHTML;
                  } catch {
                      return "";
                  }
              })
              .join("")
        : '<p class="storvia-empty-cart">Your bag is empty.</p>';

    const btnClass = patterns.buttonPrimaryClass || "btn primary";
    const outlineClass = patterns.buttonOutlineClass || "btn";

    return `
<div class="storvia-design-drawer-panel">
  <div class="storvia-design-drawer-head">
    <h2>Your Bag</h2>
    <button type="button" class="${outlineClass}" data-storvia-close-drawer="true">Close</button>
  </div>
  <div class="storvia-design-drawer-items">${itemsHtml}</div>
  <div class="summary storvia-design-drawer-summary">
    <p>Subtotal: ${formatPkr(subtotal)}</p>
    <a class="${btnClass}" href="${options.storeBase || ""}/checkout" data-storvia-managed="true">Checkout</a>
    <a class="${outlineClass}" href="${options.storeBase || ""}/cart" data-storvia-managed="true">View Full Cart</a>
  </div>
</div>`;
}

export function getDesignTypographyCss() {
    // Intentionally empty — imported scoped CSS owns all typography and colors.
    return "";
}

function injectStyle(root, css, id) {
    if (!root || root.querySelector(`style[data-storvia="${id}"]`)) return;
    const style = root.ownerDocument.createElement("style");
    style.setAttribute("data-storvia", id);
    style.textContent = css;
    root.insertBefore(style, root.firstChild);
}

function calcSubtotal(cart = []) {
    return cart.reduce((sum, item) => {
        const price =
            item.product.salePrice && item.product.salePrice < item.product.price
                ? item.product.salePrice
                : item.product.price;
        return sum + price * item.quantity;
    }, 0);
}

function buildSummaryElement(doc, cart, options) {
    const pricing = options.pricing || {};
    const subtotal = pricing.subtotal ?? calcSubtotal(cart);
    const shippingFee = pricing.shippingFee ?? 0;
    const discount = pricing.discount ?? 0;
    const total = pricing.total ?? Math.max(subtotal + shippingFee - discount, 0);
    const template = options.designPatterns?.summaryTemplate || "";
    const wrapper = doc.createElement("div");
    wrapper.innerHTML = template;
    const summary = wrapper.firstElementChild;
    if (!summary) return null;

    summary.classList.add("storvia-generated-summary");
    summary.querySelectorAll("p, h3").forEach((node) => {
        const text = node.textContent || "";
        if (/subtotal/i.test(text)) node.textContent = `Subtotal: ${formatPkr(subtotal)}`;
        if (/discount/i.test(text)) node.textContent = `Discount: -${formatPkr(discount)}`;
        if (/total/i.test(text) && !/subtotal/i.test(text)) node.textContent = `Total: ${formatPkr(total)}`;
        if (/shipping/i.test(text)) {
            node.textContent = shippingFee === 0 ? "Shipping: Free" : `Shipping: ${formatPkr(shippingFee)}`;
        }
    });
    const checkoutBtn = summary.querySelector('a[href*="checkout"], .btn.primary, a.btn');
    if (checkoutBtn) {
        checkoutBtn.setAttribute("href", `${options.storeBase || ""}/checkout`);
        checkoutBtn.textContent = checkoutBtn.textContent?.trim() || "Checkout";
        checkoutBtn.className = options.designPatterns?.buttonPrimaryClass || checkoutBtn.className;
    }
    return summary;
}

function ensureContinueShopping(doc, itemsCol, options) {
    if (!itemsCol || itemsCol.querySelector("[data-storvia-continue-shopping]")) return;
    const link = doc.createElement("a");
    link.className = options.designPatterns?.buttonOutlineClass || "btn";
    link.href = `${options.storeBase || ""}/products`;
    link.textContent = "Continue Shopping";
    link.setAttribute("data-storvia-continue-shopping", "true");
    link.setAttribute("data-storvia-managed", "true");
    itemsCol.appendChild(link);
}

/**
 * Restructure cart markup into a stable two-pane layout using design classes.
 */
export function ensureCartPageStructure(root, cart = [], options = {}) {
    if (!root) return;

    injectStyle(root, CART_LAYOUT_FIX_CSS, "cart-layout-fix");

    let container =
        root.querySelector(".cart-layout") ||
        root.querySelector(".container .cart-item")?.closest(".container") ||
        root.querySelector(".section .container") ||
        root.querySelector(".container");

    if (!container) {
        const section = root.querySelector(".section") || root;
        container = root.ownerDocument.createElement("div");
        container.className = `${options.designPatterns?.containerClass || "container"} cart-layout storvia-cart-layout-fixed`;
        section.appendChild(container);
    }

    container.classList.add("cart-layout", "storvia-cart-layout-fixed");

    let itemsCol = container.querySelector(".storvia-cart-items-col");
    if (!itemsCol) {
        itemsCol = root.ownerDocument.createElement("div");
        itemsCol.className = "storvia-cart-items-col";
        const summary = container.querySelector(".summary, aside.summary");
        const strayItems = [...container.querySelectorAll(".cart-item")];
        strayItems.forEach((node) => itemsCol.appendChild(node));
        if (summary) container.insertBefore(itemsCol, summary);
        else container.appendChild(itemsCol);
    }

    let summary = container.querySelector(".summary, aside.summary");
    if (!summary) {
        summary = buildSummaryElement(root.ownerDocument, cart, options);
        if (summary) container.appendChild(summary);
    }

    ensureContinueShopping(root.ownerDocument, itemsCol, options);
    return { container, itemsCol, summary };
}

/** Build a full cart page when the uploaded design has no cart.html */
export function buildSyntheticCartPageHtml(cart = [], options = {}) {
    const patterns = options.designPatterns || {};
    const validCart = (cart || []).filter((item) => item?.product?._id);
    const hero = patterns.pageHeroTemplate
        ? patterns.pageHeroTemplate
              .replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "<h1>Your Bag</h1>")
              .replace(/<p[^>]*>[\s\S]*?<\/p>/i, "<p>Review your selected items before checkout.</p>")
        : '<section class="page-hero"><h1>Your Bag</h1><p>Review your selected items before checkout.</p></section>';

    const containerClass = `${patterns.containerClass || "container"} cart-layout storvia-cart-layout-fixed`;
    const itemTemplate = patterns.cartItemTemplate || "";
    const itemsHtml = validCart.length
        ? validCart
              .map((item) => {
                  try {
                      const price =
                          item.product.salePrice && item.product.salePrice < item.product.price
                              ? item.product.salePrice
                              : item.product.price;
                      const parser = new DOMParser();
                      const doc = parser.parseFromString(`<div>${itemTemplate}</div>`, "text/html");
                      const el = doc.body.firstElementChild;
                      if (!el) return "";
                      const img = el.querySelector("img");
                      if (img && options.resolveImage) {
                          img.setAttribute("src", options.resolveImage(item.product.images?.[0], item.product.category));
                          img.setAttribute("alt", item.product.title || "");
                      }
                      const title = el.querySelector("h3");
                      if (title) title.textContent = item.product.title || "";
                      const desc = el.querySelector("p");
                      if (desc) desc.textContent = `Qty ${item.quantity}`;
                      const strong = el.querySelector("strong");
                      if (strong) strong.textContent = formatPkr(price * item.quantity);
                      return el.outerHTML;
                  } catch {
                      return `<div class="cart-item"><div><h3>${item.product.title}</h3><p>Qty ${item.quantity}</p><strong>${formatPkr(item.product.price * item.quantity)}</strong></div></div>`;
                  }
              })
              .join("")
        : '<p class="storvia-empty-cart">Your bag is empty.</p>';

    const summaryDoc = typeof document !== "undefined" ? document : null;
    let summaryHtml = patterns.summaryTemplate || '<aside class="summary"><h2>Order Summary</h2><p>Subtotal: PKR 0</p><p>Shipping: Free</p><h3>Total: PKR 0</h3><a class="btn primary" href="#">Checkout</a></aside>';
    if (summaryDoc) {
        const wrapper = summaryDoc.createElement("div");
        wrapper.innerHTML = summaryHtml;
        const built = buildSummaryElement(summaryDoc, validCart, options);
        if (built) summaryHtml = built.outerHTML;
    }

    const continueBtn = `<a class="${patterns.buttonOutlineClass || "btn"}" href="${options.storeBase || ""}/products" data-storvia-continue-shopping="true" data-storvia-managed="true">Continue Shopping</a>`;

    return `${hero}<section class="${patterns.sectionClass || "section"}"><div class="${containerClass}"><div class="storvia-cart-items-col">${itemsHtml}${continueBtn}</div>${summaryHtml}</div></section><style data-storvia="cart-layout-fix">${CART_LAYOUT_FIX_CSS}</style>`;
}
