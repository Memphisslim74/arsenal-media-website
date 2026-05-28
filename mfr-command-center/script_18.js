
(function(){
  if(window.__mfrCustomerCrmV1Loaded) return;
  window.__mfrCustomerCrmV1Loaded = true;
  const crmState = { customers: [], selected: null, page: 1, limit: 50 };
  const money = v => '$' + Number(v || 0).toLocaleString();
  const esc = v => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const date = v => v ? new Date(v).toLocaleDateString() : '—';
  const datetime = v => v ? new Date(v).toLocaleString() : '—';
  const toastSafe = (m,t='success') => { if(typeof toast === 'function') toast(m,t); else console.log(t,m); };
  function nameOf(c){ return c?.name || [c?.first_name,c?.last_name].filter(Boolean).join(' ') || c?.full_name || 'Unknown Customer'; }
  function tagsOf(c){ return Array.isArray(c?.tags) ? c.tags : (typeof c?.tags === 'string' ? c.tags.split(',').map(x=>x.trim()).filter(Boolean) : []); }
  function statusBadge(c){ const tags=tagsOf(c); if(c?.is_archived) return '<span class="badge badge-gray">Archived</span>'; if(c?.priority==='hot'||c?.status==='hot_lead') return '<span class="badge badge-red">Hot Lead</span>'; if(c?.follow_up_at||tags.includes('Needs Follow-Up')) return '<span class="badge badge-orange">Needs Follow-Up</span>'; if(tags.includes('Insurance Claim')||c?.claim_number) return '<span class="badge badge-blue">Insurance Claim</span>'; return '<span class="badge badge-green">Active</span>'; }
  function totalValue(c){ return (c.jobs||[]).reduce((s,j)=>s+Number(j.contract_value||j.amount||j.estimate_total||0),0); }
  function activeJob(c){ return (c.jobs||[]).find(j=>j.customer_tracking_code) || (c.jobs||[])[0] || null; }
  function customerBasePath(){ const path = location.pathname.replace(/index\.html$/,''); return location.origin + (path.endsWith('/') ? path : path + '/'); }
  function trackerCode(job){ return job?.customer_tracking_code || job?.tracking_code || ''; }
  function quoteCode(job){ return job?.quote_code || job?.customer_tracking_code || ''; }
  function trackerUrl(job){ const code = trackerCode(job); return code ? customerBasePath() + 'track.html?code=' + encodeURIComponent(code) : ''; }
  function quoteUrl(job){ const code = quoteCode(job); return code ? customerBasePath() + 'quote.html?code=' + encodeURIComponent(code) : ''; }
  function customerPortalActions(job, size){
    const t = trackerUrl(job); const q = quoteUrl(job); const sm = size === 'sm' ? ' btn-sm' : '';
    let out = '';
    if(t) out += '<button class="btn'+sm+' btn-primary" onclick="mfrCopyText(\''+esc(t)+'\')">Copy Tracker</button><button class="btn'+sm+' btn-outline" onclick="window.open(\''+esc(t)+'\',\'_blank\')">Open Tracker</button>';
    if(q) out += '<button class="btn'+sm+' btn-outline" onclick="mfrCopyText(\''+esc(q)+'\')">Copy Quote</button><button class="btn'+sm+' btn-outline" onclick="window.open(\''+esc(q)+'\',\'_blank\')">Open Quote</button>';
    if(!out) out = '<button class="btn'+sm+' btn-outline" onclick="mfrEstimateForCustomer(\''+(job?.customer_id ? esc(job.customer_id) : '')+'\')">Generate Link</button>';
    return out;
  }
  function customerPortalSummary(c){ const job = activeJob(c); return job ? customerPortalActions(job, 'sm') : '<button class="btn btn-sm btn-outline" onclick="mfrCreateJobForCustomer(\''+esc(c.id)+'\')">Create Job</button>'; }
  async function safe(query, fallback){ try{ const r = await query; if(r.error) throw r.error; return r.data ?? fallback; } catch(e){ console.warn('Customer CRM query skipped:', e); return fallback; } }
  async function loadJobsForCustomers(customers){
    const ids = [...new Set((customers||[]).map(c=>c.id).filter(Boolean))];
    if(!ids.length) return customers;
    const jobs = await safe(_sb.from('jobs').select('*').in('customer_id', ids).order('created_at',{ascending:false}), []);
    const by = new Map();
    (jobs||[]).forEach(j=>{ const arr = by.get(j.customer_id)||[]; arr.push(j); by.set(j.customer_id,arr); });
    return customers.map(c=>({...c,jobs:by.get(c.id)||[]}));
  }
  async function loadAppointmentsForCustomer(id){ return await safe(_sb.from('appointments').select('*').eq('customer_id',id).order('start_time',{ascending:false}), []); }
  async function loadNotesForCustomer(id){ return await safe(_sb.from('customer_notes').select('*').eq('customer_id',id).order('created_at',{ascending:false}), []); }
  async function loadCommsForCustomer(id){ return await safe(_sb.from('customer_communications').select('*').eq('customer_id',id).order('created_at',{ascending:false}), []); }
  async function loadDocsForCustomer(id){ return await safe(_sb.from('customer_documents').select('*').eq('customer_id',id).order('created_at',{ascending:false}), []); }

  window.pageCustomers = async function(c){
    c.innerHTML = '<div class="page-wrap customer-crm-page">'
      + '<div class="customer-crm-hero"><div><div class="customer-crm-kicker">Roofing CRM</div><h1 class="customer-crm-title">Customer Command Center</h1><p class="customer-crm-sub">Manage homeowners, insurance claims, property details, job history, follow-ups, appointments, and customer portal links from one clean page.</p></div><div class="customer-crm-actions"><button class="btn btn-primary" onclick="mfrOpenCustomerForm()">+ Add Customer</button><button class="btn btn-outline" style="background:#fff" onclick="mfrCustomerExport()">Export</button><button class="btn btn-outline" style="background:#fff" onclick="mfrShowNeedsFollowUp()">Needs Follow-Up</button></div></div>'
      + '<div class="customer-crm-stats"><div class="customer-crm-stat"><span>Active Customers</span><strong id="cust-stat-active">0</strong></div><div class="customer-crm-stat orange"><span>Needs Follow-Up</span><strong id="cust-stat-followup">0</strong></div><div class="customer-crm-stat green"><span>Claim Customers</span><strong id="cust-stat-claims">0</strong></div><div class="customer-crm-stat purple"><span>Total Value</span><strong id="cust-stat-value">$0</strong></div></div>'
      + '<div class="customer-crm-card" style="padding:14px;margin-bottom:16px"><div class="customer-crm-filters"><input class="fi" id="cust-search" placeholder="Search name, phone, email, address..." oninput="mfrLoadCustomers()"><select class="fs" id="cust-status-filter" onchange="mfrLoadCustomers()"><option value="">All Customers</option><option value="active">Active</option><option value="hot_lead">Hot Leads</option><option value="needs_followup">Needs Follow-Up</option><option value="archived">Archived</option></select><select class="fs" id="cust-channel-filter" onchange="mfrLoadCustomers()"><option value="">All Sources</option><option>Google Ads</option><option>Facebook</option><option>Referral</option><option>Door Knocking</option><option>Website</option><option>Repeat Customer</option></select><select class="fs" id="cust-sort" onchange="mfrLoadCustomers()"><option value="recent">Recently Added</option><option value="last_contact">Last Contact</option><option value="value">Highest Value</option><option value="name">Name A-Z</option></select></div></div>'
      + '<div class="customer-crm-card"><div class="customer-crm-table-wrap"><table class="tbl customer-crm-table"><thead><tr><th>Name</th><th>Address</th><th>Phone</th><th>Email</th><th>Jobs</th><th>Total Value</th><th>Last Contact</th><th>Status</th><th>Portal</th><th></th></tr></thead><tbody id="customers-table-body"><tr><td colspan="10"><div class="customer-empty-pad">Loading customers...</div></td></tr></tbody></table></div><div id="customers-mobile-list" class="customer-crm-mobile-list"><div class="customer-empty-pad">Loading customers...</div></div></div>'
      + '</div>';
    await window.mfrLoadCustomers();
  };

  window.mfrLoadCustomers = async function(){
    const search = (document.getElementById('cust-search')?.value || '').toLowerCase().trim();
    const status = document.getElementById('cust-status-filter')?.value || '';
    const channel = document.getElementById('cust-channel-filter')?.value || '';
    const sort = document.getElementById('cust-sort')?.value || 'recent';
    let q = _sb.from('customers').select('*');
    if(status==='archived') q = q.eq('is_archived', true); else q = q.or('is_archived.is.null,is_archived.eq.false');
    if(channel) q = q.eq('marketing_source', channel);
    if(sort==='name') q = q.order('last_name',{ascending:true}); else if(sort==='last_contact') q = q.order('last_contact_at',{ascending:false, nullsFirst:false}); else q = q.order('created_at',{ascending:false});
    let customers = await safe(q.limit(crmState.limit), []);
    customers = await loadJobsForCustomers(customers||[]);
    if(search){ customers = customers.filter(c => [nameOf(c),c.first_name,c.last_name,c.phone,c.email,c.address,c.city,c.state,c.zip,c.marketing_source,c.claim_number,c.insurance_company].join(' ').toLowerCase().includes(search)); }
    if(status==='hot_lead') customers = customers.filter(c=>c.priority==='hot'||c.status==='hot_lead');
    if(status==='needs_followup') customers = customers.filter(c=>c.follow_up_at || tagsOf(c).includes('Needs Follow-Up'));
    if(sort==='value') customers = customers.sort((a,b)=>totalValue(b)-totalValue(a));
    crmState.customers = customers;
    renderStats(customers); renderTable(customers); renderCards(customers);
  };
  function renderStats(customers){
    const active = customers.filter(c=>!c.is_archived).length;
    const follow = customers.filter(c=>c.follow_up_at || tagsOf(c).includes('Needs Follow-Up')).length;
    const claims = customers.filter(c=>c.claim_number || c.insurance_company || tagsOf(c).includes('Insurance Claim')).length;
    const value = customers.reduce((s,c)=>s+totalValue(c),0);
    const set=(id,val)=>{ const el=document.getElementById(id); if(el) el.textContent=val; };
    set('cust-stat-active', active); set('cust-stat-followup', follow); set('cust-stat-claims', claims); set('cust-stat-value', money(value));
  }
  function renderTable(customers){
    const body=document.getElementById('customers-table-body'); if(!body) return;
    if(!customers.length){ body.innerHTML='<tr><td colspan="10"><div class="customer-empty-pad"><strong>No customers found</strong><br>Add a customer or adjust your filters.</div></td></tr>'; return; }
    body.innerHTML = customers.map(c=>{
      const job = activeJob(c);
      return '<tr><td><strong>'+esc(nameOf(c))+'</strong><div style="margin-top:4px">'+(c.priority==='hot'?'<span class="badge badge-red">Hot</span>':'')+'</div></td><td>'+esc(c.address||'—')+'</td><td>'+(c.phone?'<a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a>':'—')+'</td><td>'+(c.email?'<span class="muted-email">'+esc(c.email)+'</span>':'—')+'</td><td>'+(c.jobs||[]).length+'</td><td><strong>'+money(totalValue(c))+'</strong></td><td>'+date(c.last_contact_at||c.created_at)+'</td><td>'+statusBadge(c)+'</td><td><div class="customer-portal-inline">'+customerPortalSummary(c)+'</div></td><td><div style="display:flex;gap:6px;flex-wrap:wrap">'+(c.email?'<button class="btn btn-sm btn-primary" onclick="composeEmail(\''+esc(c.id)+'\')">Send Email</button>':'')+'<button class="btn btn-sm btn-outline" onclick="mfrOpenCustomerDetail(\''+esc(c.id)+'\')">View</button></div></td></tr>';
    }).join('');
  }
  function renderCards(customers){
    const wrap=document.getElementById('customers-mobile-list'); if(!wrap) return;
    if(!customers.length){ wrap.innerHTML='<div class="customer-empty-pad"><strong>No customers found</strong><br>Add a customer or adjust your filters.</div>'; return; }
    wrap.innerHTML = customers.map(c=>{
      const job=activeJob(c); const tags=tagsOf(c);
      return '<div class="customer-mobile-card"><div class="cmc-top"><div><div class="cmc-name">'+esc(nameOf(c))+'</div><div class="cmc-sub">'+esc(c.address||'No address')+'</div></div>'+statusBadge(c)+'</div><div class="cmc-meta"><div><strong>'+(c.jobs||[]).length+'</strong><span>Jobs</span></div><div><strong>'+money(totalValue(c))+'</strong><span>Total</span></div><div><strong>'+date(c.last_contact_at||c.created_at)+'</strong><span>Last Contact</span></div></div>'+(tags.length?'<div class="cmc-tags">'+tags.map(t=>'<span class="cmc-tag">'+esc(t)+'</span>').join('')+'</div>':'')+'<div class="cmc-actions"><button class="btn btn-primary" onclick="mfrOpenCustomerDetail(\''+esc(c.id)+'\')">View Details</button>'+(c.phone?'<a class="btn btn-outline" href="tel:'+esc(c.phone)+'">Call</a><a class="btn btn-outline" href="sms:'+esc(c.phone)+'">Text</a>':'')+(c.email?'<button class="btn btn-primary" onclick="composeEmail(\''+esc(c.id)+'\')">Send Email</button><a class="btn btn-outline" href="mailto:'+esc(c.email)+'">Open Email App</a>':'')+'<button class="btn btn-outline" onclick="mfrScheduleForCustomer(\''+esc(c.id)+'\')">Schedule</button><button class="btn btn-outline" onclick="mfrCreateJobForCustomer(\''+esc(c.id)+'\')">New Job</button>'+(job?customerPortalActions(job):'<button class="btn btn-outline" onclick="mfrEstimateForCustomer(\''+esc(c.id)+'\')">Generate Quote</button>')+'</div></div>';
    }).join('');
  }

  window.mfrOpenCustomerDetail = async function(id){
    let c = await safe(_sb.from('customers').select('*').eq('id',id).single(), null); if(!c){ toastSafe('Could not load customer','error'); return; }
    c.jobs = (await loadJobsForCustomers([c]))[0].jobs || [];
    c.appointments = await loadAppointmentsForCustomer(id); c.notes = await loadNotesForCustomer(id); c.communications = await loadCommsForCustomer(id); c.documents = await loadDocsForCustomer(id);
    crmState.selected = c;
    const job = activeJob(c);
    const portalBlock = job ? '<div class="customer-portal-box"><div><strong>Customer Tracker & Quote Links</strong><p>Copy or open the customer-facing project tracker and quote from this customer record.</p></div><div class="customer-portal-actions">'+customerPortalActions(job)+'</div></div>' : '<div class="customer-portal-box"><div><strong>No customer-facing link yet</strong><p>Create a job or generate an estimate to create tracker and quote links.</p></div><div class="customer-portal-actions"><button class="btn btn-outline" onclick="mfrCreateJobForCustomer(\''+esc(c.id)+'\')">Create Job</button><button class="btn btn-primary" onclick="mfrEstimateForCustomer(\''+esc(c.id)+'\')">Generate Quote</button></div></div>';
    const old=document.querySelector('.customer-detail-overlay'); if(old) old.remove();
    const modal=document.createElement('div'); modal.className='modal-overlay customer-detail-overlay';
    modal.innerHTML='<div class="modal-sheet customer-detail-sheet"><div class="modal-drag"></div><div class="customer-detail-header"><div><h2>'+esc(nameOf(c))+'</h2><p>'+esc(c.address||'No address')+'</p></div><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div><div class="customer-quick-stats"><div><strong>'+money(totalValue(c))+'</strong><span>Total Value</span></div><div><strong>'+(c.jobs||[]).length+'</strong><span>Jobs</span></div><div><strong>'+date(c.customer_since||c.created_at)+'</strong><span>Customer Since</span></div><div><strong>'+date(c.last_contact_at||c.created_at)+'</strong><span>Last Contact</span></div></div>'+portalBlock+'<div class="customer-modal-actions">'+(c.phone?'<a class="btn btn-primary" href="tel:'+esc(c.phone)+'">Call</a><a class="btn btn-outline" href="sms:'+esc(c.phone)+'">Text</a>':'')+(c.email?'<button class="btn btn-primary" onclick="composeEmail(\''+esc(c.id)+'\')">✉️ Send Email</button><a class="btn btn-outline" href="mailto:'+esc(c.email)+'">Open Email App</a>':'')+'<button class="btn btn-outline" onclick="mfrScheduleForCustomer(\''+esc(c.id)+'\')">Schedule</button><button class="btn btn-outline" onclick="mfrCreateJobForCustomer(\''+esc(c.id)+'\')">New Job</button><button class="btn btn-outline" onclick="mfrAddCustomerNote(\''+esc(c.id)+'\')">Add Note</button></div><div class="customer-tabs"><button class="active" onclick="mfrCustomerTab(\'basic\',this)">Basic Info</button><button onclick="mfrCustomerTab(\'jobs\',this)">Jobs</button><button onclick="mfrCustomerTab(\'communications\',this)">Communications</button><button onclick="mfrCustomerTab(\'documents\',this)">Documents</button><button onclick="mfrCustomerTab(\'appointments\',this)">Appointments</button></div><div id="customer-tab-content"></div></div>';
    document.body.appendChild(modal); renderBasic(c);
  };
  window.mfrCustomerTab = function(tab,btn){ document.querySelectorAll('.customer-tabs button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); const c=crmState.selected; if(!c)return; if(tab==='basic') renderBasic(c); if(tab==='jobs') renderJobs(c); if(tab==='communications') renderComms(c); if(tab==='documents') renderDocs(c); if(tab==='appointments') renderAppts(c); };
  function renderBasic(c){ document.getElementById('customer-tab-content').innerHTML='<div class="customer-detail-grid"><div class="detail-card"><h3>Contact Info</h3><p><strong>Phone:</strong> '+esc(c.phone||'—')+'</p><p><strong>Email:</strong> '+esc(c.email||'—')+'</p><p><strong>Address:</strong> '+esc(c.address||'—')+'</p>'+(c.address?'<p><a target="_blank" href="https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(c.address)+'">Open in Google Maps</a></p>':'')+'</div><div class="detail-card"><h3>Property Info</h3><p><strong>Roof Type:</strong> '+esc(c.property_roof_type||'—')+'</p><p><strong>Roof Size:</strong> '+esc(c.property_roof_size||'—')+'</p><p><strong>Roof Age:</strong> '+esc(c.property_roof_age||'—')+'</p><p><strong>HOA Restrictions:</strong> '+esc(c.hoa_restrictions||'—')+'</p></div><div class="detail-card"><h3>Claim Info</h3><p><strong>Insurance Company:</strong> '+esc(c.insurance_company||'—')+'</p><p><strong>Claim Number:</strong> '+esc(c.claim_number||'—')+'</p><p><strong>Competitor Quotes:</strong> '+esc(c.competitor_quotes||'—')+'</p></div><div class="detail-card"><h3>Sales Info</h3><p><strong>Marketing Source:</strong> '+esc(c.marketing_source||'—')+'</p><p><strong>Referral Source:</strong> '+esc(c.referral_source||'—')+'</p><p><strong>Priority:</strong> '+esc(c.priority||'normal')+'</p><p><strong>Tags:</strong> '+(tagsOf(c).map(esc).join(', ')||'—')+'</p></div></div>'; }
  function renderJobs(c){
    const jobs=c.jobs||[];
    document.getElementById('customer-tab-content').innerHTML='<div class="tab-actions"><button class="btn btn-primary" onclick="mfrCreateJobForCustomer(\''+esc(c.id)+'\')">+ Create Job</button><button class="btn btn-outline" onclick="mfrEstimateForCustomer(\''+esc(c.id)+'\')">Generate Estimate</button></div><div class="job-history-list">'+(jobs.length?jobs.map(j=>'<div class="job-history-card"><div><strong>'+esc(j.address||c.address||'Roofing Job')+'</strong><p>'+esc(j.status||'lead')+' · '+date(j.created_at)+'</p><div class="customer-job-portal-actions">'+customerPortalActions(j,'sm')+'</div></div><div><strong>'+money(j.contract_value||j.amount||j.estimate_total)+'</strong><br><button class="btn btn-sm btn-outline" onclick="'+(typeof showJobModal==='function'?'showJobModal':'mfrOpenJobFallback')+'(\''+esc(j.id)+'\')">Open</button></div></div>').join(''):'<div class="customer-empty-pad">No jobs yet. Create a job when the inspection or estimate starts.</div>')+'</div>';
  }
  function renderComms(c){ const feed=[...(c.notes||[]).map(n=>({type:n.note_type||'note',body:n.note,created_at:n.created_at})),...(c.communications||[]).map(m=>({type:m.type||'message',body:m.body||m.subject,created_at:m.created_at}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)); document.getElementById('customer-tab-content').innerHTML='<div class="tab-actions"><button class="btn btn-primary" onclick="mfrAddCustomerNote(\''+esc(c.id)+'\')">+ Add Note</button><button class="btn btn-outline" onclick="mfrLogCustomerCommunication(\''+esc(c.id)+'\',\'call\')">Log Call</button><button class="btn btn-outline" onclick="mfrLogCustomerCommunication(\''+esc(c.id)+'\',\'text\')">Log Text</button></div><div class="communication-feed">'+(feed.length?feed.map(f=>'<div class="feed-item"><div class="feed-type">'+esc(f.type)+'</div><div class="feed-body">'+esc(f.body||'')+'</div><div class="feed-date">'+datetime(f.created_at)+'</div></div>').join(''):'<div class="customer-empty-pad">No communication yet.</div>')+'</div>'; }
  function renderDocs(c){ const docs=c.documents||[]; document.getElementById('customer-tab-content').innerHTML='<div class="tab-actions"><button class="btn btn-outline" onclick="toast(\'Document uploads can connect to Supabase Storage next.\',\'info\')">Upload Document</button></div><div class="document-list">'+(docs.length?docs.map(d=>'<div class="doc-row"><div><strong>'+esc(d.title||'Document')+'</strong><p>'+esc(d.document_type||'file')+' · '+date(d.created_at)+'</p></div>'+(d.file_url?'<a class="btn btn-sm btn-outline" target="_blank" href="'+esc(d.file_url)+'">Open</a>':'')+'</div>').join(''):'<div class="customer-empty-pad">Contracts, estimates, photos, and reports will show here.</div>')+'</div>'; }
  function renderAppts(c){ const appts=c.appointments||[]; document.getElementById('customer-tab-content').innerHTML='<div class="tab-actions"><button class="btn btn-primary" onclick="mfrScheduleForCustomer(\''+esc(c.id)+'\')">+ Schedule Appointment</button></div><div class="appointment-list">'+(appts.length?appts.map(a=>'<div class="appt-row"><div><strong>'+datetime(a.start_time||a.appointment_date)+'</strong><p>'+esc(a.type||'Appointment')+' · '+esc(a.status||'scheduled')+'</p></div></div>').join(''):'<div class="customer-empty-pad">No appointments yet.</div>')+'</div>'; }

  window.mfrOpenCustomerForm = function(customer={}){ const modal=document.createElement('div'); modal.className='modal-overlay customer-form-overlay'; modal.innerHTML='<div class="modal-sheet customer-form-sheet"><div class="modal-drag"></div><h2 style="font-size:22px;font-weight:900;margin:0 0 14px">'+(customer.id?'Edit Customer':'Add Customer')+'</h2><div class="form-grid"><div class="fg"><label class="fl">First Name</label><input class="fi" id="cf-first" value="'+esc(customer.first_name||'')+'"></div><div class="fg"><label class="fl">Last Name</label><input class="fi" id="cf-last" value="'+esc(customer.last_name||'')+'"></div><div class="fg"><label class="fl">Phone *</label><input class="fi" id="cf-phone" type="tel" onblur="mfrDetectDuplicateCustomer()" value="'+esc(customer.phone||'')+'"></div><div class="fg"><label class="fl">Email</label><input class="fi" id="cf-email" type="email" value="'+esc(customer.email||'')+'"></div><div class="fg fg-full"><label class="fl">Address *</label><input class="fi" id="cf-address" onblur="mfrDetectDuplicateCustomer()" value="'+esc(customer.address||'')+'"></div><div class="fg"><label class="fl">Marketing Source</label><select class="fs" id="cf-source"><option value="">Select...</option><option>Google Ads</option><option>Facebook</option><option>Referral</option><option>Door Knocking</option><option>Website</option><option>Repeat Customer</option></select></div><div class="fg"><label class="fl">Priority</label><select class="fs" id="cf-priority"><option value="normal">Normal</option><option value="hot">Hot Lead</option><option value="low">Low Priority</option></select></div><div class="fg"><label class="fl">Insurance Company</label><input class="fi" id="cf-insurance" value="'+esc(customer.insurance_company||'')+'"></div><div class="fg"><label class="fl">Claim Number</label><input class="fi" id="cf-claim" value="'+esc(customer.claim_number||'')+'"></div><div class="fg"><label class="fl">Roof Type</label><input class="fi" id="cf-roof-type" value="'+esc(customer.property_roof_type||'')+'"></div><div class="fg"><label class="fl">Roof Size</label><input class="fi" id="cf-roof-size" value="'+esc(customer.property_roof_size||'')+'"></div><div class="fg"><label class="fl">Roof Age</label><input class="fi" id="cf-roof-age" value="'+esc(customer.property_roof_age||'')+'"></div><div class="fg"><label class="fl">HOA Restrictions</label><input class="fi" id="cf-hoa" value="'+esc(customer.hoa_restrictions||'')+'"></div><div class="fg fg-full"><label class="fl">Competitor Intel</label><textarea class="fi" id="cf-competitors" rows="2">'+esc(customer.competitor_quotes||'')+'</textarea></div><div class="fg fg-full"><label class="fl">Tags</label><input class="fi" id="cf-tags" placeholder="Needs Follow-Up, Insurance Claim, Repeat Customer" value="'+esc(tagsOf(customer).join(', '))+'"></div></div><div id="duplicate-warning"></div><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary" onclick="mfrSaveCustomer(\''+esc(customer.id||'')+'\')">Save Customer</button><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button></div></div>'; document.body.appendChild(modal); if(customer.marketing_source) document.getElementById('cf-source').value=customer.marketing_source; if(customer.priority) document.getElementById('cf-priority').value=customer.priority; };
  window.mfrSaveCustomer = async function(id=''){ const first=document.getElementById('cf-first').value.trim(), last=document.getElementById('cf-last').value.trim(), phone=document.getElementById('cf-phone').value.trim(), email=document.getElementById('cf-email').value.trim(), address=document.getElementById('cf-address').value.trim(); if(!phone&&!email){toastSafe('Add at least a phone or email','error');return;} if(!address){toastSafe('Address is required for roofing customers','error');return;} const payload={first_name:first,last_name:last,name:([first,last].filter(Boolean).join(' ')||'Unknown Customer'),phone,email,address,marketing_source:document.getElementById('cf-source').value||null,priority:document.getElementById('cf-priority').value||'normal',insurance_company:document.getElementById('cf-insurance').value.trim()||null,claim_number:document.getElementById('cf-claim').value.trim()||null,property_roof_type:document.getElementById('cf-roof-type').value.trim()||null,property_roof_size:document.getElementById('cf-roof-size').value.trim()||null,property_roof_age:document.getElementById('cf-roof-age').value.trim()||null,hoa_restrictions:document.getElementById('cf-hoa').value.trim()||null,competitor_quotes:document.getElementById('cf-competitors').value.trim()||null,tags:document.getElementById('cf-tags').value.split(',').map(t=>t.trim()).filter(Boolean)}; const res = id ? await _sb.from('customers').update(payload).eq('id',id) : await _sb.from('customers').insert(payload); if(res.error){ console.error(res.error); toastSafe('Could not save customer. Run the Customer CRM SQL first if you have not yet.','error'); return; } document.querySelector('.customer-form-overlay')?.remove(); toastSafe('Customer saved'); await window.mfrLoadCustomers(); };
  window.mfrDetectDuplicateCustomer = async function(){ const phone=document.getElementById('cf-phone')?.value.trim(), address=document.getElementById('cf-address')?.value.trim(), warning=document.getElementById('duplicate-warning'); if(!warning||(!phone&&!address))return; let q=_sb.from('customers').select('id,name,first_name,last_name,phone,address').limit(5); if(phone&&address) q=q.or('phone.eq.'+phone+',address.ilike.%'+address+'%'); else if(phone) q=q.eq('phone',phone); else q=q.ilike('address','%'+address+'%'); const data=await safe(q,[]); warning.innerHTML=data?.length?'<div class="duplicate-warning"><strong>Possible duplicate found</strong><p>'+data.map(d=>esc(nameOf(d))+' — '+esc(d.address||d.phone||'')).join('<br>')+'</p></div>':''; };
  window.mfrAddCustomerNote = async function(id){ const note=prompt('Add customer note'); if(!note)return; const res=await _sb.from('customer_notes').insert({customer_id:id,note,note_type:'general',created_by:window.currentUserName||'Team'}); if(res.error){toastSafe('Could not save note. Run the Customer CRM SQL first.','error'); return;} await _sb.from('customers').update({last_contact_at:new Date().toISOString()}).eq('id',id); toastSafe('Note added'); document.querySelector('.customer-detail-overlay')?.remove(); window.mfrOpenCustomerDetail(id); };
  window.mfrLogCustomerCommunication = async function(id,type){ const body=prompt('Log '+type); if(!body)return; const res=await _sb.from('customer_communications').insert({customer_id:id,type,body,direction:'outbound',created_by:window.currentUserName||'Team'}); if(res.error){toastSafe('Could not log communication. Run the Customer CRM SQL first.','error');return;} await _sb.from('customers').update({last_contact_at:new Date().toISOString()}).eq('id',id); toastSafe('Communication logged'); document.querySelector('.customer-detail-overlay')?.remove(); window.mfrOpenCustomerDetail(id); };
  window.mfrScheduleForCustomer = function(id){ window._preselectedAppointmentCustomer=id; if(typeof newApptModal==='function') newApptModal(); else if(typeof go==='function') go('appointments'); };
  window.mfrCreateJobForCustomer = function(id){ window._preselectedJobCustomer=id; if(typeof newJobModal==='function') newJobModal({customerId:id}); else if(typeof go==='function') go('pipeline'); };
  window.mfrEstimateForCustomer = function(id){ window._preselectedEstimateCustomer=id; if(typeof go==='function') go('estimates'); setTimeout(()=>{ const sel=document.getElementById('e-customer-select'); if(sel){sel.value=id; if(typeof selectEstimateCustomer==='function') selectEstimateCustomer();}},350); };
  window.mfrCopyText = function(text){ navigator.clipboard?.writeText(text); toastSafe('Copied'); };
  window.mfrCustomerExport = function(){ const rows=crmState.customers||[]; const csv=['Name,Address,Phone,Email,Jobs,Total Value,Last Contact,Status'].concat(rows.map(c=>'"'+[nameOf(c),c.address||'',c.phone||'',c.email||'',(c.jobs||[]).length,totalValue(c),date(c.last_contact_at||c.created_at),c.priority||c.status||'active'].map(x=>String(x).replaceAll('"','""')).join('","')+'"')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='mfr-customers.csv'; a.click(); };
  window.mfrShowNeedsFollowUp = function(){ const f=document.getElementById('cust-status-filter'); if(f){f.value='needs_followup'; window.mfrLoadCustomers();} };
  window.mfrOpenJobFallback = function(id){ toastSafe('Job detail view unavailable from this build section.','info'); };
})();
// ══════════════════════════════════════════════════════════════
// GMAIL INTEGRATION
// ══════════════════════════════════════════════════════════════

// Configuration - Replace with your credentials
const GMAIL_CONFIG = {
  clientId: '465022219570-cqdiq0iio3f0bs5ev4724uf6j44a7g33.apps.googleusercontent.com', // Google OAuth Client ID
  scopes: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly'
};

let _gmailAccessToken = null;
let _gmailTokenExpiry = null;

// Initialize Gmail OAuth
function initGmailAuth() {
  if (window.__mfrGmailScriptLoading || window.google?.accounts?.oauth2) return;
  window.__mfrGmailScriptLoading = true;
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = () => { window.__mfrGmailReady = true; };
  script.onerror = () => { window.__mfrGmailScriptLoading = false; toast('Could not load Google sign-in script', 'error'); };
  document.head.appendChild(script);
}

// Authenticate with Gmail
async function authenticateGmail() {
  if (!GMAIL_CONFIG.clientId || GMAIL_CONFIG.clientId.includes('YOUR_CLIENT_ID')) {
    toast('Add your Google OAuth Client ID in the Gmail config first.', 'error');
    throw new Error('Missing Google OAuth Client ID');
  }
  initGmailAuth();
  for (let i = 0; i < 40 && !window.google?.accounts?.oauth2; i++) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  if (!window.google?.accounts?.oauth2) {
    toast('Google sign-in did not load. Check browser blockers or network access.', 'error');
    throw new Error('Google sign-in script not loaded');
  }
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GMAIL_CONFIG.clientId,
      scope: GMAIL_CONFIG.scopes,
      callback: (response) => {
        if (response?.access_token) {
          _gmailAccessToken = response.access_token;
          _gmailTokenExpiry = Date.now() + ((response.expires_in || 3600) * 1000);
          localStorage.setItem('gmail_token', _gmailAccessToken);
          localStorage.setItem('gmail_expiry', _gmailTokenExpiry.toString());
          toast('Gmail connected!', 'success');
          resolve(response.access_token);
        } else {
          reject(new Error(response?.error || 'Failed to get access token'));
        }
      },
    });
    client.requestAccessToken();
  });
}

// Check if Gmail is authenticated
function isGmailAuthenticated() {
  const token = localStorage.getItem('gmail_token');
  const expiry = localStorage.getItem('gmail_expiry');
  
  if (!token || !expiry) return false;
  if (Date.now() >= parseInt(expiry)) {
    // Token expired
    localStorage.removeItem('gmail_token');
    localStorage.removeItem('gmail_expiry');
    return false;
  }
  
  _gmailAccessToken = token;
  _gmailTokenExpiry = parseInt(expiry);
  return true;
}

// Email Templates
const EMAIL_TEMPLATES = {
  'quote-sent': {
    subject: 'Your Roofing Estimate from My Family Roofer',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <div style="background:#1E40AF;color:white;padding:20px;text-align:center">
        <h1 style="margin:0">My Family Roofer</h1>
      </div>
      <div style="padding:20px;background:#f9fafb">
        <p>Hi {{firstName}},</p>
        <p>Thank you for choosing My Family Roofer! I've prepared your custom roofing estimate.</p>
        <p><strong>Estimate Total: &#36;{{contractValue}}</strong></p>
        <p style="text-align:center;margin:30px 0">
          <a href="{{quoteLink}}" style="background:#1E40AF;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">View Your Estimate</a>
        </p>
        <p>If you have any questions, just reply to this email or give me a call at {{repPhone}}.</p>
        <p>Best regards,<br>{{repName}}<br>My Family Roofer</p>
      </div>
    </div>`
  },
  'follow-up': {
    subject: 'Following Up on Your Roofing Project',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <p>Hi {{firstName}},</p>
      <p>I wanted to follow up on the estimate we provided for your roofing project.</p>
      <p>Do you have any questions I can answer? I'm here to help make this process as smooth as possible.</p>
      <p>Feel free to reply to this email or call me directly at {{repPhone}}.</p>
      <p>Best regards,<br>{{repName}}<br>My Family Roofer</p>
    </div>`
  },
  'inspection-scheduled': {
    subject: 'Your Roof Inspection is Scheduled',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <p>Hi {{firstName}},</p>
      <p>Your roof inspection is confirmed for:</p>
      <p style="background:#f3f4f6;padding:15px;border-left:4px solid #1E40AF;margin:20px 0">
        <strong>Date:</strong> {{appointmentDate}}<br>
        <strong>Time:</strong> {{appointmentTime}}<br>
        <strong>Address:</strong> {{address}}
      </p>
      <p>I'll thoroughly inspect your roof and provide a detailed assessment. The inspection typically takes 30-45 minutes.</p>
      <p>See you soon!<br>{{repName}}<br>My Family Roofer<br>{{repPhone}}</p>
    </div>`
  },
  'thank-you': {
    subject: 'Thank You for Choosing My Family Roofer!',
    body: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <p>Hi {{firstName}},</p>
      <p>Thank you for choosing My Family Roofer for your roofing project! We're excited to get started.</p>
      <p>Your project is scheduled to begin on {{startDate}}. Our team will take great care of your home.</p>
      <p>If you have any questions before we start, please don't hesitate to reach out.</p>
      <p>Best regards,<br>{{repName}}<br>My Family Roofer</p>
    </div>`
  }
};

// Open Email Composer Modal
function composeEmail(customerId, jobId = null, templateName = null) {
  if (!isGmailAuthenticated()) {
    if (confirm('Gmail not connected. Connect now?')) {
      authenticateGmail().then(() => composeEmail(customerId, jobId, templateName));
    }
    return;
  }
  
  // Load customer data
  _sb.from('customers').select('*, jobs(*)').eq('id', customerId).single().then(({ data: customer }) => {
    const job = jobId ? customer.jobs?.find(j => j.id === jobId) : customer.jobs?.[0];
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay email-modal';
    modal.innerHTML = `<div class="modal-sheet" style="max-width:800px;max-height:90vh">
      <div class="modal-drag"></div>
      
      <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">✉️ Compose Email</h3>
      
      <div class="form-grid">
        <div class="fg"><label class="fl">To</label>
          <input class="fi" id="email-to" value="${customer.email || ''}" placeholder="customer@email.com">
        </div>
        
        <div class="fg"><label class="fl">Template</label>
          <select class="fs" id="email-template" onchange="loadEmailTemplate(this.value)">
            <option value="">Custom Email</option>
            <option value="quote-sent" ${templateName === 'quote-sent' ? 'selected' : ''}>Quote Sent</option>
            <option value="follow-up" ${templateName === 'follow-up' ? 'selected' : ''}>Follow-Up</option>
            <option value="inspection-scheduled" ${templateName === 'inspection-scheduled' ? 'selected' : ''}>Inspection Scheduled</option>
            <option value="thank-you" ${templateName === 'thank-you' ? 'selected' : ''}>Thank You</option>
          </select>
        </div>
        
        <div class="fg fg-full"><label class="fl">Subject</label>
          <input class="fi" id="email-subject" placeholder="Email subject">
        </div>
        
        <div class="fg fg-full"><label class="fl">Message</label>
          <textarea class="fi" id="email-body" rows="12" style="font-family:Arial,sans-serif"></textarea>
        </div>
      </div>
      
      <div style="display:flex;gap:8px;margin-top:16px;justify-content:space-between">
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="sendEmail('${customerId}', ${jobId ? `'${jobId}'` : 'null'})">📧 Send Email</button>
          <button class="btn btn-outline" onclick="previewEmail()">👁️ Preview</button>
        </div>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
    
    document.body.appendChild(modal);
    
    // Load template if specified
    if (templateName) {
      setTimeout(() => loadEmailTemplate(templateName), 100);
    }
    
    // Store customer/job data for template variables
    window._emailContext = { customer, job };
  });
}

// Load Email Template
function loadEmailTemplate(templateName) {
  if (!templateName) return;
  
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) return;
  
  const { customer, job } = window._emailContext || {};
  
  // Replace template variables
  let subject = template.subject;
  let body = template.body;
  
  const vars = {
    firstName: customer?.first_name || 'there',
    lastName: customer?.last_name || '',
    contractValue: job?.contract_value ? Number(job.contract_value).toLocaleString() : 'TBD',
    quoteLink: job?.quote_code ? `${(typeof customerBasePath === 'function' ? customerBasePath() : (window.location.origin + window.location.pathname.replace(/index\.html.*$/, '').replace(/[^/]*$/, '')))}quote.html?code=${encodeURIComponent(job.quote_code)}` : '#',
    repName: _profile?.full_name || 'My Family Roofer Team',
    repPhone: _profile?.phone || '(970) XXX-XXXX',
    address: customer?.address || '',
    appointmentDate: 'TBD',
    appointmentTime: 'TBD',
    startDate: 'TBD'
  };
  
  Object.keys(vars).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, vars[key]);
    body = body.replace(regex, vars[key]);
  });
  
  document.getElementById('email-subject').value = subject;
  document.getElementById('email-body').value = body;
}

// Send Email
async function sendEmail(customerId, jobId) {
  const to = document.getElementById('email-to')?.value?.trim();
  const subject = document.getElementById('email-subject')?.value?.trim();
  const body = document.getElementById('email-body')?.value?.trim();
  
  if (!to || !subject || !body) {
    toast('Please fill in all fields', 'error');
    return;
  }
  
  if (!isGmailAuthenticated()) {
    toast('Gmail not authenticated', 'error');
    return;
  }
  
  try {
    toast('Sending email...', 'info');
    
    // Call Supabase Edge Function
    const sessionResult = await _sb.auth.getSession();
    const sessionToken = sessionResult?.data?.session?.access_token;
    if (!sessionToken) {
      throw new Error('No Supabase login session found. Gmail sending should be used from a logged-in app session, not the public demo login bypass.');
    }

    const response = await fetch(`${SUPA_URL}/functions/v1/gmail-send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'send',
        accessToken: _gmailAccessToken,
        to,
        subject,
        body,
        customerId,
        jobId
      })
    });
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    toast('Email sent successfully!', 'success');
    document.querySelector('.email-modal')?.remove();
    
    // Refresh customer modal if open
    if (_activeCustomer) await refreshCustomerModal();
    
  } catch (error) {
    console.error('Send email error:', error);
    toast('Failed to send email: ' + error.message, 'error');
  }
}

// Preview Email
function previewEmail() {
  const subject = document.getElementById('email-subject')?.value;
  const body = document.getElementById('email-body')?.value;
  
  const preview = window.open('', 'Email Preview', 'width=600,height=800');
  preview.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${subject}</title>
      <style>body { font-family: Arial, sans-serif; padding: 20px; }</style>
    </head>
    <body>
      <h2>${subject}</h2>
      <hr>
      ${body}
    </body>
    </html>
  `);
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  initGmailAuth();
});
