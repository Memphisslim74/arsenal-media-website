
(function(){
  function annEsc(v){ return (typeof escHtml === 'function') ? escHtml(v ?? '') : String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function annDate(v){ if(!v) return '—'; try{return new Date(v).toLocaleDateString();}catch(e){return '—';} }
  function annTime(v){ if(!v) return ''; try{return new Date(v).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});}catch(e){return ''; } }
  function annPriorityBadge(p){ p=String(p||'normal').toLowerCase(); if(p==='urgent') return '<span class="ann-badge urgent">Urgent</span>'; if(p==='important') return '<span class="ann-badge warn">Important</span>'; return '<span class="ann-badge team">Team</span>'; }
  function annIsExpired(a){ return a.expires_at && new Date(a.expires_at).getTime() < Date.now(); }
  function annActiveFilter(items, filter){
    const q = (document.getElementById('ann-search')?.value || '').toLowerCase().trim();
    const f = filter || document.getElementById('ann-filter')?.value || 'active';
    return (items||[]).filter(a => {
      const hay = [a.title,a.body,a.priority,a.audience,a.author_name,a.cta_text].join(' ').toLowerCase();
      if(q && !hay.includes(q)) return false;
      if(f==='pinned' && !a.is_pinned) return false;
      if(f==='urgent' && String(a.priority||'').toLowerCase() !== 'urgent') return false;
      if(f==='expired' && !annIsExpired(a)) return false;
      if(f==='active' && annIsExpired(a)) return false;
      return true;
    });
  }
  function annRenderCard(a){
    const priority = String(a.priority || 'normal').toLowerCase();
    const cls = 'ann-card ' + (a.is_pinned?'pinned ':'') + (priority==='urgent'?'urgent':'');
    const author = a.author_name || a.author_email || a.created_by || 'Team';
    const img = a.image_url ? '<img class="ann-image" src="'+annEsc(a.image_url)+'" alt="'+annEsc(a.image_alt || a.title || 'Announcement image')+'" loading="lazy">' : '';
    const cta = a.cta_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="'+annEsc(a.cta_url)+'">'+annEsc(a.cta_text || 'Open Link')+'</a>' : '';
    const expires = a.expires_at ? '<span>Expires '+annDate(a.expires_at)+'</span>' : '';
    const adminActions = (typeof isAdmin === 'function' && isAdmin()) ? '<div class="ann-action-right"><button class="btn btn-outline btn-sm" onclick="toggleAnnouncementPinned(\''+annEsc(a.id)+'\','+(!a.is_pinned)+')">'+(a.is_pinned?'Unpin':'Pin')+'</button><button class="btn btn-outline btn-sm" onclick="archiveAnnouncement(\''+annEsc(a.id)+'\')">Archive</button></div>' : '';
    return '<article class="'+cls+'">'+img+'<div class="ann-card-head"><div><h3 class="ann-title">'+annEsc(a.title)+'</h3><div class="ann-meta">'+(a.is_pinned?'<span class="ann-badge pin">Pinned</span>':'')+annPriorityBadge(priority)+'<span>'+annEsc(author)+'</span><span>·</span><span>'+annTime(a.created_at)+'</span>'+expires+'</div></div></div><div class="ann-body">'+annEsc(a.body)+'</div><div class="ann-card-actions"><div class="ann-action-left">'+cta+'</div>'+adminActions+'</div></article>';
  }
  window._mfrAnnouncementsCache = [];
  window.renderAnnouncementsList = function(){
    const body = document.getElementById('ann-body');
    if(!body) return;
    const filtered = annActiveFilter(window._mfrAnnouncementsCache || []);
    if(!filtered.length){
      body.innerHTML = '<div class="ann-empty"><div class="icon">📢</div><h3>No Announcements Match</h3><p>Post a new team update or clear your filters.</p></div>';
      return;
    }
    body.innerHTML = '<div class="ann-pro-grid">'+filtered.map(annRenderCard).join('')+'</div>';
  };
  window.pageAnnouncements = async function(c){
    c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Message Board</div><div class="page-sub">Team announcements, pinned updates, images, and links.</div></div>' + ((typeof isAdmin==='function' && isAdmin())?'<button class="btn btn-primary" onclick="postAnnouncementModal()">+ Post Announcement</button>':'') + '</div><section class="ann-pro-hero"><h2>Team Message Board</h2><p>Use this for company updates, schedule changes, jobsite notes, policy reminders, training links, and owner/GM announcements. Pin the important stuff so it stays visible.</p></section><div class="ann-pro-toolbar"><input class="fi" id="ann-search" placeholder="Search announcements..." oninput="renderAnnouncementsList()"><select class="fs" id="ann-filter" onchange="renderAnnouncementsList()"><option value="active">Active</option><option value="pinned">Pinned</option><option value="urgent">Urgent</option><option value="expired">Expired</option><option value="all">All</option></select></div><div id="ann-body"><div class="ann-empty"><div class="icon">📢</div><h3>Loading Announcements</h3><p>Checking team updates...</p></div></div></div>';
    try{
      let res = await _sb.from('announcements').select('*').order('is_pinned',{ascending:false}).order('created_at',{ascending:false}).limit(60);
      if(res.error){ res = await _sb.from('announcements').select('*').order('created_at',{ascending:false}).limit(60); }
      if(res.error) throw res.error;
      window._mfrAnnouncementsCache = res.data || [];
      renderAnnouncementsList();
    }catch(e){
      document.getElementById('ann-body').innerHTML = '<div class="ann-empty"><div class="icon">⚠️</div><h3>Could Not Load Announcements</h3><p>'+annEsc(e.message || e)+'</p></div>';
    }
  };
  window.postAnnouncementModal = function(){
    if(typeof isAdmin==='function' && !isAdmin()){ if(typeof toast==='function') toast('Admin access required','warn'); return; }
    document.getElementById('announcement-modal')?.remove();
    const modal=document.createElement('div'); modal.className='modal-overlay'; modal.id='announcement-modal';
    modal.innerHTML='<div class="modal-sheet" style="max-width:760px"><div class="modal-drag"></div><div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px"><div><div style="font-size:22px;font-weight:950;color:var(--navy)">Post Announcement</div><div style="font-size:13px;color:var(--text2);margin-top:3px">Share a message, image, link, or priority update with the team.</div></div><button class="btn btn-outline btn-sm" onclick="closeAnnouncementModal()">Cancel</button></div><div class="ann-modal-grid"><div class="full"><label class="fl">Title</label><input class="fi" id="ann-title" maxlength="140" placeholder="Example: Production meeting Friday"></div><div class="full"><label class="fl">Message</label><textarea class="fi" id="ann-body-input" rows="5" placeholder="Write your announcement..."></textarea></div><div><label class="fl">Priority</label><select class="fs" id="ann-priority"><option value="normal">Normal</option><option value="important">Important</option><option value="urgent">Urgent</option></select></div><div><label class="fl">Audience</label><select class="fs" id="ann-audience"><option value="team">Whole Team</option><option value="sales">Sales</option><option value="production">Production</option><option value="admin">Admin</option></select></div><div class="full"><label class="fl">Image URL</label><input class="fi" id="ann-image" placeholder="https://... image/banner/photo"></div><div><label class="fl">Button Text</label><input class="fi" id="ann-cta-text" placeholder="Open Link"></div><div><label class="fl">Button URL</label><input class="fi" id="ann-cta-url" placeholder="https://..."></div><div><label class="fl">Expires On</label><input class="fi" type="date" id="ann-expires"></div><div><label class="fl">Options</label><div class="ann-modal-checks"><label><input type="checkbox" id="ann-pinned"> Pin to top</label></div></div></div><div id="ann-modal-err" class="login-err" style="margin-top:12px"></div><div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end;flex-wrap:wrap"><button class="btn btn-outline" onclick="closeAnnouncementModal()">Close</button><button class="btn btn-primary" id="ann-submit-btn" onclick="submitAnnouncement()">📢 Post Announcement</button></div></div>';
    modal.addEventListener('click', e=>{ if(e.target.id==='announcement-modal') closeAnnouncementModal(); }); document.body.appendChild(modal); setTimeout(()=>document.getElementById('ann-title')?.focus(),50);
  };
  window.closeAnnouncementModal = function(){ document.getElementById('announcement-modal')?.remove(); };
  window.submitAnnouncement = async function(){
    const title=document.getElementById('ann-title')?.value.trim(); const body=document.getElementById('ann-body-input')?.value.trim(); const err=document.getElementById('ann-modal-err'); const btn=document.getElementById('ann-submit-btn');
    if(err) err.classList.remove('show');
    if(!title || !body){ if(err){err.textContent='Add a title and message first.';err.classList.add('show');} return; }
    try{
      if(btn){btn.disabled=true;btn.textContent='Posting...';}
      const payload={ title, body, created_by:_user?.id || null, author_email:_profile?.email || _user?.email || null, author_name:_profile?.full_name || _profile?.name || (_profile?.email || '').split('@')[0] || null, priority:document.getElementById('ann-priority')?.value || 'normal', audience:document.getElementById('ann-audience')?.value || 'team', image_url:document.getElementById('ann-image')?.value.trim() || null, cta_text:document.getElementById('ann-cta-text')?.value.trim() || null, cta_url:document.getElementById('ann-cta-url')?.value.trim() || null, expires_at:document.getElementById('ann-expires')?.value || null, is_pinned:!!document.getElementById('ann-pinned')?.checked };
      const {error}=await _sb.from('announcements').insert(payload); if(error) throw error;
      closeAnnouncementModal(); if(typeof toast==='function') toast('Announcement posted','ok'); await pageAnnouncements(document.getElementById('content'));
    }catch(e){ if(err){err.textContent=e.message || 'Unable to post announcement.';err.classList.add('show');} else if(typeof toast==='function') toast('Unable to post announcement','error'); }
    finally{ if(btn){btn.disabled=false;btn.textContent='📢 Post Announcement';} }
  };
  window.toggleAnnouncementPinned = async function(id, pinned){ try{ const {error}=await _sb.from('announcements').update({is_pinned:pinned, updated_at:new Date().toISOString()}).eq('id',id); if(error) throw error; if(typeof toast==='function') toast(pinned?'Announcement pinned':'Announcement unpinned','ok'); await pageAnnouncements(document.getElementById('content')); }catch(e){ if(typeof toast==='function') toast('Could not update announcement: '+(e.message||e),'error'); } };
  window.archiveAnnouncement = async function(id){ if(!confirm('Archive this announcement?')) return; try{ const {error}=await _sb.from('announcements').update({expires_at:new Date().toISOString(), updated_at:new Date().toISOString()}).eq('id',id); if(error) throw error; if(typeof toast==='function') toast('Announcement archived','ok'); await pageAnnouncements(document.getElementById('content')); }catch(e){ if(typeof toast==='function') toast('Could not archive announcement: '+(e.message||e),'error'); } };
})();
