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

  function money(n) {
    const num = Number(n || 0);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
      }).format(num);
    } catch (e) {
      return "$" + num.toFixed(2);
    }
  }

  // =========================
  // 1) KIT BUILDER PAGE LOGIC
  // Only runs if #kbp-app exists AND KBP is present
  // =========================
  (function kitBuilder() {
    const root = document.getElementById("kbp-app");
    if (!root) return;
    if (!window.KBP) return;

    let kit = "starter";
    let selected = [];

    const DISCOUNT = 0.10; // 10% off

    const maxForKit = () =>
      KBP.rules && KBP.rules[kit] ? Number(KBP.rules[kit]) : 0;

    // Build a fast lookup map: id -> numeric price
    const priceMap = new Map(
      (Array.isArray(KBP.products) ? KBP.products : []).map((p) => [
        Number(p.id),
        Number(p.price || 0),
      ])
    );

    function selectedSum() {
      return selected.reduce((sum, id) => sum + (priceMap.get(Number(id)) || 0), 0);
    }

    function calcTotals() {
      const sum = selectedSum();
      const savings = sum * DISCOUNT;
      const total = sum - savings;
      return { sum, savings, total };
    }

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
            <p>Choose your peptides • Bac water &amp; nasal spray included • Save up to 10%</p>
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
                    <div class="kbp-kit-price">
                      <span class="kbp-price" data-role="starter-price">${money(0)}</span>
                      <span class="kbp-save" data-role="starter-save">10% off</span>
                    </div>
                    <div class="kbp-kit-note">+ Bac water & nasal spray bottle</div>
                  </button>

                  <button type="button" class="kbp-kit" data-kit="advanced">
                    <span class="kbp-best" data-role="advanced-best">Best Value</span>
                    <div class="kbp-kit-head">
                      <div>
                        <h3>Advanced Kit</h3>
                        <p>6 Peptide Vials (3ml each)</p>
                      </div>
                    </div>
                    <div class="kbp-kit-price">
                      <span class="kbp-price" data-role="advanced-price">${money(0)}</span>
                      <span class="kbp-save" data-role="advanced-save">10% off</span>
                    </div>
                    <div class="kbp-kit-note">+ Bac water & nasal spray bottle</div>
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
                    <span>Kit Price</span>
                    <span class="kbp-strike" id="kbp-strike">${money(0)}</span>
                  </div>
                  <div class="kbp-row kbp-green">
                    <span>Bundle Savings (10%)</span>
                    <span id="kbp-savings">-${money(0)}</span>
                  </div>
                  <div class="kbp-row kbp-total">
                    <span>Total</span>
                    <span id="kbp-total">${money(0)}</span>
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
      if (starterBadge) starterBadge.style.display = kit === "starter" ? "inline-flex" : "none";

      const vialCount = $("#kbp-vial-count");
      if (vialCount) vialCount.textContent = String(maxForKit());
    }

    function renderProducts() {
      const wrap = $("#kbp-products");
      if (!wrap) return;

      const max = maxForKit();
      wrap.innerHTML = "";

      (KBP.products || []).forEach((p) => {
        const pid = Number(p.id);
        const checked = selected.includes(pid);
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
              ${p.sku ? "SKU: " + esc(p.sku) : ""}
              ${typeof p.price !== "undefined" ? ` • <strong>${esc(money(p.price))}</strong>` : ""}
            </div>
          </div>
        `;

        btn.addEventListener("click", () => {
          if (checked) selected = selected.filter((x) => x !== pid);
          else if (selected.length < max) selected.push(pid);

          setMsg("");
          renderProducts();
          updateUI();
        });

        wrap.appendChild(btn);
      });
    }

    function updateUI() {
      const max = maxForKit();
      const { sum, savings, total } = calcTotals();

      const counter = $("#kbp-counter");
      if (counter) counter.textContent = `${selected.length} / ${max} selected`;

      // sidebar totals
      const strikeEl = $("#kbp-strike");
      const savingsEl = $("#kbp-savings");
      const totalEl = $("#kbp-total");

      if (strikeEl) strikeEl.textContent = money(sum);
      if (savingsEl) savingsEl.textContent = "-" + money(savings);
      if (totalEl) totalEl.textContent = money(total);

      // top kit card price (show the same "total" for the currently selected kit)
      const starterPrice = $('[data-role="starter-price"]');
      const advPrice = $('[data-role="advanced-price"]');
      const starterSave = $('[data-role="starter-save"]');
      const advSave = $('[data-role="advanced-save"]');

      // Show 0 until at least 1 item selected (optional)
      const showValue = selected.length ? money(total) : money(0);

      if (kit === "starter") {
        if (starterPrice) starterPrice.textContent = showValue;
        if (starterSave) starterSave.textContent = "10% off";
        if (advPrice) advPrice.textContent = money(0);
      } else {
        if (advPrice) advPrice.textContent = showValue;
        if (advSave) advSave.textContent = "10% off";
        if (starterPrice) starterPrice.textContent = money(0);
      }

      const addBtn = $("#kbp-add");
      if (addBtn) {
        const remaining = max - selected.length;
        addBtn.disabled = remaining !== 0;
        addBtn.textContent = remaining > 0 ? `Select ${remaining} more peptides` : "Add to cart";
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

  // =========================
  // 2) CART/CHECKOUT (WOO BLOCKS) LOGIC
  // (leave as-is)
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

    function moneyToNumber(txt) {
      const s = String(txt || "")
        .replace(/[^0-9.,-]/g, "")
        .trim();
      if (!s) return NaN;
      if (s.includes(".") && s.includes(",")) return Number(s.replace(/,/g, ""));
      if (s.includes(",") && !s.includes(".")) return Number(s.replace(",", "."));
      return Number(s);
    }

    function isBundleChildRow(row) {
      const del = row.querySelector("del.wc-block-components-product-price__regular");
      const ins = row.querySelector("ins.wc-block-components-product-price__value.is-discounted");
      const totalVal = row.querySelector(
        ".wc-block-cart-item__total .wc-block-components-product-price__value"
      );

      const insNum = moneyToNumber(ins?.textContent);
      const totalNum = moneyToNumber(totalVal?.textContent);

      return !!del && ins && insNum === 0 && totalNum === 0;
    }

    function markRows() {
      document.querySelectorAll(".wc-block-cart-items__row").forEach((row) => {
        const isChild = isBundleChildRow(row);
        row.classList.toggle("kbp-child-item", isChild);
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
