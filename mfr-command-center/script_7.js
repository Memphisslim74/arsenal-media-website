
(function mfrInstallPricingAdminBuilderPatch(){
  const css = document.createElement('style');
  css.textContent = `
    .mfr-pricing-admin-hero{background:linear-gradient(135deg,#06163d 0%,#0b5ed7 64%,#1d9bf0 100%);color:#fff;border-radius:24px;padding:24px;margin-bottom:18px;box-shadow:0 18px 44px rgba(13,27,62,.18);display:flex;justify-content:space-between;gap:18px;align-items:flex-start}
    .mfr-pricing-admin-hero h1{font-size:30px;margin:0 0 8px;font-weight:950;letter-spacing:-.03em}
    .mfr-pricing-admin-hero p{margin:0;color:rgba(255,255,255,.84);font-size:14px;line-height:1.55;max-width:760px}
    .mfr-pricing-actions{display:flex;gap:10px;flex-wrap:wrap;justify-content:flex-end}
    .mfr-pricing-admin-grid{display:grid;grid-template-columns:1fr;gap:18px}
    .mfr-pricing-toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
    .mfr-pricing-toolbar .left{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
    .mfr-pricing-search{min-width:260px;max-width:420px}
    .mfr-rate-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
    .mfr-rate-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 10px 26px rgba(15,23,42,.06);overflow:hidden;position:relative}
    .mfr-rate-card.inactive{opacity:.58;background:#f8fafc}
    .mfr-rate-strip{height:5px;background:#2563eb}
    .mfr-rate-strip.addon{background:#059669}
    .mfr-rate-body{padding:16px}
    .mfr-rate-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:12px}
    .mfr-rate-title{font-size:16px;font-weight:950;color:#0f172a;line-height:1.25}
    .mfr-rate-desc{font-size:12px;color:#64748b;line-height:1.45;margin-top:6px;min-height:34px}
    .mfr-rate-price{font-size:28px;font-weight:950;color:#0d1b3e;letter-spacing:-.04em;margin:8px 0}
    .mfr-rate-price small{font-size:12px;color:#64748b;font-weight:900;letter-spacing:0}
    .mfr-rate-meta{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin:12px 0}
    .mfr-rate-meta div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:9px}
    .mfr-rate-meta span{display:block;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8}
    .mfr-rate-meta strong{font-size:13px;color:#0f172a}
    .mfr-rate-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
    .mfr-rate-badge{display:inline-flex;align-items:center;gap:6px;background:#eff6ff;color:#2563eb;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.12em;border-radius:999px;padding:6px 9px;white-space:nowrap}
    .mfr-rate-badge.off{background:#f1f5f9;color:#64748b}
    .mfr-rate-badge.addon{background:#ecfdf5;color:#059669}
    .mfr-pricing-modal-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
    .mfr-pricing-modal-grid .full{grid-column:1/-1}
    .mfr-pricing-modal-actions{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-top:16px}
    .mfr-pricing-hint{font-size:12px;color:#64748b;line-height:1.45;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-top:12px}
    .mfr-pricing-empty{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:18px;padding:28px;text-align:center;color:#64748b}
    @media(max-width:780px){
      .mfr-pricing-admin-hero{display:block;padding:20px;border-radius:20px}
      .mfr-pricing-admin-hero h1{font-size:25px}
      .mfr-pricing-actions{justify-content:flex-start;margin-top:14px}
      .mfr-pricing-modal-grid{grid-template-columns:1fr}
      .mfr-pricing-search{min-width:100%;max-width:none}
    }
  `;
  document.head.appendChild(css);

  const h = (v) => (window.mfrEstEsc ? window.mfrEstEsc(v) : String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])));
  const money = (n) => (window.mfrMoney ? window.mfrMoney(n) : '$' + Number(n || 0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}));
  const slug = (v, prefix='rate') => prefix + '_' + String(v || '').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,48);

  function mfrPricingStatusBadge(active, type){
    return '<span class="mfr-rate-badge '+(!active?'off':(type==='addon'?'addon':''))+'">'+(active?'Active':'Hidden')+'</span>';
  }

  function mfrNormName(v){ return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }

  function mfrKnownPricingFallback(name, type){
    try {
      if (typeof mfrCatalogMatch === 'function') return mfrCatalogMatch(name, type);
    } catch(_) {}
    const list = type === 'addon' ? (window.MFR_CURRENT_PRICING?.addons || []) : (window.MFR_CURRENT_PRICING?.options || []);
    const n = mfrNormName(name);
    return list.find(item => mfrNormName(item.name) === n || (item.aliases || []).some(a => n.includes(mfrNormName(a)) || mfrNormName(a).includes(n))) || null;
  }

  async function mfrLoadPricingAdminRows(){
    const out = { rates:[], addons:[] };
    try {
      const res = await _sb.from('pricing_rates').select('*').order('display_order', { ascending:true, nullsFirst:false }).order('name', { ascending:true });
      if (!res.error) out.rates = res.data || [];
      else {
        const fallback = await _sb.from('pricing_rates').select('*').order('name', { ascending:true });
        if (!fallback.error) out.rates = fallback.data || [];
      }
    } catch(e) { console.warn('pricing_rates load failed', e); }
    try {
      const res = await _sb.from('addon_pricing_rates').select('*').order('display_order', { ascending:true, nullsFirst:false }).order('name', { ascending:true });
      if (!res.error) out.addons = res.data || [];
      else {
        const fallback = await _sb.from('addon_pricing_rates').select('*').order('name', { ascending:true });
        if (!fallback.error) out.addons = fallback.data || [];
      }
    } catch(e) { console.warn('addon_pricing_rates load failed', e); }
    return out;
  }

  function mfrRowActive(row){ return row?.is_active !== false && row?.active !== false && row?.archived !== true; }

  window.pagePricing = async function(c){
    if (!isAdmin()) {
      c.innerHTML = '<div class="page-wrap"><div class="alert alert-warn">Admin access required to view pricing rates.</div></div>';
      return;
    }
    c.innerHTML = ''
      + '<div class="page-wrap">'
      + '<div class="mfr-pricing-admin-hero"><div><div class="mfr-mfr-badge">⚙️ Admin Pricing</div><h1>Pricing Rates</h1><p>Add, edit, hide, or remove primary roofing options and add-ons. Active items feed directly into the Estimate Builder, so Brian can adjust product offerings without editing code.</p></div><div class="mfr-pricing-actions"><button class="btn btn-light" onclick="mfrOpenPrimaryPricingModal()">+ Primary Option</button><button class="btn btn-success" onclick="mfrOpenAddonPricingModal()">+ Add-On</button><button class="btn btn-outline" style="background:rgba(255,255,255,.12);color:#fff;border-color:rgba(255,255,255,.35)" onclick="applyCurrentMfrPricing()">↻ Load Current MFR Rates</button></div></div>'
      + '<div class="mfr-pricing-toolbar"><div class="left"><input id="mfr-pricing-filter" class="fi mfr-pricing-search" placeholder="Search pricing options, add-ons, units..." oninput="mfrRenderPricingAdminLists()"><select id="mfr-pricing-active-filter" class="fs" style="width:180px" onchange="mfrRenderPricingAdminLists()"><option value="all">All active/hidden</option><option value="active">Active only</option><option value="hidden">Hidden only</option></select></div><div style="font-size:12px;color:var(--text3)">Tip: hide old products instead of deleting if they were used on past quotes.</div></div>'
      + '<div class="mfr-pricing-admin-grid"><div class="card"><div class="card-hd"><div><div class="card-hd-title">Primary Roofing Options</div><div style="font-size:12px;color:var(--text3)">Choose-one packages shown in the Estimate Builder.</div></div><button class="btn btn-primary btn-sm" onclick="mfrOpenPrimaryPricingModal()">+ Add Primary</button></div><div class="card-body" id="mfr-pricing-primary-list">Loading...</div></div>'
      + '<div class="card"><div class="card-hd"><div><div class="card-hd-title">Add-Ons & Upgrades</div><div style="font-size:12px;color:var(--text3)">Optional items customers can add to an estimate.</div></div><button class="btn btn-success btn-sm" onclick="mfrOpenAddonPricingModal()">+ Add Add-On</button></div><div class="card-body" id="mfr-pricing-addon-list">Loading...</div></div></div>'
      + '</div>';
    window.mfrPricingAdminRows = await mfrLoadPricingAdminRows();
    mfrRenderPricingAdminLists();
  };

  window.mfrRenderPricingAdminLists = function(){
    const filter = mfrNormName(document.getElementById('mfr-pricing-filter')?.value || '');
    const activeFilter = document.getElementById('mfr-pricing-active-filter')?.value || 'all';
    const rows = window.mfrPricingAdminRows || {rates:[],addons:[]};

    function pass(row, type){
      const active = mfrRowActive(row);
      if (activeFilter === 'active' && !active) return false;
      if (activeFilter === 'hidden' && active) return false;
      if (!filter) return true;
      const hay = mfrNormName([row.name,row.option_name,row.description,row.badge,row.unit_label,type].join(' '));
      return hay.includes(filter);
    }

    const primary = (rows.rates || []).filter(r => pass(r,'primary'));
    const addons = (rows.addons || []).filter(a => pass(a,'addon'));

    const primaryEl = document.getElementById('mfr-pricing-primary-list');
    if (primaryEl) {
      primaryEl.innerHTML = primary.length ? '<div class="mfr-rate-grid">' + primary.map(function(r){
        const active = mfrRowActive(r);
        const rate = Number(r.price_per_square ?? r.price ?? 0);
        const qty = Number(r.default_qty || 21);
        const fallback = mfrKnownPricingFallback(r.name || r.option_name, 'option') || {};
        const desc = r.description || fallback.description || '';
        const badge = r.badge || fallback.badge || 'Roof Option';
        return '<div class="mfr-rate-card '+(!active?'inactive':'')+'"><div class="mfr-rate-strip"></div><div class="mfr-rate-body"><div class="mfr-rate-top"><div><div class="mfr-rate-title">'+h(r.name || r.option_name || 'Primary Option')+'</div><div class="mfr-rate-desc">'+h(desc || 'Primary roofing package used in the Estimate Builder.')+'</div></div>'+mfrPricingStatusBadge(active,'primary')+'</div><div class="mfr-rate-price">'+money(rate)+' <small>/ sq</small></div><div class="mfr-rate-meta"><div><span>Example '+qty+' sq</span><strong>'+money(rate*qty)+'</strong></div><div><span>Badge</span><strong>'+h(badge)+'</strong></div></div><div class="mfr-rate-actions"><button class="btn btn-primary btn-sm" onclick="mfrOpenPrimaryPricingModal(\''+h(r.id)+'\')">Edit</button><button class="btn btn-outline btn-sm" onclick="mfrDuplicatePrimaryPricing(\''+h(r.id)+'\')">Duplicate</button><button class="btn btn-outline btn-sm" onclick="mfrTogglePrimaryPricing(\''+h(r.id)+'\','+(!active)+')">'+(active?'Hide':'Activate')+'</button><button class="btn btn-danger btn-sm" onclick="mfrDeletePrimaryPricing(\''+h(r.id)+'\')">Delete</button></div></div></div>';
      }).join('') + '</div>' : '<div class="mfr-pricing-empty"><h3>No primary options found</h3><p>Add a primary roof option, or load Brian’s current MFR rates.</p><button class="btn btn-primary" onclick="mfrOpenPrimaryPricingModal()">+ Add Primary Option</button></div>';
    }

    const addonEl = document.getElementById('mfr-pricing-addon-list');
    if (addonEl) {
      addonEl.innerHTML = addons.length ? '<div class="mfr-rate-grid">' + addons.map(function(a){
        const active = mfrRowActive(a);
        const rate = Number(a.price ?? a.price_per_square ?? 0);
        const qty = Number(a.default_qty || a.qty || 1);
        const unit = a.unit_label || 'unit';
        const fallback = mfrKnownPricingFallback(a.name || a.option_name, 'addon') || {};
        const desc = a.description || fallback.description || '';
        return '<div class="mfr-rate-card '+(!active?'inactive':'')+'"><div class="mfr-rate-strip addon"></div><div class="mfr-rate-body"><div class="mfr-rate-top"><div><div class="mfr-rate-title">'+h(a.name || a.option_name || 'Add-On')+'</div><div class="mfr-rate-desc">'+h(desc || 'Optional upgrade available in the Estimate Builder.')+'</div></div>'+mfrPricingStatusBadge(active,'addon')+'</div><div class="mfr-rate-price">'+money(rate)+' <small>/ '+h(unit)+'</small></div><div class="mfr-rate-meta"><div><span>Default Qty</span><strong>'+qty+' '+h(unit)+'</strong></div><div><span>Example Total</span><strong>'+money(rate*qty)+'</strong></div></div><div class="mfr-rate-actions"><button class="btn btn-primary btn-sm" onclick="mfrOpenAddonPricingModal(\''+h(a.id)+'\')">Edit</button><button class="btn btn-outline btn-sm" onclick="mfrDuplicateAddonPricing(\''+h(a.id)+'\')">Duplicate</button><button class="btn btn-outline btn-sm" onclick="mfrToggleAddonPricing(\''+h(a.id)+'\','+(!active)+')">'+(active?'Hide':'Activate')+'</button><button class="btn btn-danger btn-sm" onclick="mfrDeleteAddonPricing(\''+h(a.id)+'\')">Delete</button></div></div></div>';
      }).join('') + '</div>' : '<div class="mfr-pricing-empty"><h3>No add-ons found</h3><p>Add an optional upgrade, or load Brian’s current MFR rates.</p><button class="btn btn-success" onclick="mfrOpenAddonPricingModal()">+ Add Add-On</button></div>';
    }
  };

  function mfrGetPrimaryRow(id){ return (window.mfrPricingAdminRows?.rates || []).find(r => String(r.id) === String(id)); }
  function mfrGetAddonRow(id){ return (window.mfrPricingAdminRows?.addons || []).find(a => String(a.id) === String(id)); }

  window.mfrOpenPrimaryPricingModal = function(id){
    const r = id ? mfrGetPrimaryRow(id) : null;
    const fallback = r ? (mfrKnownPricingFallback(r.name || r.option_name, 'option') || {}) : {};
    const title = r ? 'Edit Primary Option' : 'Add Primary Option';
    mfrModal(title, ''
      + '<div class="mfr-pricing-modal-grid"><div class="fg full"><label class="fl">Option Name</label><input class="fi" id="pr-name" value="'+h(r?.name || r?.option_name || '')+'" placeholder="Owens Corning Duration Flex"></div>'
      + '<div class="fg"><label class="fl">Price Per Square</label><input class="fi" type="number" step="0.01" id="pr-rate" value="'+h(r?.price_per_square ?? fallback.price_per_square ?? '')+'" placeholder="680.43"></div><div class="fg"><label class="fl">Default Qty / Example Squares</label><input class="fi" type="number" step="0.01" id="pr-default-qty" value="'+h(r?.default_qty || 21)+'"></div>'
      + '<div class="fg"><label class="fl">Badge</label><input class="fi" id="pr-badge" value="'+h(r?.badge || fallback.badge || '')+'" placeholder="Most Popular, Class 4, Metal Roof"></div><div class="fg"><label class="fl">Display Order</label><input class="fi" type="number" id="pr-display-order" value="'+h(r?.display_order ?? '')+'" placeholder="10"></div>'
      + '<div class="fg full"><label class="fl">Description</label><textarea class="fi" id="pr-desc" rows="4" placeholder="Customer-facing description for this roofing option.">'+h(r?.description || fallback.description || '')+'</textarea></div>'
      + '<div class="fg full"><label class="fl">Included Items</label><textarea class="fi" id="pr-included" rows="4" placeholder="One item per line, shown on estimate cards.">'+h(r?.included_items || (fallback.included || []).join('\n') || '')+'</textarea></div>'
      + '<div class="fg full"><label style="display:flex;align-items:center;gap:8px;font-weight:800"><input type="checkbox" id="pr-active" '+(mfrRowActive(r || {is_active:true})?'checked':'')+'> Active in Estimate Builder</label></div></div>'
      + '<div class="mfr-pricing-hint">Primary options are the choose-one packages in the estimate builder. Hide old options instead of deleting if they appear on historical quotes.</div>'
      + '<div class="mfr-pricing-modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-primary" onclick="mfrSavePrimaryPricing(\''+h(id || '')+'\')">Save Primary Option</button></div>', '760px');
  };

  window.mfrOpenAddonPricingModal = function(id){
    const a = id ? mfrGetAddonRow(id) : null;
    const fallback = a ? (mfrKnownPricingFallback(a.name || a.option_name, 'addon') || {}) : {};
    const title = a ? 'Edit Add-On' : 'Add Add-On';
    mfrModal(title, ''
      + '<div class="mfr-pricing-modal-grid"><div class="fg full"><label class="fl">Add-On Name</label><input class="fi" id="pa-name" value="'+h(a?.name || a?.option_name || '')+'" placeholder="5 in Seamless Gutters"></div>'
      + '<div class="fg"><label class="fl">Price</label><input class="fi" type="number" step="0.01" id="pa-price" value="'+h(a?.price ?? fallback.price ?? '')+'" placeholder="19.93"></div><div class="fg"><label class="fl">Unit Label</label><input class="fi" id="pa-unit" value="'+h(a?.unit_label || fallback.unit_label || 'unit')+'" placeholder="sq, lf, ea, job"></div>'
      + '<div class="fg"><label class="fl">Default Quantity</label><input class="fi" type="number" step="0.01" id="pa-default-qty" value="'+h(a?.default_qty || fallback.qty || 1)+'"></div><div class="fg"><label class="fl">Display Order</label><input class="fi" type="number" id="pa-display-order" value="'+h(a?.display_order ?? '')+'" placeholder="10"></div>'
      + '<div class="fg full"><label class="fl">Description</label><textarea class="fi" id="pa-desc" rows="4" placeholder="Customer-facing description for this add-on.">'+h(a?.description || fallback.description || '')+'</textarea></div>'
      + '<div class="fg full"><label style="display:flex;align-items:center;gap:8px;font-weight:800"><input type="checkbox" id="pa-active" '+(mfrRowActive(a || {is_active:true})?'checked':'')+'> Active in Estimate Builder</label></div></div>'
      + '<div class="mfr-pricing-hint">Add-ons are optional upgrades. Examples: gutters per LF, fortified roofing per SQ, cool roof fans per EA, warranty per SQ.</div>'
      + '<div class="mfr-pricing-modal-actions"><button class="btn btn-outline" onclick="closeModal()">Cancel</button><button class="btn btn-success" onclick="mfrSaveAddonPricing(\''+h(id || '')+'\')">Save Add-On</button></div>', '720px');
  };

  async function mfrWritePricingRow(table, id, payload){
    const optionalColumns = ['description','badge','included_items','unit_label','default_qty','display_order','option_name','category','updated_at'];
    let working = Object.assign({}, payload);
    for (let attempt=0; attempt<optionalColumns.length+2; attempt++){
      const res = id
        ? await _sb.from(table).update(working).eq('id', id).select().single()
        : await _sb.from(table).insert(working).select().single();
      if (!res.error) return res.data;
      const msg = String(res.error.message || '');
      const colMatch = msg.match(/Could not find the '([^']+)' column|column "([^"]+)"/);
      const missing = colMatch ? (colMatch[1] || colMatch[2]) : null;
      if (missing && Object.prototype.hasOwnProperty.call(working, missing)) {
        delete working[missing];
        continue;
      }
      throw res.error;
    }
    throw new Error('Could not save pricing row.');
  }

  window.mfrSavePrimaryPricing = async function(id){
    if (!isAdmin()) return toast('Admin access required', 'warn');
    const name = (document.getElementById('pr-name')?.value || '').trim();
    const rate = Number(document.getElementById('pr-rate')?.value || 0);
    if (!name) return toast('Option name is required.', 'warn');
    if (rate < 0 || Number.isNaN(rate)) return toast('Enter a valid price per square.', 'warn');
    const payload = {
      name,
      option_name: name,
      price_per_square: rate,
      is_active: !!document.getElementById('pr-active')?.checked,
      description: document.getElementById('pr-desc')?.value || null,
      badge: document.getElementById('pr-badge')?.value || null,
      included_items: document.getElementById('pr-included')?.value || null,
      unit_label: 'sq',
      default_qty: Number(document.getElementById('pr-default-qty')?.value || 21),
      display_order: document.getElementById('pr-display-order')?.value ? Number(document.getElementById('pr-display-order').value) : null,
      category: 'roofing',
      updated_at: new Date().toISOString()
    };
    try {
      await mfrWritePricingRow('pricing_rates', id || null, payload);
      toast(id ? 'Primary option updated.' : 'Primary option added.', 'success');
      closeModal();
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not save primary option: ' + (err.message || err), 'error'); }
  };

  window.mfrSaveAddonPricing = async function(id){
    if (!isAdmin()) return toast('Admin access required', 'warn');
    const name = (document.getElementById('pa-name')?.value || '').trim();
    const price = Number(document.getElementById('pa-price')?.value || 0);
    const unit = (document.getElementById('pa-unit')?.value || 'unit').trim();
    if (!name) return toast('Add-on name is required.', 'warn');
    if (price < 0 || Number.isNaN(price)) return toast('Enter a valid add-on price.', 'warn');
    const payload = {
      name,
      option_name: name,
      price,
      unit_label: unit,
      is_active: !!document.getElementById('pa-active')?.checked,
      description: document.getElementById('pa-desc')?.value || null,
      default_qty: Number(document.getElementById('pa-default-qty')?.value || 1),
      display_order: document.getElementById('pa-display-order')?.value ? Number(document.getElementById('pa-display-order').value) : null,
      category: 'addon',
      updated_at: new Date().toISOString()
    };
    try {
      await mfrWritePricingRow('addon_pricing_rates', id || null, payload);
      toast(id ? 'Add-on updated.' : 'Add-on added.', 'success');
      closeModal();
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not save add-on: ' + (err.message || err), 'error'); }
  };

  window.mfrTogglePrimaryPricing = async function(id, active){
    try {
      const { error } = await _sb.from('pricing_rates').update({ is_active: active, updated_at:new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast(active ? 'Primary option activated.' : 'Primary option hidden.', 'success');
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not update option: ' + (err.message || err), 'error'); }
  };

  window.mfrToggleAddonPricing = async function(id, active){
    try {
      const { error } = await _sb.from('addon_pricing_rates').update({ is_active: active, updated_at:new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      toast(active ? 'Add-on activated.' : 'Add-on hidden.', 'success');
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not update add-on: ' + (err.message || err), 'error'); }
  };

  window.mfrDeletePrimaryPricing = async function(id){
    if (!confirm('Delete this primary pricing option? Hiding is safer if it was used on past quotes.')) return;
    try {
      const { error } = await _sb.from('pricing_rates').delete().eq('id', id);
      if (error) {
        const hide = await _sb.from('pricing_rates').update({ is_active:false, updated_at:new Date().toISOString() }).eq('id', id);
        if (hide.error) throw error;
        toast('Could not delete because it may be referenced. It was hidden instead.', 'warn');
      } else {
        toast('Primary option deleted.', 'success');
      }
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not delete option: ' + (err.message || err), 'error'); }
  };

  window.mfrDeleteAddonPricing = async function(id){
    if (!confirm('Delete this add-on? Hiding is safer if it was used on past quotes.')) return;
    try {
      const { error } = await _sb.from('addon_pricing_rates').delete().eq('id', id);
      if (error) {
        const hide = await _sb.from('addon_pricing_rates').update({ is_active:false, updated_at:new Date().toISOString() }).eq('id', id);
        if (hide.error) throw error;
        toast('Could not delete because it may be referenced. It was hidden instead.', 'warn');
      } else {
        toast('Add-on deleted.', 'success');
      }
      await pagePricing(document.getElementById('content'));
    } catch(err) { toast('Could not delete add-on: ' + (err.message || err), 'error'); }
  };

  window.mfrDuplicatePrimaryPricing = function(id){
    const r = mfrGetPrimaryRow(id);
    if (!r) return;
    mfrOpenPrimaryPricingModal();
    setTimeout(function(){
      document.getElementById('pr-name').value = (r.name || r.option_name || 'Primary Option') + ' Copy';
      document.getElementById('pr-rate').value = r.price_per_square || 0;
      document.getElementById('pr-default-qty').value = r.default_qty || 21;
      document.getElementById('pr-badge').value = r.badge || '';
      document.getElementById('pr-desc').value = r.description || '';
      document.getElementById('pr-included').value = r.included_items || '';
      document.getElementById('pr-active').checked = false;
    }, 0);
  };

  window.mfrDuplicateAddonPricing = function(id){
    const a = mfrGetAddonRow(id);
    if (!a) return;
    mfrOpenAddonPricingModal();
    setTimeout(function(){
      document.getElementById('pa-name').value = (a.name || a.option_name || 'Add-On') + ' Copy';
      document.getElementById('pa-price').value = a.price || 0;
      document.getElementById('pa-unit').value = a.unit_label || 'unit';
      document.getElementById('pa-default-qty').value = a.default_qty || 1;
      document.getElementById('pa-desc').value = a.description || '';
      document.getElementById('pa-active').checked = false;
    }, 0);
  };

  const oldApplyCurrent = window.applyCurrentMfrPricing || applyCurrentMfrPricing;
  window.applyCurrentMfrPricing = async function(){
    try {
      if (typeof oldApplyCurrent === 'function') await oldApplyCurrent();
    } catch(err) {
      console.warn('Original MFR pricing load failed, using admin builder fallback', err);
    }
    try {
      const current = window.MFR_CURRENT_PRICING || {};
      for (let i=0; i<(current.options || []).length; i++){
        const o = current.options[i];
        const rows = (await mfrLoadPricingAdminRows()).rates || [];
        const match = rows.find(r => mfrNormName(r.name || r.option_name) === mfrNormName(o.name) || (o.aliases || []).some(a => mfrNormName(r.name || r.option_name).includes(mfrNormName(a))));
        await mfrWritePricingRow('pricing_rates', match?.id || null, { name:o.name, option_name:o.name, price_per_square:o.price_per_square, is_active:true, unit_label:'sq', default_qty:21, display_order:(i+1)*10, category:'roofing', updated_at:new Date().toISOString() });
      }
      for (let i=0; i<(current.addons || []).length; i++){
        const a = current.addons[i];
        const rows = (await mfrLoadPricingAdminRows()).addons || [];
        const match = rows.find(r => mfrNormName(r.name || r.option_name) === mfrNormName(a.name) || (a.aliases || []).some(alias => mfrNormName(r.name || r.option_name).includes(mfrNormName(alias))));
        await mfrWritePricingRow('addon_pricing_rates', match?.id || null, { name:a.name, option_name:a.name, price:a.price, unit_label:a.unit_label, default_qty:a.qty || 1, is_active:true, display_order:(i+1)*10, category:'addon', updated_at:new Date().toISOString() });
      }
      toast('Current MFR rates loaded.', 'success');
      await pagePricing(document.getElementById('content'));
    } catch(err) {
      toast('Could not load current rates: ' + (err.message || err), 'error');
    }
  };

  // Override Estimate Builder pricing loader so newly-added options/add-ons feed directly into estimates.
  window.mfrLoadEstimateData = async function(){
    const out = { customers: [], jobs: [], options: [], addons: [] };
    try {
      const custRes = await _sb.from('customers').select('id, first_name, last_name, phone, email, address, city, state, zip').order('last_name', { ascending:true });
      if (!custRes.error) out.customers = custRes.data || [];
    } catch(e) { console.warn('Customer load skipped', e); }
    try {
      const jobRes = await _sb.from('jobs').select('id, customer_id, status, contract_value, quote_code, created_at, updated_at, customers(id, first_name, last_name, phone, email, address, city, state, zip)').order('updated_at', { ascending:false });
      if (!jobRes.error) out.jobs = jobRes.data || [];
    } catch(e) { console.warn('Job load skipped', e); }
    try {
      const rateRes = await _sb.from('pricing_rates').select('*').eq('is_active', true).order('display_order', { ascending:true, nullsFirst:false }).order('name', { ascending:true });
      if (!rateRes.error && rateRes.data?.length) {
        out.options = rateRes.data
          .filter(r => (r.name || r.option_name) && Number(r.price_per_square || 0) > 0)
          .map(function(r, idx){
            const cat = mfrKnownPricingFallback(r.name || r.option_name, 'option') || {};
            const included = r.included_items ? String(r.included_items).split(/\n|,/).map(s => s.trim()).filter(Boolean) : (cat.included || []);
            return Object.assign({}, cat, {
              id:'db:' + r.id,
              db_id:r.id,
              name:r.name || r.option_name,
              price_per_square:Number(r.price_per_square || cat.price_per_square || 0),
              description:r.description || cat.description || '',
              badge:r.badge || cat.badge || '',
              included,
              qty:Number(r.default_qty || cat.qty || 21),
              className:cat.className || '',
              source:'db',
              display_order:r.display_order ?? idx
            });
          });
      }
    } catch(e) { console.warn('Pricing table unavailable, using defaults', e); }
    if (!out.options.length && window.MFR_CURRENT_PRICING?.options?.length) {
      out.options = window.MFR_CURRENT_PRICING.options.map(function(r, i){ return Object.assign({}, r, { id:'preset:' + i, source:'preset', description:r.description || '', badge:r.badge || '', included:r.included || [] }); });
    }
    try {
      const addonRes = await _sb.from('addon_pricing_rates').select('*').eq('is_active', true).order('display_order', { ascending:true, nullsFirst:false }).order('name', { ascending:true });
      if (!addonRes.error && addonRes.data?.length) {
        out.addons = addonRes.data
          .filter(a => (a.name || a.option_name))
          .map(function(a, idx){
            const cat = mfrKnownPricingFallback(a.name || a.option_name, 'addon') || {};
            return Object.assign({}, cat, {
              id:'db:' + a.id,
              db_id:a.id,
              name:a.name || a.option_name,
              price:Number(a.price ?? cat.price ?? 0),
              unit_label:a.unit_label || cat.unit_label || 'unit',
              description:a.description || cat.description || '',
              qty:Number(a.default_qty || cat.qty || 1),
              default_qty:Number(a.default_qty || cat.qty || 1),
              source:'db',
              display_order:a.display_order ?? idx
            });
          });
      }
    } catch(e) { console.warn('Addon table unavailable, using defaults', e); }
    if (!out.addons.length && window.MFR_CURRENT_PRICING?.addons?.length) {
      out.addons = window.MFR_CURRENT_PRICING.addons.map(function(a, i){ return Object.assign({}, a, { id:'preset:' + i, source:'preset' }); });
    }
    window.mfrEstimateData = out;
    return out;
  };

  window.mfrDefaultAddonQty = function(a){
    if (a && Number(a.default_qty || 0) > 0) return Number(a.default_qty);
    if (a && Number(a.qty || 0) > 0) return Number(a.qty);
    const n = String(a?.name || '').toLowerCase();
    const measured = parseFloat(document.getElementById('e-squares')?.value || '21') || 21;
    if (n.includes('gutter') || n.includes('leaf')) return 127;
    if (n.includes('fortified') || n.includes('warranty')) return measured || 21;
    if (n.includes('cool')) return 2;
    if (n.includes('hail') || n.includes('wind')) return 1;
    return 1;
  };
})();
