
/* Mobile nav cleanup override */
(function(){
  const oldSync = window.syncSectionButtons;
  window.syncSectionButtons = function(){
    try { if (typeof oldSync === 'function') oldSync(); } catch(_) {}
    try {
      ['ops','est','sales','admin'].forEach(s => {
        document.getElementById('st-'+s)?.classList.toggle('active', s===_section);
        document.getElementById('bn-'+s)?.classList.toggle('active', s===_section && _page !== 'dashboard');
      });
      document.getElementById('bn-home')?.classList.toggle('active', _page === 'dashboard');
    } catch(_) {}
  };
})();



/* ==========================================================
   MFR PATCH: Customer Tracker on Dashboard + Pages/Links
   Adds a dedicated dashboard customer tracker panel and makes
   Customer Tracker more obvious in the Dashboard page map/links.
   ========================================================== */
(function(){
  function ctEsc(v){
    return String(v == null ? '' : v).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]); });
  }
  function ctMoney(v){
    const n = Number(v || 0);
    return n ? '$' + n.toLocaleString(undefined,{maximumFractionDigits:0}) : 'TBD';
  }
  function ctName(job){
    const c = job && job.customers ? job.customers : {};
    const joined = [c.first_name, c.last_name].filter(Boolean).join(' ').trim();
    return job.customer_name || c.name || joined || job.homeowner_name || 'Unknown Customer';
  }
  function ctAddress(job){
    const c = job && job.customers ? job.customers : {};
    return job.address || c.address || job.customer_address || 'No address listed';
  }
  function ctPhone(job){
    const c = job && job.customers ? job.customers : {};
    return job.customer_phone || c.phone || job.phone || '';
  }
  function ctStatusLabel(v){ return String(v || 'lead').replace(/_/g,' ').replace(/\b\w/g, function(m){ return m.toUpperCase(); }); }
  function ctTrackerCode(job){ return job.customer_tracking_code || job.tracking_code || job.quote_code || ''; }
  function ctTrackerUrl(code){ return code ? (window.location.origin + '/track.html?code=' + encodeURIComponent(code)) : ''; }
  function ctQuoteUrl(code){ return code ? (window.location.origin + '/quote.html?code=' + encodeURIComponent(code)) : ''; }

  window.mfrDashboardCopyLink = function(url, label){
    if(!url){ toast('No link available yet.', 'warn'); return; }
    navigator.clipboard.writeText(url).then(function(){ toast((label || 'Link') + ' copied', 'success'); }).catch(function(){
      const ta=document.createElement('textarea'); ta.value=url; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast((label || 'Link') + ' copied', 'success');
    });
  };
  window.mfrDashboardOpenLink = function(url){
    if(!url){ toast('No link available yet.', 'warn'); return; }
    window.open(url, '_blank', 'noopener');
  };

  async function mfrLoadDashboardCustomerTrackerLinks(){
    const list = document.getElementById('dash-customer-links');
    const stat = document.getElementById('dash-tracker-count');
    const statHint = document.getElementById('dash-tracker-hint');
    if(!list) return;
    try{
      let rows = [];
      let err = null;
      try {
        const res = await _sb.from('jobs').select('id,status,contract_value,address,customer_name,customer_phone,customer_tracking_code,quote_code,created_at,updated_at,customers(first_name,last_name,name,phone,address)').order('updated_at',{ascending:false}).limit(6);
        rows = res.data || [];
        err = res.error;
      } catch(e) { err = e; }
      if(err){
        const res2 = await _sb.from('jobs').select('*').order('created_at',{ascending:false}).limit(6);
        if(res2.error) throw res2.error;
        rows = res2.data || [];
      }
      const linkable = (rows || []).filter(function(j){ return ctTrackerCode(j) || j.quote_code; });
      if(stat) stat.textContent = String(linkable.length || rows.length || 0);
      if(statHint) statHint.textContent = linkable.length ? 'Ready links' : 'Recent jobs';
      if(!rows.length){
        list.innerHTML = '<div class="empty-state" style="padding:24px"><div class="icon">📍</div><h3>No tracker links yet</h3><p>Create a job or send a quote to generate customer-facing links.</p><button class="btn btn-primary" onclick="go(\'customer-tracker\')">Open Customer Tracker</button></div>';
        return;
      }
      list.innerHTML = rows.slice(0,5).map(function(job){
        const tCode = ctTrackerCode(job);
        const qCode = job.quote_code || '';
        const tUrl = ctTrackerUrl(tCode);
        const qUrl = ctQuoteUrl(qCode);
        return '<div class="dash-customer-link-row">'
          + '<div class="dash-customer-link-main"><div class="dash-customer-name">'+ctEsc(ctName(job))+'</div><div class="dash-customer-sub">'+ctEsc(ctAddress(job))+'</div><div class="dash-customer-meta"><span>'+ctEsc(ctStatusLabel(job.status))+'</span><span>'+ctEsc(ctMoney(job.contract_value))+'</span>'+ (ctPhone(job)?'<span>'+ctEsc(ctPhone(job))+'</span>':'') +'</div></div>'
          + '<div class="dash-customer-link-actions">'
          + (tUrl ? '<button class="btn btn-sm btn-primary" onclick="mfrDashboardCopyLink(\''+ctEsc(tUrl)+'\',\'Tracker link\')">Copy Tracker</button><button class="btn btn-sm btn-outline" onclick="mfrDashboardOpenLink(\''+ctEsc(tUrl)+'\')">Open</button>' : '<button class="btn btn-sm btn-outline" onclick="go(\'customer-tracker\')">Create Link</button>')
          + (qUrl ? '<button class="btn btn-sm btn-outline" onclick="mfrDashboardCopyLink(\''+ctEsc(qUrl)+'\',\'Quote link\')">Copy Quote</button>' : '')
          + '</div></div>';
      }).join('');
    } catch(e){
      console.error('Dashboard customer tracker links failed', e);
      list.innerHTML = '<div style="padding:18px;color:#B91C1C;font-size:13px">Could not load customer tracker links. <button class="btn btn-sm btn-outline" onclick="go(\'customer-tracker\')">Open Customer Tracker</button></div>';
    }
  }
  window.mfrLoadDashboardCustomerTrackerLinks = mfrLoadDashboardCustomerTrackerLinks;

  function makeSectionCard(secKey){
    if (typeof mfrSectionMiniCard === 'function') return mfrSectionMiniCard(secKey);
    return '';
  }
  function renderPages(){ if(typeof mfrRenderPageDirectory === 'function') mfrRenderPageDirectory(); }

  const priorDashboard = window.pageDashboard || pageDashboard;
  pageDashboard = async function(c) {
    c.innerHTML = '<div class="page-wrap mfr-dashboard-v3">'
      + '<div class="mfr-home-hero"><div><div class="mfr-home-kicker">MFR Command Center</div><h1 class="mfr-home-title">What do you need to work on?</h1><p class="mfr-home-sub">Use this dashboard as the app map. Customer Tracker links, quote links, pages, schedule, and job activity are now available from one place.</p></div><div class="mfr-home-actions"><button class="btn btn-primary" onclick="go(\'pipeline\')">Open Pipeline</button><button class="btn btn-outline" style="background:#fff" onclick="go(\'customer-tracker\')">Customer Tracker</button><button class="btn btn-outline" style="background:#fff" onclick="go(\'customers\')">Customer Lookup</button>' + (isAdmin()?'<button class="btn btn-outline" style="background:#fff" onclick="go(\'nav-builder\')">Manage Navigation</button>':'') + '</div></div>'
      + '<div class="stat-cards">'
      + '<div class="stat-card sc-blue mfr-click-card" onclick="go(\'pipeline\')" title="Open Pipeline"><div class="sc-label">Pipeline</div><div class="sc-val" id="d-pipeline">—</div><div class="mfr-card-hint">Open pipeline</div></div>'
      + '<div class="stat-card sc-green mfr-click-card" onclick="go(\'sales-metrics\')" title="Open Sales Metrics"><div class="sc-label">Closed MTD</div><div class="sc-val" id="d-closed">—</div><div class="mfr-card-hint">Open metrics</div></div>'
      + '<div class="stat-card sc-orange mfr-click-card" onclick="go(\'pipeline\')" title="Open Active Jobs"><div class="sc-label">Active Jobs</div><div class="sc-val" id="d-jobs">—</div><div class="mfr-card-hint">Open jobs</div></div>'
      + '<div class="stat-card sc-purple mfr-click-card" onclick="go(\'appointments\')" title="Open Appointments"><div class="sc-label">Today\'s Appts</div><div class="sc-val" id="d-appts">—</div><div class="mfr-card-hint">Open schedule</div></div>'
      + '</div>'
      + '<div class="mfr-dashboard-spotlight-grid">'
      + '<div class="mfr-tracker-dashboard-card"><div class="mfr-tracker-dashboard-hd"><div><div class="mfr-tracker-kicker-dark">Customer-facing links</div><h2>Customer Tracker</h2><p>Copy project tracking and quote links without hunting through job records.</p></div><div class="mfr-tracker-dashboard-stat"><strong id="dash-tracker-count">—</strong><span id="dash-tracker-hint">Loading</span></div></div><div class="mfr-tracker-dashboard-actions"><button class="btn btn-primary" onclick="go(\'customer-tracker\')">Open Customer Tracker</button><button class="btn btn-outline" onclick="go(\'estimates\')">Build Quote</button></div><div id="dash-customer-links" class="dash-customer-link-list"><div style="padding:18px;color:var(--text3);font-size:13px">Loading customer links...</div></div></div>'
      + '<div class="mfr-dashboard-links-card"><div class="mfr-report-card-hd"><h3>Quick Links</h3><span>Jump into common workflows</span></div><div class="mfr-report-links dash-quick-links"><button onclick="go(\'customer-tracker\')">Customer Tracker</button><button onclick="go(\'estimates\')">Estimate Builder</button><button onclick="go(\'appointments\')">Appointments</button><button onclick="go(\'customers\')">Customers</button><button onclick="go(\'pipeline\')">Pipeline</button><button onclick="go(\'sales-metrics\')">Sales Metrics</button></div></div>'
      + '</div>'
      + '<div class="mfr-section-grid">' + ['ops','est','sales','admin'].map(makeSectionCard).join('') + '</div>'
      + '<div class="mfr-all-pages"><div class="mfr-all-pages-head"><div><h2 class="mfr-all-pages-title">All Pages</h2><p style="margin:4px 0 0;color:var(--text2);font-size:13px">Customer Tracker is listed here with the rest of the Command Center pages.</p></div><span class="mfr-nav-pill">🧭 Pages Menu</span></div>'
      + '<div class="mfr-featured-page-jump" onclick="go(\'customer-tracker\')"><span class="mfr-featured-page-icon">📍</span><span><strong>Customer Tracker</strong><small>Manage customer-facing tracking links, quote links, and project visibility.</small></span><b>Open →</b></div>'
      + '<div class="mfr-quick-find"><input id="mfr-page-search" placeholder="Search pages, customer tracker, estimates, photos, tasks..." oninput="mfrRenderPageDirectory(this.value)"><button class="btn btn-outline" onclick="document.getElementById(\'mfr-page-search\').value=\'\';mfrRenderPageDirectory()">Clear</button></div><div class="mfr-page-results" id="mfr-page-results"></div></div>'
      + '<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;margin-top:16px" class="mfr-dashboard-bottom-grid">'
      + '<div class="card"><div class="card-hd"><div><div class="card-hd-title">Recent Activity</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Latest 10 updates</div></div></div><div class="card-body" id="d-activity"><div class="empty-state" style="padding:30px"><div class="icon">📋</div><p>No activity yet — create your first job to get started.</p></div></div></div>'
      + '<div class="card"><div class="card-hd"><div class="card-hd-title">Upcoming Schedule</div><button class="btn btn-sm btn-primary" onclick="newApptModal()">+ Schedule</button></div><div class="card-body" id="d-appt-list"><p style="color:var(--text3);font-size:13px">Loading appointments...</p></div></div>'
      + '</div></div>';
    renderPages();
    try {
      const { data } = await _sb.from('v_dashboard_stats').select('*').single();
      if (data) {
        document.getElementById('d-pipeline').textContent = '$' + ((data.total_pipeline || 0) / 1000).toFixed(0) + 'K';
        document.getElementById('d-closed').textContent = '$' + ((data.closed_mtd || 0) / 1000).toFixed(0) + 'K';
        document.getElementById('d-jobs').textContent = data.active_jobs || 0;
        document.getElementById('d-appts').textContent = data.todays_appointments || 0;
      }
    } catch(e) { console.warn('Dashboard stats unavailable', e); }
    await mfrLoadDashboardCustomerTrackerLinks();
    try { await mfrLoadRecentActivity(); } catch(e) { if(priorDashboard) console.warn(e); }
    try { await mfrLoadDashboardAppointments(); } catch(e) { console.warn(e); }
    try { refreshTopStats(); } catch(_) {}
  };

  function addDashboardTrackerStyles(){
    if(document.getElementById('mfr-dashboard-customer-tracker-patch')) return;
    const st=document.createElement('style');
    st.id='mfr-dashboard-customer-tracker-patch';
    st.textContent = `
      .mfr-dashboard-spotlight-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(280px,.8fr);gap:14px;margin:16px 0}
      .mfr-tracker-dashboard-card,.mfr-dashboard-links-card{background:#fff;border:1px solid #E2E8F0;border-radius:22px;box-shadow:0 14px 34px rgba(15,23,42,.06);overflow:hidden}
      .mfr-tracker-dashboard-card{padding:16px}.mfr-dashboard-links-card{padding:16px}
      .mfr-tracker-dashboard-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px}
      .mfr-tracker-kicker-dark{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.1em;color:#2563EB;margin-bottom:5px}
      .mfr-tracker-dashboard-hd h2{margin:0;color:#0F172A;font-size:24px;font-weight:950;letter-spacing:-.03em}.mfr-tracker-dashboard-hd p{margin:5px 0 0;color:#64748B;font-size:13px;line-height:1.4;max-width:560px}
      .mfr-tracker-dashboard-stat{background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE;border-radius:16px;min-width:92px;padding:12px;text-align:center}.mfr-tracker-dashboard-stat strong{display:block;color:#1D4ED8;font-size:28px;font-weight:950;line-height:1}.mfr-tracker-dashboard-stat span{display:block;color:#1E3A8A;font-size:10px;text-transform:uppercase;letter-spacing:.06em;font-weight:950;margin-top:4px}
      .mfr-tracker-dashboard-actions{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}.mfr-tracker-dashboard-actions .btn{min-height:38px}
      .dash-customer-link-list{display:grid;gap:10px}.dash-customer-link-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;border:1px solid #E2E8F0;background:#F8FAFC;border-radius:16px;padding:12px}.dash-customer-name{font-size:14px;font-weight:950;color:#0F172A}.dash-customer-sub{font-size:12px;color:#475569;margin-top:2px;line-height:1.35}.dash-customer-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:7px}.dash-customer-meta span{font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.05em;background:#fff;border:1px solid #E2E8F0;border-radius:999px;padding:4px 7px;color:#475569}.dash-customer-link-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.dash-customer-link-actions .btn{min-height:34px}
      .dash-quick-links{display:grid;grid-template-columns:1fr;gap:9px;margin-top:12px}.dash-quick-links button{width:100%;justify-content:flex-start;text-align:left;padding:12px;border-radius:14px;background:#F8FAFC;border:1px solid #E2E8F0;color:#0F172A;font-weight:900}.dash-quick-links button:first-child{background:#EFF6FF;border-color:#BFDBFE;color:#1D4ED8}.dash-quick-links button:hover{background:#EEF2FF;border-color:#93C5FD;color:#1D4ED8}
      .mfr-featured-page-jump{display:flex;align-items:center;gap:12px;border:1px solid #BFDBFE;background:linear-gradient(135deg,#EFF6FF,#fff);border-radius:18px;padding:13px 14px;margin:12px 16px 14px;cursor:pointer;box-shadow:0 10px 24px rgba(37,99,235,.08)}.mfr-featured-page-jump:hover{border-color:#60A5FA;transform:translateY(-1px)}.mfr-featured-page-icon{width:42px;height:42px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:#1D4ED8;color:#fff;font-size:20px;flex:0 0 auto}.mfr-featured-page-jump strong{display:block;color:#0F172A;font-size:14px;font-weight:950}.mfr-featured-page-jump small{display:block;color:#64748B;font-size:12px;margin-top:2px;line-height:1.35}.mfr-featured-page-jump b{margin-left:auto;color:#1D4ED8;font-size:12px;white-space:nowrap}
      @media(max-width:980px){.mfr-dashboard-spotlight-grid{grid-template-columns:1fr}.mfr-dashboard-bottom-grid{grid-template-columns:1fr!important}.dash-quick-links{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:760px){.mfr-dashboard-v3 .mfr-home-actions{width:100%;display:grid;grid-template-columns:1fr;gap:8px}.mfr-dashboard-v3 .mfr-home-actions .btn{width:100%;justify-content:center}.mfr-tracker-dashboard-card,.mfr-dashboard-links-card{border-radius:18px;padding:14px}.mfr-tracker-dashboard-hd{flex-direction:column}.mfr-tracker-dashboard-stat{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left}.dash-customer-link-row{grid-template-columns:1fr}.dash-customer-link-actions{display:grid;grid-template-columns:1fr 1fr;justify-content:stretch}.dash-customer-link-actions .btn{width:100%}.dash-quick-links{grid-template-columns:1fr}.mfr-featured-page-jump{margin:10px 12px 12px;align-items:flex-start}.mfr-featured-page-jump b{display:none}}
    `;
    document.head.appendChild(st);
  }
  addDashboardTrackerStyles();
})();
