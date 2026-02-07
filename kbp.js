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
  // =========================
  (function kitBuilder() {
    const root = document.getElementById("kbp-app");
    if (!root) return;
    if (!window.KBP) return;

    let kit = "starter";
    let selected = [];

    // Water (default included qty=1)
    const water = KBP.water || null;
    let waterQty = 1;

    // Discount
    const DISCOUNT = Number(KBP.discountRate || 0.10);

    const maxForKit = () =>
      KBP.rules && KBP.rules[kit] ? Number(KBP.rules[kit]) : 0;

    // price lookup for vials
    const priceMap = new Map(
      (Array.isArray(KBP.products) ? KBP.products : []).map((p) => [
        Number(p.id),
        Number(p.price || 0),
      ])
    );

    function selectedSum() {
      return selected.reduce((sum, id) => sum + (priceMap.get(Number(id)) || 0), 0);
    }

    function waterSum() {
      if (!water) return 0;
      return Number(water.price || 0) * Number(waterQty || 1);
    }

    function calcTotals() {
      const sum = selectedSum() + waterSum();
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
            <img src="https://paramountpeptides.com/wp-content/uploads/2026/02/Build-you-own-Kit2.jpg
                " style="
    height: 100%;
    width: 100%;
">
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
                      <span class="kbp-save" data-role="starter-save">${Math.round(DISCOUNT * 100)}% off</span>
                    </div>
                    <div class="kbp-kit-note">+ Water (default) & nasal spray bottle</div>
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
                      <span class="kbp-save" data-role="advanced-save">${Math.round(DISCOUNT * 100)}% off</span>
                    </div>
                    <div class="kbp-kit-note">+ Water (default) & nasal spray bottle</div>
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

                <!-- Water selector goes above products -->
                <div id="kbp-water-box"></div>

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
                    <span>Bundle Savings (${Math.round(DISCOUNT * 100)}%)</span>
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

    function renderWaterBox() {
      const box = $("#kbp-water-box");
      if (!box) return;

      if (!water) {
        box.innerHTML = `
          <div class="kbp-msg">Water product not available.</div>
        `;
        return;
      }

      box.innerHTML = `
        <div class="kbp-card" style="margin: 12px 0;">
          <div class="water-quantity-style" >
            <div>
              <strong>${esc(water.name)}</strong>
              <div style="opacity:.8; font-size: 13px;">Default included (you can add more)</div>
              <div style="margin-top:6px;"><strong>${money(water.price)}</strong> each</div>
            </div>

            <div  style="display:flex; align-items:center; gap: 8px;">
              <button type="button" id="kbp-water-minus" class="kbp-qty-btn">−</button>
              <input
                 type="number"
    id="kbp-water-qty"
    class="kbp-qty-input"
                min="1"
                value="${waterQty}"
                style="width: 60px; text-align:center;"
              />
              <button type="button" id="kbp-water-plus" class="kbp-qty-btn">+</button>
            </div>
          </div>
        </div>
      `;

      $("#kbp-water-minus").onclick = () => {
        waterQty = Math.max(1, Number(waterQty) - 1);
        updateUI();
        renderWaterBox();
      };

      $("#kbp-water-plus").onclick = () => {
        waterQty = Math.max(1, Number(waterQty) + 1);
        updateUI();
        renderWaterBox();
      };

      $("#kbp-water-qty").onchange = (e) => {
        const v = Math.max(1, Number(e.target.value || 1));
        waterQty = v;
        updateUI();
        renderWaterBox();
      };
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

      // top kit card price
      const starterPrice = $('[data-role="starter-price"]');
      const advPrice = $('[data-role="advanced-price"]');

      // show base kit price even before selecting vials (water included)
      const baseTotal = water ? (water.price * waterQty) * (1 - DISCOUNT) : 0;
      const showValue = (selected.length || waterQty) ? money(total || baseTotal) : money(0);

      if (kit === "starter") {
        if (starterPrice) starterPrice.textContent = showValue;
        if (advPrice) advPrice.textContent = money(0);
      } else {
        if (advPrice) advPrice.textContent = showValue;
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
      renderWaterBox();
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
              water_qty: waterQty,
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
    renderWaterBox();
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
