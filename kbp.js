(function(){
  // KBP is provided by wp_localize_script in your PHP snippet
  if (!window.KBP) return;

  let kit = "starter";
  let selected = [];

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const maxForKit = () => (KBP.rules && KBP.rules[kit]) ? KBP.rules[kit] : 0;

  function setMsg(text){
    const el = $("#kbp-msg");
    if (el) el.textContent = text || "";
  }

  function render(){
    const wrap = $("#kbp-products");
    if (!wrap) return;

    const max = maxForKit();

    const counter = $("#kbp-counter");
    if (counter) counter.textContent = `${selected.length} / ${max} selected`;

    const btn = $("#kbp-add");
    if (btn) {
      const remaining = max - selected.length;
      btn.disabled = remaining !== 0;
      btn.textContent = remaining ? `Select ${remaining} more` : "Add to cart";
    }

    wrap.innerHTML = "";

    (KBP.products || []).forEach(p => {
      const checked = selected.includes(p.id);
      const disabled = !checked && selected.length >= max;

      const el = document.createElement("button");
      el.type = "button";
      el.className = "kbp-item" + (checked ? " on" : "");
      if (disabled) el.disabled = true;

      el.innerHTML = `
        <span class="kbp-box">${checked ? "✓" : ""}</span>
        <div>
          <div class="kbp-name">${p.name}</div>
          <div class="kbp-sku">${p.sku ? ("SKU: " + p.sku) : ""}</div>
        </div>
      `;

      el.addEventListener("click", () => {
        if (checked) selected = selected.filter(x => x !== p.id);
        else if (selected.length < max) selected.push(p.id);
        setMsg("");
        render();
      });

      wrap.appendChild(el);
    });
  }

  async function post(data){
    const body = new URLSearchParams();
    Object.keys(data).forEach(k => {
      const v = data[k];
      if (Array.isArray(v)) v.forEach(x => body.append(k + "[]", x));
      else body.append(k, v);
    });

    const res = await fetch(KBP.ajaxUrl, {
      method: "POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded; charset=UTF-8"},
      body: body.toString()
    });

    return res.json();
  }

  // kit switch
  $$('input[name="kbp_kit"]').forEach(r => {
    r.addEventListener("change", () => {
      kit = r.value;
      selected = [];
      setMsg("");
      render();
    });
  });

  // add to cart
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
          selected
        });

        if (!resp || !resp.success) {
          setMsg(resp && resp.data && resp.data.message ? resp.data.message : "Error adding to cart.");
          render();
          return;
        }
        window.location.href = resp.data.cart_url;
      } catch (e) {
        setMsg("Request failed.");
        render();
      }
    });
  }

  render();
})();
