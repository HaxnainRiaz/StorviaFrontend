/**
 * Structural analyzer and hydration system for custom uploaded cart and checkout designs.
 */

function formatPkr(amount) {
    return `PKR ${(Number(amount) || 0).toLocaleString("en-PK")}`;
}

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

function getSelector(el) {
    if (!el) return "";
    if (el.id) return `#${el.id}`;
    if (el.className) {
        const classes = el.className.split(/\s+/).filter(c => c && !c.startsWith("storvia") && !c.startsWith("store-") && !c.includes("["));
        if (classes.length) return "." + classes.join(".");
    }
    const parent = el.parentElement;
    if (parent && parent.tagName.toLowerCase() !== "body") {
        return `${getSelector(parent)} > ${el.tagName.toLowerCase()}`;
    }
    return el.tagName.toLowerCase();
}

export function analyzeStorefrontCommerce(pages = []) {
    const analysis = {
        cart: {
            hasCartPage: false,
            itemsHostSelector: "",
            itemTemplate: "",
            selectors: {
                itemImage: "img",
                itemTitle: "h3",
                itemDesc: "p",
                itemPrice: "strong",
                itemQtyDelta: "[data-storvia-cart-delta]",
                itemRemove: "[data-storvia-remove-cart]"
            },
            summary: {
                selector: "",
                subtotalSelector: "",
                shippingSelector: "",
                discountSelector: "",
                totalSelector: "",
                checkoutBtnSelector: ""
            }
        },
        checkout: {
            hasCheckoutPage: false,
            formSelector: "",
            inputs: {
                fullName: "",
                phone: "",
                city: "",
                street: "",
                paymentMethod: ""
            },
            summary: {
                selector: "",
                itemsHostSelector: "",
                itemTemplate: "",
                subtotalSelector: "",
                shippingSelector: "",
                discountSelector: "",
                totalSelector: "",
                couponInputSelector: "",
                couponApplyBtnSelector: ""
            }
        }
    };

    let cartHtml = "";
    let checkoutHtml = "";

    for (const page of pages) {
        const pageHtml = (page.sections || []).map((s) => s.html || "").join("\n");
        const lowerSlug = String(page.slug || page.id || page.fileName || "").toLowerCase();
        const isCart = page.type === "cart" || lowerSlug.includes("cart") || /your bag|shopping bag|cart-item/i.test(pageHtml);
        const isCheckout = page.type === "checkout" || lowerSlug.includes("checkout") || /form-card|place order/i.test(pageHtml);

        if (isCart && !cartHtml) {
            cartHtml = pageHtml;
            analysis.cart.hasCartPage = true;
        }
        if (isCheckout && !checkoutHtml) {
            checkoutHtml = pageHtml;
            analysis.checkout.hasCheckoutPage = true;
        }
    }

    const parser = typeof DOMParser !== "undefined" ? new DOMParser() : null;

    if (parser) {
        if (cartHtml) {
            try {
                const doc = parser.parseFromString(`<div>${cartHtml}</div>`, "text/html");
                analyzeCartDom(doc, analysis.cart);
            } catch (e) {
                console.error("Error analyzing cart page:", e);
            }
        }
        if (checkoutHtml) {
            try {
                const doc = parser.parseFromString(`<div>${checkoutHtml}</div>`, "text/html");
                analyzeCheckoutDom(doc, analysis.checkout);
            } catch (e) {
                console.error("Error analyzing checkout page:", e);
            }
        }
    }

    return analysis;
}

