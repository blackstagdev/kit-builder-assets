(function () {
  "use strict";

  // =========================
  // UTIL
  // =========================
  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));

  // money formatting (builder page)
  const toMoney = (n) => {
    const num = Number(n || 0);
    return num.toLocaleString("en-US", { style: "currency", currency: "USD" });
  };

  const toNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  // =========================
  // 1) KIT BUILDER PAGE LOGIC
  // Only runs if #kbp-app exists AND KBP is present
  // =========================
  (function kitBuilder() {
    const root = document.getElementById("kbp-app");
    if (!root) return; // not on builder page
    if (!window.KBP) return; // builder needs localized KBP data

    let kit = "starter";
    let selected = [];

    const maxForKit = () =>
      KBP.rules && KBP.rules[kit] ? Number(KBP.rules[kit]) : 0;

    function setMsg(text) {
      const el = $("#kbp-msg");
      if (el) el.textContent = text || "";
    }

    function renderShell() {
      const freebies = Array.isArray(KBP.freebies) ? KBP.freebies : [];

      root.innerHTML = `
        <div class="kbp-page">
          <div class="kbp-hero">
            <span class="kbp-badge">Best Seller</span>
            <h1>Build Your Own Research Kit</h1>
            <p>Choose your peptides • Bac water &amp; nasal spray included • Save 10%</p>
          </div>

          <div class="kbp-container">
            <div class="kbp-main">

              <div class="kbp-card">
                <div class="kbp-step-title">
                  <span class="kbp-step">1</span>
                  <h2>Choose Your Kit Size</h2>
                </div>

                <div class="kbp-kit-grid">
                  <button type="button" class="kbp-kit" data-kit="starter">
                    <div class="kbp-kit-head">
                      <div>
                        <h3>Starter Kit</h3>
                        <p>3 Peptide Vials (3ml each)</p>
                      </div>
                      <span class="kbp-selected-badge" data-role="starter-badge">Selected</span>
                    </div>
                    <div class="kbp-kit-note">Price = sum of selected vials</div>
                  </button>

                  <button type="button" class="kbp-kit" data-kit="advanced">
                    <span class="kbp-best" data-role="advanced-best">Best Value</span>
                    <div class="kbp-kit-head">
                      <div>
                        <h3>Advanced Kit</h3>
                        <p>6 Peptide Vials (3ml each)</p>
                      </div>
                    </div>
                    <div class="kbp-kit-note">Price = sum of selected vials</div>
                  </button>
                </div>
              </div>

              <div class="kbp-card">
                <div class="kbp-step-title kbp-step-row">
                  <div class="kbp-step-left">
                    <span class="kbp-step">2</span>
                    <h2>Select Your Peptides</h2>
                  </div>
                  <span class="kbp-pill" id="kbp-counter">0 / 0 selected</span>
                </div>

                <p class="kbp-desc">
                  Choose peptide vials for your kit.
                </p>

                <div class="kbp-products" id="kbp-products"></div>
                <div class="kbp-msg" id="kbp-msg"></div>
              </div>

            </div>

            <aside class="kbp-sidebar">
              <div class="kbp-card kbp-sticky">
                <h3>Your Kit Includes</h3>

                <div class="kbp-includes" id="kbp-includes">
                  <div class="kbp-inc">
                    <div class="kbp-inc-ico">💉</div>
                    <div class="kbp-inc-txt">
                      <strong><span id="kbp-vial-count">0</span>x Peptide Vials</strong>
                      <small>3ml each</small>
                    </div>
                  </div>

                  ${
                    freebies
                      .map(
                        (f) => `
                      <div class="kbp-inc kbp-free">
                        <div class="kbp-inc-ico">🎁</div>
                        <div class="kbp-inc-txt">
                          <strong>${esc(f.name)}</strong>
                          <small>${f.sku ? "SKU: " + esc(f.sku) : ""}</small>
                        </div>
                        <div class="kbp-check">✓</div>
                      </div>
                    `
                      )
                      .join("")
                  }
                </div>

                <div class="kbp-total-box">
                  <div class="kbp-row">
                    <span>Vials Subtotal</span>
                    <span id="kbp-subtotal">$0.00</span>
                  </div>
                  <div class="kbp-row kbp-green">
                    <span>Discount (10%)</span>
                    <span id="kbp-discount">-$0.00</span>
                  </div>
                  <div class="kbp-row kbp-total">
                    <span>Total</span>
                    <span id="kbp-total">$0.00</span>
                  </div>
                </div>

                <button type="button" class="kbp-add" id="kbp-add" disabled>Select items</button>
              </div>
            </aside>
          </div>
        </div>
      `;
    }

    function paintKitUI() {
      const starterBtn = $('.kbp-kit[data-kit="starter"]');
      const advBtn = $('.kbp-kit[data-kit="advanced"]');

      if (starterBtn) starterBtn.classList.toggle("active", kit === "starter");
      if (advBtn) advBtn.classList.toggle("active", kit === "advanced");

      const starterBadge = $('[data-role="starter-badge"]');
      if (starterBadge)
        starterBadge.style.display = kit === "starter" ? "inline-flex" : "none";

      const vialCount = $("#kbp-vial-count");
      if (vialCount) vialCount.textContent = String(maxForKit());

      // reset counter label max after kit switch
      const counter = $("#kbp-counter");
      if (counter) counter.textContent = `${selected.length} / ${maxForKit()} selected`;
    }

    function renderProducts() {
      const wrap = $("#kbp-products");
      if (!wrap) return;

      const max = maxForKit();
      wrap.innerHTML = "";

      (KBP.products || []).forEach((p) => {
        // p.price is expected from PHP localization
        const price = toNumber(p.price);

        const checked = selected.includes(p.id);
        const disabled = !checked && selected.length >= max;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "kbp-item" + (checked ? " on" : "");
        btn.disabled = !!disabled;

        btn.innerHTML = `
          <span class="kbp-box">${checked ? "✓" : ""}</span>
          <div class="kbp-item-body">
            <div class="kbp-name">${esc(p.name)}</div>
            <div class="kbp-meta">
              ${p.sku ? "SKU: " + esc(p.sku) + " • " : ""}${esc(toMoney(price))}
            </div>
          </div>
        `;

        btn.addEventListener("click", () => {
          if (checked) selected = selected.filter((x) => x !== p.id);
          else if (selected.length < max) selected.push(p.id);

          setMsg("");
          renderProducts();
          updateUI();
        });

        wrap.appendChild(btn);
      });
    }

    function getSelectedSubtotal() {
      // KBP.products items look like: { id, name, sku, price }
      const map = new Map((KBP.products || []).map((p) => [p.id, toNumber(p.price)]));
      return selected.reduce((sum, id) => sum + (map.get(id) || 0), 0);
    }

    function updateUI() {
      const max = maxForKit();

      const counter = $("#kbp-counter");
      if (counter) counter.textContent = `${selected.length} / ${max} selected`;

      const remaining = max - selected.length;

      const addBtn = $("#kbp-add");
      if (addBtn) {
        addBtn.disabled = remaining !== 0;
        addBtn.textContent =
          remaining > 0 ? `Select ${remaining} more peptides` : "Add to cart";
      }

      // Pricing: subtotal = sum of vial prices; total = subtotal - 10%
      const subtotal = getSelectedSubtotal();
      const discount = subtotal * 0.10;
      const total = subtotal - discount;

      const subtotalEl = $("#kbp-subtotal");
      const discountEl = $("#kbp-discount");
      const totalEl = $("#kbp-total");

      if (subtotalEl) subtotalEl.textContent = toMoney(subtotal);
      if (discountEl) discountEl.textContent = "-" + toMoney(discount);
      if (totalEl) totalEl.textContent = toMoney(total);
    }

    async function post(data) {
      const body = new URLSearchParams();
      Object.keys(data).forEach((k) => {
        const v = data[k];
        if (Array.isArray(v)) v.forEach((x) => body.append(k + "[]", x));
        else body.append(k, v);
      });

      const res = await fetch(KBP.ajaxUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: body.toString(),
      });

      return res.json();
    }

    function setKit(nextKit) {
      kit = nextKit;
      selected = [];
      setMsg("");
      paintKitUI();
      renderProducts();
      updateUI();
    }

    function bindEvents() {
      const starterBtn = $('.kbp-kit[data-kit="starter"]');
      const advBtn = $('.kbp-kit[data-kit="advanced"]');

      if (starterBtn) starterBtn.addEventListener("click", () => setKit("starter"));
      if (advBtn) advBtn.addEventListener("click", () => setKit("advanced"));

      const addBtn = $("#kbp-add");
      if (addBtn) {
        addBtn.addEventListener("click", async () => {
          const max = maxForKit();
          if (selected.length !== max) return;

          addBtn.disabled = true;
          addBtn.textContent = "Adding...";
          setMsg("");

          try {
            const resp = await post({
              action: "kbp_add",
              nonce: KBP.nonce,
              kit,
              selected,
            });

            if (!resp || !resp.success) {
              setMsg(resp?.data?.message || "Error adding to cart.");
              updateUI();
              return;
            }

            window.location.href = resp.data.cart_url;
          } catch (e) {
            setMsg("Request failed.");
            updateUI();
          }
        });
      }
    }

    // INIT
    renderShell();
    paintKitUI();
    renderProducts();
    updateUI();
    bindEvents();
  })();

  // =========================
  // 2) CART/CHECKOUT (WOO BLOCKS) LOGIC
  // Your old logic only hid $0 discounted rows.
  // Now child vials may have original price, so we hide by name match:
  // hide any item row whose name is NOT the parent kit AND has a kit parent present.
  // (Still safest if you keep child items priced $0 in PHP totals.)
  // =========================
  (function cartBlocks() {
    document.documentElement.classList.add("kbp-cart-js-loaded");

    function isCartDomReady() {
      return !!(
        document.querySelector(".wc-block-cart") ||
        document.querySelector(".wc-block-checkout") ||
        document.querySelector(".wc-block-cart-items__row")
      );
    }

    function getRowName(row) {
      const a = row.querySelector(".wc-block-components-product-name");
      return a ? (a.textContent || "").trim() : "";
    }

    function markRows() {
      const rows = Array.from(document.querySelectorAll(".wc-block-cart-items__row"));
      if (!rows.length) return;

      // Detect if kit parent exists in the cart UI
      const hasKitParent = rows.some((r) => {
        const name = getRowName(r);
        return /Build Your Own Research Starter Kit/i.test(name) || /Build Your Own Research Advanced Kit/i.test(name);
      });

      if (!hasKitParent) {
        // No kit in cart -> don't hide anything
        rows.forEach((r) => r.classList.remove("kbp-child-item"));
        return;
      }

      rows.forEach((row) => {
        const name = getRowName(row);
        const isParent =
          /Build Your Own Research Starter Kit/i.test(name) ||
          /Build Your Own Research Advanced Kit/i.test(name);

        // Hide every non-parent row while kit exists
        row.classList.toggle("kbp-child-item", !isParent);
      });
    }

    function start() {
      document.documentElement.classList.add("kbp-cart-js-started");
      markRows();

      const obs = new MutationObserver(markRows);
      obs.observe(document.documentElement, { childList: true, subtree: true });

      setTimeout(markRows, 250);
      setTimeout(markRows, 800);
      setTimeout(markRows, 1500);
    }

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (isCartDomReady()) {
        clearInterval(timer);
        start();
      }
      if (tries > 100) clearInterval(timer);
    }, 100);
  })();
})();
