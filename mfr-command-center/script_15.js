
(function(){
  if(window.__mfrAppointmentsMobileCardPatchV1) return;
  window.__mfrAppointmentsMobileCardPatchV1 = true;

  function esc(v){
    if(typeof escHtml === 'function') return escHtml(v ?? '');
    return String(v ?? '').replace(/[&<>"']/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[s]; });
  }
  function types(){
    try { if(typeof MFR_APPT_TYPES !== 'undefined' && Array.isArray(MFR_APPT_TYPES)) return MFR_APPT_TYPES; } catch(_) {}
    return [['inspection','Inspection'],['estimate','Estimate'],['follow_up','Follow-up'],['adjuster_meeting','Adjuster Meeting'],['production','Production'],['other','Other']];
  }
  function statuses(){
    try { if(typeof MFR_APPT_STATUSES !== 'undefined' && Array.isArray(MFR_APPT_STATUSES)) return MFR_APPT_STATUSES; } catch(_) {}
    return [['scheduled','Scheduled'],['confirmed','Confirmed'],['completed','Completed'],['cancelled','Cancelled'],['no_show','No Show'],['rescheduled','Rescheduled']];
  }
  function typeLabel(v){
    try { if(typeof mfrApptTypeLabel === 'function') return mfrApptTypeLabel(v); } catch(_) {}
    return (types().find(function(x){ return x[0] === v; }) || [v, v || 'Appointment'])[1];
  }
  function statusLabel(v){
    try { if(typeof mfrApptStatusLabel === 'function') return mfrApptStatusLabel(v); } catch(_) {}
    return (statuses().find(function(x){ return x[0] === v; }) || [v, v || 'Scheduled'])[1];
  }
  function statusColor(v){
    try { if(typeof mfrApptStatusColor === 'function') return mfrApptStatusColor(v); } catch(_) {}
    return ({scheduled:'blue',confirmed:'green',completed:'gray',cancelled:'red',no_show:'orange',rescheduled:'purple'})[v] || 'gray';
  }
  function localDateKey(d){
    if(!d) return '';
    const dt = d instanceof Date ? d : new Date(d);
    if(Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const day = String(dt.getDate()).padStart(2,'0');
    return y + '-' + m + '-' + day;
  }
  function fmtDate(dt){
    if(!dt) return 'No date';
    try { return dt.toLocaleDateString([], {month:'numeric', day:'numeric', year:'numeric'}); } catch(_) { return 'No date'; }
  }
  function fmtTime(dt){
    if(!dt) return '';
    try { return dt.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}); } catch(_) { return ''; }
  }
  function telHref(phone){
    const p = String(phone || '').replace(/[^0-9+]/g,'');
    return p ? 'tel:' + p : '';
  }
  function currentUserId(){
    try { return _user && _user.id ? _user.id : ''; } catch(_) { return ''; }
  }
  function ensureAppointmentStyles(){
    if(document.getElementById('mfr-appointments-mobile-card-css-v1')) return;
    const style = document.createElement('style');
    style.id = 'mfr-appointments-mobile-card-css-v1';
    style.textContent = `
      .mfr-appt-page{padding-bottom:36px!important}
      .mfr-appt-hero{background:linear-gradient(135deg,#0d1b3e,#1d4ed8);color:white;border-radius:22px;padding:22px;border:1px solid rgba(255,255,255,.16);box-shadow:0 18px 40px rgba(13,27,62,.18);margin-bottom:16px;position:relative;overflow:hidden}
      .mfr-appt-hero:after{content:'';position:absolute;right:-52px;top:-58px;width:185px;height:185px;border-radius:999px;background:rgba(255,255,255,.10)}
      .mfr-appt-hero-top{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;position:relative;z-index:2}
      .mfr-appt-kicker{display:inline-flex;align-items:center;gap:7px;padding:7px 10px;margin-bottom:11px;border-radius:999px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.18);font-size:11px;font-weight:950;letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.86)}
      .mfr-appt-hero h1{font-size:28px;line-height:1.05;font-weight:950;margin:0 0 6px;letter-spacing:-.03em;color:white}
      .mfr-appt-hero p{margin:0;color:rgba(255,255,255,.76);max-width:720px;font-size:14px;line-height:1.45}
      .mfr-appt-primary-action{position:relative;z-index:2;box-shadow:0 12px 26px rgba(37,99,235,.24)}
      .mfr-appt-view-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;position:relative;z-index:2}
      .mfr-appt-chip{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.10);color:rgba(255,255,255,.84);border-radius:999px;padding:9px 13px;font-size:12px;font-weight:900;cursor:pointer;white-space:nowrap}
      .mfr-appt-chip:hover,.mfr-appt-chip[data-active="true"]{background:#fff;color:#0d1b3e;border-color:#fff;box-shadow:0 10px 24px rgba(15,23,42,.16)}
      .mfr-appt-stats .stat-card{border-radius:18px;border-width:1px;border-top-width:5px;box-shadow:0 10px 24px rgba(15,23,42,.04)}
      .mfr-appt-filter-card{border-radius:20px;box-shadow:0 12px 28px rgba(15,23,42,.05)}
      .mfr-appt-filters{display:grid;grid-template-columns:repeat(4,minmax(150px,1fr));gap:10px;align-items:center}
      .mfr-appt-filters .fi,.mfr-appt-filters .fs{min-height:44px;border-radius:13px;background:#fff;font-size:14px}
      .mfr-appt-filters .btn{min-height:44px;border-radius:13px;justify-content:center}
      .mfr-appt-list-card{border-radius:22px;box-shadow:0 12px 28px rgba(15,23,42,.05);overflow:hidden}
      .mfr-appt-mobile-list{display:none}
      .mfr-appt-desktop-table .tbl th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text2)}
      .mfr-appt-desktop-table .tbl td{vertical-align:middle}
      .mfr-appt-row-warn{background:#FEF3C7!important}
      @media(max-width:760px){
        .mfr-appt-page{padding-left:12px!important;padding-right:12px!important;padding-bottom:calc(28px + env(safe-area-inset-bottom))!important}
        .mfr-appt-hero{border-radius:20px;padding:17px;margin-bottom:14px}
        .mfr-appt-hero-top{display:grid;gap:14px}
        .mfr-appt-hero h1{font-size:25px}
        .mfr-appt-hero p{font-size:13px;line-height:1.42}
        .mfr-appt-primary-action{width:100%;min-height:48px;justify-content:center;border-radius:14px;font-size:14px}
        .mfr-appt-view-tabs{flex-wrap:nowrap;overflow-x:auto;padding-bottom:3px;margin-left:-2px;margin-right:-2px;-webkit-overflow-scrolling:touch}
        .mfr-appt-chip{flex:0 0 auto;padding:10px 14px;font-size:12px}
        .mfr-appt-stats{gap:10px!important;margin-bottom:14px!important}
        .mfr-appt-stats .stat-card{border-radius:18px;padding:14px;min-height:92px;background:#fff}
        .mfr-appt-stats .sc-label{font-size:10px;line-height:1.2;margin-bottom:10px}
        .mfr-appt-stats .sc-val{font-size:30px;line-height:1}
        .mfr-appt-filter-card{border-radius:22px;margin-bottom:14px}
        .mfr-appt-filter-card .card-body{padding:14px!important}
        .mfr-appt-filters{grid-template-columns:1fr!important;gap:10px}
        .mfr-appt-filters .fi,.mfr-appt-filters .fs,.mfr-appt-filters .btn{width:100%;min-height:50px;border-radius:15px;font-size:16px}
        .mfr-appt-list-card{background:transparent;border:0;box-shadow:none;margin-bottom:0}
        .mfr-appt-list-card .card-body{padding:0!important}
        .mfr-appt-desktop-table{display:none!important}
        .mfr-appt-mobile-list{display:grid!important;gap:12px}
        .mfr-appt-card{background:#fff;border:1px solid var(--border);border-radius:22px;box-shadow:0 12px 28px rgba(15,23,42,.06);padding:14px;overflow:hidden}
        .mfr-appt-card.is-past-scheduled{background:#fff8db;border-color:#fde68a}
        .mfr-appt-card-top{display:grid;grid-template-columns:78px minmax(0,1fr);gap:12px;align-items:start}
        .mfr-appt-datebox{border:1px solid #bfdbfe;background:#eff6ff;color:#0d1b3e;border-radius:18px;min-height:78px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:9px}
        .mfr-appt-datebox strong{font-size:17px;font-weight:950;line-height:1.05}.mfr-appt-datebox span{font-size:11px;font-weight:900;color:#64748b;margin-top:4px}
        .mfr-appt-titleline{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:7px;min-width:0}
        .mfr-appt-customer{font-size:16px;font-weight:950;color:#0f172a;line-height:1.15;min-width:0;word-break:break-word}
        .mfr-appt-badges{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.mfr-appt-badges .badge{font-size:10px!important;padding:4px 8px;border-radius:999px}
        .mfr-appt-meta{display:grid;gap:5px;margin-top:8px;color:#475569;font-size:12px;line-height:1.35}.mfr-appt-meta b{color:#0f172a}.mfr-appt-meta a{color:#2563eb;font-weight:900;text-decoration:none}
        .mfr-appt-notes{margin-top:10px;background:#f8fafc;border:1px solid var(--border);border-radius:14px;padding:10px;color:#475569;font-size:12px;line-height:1.4;word-break:break-word}
        .mfr-appt-card-actions{display:grid;grid-template-columns:1fr;gap:8px;margin-top:12px}.mfr-appt-card-actions .btn,.mfr-appt-card-actions a.btn{width:100%;min-height:46px;justify-content:center;border-radius:14px;text-decoration:none}
      }
    `;
    document.head.appendChild(style);
  }

  function viewChip(viewMode, value, label){
    return '<button class="mfr-appt-chip" data-active="' + (viewMode === value ? 'true' : 'false') + '" onclick="switchAppointmentView(\'' + value + '\')">' + label + '</button>';
  }

  window.pageAppointments = async function(c){
    ensureAppointmentStyles();
    const viewMode = sessionStorage.getItem('appointments_view') || 'all';
    c.innerHTML = '<div class="page-wrap mfr-appt-page">'
      + '<section class="mfr-appt-hero">'
      + '<div class="mfr-appt-hero-top"><div><div class="mfr-appt-kicker">📅 Scheduling</div><h1>Appointments</h1><p>Schedule inspections, filter today\'s work, and open appointment details from a mobile-friendly card view.</p></div><button class="btn btn-primary mfr-appt-primary-action" onclick="newApptModal()">+ Schedule Appointment</button></div>'
      + '<div class="mfr-appt-view-tabs">' + viewChip(viewMode,'all','All') + viewChip(viewMode,'my','My Appointments') + viewChip(viewMode,'today','Today') + viewChip(viewMode,'upcoming','Upcoming') + '</div>'
      + '</section>'
      + '<div class="stat-cards mfr-appt-stats" style="margin-bottom:14px">'
      + '<div class="stat-card sc-blue"><div class="sc-label">Scheduled</div><div class="sc-val" id="appt-stat-scheduled">—</div></div>'
      + '<div class="stat-card sc-green"><div class="sc-label">Confirmed</div><div class="sc-val" id="appt-stat-confirmed">—</div></div>'
      + '<div class="stat-card sc-orange"><div class="sc-label">Today</div><div class="sc-val" id="appt-stat-today">—</div></div>'
      + '<div class="stat-card sc-purple"><div class="sc-label">Upcoming</div><div class="sc-val" id="appt-stat-upcoming">—</div></div>'
      + '</div>'
      + '<div class="card mfr-appt-filter-card"><div class="card-body" style="padding:14px">'
      + '<div class="mfr-appt-filters">'
      + '<select class="fs" id="appt-filter-status" onchange="loadAppointmentsList()"><option value="">All Statuses</option>' + statuses().map(function(x){ return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>'; }).join('') + '</select>'
      + '<select class="fs" id="appt-filter-type" onchange="loadAppointmentsList()"><option value="">All Types</option>' + types().map(function(x){ return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + '</option>'; }).join('') + '</select>'
      + '<input class="fi" id="appt-search" placeholder="Search customer, phone, notes..." oninput="loadAppointmentsList()">'
      + '<button class="btn btn-outline" onclick="loadAppointmentsList()">Refresh</button>'
      + '</div></div></div>'
      + '<div class="card mfr-appt-list-card"><div class="card-body" style="padding:0" id="appointments-list"><div style="text-align:center;padding:40px">Loading appointments...</div></div></div>'
      + '</div>';
    await window.loadAppointmentsList();
  };
  try { pageAppointments = window.pageAppointments; } catch(_) {}

  window.switchAppointmentView = function(view){
    sessionStorage.setItem('appointments_view', view || 'all');
    const content = document.getElementById('content');
    if(content) window.pageAppointments(content);
  };
  try { switchAppointmentView = window.switchAppointmentView; } catch(_) {}

  function desktopTable(rows){
    return '<div class="mfr-appt-desktop-table"><table class="tbl"><thead><tr><th>Date & Time</th><th>Customer</th><th>Type</th><th>Assigned To</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>'
      + rows.map(function(a){
        const dt = a.appointment_date ? new Date(a.appointment_date) : null;
        const isPastScheduled = dt && dt < new Date() && a.status === 'scheduled';
        const phone = a.customer_phone || '';
        const phoneHtml = phone ? '<a href="' + esc(telHref(phone)) + '" style="color:var(--text3);text-decoration:none">' + esc(phone) + '</a>' : esc(a.customer_email || '');
        return '<tr class="' + (isPastScheduled ? 'mfr-appt-row-warn' : '') + '">'
          + '<td><div style="font-weight:800;font-size:13px">' + esc(fmtDate(dt)) + '</div><div style="font-size:11px;color:var(--text3)">' + esc(fmtTime(dt)) + '</div></td>'
          + '<td><div style="font-weight:800;font-size:13px">' + esc(a.customer_name || 'Unknown') + '</div><div style="font-size:11px;color:var(--text3)">' + phoneHtml + '</div></td>'
          + '<td><span class="badge badge-blue" style="font-size:10px">' + esc(typeLabel(a.appointment_type)) + '</span></td>'
          + '<td style="font-size:12px">' + esc(a.assigned_to_name || 'Unassigned') + '</td>'
          + '<td><span class="badge badge-' + esc(statusColor(a.status)) + '" style="font-size:10px">' + esc(statusLabel(a.status)) + '</span></td>'
          + '<td style="font-size:12px;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(a.notes || a.internal_notes || '') + '</td>'
          + '<td><button class="btn btn-sm btn-primary" onclick="viewAppointmentDetail(\'' + esc(a.id) + '\')">View / Edit</button></td>'
          + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function mobileCards(rows){
    return '<div class="mfr-appt-mobile-list">' + rows.map(function(a){
      const dt = a.appointment_date ? new Date(a.appointment_date) : null;
      const isPastScheduled = dt && dt < new Date() && a.status === 'scheduled';
      const phone = a.customer_phone || '';
      const call = telHref(phone);
      const notes = a.notes || a.internal_notes || '';
      return '<article class="mfr-appt-card ' + (isPastScheduled ? 'is-past-scheduled' : '') + '">'
        + '<div class="mfr-appt-card-top">'
        + '<div class="mfr-appt-datebox"><strong>' + esc(dt ? dt.toLocaleDateString([], {month:'numeric', day:'numeric'}) : '—') + '</strong><span>' + esc(dt ? fmtTime(dt) : 'No time') + '</span></div>'
        + '<div style="min-width:0"><div class="mfr-appt-titleline"><div class="mfr-appt-customer">' + esc(a.customer_name || 'Unknown Customer') + '</div></div>'
        + '<div class="mfr-appt-badges"><span class="badge badge-blue">' + esc(typeLabel(a.appointment_type)) + '</span><span class="badge badge-' + esc(statusColor(a.status)) + '">' + esc(statusLabel(a.status)) + '</span></div>'
        + '<div class="mfr-appt-meta">'
        + '<div><b>Assigned:</b> ' + esc(a.assigned_to_name || 'Unassigned') + '</div>'
        + (phone ? '<div><b>Phone:</b> <a href="' + esc(call) + '">' + esc(phone) + '</a></div>' : (a.customer_email ? '<div><b>Email:</b> ' + esc(a.customer_email) + '</div>' : ''))
        + (a.location || a.customer_address ? '<div><b>Location:</b> ' + esc(a.location || a.customer_address) + '</div>' : '')
        + '</div></div></div>'
        + (notes ? '<div class="mfr-appt-notes">' + esc(notes) + '</div>' : '')
        + '<div class="mfr-appt-card-actions">'
        + '<button class="btn btn-primary" onclick="viewAppointmentDetail(\'' + esc(a.id) + '\')">View / Edit Appointment</button>'
        + (call ? '<a class="btn btn-outline" href="' + esc(call) + '">Call Customer</a>' : '')
        + '</div></article>';
    }).join('') + '</div>';
  }

  window.loadAppointmentsList = async function(){
    const listEl = document.getElementById('appointments-list');
    if(!listEl) return;
    const viewMode = sessionStorage.getItem('appointments_view') || 'all';
    const statusFilter = document.getElementById('appt-filter-status')?.value || '';
    const typeFilter = document.getElementById('appt-filter-type')?.value || '';
    const search = (document.getElementById('appt-search')?.value || '').toLowerCase().trim();

    try {
      ensureAppointmentStyles();
      let all = [];
      if(typeof mfrLoadAppointmentsForPage === 'function') all = await mfrLoadAppointmentsForPage();
      else if(window._sb || (typeof _sb !== 'undefined' && _sb)) {
        const client = window._sb || _sb;
        const res = await client.from('v_appointments_full').select('*').order('appointment_date', { ascending:true });
        if(res.error) throw res.error;
        all = res.data || [];
      }
      const now = new Date();
      const todayStr = localDateKey(now);
      const uid = currentUserId();

      const filtered = (all || []).filter(function(a){
        const dt = a.appointment_date ? new Date(a.appointment_date) : null;
        if(viewMode === 'my' && uid && a.assigned_to !== uid) return false;
        if(viewMode === 'today' && (!dt || localDateKey(dt) !== todayStr)) return false;
        if(viewMode === 'upcoming' && (!dt || dt < now || ['completed','cancelled','no_show'].includes(a.status))) return false;
        if(statusFilter && a.status !== statusFilter) return false;
        if(typeFilter && a.appointment_type !== typeFilter) return false;
        if(search) {
          const blob = [a.customer_name, a.customer_phone, a.customer_email, a.customer_address, a.location, a.notes, a.internal_notes, a.assigned_to_name, a.status, a.appointment_type].join(' ').toLowerCase();
          if(!blob.includes(search)) return false;
        }
        return true;
      }).sort(function(a,b){ return new Date(a.appointment_date || 0) - new Date(b.appointment_date || 0); });

      const statScheduled = (all || []).filter(function(a){ return a.status === 'scheduled'; }).length;
      const statConfirmed = (all || []).filter(function(a){ return a.status === 'confirmed'; }).length;
      const statToday = (all || []).filter(function(a){ return a.appointment_date && localDateKey(a.appointment_date) === todayStr; }).length;
      const statUpcoming = (all || []).filter(function(a){ return a.appointment_date && new Date(a.appointment_date) >= now && !['completed','cancelled','no_show'].includes(a.status); }).length;
      const setText = function(id, value){ const el = document.getElementById(id); if(el) el.textContent = value; };
      setText('appt-stat-scheduled', statScheduled);
      setText('appt-stat-confirmed', statConfirmed);
      setText('appt-stat-today', statToday);
      setText('appt-stat-upcoming', statUpcoming);

      if(!filtered.length) {
        listEl.innerHTML = '<div class="empty-state" style="padding:44px"><div class="icon">📅</div><h3>No Appointments</h3><p>No appointments match this view.</p><button class="btn btn-primary" onclick="newApptModal()">+ Schedule Appointment</button></div>';
        return;
      }
      listEl.innerHTML = desktopTable(filtered) + mobileCards(filtered);
    } catch(e) {
      console.error('Load appointments error:', e);
      listEl.innerHTML = '<div style="padding:34px;text-align:center;color:#B91C1C;background:#fff;border-radius:18px"><strong>Error loading appointments</strong><br><span style="font-size:12px">' + esc(e && e.message ? e.message : 'Unknown error') + '</span><br><button class="btn btn-primary" style="margin-top:12px" onclick="newApptModal()">+ Schedule Appointment</button></div>';
    }
  };
  try { loadAppointmentsList = window.loadAppointmentsList; } catch(_) {}
})();
