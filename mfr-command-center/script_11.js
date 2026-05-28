
(function(){
  const ANN_BUCKET = 'announcement-images';

  function canAdmin(){
    try { return typeof isAdmin === 'function' ? !!isAdmin() : true; } catch(_) { return true; }
  }
  function annEsc(v){
    return String(v ?? '').replace(/[&<>"']/g, function(m){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
  }
  function annDate(v){
    if(!v) return '—';
    try { return new Date(v).toLocaleDateString(); } catch(_) { return '—'; }
  }
  function annTime(v){
    if(!v) return '—';
    try { return new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); } catch(_) { return '—'; }
  }
  function annPriorityBadge(p){
    p = String(p || 'normal').toLowerCase();
    if(p === 'urgent') return '<span class="ann-badge urgent">Urgent</span>';
    if(p === 'important') return '<span class="ann-badge important">Important</span>';
    return '<span class="ann-badge">Normal</span>';
  }
  function currentAuthorName(){
    try {
      return (_profile && (_profile.full_name || _profile.name || _profile.display_name)) || (_user && _user.email ? _user.email.split('@')[0] : null);
    } catch(_) { return null; }
  }
  function currentAuthorEmail(){
    try { return (_profile && _profile.email) || (_user && _user.email) || null; } catch(_) { return null; }
  }
  function getSearch(){
    return (document.getElementById('ann-search')?.value || '').trim().toLowerCase();
  }
  function getFilter(){
    return document.getElementById('ann-filter')?.value || 'active';
  }
  function isExpired(a){
    if(!a || !a.expires_at) return false;
    try { return new Date(a.expires_at).getTime() < Date.now(); } catch(_) { return false; }
  }
  function filterAnnouncements(list){
    const q = getSearch();
    const f = getFilter();
    return (list || []).filter(function(a){
      const expired = isExpired(a);
      if(f === 'active' && expired) return false;
      if(f === 'pinned' && !a.is_pinned) return false;
      if(f === 'urgent' && String(a.priority || '').toLowerCase() !== 'urgent') return false;
      if(f === 'expired' && !expired) return false;
      if(q){
        const blob = [a.title,a.body,a.priority,a.audience,a.author_name,a.author_email].map(function(x){return String(x||'').toLowerCase();}).join(' ');
        if(!blob.includes(q)) return false;
      }
      return true;
    });
  }
  function renderCard(a){
    const priority = String(a.priority || 'normal').toLowerCase();
    const classes = ['ann-card'];
    if(a.is_pinned) classes.push('pinned');
    if(priority === 'urgent') classes.push('urgent');
    const author = a.author_name || a.author_email || 'MFR Team';
    const image = a.image_url ? '<img class="ann-card-img" src="'+annEsc(a.image_url)+'" alt="Announcement image" loading="lazy">' : '';
    const cta = a.cta_url ? '<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="'+annEsc(a.cta_url)+'">'+annEsc(a.cta_text || 'Open Link')+'</a>' : '';
    const expires = a.expires_at ? '<span>Expires '+annDate(a.expires_at)+'</span>' : '';
    const admin = canAdmin() ? '<div class="ann-action-right">'
      + '<button class="btn btn-outline btn-sm" onclick="editAnnouncementModal(\''+annEsc(a.id)+'\')">Edit</button>'
      + '<button class="btn btn-outline btn-sm" onclick="toggleAnnouncementPinned(\''+annEsc(a.id)+'\','+(!a.is_pinned)+')">'+(a.is_pinned?'Unpin':'Pin')+'</button>'
      + '<button class="btn btn-outline btn-sm" onclick="archiveAnnouncement(\''+annEsc(a.id)+'\')">Archive</button>'
      + '</div>' : '';
    return '<article class="'+classes.join(' ')+'">'+image+'<div class="ann-card-inner">'
      + '<div class="ann-card-head"><div><h3 class="ann-title">'+annEsc(a.title)+'</h3><div class="ann-meta">'
      + (a.is_pinned ? '<span class="ann-badge pin">Pinned</span>' : '') + annPriorityBadge(priority)
      + '<span>'+annEsc(author)+'</span><span>·</span><span>'+annTime(a.created_at)+'</span>'
      + '<span>Audience: '+annEsc(a.audience || 'team')+'</span>'+expires+'</div></div></div>'
      + '<div class="ann-body">'+annEsc(a.body || '')+'</div>'
      + '<div class="ann-card-actions"><div class="ann-action-left">'+cta+'</div>'+admin+'</div>'
      + '</div></article>';
  }

  window._mfrAnnouncementsCache = window._mfrAnnouncementsCache || [];

  window.renderAnnouncementsList = function(){
    const body = document.getElementById('ann-body');
    if(!body) return;
    const list = filterAnnouncements(window._mfrAnnouncementsCache || []);
    if(!list.length){
      body.innerHTML = '<div class="ann-empty"><div class="icon">📢</div><h3>No Announcements Match</h3><p>Post a new team update or clear your filters.</p></div>';
      return;
    }
    body.innerHTML = '<div class="ann-pro-grid">'+list.map(renderCard).join('')+'</div>';
  };

  window.pageAnnouncements = async function(c){
    c.innerHTML = '<div class="page-wrap">'
      + '<div class="page-hd"><div><div class="page-title">Message Board</div><div class="page-sub">Team announcements, pinned updates, uploaded images, and links.</div></div>'
      + (canAdmin()?'<button class="btn btn-primary" onclick="postAnnouncementModal()">+ Post Announcement</button>':'')
      + '</div>'
      + '<section class="ann-pro-hero"><h2>Team Message Board</h2><p>Use this for owner/GM updates, schedule changes, jobsite notes, storm alerts, training links, and company reminders. Upload an image directly when a visual helps.</p></section>'
      + '<div class="ann-pro-toolbar"><input class="fi" id="ann-search" placeholder="Search announcements..." oninput="renderAnnouncementsList()">'
      + '<select class="fs" id="ann-filter" onchange="renderAnnouncementsList()"><option value="active">Active</option><option value="pinned">Pinned</option><option value="urgent">Urgent</option><option value="expired">Expired</option><option value="all">All</option></select></div>'
      + '<div id="ann-body"><div class="ann-empty"><div class="icon">📢</div><h3>Loading Announcements</h3><p>Checking team updates...</p></div></div>'
      + '</div>';
    try{
      let res = await _sb.from('announcements').select('*').order('is_pinned',{ascending:false}).order('created_at',{ascending:false}).limit(80);
      if(res.error) throw res.error;
      window._mfrAnnouncementsCache = res.data || [];
      renderAnnouncementsList();
    }catch(e){
      const body = document.getElementById('ann-body');
      if(body) body.innerHTML = '<div class="ann-empty"><div class="icon">⚠️</div><h3>Could Not Load Announcements</h3><p>'+annEsc(e.message || e)+'</p></div>';
    }
  };

  function modalHtml(a){
    const editing = !!(a && a.id);
    const expires = a && a.expires_at ? String(a.expires_at).slice(0,10) : '';
    const hasImage = !!(a && a.image_url);
    return '<div class="modal-sheet" style="max-width:820px"><div class="modal-drag"></div>'
      + '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px"><div>'
      + '<div style="font-size:22px;font-weight:950;color:var(--navy)">'+(editing?'Edit Announcement':'Post Announcement')+'</div>'
      + '<div style="font-size:13px;color:var(--text2);margin-top:3px">Create a clean team update with priority, pinning, images, and optional link buttons.</div>'
      + '</div><button class="btn btn-outline btn-sm" onclick="closeAnnouncementModal()">Cancel</button></div>'
      + '<div class="ann-modal-grid">'
      + '<div class="full"><label class="fl">Title</label><input class="fi" id="ann-title" maxlength="140" value="'+annEsc(a?.title || '')+'" placeholder="Example: Production meeting Friday"></div>'
      + '<div class="full"><label class="fl">Message</label><textarea class="fi" id="ann-body-input" rows="5" placeholder="Write your announcement...">'+annEsc(a?.body || '')+'</textarea></div>'
      + '<div><label class="fl">Priority</label><select class="fs" id="ann-priority">'
      + '<option value="normal" '+((a?.priority||'normal')==='normal'?'selected':'')+'>Normal</option>'
      + '<option value="important" '+(a?.priority==='important'?'selected':'')+'>Important</option>'
      + '<option value="urgent" '+(a?.priority==='urgent'?'selected':'')+'>Urgent</option>'
      + '</select></div>'
      + '<div><label class="fl">Audience</label><select class="fs" id="ann-audience">'
      + '<option value="team" '+((a?.audience||'team')==='team'?'selected':'')+'>Whole Team</option>'
      + '<option value="sales" '+(a?.audience==='sales'?'selected':'')+'>Sales</option>'
      + '<option value="production" '+(a?.audience==='production'?'selected':'')+'>Production</option>'
      + '<option value="admin" '+(a?.audience==='admin'?'selected':'')+'>Admin</option>'
      + '</select></div>'
      + '<div class="full"><label class="fl">Image</label><div class="ann-image-picker">'
      + '<input class="fi" type="file" id="ann-image-file" accept="image/png,image/jpeg,image/webp,image/gif" onchange="previewAnnouncementImage(this)">'
      + '<div class="ann-upload-note">Upload an image from your computer or phone. No image link needed. JPG, PNG, WEBP, or GIF up to 10MB.</div>'
      + '<div id="ann-image-preview" class="ann-image-preview '+(hasImage?'show':'')+'">'+(hasImage?'<img src="'+annEsc(a.image_url)+'" alt="Current announcement image">':'')+'</div>'
      + (hasImage?'<label class="ann-remove-row"><input type="checkbox" id="ann-remove-image"> Remove current image</label>':'')
      + '</div></div>'
      + '<div><label class="fl">Button Text</label><input class="fi" id="ann-cta-text" value="'+annEsc(a?.cta_text || '')+'" placeholder="Open Link"></div>'
      + '<div><label class="fl">Button URL</label><input class="fi" id="ann-cta-url" value="'+annEsc(a?.cta_url || '')+'" placeholder="https://..."></div>'
      + '<div><label class="fl">Expires On</label><input class="fi" type="date" id="ann-expires" value="'+annEsc(expires)+'"></div>'
      + '<div><label class="fl">Options</label><div class="ann-modal-checks"><label><input type="checkbox" id="ann-pinned" '+(a?.is_pinned?'checked':'')+'> Pin to top</label></div></div>'
      + '</div>'
      + '<div id="ann-modal-err" class="login-err" style="margin-top:12px"></div>'
      + '<div style="display:flex;gap:8px;margin-top:16px;justify-content:space-between;flex-wrap:wrap">'
      + (editing?'<button class="btn btn-outline" onclick="deleteAnnouncement(\''+annEsc(a.id)+'\')">Delete</button>':'<span></span>')
      + '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-outline" onclick="closeAnnouncementModal()">Close</button><button class="btn btn-primary" id="ann-submit-btn" onclick="submitAnnouncement()">'+(editing?'Save Changes':'📢 Post Announcement')+'</button></div>'
      + '</div></div>';
  }

  window.postAnnouncementModal = function(){
    if(!canAdmin()){ if(typeof toast === 'function') toast('Admin access required','warn'); return; }
    window.openAnnouncementEditor(null);
  };

  window.editAnnouncementModal = async function(id){
    if(!canAdmin()){ if(typeof toast === 'function') toast('Admin access required','warn'); return; }
    let a = (window._mfrAnnouncementsCache || []).find(function(x){ return String(x.id) === String(id); });
    if(!a){
      try{
        const res = await _sb.from('announcements').select('*').eq('id', id).single();
        if(res.error) throw res.error;
        a = res.data;
      }catch(e){
        if(typeof toast === 'function') toast('Could not load announcement: '+(e.message || e), 'error');
        return;
      }
    }
    window.openAnnouncementEditor(a);
  };

  window.openAnnouncementEditor = function(a){
    document.getElementById('announcement-modal')?.remove();
    window._mfrAnnouncementEditing = a || null;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'announcement-modal';
    modal.innerHTML = modalHtml(a || {});
    modal.addEventListener('click', function(e){ if(e.target.id === 'announcement-modal') closeAnnouncementModal(); });
    document.body.appendChild(modal);
    setTimeout(function(){ document.getElementById('ann-title')?.focus(); }, 50);
  };

  window.closeAnnouncementModal = function(){
    document.getElementById('announcement-modal')?.remove();
    window._mfrAnnouncementEditing = null;
  };

  window.previewAnnouncementImage = function(input){
    const file = input && input.files && input.files[0];
    const box = document.getElementById('ann-image-preview');
    if(!box) return;
    if(!file){ box.classList.remove('show'); box.innerHTML=''; return; }
    const url = URL.createObjectURL(file);
    box.classList.add('show');
    box.innerHTML = '<img src="'+url+'" alt="Selected announcement image">';
    const rm = document.getElementById('ann-remove-image');
    if(rm) rm.checked = false;
  };

  async function uploadImageIfNeeded(){
    const fileInput = document.getElementById('ann-image-file');
    const file = fileInput && fileInput.files && fileInput.files[0];
    if(!file) return null;
    if(!/^image\/(png|jpe?g|webp|gif)$/i.test(file.type || '')){
      throw new Error('Please upload a JPG, PNG, WEBP, or GIF image.');
    }
    if(file.size > 10 * 1024 * 1024){
      throw new Error('Image must be smaller than 10MB.');
    }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g,'') || 'jpg';
    const uid = (_user && _user.id) ? _user.id : 'team';
    const path = uid + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext;
    const up = await _sb.storage.from(ANN_BUCKET).upload(path, file, { cacheControl:'3600', upsert:false, contentType:file.type || 'image/jpeg' });
    if(up.error) {
      if(String(up.error.message || '').toLowerCase().includes('bucket')) {
        throw new Error('Announcement image bucket is missing. Run the Announcements Edit/Upload SQL first.');
      }
      throw up.error;
    }
    const pub = _sb.storage.from(ANN_BUCKET).getPublicUrl(path);
    return { url: pub && pub.data ? pub.data.publicUrl : null, path: path };
  }

  window.submitAnnouncement = async function(){
    const editing = window._mfrAnnouncementEditing || null;
    const title = document.getElementById('ann-title')?.value.trim();
    const body = document.getElementById('ann-body-input')?.value.trim();
    const err = document.getElementById('ann-modal-err');
    const btn = document.getElementById('ann-submit-btn');
    if(err) err.classList.remove('show');
    if(!title || !body){
      if(err){ err.textContent = 'Add a title and message first.'; err.classList.add('show'); }
      return;
    }
    try{
      if(btn){ btn.disabled = true; btn.textContent = editing ? 'Saving...' : 'Posting...'; }
      const payload = {
        title: title,
        body: body,
        author_email: currentAuthorEmail(),
        author_name: currentAuthorName(),
        priority: document.getElementById('ann-priority')?.value || 'normal',
        audience: document.getElementById('ann-audience')?.value || 'team',
        cta_text: document.getElementById('ann-cta-text')?.value.trim() || null,
        cta_url: document.getElementById('ann-cta-url')?.value.trim() || null,
        expires_at: document.getElementById('ann-expires')?.value || null,
        is_pinned: !!document.getElementById('ann-pinned')?.checked,
        updated_at: new Date().toISOString()
      };
      if(!editing) payload.created_by = (_user && _user.id) ? _user.id : null;

      const removeImage = !!document.getElementById('ann-remove-image')?.checked;
      const uploaded = await uploadImageIfNeeded();
      if(uploaded){
        payload.image_url = uploaded.url;
        payload.image_path = uploaded.path;
      } else if(removeImage) {
        payload.image_url = null;
        payload.image_path = null;
      }

      let res;
      if(editing && editing.id){
        res = await _sb.from('announcements').update(payload).eq('id', editing.id);
      } else {
        res = await _sb.from('announcements').insert(payload);
      }
      if(res.error) throw res.error;

      closeAnnouncementModal();
      if(typeof toast === 'function') toast(editing ? 'Announcement updated' : 'Announcement posted','ok');
      await pageAnnouncements(document.getElementById('content'));
    }catch(e){
      if(err){ err.textContent = e.message || 'Unable to save announcement.'; err.classList.add('show'); }
      else if(typeof toast === 'function') toast('Unable to save announcement','error');
    }finally{
      if(btn){ btn.disabled = false; btn.textContent = editing ? 'Save Changes' : '📢 Post Announcement'; }
    }
  };

  window.toggleAnnouncementPinned = async function(id, pinned){
    try{
      const res = await _sb.from('announcements').update({is_pinned: pinned, updated_at: new Date().toISOString()}).eq('id', id);
      if(res.error) throw res.error;
      if(typeof toast === 'function') toast(pinned ? 'Announcement pinned' : 'Announcement unpinned','ok');
      await pageAnnouncements(document.getElementById('content'));
    }catch(e){
      if(typeof toast === 'function') toast('Could not update announcement: '+(e.message || e),'error');
    }
  };

  window.archiveAnnouncement = async function(id){
    if(!confirm('Archive this announcement?')) return;
    try{
      const res = await _sb.from('announcements').update({expires_at: new Date().toISOString(), updated_at: new Date().toISOString()}).eq('id', id);
      if(res.error) throw res.error;
      if(typeof toast === 'function') toast('Announcement archived','ok');
      await pageAnnouncements(document.getElementById('content'));
    }catch(e){
      if(typeof toast === 'function') toast('Could not archive announcement: '+(e.message || e),'error');
    }
  };

  window.deleteAnnouncement = async function(id){
    if(!confirm('Delete this announcement permanently?')) return;
    try{
      const res = await _sb.from('announcements').delete().eq('id', id);
      if(res.error) throw res.error;
      closeAnnouncementModal();
      if(typeof toast === 'function') toast('Announcement deleted','ok');
      await pageAnnouncements(document.getElementById('content'));
    }catch(e){
      if(typeof toast === 'function') toast('Could not delete announcement: '+(e.message || e),'error');
    }
  };
})();