function analyzeCartDom(doc, cartAnalysis) {
    const itemNode = doc.querySelector(".cart-item, [class*='cart-item'], .cart-row, [class*='cart-row']");
    if (itemNode) {
        cartAnalysis.itemTemplate = itemNode.outerHTML;
        cartAnalysis.itemsHostSelector = getSelector(itemNode.parentElement);
        
        const img = itemNode.querySelector("img");
        if (img) cartAnalysis.selectors.itemImage = getSelector(img);
        
        const title = itemNode.querySelector("h3, h4, h5, .title, [class*='title']");
        if (title) cartAnalysis.selectors.itemTitle = getSelector(title);
        
        const desc = itemNode.querySelector("p, .desc, [class*='desc']");
        if (desc) cartAnalysis.selectors.itemDesc = getSelector(desc);
        
        const price = itemNode.querySelector("strong, span.price, .price, [class*='price']");
        if (price) cartAnalysis.selectors.itemPrice = getSelector(price);
    }

    const summaryNode = doc.querySelector("aside.summary, .summary, .cart-summary, [class*='summary']");
    if (summaryNode) {
        cartAnalysis.summary.selector = getSelector(summaryNode);
        
        summaryNode.querySelectorAll("p, div, tr, li, h3").forEach(node => {
            const text = (node.textContent || "").toLowerCase();
            const sel = getSelector(node);
            if (/subtotal/i.test(text)) cartAnalysis.summary.subtotalSelector = sel;
            if (/discount/i.test(text)) cartAnalysis.summary.discountSelector = sel;
            if (/shipping/i.test(text)) cartAnalysis.summary.shippingSelector = sel;
            if (/total/i.test(text) && !/subtotal/i.test(text)) cartAnalysis.summary.totalSelector = sel;
        });

        const checkoutBtn = summaryNode.querySelector('a[href*="checkout"], .btn.primary, a.btn');
        if (checkoutBtn) cartAnalysis.summary.checkoutBtnSelector = getSelector(checkoutBtn);
    }
}

function analyzeCheckoutDom(doc, checkoutAnalysis) {
    const form = doc.querySelector("form");
    if (form) {
        checkoutAnalysis.formSelector = getSelector(form);
        
        const inputs = Array.from(form.querySelectorAll("input, textarea, select"));
        const findByPlaceholderOrName = (needles) => {
            const found = inputs.find(input => {
                const placeholder = (input.getAttribute("placeholder") || "").toLowerCase();
                const name = (input.getAttribute("name") || "").toLowerCase();
                return needles.some(needle => placeholder.includes(needle) || name.includes(needle));
            });
            return found ? getSelector(found) : "";
        };

        checkoutAnalysis.inputs.fullName = findByPlaceholderOrName(["full name", "name", "first name", "last name"]);
        checkoutAnalysis.inputs.phone = findByPlaceholderOrName(["phone", "mobile", "contact"]);
        checkoutAnalysis.inputs.city = findByPlaceholderOrName(["city", "town"]);
        checkoutAnalysis.inputs.street = findByPlaceholderOrName(["address", "street", "house"]);
        checkoutAnalysis.inputs.paymentMethod = findByPlaceholderOrName(["payment", "method", "cod", "pay"]);
    }

    const formCard = doc.querySelector(".form-card") || form?.parentElement;
    const SUMMARY_SELECTORS = ["aside.summary", ".summary", ".checkout-summary", "[class*='summary']"];
    let summaryNode = null;
    for (const sel of SUMMARY_SELECTORS) {
        const matches = Array.from(doc.querySelectorAll(sel));
        const outside = matches.find(el => !form?.contains(el) && !formCard?.contains(el));
        if (outside) {
            summaryNode = outside;
            break;
        }
    }
    if (!summaryNode) {
        summaryNode = doc.querySelector("aside.summary, .summary, .checkout-summary, [class*='summary']");
    }

    if (summaryNode) {
        checkoutAnalysis.summary.selector = getSelector(summaryNode);

        const itemNode = summaryNode.querySelector(".order-item, .cart-item, [class*='item']");
        if (itemNode) {
            checkoutAnalysis.summary.itemTemplate = itemNode.outerHTML;
            checkoutAnalysis.summary.itemsHostSelector = getSelector(itemNode.parentElement);
        }

        summaryNode.querySelectorAll("p, div, tr, li, h3").forEach(node => {
            const text = (node.textContent || "").toLowerCase();
            const sel = getSelector(node);
            if (/subtotal/i.test(text)) checkoutAnalysis.summary.subtotalSelector = sel;
            if (/discount/i.test(text)) checkoutAnalysis.summary.discountSelector = sel;
            if (/shipping/i.test(text)) checkoutAnalysis.summary.shippingSelector = sel;
            if (/total/i.test(text) && !/subtotal/i.test(text)) checkoutAnalysis.summary.totalSelector = sel;
        });

        const couponInput = summaryNode.querySelector("input[placeholder*='coupon'], input[placeholder*='promo'], input[placeholder*='code']");
        if (couponInput) checkoutAnalysis.summary.couponInputSelector = getSelector(couponInput);
        
        const couponBtn = summaryNode.querySelector("button");
        if (couponBtn) checkoutAnalysis.summary.couponApplyBtnSelector = getSelector(couponBtn);
    }
}

