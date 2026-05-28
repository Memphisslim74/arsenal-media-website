
/* MFR Dashboard Announcements Robust Fix
   Pulls active announcements from public.announcements and renders them on Dashboard.
   Handles audience values saved as team, whole_team, Whole Team, all, etc.
   Also hooks dashboard route changes so the section renders even if pageDashboard is replaced elsewhere. */
(function mfrDashboardAnnouncementsRobustFix(){
  if(window.__mfrDashAnnouncementsRobustFix) return;
  window.__mfrDashAnnouncementsRobustFix = true;

  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function fmt(v){ if(!v) return ''; try { return new Date(v).toLocaleDateString([], {month:'short', day:'numeric'}); } catch(_) { return ''; } }
  function expired(a){
    const v = a.expires_at || a.expiration_date || a.expires_on;
    return v && new Date(v).getTime() < Date.now();
  }
  function archived(a){
    return a.archived === true || a.is_archived === true || a.status === 'archived' || a.status === 'deleted';
  }
  function audienceOk(a){
    // Dashboard is the team landing page, so show active team/company announcements.
    // Also allow blank values because older posts may not have audience populated.
    const raw = String(a.audience || a.target_audience || a.visible_to || '').trim().toLowerCase().replace(/[\s-]+/g,'_');
    return !raw || ['team','whole_team','all','everyone','company','internal','staff','admin','sales','production'].includes(raw);
  }
  function priorityBadge(a){
    const p = String(a.priority || 'normal').toLowerCase();
    if(p === 'urgent') return '<span class="mfr-dash-ann-badge urgent">Urgent</span>';
    if(p === 'important' || p === 'high') return '<span class="mfr-dash-ann-badge important">Important</span>';
    if(a.is_pinned) return '<span class="mfr-dash-ann-badge pinned">Pinned</span>';
    return '<span class="mfr-dash-ann-badge">Team</span>';
  }

  async function fetchAnnouncements(){
    if(!window._sb) return [];
    // Avoid strict column selection so old/new schemas both work.
    let res = await _sb.from('announcements')
      .select('*')
      .order('is_pinned', {ascending:false})
      .order('created_at', {ascending:false})
      .limit(12);
    if(res.error) {
      console.warn('Dashboard announcements primary query failed:', res.error);
      // fallback: some older schemas may not have is_pinned
      res = await _sb.from('announcements').select('*').order('created_at', {ascending:false}).limit(12);
    }
    if(res.error) throw res.error;
    return (res.data || []).filter(a => !archived(a) && !expired(a) && audienceOk(a)).slice(0,4);
  }

  function ensureStyles(){
    if(document.getElementById('mfr-dash-ann-robust-css')) return;
    const style=document.createElement('style');
    style.id='mfr-dash-ann-robust-css';
    style.textContent = `
      #mfr-dashboard-announcements{margin:0 0 18px!important;}
      .mfr-dash-ann{background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:18px;box-shadow:0 12px 28px rgba(15,23,42,.06)}
      .mfr-dash-ann-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
      .mfr-dash-ann-head h3{margin:0;color:#0D1B3E;font-size:18px;font-weight:950}.mfr-dash-ann-head p{margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.35}
      .mfr-dash-ann-actions{display:flex;gap:8px;flex-wrap:wrap}.mfr-dash-ann-list{display:grid;gap:10px}
      .mfr-dash-ann-item{display:grid;grid-template-columns:72px 1fr auto;gap:12px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px}
      .mfr-dash-ann-img{width:72px;height:58px;object-fit:cover;border-radius:12px;background:#e2e8f0}.mfr-dash-ann-icon{width:72px;height:58px;border-radius:12px;background:#eff6ff;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-size:26px}
      .mfr-dash-ann-title{font-size:14px;font-weight:900;color:#0f172a;margin-bottom:3px}.mfr-dash-ann-body{font-size:13px;color:#475569;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .mfr-dash-ann-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;color:#64748b;font-size:11px}
      .mfr-dash-ann-badge{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.mfr-dash-ann-badge.urgent{background:#fee2e2;color:#991b1b}.mfr-dash-ann-badge.important{background:#fef3c7;color:#92400e}.mfr-dash-ann-badge.pinned{background:#ede9fe;color:#5b21b6}
      .mfr-dash-ann-empty{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:14px;color:#64748b;font-size:13px}
      @media(max-width:720px){.mfr-dash-ann{padding:14px;border-radius:18px}.mfr-dash-ann-head{display:grid}.mfr-dash-ann-actions .btn{width:100%;justify-content:center}.mfr-dash-ann-item{grid-template-columns:56px 1fr;align-items:start}.mfr-dash-ann-img,.mfr-dash-ann-icon{width:56px;height:52px}.mfr-dash-ann-item>div:last-child{grid-column:1/-1}.mfr-dash-ann-item .btn{width:100%;justify-content:center}}
    `;
    document.head.appendChild(style);
  }

  window.renderDashboardAnnouncements = async function(){
    ensureStyles();
    const content = document.getElementById('content');
    if(!content) return;
    const old = document.getElementById('mfr-dashboard-announcements');
    if(old) old.remove();

    const host = content.querySelector('.page-wrap') || content;
    const section=document.createElement('section');
    section.id='mfr-dashboard-announcements';
    section.className='mfr-dash-ann';
    section.innerHTML = '<div class="mfr-dash-ann-head"><div><h3>📢 Team Announcements</h3><p>Latest active updates from the Message Board.</p></div><div class="mfr-dash-ann-actions"><button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">View All</button>' + ((typeof isAdmin==='function' && isAdmin())?'<button class="btn btn-primary btn-sm" onclick="go(\'announcements\'); setTimeout(function(){ if(window.postAnnouncementModal) postAnnouncementModal(); },350)">Post</button>':'') + '</div></div><div class="mfr-dash-ann-empty">Loading announcements...</div>';

    const anchor = host.querySelector('.mfr-home-hero,.mfr-app-map-hero,.dash-hero,.dashboard-hero,.page-hd');
    if(anchor) anchor.insertAdjacentElement('afterend', section);
    else host.prepend(section);

    try{
      const list = await fetchAnnouncements();
      if(!list.length){
        section.querySelector('.mfr-dash-ann-empty').innerHTML = 'No active team announcements yet. Post one from Message Board and it will appear here.';
        return;
      }
      section.querySelector('.mfr-dash-ann-empty').outerHTML = '<div class="mfr-dash-ann-list">' + list.map(a => {
        const img = a.image_url ? '<img class="mfr-dash-ann-img" src="'+esc(a.image_url)+'" alt="'+esc(a.title||'Announcement')+'">' : '<div class="mfr-dash-ann-icon">📢</div>';
        const cta = a.cta_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="'+esc(a.cta_url)+'">'+esc(a.cta_text||'Open')+'</a>' : '<button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">Open</button>';
        return '<article class="mfr-dash-ann-item">'+img+'<div><div class="mfr-dash-ann-title">'+esc(a.title||'Announcement')+'</div><div class="mfr-dash-ann-body">'+esc(a.body||a.message||'')+'</div><div class="mfr-dash-ann-meta">'+priorityBadge(a)+'<span>'+esc(a.author_name||a.author_email||'Team')+'</span><span>·</span><span>'+esc(fmt(a.created_at))+'</span></div></div><div>'+cta+'</div></article>';
      }).join('') + '</div>';
    }catch(err){
      console.error('Dashboard announcements failed:', err);
      const msg = err && err.message ? err.message : String(err || 'Unknown error');
      section.querySelector('.mfr-dash-ann-empty').innerHTML = '<span style="color:#b91c1c">Could not load announcements: '+esc(msg)+'</span>';
    }
  };

  async function afterDashboard(){
    const page = window._page || window.route || '';
    if(page === 'dashboard' || document.querySelector('.mfr-home-hero,.mfr-app-map-hero,.dashboard-hero')) {
      try { await window.renderDashboardAnnouncements(); } catch(e) { console.warn(e); }
    }
  }

  // Wrap renderPage when available.
  if(typeof window.renderPage === 'function' && !window.__mfrRenderPageAnnWrapped){
    window.__mfrRenderPageAnnWrapped = true;
    const oldRender = window.renderPage;
    window.renderPage = async function(id){
      const out = await oldRender.apply(this, arguments);
      if(id === 'dashboard') setTimeout(afterDashboard, 60);
      return out;
    };
    try { renderPage = window.renderPage; } catch(_) {}
  }

  // Wrap go when available.
  if(typeof window.go === 'function' && !window.__mfrGoAnnWrapped){
    window.__mfrGoAnnWrapped = true;
    const oldGo = window.go;
    window.go = function(id){
      const out = oldGo.apply(this, arguments);
      if(id === 'dashboard') setTimeout(afterDashboard, 250);
      return out;
    };
    try { go = window.go; } catch(_) {}
  }

  // Last-resort observer: if dashboard content is rendered later, add announcements.
  const content = document.getElementById('content');
  if(content && window.MutationObserver && !window.__mfrDashAnnObserver){
    window.__mfrDashAnnObserver = true;
    let t=null;
    new MutationObserver(function(){
      clearTimeout(t);
      t=setTimeout(function(){
        if(!document.getElementById('mfr-dashboard-announcements') && document.querySelector('#content .mfr-home-hero,#content .mfr-app-map-hero,#content .dashboard-hero')) afterDashboard();
      },150);
    }).observe(content, {childList:true, subtree:false});
  }

  setTimeout(afterDashboard, 500);
})();
