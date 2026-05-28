
(function(){
  if(window.__mfrDashAnnClientFixV2) return;
  window.__mfrDashAnnClientFixV2 = true;

  function getClient(){
    try { if(window._sb) return window._sb; } catch(_) {}
    try { if(typeof _sb !== 'undefined' && _sb) return _sb; } catch(_) {}
    try { if(window.supabaseClient) return window.supabaseClient; } catch(_) {}
    return null;
  }
  function esc(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function fmt(v){ if(!v) return ''; try { return new Date(v).toLocaleDateString([], {month:'short', day:'numeric'}); } catch(_) { return ''; } }
  function isExpired(a){
    const v = a.expires_at || a.expiration_date || a.expires_on;
    if(!v) return false;
    const d = new Date(v);
    if(Number.isNaN(d.getTime())) return false;
    // Treat expiration as end-of-day when only a date was used.
    d.setHours(23,59,59,999);
    return d.getTime() < Date.now();
  }
  function isArchived(a){
    const status = String(a.status || '').toLowerCase();
    return a.archived === true || a.is_archived === true || status === 'archived' || status === 'deleted';
  }
  function audienceOk(a){
    const raw = String(a.audience || a.target_audience || a.visible_to || '').trim().toLowerCase().replace(/[\s-]+/g,'_');
    return !raw || ['team','whole_team','all','everyone','company','internal','staff','office','admin','sales','production','field'].includes(raw);
  }
  function pinned(a){ return a.is_pinned === true || a.pinned === true; }
  function priorityBadge(a){
    const p = String(a.priority || 'normal').toLowerCase();
    if(pinned(a)) return '<span class="mfr-dash-ann-badge pinned">Pinned</span>';
    if(p === 'urgent') return '<span class="mfr-dash-ann-badge urgent">Urgent</span>';
    if(p === 'important' || p === 'high') return '<span class="mfr-dash-ann-badge important">Important</span>';
    return '<span class="mfr-dash-ann-badge">Team</span>';
  }
  function imageFor(client, a){
    const direct = a.image_url || a.image_public_url || a.image_src || '';
    if(direct) return direct;
    const path = a.image_path || a.storage_path || '';
    if(path && client && client.storage){
      try {
        const res = client.storage.from('announcement-images').getPublicUrl(path);
        return res && res.data && res.data.publicUrl ? res.data.publicUrl : '';
      } catch(_) {}
    }
    return '';
  }
  function ensureStyles(){
    if(document.getElementById('mfr-dash-ann-client-fix-css')) return;
    const style=document.createElement('style');
    style.id='mfr-dash-ann-client-fix-css';
    style.textContent = `
      #mfr-dashboard-announcements{margin:0 0 18px!important}
      .mfr-dash-ann{background:#fff;border:1px solid #e2e8f0;border-radius:22px;padding:18px;box-shadow:0 12px 28px rgba(15,23,42,.06);overflow:hidden}
      .mfr-dash-ann-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}
      .mfr-dash-ann-head h3{margin:0;color:#0D1B3E;font-size:18px;font-weight:950}.mfr-dash-ann-head p{margin:4px 0 0;color:#64748b;font-size:13px;line-height:1.35}
      .mfr-dash-ann-actions{display:flex;gap:8px;flex-wrap:wrap}.mfr-dash-ann-list{display:grid;gap:10px}
      .mfr-dash-ann-item{display:grid;grid-template-columns:84px minmax(0,1fr) auto;gap:12px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:10px;min-width:0}
      .mfr-dash-ann-img{width:84px;height:62px;object-fit:cover;border-radius:12px;background:#e2e8f0}.mfr-dash-ann-icon{width:84px;height:62px;border-radius:12px;background:#eff6ff;color:#1d4ed8;display:flex;align-items:center;justify-content:center;font-size:26px}
      .mfr-dash-ann-title{font-size:14px;font-weight:900;color:#0f172a;margin-bottom:3px}.mfr-dash-ann-body{font-size:13px;color:#475569;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
      .mfr-dash-ann-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px;color:#64748b;font-size:11px}
      .mfr-dash-ann-badge{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:#e0f2fe;color:#075985;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}.mfr-dash-ann-badge.urgent{background:#fee2e2;color:#991b1b}.mfr-dash-ann-badge.important{background:#fef3c7;color:#92400e}.mfr-dash-ann-badge.pinned{background:#ede9fe;color:#5b21b6}
      .mfr-dash-ann-empty{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:14px;padding:14px;color:#64748b;font-size:13px}
      @media(max-width:720px){.mfr-dash-ann{padding:14px;border-radius:18px}.mfr-dash-ann-head{display:grid}.mfr-dash-ann-actions .btn{width:100%;justify-content:center}.mfr-dash-ann-item{grid-template-columns:64px minmax(0,1fr);align-items:start}.mfr-dash-ann-img,.mfr-dash-ann-icon{width:64px;height:54px}.mfr-dash-ann-item>div:last-child{grid-column:1/-1}.mfr-dash-ann-item .btn{width:100%;justify-content:center}}
    `;
    document.head.appendChild(style);
  }
  async function fetchAnnouncements(){
    const client = getClient();
    if(!client) return {list:[], waiting:true};
    let res = await client.from('announcements').select('*').order('created_at', {ascending:false}).limit(25);
    if(res.error) throw res.error;
    const list = (res.data || [])
      .filter(a => !isArchived(a) && !isExpired(a) && audienceOk(a))
      .sort((a,b) => (pinned(b)?1:0) - (pinned(a)?1:0) || new Date(b.created_at||0) - new Date(a.created_at||0))
      .slice(0,4);
    return {list, waiting:false};
  }
  function dashboardHost(){
    const content = document.getElementById('content');
    if(!content) return null;
    return content.querySelector('.page-wrap') || content;
  }
  function insertSection(){
    const host = dashboardHost();
    if(!host) return null;
    document.getElementById('mfr-dashboard-announcements')?.remove();
    const section=document.createElement('section');
    section.id='mfr-dashboard-announcements';
    section.className='mfr-dash-ann';
    section.innerHTML = '<div class="mfr-dash-ann-head"><div><h3>📢 Team Announcements</h3><p>Latest active updates from the Message Board.</p></div><div class="mfr-dash-ann-actions"><button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">View All</button>' + ((typeof isAdmin==='function' && isAdmin())?'<button class="btn btn-primary btn-sm" onclick="go(\'announcements\'); setTimeout(function(){ if(window.postAnnouncementModal) postAnnouncementModal(); },350)">Post</button>':'') + '</div></div><div class="mfr-dash-ann-empty">Loading announcements...</div>';
    const anchor = host.querySelector('.mfr-home-hero,.mfr-app-map-hero,.dash-hero,.dashboard-hero,.page-hd');
    if(anchor) anchor.insertAdjacentElement('afterend', section);
    else host.prepend(section);
    return section;
  }
  window.renderDashboardAnnouncements = async function(){
    ensureStyles();
    const section = insertSection();
    if(!section) return;
    try{
      const client = getClient();
      const result = await fetchAnnouncements();
      if(result.waiting){
        section.querySelector('.mfr-dash-ann-empty').innerHTML = 'Loading team announcements...';
        setTimeout(() => { try{ window.renderDashboardAnnouncements(); }catch(_){} }, 800);
        return;
      }
      const list = result.list || [];
      if(!list.length){
        section.querySelector('.mfr-dash-ann-empty').innerHTML = 'No active team announcements yet. Post one from Message Board and it will appear here.';
        return;
      }
      section.querySelector('.mfr-dash-ann-empty').outerHTML = '<div class="mfr-dash-ann-list">' + list.map(a => {
        const imgUrl = imageFor(client, a);
        const img = imgUrl ? '<img class="mfr-dash-ann-img" src="'+esc(imgUrl)+'" alt="'+esc(a.title||'Announcement')+'">' : '<div class="mfr-dash-ann-icon">📢</div>';
        const cta = a.cta_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="'+esc(a.cta_url)+'">'+esc(a.cta_text||'Open')+'</a>' : '<button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">Open</button>';
        return '<article class="mfr-dash-ann-item">'+img+'<div><div class="mfr-dash-ann-title">'+esc(a.title||'Announcement')+'</div><div class="mfr-dash-ann-body">'+esc(a.body||a.message||'')+'</div><div class="mfr-dash-ann-meta">'+priorityBadge(a)+'<span>'+esc(a.author_name||a.author_email||'Team')+'</span><span>·</span><span>'+esc(fmt(a.created_at))+'</span></div></div><div>'+cta+'</div></article>';
      }).join('') + '</div>';
    }catch(err){
      console.error('Dashboard announcements failed:', err);
      section.querySelector('.mfr-dash-ann-empty').innerHTML = '<span style="color:#b91c1c">Could not load announcements: '+esc(err && err.message ? err.message : err)+'</span>';
    }
  };
  function shouldRender(){
    const page = String(window._page || window.route || '').toLowerCase();
    return page === 'dashboard' || !!document.querySelector('#content .mfr-home-hero,#content .mfr-app-map-hero,#content .dashboard-hero');
  }
  function scheduleRender(delay){ setTimeout(function(){ if(shouldRender()) window.renderDashboardAnnouncements(); }, delay || 120); }
  if(typeof window.go === 'function' && !window.__mfrDashAnnClientFixGoWrapped){
    window.__mfrDashAnnClientFixGoWrapped = true;
    const oldGo = window.go;
    window.go = function(id){ const out = oldGo.apply(this, arguments); if(String(id)==='dashboard') scheduleRender(400); return out; };
    try { go = window.go; } catch(_) {}
  }
  if(typeof window.renderPage === 'function' && !window.__mfrDashAnnClientFixRenderWrapped){
    window.__mfrDashAnnClientFixRenderWrapped = true;
    const oldRender = window.renderPage;
    window.renderPage = async function(id){ const out = await oldRender.apply(this, arguments); if(String(id)==='dashboard') scheduleRender(120); return out; };
    try { renderPage = window.renderPage; } catch(_) {}
  }
  if(window.MutationObserver && !window.__mfrDashAnnClientFixObserver){
    window.__mfrDashAnnClientFixObserver = true;
    let t=null;
    const content = document.getElementById('content');
    if(content){ new MutationObserver(function(){ clearTimeout(t); t=setTimeout(function(){ if(shouldRender() && !document.getElementById('mfr-dashboard-announcements')) window.renderDashboardAnnouncements(); },200); }).observe(content,{childList:true, subtree:false}); }
  }
  scheduleRender(300);
  scheduleRender(1200);
})();