export function hydrateCartDom(doc, cart = [], analysis = {}, options = {}) {
    const root = doc.body;
    const cartAnalysis = analysis.cart || {};
    
    const itemsCol = cartAnalysis.itemsHostSelector ? root.querySelector(cartAnalysis.itemsHostSelector) : null;
    const template = cartAnalysis.itemTemplate || '<div class="cart-item"><img alt=""><div><h3></h3><p></p><strong></strong></div></div>';

    if (itemsCol) {
        itemsCol.querySelectorAll(".cart-item, .cart-row, [class*='cart-item']").forEach((node) => node.remove());
        itemsCol.querySelector(".storvia-empty-cart")?.remove();

        if (!cart.length) {
            const note = doc.createElement("p");
            note.className = "storvia-empty-cart";
            note.textContent = "Your bag is empty.";
            itemsCol.appendChild(note);
        } else {
            cart.forEach((item) => {
                const price = item.product.salePrice && item.product.salePrice < item.product.price
                    ? item.product.salePrice
                    : item.product.price;
                try {
                    const parser = new DOMParser();
                    const docItem = parser.parseFromString(`<div>${template}</div>`, "text/html");
                    const el = docItem.body.firstElementChild;
                    el.classList.add("cart-item", "storvia-live-cart-item");
                    el.setAttribute("data-storvia-cart-item", String(item.product._id));

                    const imgSel = cartAnalysis.selectors.itemImage;
                    const img = imgSel ? el.querySelector(imgSel) : el.querySelector("img");
                    if (img && options.resolveImage) {
                        img.setAttribute("src", options.resolveImage(item.product.images?.[0], item.product.category));
                        img.setAttribute("alt", item.product.title || "");
                    }

                    const titleSel = cartAnalysis.selectors.itemTitle;
                    const title = titleSel ? el.querySelector(titleSel) : el.querySelector("h3, h4, .title");
                    if (title) title.textContent = item.product.title || "";

                    const descSel = cartAnalysis.selectors.itemDesc;
                    const desc = descSel ? el.querySelector(descSel) : el.querySelector("p");
                    if (desc) {
                        const sizeMatch = (desc.textContent || "").match(/\d+\s*ml/i);
                        const sizeLabel = sizeMatch ? sizeMatch[0] : "";
                        const qtyLabel = item.quantity > 1 ? `Qty ${item.quantity}` : "Qty 1";
                        desc.textContent = sizeLabel ? `${sizeLabel} · ${qtyLabel}` : qtyLabel;
                    }

                    const priceSel = cartAnalysis.selectors.itemPrice;
                    const strong = priceSel ? el.querySelector(priceSel) : el.querySelector("strong, span.price");
                    if (strong) {
                        strong.textContent = item.quantity > 1
                            ? `${formatPkr(price * item.quantity)} (${formatPkr(price)} each)`
                            : formatPkr(price);
                    }

                    if (!el.querySelector("[data-storvia-cart-delta], [data-storvia-remove-cart]")) {
                        const controls = doc.createElement("div");
                        controls.className = "storvia-cart-item-controls";
                        controls.innerHTML = `
                          <button type="button" data-storvia-cart-delta="-1" data-storvia-cart-product="${item.product._id}" aria-label="Decrease quantity">-</button>
                          <span>${item.quantity}</span>
                          <button type="button" data-storvia-cart-delta="1" data-storvia-cart-product="${item.product._id}" aria-label="Increase quantity">+</button>
                          <button type="button" data-storvia-remove-cart="${item.product._id}" aria-label="Remove item">Remove</button>
                        `;
                        el.appendChild(controls);
                    }

                    itemsCol.appendChild(el);
                } catch (e) {
                    console.error("Error hydrating cart item:", e);
                }
            });
        }
    }

    const summary = cartAnalysis.summary.selector ? root.querySelector(cartAnalysis.summary.selector) : null;
    if (summary) {
        const subtotal = cart.reduce((sum, item) => {
            const price = item.product.salePrice && item.product.salePrice < item.product.price
                ? item.product.salePrice
                : item.product.price;
            return sum + price * item.quantity;
        }, 0);

        const pricing = options.pricing || {};
        const shippingFee = pricing.shippingFee ?? 0;
        const discount = pricing.discount ?? 0;
        const total = pricing.total ?? Math.max(subtotal + shippingFee - discount, 0);

        const updateVal = (selector, labelRegex, newVal) => {
            const el = selector ? summary.querySelector(selector) : null;
            if (el) {
                const subElements = Array.from(el.querySelectorAll("span, strong, p"));
                const priceEl = subElements.reverse().find(sub => sub.children.length === 0 && /rs|pkr|₹|\$|\d/i.test(sub.textContent || ""));
                if (priceEl) {
                    priceEl.textContent = newVal;
                } else {
                    const text = el.textContent || "";
                    const match = text.match(/:\s*(.*)/);
                    if (match) {
                        el.textContent = text.replace(match[1], newVal);
                    } else {
                        el.textContent = newVal;
                    }
                }
            }
        };

        updateVal(cartAnalysis.summary.subtotalSelector, /subtotal/i, formatPkr(subtotal));
        updateVal(cartAnalysis.summary.discountSelector, /discount/i, `-${formatPkr(discount)}`);
        updateVal(cartAnalysis.summary.shippingSelector, /shipping/i, shippingFee === 0 ? "Free" : formatPkr(shippingFee));
        updateVal(cartAnalysis.summary.totalSelector, /total/i, formatPkr(total));

        const checkoutBtn = cartAnalysis.summary.checkoutBtnSelector ? summary.querySelector(cartAnalysis.summary.checkoutBtnSelector) : null;
        if (checkoutBtn) {
            checkoutBtn.setAttribute("href", `${options.storeBase || ""}/checkout`);
            checkoutBtn.textContent = checkoutBtn.textContent?.trim() || "Checkout";
            checkoutBtn.setAttribute("data-storvia-managed", "true");
        }
    }
}

