(function () {
  if (!window.KBP) return;

  // ------- STATE -------
  let kit = "starter";
  let selected = [];

  // ------- HELPERS -------
  const $ = (sel, root = document) => root.querySelector(sel);

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));

  const maxForKit = () => (KBP.rules && KBP.rules[kit]) ? Number(KBP.rules[kit]) : 0;

  // OPTIONAL: you can keep these hard-coded to match your screenshot numbers,
  // or later compute from Woo product prices (would require PHP to pass price)
  const KIT_UI = {
    starter: { title: "Starter Kit", subtitle: "3 Peptide Vials (3ml each)", price: "$149.99", save: "Save $25", note: "+ Bac water & nasal spray bottle", badge: "Selected", best: "" },
    advanced: { title: "Advanced Kit", subtitle: "6 Peptide Vials (3ml each)", price: "$269.99", save: "Save $60", note: "+ Bac water & nasal spray bottle", badge: "", best: "Best Value" },
  };

  function renderShell() {
    const root = document.getElementById("kbp-app");
    if (!root) return;

    const freebies = Array.isArray(KBP.freebies) ? KBP.freebies : [];

    root.innerHTML = `
      <div class="kbp-page">
        <div class="kbp-hero">
          <span class="kbp-badge">Best Seller</span>
          <h1>Build Your Own Research Kit</h1>
          <p>Choose your peptides • Bac water &amp; nasal spray included • Save up to 25%</p>
        </div>

        <div class="kbp-container">
          <div class="kbp-main">

            <!-- STEP 1 -->
            <div class="kbp-card">
              <div class="kbp-step-title">
                <span class="kbp-step">1</span>
                <h2>Choose Your Kit Size</h2>
              </div>

              <div class="kbp-kit-grid">
                <button type="button" class="kbp-kit" data-kit="starter">
                  <div class="kbp-kit-head">
                    <div>
                      <h3>${esc(KIT_UI.starter.title)}</h3>
                      <p>${esc(KIT_UI.starter.subtitle)}</p>
                    </div>
                    <span class="kbp-selected-badge" data-role="starter-badge">${esc(KIT_UI.starter.badge)}</span>
                  </div>
                  <div class="kbp-kit-price">
                    <span class="kbp-price">${esc(KIT_UI.starter.price)}</span>
                    <span class="kbp-save">${esc(KIT_UI.starter.save)}</span>
                  </div>
                  <div class="kbp-kit-note">${esc(KIT_UI.starter.note)}</div>
                </button>

                <button type="button" class="kbp-kit" data-kit="advanced">
                  <span class="kbp-best" data-role="advanced-best">${esc(KIT_UI.advanced.best)}</span>
                  <div class="kbp-kit-head">
                    <div>
                      <h3>${esc(KIT_UI.advanced.title)}</h3>
                      <p>${esc(KIT_UI.advanced.subtitle)}</p>
                    </div>
                  </div>
                  <div class="kbp-kit-price">
                    <span class="kbp-price">${esc(KIT_UI.advanced.price)}</span>
                    <span class="kbp-save">${esc(KIT_UI.advanced.save)}</span>
                  </div>
                  <div class="kbp-kit-note">${esc(KIT_UI.advanced.note)}</div>
                </button>
              </div>
            </div>

            <!-- STEP 2 -->
            <div class="kbp-card">
              <div class="kbp-step-title kbp-step-row">
                <div class="kbp-step-left">
                  <span class="kbp-step">2</span>
                  <h2>Select Your Peptides</h2>
                </div>
                <span class="kbp-pill" id="kbp-counter">0 / 0 selected</span>
              </div>

              <p class="kbp-desc">
                Choose peptide vials for your kit. Reconstitute with the included bac water.
              </p>

              <div class="kbp-products" id="kbp-products"></div>

              <div class="kbp-msg" id="kbp-msg"></div>
            </div>

          </div>

          <!-- SIDEBAR -->
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
                  freebies.map(f => `
                    <div class="kbp-inc kbp-free">
                      <div class="kbp-inc-ico">🎁</div>
                      <div class="kbp-inc-txt">
                        <strong>${esc(f.name)}</strong>
                        <small>${f.sku ? "SKU: " + esc(f.sku) : ""}</small>
                      </div>
                      <div class="kbp-check">✓</div>
                    </div>
                  `).join("")
                }
              </div>

              <div class="kbp-tip">
                💡 Tip: Reconstitute any peptide with the included bac water, then transfer to the nasal spray bottle for easy application.
              </div>

              <div class="kbp-total-box">
                <div class="kbp-row">
                  <span>Kit Price</span>
                  <span class="kbp-strike" id="kbp-strike">$0.00</span>
                </div>
                <div class="kbp-row kbp-green">
                  <span>Bundle Savings</span>
                  <span id="kbp-savings">-$0.00</span>
                </div>
                <div class="kbp-row kbp-total">
                  <span>Total</span>
                  <span id="kbp-total">$0.00</span>
                </div>
              </div>

              <button type="button" class="kbp-add" id="kbp-add" disabled>Select items</button>

              <div class="kbp-icons">
                <div><span>🔒</span><small>Secure Checkout</small></div>
                <div><span>📦</span><small>Discreet Shipping</small></div>
                <div><span>✓</span><small>99%+ Purity</small></div>
                <div><span>🧪</span><small>3rd Party Tested</small></div>
              </div>

            </div>
          </aside>
        </div>
      </div>
    `;
  }

  function setMsg(text) {
    const el = document.getElementById("kbp-msg");
    if (el) el.textContent = text || "";
  }

  function setKit(nextKit) {
    kit = nextKit;
    selected = [];
    setMsg("");
    paintKitUI();
    renderProducts();
    updateUI();
  }

  function paintKitUI() {
    const starterBtn = $('.kbp-kit[data-kit="starter"]');
    const advBtn = $('.kbp-kit[data-kit="advanced"]');

    if (starterBtn) starterBtn.classList.toggle("active", kit === "starter");
    if (advBtn) advBtn.classList.toggle("active", kit === "advanced");

    const starterBadge = $('[data-role="starter-badge"]');
    if (starterBadge) starterBadge.style.display = (kit === "starter") ? "inline-flex" : "none";

    const best = $('[data-role="advanced-best"]');
    if (best) best.style.display = (kit === "advanced") ? "inline-flex" : "inline-flex"; // always show if you want

    // Update vial count in sidebar
    const vialCount = document.getElementById("kbp-vial-count");
    if (vialCount) vialCount.textContent = String(maxForKit());
  }

  function renderProducts() {
    const wrap = document.getElementById("kbp-products");
    if (!wrap) return;

    const max = maxForKit();
    wrap.innerHTML = "";

    (KBP.products || []).forEach((p) => {
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
          <div class="kbp-meta">${p.sku ? ("SKU: " + esc(p.sku)) : ""}</div>
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

  function updateUI() {
    const max = maxForKit();

    const counter = document.getElementById("kbp-counter");
    if (counter) counter.textContent = `${selected.length} / ${max} selected`;

    const addBtn = document.getElementById("kbp-add");
    if (addBtn) {
      const remaining = max - selected.length;
      addBtn.disabled = remaining !== 0;
      addBtn.textContent = remaining > 0 ? `Select ${remaining} more peptides` : "Add to cart";
    }

    // Sidebar totals (UI-only)
    const totalEl = document.getElementById("kbp-total");
    const strikeEl = document.getElementById("kbp-strike");
    const savingsEl = document.getElementById("kbp-savings");

    if (kit === "starter") {
      if (totalEl) totalEl.textContent = KIT_UI.starter.price;
      if (strikeEl) strikeEl.textContent = "$174.99";
      if (savingsEl) savingsEl.textContent = "-$25.00";
    } else {
      if (totalEl) totalEl.textContent = KIT_UI.advanced.price;
      if (strikeEl) strikeEl.textContent = "$329.99";
      if (savingsEl) savingsEl.textContent = "-$60.00";
    }
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

  function bindEvents() {
    const starterBtn = $('.kbp-kit[data-kit="starter"]');
    const advBtn = $('.kbp-kit[data-kit="advanced"]');

    if (starterBtn) starterBtn.addEventListener("click", () => setKit("starter"));
    if (advBtn) advBtn.addEventListener("click", () => setKit("advanced"));

    const addBtn = document.getElementById("kbp-add");
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

  // ------- INIT -------
  renderShell();
  paintKitUI();
  renderProducts();
  updateUI();
  bindEvents();
})();

(function () {
  // Only run on cart/checkout pages
  const isCartLike =
    document.body.classList.contains("woocommerce-cart") ||
    document.body.classList.contains("woocommerce-checkout") ||
    document.querySelector(".wc-block-cart") ||
    document.querySelector(".wc-block-checkout");

  if (!isCartLike) return;

  async function fetchCart() {
    // Woo Store API (Blocks)
    const res = await fetch("/wp-json/wc/store/v1/cart", { credentials: "same-origin" });
    if (!res.ok) return null;
    return res.json();
  }

  function hideChildControls(childNames) {
    const rows = document.querySelectorAll(".wc-block-cart-items__row");
    rows.forEach((row) => {
      const nameEl = row.querySelector(".wc-block-components-product-name");
      if (!nameEl) return;

      const name = (nameEl.textContent || "").trim();
      if (!childNames.has(name)) return;

      // Hide remove link
      const removeBtn = row.querySelector(".wc-block-cart-item__remove-link");
      if (removeBtn) removeBtn.style.display = "none";

      // Disable qty controls
      const qtyInput = row.querySelector(".wc-block-components-quantity-selector__input");
      const plusBtn  = row.querySelector(".wc-block-components-quantity-selector__button--plus");
      const minusBtn = row.querySelector(".wc-block-components-quantity-selector__button--minus");

      if (qtyInput) qtyInput.disabled = true;
      if (plusBtn)  plusBtn.disabled = true;
      if (minusBtn) minusBtn.disabled = true;
    });
  }

  async function run() {
    const cart = await fetchCart();
    if (!cart || !cart.items) return;

    // Identify bundled child items using price=0 + sale badge is not reliable.
    // Instead we depend on your cart meta flag `kbp_child` stored server-side.
    // But Store API doesn't expose that by default, so we match by "0 priced items"
    // AND “Save $X” badge is also not reliable.
    //
    // Practical: match by items that have "prices.price" = 0 AND "prices.regular_price" > 0
    // (your children show discounted $0.00 + regular price in the Blocks markup)
    const childNames = new Set();
    cart.items.forEach((it) => {
      try {
        const price = parseInt(it.prices?.price || "0", 10); // in minor units
        const reg   = parseInt(it.prices?.regular_price || "0", 10);
        if (price === 0 && reg > 0) childNames.add(it.name);
      } catch(e) {}
    });

    hideChildControls(childNames);
  }

  // Run now + re-run because Blocks re-renders
  run();
  const obs = new MutationObserver(() => run());
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();

