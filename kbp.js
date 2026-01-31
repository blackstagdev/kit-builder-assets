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

  // =========================
  // 1) KIT BUILDER PAGE LOGIC
  // Only runs if #kbp-app exists AND KBP is present
  // =========================
  (function kitBuilder() {
    const root = document.getElementById("kbp-app");
    if (!root) return;               // not on builder page
    if (!window.KBP) return;         // builder needs localized KBP data

    let kit = "starter";
    let selected = [];

    const maxForKit = () =>
      (KBP.rules && KBP.rules[kit]) ? Number(KBP.rules[kit]) : 0;

    // UI-only values
    const KIT_UI = {
      starter: {
        title: "Starter Kit",
        subtitle: "3 Peptide Vials (3ml each)",
        price: "$149.99",
        save: "Save $25",
        note: "+ Bac water & nasal spray bottle",
        badge: "Selected",
      },
      advanced: {
        title: "Advanced Kit",
        subtitle: "6 Peptide Vials (3ml each)",
        price: "$269.99",
        save: "Save $60",
        note: "+ Bac water & nasal spray bottle",
        best: "Best Value",
      },
    };

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
            <p>Choose your peptides • Bac water &amp; nasal spray included • Save up to 25%</p>
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
                    <span class="kbp-best" data-role="advanced-best">${esc(KIT_UI.advanced.best || "")}</span>
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
      if (starterBadge) starterBadge.style.display = (kit === "starter") ? "inline-flex" : "none";

      const vialCount = $("#kbp-vial-count");
      if (vialCount) vialCount.textContent = String(maxForKit());
    }

    function renderProducts() {
      const wrap = $("#kbp-products");
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

      const counter = $("#kbp-counter");
      if (counter) counter.textContent = `${selected.length} / ${max} selected`;

      const addBtn = $("#kbp-add");
      if (addBtn) {
        const remaining = max - selected.length;
        addBtn.disabled = remaining !== 0;
        addBtn.textContent = remaining > 0 ? `Select ${remaining} more peptides` : "Add to cart";
      }

      const totalEl = $("#kbp-total");
      const strikeEl = $("#kbp-strike");
      const savingsEl = $("#kbp-savings");

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

(function cartBlocks() {
  const isCartLike =
    document.querySelector(".wc-block-cart") ||
    document.querySelector(".wc-block-checkout") ||
    document.body.classList.contains("woocommerce-cart") ||
    document.body.classList.contains("woocommerce-checkout");

  if (!isCartLike) return;

  // Store API root is usually here on Blocks pages
  const apiRoot =
    window.wcSettings?.storeApiNonce?.storeApiRoot ||
    window.wcSettings?.storeApiRoot ||
    "/wp-json/wc/store/v1/";

  const cartEndpoint = (apiRoot.endsWith("/") ? apiRoot : apiRoot + "/") + "cart";

  // Nonce header (safe to include; some configs require it)
  const nonce = window.wcSettings?.storeApiNonce?.nonce;
  const headers = nonce ? { "X-WC-Store-API-Nonce": nonce } : {};

  const normalizeUrl = (u) => {
    try {
      const url = new URL(u, window.location.origin);
      url.hash = "";
      url.search = "";
      // normalize trailing slash
      return url.pathname.replace(/\/+$/, "") || "/";
    } catch (e) {
      return String(u || "").trim().replace(/\/+$/, "");
    }
  };

  // Maps normalized permalink path -> isChild boolean
  let childByPermalink = new Map();
  // Fallback: name -> isChild (if permalink ever differs)
  let childByName = new Map();

  async function fetchCartFlags() {
    try {
      const res = await fetch(cartEndpoint, {
        credentials: "same-origin",
        headers,
      });
      if (!res.ok) return;

      const data = await res.json();
      const items = Array.isArray(data?.items) ? data.items : [];

      const pMap = new Map();
      const nMap = new Map();

      for (const it of items) {
        const isChild = Number(it?.extensions?.kbp?.child) === 1;
        const permalink = it?.permalink || it?.links?.permalink; // permalink is normally present
        const name = (it?.name || "").trim();

        if (permalink) pMap.set(normalizeUrl(permalink), isChild);
        if (name) nMap.set(name, isChild);
      }

      childByPermalink = pMap;
      childByName = nMap;
    } catch (e) {
      // ignore
    }
  }

  function applyChildRowUI(row, isChild) {
    row.classList.toggle("kbp-child-item", !!isChild);
    if (!isChild) return;

    // Hide everything except the name
    row.querySelector(".wc-block-cart-item__prices")?.setAttribute("style", "display:none!important");
    row.querySelector(".wc-block-cart-item__remove-link")?.setAttribute("style", "display:none!important");
    row.querySelector(".wc-block-components-sale-badge")?.setAttribute("style", "display:none!important");
    row.querySelector(".wc-block-cart-item__quantity")?.setAttribute("style", "display:none!important");
    row.querySelector(".wc-block-cart-item__total")?.setAttribute("style", "display:none!important");

    // OPTIONAL: if you truly want ONLY the name, hide image too:
    // row.querySelector(".wc-block-cart-item__image")?.setAttribute("style", "display:none!important");
  }

  function markChildRows() {
    document.querySelectorAll(".wc-block-cart-items__row").forEach((row) => {
      const a = row.querySelector("a.wc-block-components-product-name");
      const href = a?.getAttribute("href") || "";
      const name = (a?.textContent || "").trim();

      const byPermalink = href ? childByPermalink.get(normalizeUrl(href)) : undefined;
      const byName = name ? childByName.get(name) : undefined;

      const isChild =
        (typeof byPermalink === "boolean" ? byPermalink : undefined) ??
        (typeof byName === "boolean" ? byName : false);

      applyChildRowUI(row, isChild);
    });
  }

  // Initial
  fetchCartFlags().then(markChildRows);

  // Blocks rerender; observe and re-apply
  const obs = new MutationObserver(() => {
    markChildRows();
    clearTimeout(obs._t);
    obs._t = setTimeout(() => fetchCartFlags().then(markChildRows), 250);
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });

  setTimeout(() => fetchCartFlags().then(markChildRows), 600);
  setTimeout(() => fetchCartFlags().then(markChildRows), 1500);
})();

})();