export function hydrateCheckoutDom(doc, cart = [], analysis = {}, options = {}) {
    const root = doc.body;
    const checkoutAnalysis = analysis.checkout || {};

    const form = checkoutAnalysis.formSelector ? root.querySelector(checkoutAnalysis.formSelector) : null;
    if (form) {
        form.setAttribute("data-storvia-checkout-form", "true");
        form.setAttribute("action", "#");
    }

    root.querySelectorAll('a[href*="thank"], .btn.primary, button[type="submit"]').forEach((el) => {
        const text = (el.textContent || "").toLowerCase();
        if (/place[\s_-]?order|complete[\s_-]?order|confirm[\s_-]?order|pay[\s_-]?now/i.test(text)) {
            el.setAttribute("data-storvia-place-order", "true");
            el.setAttribute("href", "#");
        }
    });

    const summary = checkoutAnalysis.summary.selector ? root.querySelector(checkoutAnalysis.summary.selector) : null;
    if (summary) {
        summary.classList.add("storvia-checkout-summary");

        const pricing = options.pricing || {};
        const subtotal = pricing.subtotal ?? cart.reduce((sum, item) => {
            const price = item.product.salePrice && item.product.salePrice < item.product.price
                ? item.product.salePrice
                : item.product.price;
            return sum + price * item.quantity;
        }, 0);
        const shippingFee = pricing.shippingFee ?? 0;
        const discount = pricing.discount ?? 0;
        const total = pricing.total ?? Math.max(subtotal + shippingFee - discount, 0);

        const formatVal = (val) => formatPkr(val);

        const updateVal = (selector, labelRegex, newVal) => {
            const el = selector ? summary.querySelector(selector) : null;
            if (el) {
                const subElements = Array.from(el.querySelectorAll("span, strong, p"));
                const priceEl = subElements.reverse().find(sub => sub.children.length === 0 && /rs|pkr|₹|\$|\d/i.test(sub.textContent || ""));
                if (priceEl) {
                    priceEl.textContent = newVal;
                } else {
                    const text = el.textContent || "";
                    const match = text.match(/:\s*(.*)/);
                    if (match) {
                        el.textContent = text.replace(match[1], newVal);
                    } else {
                        el.textContent = newVal;
                    }
                }
            }
        };

        updateVal(checkoutAnalysis.summary.subtotalSelector, /subtotal/i, formatVal(subtotal));
        updateVal(checkoutAnalysis.summary.discountSelector, /discount/i, `-${formatVal(discount)}`);
        updateVal(checkoutAnalysis.summary.shippingSelector, /shipping/i, shippingFee === 0 ? "Free" : formatVal(shippingFee));
        updateVal(checkoutAnalysis.summary.totalSelector, /total/i, formatVal(total));

        const itemsHost = checkoutAnalysis.summary.itemsHostSelector ? summary.querySelector(checkoutAnalysis.summary.itemsHostSelector) : null;
        const template = checkoutAnalysis.summary.itemTemplate;
        const resolveImage = options.resolveImage || ((src) => src || "");

        if (itemsHost) {
            itemsHost.innerHTML = "";
            cart.forEach((item) => {
                const price = item.product.salePrice && item.product.salePrice < item.product.price
                    ? item.product.salePrice
                    : item.product.price;
                if (template) {
                    try {
                        const parser = new DOMParser();
                        const docItem = parser.parseFromString(`<div>${template}</div>`, "text/html");
                        const el = docItem.body.firstElementChild;
                        
                        const img = el.querySelector("img");
                        if (img) {
                            img.setAttribute("src", resolveImage(item.product.images?.[0], item.product.category));
                            img.setAttribute("alt", item.product.title || "");
                        }
                        const title = el.querySelector("h3, h4, .title, [class*='title']");
                        if (title) title.textContent = item.product.title || "";
                        
                        const qty = el.querySelector(".qty, .quantity, [class*='qty'], p");
                        if (qty) qty.textContent = `Qty: ${item.quantity}`;
                        
                        const priceEl = el.querySelector("strong, span.price, .price, [class*='price']");
                        if (priceEl) priceEl.textContent = formatVal(price * item.quantity);
                        
                        itemsHost.appendChild(el);
                    } catch (e) {
                        itemsHost.insertAdjacentHTML("beforeend", buildCheckoutItemCard(item, resolveImage));
                    }
                } else {
                    itemsHost.insertAdjacentHTML("beforeend", buildCheckoutItemCard(item, resolveImage));
                }
            });
        } else {
            const totalsEl = summary.querySelector(".storvia-totals, .totals, [class*='total']");
            const itemsWrapper = doc.createElement("div");
            itemsWrapper.className = "storvia-order-items";
            cart.forEach((item) => {
                itemsWrapper.insertAdjacentHTML("beforeend", buildCheckoutItemCard(item, resolveImage));
            });
            if (totalsEl) {
                summary.insertBefore(itemsWrapper, totalsEl);
            } else {
                summary.appendChild(itemsWrapper);
            }
        }

        let couponInput = checkoutAnalysis.summary.couponInputSelector ? summary.querySelector(checkoutAnalysis.summary.couponInputSelector) : null;
        let couponBtn = checkoutAnalysis.summary.couponApplyBtnSelector ? summary.querySelector(checkoutAnalysis.summary.couponApplyBtnSelector) : null;

        if (couponInput) {
            couponInput.setAttribute("data-storvia-coupon-input", "true");
            couponInput.setAttribute("value", pricing.couponCode || "");
        }
        if (couponBtn) {
            couponBtn.setAttribute("data-storvia-apply-coupon", "true");
        }

        if (!summary.querySelector("[data-storvia-coupon-input]")) {
            const couponRow = doc.createElement("div");
            couponRow.className = "storvia-coupon-row";
            couponRow.innerHTML = `
                <input type="text" data-storvia-coupon-input placeholder="Promo code" value="${String(pricing.couponCode || "").replace(/"/g, "&quot;")}" />
                <button type="button" data-storvia-apply-coupon>Apply</button>
            `;
            const totalsEl = summary.querySelector(".storvia-totals, .totals, [class*='total']");
            if (totalsEl) {
                summary.insertBefore(couponRow, totalsEl);
            } else {
                summary.appendChild(couponRow);
            }
        }

        summary.querySelector(".storvia-coupon-applied")?.remove();
        if (pricing.appliedCoupon) {
            const couponLabel = pricing.appliedCoupon.discountType === "percentage"
                ? `${pricing.appliedCoupon.code} (${pricing.appliedCoupon.discountValue}% off)`
                : pricing.appliedCoupon.discountType === "free_shipping"
                  ? `${pricing.appliedCoupon.code} (free shipping)`
                  : `${pricing.appliedCoupon.code} (${formatVal(pricing.appliedCoupon.discountValue)} off)`;
                  
            const appliedEl = doc.createElement("p");
            appliedEl.className = "storvia-coupon-applied";
            appliedEl.textContent = `✓ ${couponLabel}`;
            
            const couponInputRow = summary.querySelector("[data-storvia-coupon-input]")?.closest("div");
            if (couponInputRow) {
                couponInputRow.parentNode.insertBefore(appliedEl, couponInputRow.nextSibling);
            }
        }
    }
}
