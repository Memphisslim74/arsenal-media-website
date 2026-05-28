
(function(){
  const ANN_BUCKET = 'announcement-images';
  function e(v){ return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s])); }
  function canAdminSafe(){ try{return typeof isAdmin==='function' ? !!isAdmin() : true;}catch(_){return true;} }
  function annExpired(a){ return !!(a && a.expires_at && new Date(a.expires_at).getTime() < Date.now()); }
  function fmt(v){ try{return v?new Date(v).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}):'';}catch(_){return '';} }
  function badge(a){ const p=String(a.priority||'normal').toLowerCase(); if(a.is_pinned) return '<span class="ann-badge pin">Pinned</span>'; if(p==='urgent') return '<span class="ann-badge urgent">Urgent</span>'; if(p==='important') return '<span class="ann-badge warn">Important</span>'; return '<span class="ann-badge team">Team</span>'; }

  async function fetchDashAnnouncements(){
    if(!window._sb) return [];
    let res = await _sb.from('announcements').select('*').order('is_pinned',{ascending:false}).order('created_at',{ascending:false}).limit(8);
    if(res.error) throw res.error;
    return (res.data||[]).filter(a=>!annExpired(a)).slice(0,3);
  }

  window.renderDashboardAnnouncements = async function(){
    const content = document.getElementById('content');
    if(!content) return;
    const old = document.getElementById('mfr-dashboard-announcements');
    if(old) old.remove();
    let host = content.querySelector('.page-wrap') || content;
    const section = document.createElement('section');
    section.id = 'mfr-dashboard-announcements';
    section.className = 'mfr-dash-ann';
    section.innerHTML = '<div class="mfr-dash-ann-head"><div><h3>📢 Team Announcements</h3><p>Latest pinned and active updates from the Message Board.</p></div><div class="mfr-dash-ann-actions"><button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">View All</button>'+(canAdminSafe()?'<button class="btn btn-primary btn-sm" onclick="go(\'announcements\'); setTimeout(function(){ if(window.postAnnouncementModal) postAnnouncementModal(); }, 350)">Post</button>':'')+'</div></div><div class="mfr-dash-ann-empty">Loading announcements...</div>';
    const firstHero = host.querySelector('.mfr-app-map-hero,.dash-hero,.app-map-hero,.dashboard-hero,.page-hd');
    if(firstHero && firstHero.classList && firstHero.classList.contains('page-hd')) firstHero.insertAdjacentElement('afterend', section);
    else if(firstHero) firstHero.insertAdjacentElement('beforebegin', section);
    else host.prepend(section);
    try{
      const list = await fetchDashAnnouncements();
      if(!list.length){ section.querySelector('.mfr-dash-ann-empty').innerHTML = 'No active announcements yet. Use the Message Board for company updates, storm alerts, training links, and owner/GM notes.'; return; }
      section.querySelector('.mfr-dash-ann-empty').outerHTML = '<div class="mfr-dash-ann-list">'+list.map(a=>{
        const img = a.image_url ? '<img class="mfr-dash-ann-img" src="'+e(a.image_url)+'" alt="'+e(a.title||'Announcement')+'">' : '<div class="mfr-dash-ann-icon">📢</div>';
        const cta = a.cta_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="'+e(a.cta_url)+'">'+e(a.cta_text||'Open')+'</a>' : '<button class="btn btn-outline btn-sm" onclick="go(\'announcements\')">Open</button>';
        return '<article class="mfr-dash-ann-item">'+img+'<div><div class="mfr-dash-ann-title">'+e(a.title)+'</div><div class="mfr-dash-ann-body">'+e(a.body||'')+'</div><div class="mfr-dash-ann-meta">'+badge(a)+'<span>'+e(a.author_name||a.author_email||'Team')+'</span><span>·</span><span>'+e(fmt(a.created_at))+'</span></div></div><div class="mfr-dash-ann-actions">'+cta+'</div></article>';
      }).join('')+'</div>';
    }catch(err){ section.querySelector('.mfr-dash-ann-empty').innerHTML = '<span style="color:#b91c1c">Could not load announcements: '+e(err.message||err)+'</span>'; }
  };

  const originalDashboard = window.pageDashboard;
  if(typeof originalDashboard === 'function'){
    window.pageDashboard = async function(c){
      await originalDashboard(c);
      try{ await window.renderDashboardAnnouncements(); }catch(err){ console.warn('dashboard announcements skipped', err); }
    };
    try{ pageDashboard = window.pageDashboard; }catch(_){ }
  }
  if(window._page === 'dashboard' || window.route === 'dashboard') setTimeout(function(){ try{ window.renderDashboardAnnouncements(); }catch(_){} }, 600);

  function authorName(){ try{return window._profile?.name || window._profile?.full_name || window._user?.user_metadata?.full_name || window._user?.email || 'Team';}catch(_){return 'Team';} }
  function authorEmail(){ try{return window._user?.email || null;}catch(_){return null;} }
  async function uploadAnnouncementImageCompat(){
    const fileInput = document.getElementById('ann-image-file');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if(!file) return null;
    if(!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')) throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
    if(file.size > 10 * 1024 * 1024) throw new Error('Image must be smaller than 10MB.');
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
    const uid = (window._user && _user.id) ? _user.id : 'team';
    const path = uid + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const up = await _sb.storage.from(ANN_BUCKET).upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type || 'image/jpeg' });
    if(up.error){
      if(String(up.error.message||'').toLowerCase().includes('bucket')) throw new Error('Announcement image bucket is missing. Run the Announcement image/schema repair SQL first.');
      throw up.error;
    }
    const pub = _sb.storage.from(ANN_BUCKET).getPublicUrl(path);
    return {url: pub && pub.data ? pub.data.publicUrl : null, path};
  }
  async function saveAnnouncementWithFallback(payload, editing){
    async function doSave(p){ return editing && editing.id ? _sb.from('announcements').update(p).eq('id', editing.id) : _sb.from('announcements').insert(p); }
    let res = await doSave(payload);
    if(res.error && /image_path|schema cache/i.test(res.error.message||'')){
      const retry = Object.assign({}, payload); delete retry.image_path;
      res = await doSave(retry);
    }
    if(res.error && /created_by|schema cache/i.test(res.error.message||'')){
      const retry = Object.assign({}, payload); delete retry.image_path; delete retry.created_by;
      res = await doSave(retry);
    }
    return res;
  }
  window.submitAnnouncement = async function(){
    const editing = window._mfrAnnouncementEditing || null;
    const title = document.getElementById('ann-title')?.value.trim();
    const body = document.getElementById('ann-body-input')?.value.trim();
    const err = document.getElementById('ann-modal-err');
    const btn = document.getElementById('ann-submit-btn');
    if(err) err.classList.remove('show');
    if(!title || !body){ if(err){ err.textContent='Add a title and message first.'; err.classList.add('show'); } return; }
    try{
      if(btn){ btn.disabled=true; btn.textContent = editing ? 'Saving...' : 'Posting...'; }
      const payload = {
        title, body,
        author_email: authorEmail(), author_name: authorName(),
        priority: document.getElementById('ann-priority')?.value || 'normal',
        audience: document.getElementById('ann-audience')?.value || 'team',
        cta_text: document.getElementById('ann-cta-text')?.value.trim() || null,
        cta_url: document.getElementById('ann-cta-url')?.value.trim() || null,
        expires_at: document.getElementById('ann-expires')?.value || null,
        is_pinned: !!document.getElementById('ann-pinned')?.checked,
        updated_at: new Date().toISOString()
      };
      if(!editing) payload.created_by = (window._user && _user.id) ? _user.id : null;
      const removeImage = !!document.getElementById('ann-remove-image')?.checked;
      const uploaded = await uploadAnnouncementImageCompat();
      if(uploaded){ payload.image_url = uploaded.url; payload.image_path = uploaded.path; }
      else if(removeImage){ payload.image_url = null; payload.image_path = null; }
      const res = await saveAnnouncementWithFallback(payload, editing);
      if(res.error) throw res.error;
      if(window.closeAnnouncementModal) closeAnnouncementModal();
      if(typeof toast==='function') toast(editing ? 'Announcement updated' : 'Announcement posted','ok');
      if(window._page === 'dashboard' || window.route === 'dashboard') await window.pageDashboard(document.getElementById('content'));
      else if(window.pageAnnouncements) await pageAnnouncements(document.getElementById('content'));
    }catch(ex){ if(err){ err.textContent = ex.message || 'Unable to save announcement.'; err.classList.add('show'); } else if(typeof toast==='function') toast('Unable to save announcement: '+(ex.message||ex),'error'); }
    finally{ if(btn){ btn.disabled=false; btn.textContent = editing ? 'Save Changes' : '📢 Post Announcement'; } }
  };
})();
