

const SUPA_URL = 'https://qhfjarnyrobdylwkvrmn.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFoZmphcm55cm9iZHlsd2t2cm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MjcyNzUsImV4cCI6MjA5MzAwMzI3NX0.fk1fEAFsYpeWmyayKo0PMYd_0oI2DuV7SIjmqZZ9QSg';
let _sb, _user, _profile, _section = 'ops', _page = 'dashboard';
let _navHistory = [];
let _lastPageBySection = { ops:'dashboard', est:'estimates', sales:'sales-board', admin:'tasks' };

const SECTIONS = {
  ops:{
    nav:[
      {sec:'Overview'},
      {id:'dashboard',   ic:'📊', label:'Dashboard'},
      {id:'pipeline',    ic:'📈', label:'Pipeline'},
      {id:'customers',   ic:'👥', label:'Customers'},
      {id:'customer-tracker', ic:'📍', label:'Customer Tracker'},
      {sec:'Field'},
      {id:'inspection',  ic:'🔍', label:'Roof Inspector'},
      {id:'measuring',   ic:'📐', label:'Roof Measuring'},
      {id:'photos',      ic:'📸', label:'Photos'},
      {sec:'Claims & Supplements'},
      {id:'claims',      ic:'🏠', label:'Claim Tracker'},
      {id:'supplements', ic:'📄', label:'Supplements'},
      {sec:'Scheduling'},
      {id:'appointments',ic:'📅', label:'Appointments'},
      {id:'notifications',ic:'🔔',label:'Notifications'},
    ]
  },
  est:{
    nav:[
      {sec:'Build'},
      {id:'estimates',   ic:'📋', label:'Estimate Builder'},
      {id:'measuring',   ic:'📐', label:'Roof Measuring'},
      {sec:'Saved'},
      {id:'estimates-list',ic:'📂',label:'All Estimates'},
    ]
  },
  sales:{
    nav:[
      {sec:'Pipeline'},
      {id:'sales-board', ic:'🧲', label:'Sales Board'},
      {sec:'AI Tools'},
      {id:'objections',  ic:'💬', label:'Objection Handler'},
      {id:'closing',     ic:'🎯', label:'Closing Coach'},
      {id:'followup',    ic:'✉️',  label:'Follow-Up Writer'},
      {sec:'In the Field'},
      {id:'financing',   ic:'💳', label:'Financing Calc'},
      {id:'supplements', ic:'📄', label:'Supplements'},
      {id:'storm',       ic:'⛈️',  label:'Storm Response'},
      {sec:'Reputation'},
      {id:'reviews',     ic:'⭐', label:'Reviews'},
    ]
  },
  admin:{
    nav:[
      {sec:'Team'},
      {id:'announcements',ic:'📢',label:'Message Board'},
      {id:'team',        ic:'👥', label:'Team & Users'},
      {id:'tasks',       ic:'✅', label:'Tasks'},
      {sec:'Automation'},
      {id:'campaigns',   ic:'⚡', label:'Campaigns'},
      {id:'pricing',     ic:'💲', label:'Pricing Rates', badge:'ADMIN', badgeCls:'am'},
      {sec:'Reports & Data'},
      {id:'sales-metrics',ic:'📊', label:'Sales Metrics'},
      {id:'marketing-roi',ic:'💰', label:'Marketing ROI'},
      {id:'reports',     ic:'📈', label:'Reports'},
      {id:'storage',     ic:'🗄️',  label:'Storage'},
    ]
  }
};

const PAGE_SECTION = {
  dashboard:'ops',pipeline:'ops',customers:'ops','customer-tracker':'ops',inspection:'ops',measuring:'ops',photos:'ops',
  claims:'ops',supplements:'ops',appointments:'ops',notifications:'ops',
  estimates:'est','estimates-list':'est',
  'sales-board':'sales',objections:'sales',closing:'sales',followup:'sales',financing:'sales',storm:'sales','hail-intelligence':'sales',reviews:'sales',
  announcements:'admin',team:'admin',tasks:'admin',campaigns:'admin',pricing:'admin','sales-metrics':'admin','marketing-roi':'admin',reports:'admin',storage:'admin'
};

const MFR_CURRENT_PRICING = {
  quoteSquares: 21,
  sourceLabel: 'My Family Roofer quote dated April 30, 2026',
  options: [
    { name:'26g Tuff Rib Exposed Fastener', total:20747.22, price_per_square:988.92, aliases:['tuff rib','exposed fastener','metal'] },
    { name:'MOST POPULAR Owens Corning Duration Flex', total:14289.12, price_per_square:680.43, aliases:['duration flex','owens corning duration flex','flex'] },
    { name:'Owens Corning Duration Storm', total:13578.08, price_per_square:646.58, aliases:['duration storm','owens corning duration storm','storm'] }
  ],
  addons: [
    { name:'5 in Seamless Gutters', total:2531.07, qty:127, unit_label:'lf', price:19.93, aliases:['seamless gutters','gutter replacement','gutters'] },
    { name:'Fortified Roofing', total:2706.06, qty:21, unit_label:'sq', price:128.86, aliases:['fortified roofing','fortified roof'] },
    { name:'Cool Roof Upgrade', total:1596.50, qty:2, unit_label:'ea', price:798.25, aliases:['cool roof','solar attic vent'] },
    { name:'Upgraded Warranty', total:378.00, qty:21, unit_label:'sq', price:18.00, aliases:['upgraded warranty','workmanship warranty'] },
    { name:'5 Year Hail/Wind Guarantee', total:0.00, qty:1, unit_label:'24HR', price:0.00, aliases:['hail','wind guarantee','hail/wind'] },
    { name:'RX Leaf Guard Upgrade', total:1225.55, qty:127, unit_label:'lf', price:9.65, aliases:['rx leaf guard','leaf guard'] }
  ]
};


// ── INIT ──
window.addEventListener('DOMContentLoaded', async () => {
  _sb = supabase.createClient(SUPA_URL, SUPA_KEY);
  try {
    const { data: { session } } = await _sb.auth.getSession();
    if (session?.user) {
      await bootApp(session.user);
    } else {
      showLoginScreen();
    }
  } catch (e) {
    console.error('Auth restore failed:', e);
    showLoginScreen();
  }
});

function showLoginScreen() {
  const loader = document.getElementById('auth-loading');
  const login = document.getElementById('login-screen');
  const app = document.getElementById('app-screen');
  if (loader) loader.style.display = 'none';
  if (app) app.style.display = 'none';
  if (login) login.style.display = 'flex';
}

async function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  const err   = document.getElementById('l-err');
  err.classList.remove('show');
  const { data, error } = await _sb.auth.signInWithPassword({ email, password: pass });
  if (error) { err.textContent = error.message; err.classList.add('show'); return; }
  await bootApp(data.user);
}

async function bootApp(user) {
  _user = user;
  const { data } = await _sb.from('profiles').select('*').eq('id', user.id).single();
  _profile = data;
  const loader = document.getElementById('auth-loading');
  if (loader) loader.style.display = 'none';
  document.getElementById('login-screen').style.display = 'none';
  const app = document.getElementById('app-screen');
  app.style.display = 'flex';
  app.classList.remove('hidden');
  const initials = (_profile?.email||'?').slice(0,2).toUpperCase();
  document.getElementById('tn-avatar').textContent = initials;
  setSection('ops');
  await refreshTopStats();
}

async function doLogout() {
  if (!confirm('Sign out?')) return;
  await _sb.auth.signOut();
  location.reload();
}

async function refreshTopStats() {
  try {
    const { data } = await _sb.from('v_dashboard_stats').select('*').single();
    if (data) {
      document.getElementById('tn-pipeline').textContent = '$' + ((data.total_pipeline||0)/1000).toFixed(0) + 'K';
      document.getElementById('tn-jobs').textContent = data.active_jobs || 0;
    }
  } catch(e) {}
}

// ── NAVIGATION ──
function syncSectionButtons() {
  ['ops','est','sales','admin'].forEach(s => {
    document.getElementById('st-'+s)?.classList.toggle('active', s===_section);
    document.getElementById('bn-'+s)?.classList.toggle('active', s===_section);
  });
}

function firstPageForSection(sec) {
  return SECTIONS[sec]?.nav?.find(n => n.id)?.id || 'dashboard';
}

function setSection(sec) {
  if (!SECTIONS[sec]) return;
  _section = sec;
  syncSectionButtons();
  buildSB();
  const target = _lastPageBySection[sec] || firstPageForSection(sec);
  go(target, { noHistory: false, fromSectionSwitch: true });
}

function buildSB() {
  const nav = SECTIONS[_section]?.nav || [];
  document.getElementById('sidebar').innerHTML = nav.map(n => {
    if (n.sec) return `<div class="nav-sec">${n.sec}</div>`;
    const badge = n.badge ? `<span class="nb ${n.badgeCls||''}">${n.badge}</span>` : '';
    return `<div class="ni${_page===n.id?' active':''}" id="ni-${n.id}" onclick="go('${n.id}');closeSB()">
      <span class="ic">${n.ic}</span>${n.label}${badge}</div>`;
  }).join('');
}

function go(id, opts={}) {
  if (!id) return;
  const nextSection = PAGE_SECTION[id] || _section;
  if (!opts.noHistory && _page && _page !== id) {
    const last = _navHistory[_navHistory.length - 1];
    if (last !== _page) _navHistory.push(_page);
    if (_navHistory.length > 12) _navHistory.shift();
  }
  _page = id;
  _section = nextSection;
  _lastPageBySection[_section] = id;
  syncSectionButtons();
  buildSB();
  const c = document.getElementById('content');
  if (c) {
    c.classList.remove('page-enter');
    c.scrollTo({ top: 0, behavior: 'smooth' });
  }
  Promise.resolve(renderPage(id)).then(() => enhanceRouteChrome(id));
}


function navLabel(id) {
  for (const secKey of Object.keys(SECTIONS)) {
    const item = SECTIONS[secKey].nav.find(n => n.id === id);
    if (item) return item.label;
  }
  return (id || '').replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

function sectionLabel(sec) {
  return sec === 'ops' ? 'Operations' : sec === 'est' ? 'Estimate Builder' : sec === 'sales' ? 'Sales Tools' : sec === 'admin' ? 'Admin' : 'Command Center';
}

function goBackPage() {
  const prev = _navHistory.pop();
  if (prev) go(prev, { noHistory:true });
  else go(_lastPageBySection[_section] || firstPageForSection(_section), { noHistory:true });
}

function enhanceRouteChrome(id) {
  const c = document.getElementById('content');
  if (!c) return;
  c.classList.remove('page-enter');
  void c.offsetWidth;
  c.classList.add('page-enter');
  const wrap = c.querySelector('.page-wrap');
  if (!wrap || wrap.querySelector('.routebar')) return;
  const quick = [
    ['dashboard','Dashboard'], ['pipeline','Pipeline'], ['customers','Customers'], ['appointments','Appointments'], ['tasks','Tasks']
  ].filter(([pid]) => pid !== id).slice(0, 4).map(([pid,label]) => '<button class="quick-nav-btn" onclick="go(\''+pid+'\')">'+label+'</button>').join('');
  const backDisabled = _navHistory.length ? '' : ' style="opacity:.45"';
  const bar = document.createElement('div');
  bar.className = 'routebar';
  bar.innerHTML = '<div class="route-left"><button class="route-back" onclick="goBackPage()"'+backDisabled+'>←</button><div class="route-text"><div class="route-kicker">'+sectionLabel(_section)+'</div><div class="route-title">'+navLabel(id)+'</div></div></div><div class="route-actions">'+quick+'</div>';
  wrap.prepend(bar);
}

function closeSB() {
  document.getElementById('sidebar')?.classList.remove('open');
}

function toggleSB() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

// ── TOAST ──
function toast(msg, type='ok') {
  const wrap = document.getElementById('toast-wrap');
  const el = document.createElement('div');
  el.className = `toast toast-${type==='error'?'err':type==='warn'?'warn':'ok'}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── COPY ──
function copyTxt(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.classList.add('done'); btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.classList.remove('done'); btn.textContent = orig; }, 2000);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
    const orig = btn.textContent;
    btn.classList.add('done'); btn.textContent = '✓ Copied!';
    setTimeout(() => { btn.classList.remove('done'); btn.textContent = orig; }, 2000);
  });
}

function isAdmin() { return _profile?.role === 'admin' || _profile?.role === 'manager'; }

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function mfrSafeQuery(query, fallback = null, label = 'query') {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn('MFR safe query failed:', label, error);
      return fallback;
    }
    return data ?? fallback;
  } catch (err) {
    console.warn('MFR safe query exception:', label, err);
    return fallback;
  }
}

function mfrCustomerName(customer = {}) {
  if (!customer) return 'Unknown Customer';
  const first = String(customer.first_name || customer.firstname || customer.firstName || '').trim();
  const last = String(customer.last_name || customer.lastname || customer.lastName || '').trim();
  const combined = [first, last].filter(Boolean).join(' ').trim();
  return String(
    customer.name ||
    customer.customer_name ||
    customer.homeowner_name ||
    customer.full_name ||
    customer.display_name ||
    customer.contact_name ||
    combined ||
    'Unknown Customer'
  ).trim();
}

function mfrCustomerAddress(customer = {}) {
  if (!customer) return '';
  return String(
    customer.address ||
    customer.property_address ||
    customer.street_address ||
    customer.full_address ||
    customer.job_address ||
    [customer.city, customer.state, customer.zip].filter(Boolean).join(', ')
  ).trim();
}


function pickField(obj, keys, fallback='') {
  for (const key of keys) {
    const val = obj?.[key];
    if (val !== undefined && val !== null && String(val).trim() !== '') return val;
  }
  return fallback;
}

function normalizeCustomer(raw={}) {
  const first = pickField(raw, ['first_name','firstname','firstName']);
  const last  = pickField(raw, ['last_name','lastname','lastName']);
  const joined = [first, last].filter(Boolean).join(' ').trim();
  return {
    name: pickField(raw, ['name','customer_name','homeowner_name','full_name','display_name','contact_name'], joined || 'Unknown Customer'),
    address: pickField(raw, ['address','property_address','street_address','full_address','job_address'], ''),
    phone: pickField(raw, ['phone','phone_number','mobile','cell','cell_phone'], ''),
    email: pickField(raw, ['email','email_address'], '')
  };
}

function attachCustomerFallback(job, customersById={}) {
  const customerId = job.customer_id || job.customerId || job.client_id || job.homeowner_id;
  const fromCustomerTable = customerId ? customersById[String(customerId)] : null;
  const fallback = normalizeCustomer(job);
  const normalized = normalizeCustomer(fromCustomerTable || {});
  return {
    ...job,
    customers: {
      name: normalized.name !== 'Unknown Customer' ? normalized.name : fallback.name,
      address: normalized.address || fallback.address,
      phone: normalized.phone || fallback.phone,
      email: normalized.email || fallback.email
    }
  };
}

async function loadJobsSafe({ limit=null }={}) {
  let q = _sb.from('jobs').select('*').order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  const { data: jobs, error } = await q;
  if (error) throw error;

  const ids = [...new Set((jobs || [])
    .map(j => j.customer_id || j.customerId || j.client_id || j.homeowner_id)
    .filter(Boolean)
    .map(String))];

  let customersById = {};
  if (ids.length) {
    const { data: customers, error: custErr } = await _sb.from('customers').select('*').in('id', ids);
    if (!custErr && customers?.length) {
      customersById = Object.fromEntries(customers.map(c => [String(c.id), c]));
    }
  }

  return (jobs || []).map(j => attachCustomerFallback(j, customersById));
}


// ══════════════════════════════════════════════════════════════
// RENDER ROUTER
// ══════════════════════════════════════════════════════════════
async function renderPage(id) {
  const c = document.getElementById('content');
  switch(id) {
    case 'dashboard':      await pageDashboard(c); break;
    case 'pipeline':       await pagePipeline(c); break;
    case 'customers':      await pageCustomers(c); break;
    case 'customer-tracker': await pageCustomerTracker(c); break;
    case 'sales-board':    await pageSalesBoard(c); break;
    case 'inspection':     pageInspection(c); break;
    case 'measuring':      pageMeasuring(c); break;
    case 'estimates':      await pageEstimates(c); break;
    case 'estimates-list': await pageEstimatesList(c); break;
    case 'appointments':   await pageAppointments(c); break;
    case 'tasks':          await pageTasks(c); break;
    case 'campaigns':      await pageCampaigns(c); break;
    case 'announcements':  await pageAnnouncements(c); break;
    case 'team':           await pageTeam(c); break;
    case 'pricing':        await pagePricing(c); break;
    case 'sales-metrics':  await pageSalesMetrics(c); break;
    case 'marketing-roi':  await pageMarketingROI(c); break;
    case 'financing':      pageFinancing(c); break;
    case 'objections':     pageObjections(c); break;
    case 'closing':        pageClosing(c); break;
    case 'followup':       pageFollowup(c); break;
    case 'reports':        await pageReports(c); break;
    case 'notifications':  await pageNotifications(c); break;
    case 'supplements':    await pageSupplements(c); break;
    case 'claims':         await pageClaims(c); break;
    case 'photos':         pagePhotos(c); break;
    case 'storm':          pageStorm(c); break;
    case 'hail-intelligence': await pageHailIntelligence(c); break;
    case 'reviews':        pageReviews(c); break;
    case 'storage':        pageStorage(c); break;
    default:
      c.innerHTML = `<div class="page-wrap"><div class="empty-state"><div class="icon">🚧</div><h3>Coming Soon</h3><p>This feature is in development.</p></div></div>`;
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ══════════════════════════════════════════════════════════════
async function pageDashboard(c) {
  c.innerHTML = `<div class="page-wrap"><div class="stat-cards"><div class="stat-card sc-blue"><div class="sc-label">Pipeline</div><div class="sc-val" id="d-pipeline">—</div></div><div class="stat-card sc-green"><div class="sc-label">Closed MTD</div><div class="sc-val" id="d-closed">—</div></div><div class="stat-card sc-orange"><div class="sc-label">Active Jobs</div><div class="sc-val" id="d-jobs">—</div></div><div class="stat-card sc-purple"><div class="sc-label">Today's Appts</div><div class="sc-val" id="d-appts">—</div></div></div><div style="display:grid;grid-template-columns:1fr 320px;gap:14px"><div class="card"><div class="card-hd"><div><div class="card-hd-title">Recent Activity</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Latest 10 updates</div></div></div><div class="card-body" id="d-activity"><div class="empty-state" style="padding:30px"><div class="icon">📋</div><p>No activity yet — create your first job to get started.</p></div></div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Today's Schedule</div><button class="btn btn-sm btn-primary" onclick="newApptModal()">+ Schedule</button></div><div class="card-body" id="d-appt-list"><p style="color:var(--text3);font-size:13px">No appointments today</p></div></div></div></div>`;
  try {
    const { data } = await _sb.from('v_dashboard_stats').select('*').single();
    if (data) {
      document.getElementById('d-pipeline').textContent = '$' + ((data.total_pipeline||0)/1000).toFixed(0) + 'K';
      document.getElementById('d-closed').textContent   = '$' + ((data.closed_mtd||0)/1000).toFixed(0) + 'K';
      document.getElementById('d-jobs').textContent     = data.active_jobs || 0;
      document.getElementById('d-appts').textContent    = data.todays_appointments || 0;
    }
    const { data: acts } = await _sb.from('v_activity_feed').select('*').limit(8);
    if (acts?.length) {
      document.getElementById('d-activity').innerHTML = acts.map(a =>
        `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:18px">${a.icon||'📌'}</span><div><div style="font-size:13px;font-weight:600">${a.title||''}</div><div style="font-size:12px;color:var(--text3)">${a.subtitle||''}</div></div></div>`
      ).join('');
    }
    const { data: appts } = await _sb.from('v_today_appointments').select('*').limit(5);
    if (appts?.length) {
      document.getElementById('d-appt-list').innerHTML = appts.map(a =>
        `<div style="padding:8px 0;border-bottom:1px solid var(--border)"><div style="font-size:13px;font-weight:600">${a.title||a.homeowner_name||'Appointment'}</div><div style="font-size:12px;color:var(--text3)">${a.time_label||''}</div></div>`
      ).join('');
    }
    refreshTopStats();
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════
// PAGE: PIPELINE
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
// KANBAN PIPELINE - DRAG & DROP
// ══════════════════════════════════════════════════════════════

let _pipelineView = 'sales'; // 'sales' or 'project'

async function pagePipeline(c) {
  const view = sessionStorage.getItem('pipeline_view') || 'sales';
  _pipelineView = view;
  
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div>
        <div class="page-title">Pipeline</div>
        <div class="page-sub">Drag jobs between stages</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm ${view === 'sales' ? 'btn-primary' : 'btn-outline'}" onclick="switchPipelineView('sales')">💰 Sales Pipeline</button>
        <button class="btn btn-sm ${view === 'project' ? 'btn-primary' : 'btn-outline'}" onclick="switchPipelineView('project')">🏗️ Project Pipeline</button>
        <button class="btn btn-primary" onclick="newJobModal()">+ New Job</button>
      </div>
    </div>
    
    <div id="kanban-board" style="display:flex;gap:12px;overflow-x:auto;padding-bottom:16px">
      <div style="text-align:center;padding:40px;color:var(--text3)">Loading pipeline...</div>
    </div>
  </div>`;
  
  await loadKanbanBoard();
}

function switchPipelineView(view) {
  sessionStorage.setItem('pipeline_view', view);
  _pipelineView = view;
  pagePipeline(document.getElementById('content'));
}

async function loadKanbanBoard() {
  const stages = _pipelineView === 'sales' 
    ? [
        { id: 'lead', label: '📋 Lead', color: '#3B82F6' },
        { id: 'inspection_scheduled', label: '📅 Inspection Scheduled', color: '#8B5CF6' },
        { id: 'inspected', label: '✅ Inspected', color: '#06B6D4' },
        { id: 'estimate_sent', label: '💰 Estimate Sent', color: '#F59E0B' },
        { id: 'contract_signed', label: '✍️ Contract Signed', color: '#10B981' }
      ]
    : [
        { id: 'in_production', label: '🏗️ In Production', color: '#3B82F6' },
        { id: 'complete', label: '🎉 Complete', color: '#10B981' },
        { id: 'invoiced', label: '📄 Invoiced', color: '#F59E0B' },
        { id: 'paid', label: '✨ Paid', color: '#22C55E' }
      ];
  
  try {
    // Load all jobs
    const { data: jobs } = await _sb
      .from('jobs')
      .select('*, customers(first_name, last_name, address, phone)')
      .in('status', stages.map(s => s.id))
      .order('created_at', { ascending: false });
    
    const board = document.getElementById('kanban-board');
    
    board.innerHTML = stages.map(stage => {
      const stageJobs = jobs?.filter(j => j.status === stage.id) || [];
      const totalValue = stageJobs.reduce((sum, j) => sum + (parseFloat(j.contract_value) || 0), 0);
      
      return `
        <div class="kanban-column" 
             ondrop="dropJob(event, '${stage.id}')" 
             ondragover="allowDrop(event)"
             style="min-width:280px;flex:1">
          <!-- Column Header -->
          <div style="background:${stage.color};color:white;padding:12px;border-radius:8px 8px 0 0;margin-bottom:8px">
            <div style="font-size:14px;font-weight:700;margin-bottom:4px">${stage.label}</div>
            <div style="font-size:11px;opacity:0.9">${stageJobs.length} jobs • $${totalValue.toLocaleString()}</div>
          </div>
          
          <!-- Job Cards -->
          <div style="display:flex;flex-direction:column;gap:8px;min-height:200px">
            ${stageJobs.map(j => `
              <div class="kanban-card" 
                   draggable="true" 
                   ondragstart="dragJob(event, '${j.id}')"
                   ondragend="event.currentTarget.style.opacity='1'; event.currentTarget.classList.remove('dragging'); _isDragging=false;"
                   onmousedown="_isDragging=false;"
                   onclick="if(!_isDragging) showJobDetail('${j.id}')"
                   style="background:white;padding:12px;border-radius:6px;border:1px solid var(--border);cursor:grab;transition:all .2s;user-select:none;-webkit-user-select:none">
                <div style="font-size:13px;font-weight:600;margin-bottom:4px">${j.customers?.first_name || ''} ${j.customers?.last_name || 'Unknown'}</div>
                <div style="font-size:11px;color:var(--text3);margin-bottom:6px">${j.customers?.address || 'No address'}</div>
                ${j.contract_value ? `<div style="font-size:14px;font-weight:700;color:var(--green)">$${Number(j.contract_value).toLocaleString()}</div>` : ''}
                ${j.customers?.phone ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">${j.customers.phone}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }).join('');
    
  } catch(e) {
    console.error('Load kanban error:', e);
    document.getElementById('kanban-board').innerHTML = '<div style="padding:40px;text-align:center;color:red">Error loading pipeline</div>';
  }
}

// Drag and Drop Handlers
_draggedJobId = null;
_isDragging = false;

function dragJob(event, jobId) {
  _draggedJobId = jobId;
  _isDragging = true;
  event.stopPropagation();
  event.currentTarget.classList.add('dragging');
  event.currentTarget.style.opacity = '0.45';
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', String(jobId));
  }
}

function allowDrop(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

async function dropJob(event, newStatus) {
  event.preventDefault();
  event.stopPropagation();
  const jobId = _draggedJobId || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);
  if (!jobId) return;
  try {
    const updates = { status: newStatus };
    if (newStatus === 'inspection_scheduled') updates.appointment_set_date = new Date().toISOString();
    if (['contract_signed','complete','invoiced','paid'].includes(newStatus)) updates.closed_date = new Date().toISOString();
    const { error } = await _sb.from('jobs').update(updates).eq('id', jobId);
    if (error) throw error;
    toast('Job moved to ' + newStatus.replace(/_/g, ' '), 'success');
    await handleStatusChange(jobId, null, newStatus);
    await loadKanbanBoard();
    refreshTopStats();
  } catch(e) {
    console.error('Drop job error:', e);
    toast('Failed to move job: ' + (e.message || 'unknown error'), 'error');
  } finally {
    _draggedJobId = null;
    _isDragging = false;
    document.querySelectorAll('.kanban-card').forEach(card => {
      card.style.opacity = '1';
      card.classList.remove('dragging');
    });
  }
}

// Add hover effects
const style = document.createElement('style');
style.textContent = `
  .kanban-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  
  .kanban-column {
    background: var(--gray);
    border-radius: 8px;
    padding: 0 0 16px 0;
  }
`;
document.head.appendChild(style);
// ══════════════════════════════════════════════════════════════
// JOB DETAIL MODAL - Full Context
// ══════════════════════════════════════════════════════════════

let _activeJob = null;
let _activeJobTab = 'details';

async function showJobDetail(jobId) {
  _activeJob = jobId;
  _activeJobTab = 'details';
  await refreshJobModal();
}

async function refreshJobModal() {
  if (!_activeJob) return;
  
  try {
    // Fetch job with customer info
    const { data: job } = await _sb
      .from('jobs')
      .select('*, customers(*)')
      .eq('id', _activeJob)
      .single();
    
    if (!job) return;
    
    // Fetch related data
    const { data: photos } = await _sb.from('job_photos').select('*').eq('job_id', _activeJob);
    const { data: docs } = await _sb.from('job_documents').select('*').eq('job_id', _activeJob);
    const { data: notes } = await _sb.from('customer_notes').select('*, profiles(full_name)').eq('job_id', _activeJob).order('created_at', { ascending: false });
    const { count: photoCount } = await _sb.from('job_photos').select('*', { count: 'exact', head: true }).eq('job_id', _activeJob);
    const { count: docCount } = await _sb.from('job_documents').select('*', { count: 'exact', head: true }).eq('job_id', _activeJob);
    
    const modal = document.querySelector('.modal-overlay.job-modal');
    if (modal) modal.remove();
    
    const newModal = document.createElement('div');
    newModal.className = 'modal-overlay job-modal';
    newModal.innerHTML = `<div class="modal-sheet" style="max-width:900px;max-height:90vh">
      <div class="modal-drag"></div>
      
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
            <h3 style="font-size:22px;font-weight:800;margin:0">Job #${job.id.substring(0,8)}</h3>
            <select class="fs" style="font-size:13px;padding:6px 12px" onchange="updateJobStatusQuick('${job.id}', this.value)">
              <option value="lead" ${job.status === 'lead' ? 'selected' : ''}>📋 Lead</option>
              <option value="inspection_scheduled" ${job.status === 'inspection_scheduled' ? 'selected' : ''}>📅 Inspection Scheduled</option>
              <option value="inspected" ${job.status === 'inspected' ? 'selected' : ''}>✅ Inspected</option>
              <option value="estimate_sent" ${job.status === 'estimate_sent' ? 'selected' : ''}>💰 Estimate Sent</option>
              <option value="contract_signed" ${job.status === 'contract_signed' ? 'selected' : ''}>✍️ Contract Signed</option>
              <option value="in_production" ${job.status === 'in_production' ? 'selected' : ''}>🏗️ In Production</option>
              <option value="complete" ${job.status === 'complete' ? 'selected' : ''}>🎉 Complete</option>
              <option value="paid" ${job.status === 'paid' ? 'selected' : ''}>✨ Paid</option>
              <option value="lost" ${job.status === 'lost' ? 'selected' : ''}>❌ Lost</option>
            </select>
          </div>
          
          <!-- Customer Info -->
          <div style="background:var(--gray);padding:12px;border-radius:8px">
            <div style="font-size:16px;font-weight:700;margin-bottom:4px">${job.customers.first_name} ${job.customers.last_name}</div>
            <div style="font-size:13px;color:var(--text2);display:flex;gap:16px;flex-wrap:wrap">
              ${job.customers.phone ? `<span>📞 ${job.customers.phone}</span>` : ''}
              ${job.customers.email ? `<span>✉️ ${job.customers.email}</span>` : ''}
            </div>
            ${job.customers.address ? `<div style="font-size:13px;color:var(--text3);margin-top:4px">📍 ${job.customers.address}${job.customers.city ? ', ' + job.customers.city : ''}${job.customers.state ? ', ' + job.customers.state : ''}</div>` : ''}
          </div>
        </div>
        
        <div style="display:flex;gap:8px">
          <button class="btn btn-outline" onclick="showCustomerModal('${job.customer_id}'); document.querySelector('.job-modal')?.remove()">👤 View Customer</button>
          <button class="btn btn-outline" onclick="closeJobModal()">✕</button>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:16px">
        ${job.contract_value ? `<div style="background:var(--green-lt);padding:12px;border-radius:6px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Contract Value</div>
          <div style="font-size:18px;font-weight:800;color:var(--green)">$${Number(job.contract_value).toLocaleString()}</div>
        </div>` : ''}
        <div style="background:var(--blue-lt);padding:12px;border-radius:6px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Photos</div>
          <div style="font-size:18px;font-weight:800;color:var(--blue)">${photoCount || 0}</div>
        </div>
        <div style="background:var(--orange-lt);padding:12px;border-radius:6px;text-align:center">
          <div style="font-size:11px;color:var(--text3);margin-bottom:2px">Documents</div>
          <div style="font-size:18px;font-weight:800;color:var(--orange)">${docCount || 0}</div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="scheduleAppointment('${job.id}')">📅 Schedule</button>
        <button class="btn btn-sm btn-outline" onclick="openEstimateBuilder('${job.id}')">💰 Estimate</button>
        <button class="btn btn-sm btn-outline" onclick="composeEmail('${job.customer_id}', '${job.id}')">✉️ Email</button>
        <button class="btn btn-sm btn-outline" onclick="uploadPhotos('${job.id}')">📸 Photos</button>
        <button class="btn btn-sm btn-outline" onclick="uploadDocuments('${job.id}')">📄 Docs</button>
        <button class="btn btn-sm btn-outline" onclick="addCustomerNote('${job.customer_id}', '${job.id}')">📝 Add Note</button>
        ${job.customer_tracking_code ? `<button class="btn btn-sm btn-outline" onclick="copyTrackingLink('${job.id}','${job.customer_tracking_code}')">📍 Tracking</button>` : ''}
        ${job.quote_code ? `<button class="btn btn-sm btn-outline" onclick="copyQuoteLink('${job.quote_code}')">💰 Quote</button>` : ''}
      </div>
      
      <!-- Tabs -->
      <div style="border-bottom:2px solid var(--border);margin-bottom:16px">
        <div style="display:flex;gap:24px">
          <button class="tab-btn ${_activeJobTab === 'details' ? 'active' : ''}" onclick="switchJobTab('details')">Details</button>
          <button class="tab-btn ${_activeJobTab === 'photos' ? 'active' : ''}" onclick="switchJobTab('photos')">Photos (${photoCount || 0})</button>
          <button class="tab-btn ${_activeJobTab === 'docs' ? 'active' : ''}" onclick="switchJobTab('docs')">Documents (${docCount || 0})</button>
          <button class="tab-btn ${_activeJobTab === 'notes' ? 'active' : ''}" onclick="switchJobTab('notes')">Notes (${notes?.length || 0})</button>
          <button class="tab-btn ${_activeJobTab === 'timeline' ? 'active' : ''}" onclick="switchJobTab('timeline')">Timeline</button>
        </div>
      </div>
      
      <!-- Tab Content -->
      <div id="job-tab-content" style="max-height:400px;overflow-y:auto">
        ${renderJobTabContent(_activeJobTab, job, photos, docs, notes)}
      </div>
    </div>`;
    
    document.body.appendChild(newModal);
    newModal.addEventListener('click', e => { if (e.target === newModal) closeJobModal(); });
    
  } catch(e) {
    console.error('Job modal error:', e);
    toast('Failed to load job', 'error');
  }
}

function switchJobTab(tab) {
  _activeJobTab = tab;
  refreshJobModal();
}

function closeJobModal() {
  document.querySelector('.job-modal')?.remove();
  _activeJob = null;
  _activeJobTab = 'details';
}

function renderJobTabContent(tab, job, photos, docs, notes) {
  if (tab === 'details') {
    return `<div style="padding:16px">
      <div class="form-grid">
        <div class="fg"><label class="fl">Job Type</label><div style="padding:8px">${job.job_type || '—'}</div></div>
        <div class="fg"><label class="fl">Marketing Channel</label><div style="padding:8px">${job.marketing_channel || '—'}</div></div>
        ${job.insurance_company ? `<div class="fg"><label class="fl">Insurance Company</label><div style="padding:8px">${job.insurance_company}</div></div>` : ''}
        ${job.claim_number ? `<div class="fg"><label class="fl">Claim Number</label><div style="padding:8px">${job.claim_number}</div></div>` : ''}
        <div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="job-notes-edit" rows="4">${job.notes || ''}</textarea></div>
      </div>
      <button class="btn btn-primary" onclick="saveJobNotes('${job.id}')" style="margin-top:12px">💾 Save Notes</button>
    </div>`;
  } else if (tab === 'photos') {
    if (!photos || photos.length === 0) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">No photos yet</div>';
    }
    return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;padding:16px">
      ${photos.map(p => `
        <div style="position:relative;aspect-ratio:1;border-radius:8px;overflow:hidden">
          <img src="${p.photo_url}" style="width:100%;height:100%;object-fit:cover" onclick="window.open('${p.photo_url}', '_blank')">
          ${p.caption ? `<div style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.7);color:white;padding:6px;font-size:11px">${p.caption}</div>` : ''}
        </div>
      `).join('')}
    </div>`;
  } else if (tab === 'docs') {
    if (!docs || docs.length === 0) {
      return '<div style="text-align:center;padding:40px;color:var(--text3)">No documents yet</div>';
    }
    return `<div style="padding:16px;display:flex;flex-direction:column;gap:8px">
      ${docs.map(d => `
        <div style="padding:12px;background:var(--gray);border-radius:6px;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:13px;font-weight:600">${d.document_name}</div>
            <div style="font-size:11px;color:var(--text3)">${d.document_type} • ${(d.file_size / 1024).toFixed(1)} KB</div>
          </div>
          <a href="${d.document_url}" target="_blank" class="btn btn-sm btn-outline">📥 Download</a>
        </div>
      `).join('')}
    </div>`;
  } else if (tab === 'notes') {
    return renderNotesTab(job.customer_id, job.id);
  } else if (tab === 'timeline') {
    return renderTimelineTabEnhanced([], [], job.customer_id);
  }
  return '';
}

async function updateJobStatusQuick(jobId, newStatus) {
  try {
    const updates = { status: newStatus };
    
    if (newStatus === 'inspection_scheduled') updates.appointment_set_date = new Date().toISOString();
    if (['complete', 'paid'].includes(newStatus)) updates.closed_date = new Date().toISOString();
    
    const { error } = await _sb.from('jobs').update(updates).eq('id', jobId);
    if (error) throw error;
    
    toast('Status updated!', 'success');
    await refreshJobModal();
  } catch(e) {
    toast('Failed to update: ' + e.message, 'error');
  }
}
async function pagePipelineLegacy(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Pipeline</div><div class="page-sub">All active jobs by stage</div></div><button class="btn btn-primary" onclick="newJobModal()">+ New Job</button></div>
    <div class="pipe-cols">
      <div class="pcol"><div class="pcol-hd lead"><span class="pcol-title">New Lead</span><span class="pcol-ct" id="ct-lead">0</span></div><div class="pcol-body" id="pb-lead"><div class="empty-pipe">No leads yet</div></div></div>
      <div class="pcol"><div class="pcol-hd inspect"><span class="pcol-title">Inspection</span><span class="pcol-ct" id="ct-inspect">0</span></div><div class="pcol-body" id="pb-inspect"><div class="empty-pipe">No inspections</div></div></div>
      <div class="pcol"><div class="pcol-hd estimate"><span class="pcol-title">Estimate Sent</span><span class="pcol-ct" id="ct-estimate">0</span></div><div class="pcol-body" id="pb-estimate"><div class="empty-pipe">No estimates sent</div></div></div>
      <div class="pcol"><div class="pcol-hd closed"><span class="pcol-title">Closed Won</span><span class="pcol-ct" id="ct-closed">0</span></div><div class="pcol-body" id="pb-closed"><div class="empty-pipe">No closed jobs</div></div></div>
    </div>
  </div>`;
  try {
    const jobs = await loadJobsSafe();
    if (jobs?.length) {
      const stages = { lead: [], inspection: [], estimate: [], closed: [] };
      jobs.forEach(j => {
        const s = j.status || 'lead';
        const key = s === 'new_lead' ? 'lead' : s === 'closed_won' ? 'closed' : s === 'estimate_sent' ? 'estimate' : s;
        if (stages[key]) stages[key].push(j);
      });
      Object.entries(stages).forEach(([stage, list]) => {
        document.getElementById('ct-' + stage).textContent = list.length;
        document.getElementById('pb-' + stage).innerHTML = list.length
          ? list.map(j => `<div class="pcard ${stage}" onclick='showJobModal(${JSON.stringify(j)})'>
              <div class="pcard-name">${j.customers?.name || 'Unknown'}</div>
              <div class="pcard-val">${j.contract_value ? '$' + Number(j.contract_value).toLocaleString() : 'TBD'}</div>
              <div class="pcard-tag">${j.address || j.customers?.address || ''}</div>
            </div>`).join('')
          : `<div class="empty-pipe">No ${stage}</div>`;
      });
    }
  } catch(e) {}
}


// ══════════════════════════════════════════════════════════════
// PAGE: SALES BOARD KANBAN
// ══════════════════════════════════════════════════════════════
const SALES_STAGES = [
  { id:'lead', label:'Lead', color:'blue' },
  { id:'inspection_scheduled', label:'Inspection Scheduled', color:'orange' },
  { id:'inspected', label:'Inspected', color:'blue' },
  { id:'estimate_sent', label:'Estimate Sent', color:'purple' },
  { id:'contract_signed', label:'Contract Signed', color:'green' },
  { id:'lost', label:'Lost / Nurture', color:'gray' }
];

async function pageSalesBoard(c, view='kanban') {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div><div class="page-title">Sales Board</div><div class="page-sub">Drag and drop customers through the sales stages</div></div>
      <div class="view-toggle">
        <button class="btn btn-sm ${view==='kanban'?'active':'btn-outline'}" onclick="pageSalesBoard(document.getElementById('content'),'kanban')">Kanban</button>
        <button class="btn btn-sm ${view==='list'?'active':'btn-outline'}" onclick="pageSalesBoard(document.getElementById('content'),'list')">List</button>
      </div>
    </div>
    <div id="sales-board-body"><div class="card"><div class="card-body">Loading sales board...</div></div></div>
  </div>`;
  try {
    const jobs = await loadJobsSafe();
    if (view === 'list') renderSalesList(jobs || []); else renderSalesKanban(jobs || []);
  } catch(e) {
    document.getElementById('sales-board-body').innerHTML = `<div class="card"><div class="card-body"><div class="alert alert-warn">Unable to load jobs. ${escHtml(e.message || '')}</div></div></div>`;
  }
}

function jobStage(job) {
  const raw = job.status || 'lead';
  if (raw === 'new_lead') return 'lead';
  if (raw === 'inspection') return 'inspection_scheduled';
  if (raw === 'estimate') return 'estimate_sent';
  if (raw === 'closed' || raw === 'closed_won') return 'contract_signed';
  return raw;
}

function renderSalesKanban(jobs) {
  const body = document.getElementById('sales-board-body');
  const grouped = SALES_STAGES.reduce((acc, st) => (acc[st.id]=[], acc), {});
  jobs.forEach(j => (grouped[jobStage(j)] || grouped.lead).push(j));
  body.innerHTML = `<div class="kanban-board">${SALES_STAGES.map(st => `
    <div class="kanban-col" data-stage="${st.id}" ondragover="salesDragOver(event)" ondragleave="salesDragLeave(event)" ondrop="dropSalesJob(event,'${st.id}')">
      <div class="kanban-hd"><span class="kanban-title">${st.label}</span><span class="pcol-ct">${grouped[st.id].length}</span></div>
      <div class="kanban-body" id="sales-stage-${st.id}">
        ${grouped[st.id].length ? grouped[st.id].map(renderSalesCard).join('') : `<div class="empty-pipe">Drop jobs here</div>`}
      </div>
    </div>`).join('')}</div>`;
}

function renderSalesCard(j) {
  const name = ((j.customers?.first_name || '') + ' ' + (j.customers?.last_name || '')).trim() || j.customers?.name || j.customer_name || 'Unknown Customer';
  const address = j.customers?.address || j.address || '';
  const amount = j.contract_value || j.contract_amount || j.estimate_amount || j.total_amount || 0;
  return `<div class="kanban-card" draggable="true" data-job-id="${j.id}" ondragstart="startSalesDrag(event)" ondragend="endSalesDrag(event)" onclick="showJobDetail('${j.id}')">
    <div class="kanban-name">${escHtml(name)}</div>
    <div class="kanban-meta">${escHtml(address)}</div>
    <div class="kanban-meta">${escHtml(j.customers?.phone || j.phone || '')}</div>
    <div class="kanban-val">${amount ? '$'+Number(amount).toLocaleString() : 'TBD'}</div>
  </div>`;
}

function renderSalesList(jobs) {
  const body = document.getElementById('sales-board-body');
  if (!jobs.length) {
    body.innerHTML = `<div class="card"><div class="card-body"><div class="empty-state"><div class="icon">📈</div><h3>No Sales Jobs Yet</h3><p>Create a job in Pipeline and it will appear here.</p></div></div></div>`;
    return;
  }
  body.innerHTML = `<div class="card"><div class="card-body"><table class="tbl"><thead><tr><th>Customer</th><th>Address</th><th>Stage</th><th>Amount</th></tr></thead><tbody>${jobs.map(j => {
    const st = SALES_STAGES.find(s => s.id === jobStage(j));
    const amount = j.contract_value || j.contract_amount || j.estimate_amount || j.total_amount || 0;
    return `<tr><td><strong>${escHtml(((j.customers?.first_name || '') + ' ' + (j.customers?.last_name || '')).trim() || j.customers?.name || j.customer_name || 'Unknown')}</strong></td><td style="color:var(--text2)">${escHtml(j.customers?.address || j.address || '')}</td><td><span class="badge badge-${st?.color||'gray'}">${st?.label || jobStage(j)}</span></td><td>${amount ? '$'+Number(amount).toLocaleString() : '—'}</td></tr>`;
  }).join('')}</tbody></table></div></div>`;
}

function startSalesDrag(e) {
  e.stopPropagation();
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.jobId);
  e.currentTarget.classList.add('dragging');
}
function endSalesDrag(e) { e.currentTarget.classList.remove('dragging'); }
function salesDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.classList.add('drag-over'); }
function salesDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
async function dropSalesJob(e, stage) {
  e.preventDefault();
  e.stopPropagation();
  e.currentTarget.classList.remove('drag-over');
  const jobId = e.dataTransfer.getData('text/plain');
  if (!jobId) return;
  try {
    const { error } = await _sb.from('jobs').update({ status: stage }).eq('id', jobId);
    if (error) throw error;
    toast('Sales stage updated', 'success');
    await handleStatusChange(jobId, null, stage);
    await pageSalesBoard(document.getElementById('content'), 'kanban');
    refreshTopStats();
  } catch(err) {
    toast('Could not update stage: ' + (err.message || 'permission denied'), 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE: ROOF INSPECTOR (AI)
// ══════════════════════════════════════════════════════════════
function pageInspection(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div><div class="page-title">Roof Inspector</div><div class="page-sub">Fill form · Generate AI report with Claude</div></div>
      <button class="btn btn-primary" onclick="generateAIReport()">✨ Generate AI Report</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 320px;gap:14px">
      <div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">Property & Contact</div></div><div class="card-body">
          <div class="form-grid">
            <div class="fg"><label class="fl">Homeowner Name</label><input class="fi" id="i-name" placeholder=""></div>
            <div class="fg"><label class="fl">Phone</label><input class="fi" id="i-phone" type="tel" placeholder=""></div>
            <div class="fg fg-full"><label class="fl">Property Address</label><input class="fi" id="i-addr" placeholder=""></div>
          </div>
        </div></div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">Roof Assessment</div></div><div class="card-body">
          <div class="form-grid">
            <div class="fg"><label class="fl">Roof Age (Years)</label><input class="fi" id="i-age" type="number" inputmode="numeric"></div>
            <div class="fg"><label class="fl">Square Footage</label><input class="fi" id="i-sqft" type="number" inputmode="numeric"></div>
            <div class="fg"><label class="fl">Material</label><select class="fs" id="i-material"><option>Asphalt Shingles</option><option>Metal</option><option>Tile</option><option>Flat/TPO</option></select></div>
            <div class="fg"><label class="fl">Pitch</label><select class="fs" id="i-pitch"><option>Low (2-3/12)</option><option>Medium (4-6/12)</option><option>Steep (7-9/12)</option><option>Very Steep (10+/12)</option></select></div>
            <div class="fg"><label class="fl">Stories</label><select class="fs" id="i-stories"><option>1</option><option>2</option><option>3+</option></select></div>
            <div class="fg"><label class="fl">Damage Severity</label><select class="fs" id="i-severity"><option>Severe</option><option>Moderate</option><option>Minor</option><option>No Visible Damage</option></select></div>
          </div>
          <div style="margin-top:14px">
            <div class="fl" style="margin-bottom:8px">Damage Types</div>
            <div class="tag-row" id="dmg-tags">
              ` + (['Hail','Wind','Impact','Granule Loss','Missing Shingles','Flashing Damage','Gutter Damage','Skylight Damage','Chimney/Flashing'].map(d =>
                `<span class="tag" onclick="this.classList.toggle('sel')">${d}</span>`).join('')) + `
            </div>
          </div>
          <div style="margin-top:14px">
            <div class="fg"><label class="fl">Adjuster Notes</label><textarea class="fi" id="i-notes" placeholder="Damage observations..." rows="3"></textarea></div>
          </div>
        </div></div>
      </div>
      <div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">📸 Photos</div><span style="font-size:11px;color:var(--green)">Compressed on device</span></div>
          <div class="card-body">
            <div style="border:2px dashed var(--border);border-radius:8px;padding:24px;text-align:center;cursor:pointer" onclick="document.getElementById(\'photo-input\').click()">
              <div style="font-size:28px;margin-bottom:6px">📷</div>
              <div style="font-size:13px;font-weight:600">Tap to upload photos</div>
              <div style="font-size:11px;color:var(--text3)">Compressed · Stored in Supabase</div>
            </div>
            <input type="file" id="photo-input" multiple accept="image/*" class="hidden" onchange="handlePhotoUpload(event)">
            <div id="photo-preview" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-top:10px"></div>
          </div>
        </div>
        <div class="card"><div class="card-hd"><div class="card-hd-title">✨ AI Report</div></div>
          <div class="card-body">
            <div class="ai-panel">
              <div class="ai-hd"><span>🤖</span><span class="ai-badge">CLAUDE AI</span></div>
              <div class="ai-text" id="insp-report-out">Click "Generate AI Report" to create a professional inspection narrative.</div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn btn-primary btn-sm" onclick="generateAIReport()">✨ Generate</button>
              <button class="btn btn-sm btn-outline" onclick="copyTxt(document.getElementById(\'insp-report-out\').innerText, this)">📋 Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

async function generateAIReport() {
  const name     = document.getElementById('i-name')?.value || '';
  const addr     = document.getElementById('i-addr')?.value || '';
  const age      = document.getElementById('i-age')?.value || '';
  const sqft     = document.getElementById('i-sqft')?.value || '';
  const material = document.getElementById('i-material')?.value || 'Asphalt Shingles';
  const pitch    = document.getElementById('i-pitch')?.value || '';
  const stories  = document.getElementById('i-stories')?.value || '';
  const severity = document.getElementById('i-severity')?.value || '';
  const notes    = document.getElementById('i-notes')?.value || '';
  const dmgTags  = [...document.querySelectorAll('#dmg-tags .tag.sel')].map(t => t.textContent);
  const out      = document.getElementById('insp-report-out');
  if (!out) return;
  out.innerHTML = `<em>✨ Generating report...</em>`;
  try {
    const { data, error } = await _sb.functions.invoke('generate-inspection-report', {
      body: { homeowner_name: name, property_address: addr, roof_age: age, square_footage: sqft,
              material, pitch, stories, damage_severity: severity, damage_types: dmgTags, adjuster_notes: notes }
    });
    if (error) throw new Error(error.message);
    out.innerHTML = (data?.report || 'Report generated.').replace(/\n/g, '<br>');
    toast('Report generated', 'ok');
  } catch(e) {
    out.innerHTML = `<span style="color:#FCA5A5">Error: ` + (e.message) + `</span>`;
    toast('Report generation failed', 'error');
  }
}

async function handlePhotoUpload(event) {
  const files = [...event.target.files];
  if (!files.length) return;
  const preview = document.getElementById('photo-preview');
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.cssText = 'width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
  toast(`${files.length} photo(s) added`, 'ok');
}

// ══════════════════════════════════════════════════════════════
// PAGE: MEASURING (Satellite)
// ══════════════════════════════════════════════════════════════
function pageMeasuring(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Roof Measuring</div><div class="page-sub">Satellite polygon measuring tool</div></div></div>
    <div class="card"><div class="card-body">
      <div class="alert alert-info">🛰️ Satellite measuring tool — coming soon. Polygon drawing over Google Maps satellite imagery for precise square footage measurements.</div>
      <div class="empty-state"><div class="icon">🗺️</div><h3>Roof Measuring Tool</h3><p>Draw polygons over satellite imagery to calculate exact roof squares without climbing the roof.</p></div>
    </div></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// PAGE: PHOTOS
// ══════════════════════════════════════════════════════════════
function pagePhotos(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Photo Manager</div><div class="page-sub">Job photos · Cloud archived · Auto-organized</div></div></div>
    <div class="card"><div class="card-body">
      <div class="empty-state"><div class="icon">📸</div><h3>No Photos Yet</h3><p>Photos uploaded from the Roof Inspector are stored here, organized by job.</p></div>
    </div></div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// PAGE: CLAIMS
// ══════════════════════════════════════════════════════════════
async function pageClaims(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Claim Tracker</div><div class="page-sub">Insurance claim status by job</div></div><button class="btn btn-primary" onclick="newJobModal()">+ New Job</button></div>
    <div class="card"><div class="card-body" id="claims-body">
      <div class="empty-state"><div class="icon">🏠</div><h3>No Jobs Yet</h3><p>Jobs created in the Pipeline will appear here with their insurance claim status.</p></div>
    </div></div>
  </div>`;
  try {
    const data = await loadJobsSafe({ limit: 20 });
    if (data?.length) {
      document.getElementById('claims-body').innerHTML = `<table class="tbl">
        <thead><tr><th>Customer</th><th>Address</th><th>Status</th><th>Amount</th></tr></thead>
        <tbody>` + (data.map(j => `<tr>
          <td><strong>${j.customers?.name||'Unknown'}</strong></td>
          <td style="color:var(--text2)">${j.customers?.address||''}</td>
          <td><span class="badge badge-${j.status==='closed_won'?'green':j.status==='estimate_sent'?'purple':'blue'}">${j.status||'new_lead'}</span></td>
          <td>${j.contract_amount ? '$'+Number(j.contract_amount).toLocaleString() : '—'}</td>
        </tr>`).join('')) + `</tbody></table>`;
    }
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════
// PAGE: SUPPLEMENTS
// ══════════════════════════════════════════════════════════════
async function pageSupplements(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Supplements</div><div class="page-sub">AI-drafted supplement request letters</div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
      <div class="card"><div class="card-hd"><div class="card-hd-title">Generate Supplement Letter</div></div><div class="card-body">
        <div class="form-grid">
          <div class="fg"><label class="fl">Homeowner Name</label><input class="fi" id="sup-name" placeholder=""></div>
          <div class="fg"><label class="fl">Claim #</label><input class="fi" id="sup-claim" placeholder=""></div>
          <div class="fg"><label class="fl">Insurance Co.</label><input class="fi" id="sup-ins" placeholder="State Farm, Allstate..."></div>
          <div class="fg"><label class="fl">Original Approval</label><input class="fi" id="sup-orig" placeholder="$0.00"></div>
          <div class="fg fg-full"><label class="fl">Items Being Supplemented</label><textarea class="fi" id="sup-items" rows="3" placeholder="Ice & water shield, steep pitch labor, drip edge LF..."></textarea></div>
        </div>
        <button class="btn btn-primary" style="margin-top:12px;width:100%;justify-content:center" onclick="generateSupLetter()">✨ Generate Letter</button>
      </div></div>
      <div class="card"><div class="card-hd"><div class="card-hd-title">✨ AI Letter</div><button class="btn btn-sm btn-outline" onclick="copyTxt(document.getElementById(\'sup-out\').innerText,this)">📋 Copy</button></div>
        <div class="card-body">
          <div class="ai-panel">
            <div class="ai-hd"><span>📄</span><span class="ai-badge">CLAUDE AI</span></div>
            <div class="ai-text" id="sup-out">Fill in the details and click Generate Letter.</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
  try {
    const { data } = await _sb.from('supplement_requests').select('*').order('created_at', { ascending: false }).limit(5);
    if (data?.length) toast(`${data.length} supplement(s) on record`, 'ok');
  } catch(e) {}
}

async function generateSupLetter() {
  const name  = document.getElementById('sup-name')?.value || '';
  const claim = document.getElementById('sup-claim')?.value || '';
  const ins   = document.getElementById('sup-ins')?.value || '';
  const orig  = document.getElementById('sup-orig')?.value || '';
  const items = document.getElementById('sup-items')?.value || '';
  const out   = document.getElementById('sup-out');
  if (!items) { toast('Add items to supplement first', 'warn'); return; }
  out.innerHTML = `<em>✨ Writing letter...</em>`;
  try {
    const { data, error } = await _sb.functions.invoke('generate-supplement-letter', {
      body: { homeowner_name: name, claim_number: claim, insurance_company: ins, original_approval: orig, supplement_items: items }
    });
    if (error) throw new Error(error.message);
    out.innerHTML = (data?.letter || 'Letter generated.').replace(/\n/g, '<br>');
    toast('Letter generated', 'ok');
  } catch(e) {
    out.innerHTML = `<span style="color:#FCA5A5">Error: ` + (e.message) + `</span>`;
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE: APPOINTMENTS
// ══════════════════════════════════════════════════════════════
async function pageAppointments(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Appointments</div><div class="page-sub">Schedule & manage inspections</div></div><button class="btn btn-primary" onclick="newApptModal()">+ Schedule</button></div>
    <div class="card"><div class="card-body" id="appt-body">
      <div class="empty-state"><div class="icon">📅</div><h3>No Appointments</h3><p>Schedule an inspection or follow-up appointment.</p></div>
    </div></div>
  </div>`;
  try {
    const { data } = await _sb.from('appointments').select('*, customers(name)').order('scheduled_at').limit(20);
    if (data?.length) {
      document.getElementById('appt-body').innerHTML = `<table class="tbl">
        <thead><tr><th>Date/Time</th><th>Customer</th><th>Type</th><th>Status</th></tr></thead>
        <tbody>` + (data.map(a => `<tr>
          <td>${new Date(a.scheduled_at).toLocaleString()}</td>
          <td>${a.customers?.name||'—'}</td>
          <td><span class="badge badge-blue">${a.appointment_type||'inspection'}</span></td>
          <td><span class="badge badge-${a.status==='completed'?'green':a.status==='cancelled'?'red':'orange'}">${a.status||'scheduled'}</span></td>
        </tr>`).join('')) + `</tbody></table>`;
    }
  } catch(e) {}
}

function newApptModal() { toast('Appointment scheduler — coming in next update', 'warn'); }

// ══════════════════════════════════════════════════════════════
// PAGE: ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════
async function pageAnnouncements(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Message Board</div><div class="page-sub">Team announcements</div></div>` + (isAdmin()?'<button class="btn btn-primary" onclick="postAnnouncementModal()">+ Post</button>':'') + `</div>
    <div id="ann-body"><div class="empty-state"><div class="icon">📢</div><h3>No Announcements</h3><p>Team messages will appear here.</p></div></div>
  </div>`;
  try {
    const { data } = await _sb.from('announcements').select('*, profiles(email)').order('created_at', { ascending: false }).limit(20);
    if (data?.length) {
      document.getElementById('ann-body').innerHTML = data.map(a =>
        `<div class="card" style="margin-bottom:10px"><div class="card-body">
          <div style="font-size:15px;font-weight:700;margin-bottom:6px">${escHtml(a.title)}</div>
          <div style="font-size:14px;color:var(--text2);line-height:1.6;white-space:pre-wrap">${escHtml(a.body)}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:8px">${escHtml(a.profiles?.email || '')} · ${new Date(a.created_at).toLocaleDateString()}</div>
        </div></div>`).join('');
    }
  } catch(e) {}
}


function postAnnouncementModal() {
  if (!isAdmin()) {
    toast('Admin access required', 'warn');
    return;
  }

  document.getElementById('announcement-modal')?.remove();

  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.id = 'announcement-modal';
  modal.innerHTML = `
    <div class="modal-sheet">
      <div class="modal-drag"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:16px">
        <div>
          <div style="font-size:18px;font-weight:800;color:var(--navy)">Post Announcement</div>
          <div style="font-size:13px;color:var(--text2);margin-top:2px">Share a message with the team.</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="closeAnnouncementModal()">Cancel</button>
      </div>

      <div class="form-grid">
        <div class="fg fg-full">
          <label class="fl">Title</label>
          <input class="fi" id="ann-title" maxlength="120" placeholder="Example: Team meeting Friday">
        </div>
        <div class="fg fg-full">
          <label class="fl">Message</label>
          <textarea class="fi" id="ann-body-input" rows="5" placeholder="Write your announcement..."></textarea>
        </div>
      </div>

      <div id="ann-modal-err" class="login-err" style="margin-top:12px"></div>

      <div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">
        <button class="btn btn-outline" onclick="closeAnnouncementModal()">Close</button>
        <button class="btn btn-primary" id="ann-submit-btn" onclick="submitAnnouncement()">📢 Post Announcement</button>
      </div>
    </div>`;

  modal.addEventListener('click', (e) => {
    if (e.target.id === 'announcement-modal') closeAnnouncementModal();
  });

  document.body.appendChild(modal);
  setTimeout(() => document.getElementById('ann-title')?.focus(), 50);
}

function closeAnnouncementModal() {
  document.getElementById('announcement-modal')?.remove();
}

async function submitAnnouncement() {
  const title = document.getElementById('ann-title')?.value.trim();
  const body = document.getElementById('ann-body-input')?.value.trim();
  const err = document.getElementById('ann-modal-err');
  const btn = document.getElementById('ann-submit-btn');

  if (err) err.classList.remove('show');

  if (!title || !body) {
    if (err) {
      err.textContent = 'Add a title and message first.';
      err.classList.add('show');
    } else {
      toast('Add a title and message first', 'warn');
    }
    return;
  }

  if (!isAdmin()) {
    toast('Admin access required', 'warn');
    return;
  }

  try {
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Posting...';
    }

    const { error } = await _sb.from('announcements').insert({
      title,
      body,
      created_by: _user?.id
    });

    if (error) throw error;

    closeAnnouncementModal();
    toast('Announcement posted', 'ok');
    await pageAnnouncements(document.getElementById('content'));
  } catch(e) {
    if (err) {
      err.textContent = e.message || 'Unable to post announcement.';
      err.classList.add('show');
    } else {
      toast('Unable to post announcement', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📢 Post Announcement';
    }
  }
}


// ══════════════════════════════════════════════════════════════
// PAGE: TEAM
// ══════════════════════════════════════════════════════════════
async function pageTeam(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Team & Users</div><div class="page-sub">Manage employee profiles and contact info</div></div></div>
    <div class="card"><div class="card-body" id="team-body">Loading...</div></div>
  </div>`;
  try {
    const { data } = await _sb.from('profiles').select('*').order('created_at');
    
    if (!data || data.length === 0) {
      document.getElementById('team-body').innerHTML = '<div class="empty-state"><div class="icon">👥</div><h3>No Users Yet</h3></div>';
      return;
    }
    
    document.getElementById('team-body').innerHTML = `
      <table class="tbl">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Role</th>
            <th>Status</th>
            <th>Joined</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${data.map(u => `
            <tr>
              <td><strong>${u.full_name || 'No name'}</strong></td>
              <td>${u.email || '—'}</td>
              <td>${u.phone || '—'}</td>
              <td><span class="badge badge-${u.role==='admin'?'red':u.role==='manager'?'orange':'blue'}">${u.role || 'user'}</span></td>
              <td><span class="badge badge-${u.is_active?'green':'gray'}">${u.is_active ? 'Active' : 'Inactive'}</span></td>
              <td style="color:var(--text3)">${new Date(u.created_at).toLocaleDateString()}</td>
              <td><button class="btn btn-sm btn-outline" onclick="editUserProfile('${u.id}')">✏️ Edit</button></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch(e) { 
    console.error('Team load error:', e);
    document.getElementById('team-body').innerHTML = `<p style="color:red">Error loading team: ${e.message}</p>`; 
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE: PRICING
// ══════════════════════════════════════════════════════════════
async function pagePricing(c) {
  if (!isAdmin()) { c.innerHTML = `<div class="page-wrap"><div class="alert alert-warn">Admin access required to view pricing rates.</div></div>`; return; }
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div><div class="page-title">Pricing Rates</div><div class="page-sub">Admin only · Changes apply to all new estimates</div></div>
      <button class="btn btn-primary" onclick="applyCurrentMfrPricing()">↻ Load Current MFR Rates</button>
    </div>
    <div class="alert alert-info">Current system defaults are based on the 21-square quote: Duration Flex $14,289.12, Duration Storm $13,578.08, and 26g Tuff Rib $20,747.22. The button updates matching database rows and creates missing rows when allowed by Supabase.</div>
    <div class="card"><div class="card-hd"><div class="card-hd-title">Primary Option Rates (per square)</div><div style="font-size:11px;color:var(--text3)">PDF totals ÷ 21 squares</div></div>
      <div class="card-body" id="pricing-body">Loading...</div></div>
    <div class="card"><div class="card-hd"><div class="card-hd-title">Add-On Rates</div><div style="font-size:11px;color:var(--text3)">PDF totals ÷ listed quantity</div></div>
      <div class="card-body" id="addon-body">Loading...</div></div>
  </div>`;
  try {
    const { data: rates } = await _sb.from('pricing_rates').select('*').order('id');
    const { data: addons } = await _sb.from('addon_pricing_rates').select('*').order('id');
    if (rates?.length) {
      document.getElementById('pricing-body').innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">` + (
        rates.map(r => {
          const preset = findPricingPreset(r.name, MFR_CURRENT_PRICING.options);
          const suggested = preset ? `<div style="font-size:11px;color:var(--green);margin-bottom:8px">Current PDF rate: $${Number(preset.price_per_square).toFixed(2)}/sq</div>` : '';
          return `<div class="card" style="margin:0"><div class="card-body">
          <div style="font-size:13px;font-weight:700;margin-bottom:4px">${escHtml(r.name)}</div>
          <div style="font-size:24px;font-weight:800;color:var(--navy);margin-bottom:6px">$${Number(r.price_per_square).toFixed(2)}</div>
          ${suggested}
          <div style="display:flex;gap:6px">
            <input class="fi" style="flex:1" type="number" id="rate-${r.id}" value="${r.price_per_square}" step="0.01">
            <button class="btn btn-success btn-sm" onclick="saveRate(${r.id},'rate-${r.id}')">Save</button>
          </div>
        </div></div>`;
        }).join('')
      ) + '</div>';
    } else {
      document.getElementById('pricing-body').innerHTML = renderDefaultPricingPreview();
    }
    if (addons?.length) {
      document.getElementById('addon-body').innerHTML = `<table class="tbl"><thead><tr><th>Add-On</th><th>Method</th><th>Rate</th><th>PDF Current</th><th></th></tr></thead><tbody>` + (
        addons.map(a => {
          const preset = findPricingPreset(a.name, MFR_CURRENT_PRICING.addons);
          return `<tr>
          <td><strong>${escHtml(a.name)}</strong></td>
          <td style="color:var(--text2)">${escHtml(a.unit_label||'per unit')}</td>
          <td><input class="fi" style="width:100px" type="number" id="addon-${a.id}" value="${a.price}" step="0.01"></td>
          <td style="color:var(--green);font-size:12px">${preset ? '$'+Number(preset.price).toFixed(2)+'/'+preset.unit_label : '—'}</td>
          <td><button class="btn btn-success btn-sm" onclick="saveAddon(${a.id},'addon-${a.id}')">Save</button></td>
        </tr>`;
        }).join('')
      ) + `</tbody></table>`;
    } else {
      document.getElementById('addon-body').innerHTML = renderDefaultAddonPreview();
    }
  } catch(e) {
    document.getElementById('pricing-body').innerHTML = renderDefaultPricingPreview();
    document.getElementById('addon-body').innerHTML = renderDefaultAddonPreview();
    toast('Pricing table unavailable. Showing PDF defaults.', 'warn');
  }
}

function renderDefaultPricingPreview() {
  return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">${MFR_CURRENT_PRICING.options.map(o => `<div class="card" style="margin:0"><div class="card-body"><div style="font-size:13px;font-weight:700;margin-bottom:6px">${escHtml(o.name)}</div><div style="font-size:24px;font-weight:800;color:var(--navy)">$${o.price_per_square.toFixed(2)}<span style="font-size:12px;color:var(--text3)">/sq</span></div><div style="font-size:11px;color:var(--text3);margin-top:4px">PDF total: $${o.total.toLocaleString('en-US',{minimumFractionDigits:2})}</div></div></div>`).join('')}</div>`;
}

function renderDefaultAddonPreview() {
  return `<table class="tbl"><thead><tr><th>Add-On</th><th>PDF Total</th><th>Qty</th><th>Rate</th></tr></thead><tbody>${MFR_CURRENT_PRICING.addons.map(a => `<tr><td><strong>${escHtml(a.name)}</strong></td><td>$${a.total.toLocaleString('en-US',{minimumFractionDigits:2})}</td><td>${a.qty} ${a.unit_label}</td><td><strong>$${a.price.toFixed(2)}/${a.unit_label}</strong></td></tr>`).join('')}</tbody></table>`;
}

function normName(v) { return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
function findPricingPreset(name, list) {
  const n = normName(name);
  return list.find(item => normName(item.name) === n || (item.aliases||[]).some(a => n.includes(normName(a)) || normName(a).includes(n)));
}

async function applyCurrentMfrPricing() {
  if (!isAdmin()) { toast('Admin access required', 'warn'); return; }
  try {
    let updated = 0, created = 0;
    const { data: existingRates } = await _sb.from('pricing_rates').select('*');
    for (const preset of MFR_CURRENT_PRICING.options) {
      const match = (existingRates||[]).find(r => findPricingPreset(r.name, [preset]));
      if (match?.id) {
        const { error } = await _sb.from('pricing_rates').update({ name:preset.name, price_per_square:preset.price_per_square }).eq('id', match.id);
        if (!error) updated++;
      } else {
        const { error } = await _sb.from('pricing_rates').insert({ name:preset.name, price_per_square:preset.price_per_square });
        if (!error) created++;
      }
    }
    const { data: existingAddons } = await _sb.from('addon_pricing_rates').select('*');
    for (const preset of MFR_CURRENT_PRICING.addons) {
      const match = (existingAddons||[]).find(a => findPricingPreset(a.name, [preset]));
      if (match?.id) {
        const { error } = await _sb.from('addon_pricing_rates').update({ name:preset.name, price:preset.price, unit_label:preset.unit_label }).eq('id', match.id);
        if (!error) updated++;
      } else {
        const { error } = await _sb.from('addon_pricing_rates').insert({ name:preset.name, price:preset.price, unit_label:preset.unit_label });
        if (!error) created++;
      }
    }
    toast(`MFR rates loaded (${updated} updated, ${created} created)`, 'ok');
    await pagePricing(document.getElementById('content'));
  } catch(e) {
    toast('Unable to load current MFR rates: ' + (e.message || 'unknown error'), 'error');
  }
}

async function saveRate(id, inputId) {
  const val = parseFloat(document.getElementById(inputId).value);
  if (isNaN(val)) return;
  const { error } = await _sb.from('pricing_rates').update({ price_per_square: val }).eq('id', id);
  if (error) { toast('Save failed', 'error'); } else { toast('Rate saved', 'ok'); }
}

async function saveAddon(id, inputId) {
  const val = parseFloat(document.getElementById(inputId).value);
  if (isNaN(val)) return;
  const { error } = await _sb.from('addon_pricing_rates').update({ price: val }).eq('id', id);
  if (error) { toast('Save failed', 'error'); } else { toast('Rate saved', 'ok'); }
}

// ══════════════════════════════════════════════════════════════
// PAGE: ESTIMATES
// ══════════════════════════════════════════════════════════════
async function pageEstimates(c) {
  // Load customers for selector
  const { data: customers } = await _sb.from('customers').select('id, first_name, last_name, address, phone').order('last_name, first_name');
  
  // Check if coming from customer modal
  const preselectedJobId = sessionStorage.getItem('current_job_id');
  let preselectedCustomer = null;
  if (preselectedJobId) {
    const { data: job } = await _sb.from('jobs').select('customer_id, customers(*)').eq('id', preselectedJobId).single();
    if (job) preselectedCustomer = job.customer_id;
  }
  
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Estimates</div><div class="page-sub">Build quotes · Save to DB</div></div><div style="display:flex;gap:8px"><button class="btn btn-success" id="est-save-btn" onclick="saveEstimate()">💾 Save</button><button class="btn btn-primary" id="est-send-btn" onclick="sendQuoteFromEstimate()">📤 Send Quote</button></div></div>
    <div class="card"><div class="card-hd"><div class="card-hd-title">Saved Quotes</div></div><div class="card-body" id="est-saved-list"><div class="empty-state" style="padding:24px"><div class="icon">📋</div><h3>No Estimates Yet</h3><p>Build your first estimate below.</p></div></div></div>
    <div class="card"><div class="card-hd"><div class="card-hd-title">Estimate Builder</div><div style="font-size:11px;color:var(--text3)">All totals auto-calculate</div></div>
      <div class="card-body">
        <!-- Customer Selector -->
        <div style="background:var(--blue);color:white;padding:16px;border-radius:8px;margin-bottom:16px">
          <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px">SELECT CUSTOMER</div>
          <select class="fs" id="e-customer-select" onchange="selectEstimateCustomer()" style="font-size:14px;font-weight:600">
            <option value="">-- Create New Customer --</option>
            ${customers?.map(c => `<option value="${c.id}" ${preselectedCustomer === c.id ? 'selected' : ''}>${c.first_name} ${c.last_name} - ${c.phone || 'No phone'}</option>`).join('')}
          </select>
          <div style="font-size:11px;margin-top:8px;opacity:0.9">💡 Select existing customer or create new below</div>
        </div>
        
        <div class="form-grid" style="margin-bottom:16px">
          <div class="fg"><label class="fl">Customer Name</label><input class="fi" id="e-name" autocapitalize="words"></div>
          <div class="fg"><label class="fl">Date</label><input class="fi" type="date" id="e-date" value="` + (new Date().toISOString().slice(0,10)) + `"></div>
          <div class="fg fg-full"><label class="fl">Address</label><input class="fi" id="e-addr"></div>
          <div class="fg"><label class="fl">Consultant</label><input class="fi" id="e-consultant" value="` + (_profile?.email?.split('@')[0]||'') + `"></div>
          <div class="fg"><label class="fl">Project #</label><input class="fi" id="e-proj" value="` + (Math.floor(1000+Math.random()*9000)) + `"></div>
        </div>
        <div class="card" style="background:var(--gray)"><div class="card-hd"><div class="card-hd-title">📐 Roof Size</div></div>
          <div class="card-body">
            <div class="form-grid">
              <div class="fg"><label class="fl">Measured Squares</label><input class="fi" type="number" id="e-squares" inputmode="decimal" placeholder="21" oninput="calcEstimate()"></div>
              <div class="fg"><label class="fl">Waste Factor %</label><input class="fi" type="number" id="e-waste" value="15" oninput="calcEstimate()"></div>
              <div class="fg"><label class="fl">Pitch</label><select class="fs" id="e-pitch" onchange="calcEstimate()"><option>Low (2-3/12)</option><option selected>Medium (4-6/12)</option><option>Steep (7-9/12)</option><option>Very Steep (10+)</option></select></div>
              <div class="fg"><label class="fl">Stories</label><select class="fs" id="e-stories" onchange="calcEstimate()"><option>1</option><option selected>2</option><option>3+</option></select></div>
            </div>
          </div>
        </div>
        <div id="pricing-options-area" style="margin-top:4px"></div>
        <div class="card" style="margin-top:4px"><div class="card-hd"><div class="card-hd-title">Summary</div></div>
          <div class="card-body" id="est-summary"><p style="color:var(--text3);font-size:13px">Select a roofing option above</p></div>
        </div>
      </div>
    </div>
  </div>`;
  await loadPricingOptions();
  await loadSavedEstimates();
  
  // Auto-fill if customer preselected
  if (preselectedJobId) selectEstimateCustomer();
}

let _rates = [], _addons = [];
async function loadPricingOptions() {
  try {
    const { data: r } = await _sb.from('pricing_rates').select('*').order('id');
    const { data: a } = await _sb.from('addon_pricing_rates').select('*').order('id');
    _rates = r || []; _addons = a || [];
    const area = document.getElementById('pricing-options-area');
    if (!area) return;
    area.innerHTML = `<div class="card"><div class="card-hd"><div class="card-hd-title">💲 Roofing Option</div></div><div class="card-body">
      <div class="form-grid">
        <div class="fg"><label class="fl">Select Option</label>
          <select class="fs" id="e-option" onchange="calcEstimate()">
            ` + (_rates.map(r => `<option value="${r.id}">${r.name} — $${Number(r.price_per_square).toFixed(2)}/sq</option>`).join('')) + `
          </select>
        </div>
        <div class="fg"><label class="fl">Add-Ons</label>
          <select class="fs" id="e-addon" onchange="calcEstimate()">
            <option value="">None</option>
            ` + (_addons.map(a => `<option value="${a.id}">${a.name} — $${Number(a.price).toFixed(2)}/${a.unit_label||'unit'}</option>`).join('')) + `
          </select>
        </div>
        <div class="fg" id="addon-qty-wrap" style="display:none"><label class="fl">Add-On Quantity</label><input class="fi" type="number" id="e-addon-qty" value="100" oninput="calcEstimate()"></div>
      </div>
    </div></div>`;
    calcEstimate();
  } catch(e) {}
}

function calcEstimate() {
  const squares = parseFloat(document.getElementById('e-squares')?.value) || 0;
  const waste   = parseFloat(document.getElementById('e-waste')?.value) || 15;
  const optId   = parseInt(document.getElementById('e-option')?.value);
  const addonId = parseInt(document.getElementById('e-addon')?.value);
  const rate    = _rates.find(r => r.id === optId);
  const addon   = _addons.find(a => a.id === addonId);
  document.getElementById('addon-qty-wrap').style.display = addon ? 'block' : 'none';
  const addonQty = parseFloat(document.getElementById('e-addon-qty')?.value) || 0;
  const totalSq  = squares * (1 + waste/100);
  const baseTotal = rate ? totalSq * rate.price_per_square : 0;
  const addonTotal = addon ? addonQty * addon.price : 0;
  const grandTotal = baseTotal + addonTotal;
  const sumEl = document.getElementById('est-summary');
  if (!sumEl) return;
  if (!squares || !rate) { sumEl.innerHTML = `<p style="color:var(--text3);font-size:13px">Enter squares and select an option to calculate</p>`; return; }
  sumEl.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
      <div><div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em">Measured</div><div style="font-size:20px;font-weight:800">` + (squares) + ` sq</div></div>
      <div><div style="font-size:11px;color:var(--text3);font-weight:600;text-transform:uppercase;letter-spacing:.06em">With Waste (` + (waste) + `%)</div><div style="font-size:20px;font-weight:800">` + (totalSq.toFixed(1)) + ` sq</div></div>
    </div>
    <table class="tbl" style="margin-bottom:12px">
      <tr><td>` + (rate.name) + `</td><td style="text-align:right">$` + (Number(rate.price_per_square).toFixed(2)) + `/sq × ` + (totalSq.toFixed(1)) + ` sq</td><td style="text-align:right;font-weight:700">$` + (baseTotal.toFixed(2)) + `</td></tr>
      ` + (addon ? `<tr><td>${addon.name}</td><td style="text-align:right">$${Number(addon.price).toFixed(2)}/${addon.unit_label} × ${addonQty}</td><td style="text-align:right;font-weight:700">$${addonTotal.toFixed(2)}</td></tr>` : '') + `
    </table>
    <div style="display:flex;align-items:center;justify-content:space-between;background:var(--navy);color:white;padding:14px 16px;border-radius:8px">
      <span style="font-size:16px;font-weight:700">Total</span>
      <span style="font-size:26px;font-weight:900">$` + (grandTotal.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})) + `</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px">
      <div style="background:var(--blue-lt);border-radius:7px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--blue);font-weight:600;text-transform:uppercase">0% / 12mo</div><div style="font-size:15px;font-weight:800;color:var(--navy)">$` + ((grandTotal/12).toFixed(0)) + `/mo</div></div>
      <div style="background:var(--blue-lt);border-radius:7px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--blue);font-weight:600;text-transform:uppercase">Low / 60mo</div><div style="font-size:15px;font-weight:800;color:var(--navy)">$` + ((grandTotal/60).toFixed(0)) + `/mo</div></div>
      <div style="background:#F0FDF4;border-radius:7px;padding:10px;text-align:center"><div style="font-size:10px;color:var(--green);font-weight:600;text-transform:uppercase">Ins. Deductible</div><div style="font-size:15px;font-weight:800;color:var(--navy)">$1,000</div></div>
    </div>`;
}

async function saveEstimate() {
  const customerId = document.getElementById('e-customer-select')?.value;
  const name = document.getElementById('e-name')?.value?.trim();
  const addr = document.getElementById('e-addr')?.value?.trim();
  const squares = parseFloat(document.getElementById('e-squares')?.value) || 0;
  const total = parseFloat(document.getElementById('est-total-val')?.textContent?.replace(/[\$,]/g, '') || '0');
  
  if (!name || !squares || !total) {
    toast('Fill in customer name and roof size first', 'warn');
    return;
  }
  
  const btn = document.getElementById('est-save-btn');
  btn.disabled = true;
  btn.textContent = '💾 Saving...';
  
  try {
    let jobCustomerId = customerId;
    
    // If no customer selected, create new customer
    if (!customerId) {
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const { data: newCustomer, error: custError } = await _sb.from('customers').insert({
        first_name: firstName,
        last_name: lastName,
        address: addr || null
      }).select().single();
      
      if (custError) throw custError;
      jobCustomerId = newCustomer.id;
    }
    
    // Get or create job
    let jobId = sessionStorage.getItem('current_job_id');
    
    if (!jobId) {
      // Create new job
      const { data: newJob, error: jobError } = await _sb.from('jobs').insert({
        customer_id: jobCustomerId,
        status: 'estimate_sent',
        contract_value: total,
        assigned_to: _user.id
      }).select().single();
      
      if (jobError) throw jobError;
      jobId = newJob.id;
      sessionStorage.setItem('current_job_id', jobId);
    } else {
      // Update existing job
      const { error: updateError } = await _sb.from('jobs').update({
        contract_value: total,
        status: 'estimate_sent'
      }).eq('id', jobId);
      
      if (updateError) throw updateError;
    }
    
    // Save line items
    const optionId = document.getElementById('e-option')?.value;
    const addonId = document.getElementById('e-addon')?.value;
    const addonQty = parseFloat(document.getElementById('e-addon-qty')?.value) || 0;
    
    // Delete old line items for this job
    await _sb.from('estimate_line_items').delete().eq('job_id', jobId);
    
    // Add main roofing option
    if (optionId) {
      const option = _rates.find(r => r.id == optionId);
      if (option) {
        await _sb.from('estimate_line_items').insert({
          job_id: jobId,
          item_name: option.name,
          quantity: squares,
          unit_label: 'squares',
          unit_price: option.price_per_square,
          total_price: squares * option.price_per_square,
          item_type: 'material',
          display_order: 1
        });
      }
    }
    
    // Add addon if selected
    if (addonId && addonQty > 0) {
      const addon = _addons.find(a => a.id == addonId);
      if (addon) {
        await _sb.from('estimate_line_items').insert({
          job_id: jobId,
          item_name: addon.name,
          quantity: addonQty,
          unit_label: addon.unit_label || 'units',
          unit_price: addon.price,
          total_price: addonQty * addon.price,
          item_type: 'addon',
          display_order: 2
        });
      }
    }
    
    toast('Estimate saved! Quote code generated.', 'success');
    btn.textContent = '✅ Saved';
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '💾 Save';
    }, 2000);
    
    await loadSavedEstimates();
  } catch(e) {
    console.error('Save error:', e);
    toast('Failed to save: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = '💾 Save';
  }
}

async function loadSavedEstimates() {
  try {
    const { data } = await _sb.from('estimates').select('*, customers(name)').order('created_at', { ascending: false }).limit(10);
    if (data?.length) {
      document.getElementById('est-saved-list').innerHTML = `<table class="tbl"><thead><tr><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead><tbody>` + (
        data.map(e => `<tr><td><strong>${e.customers?.name||e.customer_name||'—'}</strong></td><td style="color:var(--text3)">${new Date(e.created_at).toLocaleDateString()}</td><td style="font-weight:700">$${Number(e.total_amount||0).toLocaleString()}</td><td><span class="badge badge-${e.status==='sent'?'blue':e.status==='accepted'?'green':'gray'}">${e.status||'draft'}</span></td></tr>`).join('')
      ) + `</tbody></table>`;
    }
  } catch(e) {}
}

async function pageEstimatesList(c) { await pageEstimates(c); }

// ══════════════════════════════════════════════════════════════
// PAGE: FINANCING CALC
// ══════════════════════════════════════════════════════════════
function pageFinancing(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Financing Calculator</div><div class="page-sub">Show monthly payments at the table</div></div></div>
    <div class="card"><div class="card-body">
      <div class="form-grid" style="max-width:400px">
        <div class="fg fg-full"><label class="fl">Project Total ($)</label><input class="fi" type="number" id="fin-total" inputmode="decimal" placeholder="18400" oninput="calcFin()"></div>
      </div>
      <div id="fin-out" style="margin-top:16px"></div>
    </div></div>
  </div>`;
}

function calcFin() {
  const total = parseFloat(document.getElementById('fin-total')?.value) || 0;
  if (!total) { document.getElementById('fin-out').innerHTML = ``; return; }
  const plans = [
    { label:'0% / 12 months', factor:12, note:'No interest promo' },
    { label:'9.99% / 36 months', factor:36, note:'Low monthly' },
    { label:'12.99% / 60 months', factor:60, note:'Lowest payment' },
  ];
  document.getElementById('fin-out').innerHTML = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">` + (
    plans.map(p => `<div style="background:var(--blue-lt);border-radius:10px;padding:20px;text-align:center">
      <div style="font-size:11px;color:var(--blue);font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">${p.label}</div>
      <div style="font-size:32px;font-weight:900;color:var(--navy)">$${(total/p.factor).toFixed(0)}<span style="font-size:14px">/mo</span></div>
      <div style="font-size:11px;color:var(--text3);margin-top:4px">${p.note}</div>
    </div>`).join('')
  ) + '</div><div class="alert alert-info" style="margin-top:12px">💡 Show these numbers at the table to overcome sticker shock on the full project total.</div>';
}

// ══════════════════════════════════════════════════════════════
// PAGE: OBJECTIONS
// ══════════════════════════════════════════════════════════════
function pageObjections(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Objection Handler</div><div class="page-sub">Type what the homeowner said · Get a confident response</div></div></div>
    <div class="card"><div class="card-body">
      <div class="fg" style="margin-bottom:14px">
        <label class="fl">What did the homeowner say?</label>
        <textarea class="fi" id="obj-in" rows="3" placeholder="e.g. I need to think about it..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="runObjHandler()">✨ Get Response</button>
      <div class="ai-panel" style="margin-top:14px">
        <div class="ai-hd"><span>🤖</span><span class="ai-badge">CLAUDE AI</span>
          <button class="btn btn-sm" style="margin-left:auto;background:rgba(255,255,255,.15);color:white;border:none" onclick="copyTxt(document.getElementById(\'obj-out\').innerText,this)">📋 Copy</button>
        </div>
        <div class="ai-text" id="obj-out">Enter an objection above and click Get Response.</div>
      </div>
    </div></div>
  </div>`;
}

async function runObjHandler() {
  const objection = document.getElementById('obj-in')?.value?.trim();
  if (!objection) { toast('Enter an objection first', 'warn'); return; }
  const out = document.getElementById('obj-out');
  out.innerHTML = `<em>✨ Asking Claude...</em>`;
  const prompt = `You are an expert roofing sales coach. A sales rep needs help responding to this homeowner objection right now:

"${objection}"

Give a confident, professional response the rep can say word-for-word. Be conversational and empathetic, not pushy. Include:
1. An empathetic acknowledgment
2. A reframe or answer that addresses the real concern
3. A specific question to keep the conversation moving forward

Keep it concise and field-ready.`;
  await callClaudeEdge(prompt, out, 'generate-inspection-report');
}

// ══════════════════════════════════════════════════════════════
// PAGE: CLOSING COACH
// ══════════════════════════════════════════════════════════════
function pageClosing(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Closing Coach</div><div class="page-sub">Context-based closing strategy · Powered by Claude AI</div></div></div>
    <div class="card"><div class="card-body">
      <div class="form-grid" style="margin-bottom:14px">
        <div class="fg"><label class="fl">Homeowner Name</label><input class="fi" id="cc-name" placeholder="e.g. Mr. Thompson" autocapitalize="words"></div>
        <div class="fg"><label class="fl">Situation</label>
          <select class="fs" id="cc-situation">
            <option value="just_presented">Just presented the estimate</option>
            <option value="comparing">Comparing with another company</option>
            <option value="spouse">Needs to talk to spouse first</option>
            <option value="think_about_it">Said they need to think about it</option>
            <option value="price_high">Price is too high</option>
            <option value="insurance_low">Insurance offer feels low</option>
            <option value="going_cold">Deal is going cold / no response</option>
          </select>
        </div>
        <div class="fg"><label class="fl">Estimate Amount</label><input class="fi" id="cc-amount" placeholder="e.g. $18,400"></div>
        <div class="fg"><label class="fl">Insurance Deductible (if applicable)</label><input class="fi" id="cc-deductible" placeholder="e.g. $1,000"></div>
        <div class="fg fg-full"><label class="fl">Additional Context (optional)</label>
          <textarea class="fi" id="cc-context" rows="2" placeholder="e.g. They seemed interested but kept mentioning their neighbor got a lower quote..."></textarea>
        </div>
      </div>
      <button class="btn btn-primary" onclick="runClosingCoach()">🎯 Get Closing Strategy</button>
      <div class="ai-panel" style="margin-top:14px">
        <div class="ai-hd"><span>🎯</span><span class="ai-badge">CLAUDE AI</span>
          <button class="btn btn-sm" style="margin-left:auto;background:rgba(255,255,255,.15);color:white;border:none" onclick="copyTxt(document.getElementById(\'cc-out\').innerText,this)">📋 Copy</button>
        </div>
        <div class="ai-text" id="cc-out">Fill in the details above and click Get Closing Strategy.</div>
      </div>
    </div></div>
  </div>`;
}

async function runClosingCoach() {
  const name       = document.getElementById('cc-name')?.value?.trim() || 'the homeowner';
  const situation  = document.getElementById('cc-situation')?.value || 'just_presented';
  const amount     = document.getElementById('cc-amount')?.value?.trim() || '';
  const deductible = document.getElementById('cc-deductible')?.value?.trim() || '';
  const context    = document.getElementById('cc-context')?.value?.trim() || '';
  const out        = document.getElementById('cc-out');
  out.innerHTML = `<em>✨ Building your closing strategy...</em>`;
  const labels = {
    just_presented: 'The rep just presented the estimate and is sitting at the table',
    comparing:      'The homeowner is comparing quotes with another roofing company',
    spouse:         'The homeowner says they need to talk to their spouse first',
    think_about_it: 'The homeowner said they need to think about it',
    price_high:     'The homeowner says the price is too high',
    insurance_low:  'The homeowner feels the insurance payout is too low',
    going_cold:     'The deal is going cold — the homeowner has gone unresponsive'
  };
  const prompt = `You are an elite roofing sales coach. A rep needs a closing strategy RIGHT NOW — they are in the field.

Situation: ${labels[situation] || situation}
Homeowner name: ${name}
${amount ? 'Estimate amount: ' + amount : ''}
${deductible ? 'Insurance deductible: ' + deductible : ''}
${context ? 'Additional context: ' + context : ''}

Give a specific, actionable closing strategy. Include:
**The Close:** Name the technique (e.g. Cost Neutrality Close, Assumptive Close, Take-Away Close)
**Word-for-word script:** Exactly what to say using ${name}'s name and real numbers if provided
**The Ask:** The exact sentence to ask for the signature or commitment
**If they still hesitate:** One rescue line to keep the conversation alive
**Body language:** One physical action to reinforce the close (e.g. silence, handshake, pen placement)

Be sharp and field-ready. No fluff. This rep is standing in someone's living room right now.`;
  await callClaudeEdge(prompt, out, 'generate-inspection-report');
}

// ══════════════════════════════════════════════════════════════
// PAGE: FOLLOW-UP WRITER
// ══════════════════════════════════════════════════════════════
function pageFollowup(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Follow-Up Writer</div><div class="page-sub">AI drafts the perfect text, email, or call script</div></div></div>
    <div class="card"><div class="card-body">
      <div class="form-grid" style="margin-bottom:14px">
        <div class="fg"><label class="fl">Lead Name</label><input class="fi" id="fu-name" placeholder="Homeowner name" autocapitalize="words"></div>
        <div class="fg"><label class="fl">Days Since Contact</label><input class="fi" type="number" id="fu-days" value="5" inputmode="numeric"></div>
        <div class="fg"><label class="fl">Stage</label>
          <select class="fs" id="fu-stage">
            <option>Cold — inspected, no response</option>
            <option>Warm — viewed estimate</option>
            <option>Hot — asked about financing</option>
            <option>Lost — went with competitor</option>
          </select>
        </div>
        <div class="fg"><label class="fl">Channel</label>
          <select class="fs" id="fu-channel">
            <option>Text Message</option>
            <option>Email</option>
            <option>Call Script</option>
          </select>
        </div>
        <div class="fg fg-full"><label class="fl">Any Context (optional)</label>
          <input class="fi" id="fu-context" placeholder="e.g. They mentioned they were waiting on a competitor quote...">
        </div>
      </div>
      <button class="btn btn-primary" onclick="runFollowup()">✨ Write Follow-Up</button>
      <div class="ai-panel" style="margin-top:14px">
        <div class="ai-hd"><span>✉️</span><span class="ai-badge">CLAUDE AI</span>
          <button class="btn btn-sm" style="margin-left:auto;background:rgba(255,255,255,.15);color:white;border:none" onclick="copyTxt(document.getElementById(\'fu-out\').innerText,this)">📋 Copy</button>
        </div>
        <div class="ai-text" id="fu-out">Fill in the details above and click Write Follow-Up.</div>
      </div>
    </div></div>
  </div>`;
}

async function runFollowup() {
  const name    = document.getElementById('fu-name')?.value?.trim() || 'the homeowner';
  const days    = document.getElementById('fu-days')?.value || '5';
  const stage   = document.getElementById('fu-stage')?.value || '';
  const channel = document.getElementById('fu-channel')?.value || 'Text Message';
  const context = document.getElementById('fu-context')?.value?.trim() || '';
  const out     = document.getElementById('fu-out');
  out.innerHTML = `<em>✨ Writing follow-up...</em>`;
  const prompt = `You are an expert roofing sales coach. Write a follow-up message for a roofing sales rep.

Lead name: ${name}
Days since last contact: ${days}
Stage: ${stage}
Channel: ${channel}
${context ? 'Context: ' + context : ''}

Write a ${channel.toLowerCase()} that feels personal, not salesy. It should:
- Reference something specific if possible (the inspection, the estimate, the storm)
- Create gentle urgency without pressure
- Have a clear, low-friction call to action
- Sound like a real human wrote it, not a template

${channel === 'Email' ? 'Include a subject line.' : ''}
${channel === 'Call Script' ? 'Include an opening line, main talking points, and a closing ask.' : ''}
Keep it brief and natural.`;
  await callClaudeEdge(prompt, out, 'generate-inspection-report');
}

// ══════════════════════════════════════════════════════════════
// SHARED: CALL CLAUDE VIA EDGE FUNCTION
// ══════════════════════════════════════════════════════════════
async function callClaudeEdge(prompt, outEl, fnName) {
  try {
    const { data: { session } } = await _sb.auth.getSession();
    if (!session) { outEl.innerHTML = `Please log in to use AI features.`; return; }
    const res = await fetch(`${SUPA_URL}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + session.access_token,
        'apikey': SUPA_KEY
      },
      body: JSON.stringify({ _raw_prompt: prompt })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    const text = data?.report || data?.letter || data?.response || data?.content?.[0]?.text || 'Response received.';
    outEl.innerHTML = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  } catch(e) {
    outEl.innerHTML = `<span style="color:#FCA5A5">Error: ` + (e.message) + `</span>`;
    toast('AI request failed', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE: STORM RESPONSE
// ══════════════════════════════════════════════════════════════
function pageStorm(c) {
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd"><div><div class="page-title">Storm Response</div><div class="page-sub">Deploy your team after hail events</div></div></div>
    <div class="card"><div class="card-body">
      <div class="form-grid" style="margin-bottom:14px">
        <div class="fg"><label class="fl">Storm Date</label><input class="fi" type="date" id="st-date" value="` + (new Date().toISOString().slice(0,10)) + `"></div>
        <div class="fg"><label class="fl">Hail Size</label><select class="fs" id="st-size"><option>0.75" (Pea)</option><option>1.0" (Marble)</option><option>1.5" (Golf ball)</option><option>2.0"+ (Major)</option></select></div>
        <div class="fg"><label class="fl">Affected Zip Codes</label><input class="fi" id="st-zips" placeholder="80524, 80526, 80528"></div>
        <div class="fg"><label class="fl">Reps to Deploy</label><input class="fi" type="number" id="st-reps" value="4" inputmode="numeric"></div>
        <div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="st-notes" rows="2" placeholder="Wind direction, hardest hit neighborhoods..."></textarea></div>
      </div>
      <button class="btn btn-primary" onclick="generateStormBrief()">⚡ Generate Deployment Brief</button>
      <div class="ai-panel" style="margin-top:14px">
        <div class="ai-hd"><span>⛈️</span><span class="ai-badge">CLAUDE AI</span>
          <button class="btn btn-sm" style="margin-left:auto;background:rgba(255,255,255,.15);color:white;border:none" onclick="copyTxt(document.getElementById(\'storm-out\').innerText,this)">📋 Copy</button>
        </div>
        <div class="ai-text" id="storm-out">Fill in storm details and click Generate Deployment Brief.</div>
      </div>
    </div></div>
  </div>`;
}

async function generateStormBrief() {
  const date  = document.getElementById('st-date')?.value || '';
  const size  = document.getElementById('st-size')?.value || '';
  const zips  = document.getElementById('st-zips')?.value || '';
  const reps  = document.getElementById('st-reps')?.value || '4';
  const notes = document.getElementById('st-notes')?.value || '';
  const out   = document.getElementById('storm-out');
  out.innerHTML = `<em>✨ Generating deployment brief...</em>`;
  const prompt = `You are a roofing storm response coordinator. Generate a deployment brief for a sales team.

Storm event: ${date}, hail size ${size}
Affected zip codes: ${zips}
Reps deploying: ${reps}
Notes: ${notes}

Create a concise deployment brief including:
1. Priority neighborhoods to canvass first (based on typical residential density for Fort Collins CO area)
2. Door-knocking talking points specific to this storm size
3. What to look for on roofs from the street
4. How to split the ${reps} reps across the territory
5. Goal: appointments booked per rep per day

Keep it sharp and actionable. Reps will read this on their phones before heading out.`;
  await callClaudeEdge(prompt, out, 'generate-inspection-report');
}

// ══════════════════════════════════════════════════════════════
// REMAINING PAGES
// ══════════════════════════════════════════════════════════════
async function pageNotifications(c) {
  c.innerHTML = `<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Notifications</div></div></div>
    <div class="card"><div class="card-body" id="notif-body"><div class="empty-state"><div class="icon">🔔</div><h3>No Notifications</h3></div></div></div></div>`;
  try {
    const { data } = await _sb.from('notification_queue').select('*').order('created_at', { ascending: false }).limit(20);
    if (data?.length) {
      document.getElementById('notif-body').innerHTML = data.map(n =>
        `<div style="padding:10px 0;border-bottom:1px solid var(--border)"><div style="font-size:13px;font-weight:600">${n.title||n.type||'Notification'}</div><div style="font-size:12px;color:var(--text3)">${new Date(n.created_at).toLocaleString()}</div></div>`).join('');
    }
  } catch(e) {}
}

async function pageReports(c) {
  c.innerHTML = `<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Reports</div><div class="page-sub">Performance & revenue data</div></div></div>
    <div class="card"><div class="card-body" id="rpt-body"><div class="empty-state"><div class="icon">📈</div><h3>No Report Data Yet</h3><p>Reports will populate as jobs and estimates are created.</p></div></div></div></div>`;
  try {
    const { data } = await _sb.from('consultant_performance').select('*').limit(10);
    if (data?.length) {
      document.getElementById('rpt-body').innerHTML = `<table class="tbl"><thead><tr><th>Rep</th><th>Jobs</th><th>Pipeline</th><th>Closed</th></tr></thead><tbody>` + (
        data.map(r => `<tr><td>${r.email||r.consultant_id||'—'}</td><td>${r.total_jobs||0}</td><td>$${Number(r.pipeline_value||0).toLocaleString()}</td><td>$${Number(r.closed_value||0).toLocaleString()}</td></tr>`).join('')
      ) + `</tbody></table>`;
    }
  } catch(e) {}
}

function pageStorage(c) {
  c.innerHTML = `<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Storage</div></div></div>
    <div class="card"><div class="card-body"><div class="empty-state"><div class="icon">🗄️</div><h3>Storage Manager</h3><p>File storage stats and management — coming soon.</p></div></div></div></div>`;
}

function pageReviews(c) {
  c.innerHTML = `<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Reviews</div><div class="page-sub">Request and track Google reviews</div></div></div>
    <div class="card"><div class="card-body"><div class="empty-state"><div class="icon">⭐</div><h3>Review Requests</h3><p>Send review request links to completed job customers.</p><button class="btn btn-primary" onclick="toast(\'Review request — coming soon\',\'warn\')">+ Request Review</button></div></div></div></div>`;
}



// ══════════════════════════════════════════════════════════════
// PAGE: SALES METRICS
// ══════════════════════════════════════════════════════════════
async function pageSalesMetrics(c) {
  c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Sales Performance Metrics</div><div class="page-sub">Lead → Appointment → Sale conversion tracking</div></div><div style="display:flex;gap:8px"><select class="fs" id="sm-period" onchange="loadSalesMetrics()" style="width:auto"><option value="7">Last 7 Days</option><option value="30" selected>Last 30 Days</option><option value="60">Last 60 Days</option><option value="90">Last 90 Days</option></select><button class="btn btn-outline btn-sm" onclick="exportSalesMetrics()">📥 Export CSV</button></div></div><div class="stat-cards" style="grid-template-columns:repeat(3,1fr)"><div class="stat-card sc-blue"><div class="sc-label">Lead → Appointment</div><div class="sc-val" id="sm-overall-l2a">—</div></div><div class="stat-card sc-purple"><div class="sc-label">Appointment → Sale</div><div class="sc-val" id="sm-overall-a2s">—</div></div><div class="stat-card sc-green"><div class="sc-label">Lead → Sale</div><div class="sc-val" id="sm-overall-l2s">—</div></div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Performance by Marketing Channel</div></div><div class="card-body" style="padding:0"><div id="sm-table-wrap"></div></div></div></div>';
  await loadSalesMetrics();
}

async function loadSalesMetrics() {
  const period = document.getElementById('sm-period')?.value || 30;
  try {
    const { data: allJobs } = await _sb.from('jobs').select('*').gte('created_at', new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString());
    const totalLeads = allJobs?.length || 0;
    const totalAppts = allJobs?.filter(j => j.appointment_set_date).length || 0;
    const totalSales = allJobs?.filter(j => ['complete', 'paid', 'invoiced'].includes(j.status)).length || 0;
    const l2a = totalLeads > 0 ? ((totalAppts / totalLeads) * 100).toFixed(1) : '0.0';
    const a2s = totalAppts > 0 ? ((totalSales / totalAppts) * 100).toFixed(1) : '0.0';
    const l2s = totalLeads > 0 ? ((totalSales / totalLeads) * 100).toFixed(1) : '0.0';
    document.getElementById('sm-overall-l2a').textContent = l2a + '%';
    document.getElementById('sm-overall-a2s').textContent = a2s + '%';
    document.getElementById('sm-overall-l2s').textContent = l2s + '%';
    const channelStats = {};
    allJobs?.forEach(job => {
      const ch = job.marketing_channel || 'Unknown';
      if (!channelStats[ch]) channelStats[ch] = { total_leads: 0, appointments_set: 0, deals_closed: 0, total_revenue: 0 };
      channelStats[ch].total_leads++;
      if (job.appointment_set_date) channelStats[ch].appointments_set++;
      if (['complete', 'paid', 'invoiced'].includes(job.status)) {
        channelStats[ch].deals_closed++;
        channelStats[ch].total_revenue += parseFloat(job.contract_value || 0);
      }
    });
    const metrics = Object.keys(channelStats).map(ch => {
      const s = channelStats[ch];
      return {
        marketing_channel: ch,
        total_leads: s.total_leads,
        appointments_set: s.appointments_set,
        deals_closed: s.deals_closed,
        lead_to_appt_percent: s.total_leads > 0 ? ((s.appointments_set / s.total_leads) * 100).toFixed(1) : 0,
        appt_to_sale_percent: s.appointments_set > 0 ? ((s.deals_closed / s.appointments_set) * 100).toFixed(1) : 0,
        lead_to_sale_percent: s.total_leads > 0 ? ((s.deals_closed / s.total_leads) * 100).toFixed(1) : 0,
        total_revenue: s.total_revenue
      };
    }).sort((a, b) => b.total_leads - a.total_leads);
    const tableWrap = document.getElementById('sm-table-wrap');
    if (!metrics || metrics.length === 0) {
      tableWrap.innerHTML = '<div class="empty-state"><div class="icon">📊</div><h3>No Data Yet</h3><p>Add marketing channels to jobs to see performance metrics.</p></div>';
      return;
    }
    tableWrap.innerHTML = '<table class="tbl"><thead><tr><th>Marketing Channel</th><th style="text-align:center">Leads</th><th style="text-align:center">Appointments</th><th style="text-align:center">Sales</th><th style="text-align:center">Lead → Appt</th><th style="text-align:center">Appt → Sale</th><th style="text-align:center">Lead → Sale</th><th style="text-align:right">Revenue</th></tr></thead><tbody>' + metrics.map(m => '<tr><td><strong>' + (m.marketing_channel || 'Unknown') + '</strong></td><td style="text-align:center">' + (m.total_leads || 0) + '</td><td style="text-align:center">' + (m.appointments_set || 0) + '</td><td style="text-align:center">' + (m.deals_closed || 0) + '</td><td style="text-align:center"><span class="badge badge-blue">' + (m.lead_to_appt_percent || 0) + '%</span></td><td style="text-align:center"><span class="badge badge-purple">' + (m.appt_to_sale_percent || 0) + '%</span></td><td style="text-align:center"><span class="badge badge-green">' + (m.lead_to_sale_percent || 0) + '%</span></td><td style="text-align:right"><strong>$' + Number(m.total_revenue || 0).toLocaleString() + '</strong></td></tr>').join('') + '</tbody></table>';
  } catch(e) {
    console.error('Sales metrics error:', e);
    toast('Failed to load sales metrics', 'error');
  }
}

function exportSalesMetrics() {
  toast('CSV export — coming soon', 'warn');
}

// ══════════════════════════════════════════════════════════════
// PAGE: MARKETING ROI
// ══════════════════════════════════════════════════════════════
async function pageMarketingROI(c) {
  c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Marketing ROI Dashboard</div><div class="page-sub">Track spend and calculate cost per lead/sale</div></div><button class="btn btn-primary btn-sm" onclick="showSpendModal()">+ Add Marketing Spend</button></div><div class="stat-cards"><div class="stat-card sc-orange"><div class="sc-label">Total Spend (30d)</div><div class="sc-val" id="roi-total-spend">$0</div></div><div class="stat-card sc-blue"><div class="sc-label">Avg Cost Per Lead</div><div class="sc-val" id="roi-cpl">$0</div></div><div class="stat-card sc-purple"><div class="sc-label">Avg Cost Per Appt</div><div class="sc-val" id="roi-cpa">$0</div></div><div class="stat-card sc-green"><div class="sc-label">Avg Cost Per Sale</div><div class="sc-val" id="roi-cps">$0</div></div></div><div class="card"><div class="card-hd"><div class="card-hd-title">ROI by Marketing Channel</div></div><div class="card-body" style="padding:0"><div id="roi-table-wrap"></div></div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Spend History</div></div><div class="card-body"><div id="roi-history"></div></div></div></div>';
  await loadMarketingROI();
}

async function loadMarketingROI() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { data: spendData } = await _sb.from('marketing_spend').select('*').gte('month', thirtyDaysAgo.toISOString().slice(0, 10)).order('month', { ascending: false });
    const { data: allJobs } = await _sb.from('jobs').select('*').gte('created_at', thirtyDaysAgo.toISOString());
    const channelStats = {};
    allJobs?.forEach(job => {
      const ch = job.marketing_channel || 'Unknown';
      if (!channelStats[ch]) channelStats[ch] = { total_leads: 0, appointments_set: 0, deals_closed: 0, total_revenue: 0 };
      channelStats[ch].total_leads++;
      if (job.appointment_set_date) channelStats[ch].appointments_set++;
      if (['complete', 'paid', 'invoiced'].includes(job.status)) {
        channelStats[ch].deals_closed++;
        channelStats[ch].total_revenue += parseFloat(job.contract_value || 0);
      }
    });
    const metrics = Object.keys(channelStats).map(ch => ({ marketing_channel: ch, ...channelStats[ch] }));
    const totalSpend = spendData?.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0) || 0;
    const totalLeads = metrics?.reduce((sum, m) => sum + (m.total_leads || 0), 0) || 0;
    const totalAppts = metrics?.reduce((sum, m) => sum + (m.appointments_set || 0), 0) || 0;
    const totalSales = metrics?.reduce((sum, m) => sum + (m.deals_closed || 0), 0) || 0;
    const cpl = totalLeads > 0 ? (totalSpend / totalLeads).toFixed(2) : '0.00';
    const cpa = totalAppts > 0 ? (totalSpend / totalAppts).toFixed(2) : '0.00';
    const cps = totalSales > 0 ? (totalSpend / totalSales).toFixed(2) : '0.00';
    document.getElementById('roi-total-spend').textContent = '$' + totalSpend.toLocaleString();
    document.getElementById('roi-cpl').textContent = '$' + cpl;
    document.getElementById('roi-cpa').textContent = '$' + cpa;
    document.getElementById('roi-cps').textContent = '$' + cps;
    const tableWrap = document.getElementById('roi-table-wrap');
    if (!metrics || metrics.length === 0) {
      tableWrap.innerHTML = '<div class="empty-state"><div class="icon">💰</div><h3>No Data Yet</h3><p>Add marketing spend and job data to calculate ROI.</p></div>';
    } else {
      const spendByChannel = {};
      spendData?.forEach(s => {
        if (!spendByChannel[s.channel]) spendByChannel[s.channel] = 0;
        spendByChannel[s.channel] += parseFloat(s.amount || 0);
      });
      tableWrap.innerHTML = '<table class="tbl"><thead><tr><th>Channel</th><th style="text-align:right">Spend</th><th style="text-align:center">Leads</th><th style="text-align:right">CPL</th><th style="text-align:center">Sales</th><th style="text-align:right">CPS</th><th style="text-align:right">Revenue</th><th style="text-align:right">ROI</th></tr></thead><tbody>' + metrics.map(m => {
        const spend = spendByChannel[m.marketing_channel] || 0;
        const revenue = parseFloat(m.total_revenue || 0);
        const roi = spend > 0 ? ((revenue - spend) / spend * 100).toFixed(0) : '—';
        const cpl = m.total_leads > 0 ? (spend / m.total_leads).toFixed(2) : '0.00';
        const cps = m.deals_closed > 0 ? (spend / m.deals_closed).toFixed(2) : '0.00';
        return '<tr><td><strong>' + (m.marketing_channel || 'Unknown') + '</strong></td><td style="text-align:right">$' + spend.toLocaleString() + '</td><td style="text-align:center">' + (m.total_leads || 0) + '</td><td style="text-align:right">$' + cpl + '</td><td style="text-align:center">' + (m.deals_closed || 0) + '</td><td style="text-align:right">$' + cps + '</td><td style="text-align:right"><strong>$' + revenue.toLocaleString() + '</strong></td><td style="text-align:right"><span class="badge ' + (roi === '—' ? 'badge-gray' : parseFloat(roi) > 0 ? 'badge-green' : 'badge-red') + '">' + (roi === '—' ? roi : roi + '%') + '</span></td></tr>';
      }).join('') + '</tbody></table>';
    }
    const historyWrap = document.getElementById('roi-history');
    if (!spendData || spendData.length === 0) {
      historyWrap.innerHTML = '<div class="empty-state" style="padding:30px"><div class="icon">📅</div><p>No spend data yet. Click "+ Add Marketing Spend" to get started.</p></div>';
    } else {
      historyWrap.innerHTML = '<table class="tbl"><thead><tr><th>Month</th><th>Channel</th><th style="text-align:right">Amount</th><th>Notes</th></tr></thead><tbody>' + spendData.map(s => '<tr><td>' + new Date(s.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) + '</td><td><strong>' + s.channel + '</strong></td><td style="text-align:right">$' + parseFloat(s.amount).toLocaleString() + '</td><td style="color:var(--text3);font-size:12px">' + (s.notes || '—') + '</td></tr>').join('') + '</tbody></table>';
    }
  } catch(e) {
    console.error('Marketing ROI error:', e);
    toast('Failed to load marketing ROI', 'error');
  }
}

function showSpendModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = '<div class="modal-sheet"><div class="modal-drag"></div><h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Add Marketing Spend</h3><div class="form-grid"><div class="fg"><label class="fl">Month</label><input type="month" class="fi" id="ms-month" value="' + new Date().toISOString().slice(0, 7) + '"></div><div class="fg"><label class="fl">Amount</label><input type="number" class="fi" id="ms-amount" placeholder="0.00" step="0.01"></div><div class="fg fg-full"><label class="fl">Channel</label><select class="fs" id="ms-channel"><option value="">Select Channel...</option><option>Google Ads</option><option>Facebook</option><option>Instagram</option><option>TikTok</option><option>Radio</option><option>Truck Wraps</option><option>Yard Signs</option><option>JF Acquisitions</option><option>Roofnutz</option><option>Directorii</option><option>Website</option><option>Referrals</option><option>Door Knocking</option></select></div><div class="fg fg-full"><label class="fl">Notes (optional)</label><textarea class="fi" id="ms-notes" rows="2" placeholder="Campaign details, ad copy tested, etc."></textarea></div></div><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary" onclick="saveMarketingSpend()">Save Spend</button><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button></div></div>';
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

async function saveMarketingSpend() {
  const month = document.getElementById('ms-month')?.value;
  const amount = document.getElementById('ms-amount')?.value;
  const channel = document.getElementById('ms-channel')?.value;
  const notes = document.getElementById('ms-notes')?.value;
  if (!month || !amount || !channel) {
    toast('Please fill in all required fields', 'error');
    return;
  }
  try {
    const { error } = await _sb.from('marketing_spend').upsert({ month: month + '-01', channel, amount: parseFloat(amount), notes: notes || null }, { onConflict: 'month,channel' });
    if (error) throw error;
    toast('Marketing spend saved!', 'success');
    document.querySelector('.modal-overlay')?.remove();
    await loadMarketingROI();
  } catch(e) {
    console.error('Save spend error:', e);
    toast('Failed to save spend: ' + e.message, 'error');
  }
}


// ══════════════════════════════════════════════════════════════

async function pageCustomerTracker(c) {
  c.innerHTML = `
    <div class="page-wrap mfr-tracker-page">
      <div class="mfr-tracker-hero">
        <div>
          <div class="mfr-tracker-kicker">Customer-facing workflow</div>
          <h1>Customer Tracker</h1>
          <p>Manage the project links your customers can use to view roofing progress, quote pages, and next steps without logging in.</p>
        </div>
        <div class="mfr-tracker-hero-actions">
          <button class="btn btn-outline" style="background:#fff" onclick="go('customers')">View Customers</button>
          <button class="btn btn-primary" onclick="newJobModal()">+ New Lead</button>
        </div>
      </div>

      <div class="mfr-tracker-stats" id="ct-stats">
        <div class="mfr-tracker-stat"><span>Total Links</span><strong>—</strong></div>
        <div class="mfr-tracker-stat"><span>With Tracker</span><strong>—</strong></div>
        <div class="mfr-tracker-stat"><span>With Quote</span><strong>—</strong></div>
        <div class="mfr-tracker-stat"><span>Active Jobs</span><strong>—</strong></div>
      </div>

      <div class="mfr-est-panel mfr-tracker-controls">
        <div class="mfr-est-panel-hd">
          <div>
            <div class="mfr-est-panel-title">Find a customer link</div>
            <div class="mfr-est-panel-sub">Search, filter, copy, or open customer-facing views.</div>
          </div>
        </div>
        <div class="mfr-est-panel-body">
          <div class="mfr-tracker-filter-grid">
            <div class="fg fg-full"><label class="fl">Search</label><input class="fi" id="ct-search" placeholder="Search customer, address, phone..." oninput="filterCustomerTrackerRows()"></div>
            <div class="fg"><label class="fl">Status</label><select class="fs" id="ct-status" onchange="filterCustomerTrackerRows()">
              <option value="">All Statuses</option>
              <option value="lead">Lead</option>
              <option value="inspection_scheduled">Inspection Scheduled</option>
              <option value="inspected">Inspected</option>
              <option value="estimate_sent">Estimate Sent</option>
              <option value="contract_signed">Contract Signed</option>
              <option value="in_production">In Production</option>
              <option value="complete">Complete</option>
              <option value="paid">Paid</option>
            </select></div>
            <div class="fg mfr-tracker-refresh"><label class="fl">Refresh</label><button class="btn btn-outline" onclick="pageCustomerTracker(document.getElementById('content'))">Refresh Links</button></div>
          </div>
        </div>
      </div>

      <div class="mfr-est-panel">
        <div class="mfr-est-panel-hd">
          <div>
            <div class="mfr-est-panel-title">Tracking Links</div>
            <div class="mfr-est-panel-sub">Copy links for text/email or open the internal job details.</div>
          </div>
          <span class="mfr-nav-pill" id="ct-count-pill">Loading</span>
        </div>
        <div class="mfr-est-panel-body"><div id="ct-list"><div style="text-align:center;padding:34px;color:var(--text3)">Loading tracker links...</div></div></div>
      </div>
    </div>`;

  try {
    injectCustomerTrackerStyles();
    const jobs = await loadJobsSafe({ limit: 250 });
    window.mfrCustomerTrackerJobs = jobs || [];
    const list = document.getElementById('ct-list');
    if (!jobs || !jobs.length) {
      document.getElementById('ct-stats').innerHTML = renderTrackerStats([]);
      document.getElementById('ct-count-pill').textContent = '0 links';
      list.innerHTML = '<div class="empty-state" style="padding:34px"><div class="icon">📍</div><h3>No customer tracking links yet</h3><p>Create a lead or save an estimate to generate customer-facing links.</p><button class="btn btn-primary" onclick="newJobModal()">+ New Lead</button></div>';
      return;
    }

    document.getElementById('ct-stats').innerHTML = renderTrackerStats(jobs);
    document.getElementById('ct-count-pill').textContent = jobs.length + ' record' + (jobs.length === 1 ? '' : 's');

    const cards = jobs.map(j => {
      const job = attachCustomerFallback(j);
      const customer = job.customers || {};
      const nameRaw = customer.name || job.customer_name || 'Unknown Customer';
      const phoneRaw = customer.phone || job.phone || '';
      const addressRaw = job.address || customer.address || 'No address';
      const statusRaw = job.status || 'lead';
      const codeRaw = job.customer_tracking_code || job.quote_code || '';
      const quoteRaw = job.quote_code || '';
      const trackUrl = codeRaw ? (window.location.origin + '/track.html?code=' + encodeURIComponent(codeRaw)) : '';
      const quoteUrl = quoteRaw ? (window.location.origin + '/quote.html?code=' + encodeURIComponent(quoteRaw)) : '';
      const value = job.contract_value ? '$' + Number(job.contract_value).toLocaleString() : 'TBD';
      const name = escHtml(nameRaw);
      const phone = escHtml(phoneRaw);
      const address = escHtml(addressRaw);
      const status = escHtml(statusRaw);
      const id = escHtml(job.id || '');
      return `
        <article class="mfr-tracker-card ct-row" data-search="${escHtml((nameRaw + ' ' + phoneRaw + ' ' + addressRaw).toLowerCase())}" data-status="${status}">
          <div class="mfr-tracker-card-top">
            <div class="mfr-tracker-avatar">${escHtml(getTrackerInitials(nameRaw))}</div>
            <div class="mfr-tracker-main">
              <div class="mfr-tracker-name">${name}</div>
              <div class="mfr-tracker-address">${address}</div>
              ${phone ? `<a class="mfr-tracker-phone" href="tel:${phone.replace(/[^0-9+]/g,'')}">${phone}</a>` : `<span class="mfr-tracker-phone muted">No phone</span>`}
            </div>
            <div class="mfr-tracker-value"><span>Value</span><strong>${value}</strong></div>
          </div>

          <div class="mfr-tracker-meta-grid">
            <div><span>Status</span><strong class="mfr-status-chip">${status.replace(/_/g,' ')}</strong></div>
            <div><span>Tracker Code</span><strong>${codeRaw ? escHtml(codeRaw) : 'Not generated'}</strong></div>
            <div><span>Quote Code</span><strong>${quoteRaw ? escHtml(quoteRaw) : 'No quote yet'}</strong></div>
          </div>

          <div class="mfr-tracker-link-box ${trackUrl ? '' : 'disabled'}">
            <span>${trackUrl ? escHtml(trackUrl) : 'Create or save a quote to generate a tracker link.'}</span>
          </div>

          <div class="mfr-tracker-actions">
            ${trackUrl ? `<button class="btn btn-primary" onclick="mfrCopyCustomerTrackerLink('${id}','track')">Copy Tracker</button><button class="btn btn-outline" onclick="mfrOpenCustomerTrackerLink('${id}','track')">Open Tracker</button>` : `<button class="btn btn-outline" disabled>No Tracker Yet</button>`}
            ${quoteUrl ? `<button class="btn btn-outline" onclick="mfrCopyCustomerTrackerLink('${id}','quote')">Copy Quote</button><button class="btn btn-outline" onclick="mfrOpenCustomerTrackerLink('${id}','quote')">Open Quote</button>` : ''}
            <button class="btn btn-outline" onclick="mfrViewCustomerTrackerJob('${id}')">View Job</button>
          </div>
        </article>`;
    }).join('');

    list.innerHTML = `<div class="mfr-tracker-list">${cards}</div><div id="ct-no-results" class="empty-state" style="display:none;padding:30px"><div class="icon">🔎</div><h3>No matching links</h3><p>Try clearing the search or status filter.</p></div>`;
  } catch(e) {
    console.error('Customer tracker page error:', e);
    document.getElementById('ct-list').innerHTML = '<div class="empty-state" style="padding:34px"><div class="icon">⚠️</div><h3>Unable to load tracker links</h3><p>' + escHtml(e.message || 'Check Supabase jobs/customer fields.') + '</p></div>';
  }
}

function getTrackerInitials(name) {
  return String(name || '?').trim().split(/\s+/).slice(0,2).map(p => p[0] || '').join('').toUpperCase() || '?';
}

function renderTrackerStats(jobs) {
  const total = jobs.length;
  const withTracker = jobs.filter(j => j.customer_tracking_code || j.quote_code).length;
  const withQuote = jobs.filter(j => j.quote_code).length;
  const active = jobs.filter(j => !['complete','paid','closed_lost'].includes(String(j.status || '').toLowerCase())).length;
  return `
    <div class="mfr-tracker-stat"><span>Total Links</span><strong>${total}</strong></div>
    <div class="mfr-tracker-stat"><span>With Tracker</span><strong>${withTracker}</strong></div>
    <div class="mfr-tracker-stat"><span>With Quote</span><strong>${withQuote}</strong></div>
    <div class="mfr-tracker-stat"><span>Active Jobs</span><strong>${active}</strong></div>`;
}

function mfrFindTrackerJob(jobId) {
  return (window.mfrCustomerTrackerJobs || []).find(j => String(j.id) === String(jobId));
}

function mfrBuildTrackerUrl(job, type) {
  if (!job) return '';
  const code = type === 'quote' ? job.quote_code : (job.customer_tracking_code || job.quote_code);
  if (!code) return '';
  return window.location.origin + (type === 'quote' ? '/quote.html?code=' : '/track.html?code=') + encodeURIComponent(code);
}

function mfrCopyCustomerTrackerLink(jobId, type) {
  const job = mfrFindTrackerJob(jobId);
  const url = mfrBuildTrackerUrl(job, type);
  if (!url) { toast(type === 'quote' ? 'No quote link yet.' : 'No tracker link yet.', 'warn'); return; }
  navigator.clipboard.writeText(url).then(() => toast((type === 'quote' ? 'Quote' : 'Tracking') + ' link copied!', 'success')).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = url;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
    toast((type === 'quote' ? 'Quote' : 'Tracking') + ' link copied!', 'success');
  });
}

function mfrOpenCustomerTrackerLink(jobId, type) {
  const job = mfrFindTrackerJob(jobId);
  const url = mfrBuildTrackerUrl(job, type);
  if (!url) { toast(type === 'quote' ? 'No quote link yet.' : 'No tracker link yet.', 'warn'); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function mfrViewCustomerTrackerJob(jobId) {
  if (typeof showJobDetail === 'function') { showJobDetail(jobId); return; }
  const job = attachCustomerFallback(mfrFindTrackerJob(jobId) || {});
  if (typeof showJobModal === 'function') { showJobModal(job); return; }
  toast('Unable to open job details.', 'error');
}

function filterCustomerTrackerRows() {
  const q = (document.getElementById('ct-search')?.value || '').toLowerCase().trim();
  const st = document.getElementById('ct-status')?.value || '';
  let visible = 0;
  document.querySelectorAll('.ct-row').forEach(row => {
    const hit = !q || (row.dataset.search || '').includes(q);
    const statusHit = !st || row.dataset.status === st;
    const show = hit && statusHit;
    row.style.display = show ? '' : 'none';
    if (show) visible++;
  });
  const none = document.getElementById('ct-no-results');
  if (none) none.style.display = visible ? 'none' : '';
  const pill = document.getElementById('ct-count-pill');
  if (pill) pill.textContent = visible + ' shown';
}

function injectCustomerTrackerStyles() {
  if (document.getElementById('mfr-customer-tracker-v2-styles')) return;
  const st = document.createElement('style');
  st.id = 'mfr-customer-tracker-v2-styles';
  st.textContent = `
    .mfr-tracker-page{max-width:1240px;margin:0 auto}.mfr-tracker-hero{background:linear-gradient(135deg,#0d1b3e,#0b63ce);color:white;border-radius:22px;padding:22px;border:1px solid rgba(255,255,255,.18);box-shadow:0 18px 40px rgba(13,27,62,.18);margin-bottom:18px;position:relative;overflow:hidden;display:flex;justify-content:space-between;gap:18px;align-items:flex-end}.mfr-tracker-hero:after{content:'';position:absolute;right:-60px;top:-60px;width:190px;height:190px;background:rgba(255,255,255,.10);border-radius:999px}.mfr-tracker-kicker{font-size:11px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;color:#BFDBFE;margin-bottom:8px}.mfr-tracker-hero h1{font-size:30px;line-height:1.05;font-weight:950;margin:0 0 6px;letter-spacing:-.03em}.mfr-tracker-hero p{margin:0;color:rgba(255,255,255,.78);max-width:720px;font-size:14px;line-height:1.45}.mfr-tracker-hero-actions{display:flex;gap:10px;flex-wrap:wrap;position:relative;z-index:2}.mfr-tracker-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}.mfr-tracker-stat{background:#fff;border:1px solid #E2E8F0;border-radius:16px;padding:14px;box-shadow:0 10px 28px rgba(15,23,42,.05)}.mfr-tracker-stat span{display:block;color:#64748B;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.mfr-tracker-stat strong{display:block;color:#0F172A;font-size:26px;font-weight:950;margin-top:4px}.mfr-tracker-filter-grid{display:grid;grid-template-columns:1.3fr .8fr .6fr;gap:10px;align-items:end}.mfr-tracker-refresh .btn{width:100%}.mfr-tracker-list{display:grid;gap:12px}.mfr-tracker-card{background:#fff;border:1px solid #E2E8F0;border-radius:18px;padding:14px;box-shadow:0 10px 26px rgba(15,23,42,.05)}.mfr-tracker-card:hover{border-color:#BFDBFE;box-shadow:0 14px 34px rgba(37,99,235,.10)}.mfr-tracker-card-top{display:grid;grid-template-columns:46px minmax(0,1fr) auto;gap:12px;align-items:center}.mfr-tracker-avatar{height:46px;width:46px;border-radius:15px;background:linear-gradient(135deg,#0d1b3e,#2563EB);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:950;letter-spacing:.02em}.mfr-tracker-name{font-size:15px;font-weight:950;color:#0F172A}.mfr-tracker-address{font-size:12px;color:#475569;margin-top:2px;line-height:1.35}.mfr-tracker-phone{font-size:12px;color:#2563EB;font-weight:800;text-decoration:none;margin-top:4px;display:inline-block}.mfr-tracker-phone.muted{color:#94A3B8}.mfr-tracker-value{text-align:right}.mfr-tracker-value span{display:block;font-size:10px;font-weight:950;color:#64748B;text-transform:uppercase;letter-spacing:.08em}.mfr-tracker-value strong{font-size:18px;font-weight:950;color:#16A34A}.mfr-tracker-meta-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px}.mfr-tracker-meta-grid div{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px;min-width:0}.mfr-tracker-meta-grid span{display:block;color:#64748B;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em}.mfr-tracker-meta-grid strong{display:block;margin-top:4px;color:#0F172A;font-size:12px;font-weight:900;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mfr-status-chip{text-transform:capitalize;color:#1D4ED8!important}.mfr-tracker-link-box{margin-top:12px;background:#F8FBFF;border:1px dashed #93C5FD;border-radius:13px;padding:10px;color:#1E3A8A;font-size:12px;font-weight:800;word-break:break-all}.mfr-tracker-link-box.disabled{background:#F8FAFC;border-color:#E2E8F0;color:#94A3B8}.mfr-tracker-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mfr-tracker-actions .btn{min-height:38px}.mfr-nav-pill{display:inline-flex;align-items:center;border:1px solid #DBEAFE;background:#EFF6FF;color:#1D4ED8;border-radius:999px;font-size:11px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;padding:7px 10px;white-space:nowrap}.mfr-est-panel{background:#fff;border:1px solid #E2E8F0;border-radius:18px;margin-bottom:14px;box-shadow:0 10px 28px rgba(15,23,42,.05);overflow:hidden}.mfr-est-panel-hd{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:14px 16px;border-bottom:1px solid #E2E8F0}.mfr-est-panel-title{font-size:16px;font-weight:950;color:#0F172A}.mfr-est-panel-sub{font-size:12px;color:#64748B;margin-top:3px;line-height:1.35}.mfr-est-panel-body{padding:14px 16px}
    @media(max-width:900px){.mfr-tracker-stats{grid-template-columns:repeat(2,1fr)}.mfr-tracker-filter-grid{grid-template-columns:1fr}.mfr-tracker-hero{align-items:flex-start;flex-direction:column}.mfr-tracker-hero-actions .btn{flex:1 1 150px}.mfr-tracker-hero-actions{width:100%}}
    @media(max-width:760px){.mfr-tracker-page{padding:0 2px}.mfr-tracker-hero{border-radius:16px;padding:16px;margin-bottom:12px}.mfr-tracker-hero h1{font-size:24px}.mfr-tracker-hero-actions .btn{width:100%;flex:1 1 100%}.mfr-tracker-stats{grid-template-columns:1fr 1fr;gap:8px}.mfr-tracker-stat{padding:12px;border-radius:14px}.mfr-tracker-stat strong{font-size:22px}.mfr-est-panel{border-radius:16px}.mfr-est-panel-hd{padding:13px;display:block}.mfr-est-panel-hd .mfr-nav-pill{margin-top:10px}.mfr-est-panel-body{padding:13px}.mfr-tracker-card{border-radius:16px;padding:13px}.mfr-tracker-card-top{grid-template-columns:42px minmax(0,1fr);align-items:start}.mfr-tracker-avatar{height:42px;width:42px;border-radius:14px}.mfr-tracker-value{grid-column:1/-1;text-align:left;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px;display:flex;justify-content:space-between;align-items:center}.mfr-tracker-meta-grid{grid-template-columns:1fr}.mfr-tracker-actions{display:grid;grid-template-columns:1fr;gap:8px}.mfr-tracker-actions .btn{width:100%;justify-content:center}.mfr-tracker-link-box{font-size:11px}.mfr-tracker-name{font-size:16px}}
  `;
  document.head.appendChild(st);
}

// CUSTOMER TRACKING LINK
// ══════════════════════════════════════════════════════════════
function copyTrackingLink(jobId, code, event) {
  event?.stopPropagation();
  
  const baseUrl = window.location.origin;
  const trackingUrl = baseUrl + '/track.html?code=' + code;
  
  navigator.clipboard.writeText(trackingUrl).then(() => {
    toast('Tracking link copied! Send to customer via text or email.', 'success');
  }).catch(() => {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = trackingUrl;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    toast('Tracking link copied!', 'success');
  });
}

function showTrackingLinkModal(job) {
  const baseUrl = window.location.origin;
  const trackingUrl = baseUrl + '/track.html?code=' + job.customer_tracking_code;
  
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = '<div class="modal-sheet"><div class="modal-drag"></div><h3 style="font-size:18px;font-weight:800;margin-bottom:16px">📍 Customer Tracking Link</h3><div style="margin-bottom:16px"><div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:8px">Job: ' + (job.address || 'Unknown Address') + '</div><div style="background:var(--gray);padding:12px;border-radius:6px;font-size:13px;word-break:break-all;margin-bottom:12px">' + trackingUrl + '</div><p style="font-size:13px;color:var(--text3);margin-bottom:16px">Share this link with your customer via text or email. They can track their project progress without logging in.</p></div><div style="display:flex;gap:8px"><button class="btn btn-primary" onclick="copyTrackingLink(\'' + job.id + '\',\'' + job.customer_tracking_code + '\'); this.closest(\'.modal-overlay\').remove()">📋 Copy Link</button><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div></div>';
  
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}


function showJobModal(job) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = '<div class="modal-sheet"><div class="modal-drag"></div><h3 style="font-size:18px;font-weight:800;margin-bottom:4px">' + (job.customers?.name || 'Job Details') + '</h3><p style="font-size:13px;color:var(--text3);margin-bottom:16px">' + (job.address || job.customers?.address || 'No address') + '</p><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px"><div><div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:4px">STATUS</div><div style="font-size:14px;font-weight:600">' + (job.status || 'lead') + '</div></div><div><div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:4px">VALUE</div><div style="font-size:14px;font-weight:600">' + (job.contract_value ? '$' + Number(job.contract_value).toLocaleString() : 'TBD') + '</div></div><div><div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:4px">MARKETING CHANNEL</div><div style="font-size:14px;font-weight:600">' + (job.marketing_channel || 'Not set') + '</div></div><div><div style="font-size:11px;font-weight:600;color:var(--text3);margin-bottom:4px">TRACKING CODE</div><div style="font-size:14px;font-weight:600;font-family:monospace">' + (job.customer_tracking_code || 'N/A') + '</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="showTrackingLinkModal(' + JSON.stringify(job).replace(/"/g, '&quot;') + '); this.closest(\'.modal-overlay\').remove()">📍 Get Tracking Link</button><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div></div>';
  
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}


// ══════════════════════════════════════════════════════════════
// NEW LEAD CREATION
// ══════════════════════════════════════════════════════════════
function newJobModal() {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `<div class="modal-sheet"><div class="modal-drag"></div><h3 style="font-size:18px;font-weight:800;margin-bottom:16px">📋 Create New Lead</h3><div class="form-grid"><div class="fg"><label class="fl">Customer Name *</label><input class="fi" id="nj-name" placeholder="John Smith" required></div><div class="fg"><label class="fl">Phone *</label><input class="fi" id="nj-phone" type="tel" placeholder="(970) 555-1234" required></div><div class="fg"><label class="fl">Email</label><input class="fi" id="nj-email" type="email" placeholder="john@example.com"></div><div class="fg"><label class="fl">Address</label><input class="fi" id="nj-address" placeholder="123 Main St"></div><div class="fg fg-full"><label class="fl">Marketing Channel</label><select class="fs" id="nj-channel"><option value="">Select...</option><option>Google Ads</option><option>Facebook</option><option>Instagram</option><option>Door Knocking</option><option>Referrals</option></select></div><div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="nj-notes" rows="2"></textarea></div></div><div style="display:flex;gap:8px;margin-top:16px"><button class="btn btn-primary" onclick="createNewLead()">Create Lead</button><button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button></div></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  setTimeout(() => document.getElementById('nj-name')?.focus(), 100);
}

async function createNewLead() {
  const name = document.getElementById('nj-name')?.value?.trim();
  const phone = document.getElementById('nj-phone')?.value?.trim();
  const email = document.getElementById('nj-email')?.value?.trim();
  const address = document.getElementById('nj-address')?.value?.trim();
  const channel = document.getElementById('nj-channel')?.value;
  const notes = document.getElementById('nj-notes')?.value?.trim();
  
  if (!name || !phone) {
    toast('Name and phone required', 'error');
    return;
  }
  
  try {
    const parts = name.split(' ');
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ') || '';
    
    const { data: existingCustomer } = await _sb.from('customers').select('id').eq('phone', phone).single();
    
    let customerId;
    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error } = await _sb.from('customers').insert({ first_name: firstName, last_name: lastName, phone, email: email || null, address: address || null }).select().single();
      if (error) throw error;
      customerId = newCustomer.id;
    }
    
    const { data: newJob, error: jobError } = await _sb.from('jobs').insert({ 
      customer_id: customerId, 
      status: 'lead', 
      marketing_channel: channel || null, 
      notes: notes || null, 
      assigned_to: _user.id 
    }).select().single();
    if (jobError) throw jobError;
    
    toast('Lead created!', 'success');
    document.querySelector('.modal-overlay')?.remove();
    
    if (_page === 'pipeline') await pagePipeline(document.getElementById('content'));
    
  } catch(e) {
    console.error(e);
    toast('Failed: ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS PAGE
// ══════════════════════════════════════════════════════════════
async function pageCustomers(c) {
  c.innerHTML = `<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Customers</div><div class="page-sub">All customers</div></div><button class="btn btn-primary btn-sm" onclick="newJobModal()">+ New Lead</button></div><div class="card"><div class="card-body" style="padding:0"><div id="cust-list"><div style="text-align:center;padding:40px">Loading...</div></div></div></div></div>`;
  
  try {
    const { data } = await _sb.from('v_customer_summary').select('*').order('name');
    if (!data || data.length === 0) {
      document.getElementById('cust-list').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">No customers yet</div>';
      return;
    }
    
    document.getElementById('cust-list').innerHTML = `<table class="tbl"><thead><tr><th>Name</th><th>Phone</th><th>Jobs</th><th>Value</th><th></th></tr></thead><tbody>${data.map(c => `<tr><td><strong>${c.name || 'Unknown'}</strong></td><td>${c.phone || '—'}</td><td>${c.total_jobs || 0}</td><td>$${Number(c.lifetime_value || 0).toLocaleString()}</td><td><button class="btn btn-sm btn-outline" onclick="showCustomerModal('${c.id}')">View →</button></td></tr>`).join('')}</tbody></table>`;
  } catch(e) {
    console.error(e);
    document.getElementById('cust-list').innerHTML = '<div style="text-align:center;padding:40px;color:red">Error loading customers</div>';
  }
}

// ══════════════════════════════════════════════════════════════
// ENHANCED CUSTOMER MODAL - COMPLETE SYSTEM
// ══════════════════════════════════════════════════════════════

let _activeCustomer = null;
let _activeTab = 'jobs';

async function showCustomerModal(customerId) {
  _activeCustomer = customerId;
  _activeTab = 'jobs';
  await refreshCustomerModal();
}

async function refreshCustomerModal() {
  if (!_activeCustomer) return;
  
  try {
    // Fetch all customer data
    const { data: customer } = await _sb.from('customers').select('*').eq('id', _activeCustomer).single();
    const { data: jobs } = await _sb.from('jobs').select('*').eq('customer_id', _activeCustomer).order('created_at', { ascending: false });
    const { data: calls } = await _sb.from('call_log').select('*, profiles(email)').eq('customer_id', _activeCustomer).order('created_at', { ascending: false });
    
    // Count photos and docs for each job
    const jobsWithCounts = await Promise.all(jobs.map(async (j) => {
      const { count: photoCount } = await _sb.from('job_photos').select('*', { count: 'exact', head: true }).eq('job_id', j.id);
      const { count: docCount } = await _sb.from('job_documents').select('*', { count: 'exact', head: true }).eq('job_id', j.id);
      const { data: signature } = await _sb.from('quote_signatures').select('*').eq('job_id', j.id).single();
      return { ...j, photoCount: photoCount || 0, docCount: docCount || 0, isSigned: !!signature };
    }));
    
    // Build modal
    const existingModal = document.querySelector('.modal-overlay.customer-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay customer-modal';
    modal.innerHTML = `
      <div class="modal-sheet" style="max-width:800px;max-height:90vh">
        <div class="modal-drag"></div>
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:16px">
          <div>
            <h3 style="font-size:22px;font-weight:800;margin-bottom:4px">${customer.first_name} ${customer.last_name}</h3>
            <div style="font-size:13px;color:var(--text2);display:flex;gap:16px;flex-wrap:wrap">
              <span>📞 ${customer.phone || 'No phone'}</span>
              <span>✉️ ${customer.email || 'No email'}</span>
            </div>
            ${customer.address ? `<div style="font-size:13px;color:var(--text3);margin-top:4px">📍 ${customer.address}${customer.city ? ', ' + customer.city : ''}${customer.state ? ', ' + customer.state : ''}</div>` : ''}
          </div>
          <button class="btn btn-sm btn-outline" onclick="editCustomerInfo()">✏️ Edit</button>
        </div>
        
        <!-- Quick Actions -->
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
          <button class="btn btn-sm btn-primary" onclick="newJobForCustomer('${_activeCustomer}')">+ New Job</button>
          <a href="tel:${customer.phone || ''}" class="btn btn-sm btn-outline">📞 Call</a>
          <button class="btn btn-sm btn-outline" onclick="composeEmail('${_activeCustomer}')">✉️ Send Email</button>
          <button class="btn btn-sm btn-outline" onclick="addCustomerNote('${_activeCustomer}')">📝 Add Note</button>
        </div>
        
        <!-- Tabs -->
        <div style="border-bottom:2px solid var(--border);margin-bottom:16px">
          <div style="display:flex;gap:24px">
            <button class="tab-btn ${_activeTab === 'jobs' ? 'active' : ''}" onclick="switchTab('jobs')">Jobs (${jobsWithCounts.length})</button>
            <button class="tab-btn ${_activeTab === 'calls' ? 'active' : ''}" onclick="switchTab('calls')">Calls (${calls?.length || 0})</button>
            <button class="tab-btn ${_activeTab === 'notes' ? 'active' : ''}" onclick="switchTab('notes')">Notes</button>
            <button class="tab-btn ${_activeTab === 'timeline' ? 'active' : ''}" onclick="switchTab('timeline')">Timeline</button>
          </div>
        </div>
        
        <!-- Tab Content -->
        <div id="tab-content" style="max-height:400px;overflow-y:auto">
          ${renderTabContentWithNotes(_activeTab, jobsWithCounts, calls, customer)}
        </div>
        
        <!-- Footer -->
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border);display:flex;justify-content:flex-end">
          <button class="btn btn-outline" onclick="closeCustomerModal()">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeCustomerModal(); });
    
  } catch(e) {
    console.error('Customer modal error:', e);
    toast('Failed to load customer', 'error');
  }
}

function renderTabContent(tab, jobs, calls, customer) {
  if (tab === 'jobs') {
    return renderJobsTab(jobs, customer);
  } else if (tab === 'calls') {
    return renderCallsTab(calls);
  } else if (tab === 'timeline') {
    return renderTimelineTab(jobs, calls);
  }
  return '';
}

function renderJobsTab(jobs, customer) {
  if (!jobs || jobs.length === 0) {
    return '<div style="text-align:center;padding:40px;color:var(--text3)">No jobs yet</div>';
  }
  
  return jobs.map(j => `
    <div class="job-card" style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:12px">
      <!-- Job Header -->
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div>
          <div style="font-size:15px;font-weight:700">${customer.address || 'No address'}</div>
          <div style="font-size:12px;color:var(--text3);margin-top:2px">
            Created ${new Date(j.created_at).toLocaleDateString()}
            ${j.marketing_channel ? ' • Source: ' + j.marketing_channel : ''}
          </div>
        </div>
        ${j.contract_value ? `<div style="font-size:16px;font-weight:800;color:var(--green)">$${Number(j.contract_value).toLocaleString()}</div>` : '<div style="font-size:14px;color:var(--text3)">No estimate</div>'}
      </div>
      
      <!-- Status -->
      <div style="margin-bottom:12px">
        <select class="fs" style="font-size:13px;padding:6px 12px" onchange="updateJobStatus('${j.id}', this.value)">
          <option value="lead" ${j.status === 'lead' ? 'selected' : ''}>📋 Lead</option>
          <option value="inspection_scheduled" ${j.status === 'inspection_scheduled' ? 'selected' : ''}>📅 Inspection Scheduled</option>
          <option value="inspected" ${j.status === 'inspected' ? 'selected' : ''}>✅ Inspected</option>
          <option value="estimate_sent" ${j.status === 'estimate_sent' ? 'selected' : ''}>💰 Estimate Sent</option>
          <option value="contract_signed" ${j.status === 'contract_signed' ? 'selected' : ''}>✍️ Contract Signed</option>
          <option value="in_production" ${j.status === 'in_production' ? 'selected' : ''}>🏗️ In Production</option>
          <option value="complete" ${j.status === 'complete' ? 'selected' : ''}>🎉 Complete</option>
          <option value="paid" ${j.status === 'paid' ? 'selected' : ''}>✨ Paid</option>
        </select>
      </div>
      
      <!-- Actions -->
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline" onclick="editJobNotes('${j.id}', ${JSON.stringify(j.notes || '').replace(/"/g, '&quot;')})">📝 Notes</button>
        <button class="btn btn-sm btn-outline" onclick="openEstimateBuilder('${j.id}')">💰 Estimate</button>
        <button class="btn btn-sm btn-outline" onclick="uploadPhotos('${j.id}')">${j.photoCount > 0 ? `📸 Photos (${j.photoCount})` : '📸 Upload Photos'}</button>
        <button class="btn btn-sm btn-outline" onclick="uploadDocuments('${j.id}')">${j.docCount > 0 ? `📄 Docs (${j.docCount})` : '📄 Upload Docs'}</button>
        ${j.customer_tracking_code ? `<button class="btn btn-sm btn-outline" onclick="copyTrackingLink('${j.id}','${j.customer_tracking_code}')">📍 Tracking</button>` : ''}
        ${j.quote_code ? `<button class="btn btn-sm btn-outline" onclick="copyQuoteLink('${j.quote_code}')">${j.isSigned ? '✅' : '💰'} Quote</button>` : ''}
        <button class="btn btn-sm btn-outline" onclick="scheduleAppointment('${j.id}')">📅 Schedule</button>
      </div>
      
      ${j.notes ? `<div style="margin-top:12px;padding:8px;background:white;border-radius:4px;font-size:12px;color:var(--text2)">${j.notes}</div>` : ''}
    </div>
  `).join('');
}

function renderCallsTab(calls) {
  if (!calls || calls.length === 0) {
    return '<div style="text-align:center;padding:40px;color:var(--text3)">No calls logged</div>';
  }
  
  return `<div style="display:flex;flex-direction:column;gap:8px">${calls.map(c => `
    <div style="padding:12px;background:var(--gray);border-radius:8px">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px">
        <div style="font-size:13px;font-weight:600">${c.call_purpose || 'Call'} • ${c.call_type || 'outbound'}</div>
        <div style="font-size:12px;color:var(--text3)">${new Date(c.created_at).toLocaleString()}</div>
      </div>
      ${c.notes ? `<div style="font-size:12px;color:var(--text2)">${c.notes}</div>` : ''}
      ${c.duration_seconds ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">Duration: ${Math.floor(c.duration_seconds / 60)}m ${c.duration_seconds % 60}s</div>` : ''}
    </div>
  `).join('')}</div>`;
}

function renderTimelineTab(jobs, calls) {
  const events = [];
  
  jobs.forEach(j => {
    events.push({ type: 'job_created', date: j.created_at, text: `Job created • ${j.status}` });
    if (j.appointment_set_date) events.push({ type: 'appointment', date: j.appointment_set_date, text: 'Appointment scheduled' });
    if (j.closed_date) events.push({ type: 'closed', date: j.closed_date, text: 'Job closed' });
  });
  
  calls?.forEach(c => {
    events.push({ type: 'call', date: c.created_at, text: `Call logged: ${c.call_purpose || 'General'}` });
  });
  
  events.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  if (events.length === 0) {
    return '<div style="text-align:center;padding:40px;color:var(--text3)">No activity yet</div>';
  }
  
  return `<div style="display:flex;flex-direction:column;gap:8px">${events.map(e => `
    <div style="padding:12px;background:var(--gray);border-radius:8px;display:flex;justify-content:space-between">
      <div style="font-size:13px">${e.text}</div>
      <div style="font-size:12px;color:var(--text3)">${new Date(e.date).toLocaleDateString()}</div>
    </div>
  `).join('')}</div>`;
}

function switchTab(tab) {
  _activeTab = tab;
  refreshCustomerModal();
}

function closeCustomerModal() {
  document.querySelector('.modal-overlay.customer-modal')?.remove();
  _activeCustomer = null;
  _activeTab = 'jobs';
}
// ══════════════════════════════════════════════════════════════
// CUSTOMER MODAL ACTIONS
// ══════════════════════════════════════════════════════════════

// Edit Customer Info
function editCustomerInfo() {
  // Get current customer data
  _sb.from('customers').select('*').eq('id', _activeCustomer).single().then(({ data: customer }) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay edit-modal';
    modal.innerHTML = `<div class="modal-sheet">
      <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Edit Customer</h3>
      <div class="form-grid">
        <div class="fg"><label class="fl">First Name</label><input class="fi" id="edit-fname" value="${customer.first_name || ''}"></div>
        <div class="fg"><label class="fl">Last Name</label><input class="fi" id="edit-lname" value="${customer.last_name || ''}"></div>
        <div class="fg"><label class="fl">Phone</label><input class="fi" id="edit-phone" value="${customer.phone || ''}"></div>
        <div class="fg"><label class="fl">Email</label><input class="fi" id="edit-email" value="${customer.email || ''}"></div>
        <div class="fg fg-full"><label class="fl">Address</label><input class="fi" id="edit-address" value="${customer.address || ''}"></div>
        <div class="fg"><label class="fl">City</label><input class="fi" id="edit-city" value="${customer.city || ''}"></div>
        <div class="fg"><label class="fl">State</label><input class="fi" id="edit-state" value="${customer.state || ''}"></div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" onclick="saveCustomerInfo()">Save</button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
  });
}

async function saveCustomerInfo() {
  const updates = {
    first_name: document.getElementById('edit-fname').value.trim(),
    last_name: document.getElementById('edit-lname').value.trim(),
    phone: document.getElementById('edit-phone').value.trim(),
    email: document.getElementById('edit-email').value.trim() || null,
    address: document.getElementById('edit-address').value.trim() || null,
    city: document.getElementById('edit-city').value.trim() || null,
    state: document.getElementById('edit-state').value.trim() || null
  };
  
  try {
    const { error } = await _sb.from('customers').update(updates).eq('id', _activeCustomer);
    if (error) throw error;
    toast('Customer updated!', 'success');
    document.querySelector('.edit-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed to update: ' + e.message, 'error');
  }
}

// New Job for Customer
function newJobForCustomer(customerId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay new-job-modal';
  modal.innerHTML = `<div class="modal-sheet">
    <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Create New Job</h3>
    <div class="form-grid">
      <div class="fg fg-full"><label class="fl">Marketing Channel</label><select class="fs" id="njob-channel"><option value="">Select...</option><option>Google Ads</option><option>Facebook</option><option>Instagram</option><option>Door Knocking</option><option>Referrals</option></select></div>
      <div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="njob-notes" rows="2"></textarea></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveNewJob('${customerId}')">Create Job</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function saveNewJob(customerId) {
  const channel = document.getElementById('njob-channel').value;
  const notes = document.getElementById('njob-notes').value.trim();
  
  try {
    const { error } = await _sb.from('jobs').insert({
      customer_id: customerId,
      status: 'lead',
      marketing_channel: channel || null,
      notes: notes || null,
      assigned_to: _user.id
    });
    if (error) throw error;
    toast('Job created!', 'success');
    document.querySelector('.new-job-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// Update Job Status
async function updateJobStatus(jobId, newStatus) {
  try {
    const updates = { status: newStatus };
    
    // Auto-update dates based on status
    if (newStatus === 'inspection_scheduled' && !updates.appointment_set_date) {
      updates.appointment_set_date = new Date().toISOString();
    }
    if (['complete', 'paid'].includes(newStatus) && !updates.closed_date) {
      updates.closed_date = new Date().toISOString();
    }
    
    const { error } = await _sb.from('jobs').update(updates).eq('id', jobId);
    if (error) throw error;
    toast('Status updated!', 'success');
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// Edit Job Notes
function editJobNotes(jobId, currentNotes) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay notes-modal';
  modal.innerHTML = `<div class="modal-sheet">
    <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Job Notes</h3>
    <textarea class="fi" id="job-notes-text" rows="6" style="width:100%">${currentNotes || ''}</textarea>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveJobNotes('${jobId}')">Save</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function saveJobNotes(jobId) {
  const notes = document.getElementById('job-notes-text').value.trim();
  try {
    const { error } = await _sb.from('jobs').update({ notes }).eq('id', jobId);
    if (error) throw error;
    toast('Notes saved!', 'success');
    document.querySelector('.notes-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// Log Call
function logCallModal(customerId, jobId = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay call-modal';
  modal.innerHTML = `<div class="modal-sheet">
    <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Log Call</h3>
    <div class="form-grid">
      <div class="fg"><label class="fl">Call Type</label><select class="fs" id="call-type"><option>outbound</option><option>inbound</option></select></div>
      <div class="fg"><label class="fl">Purpose</label><select class="fs" id="call-purpose"><option>follow-up</option><option>closing</option><option>support</option><option>objection</option><option>other</option></select></div>
      <div class="fg"><label class="fl">Duration (min)</label><input class="fi" id="call-duration" type="number" placeholder="5"></div>
      <div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="call-notes" rows="3"></textarea></div>
    </div>
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveCall('${customerId}', ${jobId ? `'${jobId}'` : 'null'})">Save Call</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

async function saveCall(customerId, jobId) {
  const type = document.getElementById('call-type').value;
  const purpose = document.getElementById('call-purpose').value;
  const duration = document.getElementById('call-duration').value;
  const notes = document.getElementById('call-notes').value.trim();
  
  try {
    const { error } = await _sb.from('call_log').insert({
      customer_id: customerId,
      job_id: jobId,
      caller_user_id: _user.id,
      call_type: type,
      call_purpose: purpose,
      duration_seconds: duration ? parseInt(duration) * 60 : null,
      notes: notes || null
    });
    if (error) throw error;
    toast('Call logged!', 'success');
    document.querySelector('.call-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed: ' + e.message, 'error');
  }
}

// Schedule Appointment
// ══════════════════════════════════════════════════════════════
// ENHANCED APPOINTMENT SCHEDULING
// ══════════════════════════════════════════════════════════════

function scheduleAppointment(jobId) {
  // Get customer ID from job
  _sb.from('jobs').select('customer_id, customers(*)').eq('id', jobId).single().then(({ data: job }) => {
    if (!job) return;
    
    // Get all users for assignment dropdown
    _sb.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name').then(({ data: users }) => {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay appt-modal';
      modal.innerHTML = `<div class="modal-sheet" style="max-width:600px">
        <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">📅 Schedule Appointment</h3>
        
        <div style="background:var(--gray);padding:12px;border-radius:8px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600">${job.customers.first_name} ${job.customers.last_name}</div>
          <div style="font-size:12px;color:var(--text3)">${job.customers.phone || 'No phone'}</div>
        </div>
        
        <div class="form-grid">
          <div class="fg"><label class="fl">Date *</label><input class="fi" id="appt-date" type="date" required></div>
          <div class="fg"><label class="fl">Time *</label><input class="fi" id="appt-time" type="time" required></div>
          <div class="fg"><label class="fl">Type *</label>
            <select class="fs" id="appt-type">
              <option value="inspection">Inspection</option>
              <option value="estimate">Estimate</option>
              <option value="follow_up">Follow-up</option>
              <option value="adjuster_meeting">Adjuster Meeting</option>
              <option value="production">Production</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="fg"><label class="fl">Duration (min)</label><input class="fi" id="appt-duration" type="number" value="60"></div>
          <div class="fg fg-full"><label class="fl">Assign To *</label>
            <select class="fs" id="appt-assign">
              <option value="${_user.id}">${_user.full_name || _user.email} (Me)</option>
              ${users?.filter(u => u.id !== _user.id).map(u => `<option value="${u.id}">${u.full_name || u.email}</option>`).join('') || ''}
            </select>
          </div>
          <div class="fg fg-full"><label class="fl">Customer Notes</label><textarea class="fi" id="appt-notes" rows="2" placeholder="Notes visible to customer"></textarea></div>
          <div class="fg fg-full"><label class="fl">Internal Notes</label><textarea class="fi" id="appt-internal" rows="2" placeholder="Private staff notes"></textarea></div>
        </div>
        
        <div style="display:flex;gap:8px;margin-top:16px">
          <button class="btn btn-primary" onclick="saveAppointmentFull('${jobId}', '${job.customer_id}')">📅 Schedule</button>
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        </div>
      </div>`;
      
      document.body.appendChild(modal);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('appt-date').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('appt-time').value = '09:00';
    });
  });
}

async function saveAppointmentFull(jobId, customerId) {
  const date = document.getElementById('appt-date')?.value;
  const time = document.getElementById('appt-time')?.value;
  const type = document.getElementById('appt-type')?.value;
  const duration = parseInt(document.getElementById('appt-duration')?.value) || 60;
  const assignTo = document.getElementById('appt-assign')?.value;
  const notes = document.getElementById('appt-notes')?.value?.trim();
  const internalNotes = document.getElementById('appt-internal')?.value?.trim();
  
  if (!date || !time || !assignTo) {
    toast('Date, time, and assignment required', 'error');
    return;
  }
  
  try {
    const datetime = date + 'T' + time + ':00';
    
    // 1. Create appointment record
    const { data: newAppt, error: apptError } = await _sb.from('appointments').insert({
      job_id: jobId,
      customer_id: customerId,
      assigned_to: assignTo,
      created_by: _user.id,
      scheduled_at: datetime,
      appt_type: type,
      duration_minutes: duration,
      status: 'scheduled',
      notes: notes || null,
      internal_notes: internalNotes || null
    }).select().single();
    
    if (apptError) throw apptError;
    
    // 2. Update job status and appointment date
    await _sb.from('jobs').update({
      status: 'inspection_scheduled',
      appointment_set_date: datetime
    }).eq('id', jobId);
    
    // 3. Create activity note
    await _sb.from('customer_notes').insert({
      customer_id: customerId,
      job_id: jobId,
      created_by: _user.id,
      note_type: 'appointment',
      subject: `Appointment Scheduled: ${type}`,
      note_text: `Appointment scheduled for ${new Date(datetime).toLocaleString()}. Type: ${type}. Duration: ${duration} minutes.${notes ? '\n\nNotes: ' + notes : ''}`
    });
    
    toast('Appointment scheduled successfully!', 'success');
    document.querySelector('.appt-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    console.error('Schedule appointment error:', e);
    toast('Failed to schedule: ' + e.message, 'error');
  }
}

// ══════════════════════════════════════════════════════════════
// APPOINTMENTS PAGE - FULL MANAGEMENT
// ══════════════════════════════════════════════════════════════

async function pageAppointments(c) {
  const viewMode = sessionStorage.getItem('appointments_view') || 'all';
  
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div>
        <div class="page-title">Appointments</div>
        <div class="page-sub">Manage all scheduled appointments</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}" onclick="switchAppointmentView('all')">All</button>
        <button class="btn btn-sm ${viewMode === 'my' ? 'btn-primary' : 'btn-outline'}" onclick="switchAppointmentView('my')">My Appointments</button>
        <button class="btn btn-sm ${viewMode === 'today' ? 'btn-primary' : 'btn-outline'}" onclick="switchAppointmentView('today')">Today</button>
        <button class="btn btn-sm ${viewMode === 'upcoming' ? 'btn-primary' : 'btn-outline'}" onclick="switchAppointmentView('upcoming')">Upcoming</button>
      </div>
    </div>
    
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="padding:12px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">
          <select class="fs" id="appt-filter-status" onchange="loadAppointmentsList()" style="font-size:12px">
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
          <select class="fs" id="appt-filter-type" onchange="loadAppointmentsList()" style="font-size:12px">
            <option value="">All Types</option>
            <option value="inspection">Inspection</option>
            <option value="estimate">Estimate</option>
            <option value="follow_up">Follow-up</option>
            <option value="adjuster_meeting">Adjuster Meeting</option>
            <option value="production">Production</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body" style="padding:0" id="appointments-list">
        <div style="text-align:center;padding:40px">Loading appointments...</div>
      </div>
    </div>
  </div>`;
  
  await loadAppointmentsList();
}

function switchAppointmentView(view) {
  sessionStorage.setItem('appointments_view', view);
  pageAppointments(document.getElementById('content'));
}

async function loadAppointmentsList() {
  const viewMode = sessionStorage.getItem('appointments_view') || 'all';
  const statusFilter = document.getElementById('appt-filter-status')?.value;
  const typeFilter = document.getElementById('appt-filter-type')?.value;
  
  try {
    let query = _sb.from('v_appointments_full').select('*');
    
    if (viewMode === 'my') {
      query = query.eq('assigned_to', _user.id);
    } else if (viewMode === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('appointment_date', today + 'T00:00:00').lte('appointment_date', today + 'T23:59:59');
    } else if (viewMode === 'upcoming') {
      query = query.gte('appointment_date', new Date().toISOString());
    }
    
    if (statusFilter) query = query.eq('status', statusFilter);
    if (typeFilter) query = query.eq('appointment_type', typeFilter);
    
    query = query.order('appointment_date', { ascending: true });
    
    const { data: appointments } = await query;
    
    const listEl = document.getElementById('appointments-list');
    
    if (!appointments || appointments.length === 0) {
      listEl.innerHTML = '<div class="empty-state" style="padding:40px"><div class="icon">📅</div><h3>No Appointments</h3></div>';
      return;
    }
    
    listEl.innerHTML = `<table class="tbl">
      <thead>
        <tr>
          <th>Date & Time</th>
          <th>Customer</th>
          <th>Assigned To</th>
          <th>Type</th>
          <th>Assigned To</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${appointments.map(a => {
          const apptDate = new Date(a.appointment_date);
          const statusColors = {
            scheduled: 'blue',
            confirmed: 'green',
            completed: 'gray',
            cancelled: 'red',
            no_show: 'orange'
          };
          
          return `<tr style="${apptDate < new Date() && a.status === 'scheduled' ? 'background:#FEF3C7' : ''}">
            <td>
              <div style="font-weight:600;font-size:13px">${apptDate.toLocaleDateString()}</div>
              <div style="font-size:11px;color:var(--text3)">${apptDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
            </td>
            <td>
              <div style="font-weight:600;font-size:13px">${a.customer_name || 'Unknown'}</div>
              <div style="font-size:11px;color:var(--text3)">${a.customer_phone || ''}</div>
            </td>
            <td><span class="badge badge-blue" style="font-size:10px">${a.appointment_type}</span></td>
            <td style="font-size:12px">${a.assigned_to_name || 'Unassigned'}</td>
            <td><span class="badge badge-${statusColors[a.status] || 'gray'}" style="font-size:10px">${a.status}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="viewAppointmentDetail('${a.id}')">View</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
    
  } catch(e) {
    console.error('Load appointments error:', e);
    document.getElementById('appointments-list').innerHTML = '<div style="padding:40px;text-align:center;color:red">Error loading</div>';
  }
}

async function viewAppointmentDetail(appointmentId) {
  try {
    const { data: appt } = await _sb.from('v_appointments_full').select('*').eq('id', appointmentId).single();
    if (!appt) return;
    
    // Get all users for reassignment
    const { data: users } = await _sb.from('profiles').select('id, full_name').eq('is_active', true).order('full_name');
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay appt-detail-modal';
    modal.innerHTML = `<div class="modal-sheet" style="max-width:700px">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">📅 Appointment Details</h3>
      
      <div style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:16px;font-weight:700;margin-bottom:4px">${appt.customer_name}</div>
        <div style="font-size:13px;color:var(--text2)">${appt.customer_phone || ''} • ${appt.customer_address || ''}</div>
      </div>
      
      <div class="form-grid" style="margin-bottom:16px">
        <div class="fg"><label class="fl">Date</label><input class="fi" id="edit-appt-date" type="date" value="${appt.appointment_date.split('T')[0]}"></div>
        <div class="fg"><label class="fl">Time</label><input class="fi" id="edit-appt-time" type="time" value="${appt.appointment_date.split('T')[1].substring(0,5)}"></div>
        <div class="fg"><label class="fl">Type</label>
          <select class="fs" id="edit-appt-type">
            <option value="inspection" ${appt.appointment_type === 'inspection' ? 'selected' : ''}>Inspection</option>
            <option value="estimate" ${appt.appointment_type === 'estimate' ? 'selected' : ''}>Estimate</option>
            <option value="follow_up" ${appt.appointment_type === 'follow_up' ? 'selected' : ''}>Follow-up</option>
            <option value="adjuster_meeting" ${appt.appointment_type === 'adjuster_meeting' ? 'selected' : ''}>Adjuster Meeting</option>
            <option value="production" ${appt.appointment_type === 'production' ? 'selected' : ''}>Production</option>
            <option value="other" ${appt.appointment_type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="fg"><label class="fl">Status</label>
          <select class="fs" id="edit-appt-status">
            <option value="scheduled" ${appt.status === 'scheduled' ? 'selected' : ''}>Scheduled</option>
            <option value="confirmed" ${appt.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${appt.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled" ${appt.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
            <option value="no_show" ${appt.status === 'no_show' ? 'selected' : ''}>No Show</option>
          </select>
        </div>
        <div class="fg fg-full"><label class="fl">Assigned To</label>
          <select class="fs" id="edit-appt-assign">
            ${users?.map(u => `<option value="${u.id}" ${appt.assigned_to === u.id ? 'selected' : ''}>${u.full_name || u.email}</option>`).join('')}
          </select>
        </div>
        <div class="fg fg-full"><label class="fl">Notes</label><textarea class="fi" id="edit-appt-notes" rows="2">${appt.notes || ''}</textarea></div>
        <div class="fg fg-full"><label class="fl">Internal Notes</label><textarea class="fi" id="edit-appt-internal" rows="2">${appt.internal_notes || ''}</textarea></div>
      </div>
      
      <div style="display:flex;gap:8px;justify-content:space-between">
        <button class="btn btn-outline" style="color:red" onclick="deleteAppointment('${appt.id}')">🗑️ Delete</button>
        <div style="display:flex;gap:8px">
          <button class="btn btn-primary" onclick="saveAppointmentEdit('${appt.id}')">💾 Save Changes</button>
          <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
      </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  } catch(e) {
    console.error('View appointment error:', e);
    toast('Failed to load appointment', 'error');
  }
}

async function saveAppointmentEdit(appointmentId) {
  const date = document.getElementById('edit-appt-date')?.value;
  const time = document.getElementById('edit-appt-time')?.value;
  const type = document.getElementById('edit-appt-type')?.value;
  const status = document.getElementById('edit-appt-status')?.value;
  const assignTo = document.getElementById('edit-appt-assign')?.value;
  const notes = document.getElementById('edit-appt-notes')?.value?.trim();
  const internalNotes = document.getElementById('edit-appt-internal')?.value?.trim();
  
  try {
    const datetime = date + 'T' + time + ':00';
    const updates = {
      scheduled_at: datetime,
      appt_type: type,
      status: status,
      assigned_to: assignTo,
      notes: notes || null,
      internal_notes: internalNotes || null
    };
    
    if (status === 'confirmed' && !updates.confirmed_at) updates.confirmed_at = new Date().toISOString();
    if (status === 'completed' && !updates.completed_at) updates.completed_at = new Date().toISOString();
    if (status === 'cancelled' && !updates.cancelled_at) updates.cancelled_at = new Date().toISOString();
    
    const { error } = await _sb.from('appointments').update(updates).eq('id', appointmentId);
    if (error) throw error;
    
    toast('Appointment updated!', 'success');
    document.querySelector('.appt-detail-modal')?.remove();
    await loadAppointmentsList();
  } catch(e) {
    toast('Failed to update: ' + e.message, 'error');
  }
}

async function deleteAppointment(appointmentId) {
  if (!confirm('Delete this appointment? This cannot be undone.')) return;
  
  try {
    const { error } = await _sb.from('appointments').delete().eq('id', appointmentId);
    if (error) throw error;
    
    toast('Appointment deleted', 'success');
    document.querySelector('.appt-detail-modal')?.remove();
    await loadAppointmentsList();
  } catch(e) {
    toast('Failed to delete: ' + e.message, 'error');
  }
}
// ══════════════════════════════════════════════════════════════
// CUSTOMER NOTES SYSTEM
// ══════════════════════════════════════════════════════════════

function addCustomerNote(customerId, jobId = null) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay note-modal';
  modal.innerHTML = `<div class="modal-sheet" style="max-width:600px">
    <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">📝 Add Note</h3>
    
    <div class="form-grid">
      <div class="fg fg-full"><label class="fl">Note Type *</label>
        <select class="fs" id="note-type" onchange="updateNoteFields()">
          <option value="general">📝 General Note</option>
          <option value="call">📞 Phone Call</option>
          <option value="email">✉️ Email</option>
          <option value="appointment">📅 Appointment Note</option>
          <option value="follow-up">🔔 Follow-up Needed</option>
          <option value="complaint">⚠️ Complaint</option>
        </select>
      </div>
      
      <div class="fg fg-full"><label class="fl">Subject</label><input class="fi" id="note-subject" placeholder="Brief description"></div>
      
      <div class="fg fg-full"><label class="fl">Note *</label><textarea class="fi" id="note-text" rows="4" placeholder="Enter details..." required></textarea></div>
      
      <!-- Call-specific fields -->
      <div id="call-fields" style="display:none;grid-column:1/-1">
        <div class="form-grid">
          <div class="fg"><label class="fl">Direction</label>
            <select class="fs" id="note-call-direction">
              <option value="outbound">Outbound</option>
              <option value="inbound">Inbound</option>
            </select>
          </div>
          <div class="fg"><label class="fl">Duration (min)</label><input class="fi" id="note-call-duration" type="number" placeholder="5"></div>
        </div>
      </div>
      
      <!-- Follow-up fields -->
      <div id="followup-fields" style="display:none;grid-column:1/-1">
        <div class="form-grid">
          <div class="fg"><label class="fl">Follow-up Date</label><input class="fi" id="note-followup-date" type="date"></div>
        </div>
      </div>
      
      <div class="fg fg-full" style="display:flex;gap:12px">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="note-important">
          <span style="font-size:13px">⭐ Mark as Important</span>
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" id="note-private">
          <span style="font-size:13px">🔒 Private (Admin Only)</span>
        </label>
      </div>
    </div>
    
    <div style="display:flex;gap:8px;margin-top:16px">
      <button class="btn btn-primary" onclick="saveCustomerNote('${customerId}', ${jobId ? `'${jobId}'` : 'null'})">💾 Save Note</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  
  document.body.appendChild(modal);
}

function updateNoteFields() {
  const type = document.getElementById('note-type')?.value;
  const callFields = document.getElementById('call-fields');
  const followupFields = document.getElementById('followup-fields');
  
  callFields.style.display = type === 'call' ? 'block' : 'none';
  followupFields.style.display = type === 'follow-up' ? 'block' : 'none';
}

async function saveCustomerNote(customerId, jobId) {
  const type = document.getElementById('note-type')?.value;
  const subject = document.getElementById('note-subject')?.value?.trim();
  const noteText = document.getElementById('note-text')?.value?.trim();
  const isImportant = document.getElementById('note-important')?.checked;
  const isPrivate = document.getElementById('note-private')?.checked;
  
  if (!noteText) {
    toast('Note text is required', 'error');
    return;
  }
  
  try {
    const noteData = {
      customer_id: customerId,
      job_id: jobId,
      created_by: _user.id,
      note_type: type,
      subject: subject || null,
      note_text: noteText,
      is_important: isImportant,
      is_private: isPrivate
    };
    
    // Add call-specific fields
    if (type === 'call') {
      noteData.call_direction = document.getElementById('note-call-direction')?.value;
      const duration = document.getElementById('note-call-duration')?.value;
      if (duration) noteData.call_duration_seconds = parseInt(duration) * 60;
    }
    
    // Add follow-up fields
    if (type === 'follow-up') {
      noteData.requires_followup = true;
      const followupDate = document.getElementById('note-followup-date')?.value;
      if (followupDate) noteData.followup_date = followupDate;
    }
    
    const { error } = await _sb.from('customer_notes').insert(noteData);
    if (error) throw error;
    
    toast('Note saved!', 'success');
    document.querySelector('.note-modal')?.remove();
    await refreshCustomerModal();
  } catch(e) {
    console.error('Save note error:', e);
    toast('Failed to save: ' + e.message, 'error');
  }
}

// Update renderTabContent to include Notes tab
function renderTabContentWithNotes(tab, jobs, calls, customer) {
  if (tab === 'jobs') {
    return renderJobsTab(jobs, customer);
  } else if (tab === 'calls') {
    return renderCallsTab(calls);
  } else if (tab === 'notes') {
    return renderNotesTab(customer.id);
  } else if (tab === 'timeline') {
    return renderTimelineTab(jobs, calls, customer.id);
  }
  return '';
}

function renderNotesTab(customerId) {
  _sb.from('customer_notes').select('*, profiles(full_name)').eq('customer_id', customerId).order('created_at', { ascending: false }).then(({ data: notes }) => {
    const container = document.getElementById('notes-tab-content');
    if (!container) return;
    
    if (!notes || notes.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">No notes yet</div>';
      return;
    }
    
    const noteIcons = {
      general: '📝', call: '📞', email: '✉️', appointment: '📅',
      'follow-up': '🔔', complaint: '⚠️', 'quote-sent': '💰', 'contract-signed': '✍️'
    };
    
    const notesHTML = notes.map(n => {
      let html = '<div style="padding:12px;background:var(--gray);border-radius:8px;' + (n.is_important ? 'border-left:3px solid var(--red)' : '') + '">';
      html += '<div style="display:flex;justify-content:space-between;margin-bottom:4px">';
      html += '<div style="display:flex;align-items:center;gap:8px">';
      html += '<span>' + (noteIcons[n.note_type] || '📝') + '</span>';
      html += '<span style="font-size:13px;font-weight:600">' + (n.subject || n.note_type) + '</span>';
      if (n.is_important) html += '<span style="font-size:11px;color:var(--red)">⭐ Important</span>';
      if (n.is_private) html += '<span style="font-size:11px;color:var(--text3)">🔒 Private</span>';
      html += '</div>';
      html += '<div style="font-size:11px;color:var(--text3)">' + new Date(n.created_at).toLocaleDateString() + '</div>';
      html += '</div>';
      html += '<div style="font-size:12px;color:var(--text2);margin-bottom:4px">' + n.note_text + '</div>';
      html += '<div style="font-size:11px;color:var(--text3)">By ' + (n.profiles?.full_name || 'Unknown') + '</div>';
      if (n.requires_followup) {
        html += '<div style="margin-top:8px;padding:6px;background:var(--blue-lt);border-radius:4px;font-size:11px">';
        html += '🔔 Follow-up: ' + (n.followup_date ? new Date(n.followup_date).toLocaleDateString() : 'ASAP');
        if (!n.followup_completed) {
          html += '<button class="btn btn-sm" style="margin-left:8px" onclick="markFollowupComplete(\'' + n.id + '\')">Mark Complete</button>';
        } else {
          html += ' ✅ Completed';
        }
        html += '</div>';
      }
      html += '</div>';
      return html;
    }).join('');
    
    container.innerHTML = '<div style="display:flex;flex-direction:column;gap:8px">' + notesHTML + '</div>';
  });
  
  return '<div id="notes-tab-content" style="padding:16px">Loading notes...</div>';
}

async function markFollowupComplete(noteId) {
  try {
    const { error } = await _sb.from('customer_notes').update({ followup_completed: true }).eq('id', noteId);
    if (error) throw error;
    toast('Follow-up marked complete', 'success');
    await refreshCustomerModal();
  } catch(e) {
    toast('Failed to update: ' + e.message, 'error');
  }
}

function renderTimelineTabEnhanced(jobs, calls, customerId) {
  // Load complete timeline
  _sb.from('v_customer_timeline').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }).limit(50).then(({ data: activities }) => {
    const container = document.getElementById('timeline-tab-content');
    if (!container) return;
    
    if (!activities || activities.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text3)">No activity yet</div>';
      return;
    }
    
    const activityIcons = {
      note: '📝',
      appointment: '📅',
      call: '📞'
    };
    
    container.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">${activities.map(a => `
      <div style="padding:12px;background:var(--gray);border-radius:8px">
        <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:8px">
            <span>${activityIcons[a.activity_type] || '📌'}</span>
            <span style="font-size:13px;font-weight:600">${a.subject || a.type_detail}</span>
          </div>
          <div style="font-size:11px;color:var(--text3)">${new Date(a.created_at).toLocaleDateString()}</div>
        </div>
        <div style="font-size:12px;color:var(--text2)">${a.description}</div>
        ${a.user_name ? `<div style="font-size:11px;color:var(--text3);margin-top:4px">By ${a.user_name}</div>` : ''}
      </div>
    `).join('')}</div>`;
  });
  
  return '<div id="timeline-tab-content" style="padding:16px">Loading timeline...</div>';
}
// ══════════════════════════════════════════════════════════════
// PHOTO & DOCUMENT UPLOAD
// ══════════════════════════════════════════════════════════════

function uploadPhotos(jobId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay photo-modal';
  modal.innerHTML = `<div class="modal-sheet">
    <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Upload Photos</h3>
    <div style="border:2px dashed var(--border);padding:40px;border-radius:8px;text-align:center;cursor:pointer;margin-bottom:16px" onclick="document.getElementById('photo-input').click()">
      <div style="font-size:48px;margin-bottom:8px">📸</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">Click to select photos</div>
      <div style="font-size:12px;color:var(--text3)">or drag and drop here</div>
      <input type="file" id="photo-input" multiple accept="image/*" style="display:none" onchange="handlePhotoSelect('${jobId}')">
    </div>
    <div id="photo-preview" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;margin-bottom:16px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" id="upload-photos-btn" onclick="uploadSelectedPhotos('${jobId}')" disabled>Upload Selected</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

let _selectedPhotos = [];

function handlePhotoSelect(jobId) {
  const input = document.getElementById('photo-input');
  _selectedPhotos = Array.from(input.files);
  
  const preview = document.getElementById('photo-preview');
  preview.innerHTML = _selectedPhotos.map((file, i) => `
    <div style="position:relative">
      <img src="${URL.createObjectURL(file)}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:4px">
      <button onclick="removePhoto(${i})" style="position:absolute;top:4px;right:4px;background:red;color:white;border:none;border-radius:50%;width:24px;height:24px;cursor:pointer;font-size:12px">×</button>
    </div>
  `).join('');
  
  document.getElementById('upload-photos-btn').disabled = _selectedPhotos.length === 0;
}

function removePhoto(index) {
  _selectedPhotos.splice(index, 1);
  handlePhotoSelect();
}

async function uploadSelectedPhotos(jobId) {
  if (_selectedPhotos.length === 0) return;
  
  const btn = document.getElementById('upload-photos-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  
  try {
    // Upload each photo to Supabase Storage
    const uploads = await Promise.all(_selectedPhotos.map(async (file) => {
      const fileName = `${jobId}/${Date.now()}_${file.name}`;
      const { data, error } = await _sb.storage.from('job-photos').upload(fileName, file);
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = _sb.storage.from('job-photos').getPublicUrl(fileName);
      
      // Insert into database
      await _sb.from('job_photos').insert({
        job_id: jobId,
        photo_url: publicUrl,
        photo_type: 'inspection'
      });
      
      return publicUrl;
    }));
    
    toast(`${uploads.length} photos uploaded!`, 'success');
    document.querySelector('.photo-modal')?.remove();
    _selectedPhotos = [];
    await refreshCustomerModal();
  } catch(e) {
    console.error('Upload error:', e);
    toast('Upload failed: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Upload Selected';
  }
}

// Upload Documents
function uploadDocuments(jobId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay doc-modal';
  modal.innerHTML = `<div class="modal-sheet">
    <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">Upload Documents</h3>
    <div class="form-grid" style="margin-bottom:16px">
      <div class="fg fg-full"><label class="fl">Document Type</label><select class="fs" id="doc-type"><option>contract</option><option>warranty</option><option>invoice</option><option>other</option></select></div>
      <div class="fg fg-full"><label class="fl">Document Name</label><input class="fi" id="doc-name" placeholder="e.g., Signed Contract"></div>
    </div>
    <div style="border:2px dashed var(--border);padding:40px;border-radius:8px;text-align:center;cursor:pointer;margin-bottom:16px" onclick="document.getElementById('doc-input').click()">
      <div style="font-size:48px;margin-bottom:8px">📄</div>
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">Click to select document</div>
      <div style="font-size:12px;color:var(--text3)">PDF, DOC, DOCX, or images</div>
      <input type="file" id="doc-input" accept=".pdf,.doc,.docx,image/*" style="display:none" onchange="handleDocSelect()">
    </div>
    <div id="doc-selected" style="margin-bottom:16px"></div>
    <div style="display:flex;gap:8px">
      <button class="btn btn-primary" id="upload-doc-btn" onclick="uploadSelectedDocument('${jobId}')" disabled>Upload</button>
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
}

let _selectedDoc = null;

function handleDocSelect() {
  const input = document.getElementById('doc-input');
  _selectedDoc = input.files[0];
  
  if (_selectedDoc) {
    document.getElementById('doc-selected').innerHTML = `
      <div style="padding:12px;background:var(--gray);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:13px;font-weight:600">${_selectedDoc.name}</div>
          <div style="font-size:12px;color:var(--text3)">${(_selectedDoc.size / 1024).toFixed(1)} KB</div>
        </div>
        <button onclick="_selectedDoc = null; handleDocSelect()" style="background:red;color:white;border:none;border-radius:4px;padding:4px 8px;cursor:pointer">Remove</button>
      </div>
    `;
    document.getElementById('upload-doc-btn').disabled = false;
  } else {
    document.getElementById('doc-selected').innerHTML = '';
    document.getElementById('upload-doc-btn').disabled = true;
  }
}

async function uploadSelectedDocument(jobId) {
  if (!_selectedDoc) return;
  
  const docType = document.getElementById('doc-type').value;
  const docName = document.getElementById('doc-name').value.trim() || _selectedDoc.name;
  
  const btn = document.getElementById('upload-doc-btn');
  btn.disabled = true;
  btn.textContent = 'Uploading...';
  
  try {
    // Upload to Supabase Storage
    const fileName = `${jobId}/${Date.now()}_${_selectedDoc.name}`;
    const { data, error } = await _sb.storage.from('job-documents').upload(fileName, _selectedDoc);
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = _sb.storage.from('job-documents').getPublicUrl(fileName);
    
    // Insert into database
    await _sb.from('job_documents').insert({
      job_id: jobId,
      document_name: docName,
      document_type: docType,
      document_url: publicUrl,
      file_size: _selectedDoc.size
    });
    
    toast('Document uploaded!', 'success');
    document.querySelector('.doc-modal')?.remove();
    _selectedDoc = null;
    await refreshCustomerModal();
  } catch(e) {
    console.error('Upload error:', e);
    toast('Upload failed: ' + e.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Upload';
  }
}

// Open Estimate Builder
function openEstimateBuilder(jobId) {
  // This connects to your existing estimate builder
  // Just need to pass the jobId so it can save to the database
  go('estimates');
  // Store jobId in session storage so estimate builder can access it
  sessionStorage.setItem('current_job_id', jobId);
}
function copyQuoteLink(quoteCode) {
  const url = window.location.origin + '/quote.html?code=' + quoteCode;
  navigator.clipboard.writeText(url).then(() => {
    toast('Quote link copied!', 'success');
  });
}



// Select customer from dropdown in estimate builder
async function selectEstimateCustomer() {
  const customerId = document.getElementById('e-customer-select')?.value;
  
  if (!customerId) {
    // Clear fields if "Create New Customer" selected
    document.getElementById('e-name').value = '';
    document.getElementById('e-addr').value = '';
    return;
  }
  
  try {
    const { data: customer } = await _sb.from('customers').select('*').eq('id', customerId).single();
    if (!customer) return;
    
    // Auto-fill customer info
    document.getElementById('e-name').value = `${customer.first_name} ${customer.last_name}`;
    document.getElementById('e-addr').value = customer.address || '';
    
    toast(`Customer loaded: ${customer.first_name} ${customer.last_name}`, 'success');
  } catch(e) {
    console.error('Load customer error:', e);
  }
}

// Send quote link after estimate saved
function sendQuoteFromEstimate() {
  const jobId = sessionStorage.getItem('current_job_id');
  
  if (!jobId) {
    toast('Please save estimate first', 'warn');
    return;
  }
  
  // Get job and quote code
  _sb.from('jobs').select('quote_code, customer_tracking_code').eq('id', jobId).single().then(({ data: job }) => {
    if (!job) {
      toast('Job not found', 'error');
      return;
    }
    
    const quoteUrl = window.location.origin + '/quote.html?code=' + job.quote_code;
    const trackUrl = window.location.origin + '/track.html?code=' + job.customer_tracking_code;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-sheet">
      <h3 style="font-size:18px;font-weight:800;margin-bottom:16px">📧 Send to Customer</h3>
      
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px">QUOTE LINK</div>
        <div style="background:var(--gray);padding:12px;border-radius:6px;font-size:12px;word-break:break-all;margin-bottom:8px">${quoteUrl}</div>
        <button class="btn btn-sm btn-primary" onclick="navigator.clipboard.writeText('${quoteUrl}'); toast('Quote link copied!', 'success')">📋 Copy Quote Link</button>
      </div>
      
      <div style="margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:8px">TRACKING LINK</div>
        <div style="background:var(--gray);padding:12px;border-radius:6px;font-size:12px;word-break:break-all;margin-bottom:8px">${trackUrl}</div>
        <button class="btn btn-sm btn-outline" onclick="navigator.clipboard.writeText('${trackUrl}'); toast('Tracking link copied!', 'success')">📋 Copy Tracking Link</button>
      </div>
      
      <div style="padding:12px;background:#FEF3C7;border-radius:6px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">💡 How to Send:</div>
        <div style="font-size:11px;color:var(--text2)">
          1. Copy the quote link<br>
          2. Text or email to customer<br>
          3. They click, review, and sign<br>
          4. Job auto-updates to "Contract Signed"
        </div>
      </div>
      
      <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Close</button>
    </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  });
}

// ══════════════════════════════════════════════════════════════
// USER PROFILE MANAGEMENT
// ══════════════════════════════════════════════════════════════

async function editUserProfile(userId) {
  try {
    const { data: user } = await _sb.from('profiles').select('*').eq('id', userId).single();
    if (!user) {
      toast('User not found', 'error');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay user-edit-modal';
    modal.innerHTML = `<div class="modal-sheet" style="max-width:600px">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">Edit User Profile</h3>
      
      <!-- Basic Info -->
      <div style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:12px;text-transform:uppercase">BASIC INFORMATION</div>
        <div class="form-grid">
          <div class="fg"><label class="fl">Full Name *</label><input class="fi" id="u-name" value="${user.full_name || ''}" placeholder="John Smith"></div>
          <div class="fg"><label class="fl">Email *</label><input class="fi" id="u-email" type="email" value="${user.email || ''}" placeholder="john@myfamilyroofer.com"></div>
          <div class="fg"><label class="fl">Phone</label><input class="fi" id="u-phone" type="tel" value="${user.phone || ''}" placeholder="(970) 555-1234"></div>
        </div>
      </div>
      
      <!-- Role & Status -->
      <div style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:12px;text-transform:uppercase">ROLE & STATUS</div>
        <div class="form-grid">
          <div class="fg">
            <label class="fl">Role</label>
            <select class="fs" id="u-role">
              <option value="user" ${user.role === 'user' ? 'selected' : ''}>User (Sales Rep)</option>
              <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
              <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="fg">
            <label class="fl">Status</label>
            <select class="fs" id="u-active">
              <option value="true" ${user.is_active ? 'selected' : ''}>Active</option>
              <option value="false" ${!user.is_active ? 'selected' : ''}>Inactive</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Additional Info (Optional) -->
      <div style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:700;color:var(--text3);margin-bottom:12px;text-transform:uppercase">ADDITIONAL INFO (Optional)</div>
        <div class="form-grid">
          <div class="fg fg-full"><label class="fl">Avatar URL</label><input class="fi" id="u-avatar" value="${user.avatar_url || ''}" placeholder="https://..."></div>
        </div>
      </div>
      
      <!-- Info Box -->
      <div style="padding:12px;background:#FEF3C7;border-radius:6px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:4px">💡 Role Permissions:</div>
        <div style="font-size:11px;color:var(--text2);line-height:1.6">
          <strong>User:</strong> Can create leads, view customers, build estimates<br>
          <strong>Manager:</strong> User + can view sales metrics, marketing ROI<br>
          <strong>Admin:</strong> Full access including pricing, team management
        </div>
      </div>
      
      <!-- Actions -->
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn btn-primary" onclick="saveUserProfile('${userId}')">💾 Save Changes</button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    
  } catch(e) {
    console.error('Edit user error:', e);
    toast('Failed to load user', 'error');
  }
}

async function saveUserProfile(userId) {
  const name = document.getElementById('u-name')?.value?.trim();
  const email = document.getElementById('u-email')?.value?.trim();
  const phone = document.getElementById('u-phone')?.value?.trim();
  const role = document.getElementById('u-role')?.value;
  const isActive = document.getElementById('u-active')?.value === 'true';
  const avatar = document.getElementById('u-avatar')?.value?.trim();
  
  if (!name || !email) {
    toast('Name and email are required', 'error');
    return;
  }
  
  try {
    const updates = {
      full_name: name,
      email: email,
      phone: phone || null,
      role: role,
      is_active: isActive,
      avatar_url: avatar || null
    };
    
    const { error } = await _sb.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
    
    toast('User profile updated!', 'success');
    document.querySelector('.user-edit-modal')?.remove();
    
    // Refresh team page if we're on it
    if (_page === 'team') {
      await pageTeam(document.getElementById('content'));
    }
    
  } catch(e) {
    console.error('Save user error:', e);
    toast('Failed to save: ' + e.message, 'error');
  }
}

// Quick function to view your own profile
async function viewMyProfile() {
  if (_user?.id) {
    await editUserProfile(_user.id);
  }
}
// ══════════════════════════════════════════════════════════════
// PROFILE MENU
// ══════════════════════════════════════════════════════════════

function showProfileMenu(event) {
  event.stopPropagation();
  
  // Remove any existing menu
  document.querySelectorAll('.profile-menu')?.forEach(m => m.remove());
  
  const menu = document.createElement('div');
  menu.className = 'profile-menu';
  menu.style.cssText = `
    position: absolute;
    top: 60px;
    right: 16px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,.15);
    min-width: 200px;
    z-index: 1000;
    overflow: hidden;
  `;
  
  menu.innerHTML = `
    <div style="padding: 16px; border-bottom: 1px solid var(--border)">
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 2px">${_user?.full_name || _user?.email || 'User'}</div>
      <div style="font-size: 12px; color: var(--text3)">${_user?.email || ''}</div>
      <div style="font-size: 11px; color: var(--text3); margin-top: 4px">
        <span class="badge badge-${_user?.role==='admin'?'red':_user?.role==='manager'?'orange':'blue'}" style="font-size: 10px">${_user?.role || 'user'}</span>
      </div>
    </div>
    <div style="padding: 8px 0">
      <button onclick="viewMyProfile(); document.querySelector('.profile-menu')?.remove()" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: background .2s" onmouseover="this.style.background='var(--gray)'" onmouseout="this.style.background='none'">
        <span>👤</span> My Profile
      </button>
      <button onclick="go('team'); document.querySelector('.profile-menu')?.remove()" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; transition: background .2s" onmouseover="this.style.background='var(--gray)'" onmouseout="this.style.background='none'">
        <span>👥</span> Team
      </button>
      <div style="height: 1px; background: var(--border); margin: 8px 0"></div>
      <button onclick="doLogout(); document.querySelector('.profile-menu')?.remove()" style="width: 100%; text-align: left; padding: 10px 16px; border: none; background: none; cursor: pointer; font-size: 13px; display: flex; align-items: center; gap: 8px; color: red; transition: background .2s" onmouseover="this.style.background='var(--gray)'" onmouseout="this.style.background='none'">
        <span>🚪</span> Logout
      </button>
    </div>
  `;
  
  document.body.appendChild(menu);
  
  // Close menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', function closeMenu() {
      menu.remove();
      document.removeEventListener('click', closeMenu);
    });
  }, 100);
}
// ══════════════════════════════════════════════════════════════
// TASK SYSTEM UI
// ══════════════════════════════════════════════════════════════

// Dashboard Widget - My Tasks
async function renderMyTasksWidget() {
  try {
    const { data: tasks } = await _sb
      .from('v_tasks_full')
      .select('*')
      .eq('assigned_to', _user.id)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(5);
    
    if (!tasks || tasks.length === 0) {
      return '<div style="padding:20px;text-align:center;color:var(--text3)">No pending tasks</div>';
    }
    
    return `<div style="display:flex;flex-direction:column;gap:8px">${tasks.map(t => {
      const isOverdue = t.due_date && new Date(t.due_date) < new Date();
      const priorityColors = { urgent: 'red', high: 'orange', normal: 'blue', low: 'gray' };
      
      return `
        <div style="padding:10px;background:${isOverdue ? '#FEE2E2' : 'var(--gray)'};border-radius:6px;border-left:3px solid var(--${priorityColors[t.priority] || 'blue'})">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px">
            <div style="font-size:13px;font-weight:600">${t.title}</div>
            <button class="btn btn-sm" onclick="completeTask('${t.id}')" style="padding:2px 8px;font-size:11px">✓</button>
          </div>
          ${t.customer_name ? `<div style="font-size:11px;color:var(--text3)">${t.customer_name}</div>` : ''}
          ${t.due_date ? `<div style="font-size:11px;color:${isOverdue ? 'var(--red)' : 'var(--text3)'};margin-top:4px">${isOverdue ? '⚠️ Overdue: ' : '📅 Due: '}${new Date(t.due_date).toLocaleDateString()}</div>` : ''}
        </div>
      `;
    }).join('')}</div>
    <div style="text-align:center;margin-top:12px">
      <button class="btn btn-sm btn-outline" onclick="go('tasks')">View All Tasks →</button>
    </div>`;
    
  } catch(e) {
    console.error('Load tasks widget error:', e);
    return '<div style="padding:20px;text-align:center;color:red">Error loading tasks</div>';
  }
}

// Tasks Page
async function pageTasks(c) {
  const filterView = sessionStorage.getItem('tasks_view') || 'team';
  
  c.innerHTML = `<div class="page-wrap">
    <div class="page-hd">
      <div>
        <div class="page-title">Tasks</div>
        <div class="page-sub">Manage team tasks and assignments. Automation tasks are assigned to the job owner, so check Team Tasks when testing campaigns.</div>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm ${filterView === 'my' ? 'btn-primary' : 'btn-outline'}" onclick="switchTasksView('my')">My Tasks</button>
        <button class="btn btn-sm ${filterView === 'team' ? 'btn-primary' : 'btn-outline'}" onclick="switchTasksView('team')">Team Tasks</button>
        <button class="btn btn-primary" onclick="createTaskModal()">+ New Task</button>
      </div>
    </div>
    
    <!-- Filter Bar -->
    <div class="card" style="margin-bottom:16px">
      <div class="card-body" style="padding:12px">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px">
          <select class="fs" id="task-filter-status" onchange="loadTasksList()" style="font-size:12px">
            <option value="">All Statuses</option>
            <option value="pending" selected>Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
          </select>
          <select class="fs" id="task-filter-priority" onchange="loadTasksList()" style="font-size:12px">
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
          <select class="fs" id="task-filter-type" onchange="loadTasksList()" style="font-size:12px">
            <option value="">All Types</option>
            <option value="call">Call</option>
            <option value="follow-up">Follow-up</option>
            <option value="schedule">Schedule</option>
            <option value="upload-docs">Upload Docs</option>
            <option value="review-estimate">Review Estimate</option>
            <option value="order-materials">Order Materials</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- Tasks List -->
    <div class="card">
      <div class="card-body" style="padding:0" id="tasks-list">
        <div style="text-align:center;padding:40px">Loading tasks...</div>
      </div>
    </div>
  </div>`;
  
  await loadTasksList();
}

function switchTasksView(view) {
  sessionStorage.setItem('tasks_view', view);
  pageTasks(document.getElementById('content'));
}

async function loadTasksList() {
  const filterView = sessionStorage.getItem('tasks_view') || 'team';
  const statusFilter = document.getElementById('task-filter-status')?.value;
  const priorityFilter = document.getElementById('task-filter-priority')?.value;
  const typeFilter = document.getElementById('task-filter-type')?.value;
  
  try {
    let query = _sb.from('v_tasks_full').select('*');
    
    if (filterView === 'my') {
      query = query.eq('assigned_to', _user.id);
    }
    
    if (statusFilter) query = query.eq('status', statusFilter);
    if (priorityFilter) query = query.eq('priority', priorityFilter);
    if (typeFilter) query = query.eq('task_type', typeFilter);
    
    query = query.order('due_date', { ascending: true, nullsFirst: false });
    
    const { data: tasks } = await query;
    
    const listEl = document.getElementById('tasks-list');
    
    if (!tasks || tasks.length === 0) {
      listEl.innerHTML = '<div class="empty-state" style="padding:40px"><div class="icon">✅</div><h3>No Tasks</h3></div>';
      return;
    }
    
    const priorityColors = { urgent: 'red', high: 'orange', normal: 'blue', low: 'gray' };
    const statusColors = { pending: 'blue', 'in-progress': 'orange', complete: 'green', cancelled: 'gray' };
    
    listEl.innerHTML = `<table class="tbl">
      <thead>
        <tr>
          <th>Task</th>
          <th>Customer</th>
          <th>Assigned To</th>
          <th>Type</th>
          <th>Priority</th>
          <th>Due Date</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${tasks.map(t => {
          const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status === 'pending';
          
          return `<tr style="${isOverdue ? 'background:#FEE2E2' : ''}">
            <td>
              <div style="font-weight:600;font-size:13px">${t.title}</div>
              ${t.description ? `<div style="font-size:11px;color:var(--text3);margin-top:2px">${t.description.substring(0, 60)}${t.description.length > 60 ? '...' : ''}</div>` : ''}
            </td>
            <td style="font-size:12px">${t.customer_name || '—'}</td>
            <td style="font-size:12px">${t.assigned_to_name || t.assignee_name || t.assigned_user_name || t.assigned_to || '—'}</td>
            <td><span class="badge badge-blue" style="font-size:10px">${t.task_type}</span></td>
            <td><span class="badge badge-${priorityColors[t.priority]}" style="font-size:10px">${t.priority}</span></td>
            <td style="font-size:12px;color:${isOverdue ? 'var(--red)' : 'var(--text2)'}">${t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
            <td><span class="badge badge-${statusColors[t.status]}" style="font-size:10px">${t.status}</span></td>
            <td>
              ${t.status === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="completeTask('${t.id}')">✓ Complete</button>` : ''}
              <button class="btn btn-sm btn-outline" onclick="viewTaskDetail('${t.id}')">View</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
    
  } catch(e) {
    console.error('Load tasks error:', e);
    document.getElementById('tasks-list').innerHTML = '<div style="padding:40px;text-align:center;color:red">Error loading tasks</div>';
  }
}

// Create Task Modal
function createTaskModal(jobId = null, customerId = null) {
  _sb.from('profiles').select('id, full_name').eq('is_active', true).order('full_name').then(({ data: users }) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay task-modal';
    modal.innerHTML = `<div class="modal-sheet" style="max-width:600px">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">Create Task</h3>
      
      <div class="form-grid">
        <div class="fg fg-full"><label class="fl">Task Title *</label><input class="fi" id="task-title" placeholder="e.g., Follow up on estimate"></div>
        
        <div class="fg"><label class="fl">Type *</label>
          <select class="fs" id="task-type">
            <option value="call">Phone Call</option>
            <option value="follow-up">Follow-up</option>
            <option value="schedule">Schedule Appointment</option>
            <option value="upload-docs">Upload Documents</option>
            <option value="review-estimate">Review Estimate</option>
            <option value="order-materials">Order Materials</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        
        <div class="fg"><label class="fl">Priority</label>
          <select class="fs" id="task-priority">
            <option value="normal">Normal</option>
            <option value="low">Low</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
        
        <div class="fg"><label class="fl">Assign To *</label>
          <select class="fs" id="task-assign">
            <option value="${_user.id}">${_user.full_name || _user.email} (Me)</option>
            ${users?.filter(u => u.id !== _user.id).map(u => `<option value="${u.id}">${u.full_name || 'User'}</option>`).join('')}
          </select>
        </div>
        
        <div class="fg"><label class="fl">Due Date</label><input class="fi" id="task-due" type="date"></div>
        
        <div class="fg fg-full"><label class="fl">Description</label><textarea class="fi" id="task-desc" rows="3"></textarea></div>
      </div>
      
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary" onclick="saveNewTask(${jobId ? `'${jobId}'` : 'null'}, ${customerId ? `'${customerId}'` : 'null'})">Create Task</button>
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
      </div>
    </div>`;
    
    document.body.appendChild(modal);
    
    // Set default due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('task-due').value = tomorrow.toISOString().split('T')[0];
  });
}

async function saveNewTask(jobId, customerId) {
  const title = document.getElementById('task-title')?.value?.trim();
  const type = document.getElementById('task-type')?.value;
  const priority = document.getElementById('task-priority')?.value;
  const assignTo = document.getElementById('task-assign')?.value;
  const dueDate = document.getElementById('task-due')?.value;
  const description = document.getElementById('task-desc')?.value?.trim();
  
  if (!title || !assignTo) {
    toast('Title and assignment required', 'error');
    return;
  }
  
  try {
    const { error } = await _sb.from('tasks').insert({
      job_id: jobId,
      customer_id: customerId,
      assigned_to: assignTo,
      created_by: _user.id,
      task_type: type,
      title: title,
      description: description || null,
      due_date: dueDate || null,
      priority: priority,
      status: 'pending'
    });
    
    if (error) throw error;
    
    toast('Task created!', 'success');
    document.querySelector('.task-modal')?.remove();
    
    if (_page === 'tasks') await loadTasksList();
    
  } catch(e) {
    console.error('Create task error:', e);
    toast('Failed to create: ' + e.message, 'error');
  }
}

async function completeTask(taskId) {
  try {
    const { error } = await _sb.from('tasks').update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      completed_by: _user.id
    }).eq('id', taskId);
    
    if (error) throw error;
    
    toast('Task completed!', 'success');
    
    if (_page === 'tasks') await loadTasksList();
    if (_page === 'dashboard') {
      const widget = await renderMyTasksWidget();
      const container = document.getElementById('my-tasks-widget');
      if (container) container.innerHTML = widget;
    }
    
  } catch(e) {
    console.error('Complete task error:', e);
    toast('Failed to complete: ' + e.message, 'error');
  }
}

async function viewTaskDetail(taskId) {
  try {
    const { data: task } = await _sb.from('v_tasks_full').select('*').eq('id', taskId).single();
    if (!task) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `<div class="modal-sheet" style="max-width:600px">
      <h3 style="font-size:20px;font-weight:800;margin-bottom:16px">Task Details</h3>
      
      <div style="background:var(--gray);padding:16px;border-radius:8px;margin-bottom:16px">
        <div style="font-size:16px;font-weight:700;margin-bottom:8px">${task.title}</div>
        ${task.description ? `<div style="font-size:13px;color:var(--text2);margin-bottom:8px">${task.description}</div>` : ''}
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px">
          <div>
            <div style="font-size:11px;color:var(--text3)">Type</div>
            <div style="font-size:13px;font-weight:600">${task.task_type}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3)">Priority</div>
            <div style="font-size:13px;font-weight:600">${task.priority}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3)">Assigned To</div>
            <div style="font-size:13px;font-weight:600">${task.assigned_to_name}</div>
          </div>
          <div>
            <div style="font-size:11px;color:var(--text3)">Due Date</div>
            <div style="font-size:13px;font-weight:600">${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No date set'}</div>
          </div>
        </div>
        
        ${task.customer_name ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text3)">Customer</div>
          <div style="font-size:13px;font-weight:600">${task.customer_name}</div>
        </div>` : ''}
      </div>
      
      <div style="display:flex;gap:8px;justify-content:flex-end">
        ${task.status === 'pending' ? `<button class="btn btn-primary" onclick="completeTask('${task.id}'); this.closest('.modal-overlay').remove()">✓ Mark Complete</button>` : ''}
        ${task.job_id ? `<button class="btn btn-outline" onclick="showJobDetail('${task.job_id}'); this.closest('.modal-overlay').remove()">View Job</button>` : ''}
        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">Close</button>
      </div>
    </div>`;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    
  } catch(e) {
    console.error('View task error:', e);
    toast('Failed to load task', 'error');
  }
}
// ══════════════════════════════════════════════════════════════
// AUTOMATION TRIGGERS
// ══════════════════════════════════════════════════════════════

// Auto-create tasks when job status changes
async function handleStatusChange(jobId, oldStatus, newStatus) {
  const result = { created: 0, skipped: 0, errors: 0 };
  try {
    if (oldStatus === newStatus) return result;

    const { data: job, error } = await _sb
      .from('jobs')
      .select('*, customers(*)')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      console.warn('Automation could not load job:', error?.message || error);
      result.errors++;
      return result;
    }

    const rules = {
      estimate_sent: [
        { task_type: 'follow-up', title: 'Follow up on estimate', description: 'Follow up with ' + mfrCustomerName(job.customers) + ' about the estimate.', priority: 'normal', due: 3 }
      ],
      contract_signed: [
        { task_type: 'order-materials', title: 'Order roofing materials', description: 'Order materials for ' + mfrCustomerName(job.customers) + '.', priority: 'high', due: 2 },
        { task_type: 'schedule', title: 'Schedule production', description: 'Schedule installation/start date for ' + mfrCustomerName(job.customers) + '.', priority: 'high', due: 2 }
      ],
      claim_filed: [
        { task_type: 'follow-up', title: 'Follow up with insurance', description: 'Check claim status for ' + mfrCustomerName(job.customers) + '.', priority: 'normal', due: 3 }
      ],
      claim_approved: [
        { task_type: 'schedule', title: 'Prepare production handoff', description: 'Confirm materials, install window, and customer expectations.', priority: 'high', due: 2 }
      ],
      in_production: [
        { task_type: 'upload-docs', title: 'Upload production photos', description: 'Add start/progress photos for the customer tracker.', priority: 'normal', due: 1 }
      ],
      complete: [
        { task_type: 'upload-docs', title: 'Upload final photos and warranty', description: 'Upload final project photos and warranty documents.', priority: 'high', due: 1 },
        { task_type: 'follow-up', title: 'Request customer review', description: 'Ask customer for a review after completion.', priority: 'normal', due: 2 }
      ],
      invoiced: [
        { task_type: 'follow-up', title: 'Follow up on invoice', description: 'Confirm invoice was received and answer billing questions.', priority: 'normal', due: 3 }
      ],
      paid: [
        { task_type: 'custom', title: 'Close out project file', description: 'Confirm photos, documents, warranty, and payment are complete.', priority: 'normal', due: 1 }
      ]
    };

    const tasks = rules[newStatus] || [];
    if (!tasks.length) {
      await mfrAddSystemNote(job.customer_id, job.id, 'automation', 'No Campaign Tasks', 'No task automation is configured for ' + mfrStatusLabel(newStatus) + '.');
      return result;
    }

    for (const task of tasks) {
      const action = await mfrEnsureTask(job, task);
      if (action === 'created') result.created++;
      else if (action === 'skipped') result.skipped++;
      else result.errors++;
    }

    await mfrAddSystemNote(job.customer_id, job.id, 'automation', 'Automation Ran', 'Stage ' + mfrStatusLabel(newStatus) + ': ' + result.created + ' task(s) created, ' + result.skipped + ' skipped, ' + result.errors + ' error(s).');
    return result;
  } catch (e) {
    console.warn('Automation skipped:', e.message || e);
    result.errors++;
    return result;
  }
}

async function mfrEnsureTask(job, task) {
  try {
    const { data: existing, error: existingError } = await _sb
      .from('tasks')
      .select('id,status')
      .eq('job_id', job.id)
      .eq('task_type', task.task_type)
      .eq('title', task.title)
      .in('status', ['pending','in-progress','open'])
      .limit(1);

    if (existingError) throw existingError;
    if (existing && existing.length) return 'skipped';

    const assignee = job.assigned_to || _user?.id || null;
    const insertPayload = {
      job_id: job.id,
      customer_id: job.customer_id,
      assigned_to: assignee,
      created_by: _user?.id || null,
      task_type: task.task_type,
      title: task.title,
      description: task.description,
      priority: task.priority || 'normal',
      due_date: mfrDueDate(task.due || 1),
      status: 'pending'
    };

    const insertRes = await _sb.from('tasks').insert(insertPayload).select('id').single();
    if (insertRes.error) throw insertRes.error;

    await mfrAddSystemNote(job.customer_id, job.id, 'automation', 'Task Created', task.title + (assignee ? ' assigned to job owner.' : '.'));
    return 'created';
  } catch (e) {
    console.warn('Task automation failed:', e.message || e);
    await mfrAddSystemNote(job.customer_id, job.id, 'automation-error', 'Task Automation Failed', (task.title || 'Task') + ': ' + (e.message || 'Unknown error'));
    return 'error';
  }
}

async function completeTask(taskId) {
  try {
    const { data: task } = await _sb.from('tasks').select('*').eq('id', taskId).single();
    const update = { status: 'complete', completed_at: new Date().toISOString() };
    let res = await _sb.from('tasks').update(update).eq('id', taskId);
    if (res.error && String(res.error.message || '').includes('completed_at')) {
      res = await _sb.from('tasks').update({ status: 'complete' }).eq('id', taskId);
    }
    if (res.error) throw res.error;
    toast('Task completed', 'success');
    if (task?.job_id) await mfrMaybeAdvanceAfterTasks(task.job_id);
    if (_page === 'tasks' && typeof loadTasksList === 'function') await loadTasksList();
    if (document.querySelector('.job-modal')) await refreshJobModal();
  } catch (e) {
    console.error('Complete task error:', e);
    toast('Could not complete task: ' + (e.message || 'unknown error'), 'error');
  }
}

async function mfrMaybeAdvanceAfterTasks(jobId) {
  try {
    const { data: job } = await _sb.from('jobs').select('id,status,customer_id').eq('id', jobId).single();
    if (!job || job.status !== 'contract_signed') return;
    const { data: openTasks } = await _sb.from('tasks').select('id,task_type,status').eq('job_id', jobId).in('task_type', ['order-materials','schedule']).in('status', ['pending','in-progress']);
    if (!openTasks || openTasks.length === 0) {
      await _sb.from('jobs').update({ status: 'in_production', updated_at: new Date().toISOString() }).eq('id', jobId);
      await mfrAddSystemNote(job.customer_id, jobId, 'automation', 'Moved to Production', 'Required contract tasks were completed, so the project moved to Production.');
      toast('All required tasks complete. Project moved to Production.', 'success');
      if (document.getElementById('kanban-board')) await loadKanbanBoard();
    }
  } catch (e) {
    console.warn('Task-driven status advance skipped:', e.message || e);
  }
}

(function mfrWorkflowStyles(){
  if (document.getElementById('mfr-workflow-styles')) return;
  const s = document.createElement('style');
  s.id = 'mfr-workflow-styles';
  s.textContent = `
    .mfr-kanban-board{display:flex;gap:12px;overflow-x:auto;padding-bottom:16px;min-height:420px;}
    .mfr-kanban-column{min-width:286px;flex:1;background:var(--gray);border:1px solid var(--border);border-radius:12px;padding:10px;}
    .mfr-kanban-header{background:white;border:1px solid var(--border);border-top:5px solid;border-radius:10px;padding:10px;margin-bottom:10px;display:flex;justify-content:space-between;gap:8px;align-items:center;}
    .mfr-kanban-header small{color:var(--text3);font-size:11px;white-space:nowrap;}
    .mfr-kanban-dropzone{display:flex;flex-direction:column;gap:10px;min-height:240px;}
    .mfr-empty-drop{border:1px dashed var(--border);border-radius:10px;color:var(--text3);font-size:12px;text-align:center;padding:20px;background:rgba(255,255,255,.55);}
    .mfr-kanban-card{background:white;border:1px solid var(--border);border-radius:12px;padding:12px;cursor:grab;box-shadow:0 2px 7px rgba(15,23,42,.06);user-select:none;-webkit-user-select:none;touch-action:none;}
    .mfr-kanban-card:hover{box-shadow:0 8px 20px rgba(15,23,42,.12);transform:translateY(-1px);}
    .mfr-kanban-card.is-dragging{opacity:.45;transform:rotate(1deg);}
    .mfr-card-name{font-size:14px;font-weight:800;color:var(--text);}
    .mfr-card-address{font-size:12px;color:var(--text3);margin-top:3px;}
    .mfr-card-value{font-size:13px;font-weight:800;color:var(--green);white-space:nowrap;}
    .mfr-card-meta{display:flex;justify-content:space-between;gap:8px;margin-top:10px;color:var(--text3);font-size:11px;}
    .mfr-card-move{width:100%;font-size:12px;padding:6px;}
    .mfr-job-sheet{max-width:980px;max-height:92vh;overflow:auto;}
    .mfr-job-head{display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:14px;}
    .mfr-job-head h3{font-size:24px;font-weight:900;margin:0 0 4px;}
    .mfr-job-head p{font-size:13px;color:var(--text3);margin:2px 0;}
    .mfr-job-statusbar{display:flex;gap:10px;align-items:center;margin-bottom:12px;}
    .mfr-job-statusbar select{max-width:280px;}
    .mfr-job-value{font-size:18px;font-weight:900;color:var(--green);}
    .mfr-action-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;}
    .mfr-tabs{display:flex;gap:6px;overflow-x:auto;border-bottom:1px solid var(--border);margin-bottom:14px;}
    .mfr-tab{border:none;background:transparent;padding:10px 12px;cursor:pointer;font-size:13px;color:var(--text2);border-bottom:3px solid transparent;white-space:nowrap;}
    .mfr-tab.active{color:var(--blue);border-bottom-color:var(--blue);font-weight:800;}
    .mfr-tab-body{min-height:240px;}
    .mfr-detail-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;}
    .mfr-detail-grid>div{background:var(--gray);border:1px solid var(--border);border-radius:10px;padding:12px;}
    .mfr-detail-grid label{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--text3);font-weight:800;margin-bottom:4px;}
    .mfr-detail-grid .full{grid-column:1/-1;}
    .mfr-detail-grid p{margin:0;color:var(--text2);font-size:13px;line-height:1.5;}
    .mfr-list-item{display:flex;justify-content:space-between;gap:12px;border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;background:white;}
    .mfr-list-item p{margin:4px 0;color:var(--text2);font-size:13px;}
    .mfr-list-item small{color:var(--text3);font-size:11px;}
    .mfr-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;}
    .mfr-photo-grid img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;border:1px solid var(--border);}
    .mfr-timeline-item{display:grid;grid-template-columns:34px 1fr;gap:10px;padding:10px 0;border-bottom:1px solid var(--border);}
    .mfr-timeline-icon{width:30px;height:30px;border-radius:50%;background:var(--gray);display:grid;place-items:center;}
    .mfr-timeline-item p{margin:3px 0;color:var(--text2);font-size:13px;}
    .mfr-timeline-item small{color:var(--text3);font-size:11px;}
    @media(max-width:760px){.mfr-kanban-board{display:block;overflow:visible}.mfr-kanban-column{min-width:0;margin-bottom:14px}.mfr-job-statusbar{display:block}.mfr-job-statusbar select{max-width:none;width:100%;margin-bottom:8px}.mfr-list-item{display:block}.mfr-action-row .btn{flex:1 1 140px;}}
  `;
  document.head.appendChild(s);
})();

// ══════════════════════════════════════════════════════════════
// APPOINTMENTS MANAGEMENT OVERRIDE - FULL PAGE ACTIONS
// Added to make the Appointments page useful as a standalone scheduler.
// Uses real Supabase enum values: inspection, estimate, follow_up,
// adjuster_meeting, production, other / scheduled, confirmed, completed,
// cancelled, no_show, rescheduled.
// ══════════════════════════════════════════════════════════════

const MFR_APPT_TYPES = [
  ['inspection', 'Inspection'],
  ['estimate', 'Estimate'],
  ['follow_up', 'Follow-up'],
  ['adjuster_meeting', 'Adjuster Meeting'],
  ['production', 'Production'],
  ['other', 'Other']
];

const MFR_APPT_STATUSES = [
  ['scheduled', 'Scheduled'],
  ['confirmed', 'Confirmed'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['no_show', 'No Show'],
  ['rescheduled', 'Rescheduled']
];

function mfrApptTypeLabel(value) {
  return (MFR_APPT_TYPES.find(x => x[0] === value) || [value, value || 'Appointment'])[1];
}

function mfrApptStatusLabel(value) {
  return (MFR_APPT_STATUSES.find(x => x[0] === value) || [value, value || 'Scheduled'])[1];
}

function mfrApptStatusColor(value) {
  return ({ scheduled:'blue', confirmed:'green', completed:'gray', cancelled:'red', no_show:'orange', rescheduled:'purple' })[value] || 'gray';
}

function mfrApptCustomerName(c) {
  if (!c) return 'Unknown Customer';
  return [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.name || c.email || c.phone || 'Unknown Customer';
}

async function pageAppointments(c) {
  const viewMode = sessionStorage.getItem('appointments_view') || 'all';
  c.innerHTML = '<div class="page-wrap">'
    + '<div class="page-hd">'
    + '<div><div class="page-title">Appointments</div><div class="page-sub">Schedule, assign, edit, and track all appointments</div></div>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end">'
    + '<button class="btn btn-sm ' + (viewMode === 'all' ? 'btn-primary' : 'btn-outline') + '" onclick="switchAppointmentView(\'all\')">All</button>'
    + '<button class="btn btn-sm ' + (viewMode === 'my' ? 'btn-primary' : 'btn-outline') + '" onclick="switchAppointmentView(\'my\')">My Appointments</button>'
    + '<button class="btn btn-sm ' + (viewMode === 'today' ? 'btn-primary' : 'btn-outline') + '" onclick="switchAppointmentView(\'today\')">Today</button>'
    + '<button class="btn btn-sm ' + (viewMode === 'upcoming' ? 'btn-primary' : 'btn-outline') + '" onclick="switchAppointmentView(\'upcoming\')">Upcoming</button>'
    + '<button class="btn btn-sm btn-primary" onclick="newApptModal()">+ Schedule Appointment</button>'
    + '</div></div>'
    + '<div class="stat-cards" style="margin-bottom:14px">'
    + '<div class="stat-card sc-blue"><div class="sc-label">Scheduled</div><div class="sc-val" id="appt-stat-scheduled">—</div></div>'
    + '<div class="stat-card sc-green"><div class="sc-label">Confirmed</div><div class="sc-val" id="appt-stat-confirmed">—</div></div>'
    + '<div class="stat-card sc-orange"><div class="sc-label">Today</div><div class="sc-val" id="appt-stat-today">—</div></div>'
    + '<div class="stat-card sc-purple"><div class="sc-label">Upcoming</div><div class="sc-val" id="appt-stat-upcoming">—</div></div>'
    + '</div>'
    + '<div class="card" style="margin-bottom:16px"><div class="card-body" style="padding:12px">'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px">'
    + '<select class="fs" id="appt-filter-status" onchange="loadAppointmentsList()"><option value="">All Statuses</option>'
    + MFR_APPT_STATUSES.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('')
    + '</select>'
    + '<select class="fs" id="appt-filter-type" onchange="loadAppointmentsList()"><option value="">All Types</option>'
    + MFR_APPT_TYPES.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('')
    + '</select>'
    + '<input class="fi" id="appt-search" placeholder="Search customer, phone, notes..." oninput="loadAppointmentsList()">'
    + '<button class="btn btn-outline" onclick="loadAppointmentsList()">Refresh</button>'
    + '</div></div></div>'
    + '<div class="card"><div class="card-body" style="padding:0" id="appointments-list"><div style="text-align:center;padding:40px">Loading appointments...</div></div></div>'
    + '</div>';
  await loadAppointmentsList();
}

function switchAppointmentView(view) {
  sessionStorage.setItem('appointments_view', view);
  pageAppointments(document.getElementById('content'));
}

async function mfrLoadAppointmentsForPage() {
  // Prefer compatibility view. Fall back to raw table + customer/profile maps if view/RLS is not ready.
  const view = await _sb.from('v_appointments_full').select('*');
  if (!view.error) return (view.data || []).map(a => ({
    id: a.id,
    job_id: a.job_id,
    customer_id: a.customer_id,
    assigned_to: a.assigned_to,
    created_by: a.created_by,
    appointment_type: a.appointment_type || a.appt_type,
    status: a.status,
    appointment_date: a.appointment_date || a.scheduled_at,
    duration_minutes: a.duration_minutes,
    location: a.location || a.address || '',
    notes: a.notes || '',
    internal_notes: a.internal_notes || '',
    customer_name: a.customer_name,
    customer_phone: a.customer_phone,
    customer_email: a.customer_email,
    customer_address: a.customer_address || a.address || '',
    assigned_to_name: a.assigned_to_name
  }));

  console.warn('v_appointments_full unavailable, falling back to appointments table:', view.error.message);
  const { data: appts, error } = await _sb.from('appointments').select('*').order('scheduled_at', { ascending: true });
  if (error) throw error;
  const customerIds = [...new Set((appts || []).map(a => a.customer_id).filter(Boolean))];
  const userIds = [...new Set((appts || []).map(a => a.assigned_to).filter(Boolean))];
  const customers = customerIds.length ? await mfrSafeQuery(_sb.from('customers').select('*').in('id', customerIds), []) : [];
  const users = userIds.length ? await mfrSafeQuery(_sb.from('profiles').select('id, full_name, email').in('id', userIds), []) : [];
  const cMap = Object.fromEntries((customers || []).map(c => [c.id, c]));
  const uMap = Object.fromEntries((users || []).map(u => [u.id, u]));
  return (appts || []).map(a => {
    const c = cMap[a.customer_id] || {};
    const u = uMap[a.assigned_to] || {};
    return {
      id: a.id,
      job_id: a.job_id,
      customer_id: a.customer_id,
      assigned_to: a.assigned_to,
      created_by: a.created_by,
      appointment_type: a.appt_type,
      status: a.status,
      appointment_date: a.scheduled_at,
      duration_minutes: a.duration_minutes,
      location: a.location || a.address || c.address || '',
      notes: a.notes || '',
      internal_notes: a.internal_notes || '',
      customer_name: mfrApptCustomerName(c),
      customer_phone: c.phone || '',
      customer_email: c.email || '',
      customer_address: [c.address, c.city, c.state, c.zip].filter(Boolean).join(', '),
      assigned_to_name: u.full_name || u.email || 'Unassigned'
    };
  });
}

async function loadAppointmentsList() {
  const listEl = document.getElementById('appointments-list');
  if (!listEl) return;
  const viewMode = sessionStorage.getItem('appointments_view') || 'all';
  const statusFilter = document.getElementById('appt-filter-status')?.value || '';
  const typeFilter = document.getElementById('appt-filter-type')?.value || '';
  const search = (document.getElementById('appt-search')?.value || '').toLowerCase().trim();

  try {
    let appointments = await mfrLoadAppointmentsForPage();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    appointments = appointments.filter(a => {
      const dt = a.appointment_date ? new Date(a.appointment_date) : null;
      if (viewMode === 'my' && a.assigned_to !== _user.id) return false;
      if (viewMode === 'today' && (!dt || dt.toISOString().split('T')[0] !== todayStr)) return false;
      if (viewMode === 'upcoming' && (!dt || dt < now)) return false;
      if (statusFilter && a.status !== statusFilter) return false;
      if (typeFilter && a.appointment_type !== typeFilter) return false;
      if (search) {
        const blob = [a.customer_name, a.customer_phone, a.customer_email, a.customer_address, a.notes, a.internal_notes, a.assigned_to_name, a.status, a.appointment_type].join(' ').toLowerCase();
        if (!blob.includes(search)) return false;
      }
      return true;
    }).sort((a,b) => new Date(a.appointment_date || 0) - new Date(b.appointment_date || 0));

    const all = await mfrLoadAppointmentsForPage();
    const statScheduled = all.filter(a => a.status === 'scheduled').length;
    const statConfirmed = all.filter(a => a.status === 'confirmed').length;
    const statToday = all.filter(a => a.appointment_date && new Date(a.appointment_date).toISOString().split('T')[0] === todayStr).length;
    const statUpcoming = all.filter(a => a.appointment_date && new Date(a.appointment_date) >= now && !['completed','cancelled','no_show'].includes(a.status)).length;
    if (document.getElementById('appt-stat-scheduled')) document.getElementById('appt-stat-scheduled').textContent = statScheduled;
    if (document.getElementById('appt-stat-confirmed')) document.getElementById('appt-stat-confirmed').textContent = statConfirmed;
    if (document.getElementById('appt-stat-today')) document.getElementById('appt-stat-today').textContent = statToday;
    if (document.getElementById('appt-stat-upcoming')) document.getElementById('appt-stat-upcoming').textContent = statUpcoming;

    if (!appointments.length) {
      listEl.innerHTML = '<div class="empty-state" style="padding:44px"><div class="icon">📅</div><h3>No Appointments</h3><p>No appointments match this view.</p><button class="btn btn-primary" onclick="newApptModal()">+ Schedule Appointment</button></div>';
      return;
    }

    listEl.innerHTML = '<table class="tbl"><thead><tr><th>Date & Time</th><th>Customer</th><th>Type</th><th>Assigned To</th><th>Status</th><th>Notes</th><th></th></tr></thead><tbody>'
      + appointments.map(a => {
        const dt = a.appointment_date ? new Date(a.appointment_date) : null;
        const isPastScheduled = dt && dt < new Date() && a.status === 'scheduled';
        return '<tr style="' + (isPastScheduled ? 'background:#FEF3C7' : '') + '">'
          + '<td><div style="font-weight:700;font-size:13px">' + (dt ? dt.toLocaleDateString() : 'No date') + '</div><div style="font-size:11px;color:var(--text3)">' + (dt ? dt.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '') + '</div></td>'
          + '<td><div style="font-weight:700;font-size:13px">' + escHtml(a.customer_name || 'Unknown') + '</div><div style="font-size:11px;color:var(--text3)">' + escHtml(a.customer_phone || a.customer_email || '') + '</div></td>'
          + '<td><span class="badge badge-blue" style="font-size:10px">' + mfrApptTypeLabel(a.appointment_type) + '</span></td>'
          + '<td style="font-size:12px">' + escHtml(a.assigned_to_name || 'Unassigned') + '</td>'
          + '<td><span class="badge badge-' + mfrApptStatusColor(a.status) + '" style="font-size:10px">' + mfrApptStatusLabel(a.status) + '</span></td>'
          + '<td style="font-size:12px;max-width:260px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(a.notes || a.internal_notes || '') + '</td>'
          + '<td><button class="btn btn-sm btn-outline" onclick="viewAppointmentDetail(\'' + a.id + '\')">View / Edit</button></td>'
          + '</tr>';
      }).join('')
      + '</tbody></table>';
  } catch (e) {
    console.error('Load appointments error:', e);
    listEl.innerHTML = '<div style="padding:40px;text-align:center;color:#B91C1C"><strong>Error loading appointments</strong><br><span style="font-size:12px">' + escHtml(e.message || 'Unknown error') + '</span><br><button class="btn btn-primary" style="margin-top:12px" onclick="newApptModal()">+ Schedule Appointment</button></div>';
  }
}

async function newApptModal(prefillJobId) {
  try {
    const [customers, jobs, users] = await Promise.all([
      mfrSafeQuery(_sb.from('customers').select('*').order('last_name', { ascending: true }), []),
      mfrSafeQuery(_sb.from('jobs').select('id, customer_id, status, job_type, contract_value, created_at').order('created_at', { ascending: false }), []),
      mfrSafeQuery(_sb.from('profiles').select('id, full_name, email').eq('is_active', true).order('full_name'), [])
    ]);

    window._mfrApptCustomers = customers || [];
    window._mfrApptJobs = jobs || [];
    window._mfrApptUsers = users || [];

    const prefillJob = prefillJobId ? (jobs || []).find(j => j.id === prefillJobId) : null;
    const prefillCustomerId = prefillJob?.customer_id || '';
    const customerOptions = (customers || []).map(c => '<option value="' + c.id + '" ' + (c.id === prefillCustomerId ? 'selected' : '') + '>' + escHtml(mfrApptCustomerName(c)) + (c.phone ? ' • ' + escHtml(c.phone) : '') + '</option>').join('');
    const userOptions = (users || []).map(u => '<option value="' + u.id + '" ' + (u.id === _user.id ? 'selected' : '') + '>' + escHtml(u.full_name || u.email || 'User') + (u.id === _user.id ? ' (Me)' : '') + '</option>').join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay appt-modal';
    modal.innerHTML = '<div class="modal-sheet" style="max-width:720px">'
      + '<h3 style="font-size:20px;font-weight:900;margin-bottom:6px">📅 Schedule Appointment</h3>'
      + '<p style="color:var(--text3);font-size:13px;margin-bottom:16px">Create an appointment, assign it to a team member, and tie it to a customer/project.</p>'
      + '<div class="form-grid">'
      + '<div class="fg fg-full"><label class="fl">Customer *</label><select class="fs" id="new-appt-customer" onchange="mfrRefreshApptJobOptions()"><option value="">Select customer...</option>' + customerOptions + '</select></div>'
      + '<div class="fg fg-full"><label class="fl">Project / Job</label><select class="fs" id="new-appt-job"><option value="">Select a customer first...</option></select></div>'
      + '<div class="fg"><label class="fl">Date *</label><input class="fi" id="new-appt-date" type="date"></div>'
      + '<div class="fg"><label class="fl">Time *</label><input class="fi" id="new-appt-time" type="time"></div>'
      + '<div class="fg"><label class="fl">Type *</label><select class="fs" id="new-appt-type">' + MFR_APPT_TYPES.map(x => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select></div>'
      + '<div class="fg"><label class="fl">Duration</label><input class="fi" id="new-appt-duration" type="number" value="60"></div>'
      + '<div class="fg fg-full"><label class="fl">Assign To *</label><select class="fs" id="new-appt-assign">' + userOptions + '</select></div>'
      + '<div class="fg fg-full"><label class="fl">Location / Address</label><input class="fi" id="new-appt-location" placeholder="Customer property or meeting location"></div>'
      + '<div class="fg fg-full"><label class="fl">Customer Notes</label><textarea class="fi" id="new-appt-notes" rows="2" placeholder="Details the assigned rep should know"></textarea></div>'
      + '<div class="fg fg-full"><label class="fl">Internal Notes</label><textarea class="fi" id="new-appt-internal" rows="2" placeholder="Private office/team notes"></textarea></div>'
      + '</div>'
      + '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px"><button class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button><button class="btn btn-primary" onclick="saveStandaloneAppointment()">📅 Schedule Appointment</button></div>'
      + '</div>';
    document.body.appendChild(modal);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('new-appt-date').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('new-appt-time').value = '09:00';
    if (prefillCustomerId) mfrRefreshApptJobOptions(prefillJobId);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  } catch (e) {
    console.error('Appointment modal error:', e);
    toast('Could not open appointment scheduler: ' + (e.message || 'unknown error'), 'error');
  }
}

function mfrRefreshApptJobOptions(selectedJobId) {
  const customerId = document.getElementById('new-appt-customer')?.value;
  const jobSelect = document.getElementById('new-appt-job');
  const loc = document.getElementById('new-appt-location');
  if (!jobSelect) return;
  const jobs = (window._mfrApptJobs || []).filter(j => !customerId || j.customer_id === customerId);
  jobSelect.innerHTML = '<option value="">No specific job / customer-level appointment</option>'
    + jobs.map(j => '<option value="' + j.id + '" ' + (j.id === selectedJobId ? 'selected' : '') + '>' + mfrStatusLabel(j.status) + ' • ' + (j.job_type || 'Roofing') + ' • ' + mfrMoney(j.contract_value || 0) + '</option>').join('');
  const c = (window._mfrApptCustomers || []).find(x => x.id === customerId);
  if (loc && c) loc.value = [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ');
}

async function saveStandaloneAppointment() {
  const customerId = document.getElementById('new-appt-customer')?.value;
  const jobId = document.getElementById('new-appt-job')?.value || null;
  const date = document.getElementById('new-appt-date')?.value;
  const time = document.getElementById('new-appt-time')?.value;
  const type = document.getElementById('new-appt-type')?.value;
  const duration = parseInt(document.getElementById('new-appt-duration')?.value || '60', 10);
  const assignedTo = document.getElementById('new-appt-assign')?.value;
  const location = document.getElementById('new-appt-location')?.value?.trim();
  const notes = document.getElementById('new-appt-notes')?.value?.trim();
  const internalNotes = document.getElementById('new-appt-internal')?.value?.trim();

  if (!customerId || !date || !time || !assignedTo) {
    toast('Customer, date, time, and assigned user are required', 'error');
    return;
  }

  try {
    const datetime = date + 'T' + time + ':00';
    const insert = {
      customer_id: customerId,
      job_id: jobId,
      assigned_to: assignedTo,
      created_by: _user.id,
      scheduled_at: datetime,
      appt_type: type,
      duration_minutes: duration,
      status: 'scheduled',
      location: location || null,
      address: location || null,
      notes: notes || null,
      internal_notes: internalNotes || null,
      notify_method: 'none'
    };
    const { data: appt, error } = await _sb.from('appointments').insert(insert).select().single();
    if (error) throw error;

    if (jobId && type === 'inspection') {
      await _sb.from('jobs').update({ status: 'inspection_scheduled', appointment_set_date: datetime, updated_at: new Date().toISOString() }).eq('id', jobId);
    }

    await mfrAddSystemNote(customerId, jobId, 'appointment', 'Appointment Scheduled', mfrApptTypeLabel(type) + ' scheduled for ' + new Date(datetime).toLocaleString() + '.' + (notes ? ' Notes: ' + notes : ''));

    toast('Appointment scheduled', 'success');
    document.querySelector('.appt-modal')?.remove();
    if (_page === 'appointments') await loadAppointmentsList();
    if (_page === 'dashboard') await pageDashboard(document.getElementById('content'));
    if (document.querySelector('.job-modal')) await refreshJobModal();
    if (typeof refreshCustomerModal === 'function') {
      try { await refreshCustomerModal(); } catch (_) {}
    }
  } catch (e) {
    console.error('Save appointment failed:', e);
    toast('Failed to schedule: ' + (e.message || 'unknown error'), 'error');
  }
}

// Keep old job-level Schedule Appointment buttons working, but route them to the full scheduler.
function scheduleAppointment(jobId) {
  newApptModal(jobId);
}



// ══════════════════════════════════════════════════════════════
// DASHBOARD UPCOMING SCHEDULE OVERRIDE
// Shows upcoming appointments on dashboard instead of hiding future appts.
// ══════════════════════════════════════════════════════════════
function mfrLocalDayBounds(dateObj) {
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 0, 0, 0, 0);
  const end = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

function mfrDateShort(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const today = mfrLocalDayBounds(new Date());
  const apptDay = mfrLocalDayBounds(d);
  const tomorrowStart = new Date(today.end);
  const tomorrowEnd = new Date(today.end);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  if (apptDay.start.getTime() === today.start.getTime()) return 'Today';
  if (apptDay.start.getTime() === tomorrowStart.getTime()) return 'Tomorrow';
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function mfrTimeShort(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

async function mfrLoadDashboardAppointments() {
  const listEl = document.getElementById('d-appt-list');
  const countEl = document.getElementById('d-appts');
  if (!listEl) return;

  try {
    const today = mfrLocalDayBounds(new Date());
    const horizon = new Date(today.start);
    horizon.setDate(horizon.getDate() + 30);

    const upcoming = await mfrSafeQuery(
      _sb.from('appointments')
        .select('id, customer_id, job_id, assigned_to, appt_type, status, scheduled_at, duration_minutes, location, notes')
        .gte('scheduled_at', today.start.toISOString())
        .lt('scheduled_at', horizon.toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(8),
      []
    );

    const activeAppts = (upcoming || []).filter(a => !['cancelled', 'no_show'].includes(a.status));
    const todaysCount = activeAppts.filter(a => {
      const d = new Date(a.scheduled_at);
      return d >= today.start && d < today.end;
    }).length;
    if (countEl) countEl.textContent = todaysCount;

    const customerIds = [...new Set(activeAppts.map(a => a.customer_id).filter(Boolean))];
    const assignedIds = [...new Set(activeAppts.map(a => a.assigned_to).filter(Boolean))];

    let customersById = {};
    if (customerIds.length) {
      const customers = await mfrSafeQuery(_sb.from('customers').select('id, first_name, last_name, phone, address, city, state, zip').in('id', customerIds), []);
      customersById = Object.fromEntries((customers || []).map(c => [c.id, c]));
    }

    let usersById = {};
    if (assignedIds.length) {
      const users = await mfrSafeQuery(_sb.from('profiles').select('id, full_name, email').in('id', assignedIds), []);
      usersById = Object.fromEntries((users || []).map(u => [u.id, u]));
    }

    if (!activeAppts.length) {
      listEl.innerHTML = '<div class="empty-state" style="padding:26px"><div class="icon">📅</div><h3>No Upcoming Appointments</h3><p>Schedule one from here or from a customer/project.</p><button class="btn btn-primary btn-sm" onclick="newApptModal()">+ Schedule Appointment</button></div>';
      return;
    }

    listEl.innerHTML = activeAppts.map(a => {
      const c = customersById[a.customer_id] || {};
      const u = usersById[a.assigned_to] || {};
      const customerName = mfrCustomerName(c) || 'Customer Appointment';
      const assignee = u.full_name || u.email || '';
      const loc = a.location || [c.address, c.city, c.state].filter(Boolean).join(', ');
      const statusColor = mfrApptStatusColor(a.status);
      return '<div style="padding:10px 0;border-bottom:1px solid var(--border);display:flex;gap:10px;align-items:flex-start">'
        + '<div style="min-width:58px;text-align:center;border:1px solid var(--border);border-radius:10px;padding:6px 4px;background:#F8FAFC">'
        + '<div style="font-size:10px;font-weight:900;text-transform:uppercase;color:var(--text3)">' + escHtml(mfrDateShort(a.scheduled_at)) + '</div>'
        + '<div style="font-size:13px;font-weight:900;color:var(--text1)">' + escHtml(mfrTimeShort(a.scheduled_at)) + '</div>'
        + '</div>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="font-size:13px;font-weight:800;color:var(--text1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(customerName) + '</div>'
        + '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + escHtml(mfrApptTypeLabel(a.appt_type)) + (assignee ? ' • ' + escHtml(assignee) : '') + '</div>'
        + (loc ? '<div style="font-size:11px;color:var(--text3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">📍 ' + escHtml(loc) + '</div>' : '')
        + '<div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">'
        + '<span style="font-size:10px;font-weight:800;padding:3px 7px;border-radius:999px;background:' + statusColor + '22;color:' + statusColor + '">' + escHtml(mfrApptStatusLabel(a.status)) + '</span>'
        + '<button class="btn btn-xs btn-outline" onclick="go(\'appointments\')">Open</button>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  } catch (e) {
    console.error('Dashboard appointments failed:', e);
    listEl.innerHTML = '<div style="color:#B91C1C;font-size:12px;padding:12px">Could not load appointments: ' + escHtml(e.message || 'Unknown error') + '</div>';
  }
}

async function pageDashboard(c) {
  c.innerHTML = '<div class="page-wrap">'
    + '<div class="stat-cards">'
    + '<div class="stat-card sc-blue mfr-click-card" onclick="go(\'pipeline\')" title="Open Pipeline"><div class="sc-label">Pipeline</div><div class="sc-val" id="d-pipeline">—</div><div class="mfr-card-hint">Open pipeline</div></div>'
    + '<div class="stat-card sc-green mfr-click-card" onclick="go(\'sales-metrics\')" title="Open Sales Metrics"><div class="sc-label">Closed MTD</div><div class="sc-val" id="d-closed">—</div><div class="mfr-card-hint">Open metrics</div></div>'
    + '<div class="stat-card sc-orange mfr-click-card" onclick="go(\'pipeline\')" title="Open Active Jobs"><div class="sc-label">Active Jobs</div><div class="sc-val" id="d-jobs">—</div><div class="mfr-card-hint">Open jobs</div></div>'
    + '<div class="stat-card sc-purple mfr-click-card" onclick="go(\'appointments\')" title="Open Appointments"><div class="sc-label">Today\'s Appts</div><div class="sc-val" id="d-appts">—</div><div class="mfr-card-hint">Open schedule</div></div>'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px">'
    + '<div class="card"><div class="card-hd"><div><div class="card-hd-title">Recent Activity</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Latest 10 updates</div></div></div><div class="card-body" id="d-activity"><div class="empty-state" style="padding:30px"><div class="icon">📋</div><p>No activity yet — create your first job to get started.</p></div></div></div>'
    + '<div class="card"><div class="card-hd"><div class="card-hd-title">Upcoming Schedule</div><button class="btn btn-sm btn-primary" onclick="newApptModal()">+ Schedule</button></div><div class="card-body" id="d-appt-list"><p style="color:var(--text3);font-size:13px">Loading appointments...</p></div></div>'
    + '</div></div>';

  try {
    const { data } = await _sb.from('v_dashboard_stats').select('*').single();
    if (data) {
      document.getElementById('d-pipeline').textContent = '$' + ((data.total_pipeline || 0) / 1000).toFixed(0) + 'K';
      document.getElementById('d-closed').textContent = '$' + ((data.closed_mtd || 0) / 1000).toFixed(0) + 'K';
      document.getElementById('d-jobs').textContent = data.active_jobs || 0;
      document.getElementById('d-appts').textContent = data.todays_appointments || 0;
    }
  } catch (e) {
    console.warn('Dashboard stats view unavailable:', e);
  }

  try {
    const { data: acts } = await _sb.from('v_activity_feed').select('*').limit(8);
    if (acts && acts.length) {
      document.getElementById('d-activity').innerHTML = acts.map(a =>
        '<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)"><span style="font-size:18px">' + escHtml(a.icon || '📌') + '</span><div><div style="font-size:13px;font-weight:600">' + escHtml(a.title || '') + '</div><div style="font-size:12px;color:var(--text3)">' + escHtml(a.subtitle || '') + '</div></div></div>'
      ).join('');
    }
  } catch (e) {
    console.warn('Activity feed unavailable:', e);
  }

  await mfrLoadDashboardAppointments();
  try { refreshTopStats(); } catch (_) {}
}




// ══════════════════════════════════════════════════════════════
// MFR CAMPAIGN AUTOMATIONS CENTER
// Added as a clean override layer. Uses campaign_rules + campaign_task_templates
// when tables exist, with a built-in fallback if SQL has not been run yet.
// ══════════════════════════════════════════════════════════════

function mfrAllJobStages() {
  const sales = (typeof MFR_SALES_STAGES !== 'undefined') ? MFR_SALES_STAGES : [
    { id:'lead', label:'Lead' }, { id:'inspection_scheduled', label:'Inspection Scheduled' },
    { id:'inspected', label:'Inspected' }, { id:'estimate_sent', label:'Estimate Sent' },
    { id:'contract_signed', label:'Contract Signed' }, { id:'lost', label:'Lost' }
  ];
  const project = (typeof MFR_PROJECT_STAGES !== 'undefined') ? MFR_PROJECT_STAGES : [
    { id:'claim_filed', label:'Claim Filed' }, { id:'claim_approved', label:'Claim Approved' },
    { id:'in_production', label:'In Production' }, { id:'complete', label:'Complete' },
    { id:'invoiced', label:'Invoiced' }, { id:'paid', label:'Paid' }
  ];
  return sales.concat(project).filter((s, idx, arr) => arr.findIndex(x => x.id === s.id) === idx);
}

async function pageCampaigns(c) {
  c.innerHTML = ''
    + '<div class="page-wrap">'
    + '  <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px">'
    + '    <div><h1 style="font-size:24px;font-weight:900;margin:0 0 4px">Campaign Automations</h1><p style="color:var(--text2);margin:0">Create task campaigns that fire when a job moves to a pipeline stage.</p></div>'
    + '    <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="createCampaignRuleModal()">+ New Campaign</button><button class="btn btn-outline" onclick="seedDefaultCampaignsFromApp()">Load Defaults</button></div>'
    + '  </div>'
    + '  <div class="stat-cards" style="margin-bottom:14px">'
    + '    <div class="stat-card sc-blue"><div class="sc-label">Active Campaigns</div><div class="sc-val" id="campaign-active-count">—</div></div>'
    + '    <div class="stat-card sc-green"><div class="sc-label">Task Templates</div><div class="sc-val" id="campaign-template-count">—</div></div>'
    + '    <div class="stat-card sc-orange"><div class="sc-label">Stage Triggers</div><div class="sc-val" id="campaign-stage-count">—</div></div>'
    + '    <div class="stat-card sc-purple"><div class="sc-label">Mode</div><div class="sc-val" id="campaign-mode" style="font-size:18px">Checking</div></div>'
    + '  </div>'
    + '  <div class="card" style="margin-bottom:14px">'
    + '    <div class="card-hd"><div class="card-hd-title">How campaigns work</div></div>'
    + '    <div class="card-body" style="font-size:13px;color:var(--text2);line-height:1.55">When a project moves stages, MFR checks matching active campaign rules. Each rule can create one or more employee tasks, add notes to the customer timeline, and log the automation run. Email/SMS sending will plug into this same page later through a Cloudflare Worker and Resend/Twilio.</div>'
    + '  </div>'
    + '  <div id="campaign-list"><div class="empty-state"><div class="icon">⚡</div><h3>Loading campaigns...</h3></div></div>'
    + '</div>';
  await loadCampaignsList();
}

async function loadCampaignsList() {
  const list = document.getElementById('campaign-list');
  if (!list) return;
  try {
    const { data: rules, error } = await _sb.from('campaign_rules').select('*').order('trigger_status', { ascending:true }).order('created_at', { ascending:true });
    if (error) throw error;
    const { data: templates, error: terr } = await _sb.from('campaign_task_templates').select('*').order('created_at', { ascending:true });
    if (terr) throw terr;
    const activeCount = (rules || []).filter(r => r.enabled).length;
    const stageCount = new Set((rules || []).map(r => r.trigger_status)).size;
    const ac = document.getElementById('campaign-active-count'); if (ac) ac.textContent = activeCount;
    const tc = document.getElementById('campaign-template-count'); if (tc) tc.textContent = (templates || []).length;
    const sc = document.getElementById('campaign-stage-count'); if (sc) sc.textContent = stageCount;
    const mode = document.getElementById('campaign-mode'); if (mode) mode.textContent = 'Database';
    if (!rules || !rules.length) {
      list.innerHTML = '<div class="empty-state"><div class="icon">⚡</div><h3>No Campaigns Yet</h3><p>Click Load Defaults or create your first stage campaign.</p></div>';
      return;
    }
    list.innerHTML = rules.map(rule => {
      const t = (templates || []).filter(x => x.campaign_rule_id === rule.id);
      const stageLabel = (typeof MFR_STATUS_LABELS !== 'undefined' && MFR_STATUS_LABELS[rule.trigger_status]) ? MFR_STATUS_LABELS[rule.trigger_status] : rule.trigger_status;
      return ''
        + '<div class="card" style="margin-bottom:12px">'
        + '  <div class="card-hd" style="align-items:flex-start;gap:12px">'
        + '    <div><div class="card-hd-title">' + escHtml(rule.name || 'Campaign') + '</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Fires when status becomes <strong>' + escHtml(stageLabel) + '</strong></div></div>'
        + '    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'
        + '      <span class="badge ' + (rule.enabled ? 'green' : 'gray') + '">' + (rule.enabled ? 'Active' : 'Off') + '</span>'
        + '      <button class="btn btn-sm btn-outline" onclick="toggleCampaignRule(\'' + rule.id + '\',' + (!rule.enabled) + ')">' + (rule.enabled ? 'Turn Off' : 'Turn On') + '</button>'
        + '      <button class="btn btn-sm btn-primary" onclick="addCampaignTaskTemplateModal(\'' + rule.id + '\')">+ Task</button>'
        + '    </div>'
        + '  </div>'
        + '  <div class="card-body">'
        + (rule.description ? '<p style="margin:0 0 10px;color:var(--text2);font-size:13px">' + escHtml(rule.description) + '</p>' : '')
        + (t.length ? t.map(task => campaignTemplateRow(task)).join('') : '<div style="padding:14px;border:1px dashed var(--border);border-radius:10px;color:var(--text3);font-size:13px">No task templates yet. Add one to make this campaign useful.</div>')
        + '  </div>'
        + '</div>';
    }).join('');
  } catch (e) {
    console.warn('Campaigns table not ready:', e.message || e);
    const mode = document.getElementById('campaign-mode'); if (mode) mode.textContent = 'Fallback';
    const ac = document.getElementById('campaign-active-count'); if (ac) ac.textContent = 'Built-in';
    const tc = document.getElementById('campaign-template-count'); if (tc) tc.textContent = '—';
    const sc = document.getElementById('campaign-stage-count'); if (sc) sc.textContent = '7';
    list.innerHTML = ''
      + '<div class="card"><div class="card-hd"><div class="card-hd-title">Campaign SQL Needed</div></div>'
      + '<div class="card-body"><p style="color:var(--text2);font-size:13px;line-height:1.55">The app is using built-in fallback automations right now. Run the campaign automation SQL file in Supabase to manage campaigns from this screen.</p>'
      + '<div style="background:var(--gray);border:1px solid var(--border);border-radius:10px;padding:12px;font-size:12px;color:var(--text2)">Fallback automations still create tasks for Estimate Sent, Contract Signed, Claim Filed, Claim Approved, In Production, Complete, Invoiced, and Paid.</div></div></div>';
  }
}

function campaignTemplateRow(task) {
  return ''
    + '<div class="mfr-list-item">'
    + '  <div><strong>' + escHtml(task.title || 'Task') + '</strong><p>' + escHtml(task.description || 'No description') + '</p><small>Type: ' + escHtml(task.task_type || 'task') + ' • Priority: ' + escHtml(task.priority || 'normal') + ' • Due +' + (task.due_days || 1) + ' day(s) • Assign: ' + escHtml(task.assign_to || 'current_user') + '</small></div>'
    + '  <button class="btn btn-sm btn-outline" onclick="deleteCampaignTaskTemplate(\'' + task.id + '\')">Delete</button>'
    + '</div>';
}

function createCampaignRuleModal() {
  const stages = mfrAllJobStages();
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = ''
    + '<div class="modal-sheet" style="max-width:620px">'
    + '<h3 style="font-size:20px;font-weight:900;margin-bottom:14px">New Campaign</h3>'
    + '<form onsubmit="saveCampaignRule(event)">'
    + '<label>Name</label><input id="camp-name" required placeholder="Contract signed production handoff">'
    + '<label style="margin-top:10px">Trigger Stage</label><select id="camp-status" required>' + stages.map(s => '<option value="' + s.id + '">' + s.label + '</option>').join('') + '</select>'
    + '<label style="margin-top:10px">Description</label><textarea id="camp-desc" rows="3" placeholder="What should happen when this stage is reached?"></textarea>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button><button class="btn btn-primary">Save Campaign</button></div>'
    + '</form></div>';
  document.body.appendChild(modal);
}

async function saveCampaignRule(e) {
  e.preventDefault();
  try {
    const rule = {
      name: document.getElementById('camp-name').value.trim(),
      trigger_status: document.getElementById('camp-status').value,
      description: document.getElementById('camp-desc').value.trim() || null,
      enabled: true,
      created_by: _user?.id || null
    };
    const { error } = await _sb.from('campaign_rules').insert(rule);
    if (error) throw error;
    document.querySelector('.modal-overlay')?.remove();
    toast('Campaign created', 'success');
    await loadCampaignsList();
  } catch (err) {
    toast('Could not create campaign: ' + (err.message || 'unknown error'), 'error');
  }
}

function addCampaignTaskTemplateModal(ruleId) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = ''
    + '<div class="modal-sheet" style="max-width:660px">'
    + '<h3 style="font-size:20px;font-weight:900;margin-bottom:14px">Add Campaign Task</h3>'
    + '<form onsubmit="saveCampaignTaskTemplate(event,\'' + ruleId + '\')">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
    + '<div><label>Task Type</label><select id="ct-type"><option value="follow-up">Follow Up</option><option value="schedule">Schedule</option><option value="order-materials">Order Materials</option><option value="upload-docs">Upload Docs</option><option value="billing">Billing</option><option value="review">Review Request</option><option value="custom">Custom</option></select></div>'
    + '<div><label>Priority</label><select id="ct-priority"><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option><option value="low">Low</option></select></div>'
    + '</div>'
    + '<label style="margin-top:10px">Title</label><input id="ct-title" required placeholder="Follow up with customer">'
    + '<label style="margin-top:10px">Description</label><textarea id="ct-desc" rows="3" placeholder="Task instructions for the employee"></textarea>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">'
    + '<div><label>Due in days</label><input id="ct-due" type="number" min="0" value="1"></div>'
    + '<div><label>Assign To</label><select id="ct-assign"><option value="job_assigned">Job assigned user</option><option value="current_user">Current user</option><option value="role">Role</option></select></div>'
    + '</div>'
    + '<label style="margin-top:10px">Role if Assign To = Role</label><input id="ct-role" placeholder="admin, manager, sales, production">'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:16px"><button type="button" class="btn btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button><button class="btn btn-primary">Save Task Template</button></div>'
    + '</form></div>';
  document.body.appendChild(modal);
}

async function saveCampaignTaskTemplate(e, ruleId) {
  e.preventDefault();
  try {
    const row = {
      campaign_rule_id: ruleId,
      task_type: document.getElementById('ct-type').value,
      title: document.getElementById('ct-title').value.trim(),
      description: document.getElementById('ct-desc').value.trim() || null,
      priority: document.getElementById('ct-priority').value,
      due_days: parseInt(document.getElementById('ct-due').value || '1', 10),
      assign_to: document.getElementById('ct-assign').value,
      assign_to_role: document.getElementById('ct-role').value.trim() || null
    };
    const { error } = await _sb.from('campaign_task_templates').insert(row);
    if (error) throw error;
    document.querySelector('.modal-overlay')?.remove();
    toast('Task template added', 'success');
    await loadCampaignsList();
  } catch (err) {
    toast('Could not add template: ' + (err.message || 'unknown error'), 'error');
  }
}

async function toggleCampaignRule(ruleId, enabled) {
  try {
    const { error } = await _sb.from('campaign_rules').update({ enabled: enabled, updated_at: new Date().toISOString() }).eq('id', ruleId);
    if (error) throw error;
    toast(enabled ? 'Campaign enabled' : 'Campaign disabled', 'success');
    await loadCampaignsList();
  } catch (e) { toast('Could not update campaign: ' + (e.message || 'unknown error'), 'error'); }
}

async function deleteCampaignTaskTemplate(id) {
  if (!confirm('Delete this task template?')) return;
  try {
    const { error } = await _sb.from('campaign_task_templates').delete().eq('id', id);
    if (error) throw error;
    toast('Task template deleted', 'success');
    await loadCampaignsList();
  } catch (e) { toast('Could not delete template: ' + (e.message || 'unknown error'), 'error'); }
}

async function seedDefaultCampaignsFromApp() {
  try {
    const defaults = mfrDefaultCampaignDefinitions();
    for (const def of defaults) {
      let { data: existing } = await _sb.from('campaign_rules').select('id').eq('trigger_status', def.trigger_status).eq('name', def.name).limit(1);
      let ruleId = existing && existing[0]?.id;
      if (!ruleId) {
        const { data: inserted, error } = await _sb.from('campaign_rules').insert({ name:def.name, description:def.description, trigger_status:def.trigger_status, enabled:true, created_by:_user?.id || null }).select('id').single();
        if (error) throw error;
        ruleId = inserted.id;
      }
      for (const t of def.tasks) {
        const { data: found } = await _sb.from('campaign_task_templates').select('id').eq('campaign_rule_id', ruleId).eq('title', t.title).limit(1);
        if (!found || !found.length) await _sb.from('campaign_task_templates').insert({ campaign_rule_id:ruleId, ...t });
      }
    }
    toast('Default campaigns loaded', 'success');
    await loadCampaignsList();
  } catch (e) {
    toast('Could not load defaults. Run campaign SQL first. ' + (e.message || ''), 'error');
  }
}

function mfrDefaultCampaignDefinitions() {
  return [
    { trigger_status:'estimate_sent', name:'Estimate Follow-Up', description:'Follow up after an estimate is sent.', tasks:[{ task_type:'follow-up', title:'Follow up on estimate', description:'Call or email the customer about their estimate.', priority:'normal', due_days:3, assign_to:'job_assigned' }] },
    { trigger_status:'contract_signed', name:'Contract Signed Handoff', description:'Start production handoff after a job is won.', tasks:[{ task_type:'order-materials', title:'Order roofing materials', description:'Confirm measurements and order materials.', priority:'high', due_days:2, assign_to:'job_assigned' },{ task_type:'schedule', title:'Schedule production', description:'Schedule install/start date and confirm with customer.', priority:'high', due_days:2, assign_to:'job_assigned' }] },
    { trigger_status:'claim_filed', name:'Claim Follow-Up', description:'Follow up with insurance after claim is filed.', tasks:[{ task_type:'follow-up', title:'Follow up with insurance', description:'Check claim status and update notes.', priority:'normal', due_days:3, assign_to:'job_assigned' }] },
    { trigger_status:'claim_approved', name:'Claim Approved Handoff', description:'Prepare the job for production after claim approval.', tasks:[{ task_type:'schedule', title:'Prepare production handoff', description:'Confirm scope, customer expectations, and material plan.', priority:'high', due_days:2, assign_to:'job_assigned' }] },
    { trigger_status:'complete', name:'Completion Closeout', description:'Final closeout tasks after job completion.', tasks:[{ task_type:'upload-docs', title:'Upload final photos and warranty', description:'Upload final project photos and warranty documents.', priority:'high', due_days:1, assign_to:'job_assigned' },{ task_type:'review', title:'Request customer review', description:'Ask customer for a review after completion.', priority:'normal', due_days:2, assign_to:'job_assigned' }] },
    { trigger_status:'invoiced', name:'Invoice Follow-Up', description:'Follow up after invoice is sent.', tasks:[{ task_type:'billing', title:'Follow up on invoice', description:'Confirm invoice was received and answer billing questions.', priority:'normal', due_days:3, assign_to:'job_assigned' }] },
    { trigger_status:'paid', name:'Paid Project Closeout', description:'Close project file after payment.', tasks:[{ task_type:'custom', title:'Close out project file', description:'Confirm photos, documents, warranty, and payment are complete.', priority:'normal', due_days:1, assign_to:'job_assigned' }] }
  ];
}

async function handleStatusChange(jobId, oldStatus, newStatus) {
  try {
    if (oldStatus && oldStatus === newStatus) return;
    const ran = await mfrRunCampaignAutomations(jobId, oldStatus, newStatus);
    if (!ran) await mfrRunBuiltInStatusAutomation(jobId, newStatus);
  } catch (e) {
    console.warn('Campaign automation error:', e.message || e);
    await mfrRunBuiltInStatusAutomation(jobId, newStatus);
  }
}

async function mfrRunCampaignAutomations(jobId, oldStatus, newStatus) {
  const { data: job, error: jerr } = await _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single();
  if (jerr || !job) return false;
  const { data: rules, error: rerr } = await _sb.from('campaign_rules').select('*').eq('trigger_status', newStatus).eq('enabled', true);
  if (rerr) return false;
  if (!rules || !rules.length) {
    await mfrAddSystemNote(job.customer_id, jobId, 'automation', 'Stage Changed', 'Status moved from ' + (oldStatus || 'unknown') + ' to ' + newStatus + '. No campaign rule is active for this stage.');
    return true;
  }
  for (const rule of rules) {
    const { data: templates } = await _sb.from('campaign_task_templates').select('*').eq('campaign_rule_id', rule.id);
    const actions = [];
    for (const t of (templates || [])) {
      await mfrCreateCampaignTask(job, t);
      actions.push({ type:'task', title:t.title });
    }
    await mfrAddSystemNote(job.customer_id, jobId, 'automation', rule.name || 'Campaign Ran', 'Campaign fired for ' + newStatus + ' and created ' + actions.length + ' task(s).');
    try {
      await _sb.from('campaign_run_log').insert({ campaign_rule_id:rule.id, job_id:jobId, customer_id:job.customer_id, old_status:oldStatus || null, new_status:newStatus, actions:actions, created_by:_user?.id || null });
    } catch (ignore) {}
  }
  return true;
}

async function mfrCreateCampaignTask(job, template) {
  const title = template.title || 'Follow up';
  const taskType = template.task_type || 'follow-up';
  const normalize = v => String(v || '').trim().toLowerCase();
  const closedStatuses = ['complete','completed','done','cancelled','canceled'];
  const { data: existing } = await _sb
    .from('tasks')
    .select('id,title,task_type,status')
    .eq('job_id', job.id)
    .eq('task_type', taskType);
  if ((existing || []).some(t => normalize(t.title) === normalize(title) && !closedStatuses.includes(normalize(t.status)))) return;
  const assigned = await mfrResolveCampaignAssignee(job, template);
  const { error } = await _sb.from('tasks').insert({
    job_id: job.id,
    customer_id: job.customer_id,
    assigned_to: assigned,
    created_by: _user?.id || null,
    task_type: taskType,
    title: title,
    description: template.description || null,
    due_date: mfrDueDate(Number(template.due_days || 1)),
    priority: template.priority || 'normal',
    status: 'pending'
  });
  if (error) throw error;
}

async function mfrResolveCampaignAssignee(job, template) {
  const mode = template.assign_to || 'job_assigned';
  if (mode === 'job_assigned' && job.assigned_to) return job.assigned_to;
  if (mode === 'current_user' && _user?.id) return _user.id;
  if (mode === 'role' && template.assign_to_role) {
    try {
      const { data } = await _sb.from('profiles').select('id').eq('role', template.assign_to_role).eq('is_active', true).limit(1);
      if (data && data[0]?.id) return data[0].id;
    } catch (ignore) {}
  }
  return _user?.id || job.assigned_to || null;
}

async function mfrRunBuiltInStatusAutomation(jobId, newStatus) {
  try {
    const { data: job, error } = await _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single();
    if (error || !job) return;
    const defs = mfrDefaultCampaignDefinitions();
    const def = defs.find(d => d.trigger_status === newStatus);
    if (!def) return;
    for (const t of def.tasks) await mfrCreateCampaignTask(job, t);
    await mfrAddSystemNote(job.customer_id, jobId, 'automation', def.name, 'Built-in automation created ' + def.tasks.length + ' task(s).');
  } catch (e) {
    console.warn('Built-in automation skipped:', e.message || e);
  }
}

// ══════════════════════════════════════════════════════════════
// MFR CAMPAIGN AUTOMATION DIAGNOSTIC / RELIABILITY OVERRIDE
// This override is intentionally last so it wins over earlier Claude-era copies.
// It makes stage automation visible, uses built-in fallbacks when campaign rows
// have no templates, and returns clear created/skipped counts.
// ══════════════════════════════════════════════════════════════
function mfrAutomationNorm(v) {
  return String(v || '').trim().toLowerCase();
}

function mfrAutomationOpenStatus(status) {
  const s = mfrAutomationNorm(status || 'pending');
  return !['complete','completed','done','cancelled','canceled','closed'].includes(s);
}

async function handleStatusChange(jobId, oldStatus, newStatus) {
  try {
    if (oldStatus && oldStatus === newStatus) {
      toast('Already in ' + mfrStatusLabel(newStatus) + '. Campaign was not re-run.', 'info');
      return { created:0, skipped:0, reason:'same_status' };
    }

    const result = await mfrRunCampaignAutomations(jobId, oldStatus, newStatus);
    const created = Number(result?.created || 0);
    const skipped = Number(result?.skipped || 0);
    const source = result?.source || 'campaign';

    if (created > 0) {
      toast('Automation ran: ' + created + ' task' + (created === 1 ? '' : 's') + ' created' + (skipped ? ', ' + skipped + ' existing skipped' : '') + '.', 'success');
    } else if (skipped > 0) {
      toast('Automation found existing open task(s), so no duplicates were created.', 'info');
    } else if (result?.reason === 'no_definition') {
      toast('No campaign is configured for ' + mfrStatusLabel(newStatus) + '.', 'info');
    } else if (source === 'fallback') {
      toast('Built-in automation checked this stage, but no new task was needed.', 'info');
    } else {
      toast('Campaign checked, but no task template created a new task.', 'info');
    }

    return result;
  } catch (e) {
    console.warn('Campaign automation error:', e.message || e);
    try {
      const fallback = await mfrRunBuiltInStatusAutomation(jobId, newStatus, oldStatus);
      if (fallback?.created) toast('Built-in automation created ' + fallback.created + ' task(s).', 'success');
      return fallback;
    } catch (fallbackError) {
      console.warn('Built-in campaign fallback failed:', fallbackError.message || fallbackError);
      toast('Status moved, but automation failed: ' + (e.message || 'unknown error'), 'error');
      return { created:0, skipped:0, error:e.message || String(e) };
    }
  }
}

async function mfrRunCampaignAutomations(jobId, oldStatus, newStatus) {
  const { data: job, error: jerr } = await _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single();
  if (jerr || !job) throw jerr || new Error('Job not found');

  let rules = [];
  let campaignTablesAvailable = true;
  try {
    const res = await _sb.from('campaign_rules').select('*').eq('trigger_status', newStatus).eq('enabled', true);
    if (res.error) throw res.error;
    rules = res.data || [];
  } catch (e) {
    campaignTablesAvailable = false;
  }

  if (!campaignTablesAvailable || !rules.length) {
    return await mfrRunBuiltInStatusAutomation(jobId, newStatus, oldStatus, campaignTablesAvailable ? 'no_active_rule' : 'campaign_tables_unavailable');
  }

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalTemplates = 0;

  for (const rule of rules) {
    let templates = [];
    try {
      const tres = await _sb.from('campaign_task_templates').select('*').eq('campaign_rule_id', rule.id);
      if (tres.error) throw tres.error;
      templates = tres.data || [];
    } catch (e) {
      templates = [];
    }

    totalTemplates += templates.length;

    if (!templates.length) continue;

    const actions = [];
    for (const t of templates) {
      const taskResult = await mfrCreateCampaignTask(job, t);
      if (taskResult.created) totalCreated += 1;
      if (taskResult.skipped) totalSkipped += 1;
      actions.push({ type:'task', title:t.title, result:taskResult.created ? 'created' : 'skipped' });
    }

    await mfrAddSystemNote(
      job.customer_id,
      jobId,
      'automation',
      rule.name || 'Campaign Ran',
      'Campaign fired for ' + mfrStatusLabel(newStatus) + '. Created ' + totalCreated + ' task(s), skipped ' + totalSkipped + ' existing task(s).'
    );

    try {
      await _sb.from('campaign_run_log').insert({
        campaign_rule_id: rule.id,
        job_id: jobId,
        customer_id: job.customer_id,
        old_status: oldStatus || null,
        new_status: newStatus,
        actions: actions,
        created_by: _user?.id || null
      });
    } catch (ignore) {}
  }

  // If rules exist but have no task templates, use the built-in definition for that stage.
  if (totalTemplates === 0) {
    return await mfrRunBuiltInStatusAutomation(jobId, newStatus, oldStatus, 'rule_without_templates');
  }

  return { created:totalCreated, skipped:totalSkipped, source:'campaign_rules', rules:rules.length, templates:totalTemplates };
}

async function mfrCreateCampaignTask(job, template) {
  const title = template.title || 'Follow up';
  const taskType = template.task_type || 'follow-up';
  const normalize = mfrAutomationNorm;

  const { data: existing, error: existingError } = await _sb
    .from('tasks')
    .select('id,title,task_type,status,assigned_to')
    .eq('job_id', job.id)
    .eq('task_type', taskType);

  if (existingError) throw existingError;

  const duplicate = (existing || []).find(t =>
    normalize(t.title) === normalize(title) && mfrAutomationOpenStatus(t.status)
  );

  if (duplicate) return { created:false, skipped:true, duplicate_id:duplicate.id };

  const assigned = await mfrResolveCampaignAssignee(job, template);
  const payload = {
    job_id: job.id,
    customer_id: job.customer_id,
    assigned_to: assigned,
    created_by: _user?.id || null,
    task_type: taskType,
    title: title,
    description: template.description || null,
    due_date: mfrDueDate(Number(template.due_days || 1)),
    priority: template.priority || 'normal',
    status: 'pending'
  };

  const { data, error } = await _sb.from('tasks').insert(payload).select('id').single();
  if (error) throw error;
  return { created:true, skipped:false, id:data?.id || null };
}

async function mfrRunBuiltInStatusAutomation(jobId, newStatus, oldStatus = null, reason = 'fallback') {
  const { data: job, error } = await _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single();
  if (error || !job) throw error || new Error('Job not found');

  const defs = mfrDefaultCampaignDefinitions();
  const def = defs.find(d => d.trigger_status === newStatus);
  if (!def) {
    await mfrAddSystemNote(job.customer_id, jobId, 'automation', 'No Campaign Configured', 'No campaign task definition exists for ' + mfrStatusLabel(newStatus) + '.');
    return { created:0, skipped:0, source:'fallback', reason:'no_definition' };
  }

  let created = 0;
  let skipped = 0;
  const actions = [];
  for (const t of def.tasks) {
    const result = await mfrCreateCampaignTask(job, t);
    if (result.created) created += 1;
    if (result.skipped) skipped += 1;
    actions.push({ type:'task', title:t.title, result:result.created ? 'created' : 'skipped' });
  }

  await mfrAddSystemNote(
    job.customer_id,
    jobId,
    'automation',
    def.name || 'Built-In Automation',
    'Built-in automation fired for ' + mfrStatusLabel(newStatus) + '. Created ' + created + ' task(s), skipped ' + skipped + ' existing task(s). Reason: ' + reason + '.'
  );

  try {
    await _sb.from('campaign_run_log').insert({
      campaign_rule_id:null,
      job_id:jobId,
      customer_id:job.customer_id,
      old_status:oldStatus || null,
      new_status:newStatus,
      actions:actions,
      created_by:_user?.id || null
    });
  } catch (ignore) {}

  return { created, skipped, source:'fallback', reason };
}



// ══════════════════════════════════════════════════════════════
// TASK VIEW / EDIT FIX
// Makes the Tasks page "View" button open a real modal even if v_tasks_full
// is missing optional display columns. Also exposes the function on window
// so inline onclick handlers always find it.
// ══════════════════════════════════════════════════════════════
(function mfrTaskViewFix(){
  function h(v){
    return String(v ?? '').replace(/[&<>"]/g, function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]);
    });
  }
  function fmtDate(v){
    if (!v) return '';
    try { return new Date(v).toISOString().split('T')[0]; } catch(e){ return ''; }
  }
  function label(v){
    return String(v || '').replace(/_/g,' ').replace(/-/g,' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); });
  }
  async function safeData(q, fallback){
    try { const r = await q; if (r.error) throw r.error; return r.data ?? fallback; }
    catch(e){ console.warn('Task view helper query skipped:', e.message || e); return fallback; }
  }
  async function getTask(taskId){
    let task = null;
    try {
      const r = await _sb.from('v_tasks_full').select('*').eq('id', taskId).single();
      if (!r.error && r.data) task = r.data;
    } catch(e) {}
    if (!task) {
      const r = await _sb.from('tasks').select('*').eq('id', taskId).single();
      if (r.error) throw r.error;
      task = r.data;
    }
    if (!task) throw new Error('Task not found');

    if ((!task.customer_name || !task.customer_phone) && task.customer_id) {
      const c = await safeData(_sb.from('customers').select('*').eq('id', task.customer_id).single(), null);
      if (c) {
        task.customer_name = task.customer_name || [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.email || c.phone || 'Customer';
        task.customer_phone = task.customer_phone || c.phone || '';
        task.customer_email = task.customer_email || c.email || '';
        task.customer_address = task.customer_address || [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ');
      }
    }
    if ((!task.assigned_to_name || !task.assigned_to_email) && task.assigned_to) {
      const p = await safeData(_sb.from('profiles').select('id,full_name,email,phone').eq('id', task.assigned_to).single(), null);
      if (p) {
        task.assigned_to_name = task.assigned_to_name || p.full_name || p.email || 'User';
        task.assigned_to_email = task.assigned_to_email || p.email || '';
      }
    }
    if ((!task.created_by_name) && task.created_by) {
      const p = await safeData(_sb.from('profiles').select('id,full_name,email').eq('id', task.created_by).single(), null);
      if (p) task.created_by_name = p.full_name || p.email || 'User';
    }
    if ((!task.customer_name || !task.customer_id) && task.job_id) {
      const j = await safeData(_sb.from('jobs').select('id,customer_id,status,contract_value,customers(*)').eq('id', task.job_id).single(), null);
      if (j) {
        task.customer_id = task.customer_id || j.customer_id;
        task.job_status = task.job_status || j.status;
        task.contract_value = task.contract_value || j.contract_value;
        if (j.customers) {
          task.customer_name = task.customer_name || [j.customers.first_name, j.customers.last_name].filter(Boolean).join(' ').trim() || j.customers.email || 'Customer';
          task.customer_phone = task.customer_phone || j.customers.phone || '';
          task.customer_address = task.customer_address || [j.customers.address, j.customers.city, j.customers.state, j.customers.zip].filter(Boolean).join(', ');
        }
      }
    }
    return task;
  }

  window.viewTaskDetail = async function(taskId){
    if (!taskId) { toast('Missing task id', 'error'); return; }
    try {
      const task = await getTask(taskId);
      const users = await safeData(_sb.from('profiles').select('id,full_name,email').eq('is_active', true).order('full_name'), []);
      const statusOptions = ['pending','in-progress','complete','cancelled'];
      const priorityOptions = ['low','normal','high','urgent'];
      const typeOptions = ['call','follow-up','schedule','upload-docs','review-estimate','order-materials','custom'];

      document.querySelectorAll('.task-detail-modal').forEach(m => m.remove());
      const modal = document.createElement('div');
      modal.className = 'modal-overlay task-detail-modal';
      modal.innerHTML = '<div class="modal-sheet" style="max-width:760px;max-height:92vh;overflow:auto">'
        + '<div style="display:flex;justify-content:space-between;gap:16px;align-items:start;margin-bottom:14px">'
        + '<div><h3 style="font-size:22px;font-weight:900;margin:0">✅ Task Details</h3><p style="font-size:12px;color:var(--text3);margin:4px 0 0">View, edit, complete, and jump to the related project or customer.</p></div>'
        + '<button class="btn btn-sm btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Close</button>'
        + '</div>'
        + '<div class="form-grid">'
        + '<div class="fg fg-full"><label class="fl">Task Title *</label><input class="fi" id="tv-title" value="' + h(task.title || '') + '"></div>'
        + '<div class="fg"><label class="fl">Type</label><select class="fs" id="tv-type">' + typeOptions.map(x => '<option value="' + x + '" ' + (task.task_type === x ? 'selected' : '') + '>' + label(x) + '</option>').join('') + '</select></div>'
        + '<div class="fg"><label class="fl">Priority</label><select class="fs" id="tv-priority">' + priorityOptions.map(x => '<option value="' + x + '" ' + (task.priority === x ? 'selected' : '') + '>' + label(x) + '</option>').join('') + '</select></div>'
        + '<div class="fg"><label class="fl">Status</label><select class="fs" id="tv-status">' + statusOptions.map(x => '<option value="' + x + '" ' + (task.status === x ? 'selected' : '') + '>' + label(x) + '</option>').join('') + '</select></div>'
        + '<div class="fg"><label class="fl">Due Date</label><input class="fi" id="tv-due" type="date" value="' + h(fmtDate(task.due_date)) + '"></div>'
        + '<div class="fg fg-full"><label class="fl">Assign To</label><select class="fs" id="tv-assign">'
        + users.map(u => '<option value="' + u.id + '" ' + (task.assigned_to === u.id ? 'selected' : '') + '>' + h(u.full_name || u.email || 'User') + (u.id === _user?.id ? ' (Me)' : '') + '</option>').join('')
        + '</select></div>'
        + '<div class="fg fg-full"><label class="fl">Description</label><textarea class="fi" id="tv-desc" rows="4">' + h(task.description || '') + '</textarea></div>'
        + '</div>'
        + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:14px 0">'
        + '<div style="background:var(--gray);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:800">Customer</div><div style="font-weight:800;margin-top:4px">' + h(task.customer_name || '—') + '</div><div style="font-size:12px;color:var(--text3);margin-top:2px">' + h(task.customer_phone || task.customer_email || '') + '</div></div>'
        + '<div style="background:var(--gray);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:800">Assigned</div><div style="font-weight:800;margin-top:4px">' + h(task.assigned_to_name || '—') + '</div><div style="font-size:12px;color:var(--text3);margin-top:2px">Created by ' + h(task.created_by_name || '—') + '</div></div>'
        + '<div style="background:var(--gray);border:1px solid var(--border);border-radius:10px;padding:12px"><div style="font-size:11px;color:var(--text3);text-transform:uppercase;font-weight:800">Created</div><div style="font-weight:800;margin-top:4px">' + (task.created_at ? new Date(task.created_at).toLocaleString() : '—') + '</div><div style="font-size:12px;color:var(--text3);margin-top:2px">' + (task.completed_at ? 'Completed ' + new Date(task.completed_at).toLocaleString() : 'Not completed') + '</div></div>'
        + '</div>'
        + '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;margin-top:16px">'
        + (task.customer_id ? '<button class="btn btn-outline" onclick="showCustomerModal(\'' + task.customer_id + '\'); this.closest(\'.modal-overlay\').remove()">View Customer</button>' : '')
        + (task.job_id ? '<button class="btn btn-outline" onclick="showJobDetail(\'' + task.job_id + '\'); this.closest(\'.modal-overlay\').remove()">View Project</button>' : '')
        + (task.status !== 'complete' ? '<button class="btn btn-primary" onclick="completeTask(\'' + task.id + '\'); this.closest(\'.modal-overlay\').remove()">✓ Mark Complete</button>' : '')
        + '<button class="btn btn-primary" onclick="saveTaskDetailChanges(\'' + task.id + '\')">Save Changes</button>'
        + '</div>'
        + '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e){ if (e.target === modal) modal.remove(); });
    } catch(e) {
      console.error('View task detail error:', e);
      toast('Could not open task: ' + (e.message || 'unknown error'), 'error');
    }
  };

  window.saveTaskDetailChanges = async function(taskId){
    try {
      const title = document.getElementById('tv-title')?.value?.trim();
      if (!title) { toast('Task title is required', 'error'); return; }
      const status = document.getElementById('tv-status')?.value || 'pending';
      const update = {
        title: title,
        task_type: document.getElementById('tv-type')?.value || 'custom',
        priority: document.getElementById('tv-priority')?.value || 'normal',
        status: status,
        assigned_to: document.getElementById('tv-assign')?.value || null,
        due_date: document.getElementById('tv-due')?.value || null,
        description: document.getElementById('tv-desc')?.value?.trim() || null,
        updated_at: new Date().toISOString()
      };
      if (status === 'complete') {
        update.completed_at = new Date().toISOString();
        update.completed_by = _user?.id || null;
      }
      const r = await _sb.from('tasks').update(update).eq('id', taskId);
      if (r.error) throw r.error;
      toast('Task updated', 'success');
      document.querySelector('.task-detail-modal')?.remove();
      if (_page === 'tasks' && typeof loadTasksList === 'function') await loadTasksList();
      if (document.querySelector('.job-modal') && typeof refreshJobModal === 'function') await refreshJobModal();
    } catch(e) {
      console.error('Save task detail error:', e);
      toast('Could not save task: ' + (e.message || 'unknown error'), 'error');
    }
  };
})();

// ══════════════════════════════════════════════════════════════
// MFR PATCH: Project Detail Parity Control Center
// Replaces the older project modal with a full job/customer hub.
// ══════════════════════════════════════════════════════════════
(function(){
  const PROJECT_STATUSES = [
    ['lead','Lead'],
    ['inspection_scheduled','Inspection Scheduled'],
    ['inspected','Inspected'],
    ['estimate_sent','Estimate Sent'],
    ['contract_signed','Contract Signed'],
    ['claim_filed','Claim Filed'],
    ['claim_approved','Claim Approved'],
    ['in_production','In Production'],
    ['complete','Complete'],
    ['invoiced','Invoiced'],
    ['paid','Paid'],
    ['lost','Lost']
  ];

  const PROJECT_TABS = [
    ['overview','Overview'],
    ['details','Details'],
    ['tasks','Tasks'],
    ['appointments','Appointments'],
    ['notes','Notes'],
    ['photos','Photos'],
    ['documents','Documents'],
    ['estimate','Estimate / Quote'],
    ['timeline','Timeline']
  ];

  window._mfrProjectJobId = null;
  window._mfrProjectTab = 'overview';

  function h(value){
    if (typeof escHtml === 'function') return escHtml(value == null ? '' : String(value));
    return String(value == null ? '' : value)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function money(value){
    const n = Number(value || 0);
    if (!n) return '—';
    return '$' + n.toLocaleString(undefined,{maximumFractionDigits:0});
  }
  function fmtDate(value){
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString([], { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' });
  }
  function customerName(c){
    if (!c) return 'Unknown Customer';
    return ((c.first_name || '') + ' ' + (c.last_name || '')).trim() || c.name || c.email || c.phone || 'Unknown Customer';
  }
  function customerAddress(c){
    if (!c) return '';
    return [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ');
  }
  function statusLabel(status){
    const found = PROJECT_STATUSES.find(s => s[0] === status);
    return found ? found[1] : (status || 'Unknown').replace(/_/g,' ');
  }
  function statusTone(status){
    if (['paid','complete','contract_signed','claim_approved'].includes(status)) return 'green';
    if (['estimate_sent','invoiced','inspection_scheduled'].includes(status)) return 'orange';
    if (['in_production','inspected','claim_filed'].includes(status)) return 'blue';
    if (status === 'lost') return 'red';
    return 'gray';
  }
  function taskTone(priority){
    if (priority === 'urgent') return '#DC2626';
    if (priority === 'high') return '#D97706';
    if (priority === 'low') return '#6B7280';
    return '#2563EB';
  }
  async function safeQuery(q, fallback){
    try {
      const r = await q;
      if (r.error) throw r.error;
      return r.data ?? fallback;
    } catch(e){
      console.warn('Project modal safe query failed:', e.message || e);
      return fallback;
    }
  }
  function pill(text, tone){
    const colors = {
      green:['#DCFCE7','#166534'], blue:['#DBEAFE','#1D4ED8'], orange:['#FEF3C7','#92400E'], red:['#FEE2E2','#991B1B'], gray:['#F3F4F6','#374151'], purple:['#EDE9FE','#5B21B6']
    };
    const c = colors[tone] || colors.gray;
    return '<span style="display:inline-flex;align-items:center;border-radius:999px;background:' + c[0] + ';color:' + c[1] + ';font-size:11px;font-weight:800;padding:4px 9px;text-transform:capitalize">' + h(text) + '</span>';
  }

  function ensureProjectStyles(){
    if (document.getElementById('mfr-project-parity-styles')) return;
    const s = document.createElement('style');
    s.id = 'mfr-project-parity-styles';
    s.textContent = `
      .mfr-project-sheet{max-width:1120px;width:min(1120px,calc(100vw - 24px));max-height:92vh;overflow:hidden;display:flex;flex-direction:column;border-radius:18px;}
      .mfr-project-head{display:flex;gap:16px;align-items:flex-start;justify-content:space-between;border-bottom:1px solid var(--border);padding-bottom:14px;margin-bottom:12px;}
      .mfr-project-title{font-size:22px;font-weight:900;line-height:1.15;margin:0;}
      .mfr-project-sub{font-size:13px;color:var(--text3);margin-top:4px;}
      .mfr-project-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;}
      .mfr-project-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:12px 0;}
      .mfr-project-metric{background:var(--gray);border:1px solid var(--border);border-radius:12px;padding:12px;}
      .mfr-project-metric-label{font-size:10px;color:var(--text3);text-transform:uppercase;font-weight:900;letter-spacing:.04em;}
      .mfr-project-metric-value{font-size:16px;font-weight:900;margin-top:4px;}
      .mfr-project-tabs{display:flex;gap:4px;overflow-x:auto;border-bottom:1px solid var(--border);padding-top:4px;}
      .mfr-project-tab{border:0;background:transparent;padding:10px 12px;font-size:12px;font-weight:850;color:var(--text3);cursor:pointer;border-bottom:3px solid transparent;white-space:nowrap;}
      .mfr-project-tab.active{color:var(--blue);border-bottom-color:var(--blue);}
      .mfr-project-body{overflow:auto;padding-top:14px;}
      .mfr-project-card{background:white;border:1px solid var(--border);border-radius:14px;padding:14px;margin-bottom:12px;}
      .mfr-project-card-title{font-size:14px;font-weight:900;margin-bottom:8px;display:flex;align-items:center;justify-content:space-between;gap:10px;}
      .mfr-project-list-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid var(--border);}
      .mfr-project-list-row:last-child{border-bottom:0;}
      .mfr-project-empty{text-align:center;padding:34px 18px;color:var(--text3);background:var(--gray);border:1px dashed var(--border);border-radius:14px;}
      .mfr-project-photo-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(135px,1fr));gap:10px;}
      .mfr-project-photo{aspect-ratio:1;border-radius:12px;overflow:hidden;background:var(--gray);position:relative;cursor:pointer;border:1px solid var(--border);}
      .mfr-project-photo img{width:100%;height:100%;object-fit:cover;display:block;}
      .mfr-project-quick{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin:10px 0 14px;}
      @media(max-width:720px){.mfr-project-sheet{width:100vw;max-height:94vh;border-radius:18px 18px 0 0}.mfr-project-head{display:block}.mfr-project-actions{justify-content:flex-start;margin-top:12px}.mfr-project-grid{grid-template-columns:1fr 1fr}.mfr-project-quick{grid-template-columns:1fr 1fr}.mfr-project-list-row{display:block}.mfr-project-list-row .btn{margin-top:8px}}
    `;
    document.head.appendChild(s);
  }

  async function loadProjectBundle(jobId){
    const job = await safeQuery(
      _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single(),
      null
    );
    if (!job) throw new Error('Project not found');

    const [profiles, tasks, apptsView, apptsRaw, notes, photos, docs, lineItems, signatures] = await Promise.all([
      safeQuery(_sb.from('profiles').select('id, full_name, email, phone').order('full_name'), []),
      safeQuery(_sb.from('tasks').select('*, profiles!tasks_assigned_to_fkey(full_name,email)').eq('job_id', jobId).order('created_at', { ascending:false }), []),
      safeQuery(_sb.from('v_appointments_full').select('*').eq('job_id', jobId).order('appointment_date', { ascending:false }), null),
      safeQuery(_sb.from('appointments').select('*, profiles!appointments_assigned_to_fkey(full_name,email)').eq('job_id', jobId).order('scheduled_at', { ascending:false }), []),
      safeQuery(_sb.from('customer_notes').select('*, profiles(full_name,email)').eq('job_id', jobId).order('created_at', { ascending:false }), []),
      safeQuery(_sb.from('job_photos').select('*').eq('job_id', jobId).order('created_at', { ascending:false }), []),
      safeQuery(_sb.from('job_documents').select('*').eq('job_id', jobId).order('created_at', { ascending:false }), []),
      safeQuery(_sb.from('estimate_line_items').select('*').eq('job_id', jobId).order('display_order', { ascending:true }), []),
      safeQuery(_sb.from('quote_signatures').select('*').eq('job_id', jobId).order('created_at', { ascending:false }), [])
    ]);

    const appointments = Array.isArray(apptsView) ? apptsView : (apptsRaw || []).map(a => ({
      ...a,
      appointment_date: a.scheduled_at,
      appointment_type: a.appt_type,
      assigned_to_name: a.profiles?.full_name || a.profiles?.email || '',
      customer_name: customerName(job.customers)
    }));

    return { job, profiles: profiles || [], tasks: tasks || [], appointments, notes: notes || [], photos: photos || [], docs: docs || [], lineItems: lineItems || [], signatures: signatures || [] };
  }

  window.showJobDetail = async function(jobId, tab){
    window._mfrProjectJobId = jobId;
    window._mfrProjectTab = tab || window._mfrProjectTab || 'overview';
    await window.refreshJobModal();
  };

  window.refreshJobModal = async function(){
    if (!window._mfrProjectJobId) return;
    ensureProjectStyles();
    try {
      const bundle = await loadProjectBundle(window._mfrProjectJobId);
      const existing = document.querySelector('.modal-overlay.job-modal');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.className = 'modal-overlay job-modal';
      modal.innerHTML = renderProjectModal(bundle);
      document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target === modal) window.closeJobModal(); });
    } catch(e) {
      console.error('Project detail error:', e);
      toast('Could not load project: ' + (e.message || 'unknown error'), 'error');
    }
  };

  window.closeJobModal = function(){
    const el = document.querySelector('.modal-overlay.job-modal');
    if (el) el.remove();
    window._mfrProjectJobId = null;
    window._mfrProjectTab = 'overview';
  };

  window.switchJobTab = async function(tab){
    window._mfrProjectTab = tab;
    await window.refreshJobModal();
  };

  function renderProjectModal(bundle){
    const { job, tasks, appointments, notes, photos, docs, lineItems, signatures } = bundle;
    const c = job.customers || {};
    const activeTab = window._mfrProjectTab || 'overview';
    const openTasks = tasks.filter(t => !['complete','completed','done','cancelled'].includes(t.status)).length;
    const nextAppt = appointments.filter(a => a.appointment_date && new Date(a.appointment_date) >= new Date() && !['cancelled','completed','no_show'].includes(a.status)).sort((a,b)=>new Date(a.appointment_date)-new Date(b.appointment_date))[0];
    const estimateTotal = lineItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || Number(job.contract_value || 0);

    return '<div class="modal-sheet mfr-project-sheet">'
      + '<div class="mfr-project-head">'
      + '<div style="min-width:0;flex:1">'
      + '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px">'
      + '<h3 class="mfr-project-title">' + h(customerName(c)) + '</h3>' + pill(statusLabel(job.status), statusTone(job.status))
      + '</div>'
      + '<div class="mfr-project-sub">Project #' + h(String(job.id || '').slice(0,8)) + (customerAddress(c) ? ' • ' + h(customerAddress(c)) : '') + '</div>'
      + '<div class="mfr-project-sub">' + (c.phone ? '📞 ' + h(c.phone) + ' ' : '') + (c.email ? ' ✉️ ' + h(c.email) : '') + '</div>'
      + '</div>'
      + '<div class="mfr-project-actions">'
      + '<button class="btn btn-outline btn-sm" onclick="showCustomerModal(\'' + h(job.customer_id) + '\'); closeJobModal()">👤 Contact</button>'
      + '<button class="btn btn-outline btn-sm" onclick="copyTrackingLink(\'' + h(job.id) + '\',\'' + h(job.customer_tracking_code || '') + '\')">📍 Tracking</button>'
      + (job.quote_code ? '<button class="btn btn-outline btn-sm" onclick="copyQuoteLink(\'' + h(job.quote_code) + '\')">💰 Quote</button>' : '')
      + '<button class="btn btn-outline btn-sm" onclick="closeJobModal()">✕</button>'
      + '</div></div>'
      + '<div class="mfr-project-grid">'
      + '<div class="mfr-project-metric"><div class="mfr-project-metric-label">Value</div><div class="mfr-project-metric-value">' + money(estimateTotal) + '</div></div>'
      + '<div class="mfr-project-metric"><div class="mfr-project-metric-label">Open Tasks</div><div class="mfr-project-metric-value">' + openTasks + '</div></div>'
      + '<div class="mfr-project-metric"><div class="mfr-project-metric-label">Next Appointment</div><div class="mfr-project-metric-value" style="font-size:14px">' + h(nextAppt ? fmtDate(nextAppt.appointment_date) : 'None') + '</div></div>'
      + '<div class="mfr-project-metric"><div class="mfr-project-metric-label">Files</div><div class="mfr-project-metric-value">' + photos.length + ' Photos • ' + docs.length + ' Docs</div></div>'
      + '</div>'
      + '<div class="mfr-project-quick">'
      + '<button class="btn btn-primary btn-sm" onclick="newApptModal(\'' + h(job.id) + '\')">📅 Appointment</button>'
      + '<button class="btn btn-outline btn-sm" onclick="createTaskModal(\'' + h(job.id) + '\',\'' + h(job.customer_id) + '\')">✅ Task</button>'
      + '<button class="btn btn-outline btn-sm" onclick="addCustomerNote(\'' + h(job.customer_id) + '\',\'' + h(job.id) + '\')">📝 Note</button>'
      + '<button class="btn btn-outline btn-sm" onclick="openEstimateBuilder(\'' + h(job.id) + '\')">💰 Estimate</button>'
      + '<button class="btn btn-outline btn-sm" onclick="uploadPhotos(\'' + h(job.id) + '\')">📸 Photos</button>'
      + '<button class="btn btn-outline btn-sm" onclick="uploadDocuments(\'' + h(job.id) + '\')">📄 Documents</button>'
      + '</div>'
      + '<div class="mfr-project-tabs">' + PROJECT_TABS.map(t => '<button class="mfr-project-tab ' + (activeTab === t[0] ? 'active' : '') + '" onclick="switchJobTab(\'' + t[0] + '\')">' + t[1] + '</button>').join('') + '</div>'
      + '<div class="mfr-project-body">' + renderProjectTab(activeTab, bundle) + '</div>'
      + '</div>';
  }

  function renderProjectTab(tab, bundle){
    const { job } = bundle;
    if (tab === 'overview') return renderOverview(bundle);
    if (tab === 'details') return renderDetails(bundle);
    if (tab === 'tasks') return renderTasks(bundle);
    if (tab === 'appointments') return renderAppointments(bundle);
    if (tab === 'notes') return renderNotes(bundle);
    if (tab === 'photos') return renderPhotos(bundle);
    if (tab === 'documents') return renderDocs(bundle);
    if (tab === 'estimate') return renderEstimate(bundle);
    if (tab === 'timeline') return renderTimeline(bundle);
    return '<div class="mfr-project-empty">Nothing here yet.</div>';
  }

  function renderOverview(bundle){
    const { job, tasks, appointments, notes, photos, docs, lineItems } = bundle;
    const recentNotes = notes.slice(0,3);
    const openTasks = tasks.filter(t => !['complete','completed','done','cancelled'].includes(t.status)).slice(0,4);
    const upcoming = appointments.filter(a => a.appointment_date && new Date(a.appointment_date) >= new Date() && !['cancelled','completed','no_show'].includes(a.status)).slice(0,3);
    return '<div style="display:grid;grid-template-columns:1.1fr .9fr;gap:14px">'
      + '<div>'
      + '<div class="mfr-project-card"><div class="mfr-project-card-title">Status Control</div>'
      + '<div class="form-grid">'
      + '<div class="fg"><label class="fl">Project Status</label><select class="fs" onchange="updateProjectStatusFromModal(\'' + h(job.id) + '\', this.value)">' + PROJECT_STATUSES.map(s => '<option value="' + s[0] + '" ' + (job.status === s[0] ? 'selected' : '') + '>' + s[1] + '</option>').join('') + '</select></div>'
      + '<div class="fg"><label class="fl">Marketing Channel</label><div style="padding:9px 0;font-weight:800">' + h(job.marketing_channel || job.source || '—') + '</div></div>'
      + '<div class="fg"><label class="fl">Job Type</label><div style="padding:9px 0;font-weight:800">' + h(job.job_type || 'Roofing') + '</div></div>'
      + '<div class="fg"><label class="fl">Contract Value</label><div style="padding:9px 0;font-weight:900">' + money(job.contract_value) + '</div></div>'
      + '</div></div>'
      + '<div class="mfr-project-card"><div class="mfr-project-card-title">Open Tasks <button class="btn btn-sm btn-outline" onclick="createTaskModal(\'' + h(job.id) + '\',\'' + h(job.customer_id) + '\')">+ Task</button></div>' + renderTaskRows(openTasks, true) + '</div>'
      + '</div><div>'
      + '<div class="mfr-project-card"><div class="mfr-project-card-title">Upcoming Appointments <button class="btn btn-sm btn-outline" onclick="newApptModal(\'' + h(job.id) + '\')">+ Schedule</button></div>' + renderAppointmentRows(upcoming, true) + '</div>'
      + '<div class="mfr-project-card"><div class="mfr-project-card-title">Recent Notes <button class="btn btn-sm btn-outline" onclick="addCustomerNote(\'' + h(job.customer_id) + '\',\'' + h(job.id) + '\')">+ Note</button></div>' + renderNoteRows(recentNotes, true) + '</div>'
      + '<div class="mfr-project-card"><div class="mfr-project-card-title">Files</div><div style="display:flex;gap:8px;flex-wrap:wrap">' + pill(photos.length + ' Photos','blue') + pill(docs.length + ' Documents','orange') + pill(lineItems.length + ' Line Items','green') + '</div></div>'
      + '</div></div>';
  }

  function renderDetails(bundle){
    const { job, profiles } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Editable Project Details</div>'
      + '<div class="form-grid">'
      + '<div class="fg"><label class="fl">Status</label><select class="fs" id="mfr-project-status">' + PROJECT_STATUSES.map(s => '<option value="' + s[0] + '" ' + (job.status === s[0] ? 'selected' : '') + '>' + s[1] + '</option>').join('') + '</select></div>'
      + '<div class="fg"><label class="fl">Assigned To</label><select class="fs" id="mfr-project-assigned"><option value="">Unassigned</option>' + profiles.map(p => '<option value="' + p.id + '" ' + (job.assigned_to === p.id ? 'selected' : '') + '>' + h(p.full_name || p.email || 'User') + '</option>').join('') + '</select></div>'
      + '<div class="fg"><label class="fl">Job Type</label><input class="fi" id="mfr-project-job-type" value="' + h(job.job_type || '') + '"></div>'
      + '<div class="fg"><label class="fl">Marketing Channel / Source</label><input class="fi" id="mfr-project-marketing" value="' + h(job.marketing_channel || job.source || '') + '"></div>'
      + '<div class="fg"><label class="fl">Insurance Company</label><input class="fi" id="mfr-project-insurance" value="' + h(job.insurance_company || '') + '"></div>'
      + '<div class="fg"><label class="fl">Claim Number</label><input class="fi" id="mfr-project-claim" value="' + h(job.claim_number || '') + '"></div>'
      + '<div class="fg"><label class="fl">Contract Value</label><input class="fi" id="mfr-project-value" type="number" step="0.01" value="' + h(job.contract_value || '') + '"></div>'
      + '<div class="fg"><label class="fl">Deductible</label><input class="fi" id="mfr-project-deductible" type="number" step="0.01" value="' + h(job.deductible || '') + '"></div>'
      + '<div class="fg fg-full"><label class="fl">Project Notes</label><textarea class="fi" id="mfr-project-notes" rows="5">' + h(job.notes || '') + '</textarea></div>'
      + '</div><div style="display:flex;justify-content:flex-end;margin-top:14px"><button class="btn btn-primary" onclick="saveProjectDetails(\'' + h(job.id) + '\')">💾 Save Project Details</button></div></div>';
  }

  function renderTasks(bundle){
    const { job, tasks } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Project Tasks <button class="btn btn-sm btn-primary" onclick="createTaskModal(\'' + h(job.id) + '\',\'' + h(job.customer_id) + '\')">+ New Task</button></div>' + renderTaskRows(tasks, false) + '</div>';
  }
  function renderTaskRows(tasks, compact){
    if (!tasks || !tasks.length) return '<div class="mfr-project-empty">No tasks yet.</div>';
    return tasks.map(t => '<div class="mfr-project-list-row">'
      + '<div style="min-width:0"><div style="font-weight:900;font-size:13px">' + h(t.title || 'Untitled Task') + '</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:3px">' + h(t.task_type || 'task') + ' • Due ' + h(t.due_date || 'not set') + ' • Assigned ' + h(t.profiles?.full_name || t.assigned_to_name || '') + '</div>'
      + (!compact && t.description ? '<div style="font-size:12px;color:var(--text2);margin-top:6px">' + h(t.description) + '</div>' : '') + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">'
      + '<span style="font-size:11px;font-weight:900;color:' + taskTone(t.priority) + '">' + h(t.priority || 'normal') + '</span>' + pill(t.status || 'pending', (t.status === 'complete' ? 'green' : 'blue'))
      + (typeof showTaskDetail === 'function' ? '<button class="btn btn-sm btn-outline" onclick="showTaskDetail(\'' + h(t.id) + '\')">View</button>' : '')
      + (!['complete','completed','done'].includes(t.status) ? '<button class="btn btn-sm btn-primary" onclick="completeProjectTask(\'' + h(t.id) + '\')">✓ Complete</button>' : '')
      + '</div></div>').join('');
  }

  function renderAppointments(bundle){
    const { job, appointments } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Appointments <button class="btn btn-sm btn-primary" onclick="newApptModal(\'' + h(job.id) + '\')">+ Schedule Appointment</button></div>' + renderAppointmentRows(appointments, false) + '</div>';
  }
  function renderAppointmentRows(appts, compact){
    if (!appts || !appts.length) return '<div class="mfr-project-empty">No appointments scheduled.</div>';
    return appts.map(a => '<div class="mfr-project-list-row">'
      + '<div><div style="font-weight:900;font-size:13px">' + fmtDate(a.appointment_date || a.scheduled_at) + '</div>'
      + '<div style="font-size:12px;color:var(--text3);margin-top:3px">' + h((a.appointment_type || a.appt_type || 'appointment').replace(/_/g,' ')) + ' • ' + h(a.assigned_to_name || a.profiles?.full_name || 'Unassigned') + '</div>'
      + (!compact && (a.location || a.address) ? '<div style="font-size:12px;color:var(--text2);margin-top:5px">📍 ' + h(a.location || a.address) + '</div>' : '')
      + (!compact && a.notes ? '<div style="font-size:12px;color:var(--text2);margin-top:5px">' + h(a.notes) + '</div>' : '') + '</div>'
      + '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end">' + pill((a.status || 'scheduled').replace(/_/g,' '), a.status === 'completed' ? 'green' : a.status === 'cancelled' ? 'red' : 'blue')
      + (typeof viewAppointmentDetail === 'function' ? '<button class="btn btn-sm btn-outline" onclick="viewAppointmentDetail(\'' + h(a.id) + '\')">View</button>' : '') + '</div></div>').join('');
  }

  function renderNotes(bundle){
    const { job, notes } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Notes & Calls <button class="btn btn-sm btn-primary" onclick="addCustomerNote(\'' + h(job.customer_id) + '\',\'' + h(job.id) + '\')">+ Add Note</button></div>' + renderNoteRows(notes, false) + '</div>';
  }
  function renderNoteRows(notes, compact){
    if (!notes || !notes.length) return '<div class="mfr-project-empty">No notes yet.</div>';
    return notes.map(n => '<div class="mfr-project-list-row">'
      + '<div style="min-width:0"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><strong style="font-size:13px">' + h(n.subject || n.note_type || 'Note') + '</strong>' + pill(h(n.note_type || 'note'), n.is_important ? 'orange' : 'gray') + (n.requires_followup ? pill('Follow-up ' + (n.followup_completed ? 'Done' : 'Needed'), n.followup_completed ? 'green' : 'orange') : '') + '</div>'
      + '<div style="font-size:12px;color:var(--text2);margin-top:6px;white-space:pre-wrap">' + h(n.note_text || '') + '</div>'
      + '<div style="font-size:11px;color:var(--text3);margin-top:6px">' + fmtDate(n.created_at) + ' • ' + h(n.profiles?.full_name || n.created_by_name || '') + '</div></div></div>').join('');
  }

  function renderPhotos(bundle){
    const { job, photos } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Photos <button class="btn btn-sm btn-primary" onclick="uploadPhotos(\'' + h(job.id) + '\')">+ Upload Photos</button></div>'
      + (!photos.length ? '<div class="mfr-project-empty">No photos yet.</div>' : '<div class="mfr-project-photo-grid">' + photos.map(p => '<div class="mfr-project-photo" onclick="window.open(\'' + h(p.photo_url) + '\',\'_blank\')"><img src="' + h(p.photo_url) + '">' + (p.caption ? '<div style="position:absolute;left:0;right:0;bottom:0;background:rgba(0,0,0,.65);color:white;font-size:11px;padding:6px">' + h(p.caption) + '</div>' : '') + '</div>').join('') + '</div>') + '</div>';
  }

  function renderDocs(bundle){
    const { job, docs } = bundle;
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Documents <button class="btn btn-sm btn-primary" onclick="uploadDocuments(\'' + h(job.id) + '\')">+ Upload Document</button></div>'
      + (!docs.length ? '<div class="mfr-project-empty">No documents yet.</div>' : docs.map(d => '<div class="mfr-project-list-row"><div><div style="font-weight:900;font-size:13px">' + h(d.document_name || 'Document') + '</div><div style="font-size:12px;color:var(--text3)">' + h(d.document_type || 'file') + ' • ' + fmtDate(d.created_at) + '</div></div><a class="btn btn-sm btn-outline" target="_blank" href="' + h(d.document_url) + '">Open</a></div>').join('')) + '</div>';
  }

  function renderEstimate(bundle){
    const { job, lineItems, signatures } = bundle;
    const total = lineItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0) || Number(job.contract_value || 0);
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Estimate / Quote <button class="btn btn-sm btn-primary" onclick="openEstimateBuilder(\'' + h(job.id) + '\')">Open Estimate Builder</button></div>'
      + '<div class="mfr-project-grid"><div class="mfr-project-metric"><div class="mfr-project-metric-label">Estimate Total</div><div class="mfr-project-metric-value">' + money(total) + '</div></div><div class="mfr-project-metric"><div class="mfr-project-metric-label">Quote Code</div><div class="mfr-project-metric-value" style="font-size:13px">' + h(job.quote_code || 'Not generated') + '</div></div><div class="mfr-project-metric"><div class="mfr-project-metric-label">Signed</div><div class="mfr-project-metric-value">' + (signatures.length ? 'Yes' : 'No') + '</div></div></div>'
      + (job.quote_code ? '<div style="margin:10px 0"><button class="btn btn-outline" onclick="copyQuoteLink(\'' + h(job.quote_code) + '\')">Copy Quote Link</button></div>' : '')
      + (!lineItems.length ? '<div class="mfr-project-empty">No saved estimate line items yet.</div>' : '<table class="tbl"><thead><tr><th>Item</th><th>Qty</th><th>Unit</th><th>Total</th></tr></thead><tbody>' + lineItems.map(i => '<tr><td><strong>' + h(i.item_name) + '</strong><div style="font-size:11px;color:var(--text3)">' + h(i.item_type || '') + '</div></td><td>' + h(i.quantity || '') + '</td><td>' + money(i.unit_price) + ' / ' + h(i.unit_label || 'unit') + '</td><td><strong>' + money(i.total_price) + '</strong></td></tr>').join('') + '</tbody></table>')
      + '</div>';
  }

  function renderTimeline(bundle){
    const events = [];
    (bundle.notes || []).forEach(n => events.push({ when:n.created_at, type:'Note', title:n.subject || n.note_type || 'Note', body:n.note_text || '' }));
    (bundle.tasks || []).forEach(t => events.push({ when:t.created_at, type:'Task', title:t.title || 'Task', body:(t.status || 'pending') + (t.due_date ? ' • Due ' + t.due_date : '') }));
    (bundle.appointments || []).forEach(a => events.push({ when:a.created_at || a.appointment_date, type:'Appointment', title:(a.appointment_type || a.appt_type || 'appointment').replace(/_/g,' '), body:fmtDate(a.appointment_date || a.scheduled_at) + ' • ' + (a.status || 'scheduled') }));
    (bundle.photos || []).forEach(p => events.push({ when:p.created_at, type:'Photo', title:p.caption || 'Photo uploaded', body:p.photo_type || '' }));
    (bundle.docs || []).forEach(d => events.push({ when:d.created_at, type:'Document', title:d.document_name || 'Document uploaded', body:d.document_type || '' }));
    events.sort((a,b) => new Date(b.when || 0) - new Date(a.when || 0));
    if (!events.length) return '<div class="mfr-project-empty">No timeline activity yet.</div>';
    return '<div class="mfr-project-card"><div class="mfr-project-card-title">Project Timeline</div>' + events.map(e => '<div class="mfr-project-list-row"><div><div style="font-size:11px;color:var(--text3);font-weight:900;text-transform:uppercase">' + h(e.type) + ' • ' + fmtDate(e.when) + '</div><div style="font-weight:900;margin-top:4px">' + h(e.title) + '</div>' + (e.body ? '<div style="font-size:12px;color:var(--text2);margin-top:4px;white-space:pre-wrap">' + h(e.body) + '</div>' : '') + '</div></div>').join('') + '</div>';
  }

  window.updateProjectStatusFromModal = async function(jobId, newStatus){
    try {
      const { data: oldJob } = await _sb.from('jobs').select('status').eq('id', jobId).single();
      const updates = { status:newStatus, updated_at:new Date().toISOString() };
      if (newStatus === 'inspection_scheduled') updates.appointment_set_date = new Date().toISOString();
      if (['complete','invoiced','paid'].includes(newStatus)) updates.closed_date = new Date().toISOString();
      const r = await _sb.from('jobs').update(updates).eq('id', jobId).select('id,status').single();
      if (r.error) throw r.error;
      if (r.data?.status !== newStatus) throw new Error('Supabase did not confirm the new status.');
      if (typeof handleStatusChange === 'function' && oldJob?.status !== newStatus) await handleStatusChange(jobId, oldJob?.status || null, newStatus);
      toast('Project moved to ' + statusLabel(newStatus), 'success');
      if (typeof loadKanbanBoard === 'function') await loadKanbanBoard();
      await window.refreshJobModal();
    } catch(e) {
      console.error('Project status update failed:', e);
      toast('Could not update status: ' + (e.message || 'unknown error'), 'error');
      await window.refreshJobModal();
    }
  };

  window.saveProjectDetails = async function(jobId){
    try {
      const newStatus = document.getElementById('mfr-project-status')?.value || 'lead';
      const update = {
        status: newStatus,
        assigned_to: document.getElementById('mfr-project-assigned')?.value || null,
        job_type: document.getElementById('mfr-project-job-type')?.value?.trim() || null,
        marketing_channel: document.getElementById('mfr-project-marketing')?.value?.trim() || null,
        source: document.getElementById('mfr-project-marketing')?.value?.trim() || null,
        insurance_company: document.getElementById('mfr-project-insurance')?.value?.trim() || null,
        claim_number: document.getElementById('mfr-project-claim')?.value?.trim() || null,
        contract_value: document.getElementById('mfr-project-value')?.value || null,
        deductible: document.getElementById('mfr-project-deductible')?.value || null,
        notes: document.getElementById('mfr-project-notes')?.value?.trim() || null,
        updated_at: new Date().toISOString()
      };
      const { data: oldJob } = await _sb.from('jobs').select('status').eq('id', jobId).single();
      const r = await _sb.from('jobs').update(update).eq('id', jobId).select('id,status').single();
      if (r.error) throw r.error;
      if (oldJob?.status !== newStatus && typeof handleStatusChange === 'function') await handleStatusChange(jobId, oldJob?.status || null, newStatus);
      toast('Project details saved', 'success');
      if (typeof loadKanbanBoard === 'function') await loadKanbanBoard();
      await window.refreshJobModal();
    } catch(e) {
      console.error('Save project details failed:', e);
      toast('Could not save project: ' + (e.message || 'unknown error'), 'error');
    }
  };

  window.completeProjectTask = async function(taskId){
    try {
      const r = await _sb.from('tasks').update({ status:'complete', completed_at:new Date().toISOString(), completed_by:_user?.id || null, updated_at:new Date().toISOString() }).eq('id', taskId);
      if (r.error) throw r.error;
      toast('Task completed', 'success');
      if (typeof loadTasksList === 'function' && _page === 'tasks') await loadTasksList();
      await window.refreshJobModal();
    } catch(e) {
      console.error('Complete task failed:', e);
      toast('Could not complete task: ' + (e.message || 'unknown error'), 'error');
    }
  };
})();


// ══════════════════════════════════════════════════════════════
// CONTRACT SIGNED AUTOMATION HARDENING PATCH
// Keeps status moves successful even when automation helper notes/tasks hit
// missing optional helpers, duplicate rows, or assignee edge cases.
// This intentionally comes last so these functions win over older copies.
// ══════════════════════════════════════════════════════════════
function mfrDueDate(days){
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 1));
  return d.toISOString().slice(0,10);
}

function mfrSafeStatusLabel(status){
  try {
    if (typeof mfrStatusLabel === 'function') return mfrStatusLabel(status);
    if (typeof statusLabel === 'function') return statusLabel(status);
  } catch (ignore) {}
  return String(status || '').replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

async function mfrAddSystemNote(customerId, jobId, noteType, subject, noteText){
  try {
    if (!_sb || (!customerId && !jobId)) return { ok:false, skipped:true };
    const payload = {
      customer_id: customerId || null,
      job_id: jobId || null,
      created_by: _user?.id || null,
      note_type: String(noteType || 'system').slice(0,50),
      subject: subject || 'System Note',
      note_text: noteText || '',
      requires_followup: false,
      followup_completed: false,
      is_important: String(noteType || '').includes('error'),
      is_private: false
    };
    const { error } = await _sb.from('customer_notes').insert(payload);
    if (error) {
      console.warn('System note skipped:', error.message || error);
      return { ok:false, error:error.message || String(error) };
    }
    return { ok:true };
  } catch (e) {
    console.warn('System note skipped:', e.message || e);
    return { ok:false, error:e.message || String(e) };
  }
}

function mfrAutomationOpenStatus(status){
  const s = String(status || 'pending').trim().toLowerCase();
  return !['complete','completed','done','cancelled','canceled','closed','paid'].includes(s);
}

function mfrAutomationDefaults(){
  return {
    estimate_sent: [
      { task_type:'follow-up', title:'Follow up on estimate', description:'Call or email the customer about their estimate.', due_days:3, priority:'normal', assign_to:'job_assigned' }
    ],
    contract_signed: [
      { task_type:'order-materials', title:'Order roofing materials', description:'Confirm measurements and order roofing materials.', due_days:2, priority:'high', assign_to:'job_assigned' },
      { task_type:'schedule', title:'Schedule production', description:'Schedule install/start date and confirm with customer.', due_days:2, priority:'high', assign_to:'job_assigned' }
    ],
    claim_filed: [
      { task_type:'follow-up', title:'Follow up with insurance', description:'Check claim status and update notes.', due_days:3, priority:'normal', assign_to:'job_assigned' }
    ],
    claim_approved: [
      { task_type:'schedule', title:'Prepare production handoff', description:'Confirm scope, customer expectations, and material plan.', due_days:2, priority:'high', assign_to:'job_assigned' }
    ],
    complete: [
      { task_type:'upload-docs', title:'Upload final photos and warranty', description:'Upload final project photos and warranty documents.', due_days:1, priority:'high', assign_to:'job_assigned' },
      { task_type:'review', title:'Request customer review', description:'Ask customer for a review after completion.', due_days:2, priority:'normal', assign_to:'job_assigned' }
    ],
    invoiced: [
      { task_type:'billing', title:'Follow up on invoice', description:'Confirm invoice was received and answer billing questions.', due_days:3, priority:'normal', assign_to:'job_assigned' }
    ],
    paid: [
      { task_type:'custom', title:'Close out project file', description:'Confirm photos, documents, warranty, and payment are complete.', due_days:1, priority:'normal', assign_to:'job_assigned' }
    ]
  };
}

async function mfrResolveCampaignAssignee(job, template){
  try {
    const mode = template?.assign_to || 'job_assigned';
    if (mode === 'job_assigned' && job?.assigned_to) return job.assigned_to;
    if (mode === 'current_user' && _user?.id) return _user.id;
    if (mode === 'role' && template?.assign_to_role) {
      const { data } = await _sb.from('profiles').select('id').eq('role', template.assign_to_role).eq('is_active', true).limit(1);
      if (data && data[0]?.id) return data[0].id;
    }
  } catch (ignore) {}
  return job?.assigned_to || _user?.id || null;
}

async function mfrCreateCampaignTask(job, template){
  const title = template?.title || 'Follow up';
  const taskType = template?.task_type || 'follow-up';
  const norm = v => String(v || '').trim().toLowerCase();
  try {
    // Duplicate check. Do not fail automation if this read has an issue.
    const existingRes = await _sb.from('tasks').select('id,title,task_type,status').eq('job_id', job.id).eq('task_type', taskType);
    if (!existingRes.error) {
      const duplicate = (existingRes.data || []).find(t => norm(t.title) === norm(title) && mfrAutomationOpenStatus(t.status));
      if (duplicate) return { created:false, skipped:true, duplicate_id:duplicate.id };
    } else {
      console.warn('Task duplicate check skipped:', existingRes.error.message || existingRes.error);
    }

    const basePayload = {
      job_id: job.id,
      customer_id: job.customer_id || null,
      assigned_to: await mfrResolveCampaignAssignee(job, template),
      created_by: _user?.id || null,
      task_type: taskType,
      title: title,
      description: template?.description || null,
      due_date: mfrDueDate(Number(template?.due_days || template?.due || 1)),
      priority: template?.priority || 'normal',
      status: 'pending'
    };

    // Try with resolved assignee. If FK/RLS rejects assignee, retry with current user, then unassigned.
    let res = await _sb.from('tasks').insert(basePayload).select('id').single();
    if (res.error && _user?.id && basePayload.assigned_to !== _user.id) {
      console.warn('Task insert retrying with current user:', res.error.message || res.error);
      res = await _sb.from('tasks').insert({ ...basePayload, assigned_to:_user.id }).select('id').single();
    }
    if (res.error && basePayload.assigned_to) {
      console.warn('Task insert retrying unassigned:', res.error.message || res.error);
      res = await _sb.from('tasks').insert({ ...basePayload, assigned_to:null }).select('id').single();
    }
    if (res.error) return { created:false, skipped:false, error:res.error.message || String(res.error) };

    await mfrAddSystemNote(job.customer_id, job.id, 'automation', 'Task Created', title + ' was created by the stage automation.');
    return { created:true, skipped:false, id:res.data?.id || null };
  } catch (e) {
    console.warn('Campaign task failed:', title, e.message || e);
    await mfrAddSystemNote(job.customer_id, job.id, 'automation-error', 'Task Automation Failed', title + ': ' + (e.message || 'Unknown error'));
    return { created:false, skipped:false, error:e.message || String(e) };
  }
}

async function mfrGetCampaignTemplatesForStatus(status){
  try {
    const ruleRes = await _sb.from('campaign_rules').select('*').eq('trigger_status', status).eq('enabled', true);
    if (ruleRes.error) throw ruleRes.error;
    const rules = ruleRes.data || [];
    if (!rules.length) return { source:'defaults', rules:[], templates:mfrAutomationDefaults()[status] || [] };

    let templates = [];
    for (const rule of rules) {
      const tRes = await _sb.from('campaign_task_templates').select('*').eq('campaign_rule_id', rule.id);
      if (!tRes.error && tRes.data?.length) templates.push(...tRes.data.map(t => ({ ...t, campaign_rule_id:rule.id, campaign_rule_name:rule.name })));
    }
    if (!templates.length) return { source:'defaults', rules, templates:mfrAutomationDefaults()[status] || [] };
    return { source:'campaign_rules', rules, templates };
  } catch (e) {
    console.warn('Campaign rule lookup failed, using defaults:', e.message || e);
    return { source:'defaults', rules:[], templates:mfrAutomationDefaults()[status] || [] };
  }
}

async function mfrRunCampaignAutomations(jobId, oldStatus, newStatus){
  const { data: job, error: jobError } = await _sb.from('jobs').select('*, customers(*)').eq('id', jobId).single();
  if (jobError || !job) return { created:0, skipped:0, errors:1, error:jobError?.message || 'Job not found' };

  const pack = await mfrGetCampaignTemplatesForStatus(newStatus);
  if (!pack.templates.length) {
    await mfrAddSystemNote(job.customer_id, job.id, 'automation', 'No Campaign Configured', 'No task automation is configured for ' + mfrSafeStatusLabel(newStatus) + '.');
    return { created:0, skipped:0, errors:0, source:pack.source, reason:'no_definition' };
  }

  let created = 0, skipped = 0, errors = 0;
  const actions = [];
  for (const template of pack.templates) {
    const result = await mfrCreateCampaignTask(job, template);
    if (result.created) created++;
    else if (result.skipped) skipped++;
    else errors++;
    actions.push({ type:'task', title:template.title || 'Task', result: result.created ? 'created' : (result.skipped ? 'skipped' : 'error'), error: result.error || null });
  }

  await mfrAddSystemNote(job.customer_id, job.id, errors ? 'automation-error' : 'automation', errors ? 'Automation Had Errors' : 'Automation Ran', 'Stage ' + mfrSafeStatusLabel(newStatus) + ': ' + created + ' task(s) created, ' + skipped + ' skipped, ' + errors + ' error(s).');

  try {
    const ruleId = pack.templates.find(t => t.campaign_rule_id)?.campaign_rule_id || pack.rules?.[0]?.id || null;
    await _sb.from('campaign_run_log').insert({
      campaign_rule_id: ruleId,
      job_id: job.id,
      customer_id: job.customer_id || null,
      old_status: oldStatus || null,
      new_status: newStatus,
      actions: actions,
      created_by: _user?.id || null
    });
  } catch (e) {
    console.warn('Campaign run log skipped:', e.message || e);
  }

  return { created, skipped, errors, source:pack.source, templates:pack.templates.length };
}

async function handleStatusChange(jobId, oldStatus, newStatus){
  if (oldStatus && oldStatus === newStatus) {
    toast('Already in ' + mfrSafeStatusLabel(newStatus) + '. Automation was not re-run.', 'info');
    return { created:0, skipped:0, errors:0, reason:'same_status' };
  }

  const result = await mfrRunCampaignAutomations(jobId, oldStatus, newStatus);
  if (result.created > 0 && result.errors === 0) {
    toast('Automation ran: ' + result.created + ' task' + (result.created === 1 ? '' : 's') + ' created' + (result.skipped ? ', ' + result.skipped + ' existing skipped' : '') + '.', 'success');
  } else if (result.created > 0 && result.errors > 0) {
    toast('Status moved. Automation created ' + result.created + ' task(s), but ' + result.errors + ' item(s) failed.', 'error');
  } else if (result.skipped > 0 && result.errors === 0) {
    toast('Automation found existing open task(s), so no duplicates were created.', 'info');
  } else if (result.reason === 'no_definition') {
    toast('No campaign is configured for ' + mfrSafeStatusLabel(newStatus) + '.', 'info');
  } else if (result.errors > 0) {
    toast('Status moved, but automation task creation failed. Check project notes for details.', 'error');
  } else {
    toast('Campaign checked. No new task was needed.', 'info');
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// PHOTO CENTER / COMPANYCAM-LITE PHASE 1
// Adds a usable job photo center, batch upload, tagging, visibility,
// job/customer filters, and project/customer tracker friendly metadata.
// ══════════════════════════════════════════════════════════════
(function mfrPhotoCenterLite(){
  const PHOTO_TYPES = [
    ['inspection','Inspection'],
    ['damage','Damage'],
    ['before','Before'],
    ['after','After'],
    ['supplement','Supplement'],
    ['production','Production'],
    ['final','Final'],
    ['warranty','Warranty'],
    ['other','Other']
  ];
  const PHOTO_STAGES = [
    ['lead','Lead'],
    ['inspection','Inspection'],
    ['estimate','Estimate'],
    ['contract','Contract'],
    ['claim','Claim'],
    ['production','Production'],
    ['closeout','Closeout']
  ];

  let _photoCenter = { photos:[], jobs:[], jobMap:new Map(), filters:{ q:'', type:'', stage:'', visible:'' } };
  let _mfrSelectedPhotos = [];

  function h(v){ return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function label(v){ return String(v || '').replace(/_/g,' ').replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()); }
  function dateLabel(v){ if(!v) return ''; try { return new Date(v).toLocaleDateString(); } catch(e){ return ''; } }
  function jobCustomerName(job){
    const c = job?.customers || {};
    return (c.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown Customer').trim();
  }
  function jobAddress(job){
    const c = job?.customers || {};
    return [c.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || job?.address || 'No address';
  }
  function typeOptions(selected){ return PHOTO_TYPES.map(([v,l]) => '<option value="'+v+'" '+(selected===v?'selected':'')+'>'+l+'</option>').join(''); }
  function stageOptions(selected){ return PHOTO_STAGES.map(([v,l]) => '<option value="'+v+'" '+(selected===v?'selected':'')+'>'+l+'</option>').join(''); }

  async function safeData(q, fallback){
    try { const r = await q; if (r.error) throw r.error; return r.data ?? fallback; }
    catch(e){ console.warn('Photo Center query skipped:', e.message || e); return fallback; }
  }

  async function mfrLoadPhotoCenterData(){
    const photos = await safeData(_sb.from('job_photos').select('*').order('created_at', { ascending:false }).limit(600), []);
    const jobIds = [...new Set((photos || []).map(p => p.job_id).filter(Boolean))];
    let jobs = [];
    if (jobIds.length) {
      jobs = await safeData(_sb.from('jobs').select('*, customers(*)').in('id', jobIds), []);
    }
    const allJobs = await safeData(_sb.from('jobs').select('id,status,customer_id,contract_value,created_at,customers(*)').order('updated_at', { ascending:false }).limit(250), []);
    const merged = new Map();
    (allJobs || []).forEach(j => merged.set(j.id, j));
    (jobs || []).forEach(j => merged.set(j.id, j));
    _photoCenter.photos = photos || [];
    _photoCenter.jobs = [...merged.values()];
    _photoCenter.jobMap = new Map(_photoCenter.jobs.map(j => [j.id, j]));
  }

  function mfrPhotoStats(photos){
    const total = photos.length;
    const visible = photos.filter(p => p.is_customer_visible !== false).length;
    const damage = photos.filter(p => p.photo_type === 'damage').length;
    const final = photos.filter(p => ['final','after','warranty'].includes(p.photo_type)).length;
    return { total, visible, damage, final };
  }

  function mfrFilteredPhotos(){
    const f = _photoCenter.filters;
    return (_photoCenter.photos || []).filter(p => {
      const job = _photoCenter.jobMap.get(p.job_id) || {};
      const hay = [p.caption, p.photo_type, p.photo_stage, p.album_name, (p.tags || []).join(' '), jobCustomerName(job), jobAddress(job), job.status].join(' ').toLowerCase();
      if (f.q && !hay.includes(f.q.toLowerCase())) return false;
      if (f.quick === 'closeout' && !(['final','after','warranty'].includes(p.photo_type) || (p.photo_stage || '') === 'closeout')) return false;
      if (f.type && p.photo_type !== f.type) return false;
      if (f.stage && (p.photo_stage || '') !== f.stage) return false;
      if (f.visible === 'visible' && p.is_customer_visible === false) return false;
      if (f.visible === 'private' && p.is_customer_visible !== false) return false;
      return true;
    });
  }

  function mfrPhotoCard(p){
    const job = _photoCenter.jobMap.get(p.job_id) || {};
    const visible = p.is_customer_visible === false ? 'Internal Only' : 'Customer Visible';
    const tags = Array.isArray(p.tags) ? p.tags : [];
    return '<div class="mfr-photo-card">'
      + '<div class="mfr-photo-thumb" onclick="window.open(\'' + h(p.photo_url) + '\',\'_blank\')"><img src="' + h(p.photo_url) + '" loading="lazy"></div>'
      + '<div class="mfr-photo-body">'
      + '<div class="mfr-photo-title-line"><strong>' + h(label(p.photo_type || 'photo')) + '</strong><span class="mfr-photo-badge ' + (p.is_customer_visible === false ? 'private' : 'visible') + '">' + h(visible) + '</span></div>'
      + '<div style="font-size:12px;color:var(--text2);margin-top:4px">' + h(jobCustomerName(job)) + '</div>'
      + '<div style="font-size:11px;color:var(--text3);margin-top:2px">' + h(jobAddress(job)) + '</div>'
      + (p.caption ? '<div class="mfr-photo-caption">' + h(p.caption) + '</div>' : '')
      + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px">'
      + (p.photo_stage ? '<span class="mfr-chip">' + h(label(p.photo_stage)) + '</span>' : '')
      + tags.slice(0,4).map(t => '<span class="mfr-chip">#' + h(t) + '</span>').join('')
      + '</div>'
      + '<div style="display:flex;justify-content:space-between;gap:8px;margin-top:10px;align-items:center">'
      + '<span style="font-size:11px;color:var(--text3)">' + h(dateLabel(p.created_at)) + '</span>'
      + '<button class="btn btn-sm btn-outline" onclick="mfrEditPhotoMeta(\'' + h(p.id) + '\')">Edit</button>'
      + '</div>'
      + '</div></div>';
  }

  function renderPhotoCenter(c){
    const photos = mfrFilteredPhotos();
    const stats = mfrPhotoStats(_photoCenter.photos || []);
    const hasFilters = !!(_photoCenter.filters.q || _photoCenter.filters.type || _photoCenter.filters.stage || _photoCenter.filters.visible);
    c.innerHTML = '<div class="page-wrap mfr-photo-page">'
      + '<div class="mfr-photo-hero">'
      + '<div><div class="mfr-photo-hero-title">Photo Center</div><div class="mfr-photo-hero-sub">CompanyCam-lite photo management for job photos, damage documentation, captions, tags, albums, and customer-visible galleries.</div></div>'
      + '<button class="btn btn-primary" onclick="uploadPhotos()">+ Upload Photos</button>'
      + '</div>'
      + '<div class="mfr-photo-stats">'
      + '<div class="mfr-photo-stat mfr-click-card" onclick="mfrPhotoQuickFilter(\'all\')" title="Show all photos"><div>Total Photos</div><strong>' + stats.total + '</strong><span class="mfr-card-hint">Show all</span></div>'
      + '<div class="mfr-photo-stat mfr-click-card" onclick="mfrPhotoQuickFilter(\'visible\')" title="Show customer-visible photos"><div>Customer Visible</div><strong>' + stats.visible + '</strong><span class="mfr-card-hint">Filter visible</span></div>'
      + '<div class="mfr-photo-stat mfr-click-card" onclick="mfrPhotoQuickFilter(\'damage\')" title="Show damage photos"><div>Damage Photos</div><strong>' + stats.damage + '</strong><span class="mfr-card-hint">Filter damage</span></div>'
      + '<div class="mfr-photo-stat mfr-click-card" onclick="mfrPhotoQuickFilter(\'closeout\')" title="Show closeout/final photos"><div>Closeout Photos</div><strong>' + stats.final + '</strong><span class="mfr-card-hint">Filter closeout</span></div>'
      + '</div>'
      + '<div class="mfr-photo-toolbar">'
      + '<div class="mfr-photo-filter-row">'
      + '<input id="pf-q" class="inp" placeholder="Search customer, address, caption, tag..." value="' + h(_photoCenter.filters.q) + '" oninput="mfrSetPhotoFilter(\'q\', this.value)">'
      + '<select class="inp" onchange="mfrSetPhotoFilter(\'type\', this.value)"><option value="">All Types</option>' + typeOptions(_photoCenter.filters.type) + '</select>'
      + '<select class="inp" onchange="mfrSetPhotoFilter(\'stage\', this.value)"><option value="">All Stages</option>' + stageOptions(_photoCenter.filters.stage) + '</select>'
      + '<select class="inp" onchange="mfrSetPhotoFilter(\'visible\', this.value)"><option value="">All Visibility</option><option value="visible" '+(_photoCenter.filters.visible==='visible'?'selected':'')+'>Customer Visible</option><option value="private" '+(_photoCenter.filters.visible==='private'?'selected':'')+'>Internal Only</option></select>'
      + '<button class="btn btn-outline" onclick="mfrClearPhotoFilters()">Clear</button>'
      + '</div>'
      + '<div class="mfr-photo-meta-row"><span>' + photos.length + ' photo(s) shown</span><span>' + (hasFilters ? 'Filters active' : 'Click a stat card to filter photos') + '</span></div>'
      + '</div>'
      + (!photos.length ? '<div class="card"><div class="card-body"><div class="empty-state"><div class="icon">📸</div><h3>' + (hasFilters ? 'No Photos Match' : 'No Photos Yet') + '</h3><p>' + (hasFilters ? 'Clear your filters or upload more job photos.' : 'Upload photos from inspections, production, damage documentation, warranty closeout, and customer-facing galleries.') + '</p><button class="btn btn-primary" onclick="uploadPhotos()">Upload Photos</button></div></div></div>' : '<div class="mfr-photo-center-grid">' + photos.map(mfrPhotoCard).join('') + '</div>')
      + '</div>';
  }

  window.pagePhotos = async function(c){
    c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Photo Center</div><div class="page-sub">Loading job photo center...</div></div></div><div class="card"><div class="card-body">Loading job photos…</div></div></div>';
    await mfrLoadPhotoCenterData();
    renderPhotoCenter(c);
  };

  window.mfrSetPhotoFilter = function(key, value){
    _photoCenter.filters.quick = '';
    _photoCenter.filters[key] = value || '';
    const c = document.getElementById('content');
    if (c) renderPhotoCenter(c);
  };

  window.mfrPhotoQuickFilter = function(kind){
    if (kind === 'visible') _photoCenter.filters = { q:'', type:'', stage:'', visible:'visible', quick:'' };
    else if (kind === 'damage') _photoCenter.filters = { q:'', type:'damage', stage:'', visible:'', quick:'' };
    else if (kind === 'closeout') _photoCenter.filters = { q:'', type:'', stage:'', visible:'', quick:'closeout' };
    else _photoCenter.filters = { q:'', type:'', stage:'', visible:'', quick:'' };
    const c = document.getElementById('content');
    if (c) renderPhotoCenter(c);
  };

  window.mfrClearPhotoFilters = function(){
    _photoCenter.filters = { q:'', type:'', stage:'', visible:'', quick:'' };
    const c = document.getElementById('content');
    if (c) renderPhotoCenter(c);
  };

  async function jobsForSelect(){
    let jobs = _photoCenter.jobs;
    if (!jobs || !jobs.length) {
      jobs = await safeData(_sb.from('jobs').select('id,status,customer_id,contract_value,created_at,customers(*)').order('updated_at', { ascending:false }).limit(250), []);
    }
    return jobs || [];
  }

  window.uploadPhotos = async function(jobId){
    _mfrSelectedPhotos = [];
    const jobs = await jobsForSelect();
    const modal = document.createElement('div');
    modal.className = 'modal-overlay photo-modal';
    const jobOptions = jobs.map(j => '<option value="' + h(j.id) + '" ' + (jobId === j.id ? 'selected' : '') + '>' + h(jobCustomerName(j) + ' — ' + jobAddress(j) + ' — ' + label(j.status)) + '</option>').join('');
    modal.innerHTML = '<div class="modal-sheet" style="max-width:760px">'
      + '<div class="modal-head"><div><div class="modal-title">Upload Job Photos</div><div class="modal-sub">Batch upload photos, tag them, and choose what customers can see.</div></div><button class="icon-btn" onclick="this.closest(\'.modal-overlay\').remove()">×</button></div>'
      + '<div class="modal-body">'
      + '<div class="grid2">'
      + '<label>Project / Job<select class="inp" id="pc-job" ' + (jobId ? 'disabled' : '') + '><option value="">Select a project...</option>' + jobOptions + '</select></label>'
      + '<label>Photo Type<select class="inp" id="pc-type">' + typeOptions('inspection') + '</select></label>'
      + '<label>Stage / Album<select class="inp" id="pc-stage">' + stageOptions('inspection') + '</select></label>'
      + '<label>Tags<input class="inp" id="pc-tags" placeholder="damage, north slope, gutters"></label>'
      + '</div>'
      + '<label style="display:block;margin-top:12px">Caption / Notes<textarea class="inp" id="pc-caption" rows="3" placeholder="Optional caption applied to this batch"></textarea></label>'
      + '<label class="mfr-toggle-line"><input type="checkbox" id="pc-visible" checked> Show these photos on the customer tracker</label>'
      + '<div class="mfr-dropzone" onclick="document.getElementById(\'pc-files\').click()">'
      + '<div style="font-size:30px">📸</div><strong>Click to select photos</strong><span>Multiple images supported. They upload to Supabase Storage.</span></div>'
      + '<input type="file" id="pc-files" multiple accept="image/*" style="display:none" onchange="mfrHandlePhotoFiles(this.files)">'
      + '<div id="pc-preview" class="mfr-photo-preview"></div>'
      + '</div>'
      + '<div class="modal-actions"><button class="btn" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button><button id="pc-upload-btn" class="btn btn-primary" onclick="mfrUploadSelectedPhotos()" disabled>Upload Photos</button></div>'
      + '</div>';
    document.body.appendChild(modal);
  };

  window.mfrHandlePhotoFiles = function(files){
    _mfrSelectedPhotos = Array.from(files || []);
    const preview = document.getElementById('pc-preview');
    const btn = document.getElementById('pc-upload-btn');
    if (btn) btn.disabled = !_mfrSelectedPhotos.length;
    if (!preview) return;
    preview.innerHTML = _mfrSelectedPhotos.map((file, i) => '<div class="mfr-photo-preview-item"><img src="' + h(URL.createObjectURL(file)) + '"><button onclick="mfrRemoveSelectedPhoto(' + i + ')">×</button><span>' + h(file.name) + '</span></div>').join('');
  };

  window.mfrRemoveSelectedPhoto = function(i){
    _mfrSelectedPhotos.splice(i, 1);
    const input = document.getElementById('pc-files');
    if (input) input.value = '';
    const preview = document.getElementById('pc-preview');
    const btn = document.getElementById('pc-upload-btn');
    if (btn) btn.disabled = !_mfrSelectedPhotos.length;
    if (preview) preview.innerHTML = _mfrSelectedPhotos.map((file, idx) => '<div class="mfr-photo-preview-item"><img src="' + h(URL.createObjectURL(file)) + '"><button onclick="mfrRemoveSelectedPhoto(' + idx + ')">×</button><span>' + h(file.name) + '</span></div>').join('');
  };

  async function mfrInsertPhoto(payload){
    let res = await _sb.from('job_photos').insert(payload).select('id').single();
    if (res.error) {
      const base = { job_id: payload.job_id, photo_url: payload.photo_url, photo_type: payload.photo_type || 'inspection', caption: payload.caption || null };
      res = await _sb.from('job_photos').insert(base).select('id').single();
    }
    if (res.error) throw res.error;
    return res.data;
  }

  window.mfrUploadSelectedPhotos = async function(){
    const jobId = document.getElementById('pc-job')?.value;
    if (!jobId) { toast('Select a project first.', 'error'); return; }
    if (!_mfrSelectedPhotos.length) { toast('Select photos first.', 'error'); return; }
    const btn = document.getElementById('pc-upload-btn');
    const original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Uploading...'; }
    const type = document.getElementById('pc-type')?.value || 'inspection';
    const stage = document.getElementById('pc-stage')?.value || null;
    const caption = document.getElementById('pc-caption')?.value || null;
    const visible = document.getElementById('pc-visible')?.checked !== false;
    const tags = (document.getElementById('pc-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean);
    let uploaded = 0;
    try {
      for (const file of _mfrSelectedPhotos) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
        const path = jobId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2,8) + '-' + safeName;
        const up = await _sb.storage.from('job-photos').upload(path, file, { cacheControl:'3600', upsert:false });
        if (up.error) throw up.error;
        const pub = _sb.storage.from('job-photos').getPublicUrl(path);
        const publicUrl = pub.data?.publicUrl;
        await mfrInsertPhoto({
          job_id: jobId,
          photo_url: publicUrl,
          photo_type: type,
          caption: caption,
          photo_stage: stage,
          album_name: stage ? label(stage) : null,
          tags: tags,
          is_customer_visible: visible,
          source: 'mfr_photo_center',
          uploaded_by: _user?.id || null,
          taken_at: new Date().toISOString()
        });
        uploaded += 1;
      }
      try {
        const { data: job } = await _sb.from('jobs').select('customer_id').eq('id', jobId).single();
        if (job?.customer_id) await _sb.from('customer_notes').insert({ customer_id:job.customer_id, job_id:jobId, created_by:_user?.id || null, note_type:'photo', subject:'Photos Uploaded', note_text:uploaded + ' photo(s) uploaded to the project photo center.' });
      } catch(ignore) {}
      toast(uploaded + ' photo(s) uploaded.', 'success');
      document.querySelector('.photo-modal')?.remove();
      _mfrSelectedPhotos = [];
      try { if (typeof refreshJobModal === 'function') refreshJobModal(); } catch(ignore) {}
      if ((window._route || '').toLowerCase?.() === 'photos') go('photos');
    } catch(e) {
      console.error('Photo upload failed:', e);
      toast('Photo upload failed: ' + (e.message || e), 'error');
      if (btn) { btn.disabled = false; btn.textContent = original || 'Upload Photos'; }
    }
  };

  window.mfrEditPhotoMeta = async function(photoId){
    const photo = (_photoCenter.photos || []).find(p => p.id === photoId) || (await safeData(_sb.from('job_photos').select('*').eq('id', photoId).single(), null));
    if (!photo) { toast('Photo not found.', 'error'); return; }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay photo-edit-modal';
    const tags = Array.isArray(photo.tags) ? photo.tags.join(', ') : '';
    modal.innerHTML = '<div class="modal-sheet" style="max-width:560px">'
      + '<div class="modal-head"><div class="modal-title">Edit Photo Details</div><button class="icon-btn" onclick="this.closest(\'.modal-overlay\').remove()">×</button></div>'
      + '<div class="modal-body"><img src="' + h(photo.photo_url) + '" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-bottom:12px">'
      + '<div class="grid2"><label>Type<select class="inp" id="pe-type">' + typeOptions(photo.photo_type || 'inspection') + '</select></label><label>Stage<select class="inp" id="pe-stage">' + stageOptions(photo.photo_stage || '') + '</select></label></div>'
      + '<label style="display:block;margin-top:12px">Tags<input class="inp" id="pe-tags" value="' + h(tags) + '"></label>'
      + '<label style="display:block;margin-top:12px">Caption<textarea class="inp" id="pe-caption" rows="3">' + h(photo.caption || '') + '</textarea></label>'
      + '<label class="mfr-toggle-line"><input type="checkbox" id="pe-visible" ' + (photo.is_customer_visible === false ? '' : 'checked') + '> Show on customer tracker</label>'
      + '</div><div class="modal-actions"><button class="btn" onclick="this.closest(\'.modal-overlay\').remove()">Cancel</button><button class="btn btn-primary" onclick="mfrSavePhotoMeta(\'' + h(photo.id) + '\')">Save Photo</button></div></div>';
    document.body.appendChild(modal);
  };

  window.mfrSavePhotoMeta = async function(photoId){
    const payload = {
      photo_type: document.getElementById('pe-type')?.value || 'inspection',
      photo_stage: document.getElementById('pe-stage')?.value || null,
      album_name: label(document.getElementById('pe-stage')?.value || ''),
      caption: document.getElementById('pe-caption')?.value || null,
      tags: (document.getElementById('pe-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
      is_customer_visible: document.getElementById('pe-visible')?.checked !== false,
      updated_at: new Date().toISOString()
    };
    let res = await _sb.from('job_photos').update(payload).eq('id', photoId);
    if (res.error) {
      const fallback = { photo_type:payload.photo_type, caption:payload.caption };
      res = await _sb.from('job_photos').update(fallback).eq('id', photoId);
    }
    if (res.error) { toast('Could not save photo: ' + res.error.message, 'error'); return; }
    toast('Photo updated.', 'success');
    document.querySelector('.photo-edit-modal')?.remove();
    if ((window._route || '').toLowerCase?.() === 'photos') go('photos');
    try { if (typeof refreshJobModal === 'function') refreshJobModal(); } catch(ignore) {}
  };
})();



// ══════════════════════════════════════════════════════════════
// MFR NAVIGATION COMMAND CENTER
// Adds a dashboard page directory + admin configurable navigation.
// This is intentionally appended as an override layer so older Claude
// navigation code does not keep fighting the latest workflow.
// ══════════════════════════════════════════════════════════════

(function(){
  const css = document.createElement('style');
  css.textContent = `
    .mfr-home-hero{background:linear-gradient(135deg,#071A44,#0B2C66);color:#fff;border-radius:20px;padding:24px;margin-bottom:18px;box-shadow:0 18px 45px rgba(7,26,68,.22);display:flex;justify-content:space-between;gap:18px;align-items:flex-start;overflow:hidden;position:relative}
    .mfr-home-hero:after{content:"";position:absolute;right:-80px;top:-90px;width:280px;height:280px;background:radial-gradient(circle,rgba(59,130,246,.42),transparent 70%);pointer-events:none}
    .mfr-home-kicker{font-size:11px;text-transform:uppercase;letter-spacing:.16em;color:#A9C6FF;font-weight:900;margin-bottom:6px}
    .mfr-home-title{font-size:30px;line-height:1.05;font-weight:950;margin:0 0 8px}
    .mfr-home-sub{color:#D7E5FF;font-size:14px;max-width:720px;line-height:1.55;margin:0}
    .mfr-home-actions{display:flex;gap:9px;flex-wrap:wrap;justify-content:flex-end;z-index:1}
    .mfr-section-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:14px}
    .mfr-section-card{background:#fff;border:1px solid var(--border);border-radius:18px;box-shadow:0 10px 28px rgba(15,23,42,.06);padding:16px;min-height:150px}
    .mfr-section-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
    .mfr-section-title{font-size:15px;font-weight:950;color:var(--text);display:flex;align-items:center;gap:8px}
    .mfr-section-count{font-size:11px;color:var(--text3);font-weight:900;text-transform:uppercase;letter-spacing:.08em}
    .mfr-page-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
    .mfr-page-tile{border:1px solid #E2E8F0;background:linear-gradient(180deg,#FFFFFF,#F8FAFC);border-radius:16px;padding:13px;display:flex;align-items:flex-start;gap:12px;cursor:pointer;transition:.16s ease;text-align:left;color:var(--text);min-height:74px;width:100%;overflow:hidden}
    .mfr-page-tile:hover{transform:translateY(-2px);border-color:#3B82F6;box-shadow:0 10px 25px rgba(59,130,246,.13)}
    .mfr-page-ic{width:40px;height:40px;border-radius:14px;background:#EEF4FF;display:flex;align-items:center;justify-content:center;font-size:19px;flex:0 0 auto;margin-top:1px}
    .mfr-page-copy{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1;line-height:1.2}
    .mfr-page-name{display:block;font-size:14px;font-weight:950;line-height:1.2;color:var(--text);word-break:normal}
    .mfr-page-meta{display:block;font-size:12px;color:var(--text3);line-height:1.35;margin:0;max-width:100%}
    .mfr-quick-find{display:flex;gap:10px;align-items:center;flex-wrap:wrap;background:#fff;border:1px solid var(--border);border-radius:18px;padding:12px;margin:12px 0 16px;box-shadow:0 8px 20px rgba(15,23,42,.04)}
    .mfr-quick-find input{flex:1;min-width:260px;border:1px solid #E2E8F0;border-radius:12px;padding:11px 13px;font-size:14px;outline:none}
    .mfr-quick-find input:focus{border-color:#3B82F6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
    .mfr-all-pages{background:#fff;border:1px solid var(--border);border-radius:20px;box-shadow:0 12px 30px rgba(15,23,42,.05);padding:16px;margin-top:16px}
    .mfr-all-pages-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;flex-wrap:wrap}
    .mfr-all-pages-title{font-size:18px;font-weight:950;margin:0}
    .mfr-page-results{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:12px}
    .mfr-all-pages .mfr-page-tile{min-height:82px;padding:15px}
    .mfr-section-card .mfr-page-tile{min-height:68px}
    .mfr-section-card .mfr-page-meta{font-size:11px;color:#64748B}
    .mfr-section-card .mfr-page-grid{grid-template-columns:1fr;gap:9px}
    .mfr-nav-builder-card{background:#fff;border:1px solid var(--border);border-radius:18px;padding:14px;margin-bottom:10px;box-shadow:0 8px 20px rgba(15,23,42,.04)}
    .mfr-nav-builder-row{display:grid;grid-template-columns:54px minmax(160px,1.4fr) 160px 150px 90px 100px 95px;gap:10px;align-items:center}
    .mfr-nav-builder-row input,.mfr-nav-builder-row select{width:100%;border:1px solid #E2E8F0;border-radius:10px;padding:9px 10px;font-size:13px;background:#fff}
    .mfr-nav-builder-meta{font-size:11px;color:var(--text3);margin-top:6px}
    .mfr-nav-pill{display:inline-flex;align-items:center;gap:6px;border:1px solid #DBEAFE;background:#EFF6FF;color:#1D4ED8;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.04em}
    .mfr-nav-badge{font-size:10px;background:#FEF3C7;color:#92400E;border-radius:999px;padding:4px 7px;font-weight:900;margin-left:8px}
    .tn-tab{font-size:15px!important;padding:13px 18px!important;border-radius:10px!important}
    .tn-tab.active{box-shadow:inset 0 -2px 0 rgba(255,255,255,.28),0 8px 22px rgba(59,130,246,.20)!important}
    @media(max-width:1250px){.mfr-section-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.mfr-page-results{grid-template-columns:repeat(3,minmax(0,1fr))}.mfr-nav-builder-row{grid-template-columns:48px 1fr 140px 130px 80px}.mfr-nav-builder-row .mfr-nav-hide-sm{display:none}}
    @media(max-width:760px){.mfr-home-hero{flex-direction:column;padding:18px}.mfr-home-title{font-size:24px}.mfr-section-grid,.mfr-page-results{grid-template-columns:1fr}.mfr-page-grid{grid-template-columns:1fr}.mfr-page-tile{min-height:72px}.mfr-page-name{font-size:14px}.mfr-page-meta{font-size:12px}.mfr-nav-builder-row{grid-template-columns:44px 1fr}.mfr-nav-builder-row input,.mfr-nav-builder-row select{font-size:12px}.mfr-nav-builder-row .mfr-nav-mobile-full{grid-column:1/-1}}
  `;
  document.head.appendChild(css);
})();

const MFR_NAV_SECTIONS = {
  ops:   { label:'Operations', short:'Ops', icon:'📊', defaultPage:'dashboard' },
  est:   { label:'Estimate Builder', short:'Estimates', icon:'📋', defaultPage:'estimates' },
  sales: { label:'Sales Tools', short:'Sales', icon:'💬', defaultPage:'sales-board' },
  admin: { label:'Admin', short:'Admin', icon:'⚙️', defaultPage:'tasks' }
};

const MFR_NAV_DEFAULTS = [
  {id:'dashboard', label:'Dashboard', icon:'📊', top_section:'ops', group_label:'Overview', display_order:10, description:'Executive snapshot, recent activity, schedule, and page directory', visible:true},
  {id:'pipeline', label:'Pipeline', icon:'📈', top_section:'ops', group_label:'Overview', display_order:20, description:'Sales and project pipeline with drag/drop stages', visible:true},
  {id:'customers', label:'Customers', icon:'👥', top_section:'ops', group_label:'Overview', display_order:30, description:'Customer lookup and contact control center', visible:true},
  {id:'customer-tracker', label:'Customer Tracker', icon:'📍', top_section:'ops', group_label:'Overview', display_order:35, description:'Create and copy customer-facing project tracking links', visible:true},
  {id:'appointments', label:'Appointments', icon:'📅', top_section:'ops', group_label:'Scheduling', display_order:40, description:'Schedule, assign, and manage appointments', visible:true},
  {id:'photos', label:'Photo Center', icon:'📸', top_section:'ops', group_label:'Field', display_order:50, description:'CompanyCam-lite photo center, tags, captions, and visibility', visible:true},
  {id:'inspection', label:'Roof Inspector', icon:'🔍', top_section:'ops', group_label:'Field', display_order:60, description:'Inspection workflow and AI report tools', visible:true},
  {id:'measuring', label:'Roof Measuring', icon:'📐', top_section:'ops', group_label:'Field', display_order:70, description:'Measurement tools and future GAF/First Mate integration', visible:true},
  {id:'claims', label:'Claim Tracker', icon:'🏠', top_section:'ops', group_label:'Claims & Supplements', display_order:80, description:'Insurance claims and claim stage tracking', visible:true},
  {id:'supplements', label:'Supplements', icon:'📄', top_section:'ops', group_label:'Claims & Supplements', display_order:90, description:'Supplement letters and claim support tools', visible:true},
  {id:'notifications', label:'Notifications', icon:'🔔', top_section:'ops', group_label:'Scheduling', display_order:100, description:'System and customer notifications', visible:true},

  {id:'estimates', label:'Estimate Builder', icon:'📋', top_section:'est', group_label:'Build', display_order:10, description:'Build estimates and create quote links', visible:true},
  {id:'estimates-list', label:'All Estimates', icon:'📂', top_section:'est', group_label:'Saved', display_order:20, description:'Saved estimates and quote history', visible:true},

  {id:'sales-board', label:'Sales Board', icon:'🧲', top_section:'sales', group_label:'Pipeline', display_order:10, description:'Sales board and deal movement', visible:true},
  {id:'objections', label:'Objection Handler', icon:'💬', top_section:'sales', group_label:'AI Tools', display_order:20, description:'Handle common homeowner objections', visible:true},
  {id:'closing', label:'Closing Coach', icon:'🎯', top_section:'sales', group_label:'AI Tools', display_order:30, description:'Closing scripts and sales coaching', visible:true},
  {id:'followup', label:'Follow-Up Writer', icon:'✉️', top_section:'sales', group_label:'AI Tools', display_order:40, description:'Generate follow-up messages', visible:true},
  {id:'financing', label:'Financing Calc', icon:'💳', top_section:'sales', group_label:'In the Field', display_order:50, description:'Payment and financing calculator', visible:true},
  {id:'storm', label:'Storm Response', icon:'⛈️', top_section:'sales', group_label:'In the Field', display_order:60, description:'Storm response and canvassing brief', visible:true},
  {id:'hail-intelligence', label:'Hail Intelligence', icon:'🧊', top_section:'sales', group_label:'In the Field', display_order:65, description:'Live hail map, NOAA/SPC hail reports, storm alerts, and swath intelligence', visible:true},
  {id:'reviews', label:'Reviews', icon:'⭐', top_section:'sales', group_label:'Reputation', display_order:70, description:'Review requests and reputation tools', visible:true},

  {id:'announcements', label:'Message Board', icon:'📢', top_section:'admin', group_label:'Team', display_order:10, description:'Internal team announcements', visible:true},
  {id:'team', label:'Team & Users', icon:'👥', top_section:'admin', group_label:'Team', display_order:20, description:'Employee profiles and contact info', visible:true},
  {id:'tasks', label:'Tasks', icon:'✅', top_section:'admin', group_label:'Team', display_order:30, description:'Team tasks and campaign-created work', visible:true},
  {id:'campaigns', label:'Campaigns', icon:'⚡', top_section:'admin', group_label:'Automation', display_order:40, description:'Stage automations that create tasks', visible:true},
  {id:'nav-builder', label:'Navigation Builder', icon:'🧭', top_section:'admin', group_label:'Automation', display_order:45, description:'Admin controls for where pages live in the app', visible:true, adminOnly:true},
  {id:'pricing', label:'Pricing Rates', icon:'💲', top_section:'admin', group_label:'Reports & Data', display_order:50, description:'Admin pricing tables and rates', visible:true, adminOnly:true, badge:'ADMIN', badgeCls:'am'},
  {id:'sales-metrics', label:'Sales Metrics', icon:'📊', top_section:'admin', group_label:'Reports & Data', display_order:60, description:'Lead, appointment, sale conversion metrics', visible:true},
  {id:'marketing-roi', label:'Marketing ROI', icon:'💰', top_section:'admin', group_label:'Reports & Data', display_order:70, description:'Marketing spend and cost per lead/sale', visible:true},
  {id:'reports', label:'Reports', icon:'📈', top_section:'admin', group_label:'Reports & Data', display_order:80, description:'Operational reports', visible:true},
  {id:'storage', label:'Storage', icon:'🗄️', top_section:'admin', group_label:'Reports & Data', display_order:90, description:'Storage and file administration', visible:true}
];

let MFR_NAV_ITEMS = null;
let MFR_NAV_DB_READY = false;

function mfrDefaultNavItems(){ return MFR_NAV_DEFAULTS.map(x => Object.assign({}, x)); }
function mfrVisibleNavItems(){
  return (MFR_NAV_ITEMS || mfrDefaultNavItems()).filter(item => item.visible !== false && (!item.adminOnly || isAdmin()));
}
function mfrAllNavItems(){ return (MFR_NAV_ITEMS || mfrDefaultNavItems()).map(x => Object.assign({}, x)); }
function mfrFindNavItem(id){ return (MFR_NAV_ITEMS || mfrDefaultNavItems()).find(x => x.id === id) || mfrDefaultNavItems().find(x => x.id === id); }
function mfrSortNav(a,b){ return (a.top_section||'ops').localeCompare(b.top_section||'ops') || (a.group_label||'').localeCompare(b.group_label||'') || ((a.display_order||999)-(b.display_order||999)) || (a.label||'').localeCompare(b.label||''); }

async function mfrLoadNavConfig(){
  MFR_NAV_DB_READY = false;
  try {
    const { data, error } = await _sb.from('app_nav_items').select('*').order('top_section',{ascending:true}).order('display_order',{ascending:true});
    if (error) throw error;
    if (data && data.length) {
      const byId = Object.fromEntries(mfrDefaultNavItems().map(i => [i.id, i]));
      data.forEach(row => {
        const base = byId[row.id] || { id:row.id };
        byId[row.id] = Object.assign({}, base, {
          label: row.label || base.label || row.id,
          icon: row.icon || base.icon || '◻️',
          top_section: row.top_section || base.top_section || 'ops',
          group_label: row.group_label || base.group_label || 'Other',
          display_order: Number.isFinite(Number(row.display_order)) ? Number(row.display_order) : (base.display_order || 999),
          visible: row.is_visible !== false,
          description: row.description || base.description || '',
          adminOnly: base.adminOnly || false,
          badge: base.badge,
          badgeCls: base.badgeCls
        });
      });
      MFR_NAV_ITEMS = Object.values(byId).sort(mfrSortNav);
      MFR_NAV_DB_READY = true;
      mfrRebuildPageSectionMap();
      return;
    }
  } catch (e) {
    console.warn('Navigation config table unavailable; using defaults/local fallback.', e);
  }
  try {
    const saved = JSON.parse(localStorage.getItem('mfr_nav_items') || 'null');
    if (Array.isArray(saved) && saved.length) {
      const byId = Object.fromEntries(mfrDefaultNavItems().map(i => [i.id, i]));
      saved.forEach(row => { byId[row.id] = Object.assign({}, byId[row.id] || {}, row); });
      MFR_NAV_ITEMS = Object.values(byId).sort(mfrSortNav);
    } else {
      MFR_NAV_ITEMS = mfrDefaultNavItems();
    }
  } catch(_) { MFR_NAV_ITEMS = mfrDefaultNavItems(); }
  mfrRebuildPageSectionMap();
}

function mfrRebuildPageSectionMap(){
  try {
    Object.keys(PAGE_SECTION).forEach(k => delete PAGE_SECTION[k]);
    (MFR_NAV_ITEMS || mfrDefaultNavItems()).forEach(item => { PAGE_SECTION[item.id] = item.top_section || 'ops'; });
  } catch(e) { console.warn('Could not rebuild PAGE_SECTION', e); }
}

function mfrNavForSection(sec){
  const items = mfrVisibleNavItems().filter(i => (i.top_section || 'ops') === sec).sort((a,b) => (a.group_label||'').localeCompare(b.group_label||'') || ((a.display_order||999)-(b.display_order||999)));
  const output = [];
  let lastGroup = null;
  items.forEach(item => {
    const grp = item.group_label || 'Other';
    if (grp !== lastGroup) { output.push({ sec: grp }); lastGroup = grp; }
    output.push({ id:item.id, ic:item.icon || '◻️', label:item.label || item.id, badge:item.badge, badgeCls:item.badgeCls });
  });
  return output;
}

function syncSectionButtons() {
  ['ops','est','sales','admin'].forEach(s => {
    document.getElementById('st-'+s)?.classList.toggle('active', s===_section);
    document.getElementById('bn-'+s)?.classList.toggle('active', s===_section);
  });
}

function firstPageForSection(sec) {
  const items = mfrVisibleNavItems().filter(i => (i.top_section || 'ops') === sec).sort((a,b) => (a.group_label||'').localeCompare(b.group_label||'') || ((a.display_order||999)-(b.display_order||999)));
  return items[0]?.id || MFR_NAV_SECTIONS[sec]?.defaultPage || 'dashboard';
}

function setSection(sec) {
  if (!MFR_NAV_SECTIONS[sec]) return;
  _section = sec;
  syncSectionButtons();
  buildSB();
  const target = _lastPageBySection[sec] || firstPageForSection(sec);
  go(target, { noHistory: false, fromSectionSwitch: true });
}

function buildSB() {
  const nav = mfrNavForSection(_section);
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.innerHTML = nav.map(n => {
    if (n.sec) return '<div class="nav-sec">' + escHtml(n.sec) + '</div>';
    const badge = n.badge ? '<span class="nb ' + escHtml(n.badgeCls || '') + '">' + escHtml(n.badge) + '</span>' : '';
    return '<div class="ni' + (_page===n.id?' active':'') + '" id="ni-' + escHtml(n.id) + '" onclick="go(\'' + escHtml(n.id) + '\');closeSB()">'
      + '<span class="ic">' + escHtml(n.ic || '◻️') + '</span>' + escHtml(n.label || n.id) + badge + '</div>';
  }).join('');
}

function go(id, opts={}) {
  if (!id) return;
  const item = mfrFindNavItem(id);
  const nextSection = item?.top_section || PAGE_SECTION[id] || _section;
  if (!opts.noHistory && _page && _page !== id) {
    const last = _navHistory[_navHistory.length - 1];
    if (last !== _page) _navHistory.push(_page);
    if (_navHistory.length > 12) _navHistory.shift();
  }
  _page = id;
  _section = nextSection;
  _lastPageBySection[_section] = id;
  try { localStorage.setItem('mfr_last_page', id); } catch(_) {}
  syncSectionButtons();
  buildSB();
  const c = document.getElementById('content');
  if (c) {
    c.classList.remove('page-enter');
    try { c.scrollTo({ top: 0, behavior: 'smooth' }); } catch(_) { c.scrollTop = 0; }
  }
  Promise.resolve(renderPage(id)).then(() => enhanceRouteChrome(id));
}

function navLabel(id) {
  const item = mfrFindNavItem(id);
  return item?.label || (id || '').replace(/-/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

function sectionLabel(sec) {
  return MFR_NAV_SECTIONS[sec]?.label || 'Command Center';
}

function enhanceRouteChrome(id) {
  const c = document.getElementById('content');
  if (!c) return;
  c.classList.remove('page-enter');
  void c.offsetWidth;
  c.classList.add('page-enter');
  const wrap = c.querySelector('.page-wrap');
  if (!wrap || wrap.querySelector('.routebar')) return;
  const quickIds = ['dashboard','pipeline','customers','customer-tracker','appointments','tasks','photos'].filter(pid => pid !== id && mfrFindNavItem(pid));
  const quick = quickIds.slice(0, 5).map(pid => '<button class="quick-nav-btn" onclick="go(\''+pid+'\')">'+escHtml(navLabel(pid))+'</button>').join('');
  const backDisabled = _navHistory.length ? '' : ' style="opacity:.45"';
  const bar = document.createElement('div');
  bar.className = 'routebar';
  bar.innerHTML = '<div class="route-left"><button class="route-back" onclick="goBackPage()"'+backDisabled+'>←</button><div class="route-text"><div class="route-kicker">'+escHtml(sectionLabel(_section))+'</div><div class="route-title">'+escHtml(navLabel(id))+'</div></div></div><div class="route-actions">'+quick+'</div>';
  wrap.prepend(bar);
}

const mfrBaseBootApp = bootApp;
bootApp = async function(user){
  _user = user;
  const { data } = await _sb.from('profiles').select('*').eq('id', user.id).single();
  _profile = data;
  await mfrLoadNavConfig();
  const loader = document.getElementById('auth-loading');
  if (loader) loader.style.display = 'none';
  document.getElementById('login-screen').style.display = 'none';
  const app = document.getElementById('app-screen');
  app.style.display = 'flex';
  app.classList.remove('hidden');
  const initials = (_profile?.email||'?').slice(0,2).toUpperCase();
  document.getElementById('tn-avatar').textContent = initials;
  const lastPage = localStorage.getItem('mfr_last_page');
  if (lastPage && mfrFindNavItem(lastPage)?.visible !== false) go(lastPage, { noHistory:true });
  else setSection('ops');
  await refreshTopStats();
};


// --- MFR Recent Activity Feed Fix ---
function mfrActivityTimeLabel(value){
  if(!value) return '';
  const d = new Date(value);
  if(isNaN(d)) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff/60000);
  if(min < 1) return 'just now';
  if(min < 60) return min + 'm ago';
  const hr = Math.floor(min/60);
  if(hr < 24) return hr + 'h ago';
  const day = Math.floor(hr/24);
  if(day < 7) return day + 'd ago';
  return d.toLocaleDateString([], {month:'short', day:'numeric'});
}

function mfrActivityIcon(type){
  const t = String(type || '').toLowerCase();
  if(t.includes('campaign') || t.includes('automation')) return '⚡';
  if(t.includes('task')) return '✅';
  if(t.includes('appointment') || t.includes('appt')) return '📅';
  if(t.includes('call')) return '📞';
  if(t.includes('email')) return '✉️';
  if(t.includes('photo')) return '📸';
  if(t.includes('document')) return '📄';
  if(t.includes('status') || t.includes('job') || t.includes('project')) return '🏠';
  if(t.includes('note')) return '📝';
  return '📌';
}

function mfrStatusNice(status){
  return String(status || '')
    .replace(/_/g,' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function mfrActivitySubtitle(customerName, detail, time){
  return [customerName, detail, time].filter(Boolean).join(' · ');
}

function mfrActivityRow(a){
  const onclick = a.job_id ? "showJobDetail('" + escHtml(a.job_id) + "')" : (a.customer_id ? "showCustomerModal('" + escHtml(a.customer_id) + "')" : '');
  return '<button class="mfr-activity-row" '+(onclick ? 'onclick="'+onclick+'"' : '')+'>'
    + '<span class="mfr-activity-icon">'+escHtml(a.icon || '📌')+'</span>'
    + '<span class="mfr-activity-copy"><span class="mfr-activity-title">'+escHtml(a.title || 'Activity')+'</span>'
    + '<span class="mfr-activity-sub">'+escHtml(a.subtitle || '')+'</span></span>'
    + '</button>';
}

async function mfrLoadRecentActivity(){
  const el = document.getElementById('d-activity');
  if(!el) return;
  el.innerHTML = '<div style="padding:22px;color:var(--text3);font-size:13px">Loading activity...</div>';
  try {
    const [notes, tasks, appts, jobs, runs] = await Promise.all([
      mfrSafeQuery(_sb.from('customer_notes').select('id, customer_id, job_id, note_type, subject, note_text, created_at, updated_at').order('created_at', { ascending:false }).limit(20), [], 'recent notes'),
      mfrSafeQuery(_sb.from('tasks').select('id, customer_id, job_id, task_type, title, status, created_at, updated_at, completed_at').order('updated_at', { ascending:false }).limit(20), [], 'recent tasks'),
      mfrSafeQuery(_sb.from('appointments').select('id, customer_id, job_id, appt_type, status, scheduled_at, created_at, updated_at').order('updated_at', { ascending:false }).limit(20), [], 'recent appointments'),
      mfrSafeQuery(_sb.from('jobs').select('id, customer_id, status, created_at, updated_at, contract_value').order('updated_at', { ascending:false }).limit(20), [], 'recent jobs'),
      mfrSafeQuery(_sb.from('campaign_run_log').select('id, customer_id, job_id, old_status, new_status, actions, created_at').order('created_at', { ascending:false }).limit(20), [], 'recent campaigns')
    ]);

    const customerIds = Array.from(new Set([].concat(notes||[], tasks||[], appts||[], jobs||[], runs||[]).map(x => x && x.customer_id).filter(Boolean)));
    const customers = customerIds.length ? await mfrSafeQuery(_sb.from('customers').select('id, first_name, last_name, email, phone, address, city, state, zip').in('id', customerIds), [], 'recent customers') : [];
    const customerMap = new Map((customers || []).map(c => [c.id, c]));
    const cname = id => id && customerMap.has(id) ? mfrCustomerName(customerMap.get(id)) : '';
    const events = [];

    (runs || []).forEach(r => {
      const count = Array.isArray(r.actions) ? r.actions.length : 0;
      events.push({
        type:'campaign', icon:'⚡', job_id:r.job_id, customer_id:r.customer_id, at:r.created_at,
        title:'Automation ran: ' + mfrStatusNice(r.new_status),
        subtitle:mfrActivitySubtitle(cname(r.customer_id), (r.old_status ? mfrStatusNice(r.old_status) + ' → ' : '') + mfrStatusNice(r.new_status) + (count ? ' · ' + count + ' action(s)' : ''), mfrActivityTimeLabel(r.created_at))
      });
    });

    (tasks || []).forEach(t => {
      const isComplete = String(t.status || '').toLowerCase() === 'complete' || String(t.status || '').toLowerCase() === 'completed' || !!t.completed_at;
      const at = isComplete ? (t.completed_at || t.updated_at || t.created_at) : (t.created_at || t.updated_at);
      events.push({
        type:'task', icon:isComplete ? '✅' : '📋', job_id:t.job_id, customer_id:t.customer_id, at,
        title:(isComplete ? 'Task completed: ' : 'Task created: ') + (t.title || 'Task'),
        subtitle:mfrActivitySubtitle(cname(t.customer_id), [t.task_type, t.status].filter(Boolean).join(' · '), mfrActivityTimeLabel(at))
      });
    });

    (notes || []).forEach(n => {
      const title = n.subject || (mfrStatusNice(n.note_type) + ' note');
      const text = String(n.note_text || '').replace(/\s+/g,' ').trim();
      events.push({
        type:n.note_type || 'note', icon:mfrActivityIcon(n.note_type || 'note'), job_id:n.job_id, customer_id:n.customer_id, at:n.created_at || n.updated_at,
        title,
        subtitle:mfrActivitySubtitle(cname(n.customer_id), text.slice(0,90), mfrActivityTimeLabel(n.created_at || n.updated_at))
      });
    });

    (appts || []).forEach(a => {
      const at = a.created_at || a.updated_at || a.scheduled_at;
      events.push({
        type:'appointment', icon:'📅', job_id:a.job_id, customer_id:a.customer_id, at,
        title:'Appointment ' + mfrStatusNice(a.status || 'scheduled'),
        subtitle:mfrActivitySubtitle(cname(a.customer_id), mfrStatusNice(a.appt_type || 'appointment') + (a.scheduled_at ? ' on ' + new Date(a.scheduled_at).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}) : ''), mfrActivityTimeLabel(at))
      });
    });

    (jobs || []).forEach(j => {
      const at = j.updated_at || j.created_at;
      events.push({
        type:'job', icon:'🏠', job_id:j.id, customer_id:j.customer_id, at,
        title:'Project status: ' + mfrStatusNice(j.status),
        subtitle:mfrActivitySubtitle(cname(j.customer_id), j.contract_value ? '$' + Number(j.contract_value).toLocaleString() : '', mfrActivityTimeLabel(at))
      });
    });

    const sorted = events
      .filter(e => e.at)
      .sort((a,b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0,10);

    if(!sorted.length){
      el.innerHTML = '<div class="empty-state" style="padding:30px"><div class="icon">📋</div><p>No activity yet. Move a job, create a task, schedule an appointment, or add a note.</p></div>';
      return;
    }
    el.innerHTML = '<div class="mfr-activity-feed">' + sorted.map(mfrActivityRow).join('') + '</div>';
  } catch(err) {
    console.error('Recent activity failed', err);
    el.innerHTML = '<div style="padding:22px;color:var(--red);font-size:13px">Could not load recent activity: '+escHtml(err.message || err)+'</div>';
  }
}

function mfrSectionMiniCard(secKey){
  const sec = MFR_NAV_SECTIONS[secKey];
  const pages = mfrVisibleNavItems().filter(i => (i.top_section || 'ops') === secKey).sort((a,b)=>(a.group_label||'').localeCompare(b.group_label||'') || ((a.display_order||999)-(b.display_order||999))).slice(0,6);
  return '<div class="mfr-section-card"><div class="mfr-section-head"><div class="mfr-section-title"><span>'+sec.icon+'</span>'+escHtml(sec.label)+'</div><div class="mfr-section-count">'+pages.length+' shown</div></div>'
    + '<div class="mfr-page-grid">' + pages.map(p => mfrPageTile(p, true)).join('') + '</div></div>';
}

function mfrPageTile(p, compact=false){
  return '<button class="mfr-page-tile" onclick="go(\''+escHtml(p.id)+'\')">'
    + '<span class="mfr-page-ic">'+escHtml(p.icon || '◻️')+'</span>'
    + '<span><span class="mfr-page-name">'+escHtml(p.label || p.id)+'</span>'
    + '<span class="mfr-page-meta">'+escHtml(compact ? (p.group_label || sectionLabel(p.top_section)) : (p.description || p.group_label || 'Open page'))+'</span></span>'
    + '</button>';
}

function mfrRenderPageDirectory(search=''){
  const q = String(search || '').trim().toLowerCase();
  let pages = mfrVisibleNavItems().sort((a,b)=>(a.top_section||'ops').localeCompare(b.top_section||'ops') || (a.group_label||'').localeCompare(b.group_label||'') || ((a.display_order||999)-(b.display_order||999)));
  if (q) pages = pages.filter(p => [p.label,p.description,p.group_label,sectionLabel(p.top_section),p.id].join(' ').toLowerCase().includes(q));
  const el = document.getElementById('mfr-page-results');
  if (!el) return;
  el.innerHTML = pages.length ? pages.map(p => mfrPageTile(p)).join('') : '<div class="empty-state" style="grid-column:1/-1;padding:24px"><div class="icon">🔎</div><h3>No pages found</h3><p>Try another search.</p></div>';
}

pageDashboard = async function(c) {
  c.innerHTML = '<div class="page-wrap">'
    + '<div class="mfr-home-hero"><div><div class="mfr-home-kicker">MFR Command Center</div><h1 class="mfr-home-title">What do you need to work on?</h1><p class="mfr-home-sub">Use this dashboard as the app map. Every major page is available here, and admins can decide where each page lives in the top navigation.</p></div><div class="mfr-home-actions"><button class="btn btn-primary" onclick="go(\'pipeline\')">Open Pipeline</button><button class="btn btn-outline" style="background:#fff" onclick="go(\'customers\')">Customer Lookup</button>' + (isAdmin()?'<button class="btn btn-outline" style="background:#fff" onclick="go(\'nav-builder\')">Manage Navigation</button>':'') + '</div></div>'
    + '<div class="stat-cards">'
    + '<div class="stat-card sc-blue mfr-click-card" onclick="go(\'pipeline\')" title="Open Pipeline"><div class="sc-label">Pipeline</div><div class="sc-val" id="d-pipeline">—</div><div class="mfr-card-hint">Open pipeline</div></div>'
    + '<div class="stat-card sc-green mfr-click-card" onclick="go(\'sales-metrics\')" title="Open Sales Metrics"><div class="sc-label">Closed MTD</div><div class="sc-val" id="d-closed">—</div><div class="mfr-card-hint">Open metrics</div></div>'
    + '<div class="stat-card sc-orange mfr-click-card" onclick="go(\'pipeline\')" title="Open Active Jobs"><div class="sc-label">Active Jobs</div><div class="sc-val" id="d-jobs">—</div><div class="mfr-card-hint">Open jobs</div></div>'
    + '<div class="stat-card sc-purple mfr-click-card" onclick="go(\'appointments\')" title="Open Appointments"><div class="sc-label">Today\'s Appts</div><div class="sc-val" id="d-appts">—</div><div class="mfr-card-hint">Open schedule</div></div>'
    + '</div>'
    + '<div class="mfr-section-grid">' + ['ops','est','sales','admin'].map(mfrSectionMiniCard).join('') + '</div>'
    + '<div class="mfr-all-pages"><div class="mfr-all-pages-head"><div><h2 class="mfr-all-pages-title">All Pages</h2><p style="margin:4px 0 0;color:var(--text2);font-size:13px">Search and jump anywhere without guessing which top tab it lives under.</p></div><span class="mfr-nav-pill">🧭 App Map</span></div>'
    + '<div class="mfr-quick-find"><input id="mfr-page-search" placeholder="Search pages, workflows, photos, tasks, estimates..." oninput="mfrRenderPageDirectory(this.value)"><button class="btn btn-outline" onclick="document.getElementById(\'mfr-page-search\').value=\'\';mfrRenderPageDirectory()">Clear</button></div><div class="mfr-page-results" id="mfr-page-results"></div></div>'
    + '<div style="display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;margin-top:16px">'
    + '<div class="card"><div class="card-hd"><div><div class="card-hd-title">Recent Activity</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Latest 10 updates</div></div></div><div class="card-body" id="d-activity"><div class="empty-state" style="padding:30px"><div class="icon">📋</div><p>No activity yet — create your first job to get started.</p></div></div></div>'
    + '<div class="card"><div class="card-hd"><div class="card-hd-title">Upcoming Schedule</div><button class="btn btn-sm btn-primary" onclick="newApptModal()">+ Schedule</button></div><div class="card-body" id="d-appt-list"><p style="color:var(--text3);font-size:13px">Loading appointments...</p></div></div>'
    + '</div></div>';
  mfrRenderPageDirectory();
  try {
    const { data } = await _sb.from('v_dashboard_stats').select('*').single();
    if (data) {
      document.getElementById('d-pipeline').textContent = '$' + ((data.total_pipeline || 0) / 1000).toFixed(0) + 'K';
      document.getElementById('d-closed').textContent = '$' + ((data.closed_mtd || 0) / 1000).toFixed(0) + 'K';
      document.getElementById('d-jobs').textContent = data.active_jobs || 0;
      document.getElementById('d-appts').textContent = data.todays_appointments || 0;
    }
  } catch(e) { console.warn('Dashboard stats unavailable', e); }
  await mfrLoadRecentActivity();
  await mfrLoadDashboardAppointments();
  try { refreshTopStats(); } catch(_) {}
};

async function pageNavBuilder(c){
  if (!isAdmin()) { c.innerHTML = '<div class="page-wrap"><div class="empty-state"><div class="icon">🔒</div><h3>Admin only</h3><p>Navigation Builder is only available to admins and managers.</p></div></div>'; return; }
  const items = mfrAllNavItems().sort(mfrSortNav);
  c.innerHTML = '<div class="page-wrap">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px"><div><h1 style="font-size:26px;font-weight:950;margin:0 0 4px">Navigation Builder</h1><p style="color:var(--text2);margin:0">Move pages between Operations, Estimate Builder, Sales Tools, and Admin without editing code.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="mfrSaveNavigationConfig()">Save Navigation</button><button class="btn btn-outline" onclick="mfrResetNavigationConfig()">Reset Defaults</button></div></div>'
    + '<div class="card" style="margin-bottom:14px"><div class="card-body" style="line-height:1.55;color:var(--text2);font-size:13px"><b>How this works:</b> change a page section, group, icon, label, or order. Save it, and the sidebar + dashboard app map update for everyone once the SQL table is installed. If the table is not installed yet, this browser will use local fallback settings. <span class="mfr-nav-badge">' + (MFR_NAV_DB_READY ? 'DB CONNECTED' : 'LOCAL FALLBACK') + '</span></div></div>'
    + '<div id="mfr-nav-builder-list">' + items.map(mfrNavBuilderRow).join('') + '</div>'
    + '<div style="height:70px"></div></div>';
}

function mfrNavBuilderRow(item){
  const sectionOpts = Object.keys(MFR_NAV_SECTIONS).map(k => '<option value="'+k+'" '+((item.top_section||'ops')===k?'selected':'')+'>'+escHtml(MFR_NAV_SECTIONS[k].label)+'</option>').join('');
  const groups = ['Overview','Field','Claims & Supplements','Scheduling','Build','Saved','Pipeline','AI Tools','In the Field','Reputation','Team','Automation','Reports & Data','Other'];
  const groupList = groups.map(g => '<option value="'+escHtml(g)+'"></option>').join('');
  return '<div class="mfr-nav-builder-card" data-nav-id="'+escHtml(item.id)+'">'
    + '<div class="mfr-nav-builder-row">'
    + '<input class="nav-icon" value="'+escHtml(item.icon||'◻️')+'" title="Icon">'
    + '<input class="nav-label" value="'+escHtml(item.label||item.id)+'" title="Label">'
    + '<select class="nav-section">'+sectionOpts+'</select>'
    + '<input class="nav-group mfr-nav-mobile-full" list="mfr-nav-groups" value="'+escHtml(item.group_label||'Other')+'" title="Group">'
    + '<input class="nav-order mfr-nav-hide-sm" type="number" value="'+escHtml(item.display_order||999)+'" title="Order">'
    + '<select class="nav-visible mfr-nav-hide-sm"><option value="true" '+(item.visible!==false?'selected':'')+'>Visible</option><option value="false" '+(item.visible===false?'selected':'')+'>Hidden</option></select>'
    + '<button class="btn btn-xs btn-outline mfr-nav-hide-sm" onclick="go(\''+escHtml(item.id)+'\')">Open</button>'
    + '</div><div class="mfr-nav-builder-meta">Page ID: <b>'+escHtml(item.id)+'</b> · '+escHtml(item.description||'')+'</div><datalist id="mfr-nav-groups">'+groupList+'</datalist></div>';
}

async function mfrSaveNavigationConfig(){
  const rows = Array.from(document.querySelectorAll('.mfr-nav-builder-card')).map(card => {
    const id = card.dataset.navId;
    const base = mfrFindNavItem(id) || { id };
    return {
      id,
      label: card.querySelector('.nav-label')?.value?.trim() || base.label || id,
      icon: card.querySelector('.nav-icon')?.value?.trim() || base.icon || '◻️',
      top_section: card.querySelector('.nav-section')?.value || base.top_section || 'ops',
      group_label: card.querySelector('.nav-group')?.value?.trim() || base.group_label || 'Other',
      display_order: parseInt(card.querySelector('.nav-order')?.value || base.display_order || 999, 10),
      is_visible: (card.querySelector('.nav-visible')?.value || 'true') === 'true',
      description: base.description || ''
    };
  });
  try {
    const { error } = await _sb.from('app_nav_items').upsert(rows, { onConflict:'id' });
    if (error) throw error;
    toast('Navigation saved for the team.');
    await mfrLoadNavConfig();
  } catch(e) {
    console.warn('Nav DB save failed; saving local fallback', e);
    const localRows = rows.map(r => ({ id:r.id, label:r.label, icon:r.icon, top_section:r.top_section, group_label:r.group_label, display_order:r.display_order, visible:r.is_visible, description:r.description }));
    localStorage.setItem('mfr_nav_items', JSON.stringify(localRows));
    MFR_NAV_ITEMS = localRows;
    mfrRebuildPageSectionMap();
    toast('Navigation saved locally. Run the SQL to save it for all users.', 'warn');
  }
  buildSB();
  await pageNavBuilder(document.getElementById('content'));
  enhanceRouteChrome('nav-builder');
}

async function mfrResetNavigationConfig(){
  if (!confirm('Reset navigation back to the default layout?')) return;
  try {
    const rows = mfrDefaultNavItems().map(i => ({ id:i.id, label:i.label, icon:i.icon, top_section:i.top_section, group_label:i.group_label, display_order:i.display_order, is_visible:i.visible !== false, description:i.description || '' }));
    const { error } = await _sb.from('app_nav_items').upsert(rows, { onConflict:'id' });
    if (error) throw error;
    toast('Navigation reset for the team.');
  } catch(e) {
    localStorage.removeItem('mfr_nav_items');
    toast('Navigation reset locally. Run SQL to enable team-wide settings.', 'warn');
  }
  MFR_NAV_ITEMS = mfrDefaultNavItems();
  mfrRebuildPageSectionMap();
  buildSB();
  await pageNavBuilder(document.getElementById('content'));
  enhanceRouteChrome('nav-builder');
}

const mfrPreviousRenderPage = renderPage;
renderPage = async function(id){
  if (id === 'nav-builder') return await pageNavBuilder(document.getElementById('content'));
  return await mfrPreviousRenderPage(id);
};


/* ─────────────────────────────────────────────────────────────
   MFR NAV OVERVIEW PATCH
   Keeps Overview/Dashboard easy to find and pins Overview group
   to the top of section sidebars.
───────────────────────────────────────────────────────────── */
(function mfrInstallOverviewNavigationPatch(){
  const css = document.createElement('style');
  css.textContent = `
    .mfr-overview-top{background:rgba(59,130,246,.18)!important;border:1px solid rgba(147,197,253,.34)!important;color:#fff!important;font-weight:950!important}
    .mfr-overview-top.active{background:#2563EB!important;box-shadow:0 8px 22px rgba(37,99,235,.24)!important}
    .sidebar .nav-sec:first-child{margin-top:6px}
    .sidebar .ni#ni-dashboard{font-weight:950;border-left:3px solid transparent}
    .sidebar .ni#ni-dashboard.active{border-left-color:#3B82F6}
  `;
  document.head.appendChild(css);
})();

function mfrEnsureOverviewTopButton(){
  const tabs = document.querySelector('.tn-tabs');
  if (!tabs || document.getElementById('st-overview')) return;
  const btn = document.createElement('button');
  btn.className = 'tn-tab mfr-overview-top';
  btn.id = 'st-overview';
  btn.type = 'button';
  btn.innerHTML = '🏠 Overview';
  btn.onclick = function(){ go('dashboard'); };
  tabs.insertBefore(btn, tabs.firstChild);
}

const MFR_SECTION_GROUP_ORDER = {
  ops: ['Overview','Scheduling','Field','Claims & Supplements','Other'],
  est: ['Build','Saved','Field','Other'],
  sales: ['Pipeline','AI Tools','In the Field','Reputation','Other'],
  admin: ['Team','Automation','Reports & Data','Other']
};

function mfrGroupRankForSection(sec, group){
  const list = MFR_SECTION_GROUP_ORDER[sec] || ['Overview','Team','Automation','Reports & Data','Other'];
  const idx = list.indexOf(group || 'Other');
  return idx >= 0 ? idx : 999;
}

function mfrNavSortForSection(sec, a, b){
  const ga = a.group_label || 'Other';
  const gb = b.group_label || 'Other';
  const ra = mfrGroupRankForSection(sec, ga);
  const rb = mfrGroupRankForSection(sec, gb);
  if (ra !== rb) return ra - rb;
  if (ga !== gb) return ga.localeCompare(gb);
  return (a.display_order || 999) - (b.display_order || 999);
}

mfrNavForSection = function(sec){
  const items = mfrVisibleNavItems()
    .filter(i => (i.top_section || 'ops') === sec)
    .sort((a,b) => mfrNavSortForSection(sec, a, b));
  const output = [];
  let lastGroup = null;
  items.forEach(item => {
    const grp = item.group_label || 'Other';
    if (grp !== lastGroup) { output.push({ sec: grp }); lastGroup = grp; }
    output.push({ id:item.id, ic:item.icon || '◻️', label:item.label || item.id, badge:item.badge, badgeCls:item.badgeCls });
  });
  return output;
};

firstPageForSection = function(sec){
  const items = mfrVisibleNavItems()
    .filter(i => (i.top_section || 'ops') === sec)
    .sort((a,b) => mfrNavSortForSection(sec, a, b));
  return items[0]?.id || MFR_NAV_SECTIONS[sec]?.defaultPage || 'dashboard';
};

const mfrOverviewPrevSyncSectionButtons = syncSectionButtons;
syncSectionButtons = function(){
  mfrEnsureOverviewTopButton();
  try { mfrOverviewPrevSyncSectionButtons(); } catch(_) {}
  const overview = document.getElementById('st-overview');
  if (overview) overview.classList.toggle('active', _page === 'dashboard');
};

const mfrOverviewPrevBuildSB = buildSB;
buildSB = function(){
  mfrEnsureOverviewTopButton();
  mfrOverviewPrevBuildSB();
};

mfrEnsureOverviewTopButton();




// ══════════════════════════════════════════════════════════════
// CURRENT MFR ESTIMATE + INVOICE WORKFLOW OVERRIDE
// Built from the current MFR roof replacement quote dated Apr 30, 2026.
// ══════════════════════════════════════════════════════════════
(function(){
  window.mfrCurrentEstimateId = null;
  window.mfrEstimateData = { customers: [], jobs: [], options: [], addons: [] };
  window.MFR_FINANCE_FACTOR_144 = 0.010819; // PDF financing examples, 144 months

  window.MFR_CURRENT_TERMS = `This agreement may be canceled by the homeowner at any point, for any reason, up until materials have been delivered.

This document allows My Family Roofer to move forward with the roofing process by locking in your price, reserving installation scheduling, reserving materials, and assisting with insurance and supplementing when applicable.

No obligation until material delivery: You are not committed to My Family Roofer for installation work until you authorize material ordering and materials are delivered to your property. Once materials are delivered to the property, the full roofing contract becomes active.

No Change Order Guarantee: no change orders aside from decking issues uncovered during tear off, which are billed at cost.

Scope and Payment: for insurance work, the client agrees to remit payment based on the final price mutually agreed upon with the insurance company for the Replacement Cost Value of the claim for the work performed by MFR. Add-ons selected in this quote may be separate from insurance proceeds.

Late Payment Policy: unpaid balances remaining 30 days or more from invoice date may be subject to a 3% late fee every 30 days until paid in full.`;

  const MFR_CATALOG = {
    options: [
      { key:'tuff-rib', name:'26g Tuff Rib Exposed Fastener', badge:'Metal Roof', className:'is-metal', total:20747.22, qty:21, unit_label:'sq', price_per_square:988.92, finance:224.47, aliases:['tuff rib','exposed fastener','metal'], description:'Tuff-Rib® metal roofing is a durable, cost-effective exposed-fastener metal roofing system designed to withstand strong winds, snow loads, and harsh Colorado weather while delivering a classic metal-roof look.', included:['26G Tuff Rib Panel','High Temp Pipe Boot','Tuff Rib Eave + Rake','Standing Seam Sidewall + Headwall','Hip and Ridge','Shark Skin High Temp Ice and Water','Exposed Fastener Roof Labor','Bathroom Broan Vent'] },
      { key:'duration-flex', name:'MOST POPULAR Owens Corning Duration Flex', badge:'Most Popular', className:'is-premium', total:14289.12, qty:21, unit_label:'sq', price_per_square:680.43, finance:154.59, aliases:['duration flex','owens corning duration flex','flex'], description:'Class 4 Impact-Resistant Owens Corning Duration Flex roofing system built for Colorado hail and wind. Flex SBS shingles add flexibility to help withstand severe weather, freeze/thaw cycles, and premature aging.', included:['Owens Corning Duration Flex','Steel Drip Edge Eaves + Rakes','ABC Proguard Synthetic Underlayment','OC Starter Strip Plus','OC Impact Hip & Ridge','Pipeboots','OC Ventsure Ridge Vent','Step Flashing','Furnace Vent Cap','Bathroom Broan Vent','Installation Labor','Permits and Taxes','OC System Warranty'] },
      { key:'duration-storm', name:'Owens Corning Duration Storm', badge:'Class 4', className:'is-storm', total:13578.08, qty:21, unit_label:'sq', price_per_square:646.58, finance:146.90, aliases:['duration storm','owens corning duration storm','storm'], description:'Owens Corning Duration® STORM® shingles are engineered for superior impact resistance and long-term durability while maintaining a clean dimensional look.', included:['Owens Corning Duration Storm','Steel Drip Edge Eaves + Rakes','ABC Proguard Synthetic Underlayment','OC Starter Strip Plus','OC Impact Hip & Ridge','Pipeboots','OC Ventsure Ridge Vent','Caulks and Sealants','Step Flashing','Bathroom Broan Vent','Installation Labor','Permits and Taxes'] }
    ],
    addons: [
      { key:'gutters', name:'5 in Seamless Gutters', total:2531.07, qty:127, unit_label:'lf', price:19.93, finance:27.38, aliases:['seamless gutters','gutter replacement','gutters'], description:'High-quality seamless aluminum gutters custom-fabricated on-site for a precise fit. Includes downspouts, hangers, corners, and hardware for a complete drainage system.', included:['Gutter Replacement 5 in Seamless','Powder Coated Downspouts'] },
      { key:'fortified', name:'Fortified Roofing', total:2706.06, qty:21, unit_label:'sq', price:128.86, finance:29.28, aliases:['fortified roofing','fortified roof'], description:'FORTIFIED Roof™ upgrade developed by the Insurance Institute for Business & Home Safety. Strengthens vulnerable roof areas to resist hail, high winds, and severe weather.', included:['Fortified Ring Shank Nails','Fortified OC Peel & Stick Starter','Fortified Proguard Underlayment','Fortified Labor','Fortified Certification'] },
      { key:'cool-roof', name:'Cool Roof Upgrade', total:1596.50, qty:2, unit_label:'ea', price:798.25, finance:17.27, aliases:['cool roof','solar attic vent','solar attic fan'], description:'Solar attic fans automatically engage at 90°F to remove trapped heat, protect shingles from premature aging, and help lower monthly cooling costs.', included:['30 Watt Solar Attic Vent','Thermostatically controlled operation','Lifetime warranty','30% Federal Tax Rebate Eligible'] },
      { key:'warranty', name:'Upgraded Warranty', total:378.00, qty:21, unit_label:'sq', price:18.00, finance:4.09, aliases:['upgraded warranty','workmanship warranty'], description:'Enhance protection with a 10 Year Manufacturer Backed Workmanship Warranty.', included:['10 Year Workmanship Warranty'] },
      { key:'hail-wind', name:'5 Year Hail/Wind Guarantee', total:0.00, qty:1, unit_label:'24HR', price:0.00, finance:0.00, aliases:['hail','wind guarantee','hail/wind'], description:'If within 5 years your roof sustains hail or wind damage significant enough to qualify for a full insurance-approved roof replacement, MFR issues a $2,000 rebate when you reroof with MFR again using insurance proceeds.', included:['5 Year Hail/Wind Guarantee'] },
      { key:'leaf-guard', name:'RX Leaf Guard Upgrade', total:1225.55, qty:127, unit_label:'lf', price:9.65, finance:13.26, aliases:['rx leaf guard','leaf guard'], description:'Durable, low-maintenance gutter protection designed to keep leaves, pine needles, and debris out of gutters year-round.', included:['RX Leaf Guards'] }
    ]
  };
  window.MFR_ESTIMATE_CATALOG = MFR_CATALOG;

  window.mfrEstEsc = function(v){ return String(v ?? '').replace(/[&<>'"]/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'})[ch]; }); };
  window.mfrMoney = function(n){ return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits:2, maximumFractionDigits:2 }); };
  window.mfrDateOnly = function(d){ return new Date(d || Date.now()).toISOString().slice(0,10); };
  window.mfrRand = function(prefix){ return prefix + '-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + Math.random().toString(36).slice(2,6).toUpperCase(); };
  window.mfrQuoteCode = function(){ return 'Q' + Math.random().toString(36).slice(2,10).toUpperCase(); };
  window.mfrCustomerDisplayName = function(c){ return ((c?.first_name || '') + ' ' + (c?.last_name || '')).trim() || c?.name || 'Unknown Customer'; };
  window.mfrCustomerFullAddress = function(c){ return [c?.address, c?.city, c?.state, c?.zip].filter(Boolean).join(', '); };
  window.mfrCatalogMatch = function(name, type){
    const list = type === 'addon' ? MFR_CATALOG.addons : MFR_CATALOG.options;
    const n = String(name || '').toLowerCase();
    return list.find(function(item){ return n === item.name.toLowerCase() || item.aliases.some(function(a){ return n.includes(a); }); }) || null;
  };

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
      const rateRes = await _sb.from('pricing_rates').select('*').eq('is_active', true).order('id');
      if (!rateRes.error && rateRes.data?.length) {
        out.options = rateRes.data.map(function(r){ const cat = mfrCatalogMatch(r.name, 'option'); return Object.assign({}, cat || {}, { id:'db:' + r.id, db_id:r.id, name:r.name, price_per_square:Number(r.price_per_square || cat?.price_per_square || 0), source:'db' }); });
      }
    } catch(e) { console.warn('Pricing table unavailable, using defaults', e); }
    if (!out.options.length) out.options = MFR_CATALOG.options.map(function(r, i){ return Object.assign({}, r, { id:'preset:' + i, source:'preset' }); });
    try {
      const addonRes = await _sb.from('addon_pricing_rates').select('*').eq('is_active', true).order('id');
      if (!addonRes.error && addonRes.data?.length) {
        out.addons = addonRes.data.map(function(a){ const cat = mfrCatalogMatch(a.name, 'addon'); return Object.assign({}, cat || {}, { id:'db:' + a.id, db_id:a.id, name:a.name, price:Number(a.price || cat?.price || 0), unit_label:a.unit_label || cat?.unit_label || 'unit', source:'db' }); });
      }
    } catch(e) { console.warn('Addon table unavailable, using defaults', e); }
    if (!out.addons.length) out.addons = MFR_CATALOG.addons.map(function(a, i){ return Object.assign({}, a, { id:'preset:' + i, source:'preset' }); });
    window.mfrEstimateData = out;
    return out;
  };

  window.pageEstimates = async function(c){
    window.mfrCurrentEstimateId = null;
    const data = await mfrLoadEstimateData();
    const preJobId = sessionStorage.getItem('current_job_id') || '';
    const preJob = preJobId ? data.jobs.find(function(j){ return j.id === preJobId; }) : null;
    const preCustomerId = preJob?.customer_id || '';
    c.innerHTML = ''
      + '<div class="page-wrap mfr-est-page">'
      + '  <div class="mfr-est-hero"><div class="mfr-mfr-badge">🏠 My Family Roofer Quote Builder</div><h1>Build the current MFR roof quote</h1><p>Uses Brian’s current roof replacement quote structure: three roof options, selectable upgrades, 144-month financing examples, terms, quote signing, and invoice conversion.</p><div class="mfr-est-hero-actions"><button class="btn btn-light" onclick="pageEstimatesList(document.getElementById(\'content\'))">📄 Saved Estimates</button><button class="btn btn-success" onclick="saveEstimate(\'draft\')">💾 Save Draft</button><button class="btn btn-primary" onclick="saveEstimate(\'sent\')">📤 Save & Send Quote</button></div></div>'
      + '  <div class="mfr-quote-layout">'
      + '    <div class="mfr-est-main">'
      + '      <div class="card mfr-card-soft"><div class="card-hd"><div class="card-hd-title">Customer & Project</div><div style="font-size:12px;color:var(--text3)">Use an existing customer/job or create a new one.</div></div><div class="card-body"><div class="form-grid">'
      + '        <div class="fg"><label class="fl">Customer</label><select class="fs" id="e-customer-select" onchange="mfrEstimateSelectCustomer()"><option value="">Create new customer</option>'
      + data.customers.map(function(cust){ return '<option value="' + cust.id + '" ' + (cust.id === preCustomerId ? 'selected' : '') + '>' + mfrEstEsc(mfrCustomerDisplayName(cust)) + (cust.phone ? ' · ' + mfrEstEsc(cust.phone) : '') + '</option>'; }).join('')
      + '        </select></div><div class="fg"><label class="fl">Related Project / Job</label><select class="fs" id="e-job-select" onchange="mfrEstimateSelectJob()"><option value="">Create new job/project</option></select></div>'
      + '        <div class="fg"><label class="fl">Customer Name</label><input class="fi" id="e-name" autocapitalize="words"></div><div class="fg"><label class="fl">Estimate Date</label><input class="fi" type="date" id="e-date" value="' + mfrDateOnly() + '"></div><div class="fg fg-full"><label class="fl">Project Address</label><input class="fi" id="e-addr" placeholder="Street, city, state, zip"></div><div class="fg"><label class="fl">Consultant</label><input class="fi" id="e-consultant" value="' + mfrEstEsc((_profile?.full_name || _profile?.email || '').split('@')[0]) + '"></div><div class="fg"><label class="fl">Estimate #</label><input class="fi" id="e-number" value="' + mfrRand('EST') + '"></div>'
      + '      </div></div></div>'
      + '      <div class="card mfr-card-soft"><div class="card-hd"><div class="card-hd-title">Roof Measurements</div><div style="font-size:12px;color:var(--text3)">PDF example uses 21 squares. GAF/First Mate can feed this later.</div></div><div class="card-body"><div class="form-grid"><div class="fg"><label class="fl">Measured Squares</label><input class="fi" type="number" min="0" step="0.01" id="e-squares" value="21" oninput="calcEstimate();mfrSyncDefaultAddonQtys()"></div><div class="fg"><label class="fl">Waste Factor %</label><input class="fi" type="number" min="0" step="0.1" id="e-waste" value="0" oninput="calcEstimate()"></div><div class="fg"><label class="fl">Billed Squares</label><input class="fi" id="e-billed" readonly></div><div class="fg"><label class="fl">Deductible</label><input class="fi" type="number" min="0" step="0.01" id="e-deductible" value="0" oninput="calcEstimate()"></div></div></div></div>'
      + '      <div class="card mfr-card-soft"><div class="card-hd"><div class="card-hd-title">Options · Choose One</div><div style="font-size:12px;color:var(--text3)">Matches the current quote options and pricing.</div></div><div class="card-body"><div id="mfr-package-options"></div></div></div>'
      + '      <div class="card mfr-card-soft"><div class="card-hd"><div class="card-hd-title">Upgrades · Choose Any Number</div><div style="font-size:12px;color:var(--text3)">Gutters, fortified, solar attic fans, warranty, guarantee, and leaf guard upgrades.</div></div><div class="card-body"><div id="mfr-addon-options"></div></div></div>'
      + '      <div class="card mfr-card-soft"><div class="card-hd"><div class="card-hd-title">Terms & Notes</div></div><div class="card-body"><div class="form-grid"><div class="fg fg-full"><label class="fl">Estimate Notes</label><textarea class="fi" id="e-notes" rows="3" placeholder="Scope notes, exclusions, insurance details..."></textarea></div><div class="fg fg-full"><label class="fl">Terms</label><textarea class="fi" id="e-terms" rows="8">' + mfrEstEsc(MFR_CURRENT_TERMS) + '</textarea></div><div class="fg fg-full"><div class="mfr-terms-box"><strong>Current MFR terms summary</strong><ul><li>Cancelable by homeowner until materials have been delivered.</li><li>No obligation until material ordering is authorized and materials are delivered.</li><li>No change orders aside from decking uncovered during tear off, billed at cost.</li><li>Insurance supplements are due upon receipt of payment from insurance.</li><li>30+ day unpaid balances may be subject to a 3% late fee every 30 days.</li></ul></div></div></div></div></div>'
      + '    </div>'
      + '    <div class="mfr-est-side"><div class="card mfr-sticky-card"><div class="card-hd"><div class="card-hd-title">Quote Summary</div></div><div class="card-body" id="est-summary"><p style="color:var(--text3)">Choose a package and upgrades.</p></div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Saved Work</div><button class="btn btn-sm btn-outline" onclick="mfrRefreshEstimateSideLists()">Refresh</button></div><div class="card-body" id="est-saved-list">Loading...</div></div></div>'
      + '  </div>'
      + '</div>';
    mfrRenderEstimateOptions();
    mfrEstimateSelectCustomer();
    if (preJobId) { const sel = document.getElementById('e-job-select'); if (sel) { sel.value = preJobId; mfrEstimateSelectJob(); } }
    calcEstimate();
    await mfrRefreshEstimateSideLists();
  };

  window.mfrRenderEstimateOptions = function(){
    const data = window.mfrEstimateData || { options:[], addons:[] };
    const packages = document.getElementById('mfr-package-options');
    const addons = document.getElementById('mfr-addon-options');
    const measured = parseFloat(document.getElementById('e-squares')?.value || '21') || 21;
    if (packages) {
      packages.innerHTML = '<div class="mfr-product-grid">' + data.options.map(function(r, idx){
        const qty = measured || r.qty || 21;
        const total = qty * Number(r.price_per_square || 0);
        const monthly = total * MFR_FINANCE_FACTOR_144;
        return '<label class="mfr-product-card ' + (r.className || '') + ' ' + (idx === 1 ? 'is-selected' : '') + '" onclick="mfrSelectPackage(this)"><div class="mfr-product-strip"></div>'
          + '<input type="radio" name="e-package" value="' + mfrEstEsc(r.id) + '" ' + (idx === 1 ? 'checked' : '') + ' onchange="calcEstimate()">'
          + '<div class="mfr-product-body"><div class="mfr-product-top"><div class="mfr-product-title">' + mfrEstEsc(r.name) + '</div>' + (r.badge ? '<span class="mfr-product-badge">' + mfrEstEsc(r.badge) + '</span>' : '') + '</div>'
          + '<div class="mfr-product-price">' + mfrMoney(total) + '<span>for ' + qty + ' sq</span></div><div class="mfr-current-source">' + mfrMoney(r.price_per_square) + '/sq · current PDF pricing</div>'
          + '<div class="mfr-product-desc">' + mfrEstEsc(r.description || '') + '</div><div class="mfr-included-list">' + (r.included || []).slice(0,10).map(function(x){ return '<span>' + mfrEstEsc(x) + '</span>'; }).join('') + '</div>'
          + '<div class="mfr-finance-pill"><span>Financing Available</span><strong>' + mfrMoney(monthly) + '/mo</strong></div></div></label>';
      }).join('') + '</div>';
    }
    if (addons) {
      addons.innerHTML = '<div class="mfr-addon-grid">' + data.addons.map(function(a){
        const qty = mfrDefaultAddonQty(a);
        return '<label class="mfr-upgrade-card"><input type="checkbox" class="e-addon-check" data-addon-id="' + mfrEstEsc(a.id) + '" onchange="this.closest(\'.mfr-upgrade-card\').classList.toggle(\'is-selected\', this.checked); calcEstimate()"><div><div class="mfr-upgrade-title">' + mfrEstEsc(a.name) + '</div><div class="mfr-upgrade-desc">' + mfrEstEsc(a.description || '') + '</div><div class="mfr-upgrade-meta"><strong>' + mfrMoney(a.price) + '/' + mfrEstEsc(a.unit_label || 'unit') + '</strong><small>PDF example: ' + mfrMoney(a.total || (a.price*qty)) + '</small></div><div class="mfr-upgrade-qty"><span style="font-size:12px;color:var(--text3);font-weight:800">Qty</span><input class="fi e-addon-qty" type="number" min="0" step="0.01" data-addon-qty="' + mfrEstEsc(a.id) + '" value="' + qty + '" oninput="calcEstimate()"><span style="font-size:12px;color:var(--text3);font-weight:800">' + mfrEstEsc(a.unit_label || 'unit') + '</span></div></div></label>';
      }).join('') + '</div>';
    }
  };

  window.mfrDefaultAddonQty = function(a){
    const n = String(a?.name || '').toLowerCase();
    const measured = parseFloat(document.getElementById('e-squares')?.value || '21') || 21;
    if (n.includes('gutter') || n.includes('leaf')) return 127;
    if (n.includes('fortified') || n.includes('warranty')) return measured || 21;
    if (n.includes('cool')) return 2;
    if (n.includes('hail') || n.includes('wind')) return 1;
    return a?.qty || 1;
  };
  window.mfrSyncDefaultAddonQtys = function(){
    document.querySelectorAll('.e-addon-qty').forEach(function(inp){
      const id = inp.dataset.addonQty;
      const a = (window.mfrEstimateData.addons || []).find(function(x){ return x.id === id; });
      const n = String(a?.name || '').toLowerCase();
      if (n.includes('fortified') || n.includes('warranty')) inp.value = mfrDefaultAddonQty(a);
    });
  };
  window.mfrSelectPackage = function(el){ document.querySelectorAll('.mfr-product-card').forEach(function(card){ card.classList.remove('is-selected'); }); el.classList.add('is-selected'); const input = el.querySelector('input[type="radio"]'); if (input) input.checked = true; calcEstimate(); };

  window.mfrEstimateSelectCustomer = function(){
    const customerId = document.getElementById('e-customer-select')?.value || '';
    const data = window.mfrEstimateData || { customers:[], jobs:[] };
    const customer = data.customers.find(function(c){ return c.id === customerId; });
    const jobSelect = document.getElementById('e-job-select');
    if (customer) { const nameInput = document.getElementById('e-name'); const addrInput = document.getElementById('e-addr'); if (nameInput) nameInput.value = mfrCustomerDisplayName(customer); if (addrInput) addrInput.value = mfrCustomerFullAddress(customer); }
    if (jobSelect) { const jobs = customerId ? data.jobs.filter(function(j){ return j.customer_id === customerId; }) : []; jobSelect.innerHTML = '<option value="">Create new job/project</option>' + jobs.map(function(j){ const addr = mfrCustomerFullAddress(j.customers || {}); return '<option value="' + j.id + '">' + mfrEstEsc((addr || 'Project') + ' · ' + (j.status || 'lead')) + '</option>'; }).join(''); }
  };
  window.mfrEstimateSelectJob = function(){
    const jobId = document.getElementById('e-job-select')?.value || '';
    const job = (window.mfrEstimateData.jobs || []).find(function(j){ return j.id === jobId; });
    if (!job) return;
    sessionStorage.setItem('current_job_id', job.id);
    const customer = job.customers || (window.mfrEstimateData.customers || []).find(function(c){ return c.id === job.customer_id; });
    if (customer) { const cs = document.getElementById('e-customer-select'); if (cs) cs.value = customer.id; const nameInput = document.getElementById('e-name'); const addrInput = document.getElementById('e-addr'); if (nameInput) nameInput.value = mfrCustomerDisplayName(customer); if (addrInput) addrInput.value = mfrCustomerFullAddress(customer); }
  };

  window.mfrBuildEstimateLines = function(){
    const data = window.mfrEstimateData || { options:[], addons:[] };
    const measured = parseFloat(document.getElementById('e-squares')?.value || '0') || 0;
    const waste = parseFloat(document.getElementById('e-waste')?.value || '0') || 0;
    const billed = measured * (1 + waste/100);
    const selectedPackage = document.querySelector('input[name="e-package"]:checked')?.value || '';
    const roof = data.options.find(function(r){ return r.id === selectedPackage; });
    const lines = [];
    if (roof && billed > 0) lines.push({ item_name:roof.name, quantity:Number(billed.toFixed(2)), unit_label:'sq', unit_price:Number(roof.price_per_square || 0), total_price:Number((billed*Number(roof.price_per_square || 0)).toFixed(2)), item_type:'option', source_type:'package', description:roof.description || '', display_order:1 });
    let order = 2;
    document.querySelectorAll('.e-addon-check:checked').forEach(function(chk){ const id = chk.dataset.addonId; const addon = data.addons.find(function(a){ return a.id === id; }); const qtyEl = document.querySelector('[data-addon-qty="' + CSS.escape(id) + '"]'); const qty = parseFloat(qtyEl?.value || '0') || 0; if (addon && qty > 0) lines.push({ item_name:addon.name, quantity:qty, unit_label:addon.unit_label || 'unit', unit_price:Number(addon.price || 0), total_price:Number((qty*Number(addon.price || 0)).toFixed(2)), item_type:'addon', source_type:'addon', description:addon.description || '', display_order:order++ }); });
    return { measured, waste, billed:Number(billed.toFixed(2)), lines };
  };

  window.calcEstimate = function(){
    const pack = mfrBuildEstimateLines();
    const billedInput = document.getElementById('e-billed'); if (billedInput) billedInput.value = pack.billed ? pack.billed.toFixed(2) : '';
    const summary = document.getElementById('est-summary'); if (!summary) return;
    const subtotal = pack.lines.reduce(function(sum, line){ return sum + Number(line.total_price || 0); }, 0);
    const deductible = parseFloat(document.getElementById('e-deductible')?.value || '0') || 0;
    const deposit = subtotal * 0.5;
    const monthly = subtotal * MFR_FINANCE_FACTOR_144;
    if (!pack.measured || !pack.lines.length) { summary.innerHTML = '<p style="color:var(--text3);font-size:13px">Enter measured squares and select a roofing package to calculate.</p>'; return; }
    summary.innerHTML = ''
      + '<div class="mfr-summary-mini"><div><span>Measured</span><strong>' + pack.measured + ' sq</strong></div><div><span>Billed</span><strong>' + pack.billed + ' sq</strong></div><div><span>Financing</span><strong>' + mfrMoney(monthly) + '/mo</strong></div><div><span>Deductible</span><strong>' + mfrMoney(deductible) + '</strong></div></div>'
      + '<div class="mfr-choice-list">' + pack.lines.map(function(line){ return '<div class="mfr-choice-row"><span><strong>' + mfrEstEsc(line.item_name) + '</strong><small>' + line.quantity + ' ' + mfrEstEsc(line.unit_label) + ' × ' + mfrMoney(line.unit_price) + '</small></span><b>' + mfrMoney(line.total_price) + '</b></div>'; }).join('') + '</div>'
      + '<div class="mfr-total-box"><span>Total Estimate</span><strong id="est-total-val" data-total="' + subtotal.toFixed(2) + '">' + mfrMoney(subtotal) + '</strong></div>'
      + '<div class="mfr-deposit-grid"><div><span>Deposit 50%</span><strong>' + mfrMoney(deposit) + '</strong></div><div><span>Balance</span><strong>' + mfrMoney(subtotal - deposit) + '</strong></div></div>'
      + '<div class="mfr-print-actions"><button class="btn btn-sm btn-outline" onclick="window.print()">🖨️ Print Preview</button><button class="btn btn-sm btn-primary" onclick="saveEstimate(\'sent\')">📤 Save & Send</button></div>';
  };

  window.mfrEnsureCustomerForEstimate = async function(){
    const selected = document.getElementById('e-customer-select')?.value || ''; if (selected) return selected;
    const name = (document.getElementById('e-name')?.value || '').trim(); if (!name) throw new Error('Customer name is required.');
    const parts = name.split(/\s+/); const first = parts.shift() || name; const last = parts.join(' '); const addr = (document.getElementById('e-addr')?.value || '').trim();
    const res = await _sb.from('customers').insert({ first_name:first, last_name:last, address:addr || null, created_by:_user?.id || null, assigned_to:_user?.id || null }).select().single(); if (res.error) throw res.error; return res.data.id;
  };
  window.mfrEnsureJobForEstimate = async function(customerId, total, sentMode){
    let jobId = document.getElementById('e-job-select')?.value || sessionStorage.getItem('current_job_id') || '';
    if (jobId) { const current = (window.mfrEstimateData.jobs || []).find(function(j){ return j.id === jobId; }); return { id:jobId, oldStatus:current?.status || null, created:false }; }
    const status = sentMode ? 'estimate_sent' : 'lead';
    const res = await _sb.from('jobs').insert({ customer_id:customerId, assigned_to:_user?.id || null, status:status, contract_value:total || 0, quote_code: sentMode ? mfrQuoteCode() : null }).select().single(); if (res.error) throw res.error; sessionStorage.setItem('current_job_id', res.data.id); return { id:res.data.id, oldStatus:null, created:true };
  };

  window.saveEstimate = async function(mode){
    mode = mode || 'draft'; calcEstimate();
    const pack = mfrBuildEstimateLines(); const total = pack.lines.reduce(function(sum,line){ return sum + Number(line.total_price || 0); }, 0);
    if (!pack.measured || !pack.lines.length || total <= 0) { toast('Enter roof squares and choose a package first.', 'warn'); return; }
    try {
      const customerId = await mfrEnsureCustomerForEstimate(); const quoteCode = mode === 'sent' ? mfrQuoteCode() : null; const jobPack = await mfrEnsureJobForEstimate(customerId, total, mode === 'sent'); const jobId = jobPack.id;
      const estimateNumber = (document.getElementById('e-number')?.value || mfrRand('EST')).trim(); const notes = document.getElementById('e-notes')?.value || ''; const terms = document.getElementById('e-terms')?.value || MFR_CURRENT_TERMS; const deductible = parseFloat(document.getElementById('e-deductible')?.value || '0') || 0;
      let estimateId = window.mfrCurrentEstimateId;
      const payload = { job_id:jobId, customer_id:customerId, estimate_number:estimateNumber, estimate_date:document.getElementById('e-date')?.value || mfrDateOnly(), status:mode === 'sent' ? 'sent' : 'draft', measured_squares:pack.measured, waste_percent:pack.waste, billed_squares:pack.billed, subtotal:total, discount_amount:0, tax_amount:0, total_amount:total, notes:notes, terms:terms, quote_code:quoteCode, created_by:_user?.id || null };
      if (estimateId) { const res = await _sb.from('estimates').update(payload).eq('id', estimateId).select().single(); if (res.error) throw res.error; }
      else { const res = await _sb.from('estimates').insert(payload).select().single(); if (res.error) throw res.error; estimateId = res.data.id; window.mfrCurrentEstimateId = estimateId; }
      await _sb.from('estimate_line_items').delete().eq('estimate_id', estimateId); await _sb.from('estimate_line_items').delete().eq('job_id', jobId).is('estimate_id', null);
      const lineRows = pack.lines.map(function(line){ return Object.assign({}, line, { estimate_id:estimateId, job_id:jobId }); }); if (lineRows.length) { const lineRes = await _sb.from('estimate_line_items').insert(lineRows); if (lineRes.error) throw lineRes.error; }
      const jobUpdate = { contract_value:total, deductible:deductible }; if (mode === 'sent') { jobUpdate.status = 'estimate_sent'; jobUpdate.quote_code = quoteCode; }
      const jobRes = await _sb.from('jobs').update(jobUpdate).eq('id', jobId); if (jobRes.error) throw jobRes.error;
      try { await _sb.from('customer_notes').insert({ customer_id:customerId, job_id:jobId, created_by:_user?.id || null, note_type:'estimate', subject:mode === 'sent' ? 'Estimate sent' : 'Estimate saved', note_text:'Estimate ' + estimateNumber + ' saved for ' + mfrMoney(total) + '.' }); } catch(e) {}
      if (mode === 'sent' && jobPack.oldStatus !== 'estimate_sent' && typeof handleStatusChange === 'function') { try { await handleStatusChange(jobId, jobPack.oldStatus, 'estimate_sent'); } catch(e) { console.warn('Estimate automation skipped', e); } }
      toast(mode === 'sent' ? 'Estimate saved and quote link created.' : 'Estimate draft saved.', 'success'); await mfrLoadEstimateData(); await mfrRefreshEstimateSideLists(); if (mode === 'sent') mfrShowQuoteLinks(jobId, quoteCode);
    } catch(e) { console.error('Estimate save failed', e); toast('Estimate save failed: ' + (e.message || e), 'error'); }
  };

  window.mfrRefreshEstimateSideLists = async function(){
    const box = document.getElementById('est-saved-list'); if (!box) return; box.innerHTML = '<p style="color:var(--text3)">Loading...</p>';
    try { const est = await _sb.from('v_estimates_full').select('*').order('created_at', { ascending:false }).limit(6); const inv = await _sb.from('v_invoices_full').select('*').order('created_at', { ascending:false }).limit(6); const estRows = est.error ? [] : (est.data || []); const invRows = inv.error ? [] : (inv.data || []); box.innerHTML = '<div class="mfr-mini-list"><div class="mfr-mini-title">Recent Estimates</div>' + (estRows.length ? estRows.map(function(e){ return '<button class="mfr-mini-row" onclick="viewEstimateModal(\'' + e.id + '\')"><span><strong>' + mfrEstEsc(e.estimate_number || 'Estimate') + '</strong><small>' + mfrEstEsc(e.customer_name || 'Customer') + ' · ' + (e.status || 'draft') + '</small></span><b>' + mfrMoney(e.total_amount) + '</b></button>'; }).join('') : '<p style="color:var(--text3);font-size:13px">No saved estimates yet.</p>') + '<div class="mfr-mini-title" style="margin-top:14px">Recent Invoices</div>' + (invRows.length ? invRows.map(function(i){ return '<button class="mfr-mini-row" onclick="viewInvoiceModal(\'' + i.id + '\')"><span><strong>' + mfrEstEsc(i.invoice_number || 'Invoice') + '</strong><small>' + mfrEstEsc(i.customer_name || 'Customer') + ' · ' + (i.status || 'draft') + '</small></span><b>' + mfrMoney(i.balance_due ?? i.total_amount) + '</b></button>'; }).join('') : '<p style="color:var(--text3);font-size:13px">No invoices yet.</p>') + '</div>'; } catch(e) { box.innerHTML = '<p style="color:red">Could not load saved work: ' + mfrEstEsc(e.message || e) + '</p>'; }
  };

  window.pageEstimatesList = async function(c){
    c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Estimates & Invoices</div><div class="page-sub">Saved quotes, invoice creation, and payment status.</div></div><button class="btn btn-primary" onclick="go(\'estimates\')">+ New Estimate</button></div><div class="card"><div class="card-hd"><div class="card-hd-title">Saved Estimates</div></div><div class="card-body" id="mfr-est-list">Loading...</div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Invoices</div></div><div class="card-body" id="mfr-inv-list">Loading...</div></div></div>';
    try { const est = await _sb.from('v_estimates_full').select('*').order('created_at', { ascending:false }).limit(50); const inv = await _sb.from('v_invoices_full').select('*').order('created_at', { ascending:false }).limit(50); document.getElementById('mfr-est-list').innerHTML = mfrRenderEstimateTable(est.error ? [] : est.data || []); document.getElementById('mfr-inv-list').innerHTML = mfrRenderInvoiceTable(inv.error ? [] : inv.data || []); } catch(e) { toast('Could not load saved estimates: ' + (e.message || e), 'error'); }
  };

  window.mfrRenderEstimateTable = function(rows){ if (!rows.length) return '<p style="color:var(--text3)">No saved estimates yet.</p>'; return '<table class="tbl"><thead><tr><th>Estimate</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th></th></tr></thead><tbody>' + rows.map(function(e){ return '<tr><td><strong>' + mfrEstEsc(e.estimate_number || 'Estimate') + '</strong></td><td>' + mfrEstEsc(e.customer_name || '') + '</td><td><span class="badge badge-blue">' + mfrEstEsc(e.status || 'draft') + '</span></td><td><strong>' + mfrMoney(e.total_amount) + '</strong></td><td>' + (e.estimate_date ? new Date(e.estimate_date).toLocaleDateString() : '—') + '</td><td><button class="btn btn-sm btn-outline" onclick="viewEstimateModal(\'' + e.id + '\')">View</button></td></tr>'; }).join('') + '</tbody></table>'; };
  window.mfrRenderInvoiceTable = function(rows){ if (!rows.length) return '<p style="color:var(--text3)">No invoices yet.</p>'; return '<table class="tbl"><thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th><th>Balance</th><th>Due</th><th></th></tr></thead><tbody>' + rows.map(function(i){ return '<tr><td><strong>' + mfrEstEsc(i.invoice_number || 'Invoice') + '</strong></td><td>' + mfrEstEsc(i.customer_name || '') + '</td><td><span class="badge badge-' + (i.status === 'paid' ? 'green' : 'blue') + '">' + mfrEstEsc(i.status || 'draft') + '</span></td><td><strong>' + mfrMoney(i.total_amount) + '</strong></td><td><strong>' + mfrMoney(i.balance_due ?? i.total_amount) + '</strong></td><td>' + (i.due_date ? new Date(i.due_date).toLocaleDateString() : '—') + '</td><td><button class="btn btn-sm btn-outline" onclick="viewInvoiceModal(\'' + i.id + '\')">View</button></td></tr>'; }).join('') + '</tbody></table>'; };

  window.viewEstimateModal = async function(id){
    try { const estRes = await _sb.from('v_estimates_full').select('*').eq('id', id).single(); if (estRes.error) throw estRes.error; const e = estRes.data; const lineRes = await _sb.from('estimate_line_items').select('*').eq('estimate_id', id).order('display_order'); const lines = lineRes.error ? [] : (lineRes.data || []); mfrModal('Estimate ' + mfrEstEsc(e.estimate_number || ''), '<div class="mfr-quote-preview"><div class="mfr-quote-preview-hd"><strong>My Family Roofer Quote</strong><div style="opacity:.75;font-size:12px">' + mfrEstEsc(e.customer_name || '') + '</div></div><div class="mfr-quote-preview-body"><div class="mfr-choice-list">' + lines.map(function(line){ return '<div class="mfr-choice-row"><span><strong>' + mfrEstEsc(line.item_name) + '</strong><small>' + line.quantity + ' ' + mfrEstEsc(line.unit_label) + ' × ' + mfrMoney(line.unit_price) + '</small></span><b>' + mfrMoney(line.total_price) + '</b></div>'; }).join('') + '</div><div class="mfr-total-box"><span>Total</span><strong>' + mfrMoney(e.total_amount) + '</strong></div><div class="mfr-deposit-grid"><div><span>Deposit 50%</span><strong>' + mfrMoney(Number(e.total_amount||0)*0.5) + '</strong></div><div><span>Balance</span><strong>' + mfrMoney(Number(e.total_amount||0)*0.5) + '</strong></div></div></div></div><div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-primary" onclick="mfrShowQuoteLinks(\'' + e.job_id + '\',\'' + (e.quote_code || '') + '\')">Quote Link</button><button class="btn btn-success" onclick="convertEstimateToInvoice(\'' + e.id + '\')">Convert to Invoice</button><button class="btn btn-outline" onclick="window.print()">Print</button></div>'); } catch(err) { toast('Could not load estimate: ' + (err.message || err), 'error'); }
  };

  window.convertEstimateToInvoice = async function(estimateId){
    try { const estRes = await _sb.from('estimates').select('*').eq('id', estimateId).single(); if (estRes.error) throw estRes.error; const e = estRes.data; const due = new Date(); due.setDate(due.getDate()+30); const invoiceNumber = mfrRand('INV'); const invRes = await _sb.from('invoices').insert({ estimate_id:e.id, job_id:e.job_id, customer_id:e.customer_id, invoice_number:invoiceNumber, invoice_date:mfrDateOnly(), due_date:mfrDateOnly(due), status:'sent', subtotal:e.subtotal, discount_amount:e.discount_amount || 0, tax_amount:e.tax_amount || 0, total_amount:e.total_amount, amount_paid:0, balance_due:e.total_amount, notes:e.notes || '', created_by:_user?.id || null }).select().single(); if (invRes.error) throw invRes.error; await _sb.from('estimate_line_items').update({ invoice_id:invRes.data.id }).eq('estimate_id', estimateId); if (e.job_id) { const oldJob = await _sb.from('jobs').select('status').eq('id', e.job_id).single(); await _sb.from('jobs').update({ status:'invoiced', contract_value:e.total_amount }).eq('id', e.job_id); if (typeof handleStatusChange === 'function') { try { await handleStatusChange(e.job_id, oldJob.data?.status || null, 'invoiced'); } catch(err){} } } try { await _sb.from('customer_notes').insert({ customer_id:e.customer_id, job_id:e.job_id, created_by:_user?.id || null, note_type:'invoice', subject:'Invoice created', note_text:'Invoice ' + invoiceNumber + ' created for ' + mfrMoney(e.total_amount) + '.' }); } catch(err) {} toast('Invoice created.', 'success'); viewInvoiceModal(invRes.data.id); } catch(err) { toast('Could not create invoice: ' + (err.message || err), 'error'); }
  };

  window.viewInvoiceModal = async function(id){ try { const invRes = await _sb.from('v_invoices_full').select('*').eq('id', id).single(); if (invRes.error) throw invRes.error; const i = invRes.data; mfrModal('Invoice ' + mfrEstEsc(i.invoice_number || ''), '<div class="mfr-summary-mini"><div><span>Invoice Date</span><strong>' + (i.invoice_date ? new Date(i.invoice_date).toLocaleDateString() : '—') + '</strong></div><div><span>Due Date</span><strong>' + (i.due_date ? new Date(i.due_date).toLocaleDateString() : '—') + '</strong></div><div><span>Total</span><strong>' + mfrMoney(i.total_amount) + '</strong></div><div><span>Balance</span><strong>' + mfrMoney(i.balance_due ?? i.total_amount) + '</strong></div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-success" onclick="markInvoicePaid(\'' + i.id + '\')">Mark Paid</button><button class="btn btn-outline" onclick="window.print()">Print</button></div>'); } catch(err) { toast('Could not load invoice: ' + (err.message || err), 'error'); } };
  window.markInvoicePaid = async function(id){ try { const invRes = await _sb.from('invoices').select('*').eq('id', id).single(); if (invRes.error) throw invRes.error; const i = invRes.data; const upd = await _sb.from('invoices').update({ status:'paid', amount_paid:i.total_amount, balance_due:0 }).eq('id', id); if (upd.error) throw upd.error; await _sb.from('invoice_payments').insert({ invoice_id:id, amount:i.total_amount, payment_method:'manual', notes:'Marked paid in Command Center', created_by:_user?.id || null }); if (i.job_id) { const oldJob = await _sb.from('jobs').select('status').eq('id', i.job_id).single(); await _sb.from('jobs').update({ status:'paid' }).eq('id', i.job_id); if (typeof handleStatusChange === 'function') { try { await handleStatusChange(i.job_id, oldJob.data?.status || null, 'paid'); } catch(err){} } } toast('Invoice marked paid.', 'success'); closeModal(); mfrRefreshInvoicesOrEstimatesList(); } catch(err) { toast('Could not mark paid: ' + (err.message || err), 'error'); } };
  window.mfrShowQuoteLinks = function(jobId, quoteCode){ if (!quoteCode) { toast('No quote link yet. Use Save & Send Quote first.', 'warn'); return; } const origin = location.origin; const quote = origin + '/quote.html?code=' + encodeURIComponent(quoteCode); const track = origin + '/track.html?code=' + encodeURIComponent(quoteCode); mfrModal('Quote Link', '<div class="form-grid"><div class="fg fg-full"><label class="fl">Customer signing link</label><input class="fi" readonly value="' + mfrEstEsc(quote) + '"></div><div class="fg fg-full"><label class="fl">Customer tracker link</label><input class="fi" readonly value="' + mfrEstEsc(track) + '"></div></div><div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><button class="btn btn-primary" onclick="navigator.clipboard.writeText(\'' + quote + '\');toast(\'Quote link copied\',\'success\')">Copy Quote Link</button><button class="btn btn-outline" onclick="navigator.clipboard.writeText(\'' + track + '\');toast(\'Tracking link copied\',\'success\')">Copy Tracker Link</button></div>'); };
})();


/* ─────────────────────────────────────────────────────────────
   MFR NAVIGATION BUILDER DRAG/DROP PATCH
   Makes Admin → Navigation Builder easier to use:
   - drag pages between top sections
   - reorder pages visually
   - edit icon, page name, group, visibility
───────────────────────────────────────────────────────────── */
(function mfrInstallNavigationBuilderDndPatch(){
  const css = document.createElement('style');
  css.textContent = `
    .mfr-nav-dnd-wrap{display:grid;grid-template-columns:repeat(4,minmax(240px,1fr));gap:14px;align-items:start}
    .mfr-nav-dnd-col{background:#F8FAFC;border:1px solid #E2E8F0;border-radius:20px;padding:12px;min-height:260px;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
    .mfr-nav-dnd-col.drag-over{border-color:#2563EB;background:#EFF6FF;box-shadow:0 0 0 4px rgba(37,99,235,.10)}
    .mfr-nav-dnd-head{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;padding:2px 4px 8px;border-bottom:1px solid #E2E8F0}
    .mfr-nav-dnd-title{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:950;color:#0F172A}
    .mfr-nav-dnd-count{font-size:11px;font-weight:900;color:#64748B;background:#E2E8F0;border-radius:999px;padding:4px 8px}
    .mfr-nav-dnd-list{display:flex;flex-direction:column;gap:10px;min-height:180px}
    .mfr-nav-dnd-card{background:#fff;border:1px solid #DDE6F2;border-radius:16px;padding:12px;box-shadow:0 8px 18px rgba(15,23,42,.05);cursor:grab;transition:.16s ease;position:relative}
    .mfr-nav-dnd-card:hover{border-color:#93C5FD;box-shadow:0 12px 26px rgba(37,99,235,.10);transform:translateY(-1px)}
    .mfr-nav-dnd-card.dragging{opacity:.45;transform:scale(.985);cursor:grabbing}
    .mfr-nav-card-top{display:grid;grid-template-columns:42px minmax(0,1fr);gap:10px;align-items:center;margin-bottom:10px}
    .mfr-nav-card-ic{width:42px;height:42px;border-radius:14px;background:#EEF4FF;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid #DBEAFE}
    .mfr-nav-card-fields{display:grid;gap:7px}
    .mfr-nav-card-label{font-weight:950;color:#0F172A;font-size:14px;line-height:1.2}
    .mfr-nav-dnd-card input,.mfr-nav-dnd-card select{width:100%;border:1px solid #E2E8F0;border-radius:10px;padding:8px 9px;font-size:12px;background:#fff;outline:none}
    .mfr-nav-dnd-card input:focus,.mfr-nav-dnd-card select:focus{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.10)}
    .mfr-nav-card-grid{display:grid;grid-template-columns:52px minmax(0,1fr);gap:8px;margin-top:8px}
    .mfr-nav-card-actions{display:flex;justify-content:space-between;align-items:center;gap:6px;margin-top:10px}
    .mfr-nav-mini-btn{border:1px solid #D8E2EF;background:#fff;border-radius:9px;padding:6px 8px;font-size:11px;font-weight:900;color:#334155;cursor:pointer}
    .mfr-nav-mini-btn:hover{border-color:#2563EB;color:#1D4ED8;background:#EFF6FF}
    .mfr-nav-card-id{font-size:10px;color:#94A3B8;margin-top:8px;letter-spacing:.02em}
    .mfr-nav-builder-help{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;background:#fff;border:1px solid #E2E8F0;border-radius:18px;padding:14px;margin-bottom:14px;box-shadow:0 8px 20px rgba(15,23,42,.04)}
    .mfr-nav-builder-help p{margin:4px 0 0;color:#64748B;font-size:13px;line-height:1.45}
    .mfr-nav-drop-hint{border:1px dashed #CBD5E1;border-radius:14px;padding:16px;text-align:center;color:#94A3B8;font-weight:800;font-size:12px;background:rgba(255,255,255,.55)}
    @media(max-width:1300px){.mfr-nav-dnd-wrap{grid-template-columns:repeat(2,minmax(240px,1fr))}}
    @media(max-width:760px){.mfr-nav-dnd-wrap{grid-template-columns:1fr}.mfr-nav-builder-help{grid-template-columns:1fr}.mfr-nav-card-grid{grid-template-columns:1fr}}
  `;
  document.head.appendChild(css);
})();

function mfrNavDndSections(){
  return Object.keys(MFR_NAV_SECTIONS || {ops:{label:'Operations',icon:'📊'},est:{label:'Estimate Builder',icon:'📋'},sales:{label:'Sales Tools',icon:'💬'},admin:{label:'Admin',icon:'⚙️'}});
}
function mfrNavDndSectionLabel(section){
  const s = (MFR_NAV_SECTIONS || {})[section] || {};
  return (s.icon || '◻️') + ' ' + (s.label || section);
}
function mfrNavDndVisible(v){ return v !== false && v !== 'false'; }
function mfrNavDndEsc(v){ return (typeof escHtml === 'function') ? escHtml(v ?? '') : String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function pageNavBuilder(c){
  if (!isAdmin()) {
    c.innerHTML = '<div class="page-wrap"><div class="empty-state"><div class="icon">🔒</div><h3>Admin only</h3><p>Navigation Builder is only available to admins and managers.</p></div></div>';
    return;
  }
  const items = mfrAllNavItems().sort(mfrSortNav);
  const sections = mfrNavDndSections();
  c.innerHTML = '<div class="page-wrap">'
    + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;flex-wrap:wrap;margin-bottom:16px"><div><h1 style="font-size:26px;font-weight:950;margin:0 0 4px">Navigation Builder</h1><p style="color:var(--text2);margin:0">Drag pages between sections, rename them, change icons, update groups, and save for the team.</p></div><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" onclick="mfrSaveNavigationConfig()">Save Navigation</button><button class="btn btn-outline" onclick="mfrResetNavigationConfig()">Reset Defaults</button></div></div>'
    + '<div class="mfr-nav-builder-help"><div><b>Drag and drop page cards</b><p>Move a page to Operations, Estimate Builder, Sales Tools, or Admin by dragging it into that column. You can also rename the page, change the icon, edit the sidebar group, hide it, or use the up/down buttons for touch devices.</p></div><span class="mfr-nav-badge">' + (MFR_NAV_DB_READY ? 'DB CONNECTED' : 'LOCAL FALLBACK') + '</span></div>'
    + '<div class="mfr-nav-dnd-wrap" id="mfr-nav-dnd-wrap">'
    + sections.map(function(section){
        const sectionItems = items.filter(function(i){ return (i.top_section || 'ops') === section; });
        return '<section class="mfr-nav-dnd-col" data-section="'+mfrNavDndEsc(section)+'" ondragover="mfrNavAllowDrop(event)" ondragleave="mfrNavDragLeave(event)" ondrop="mfrNavDrop(event,\''+mfrNavDndEsc(section)+'\')">'
          + '<div class="mfr-nav-dnd-head"><div class="mfr-nav-dnd-title">'+mfrNavDndEsc(mfrNavDndSectionLabel(section))+'</div><span class="mfr-nav-dnd-count">'+sectionItems.length+'</span></div>'
          + '<div class="mfr-nav-dnd-list">' + (sectionItems.length ? sectionItems.map(mfrNavDndCard).join('') : '<div class="mfr-nav-drop-hint">Drop pages here</div>') + '</div>'
          + '</section>';
      }).join('')
    + '</div><div style="height:70px"></div></div>';
  mfrNavRefreshCounts();
}

function mfrNavDndCard(item){
  const groups = ['Overview','Field','Claims & Supplements','Scheduling','Build','Saved','Pipeline','AI Tools','In the Field','Reputation','Team','Automation','Reports & Data','Other'];
  const groupList = groups.map(g => '<option value="'+mfrNavDndEsc(g)+'"></option>').join('');
  const sectionOpts = mfrNavDndSections().map(k => '<option value="'+k+'" '+((item.top_section||'ops')===k?'selected':'')+'>'+mfrNavDndEsc((MFR_NAV_SECTIONS[k]||{}).label||k)+'</option>').join('');
  return '<article class="mfr-nav-dnd-card" draggable="true" data-nav-id="'+mfrNavDndEsc(item.id)+'" data-section="'+mfrNavDndEsc(item.top_section||'ops')+'" ondragstart="mfrNavDragStart(event)" ondragend="mfrNavDragEnd(event)" ondragover="mfrNavAllowDrop(event)" ondrop="mfrNavDrop(event,\''+mfrNavDndEsc(item.top_section||'ops')+'\')">'
    + '<div class="mfr-nav-card-top"><input class="nav-icon" value="'+mfrNavDndEsc(item.icon||'◻️')+'" title="Icon"><div class="mfr-nav-card-fields"><input class="nav-label" value="'+mfrNavDndEsc(item.label||item.id)+'" title="Page name"><div class="mfr-nav-card-id">ID: '+mfrNavDndEsc(item.id)+'</div></div></div>'
    + '<div class="mfr-nav-card-grid"><select class="nav-section" onchange="mfrNavMoveCardToSection(this.closest(\'.mfr-nav-dnd-card\'), this.value)">'+sectionOpts+'</select><input class="nav-group" list="mfr-nav-groups-dnd" value="'+mfrNavDndEsc(item.group_label||'Other')+'" title="Sidebar group"></div>'
    + '<div class="mfr-nav-card-actions"><select class="nav-visible"><option value="true" '+(mfrNavDndVisible(item.visible)?'selected':'')+'>Visible</option><option value="false" '+(!mfrNavDndVisible(item.visible)?'selected':'')+'>Hidden</option></select><div><button type="button" class="mfr-nav-mini-btn" onclick="mfrNavMoveCard(this.closest(\'.mfr-nav-dnd-card\'), -1)">↑</button> <button type="button" class="mfr-nav-mini-btn" onclick="mfrNavMoveCard(this.closest(\'.mfr-nav-dnd-card\'), 1)">↓</button> <button type="button" class="mfr-nav-mini-btn" onclick="go(\''+mfrNavDndEsc(item.id)+'\')">Open</button></div></div>'
    + '<datalist id="mfr-nav-groups-dnd">'+groupList+'</datalist></article>';
}

window.mfrNavDragStart = function(ev){
  const card = ev.currentTarget.closest('.mfr-nav-dnd-card');
  if (!card) return;
  ev.dataTransfer.setData('text/plain', card.dataset.navId || '');
  ev.dataTransfer.effectAllowed = 'move';
  setTimeout(function(){ card.classList.add('dragging'); }, 0);
};
window.mfrNavDragEnd = function(ev){
  document.querySelectorAll('.mfr-nav-dnd-card.dragging,.mfr-nav-dnd-col.drag-over').forEach(el => el.classList.remove('dragging','drag-over'));
  mfrNavRefreshCounts();
};
window.mfrNavAllowDrop = function(ev){
  ev.preventDefault();
  const col = ev.currentTarget.closest('.mfr-nav-dnd-col');
  if (col) col.classList.add('drag-over');
};
window.mfrNavDragLeave = function(ev){
  const col = ev.currentTarget.closest('.mfr-nav-dnd-col');
  if (col && !col.contains(ev.relatedTarget)) col.classList.remove('drag-over');
};
window.mfrNavDrop = function(ev, section){
  ev.preventDefault();
  ev.stopPropagation();
  const id = ev.dataTransfer.getData('text/plain');
  const card = document.querySelector('.mfr-nav-dnd-card[data-nav-id="'+CSS.escape(id)+'"]');
  const col = ev.currentTarget.closest('.mfr-nav-dnd-col') || document.querySelector('.mfr-nav-dnd-col[data-section="'+CSS.escape(section)+'"]');
  const list = col ? col.querySelector('.mfr-nav-dnd-list') : null;
  if (!card || !list) return;
  const hint = list.querySelector('.mfr-nav-drop-hint'); if (hint) hint.remove();
  const target = ev.target.closest('.mfr-nav-dnd-card');
  if (target && target !== card && list.contains(target)) list.insertBefore(card, target);
  else list.appendChild(card);
  const newSection = col.dataset.section || section || card.dataset.section || 'ops';
  card.dataset.section = newSection;
  const sel = card.querySelector('.nav-section'); if (sel) sel.value = newSection;
  document.querySelectorAll('.mfr-nav-dnd-col').forEach(x => x.classList.remove('drag-over'));
  card.classList.remove('dragging');
  mfrNavRefreshCounts();
};
window.mfrNavMoveCardToSection = function(card, section){
  if (!card) return;
  const col = document.querySelector('.mfr-nav-dnd-col[data-section="'+CSS.escape(section)+'"] .mfr-nav-dnd-list');
  if (!col) return;
  const hint = col.querySelector('.mfr-nav-drop-hint'); if (hint) hint.remove();
  col.appendChild(card);
  card.dataset.section = section;
  mfrNavRefreshCounts();
};
window.mfrNavMoveCard = function(card, dir){
  if (!card) return;
  const list = card.parentElement;
  const cards = Array.from(list.querySelectorAll('.mfr-nav-dnd-card'));
  const i = cards.indexOf(card);
  const ni = i + dir;
  if (ni < 0 || ni >= cards.length) return;
  if (dir < 0) list.insertBefore(card, cards[ni]);
  else list.insertBefore(cards[ni], card);
  mfrNavRefreshCounts();
};
window.mfrNavRefreshCounts = function(){
  document.querySelectorAll('.mfr-nav-dnd-col').forEach(col => {
    const list = col.querySelector('.mfr-nav-dnd-list');
    const count = list ? list.querySelectorAll('.mfr-nav-dnd-card').length : 0;
    const badge = col.querySelector('.mfr-nav-dnd-count');
    if (badge) badge.textContent = count;
    if (list && count === 0 && !list.querySelector('.mfr-nav-drop-hint')) list.innerHTML = '<div class="mfr-nav-drop-hint">Drop pages here</div>';
  });
};

async function mfrSaveNavigationConfig(){
  const rows = [];
  document.querySelectorAll('.mfr-nav-dnd-col').forEach(col => {
    const section = col.dataset.section || 'ops';
    Array.from(col.querySelectorAll('.mfr-nav-dnd-card')).forEach((card, idx) => {
      const id = card.dataset.navId;
      const base = mfrFindNavItem(id) || { id };
      rows.push({
        id,
        label: card.querySelector('.nav-label')?.value?.trim() || base.label || id,
        icon: card.querySelector('.nav-icon')?.value?.trim() || base.icon || '◻️',
        top_section: card.querySelector('.nav-section')?.value || section,
        group_label: card.querySelector('.nav-group')?.value?.trim() || base.group_label || 'Other',
        display_order: (idx + 1) * 10,
        is_visible: (card.querySelector('.nav-visible')?.value || 'true') === 'true',
        description: base.description || ''
      });
    });
  });
  try {
    const { error } = await _sb.from('app_nav_items').upsert(rows, { onConflict:'id' });
    if (error) throw error;
    toast('Navigation saved for the team.');
    await mfrLoadNavConfig();
  } catch(e) {
    console.warn('Nav DB save failed; saving local fallback', e);
    const localRows = rows.map(r => ({ id:r.id, label:r.label, icon:r.icon, top_section:r.top_section, group_label:r.group_label, display_order:r.display_order, visible:r.is_visible, description:r.description }));
    localStorage.setItem('mfr_nav_items', JSON.stringify(localRows));
    MFR_NAV_ITEMS = localRows;
    mfrRebuildPageSectionMap();
    toast('Navigation saved locally. Run the SQL to save it for all users.', 'warn');
  }
  buildSB();
  await pageNavBuilder(document.getElementById('content'));
  enhanceRouteChrome('nav-builder');
}


/* =====================================================================
   MFR ESTIMATE BUILDER CLARITY + DYNAMIC PRICING FIX
   Added as final override so it wins over older merged estimate code.
===================================================================== */
(function(){
  const style = document.createElement('style');
  style.textContent = `
    .mfr-est-shell{display:grid;grid-template-columns:minmax(0,1fr) 380px;gap:16px;align-items:start}
    .mfr-est-hero{background:linear-gradient(135deg,#0B2B74 0%,#1D63D8 56%,#66B7FF 100%);color:#fff;border-radius:18px;padding:22px;box-shadow:0 16px 36px rgba(16,80,190,.22);display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap;align-items:flex-start}
    .mfr-est-hero h1{font-size:30px;font-weight:950;margin:0 0 6px;letter-spacing:-.02em}
    .mfr-est-hero p{margin:0;color:rgba(255,255,255,.82);font-size:14px;line-height:1.5;max-width:760px}
    .mfr-est-panel{background:#fff;border:1px solid #E4EAF4;border-radius:16px;box-shadow:0 10px 24px rgba(15,23,42,.045);overflow:hidden;margin-top:14px}
    .mfr-est-panel-hd{padding:16px 18px;border-bottom:1px solid #E8EDF5;display:flex;align-items:center;justify-content:space-between;gap:12px;background:#fff}
    .mfr-est-panel-title{font-weight:900;font-size:17px;color:#0F172A}.mfr-est-panel-sub{font-size:12px;color:#64748B;margin-top:3px}
    .mfr-est-panel-body{padding:18px}
    .mfr-est-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mfr-est-grid .fg-full{grid-column:1/-1}
    .mfr-est-package-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
    .mfr-est-package{position:relative;text-align:left;background:#fff;border:2px solid #E2E8F0;border-top:7px solid #2563EB;border-radius:18px;padding:18px;min-height:370px;cursor:pointer;box-shadow:0 12px 24px rgba(15,23,42,.05);transition:.18s ease;display:flex;flex-direction:column;gap:12px;overflow:hidden}
    .mfr-est-package:hover{transform:translateY(-2px);box-shadow:0 18px 34px rgba(15,23,42,.1);border-color:#93C5FD}.mfr-est-package.selected{border-color:#2563EB;box-shadow:0 0 0 4px rgba(37,99,235,.12),0 18px 34px rgba(15,23,42,.12)}
    .mfr-est-package.metal{border-top-color:#0F766E}.mfr-est-package.popular{border-top-color:#2563EB}.mfr-est-package.storm{border-top-color:#7C3AED}
    .mfr-est-ribbon{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;background:#EFF6FF;color:#1D4ED8;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.11em}.mfr-est-package.storm .mfr-est-ribbon{background:#F5F3FF;color:#6D28D9}.mfr-est-package.metal .mfr-est-ribbon{background:#ECFDF5;color:#0F766E}
    .mfr-est-package-name{font-size:20px;line-height:1.1;font-weight:950;color:#0F172A;margin:0}.mfr-est-price{font-size:28px;font-weight:950;color:#0B1534;letter-spacing:-.03em}.mfr-est-price small{font-size:12px;color:#94A3B8;font-weight:800;margin-left:4px}.mfr-est-rate{font-size:12px;color:#64748B;font-weight:800}
    .mfr-est-desc{font-size:13px;line-height:1.45;color:#475569}.mfr-est-includes{margin-top:auto;border-top:1px solid #E2E8F0;padding-top:12px;display:grid;gap:7px;max-height:120px;overflow:hidden}.mfr-est-includes span{font-size:12px;color:#334155;display:flex;gap:7px;align-items:flex-start}.mfr-est-includes span:before{content:'✓';color:#16A34A;font-weight:950}
    .mfr-finance-row{background:#EFF6FF;border:1px solid #BFDBFE;color:#1D4ED8;border-radius:12px;padding:10px 12px;display:flex;justify-content:space-between;gap:8px;font-weight:900}
    .mfr-addon-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.mfr-addon{border:1px solid #E2E8F0;border-radius:14px;padding:14px;background:#fff;display:grid;gap:10px}.mfr-addon.active{border-color:#2563EB;box-shadow:0 0 0 3px rgba(37,99,235,.1)}
    .mfr-addon-top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.mfr-addon-title{font-weight:900;color:#0F172A}.mfr-addon-rate{font-size:12px;color:#64748B;font-weight:800;margin-top:3px}.mfr-addon-total{font-weight:950;color:#0B1534}.mfr-addon-desc{font-size:12px;color:#64748B;line-height:1.4}.mfr-addon-controls{display:grid;grid-template-columns:1fr 110px;gap:8px;align-items:center}.mfr-toggle{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:#334155}.mfr-toggle input{width:18px;height:18px}.mfr-qty{height:38px;border:1px solid #CBD5E1;border-radius:10px;padding:0 10px;font-weight:800}
    .mfr-est-summary-card{position:sticky;top:84px}.mfr-total-big{background:#0B1534;color:#fff;border-radius:16px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:12px}.mfr-total-big span{font-weight:800;color:#CBD5E1}.mfr-total-big strong{font-size:30px;font-weight:950;letter-spacing:-.03em}.mfr-summary-lines{display:grid;gap:10px}.mfr-summary-line{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #EEF2F7;padding-bottom:9px}.mfr-summary-line:last-child{border-bottom:0}.mfr-summary-line span{font-size:13px;color:#475569}.mfr-summary-line strong{font-weight:900;color:#0F172A;text-align:right}.mfr-action-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mfr-saved-list{display:grid;gap:8px}.mfr-saved-row{border:1px solid #E2E8F0;border-radius:12px;background:#fff;padding:12px;display:flex;justify-content:space-between;gap:10px;text-align:left;cursor:pointer;width:100%;align-items:center}.mfr-saved-row:hover{border-color:#2563EB;background:#F8FBFF}.mfr-saved-row small{display:block;color:#64748B;margin-top:3px}.mfr-quote-modal-head{background:linear-gradient(135deg,#0B2B74,#1D63D8);color:#fff;border-radius:14px;padding:18px;margin-bottom:14px}.mfr-quote-modal-head h3{margin:0 0 5px;font-size:22px}.mfr-line-table{width:100%;border-collapse:collapse;margin-top:12px}.mfr-line-table th{background:#F8FAFC;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#64748B;text-align:left;padding:10px}.mfr-line-table td{border-top:1px solid #E2E8F0;padding:10px;font-size:13px}.mfr-line-table td:last-child,.mfr-line-table th:last-child{text-align:right}.mfr-est-note{font-size:12px;color:#64748B;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:10px;line-height:1.45;margin-top:10px}
    @media(max-width:1180px){.mfr-est-shell{grid-template-columns:1fr}.mfr-est-summary-card{position:relative;top:auto}.mfr-est-package-grid{grid-template-columns:1fr}.mfr-addon-list{grid-template-columns:1fr}}
    @media(max-width:760px){.mfr-est-grid{grid-template-columns:1fr}.mfr-est-hero h1{font-size:24px}.mfr-est-package{min-height:auto}.mfr-addon-controls{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const P = window.MFR_ESTIMATE_PRESETS = {
    quoteSquares: 21,
    options: [
      { key:'duration_flex', cls:'popular', badge:'Most Popular', name:'MOST POPULAR Owens Corning Duration Flex', total:14289.12, unit:14289.12/21, finance:154.59, desc:'Class 4 impact-resistant Owens Corning Duration Flex roofing system built for Colorado hail and wind. SBS shingles add flexibility for severe weather, freeze/thaw cycles, and premature aging.', includes:['Owens Corning Duration Flex','Steel drip edge eaves + rakes','ABC Proguard synthetic underlayment','OC Starter Strip Plus','OC Impact Hip & Ridge','Pipeboots','OC Ventsure ridge vent','Installation labor','Permits and taxes','OC System Warranty'], aliases:['duration flex','owens corning duration flex','flex','most popular'] },
      { key:'duration_storm', cls:'storm', badge:'Class 4', name:'Owens Corning Duration Storm', total:13578.08, unit:13578.08/21, finance:146.90, desc:'Owens Corning Duration STORM shingles engineered for superior impact resistance and long-term durability while maintaining a clean dimensional look.', includes:['Owens Corning Duration Storm','Steel drip edge eaves + rakes','ABC Proguard synthetic underlayment','OC Starter Strip Plus','OC Impact Hip & Ridge','Pipeboots','OC Ventsure ridge vent','Caulks and sealants','Installation labor','Permits and taxes'], aliases:['duration storm','owens corning duration storm','storm'] },
      { key:'tuff_rib', cls:'metal', badge:'Metal Roof', name:'26g Tuff Rib Exposed Fastener', total:20747.22, unit:20747.22/21, finance:224.47, desc:'Durable exposed-fastener metal roofing with dependable protection, classic metal-roof appearance, strong weather performance, and long-term value.', includes:['26G Tuff Rib panel','High temp pipe boot','Tuff Rib eave + rake','Standing seam sidewall/headwall','Hip and ridge','Shark Skin high temp ice and water','Exposed fastener roof labor','Bathroom Broan vent'], aliases:['26g tuff rib','tuff rib','exposed fastener','metal'] }
    ],
    addons: [
      { key:'gutters', name:'5 in Seamless Gutters', total:2531.07, qty:127, unitLabel:'lf', unit:2531.07/127, finance:27.38, desc:'Seamless aluminum gutters custom-fabricated on-site. Includes downspouts, hangers, corners, and hardware.', aliases:['5 seamless gutters','seamless gutters','gutters','gutter replacement'] },
      { key:'fortified', name:'Fortified Roofing', total:2706.06, qty:21, unitLabel:'sq', unit:2706.06/21, finance:29.28, desc:'FORTIFIED Roof upgrade with storm-hardened details, sealed deck methods, reinforced edges, and third-party certification.', aliases:['fortified roofing','fortified roof','fortified'] },
      { key:'cool_roof', name:'Cool Roof Upgrade', total:1596.50, qty:2, unitLabel:'ea', unit:1596.50/2, finance:17.27, desc:'Solar attic fans that engage at 90°F to remove trapped heat and help protect shingles from premature aging.', aliases:['cool roof','solar attic vent','solar attic fan'] },
      { key:'warranty', name:'Upgraded Warranty', total:378.00, qty:21, unitLabel:'sq', unit:378.00/21, finance:4.09, desc:'Upgrade to a 10 Year Manufacturer Backed Workmanship Warranty.', aliases:['upgraded warranty','workmanship warranty','warranty'] },
      { key:'hail_wind', name:'5 Year Hail/Wind Guarantee', total:0.00, qty:1, unitLabel:'24HR', unit:0, finance:0, desc:'5-year hail and wind guarantee with a $2,000 rebate when conditions apply and the customer reroofs with MFR again.', aliases:['hail wind','hail/wind','guarantee'] },
      { key:'leaf_guard', name:'RX Leaf Guard Upgrade', total:1225.55, qty:127, unitLabel:'lf', unit:1225.55/127, finance:13.26, desc:'Low-maintenance gutter protection to keep debris out and maintain water flow year-round.', aliases:['rx leaf guard','leaf guard','rx leaf guards'] }
    ]
  };

  window.mfrModal = window.mfrModal || function(title, body, maxWidth){
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = '<div class="modal-sheet" style="max-width:'+(maxWidth||'900px')+'"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px"><h3 style="font-size:20px;font-weight:900;margin:0">'+mfrEstEsc(title || '')+'</h3><button class="btn btn-sm btn-outline" onclick="this.closest(\'.modal-overlay\').remove()">Close</button></div>'+body+'</div>';
    document.body.appendChild(modal);
    return modal;
  };

  function esc(v){ return (window.mfrEstEsc || window.escHtml || function(x){return String(x ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));})(v); }
  function money(n){ return (window.mfrMoney || function(x){return '$'+Number(x||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});})(n); }
  function cleanKey(v){ return String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''); }
  function valueOf(row, keys){ for(const k of keys){ if(row && row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]; } return null; }
  function rateName(row){ return valueOf(row, ['option_name','addon_name','name','product_name','label','title']); }
  function rateUnit(row, type){ return Number(valueOf(row, type === 'option' ? ['price_per_square','rate_per_square','unit_price','price','amount'] : ['price','unit_price','price_per_unit','rate','amount'])) || 0; }
  function isActive(row){ return row && row.is_active !== false && row.active !== false && row.enabled !== false; }
  function matchPreset(name, presets){ const n = String(name||'').toLowerCase(); return presets.find(p => n.includes(p.key.replace(/_/g,' ')) || p.aliases.some(a => n.includes(a)) || n.includes(String(p.name).toLowerCase().replace('most popular ',''))); }
  function normalizeRates(rows, presets, type){
    const map = new Map();
    (rows || []).filter(isActive).forEach(row => {
      const nm = rateName(row); if(!nm) return;
      const preset = matchPreset(nm, presets); if(!preset) return;
      let unit = rateUnit(row, type);
      // If database value is only a rounded copy of the PDF rate, keep the exact PDF rate so 21 sq matches Brian's quote exactly.
      if (!unit || Math.abs(unit - preset.unit) < 0.05) unit = preset.unit;
      if (unit <= 0 && preset.unit > 0) unit = preset.unit;
      map.set(preset.key, Object.assign({}, preset, { dbId:row.id, name:preset.name, unit:unit }));
    });
    presets.forEach(p => { if(!map.has(p.key)) map.set(p.key, Object.assign({}, p)); });
    return presets.map(p => map.get(p.key));
  }
  function customerName(c){ if(!c) return ''; return String(((c.first_name||'') + ' ' + (c.last_name||'')).trim() || c.customer_name || c.name || 'Customer'); }
  function fullAddress(c){ return [c?.address, c?.city, c?.state, c?.zip].filter(Boolean).join(', '); }
  function effectiveSquares(){ return Number(document.getElementById('e-squares')?.value || P.quoteSquares) || P.quoteSquares; }
  function getState(){
    if(!window.mfrEstState) window.mfrEstState = { packageKey:'duration_flex', addons:{} };
    return window.mfrEstState;
  }
  function optionByKey(key){ return (window.mfrEstimatorOptions || P.options).find(x => x.key === key) || (window.mfrEstimatorOptions || P.options)[0]; }
  function addonByKey(key){ return (window.mfrEstimatorAddons || P.addons).find(x => x.key === key); }
  function selectedAddons(){ const st = getState(); return Object.entries(st.addons || {}).filter(([k,v]) => v && v.enabled).map(([k,v]) => Object.assign({}, addonByKey(k), { qty:Number(v.qty || addonByKey(k)?.qty || 1) })); }
  function estimateLines(){
    const sq = effectiveSquares(); const opt = optionByKey(getState().packageKey); const lines = [];
    if(opt) lines.push({ item_name:opt.name, quantity:sq, unit_label:'sq', unit_price:opt.unit, total_price:sq * opt.unit, item_type:'roof_option', display_order:1 });
    selectedAddons().forEach((a,idx) => lines.push({ item_name:a.name, quantity:a.qty, unit_label:a.unitLabel || 'unit', unit_price:a.unit, total_price:a.qty * a.unit, item_type:'addon', display_order:idx+2 }));
    return lines;
  }
  function estimateTotal(){ return estimateLines().reduce((s,l)=>s+Number(l.total_price||0),0); }

  window.pageEstimates = pageEstimates = async function(c){
    await mfrLoadEstimateData2();
    const customers = window.mfrEstimateData2.customers || [];
    const jobs = window.mfrEstimateData2.jobs || [];
    const currentJobId = sessionStorage.getItem('current_job_id') || '';
    let job = jobs.find(j => j.id === currentJobId);
    if(job && job.customer_id) getState().customerId = job.customer_id;
    c.innerHTML = '<div class="page-wrap">'
      + '<div class="mfr-est-hero"><div><h1>Build an MFR Quote</h1><p>Simple dynamic estimate builder based on Brian\'s current quote options. Enter the roof squares, choose one roofing system, add upgrades, then save as a quote or invoice.</p></div><div class="mfr-action-row"><button class="btn btn-outline" style="background:#fff" onclick="go(\'estimates-list\')">Saved Estimates</button><button class="btn btn-outline" style="background:#fff" onclick="go(\'pricing\')">Pricing Rates</button></div></div>'
      + '<div class="mfr-est-shell"><main>'
      + '<div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Customer & Project</div><div class="mfr-est-panel-sub">Select a customer/project or create a new quote.</div></div></div><div class="mfr-est-panel-body"><div class="mfr-est-grid">'
      + '<div class="fg fg-full"><label class="fl">Existing Customer</label><select class="fs" id="e-customer-select" onchange="mfrEstimateCustomerChanged()"><option value="">Create New Customer</option>'+customers.map(cu => '<option value="'+esc(cu.id)+'" '+((getState().customerId||'')===cu.id?'selected':'')+'>'+esc(customerName(cu))+(cu.phone?' · '+esc(cu.phone):'')+'</option>').join('')+'</select></div>'
      + '<div class="fg fg-full"><label class="fl">Existing Project / Job</label><select class="fs" id="e-job-select" onchange="mfrEstimateJobChanged()"><option value="">Create New Project</option>'+jobs.map(j => '<option value="'+esc(j.id)+'" '+(currentJobId===j.id?'selected':'')+' data-customer="'+esc(j.customer_id||'')+'">'+esc(customerName(j.customers))+' · '+esc(j.status||'lead')+' · '+esc(fullAddress(j.customers)||'No address')+'</option>').join('')+'</select></div>'
      + '<div class="fg"><label class="fl">Customer Name</label><input class="fi" id="e-name" value=""></div><div class="fg"><label class="fl">Estimate Date</label><input class="fi" type="date" id="e-date" value="'+(window.mfrDateOnly?mfrDateOnly():new Date().toISOString().slice(0,10))+'"></div>'
      + '<div class="fg fg-full"><label class="fl">Project Address</label><input class="fi" id="e-addr" placeholder="Street, city, state, zip"></div><div class="fg"><label class="fl">Estimate #</label><input class="fi" id="e-number" value="'+(window.mfrRand?mfrRand('EST'):'EST-'+Date.now())+'"></div><div class="fg"><label class="fl">Deductible</label><input class="fi" id="e-deductible" type="number" value="0" oninput="mfrRenderEstimateSummary()"></div>'
      + '</div></div></div>'
      + '<div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Roof Size</div><div class="mfr-est-panel-sub">These cards recalculate instantly from the roof squares.</div></div><span class="mfr-nav-pill">PDF example: 21 sq</span></div><div class="mfr-est-panel-body"><div class="mfr-est-grid"><div class="fg"><label class="fl">Quoted Roof Squares</label><input class="fi" type="number" id="e-squares" value="21" min="0" step="0.1" oninput="mfrRenderEstimateProducts()"></div><div class="fg"><label class="fl">Pricing Source</label><input class="fi" value="Current MFR PDF pricing" readonly></div></div></div></div>'
      + '<div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Options · Choose One</div><div class="mfr-est-panel-sub">The total changes based on the roof squares above.</div></div></div><div class="mfr-est-panel-body"><div id="mfr-package-options"></div></div></div>'
      + '<div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Upgrades · Choose Any Number</div><div class="mfr-est-panel-sub">Quantities are editable. Sq-based upgrades default to the roof squares.</div></div></div><div class="mfr-est-panel-body"><div id="mfr-addon-options"></div></div></div>'
      + '<div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div class="mfr-est-panel-title">Terms & Notes</div></div><div class="mfr-est-panel-body"><div class="fg"><label class="fl">Estimate Notes</label><textarea class="fi" id="e-notes" rows="3" placeholder="Scope notes, insurance notes, color selections..."></textarea></div><div class="mfr-est-note">Terms follow the current MFR quote structure: customer may cancel until materials have been delivered; material delivery activates the full roofing contract; supplements and approved insurance payments are due when received.</div></div></div>'
      + '</main><aside class="mfr-est-summary-card"><div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Quote Summary</div><div class="mfr-est-panel-sub">Live total</div></div></div><div class="mfr-est-panel-body" id="mfr-est-summary"></div></div><div class="mfr-est-panel"><div class="mfr-est-panel-hd"><div><div class="mfr-est-panel-title">Saved Work</div><div class="mfr-est-panel-sub">Recent estimates/invoices</div></div></div><div class="mfr-est-panel-body" id="est-saved-list"><p style="color:var(--text3)">Loading...</p></div></div></aside></div></div>';
    await mfrApplyPreselectedCustomer();
    mfrRenderEstimateProducts();
    await mfrRefreshEstimateSideLists();
  };

  window.mfrLoadEstimateData2 = async function(){
    const [custRes, jobRes, rateRes, addonRes] = await Promise.all([
      _sb.from('customers').select('id, first_name, last_name, phone, email, address, city, state, zip').order('last_name', { ascending:true }),
      _sb.from('jobs').select('id, customer_id, status, contract_value, quote_code, customer_tracking_code, customers(id, first_name, last_name, phone, email, address, city, state, zip)').order('updated_at', { ascending:false }).limit(200),
      _sb.from('pricing_rates').select('*'),
      _sb.from('addon_pricing_rates').select('*')
    ]);
    window.mfrEstimateData2 = { customers:custRes.data || [], jobs:jobRes.data || [], rawRates:rateRes.data || [], rawAddons:addonRes.data || [] };
    window.mfrEstimatorOptions = normalizeRates(window.mfrEstimateData2.rawRates, P.options, 'option');
    window.mfrEstimatorAddons = normalizeRates(window.mfrEstimateData2.rawAddons, P.addons, 'addon');
  };

  window.mfrApplyPreselectedCustomer = async function(){
    const st = getState();
    const jobId = sessionStorage.getItem('current_job_id') || document.getElementById('e-job-select')?.value || '';
    if(jobId){ const j = (window.mfrEstimateData2.jobs||[]).find(x => x.id === jobId); if(j){ st.customerId = j.customer_id; document.getElementById('e-job-select').value = jobId; if(document.getElementById('e-customer-select')) document.getElementById('e-customer-select').value = j.customer_id || ''; } }
    await mfrEstimateCustomerChanged(false);
  };

  window.mfrEstimateCustomerChanged = async function(showToast=true){
    const id = document.getElementById('e-customer-select')?.value || getState().customerId || '';
    getState().customerId = id;
    const c = (window.mfrEstimateData2.customers || []).find(x => x.id === id);
    if(!c){ document.getElementById('e-name').value=''; document.getElementById('e-addr').value=''; return; }
    document.getElementById('e-name').value = customerName(c);
    document.getElementById('e-addr').value = fullAddress(c) || c.address || '';
    const jobSel = document.getElementById('e-job-select');
    if(jobSel && jobSel.value){ const opt = jobSel.selectedOptions[0]; if(opt && opt.dataset.customer !== id) jobSel.value = ''; }
    if(showToast && window.toast) toast('Customer loaded: '+customerName(c), 'success');
  };
  window.mfrEstimateJobChanged = async function(){
    const jobId = document.getElementById('e-job-select')?.value || '';
    if(!jobId){ sessionStorage.removeItem('current_job_id'); return; }
    sessionStorage.setItem('current_job_id', jobId);
    const j = (window.mfrEstimateData2.jobs || []).find(x => x.id === jobId);
    if(j){ getState().customerId = j.customer_id; document.getElementById('e-customer-select').value = j.customer_id || ''; await mfrEstimateCustomerChanged(false); }
  };

  window.mfrRenderEstimateProducts = function(){
    const sq = effectiveSquares(); const st = getState(); const options = window.mfrEstimatorOptions || P.options; const addons = window.mfrEstimatorAddons || P.addons;
    if(!st.packageKey) st.packageKey = 'duration_flex';
    const optEl = document.getElementById('mfr-package-options');
    if(optEl){ optEl.innerHTML = '<div class="mfr-est-package-grid">'+options.map(o => { const total = sq * Number(o.unit||0); return '<button type="button" class="mfr-est-package '+esc(o.cls||'')+' '+(st.packageKey===o.key?'selected':'')+'" onclick="mfrSelectEstimatePackage(\''+esc(o.key)+'\')"><span class="mfr-est-ribbon">'+esc(o.badge||'Option')+'</span><h3 class="mfr-est-package-name">'+esc(o.name)+'</h3><div><div class="mfr-est-price">'+money(total)+'<small>for '+sq+' sq</small></div><div class="mfr-est-rate">'+money(o.unit).replace('.00','')+'/sq · dynamic from current pricing</div></div><p class="mfr-est-desc">'+esc(o.desc||'')+'</p><div class="mfr-est-includes">'+(o.includes||[]).slice(0,8).map(i => '<span>'+esc(i)+'</span>').join('')+'</div><div class="mfr-finance-row"><span>Financing Available</span><strong>'+money((o.finance||0) * (sq / P.quoteSquares)).replace('$','$')+'/mo</strong></div></button>'; }).join('')+'</div>'; }
    const addEl = document.getElementById('mfr-addon-options');
    if(addEl){ addEl.innerHTML = '<div class="mfr-addon-list">'+addons.map(a => { const saved = st.addons[a.key] || {}; const qty = saved.qty !== undefined ? Number(saved.qty) : (a.unitLabel === 'sq' ? sq : a.qty); const active = !!saved.enabled; const total = active ? qty * Number(a.unit||0) : 0; return '<div class="mfr-addon '+(active?'active':'')+'"><div class="mfr-addon-top"><div><div class="mfr-addon-title">'+esc(a.name)+'</div><div class="mfr-addon-rate">'+money(a.unit)+'/'+esc(a.unitLabel||'unit')+' · PDF example '+money(a.total)+'</div></div><div class="mfr-addon-total">'+money(total)+'</div></div><div class="mfr-addon-desc">'+esc(a.desc||'')+'</div><div class="mfr-addon-controls"><label class="mfr-toggle"><input type="checkbox" '+(active?'checked':'')+' onchange="mfrToggleEstimateAddon(\''+esc(a.key)+'\', this.checked)"> Add upgrade</label><input class="mfr-qty" type="number" min="0" step="0.1" value="'+qty+'" oninput="mfrSetEstimateAddonQty(\''+esc(a.key)+'\', this.value)"><div style="font-size:11px;color:var(--text3);grid-column:1/-1">Quantity in '+esc(a.unitLabel||'unit')+'</div></div></div>'; }).join('')+'</div>'; }
    mfrRenderEstimateSummary();
  };
  window.mfrSelectEstimatePackage = function(key){ getState().packageKey = key; mfrRenderEstimateProducts(); };
  window.mfrToggleEstimateAddon = function(key, enabled){ const a = addonByKey(key); if(!getState().addons[key]) getState().addons[key] = { qty:a?.unitLabel === 'sq' ? effectiveSquares() : (a?.qty || 1) }; getState().addons[key].enabled = enabled; mfrRenderEstimateProducts(); };
  window.mfrSetEstimateAddonQty = function(key, qty){ if(!getState().addons[key]) getState().addons[key] = { enabled:false }; getState().addons[key].qty = Number(qty || 0); mfrRenderEstimateSummary(); mfrRenderEstimateProducts(); };
  window.mfrRenderEstimateSummary = function(){
    const el = document.getElementById('mfr-est-summary'); if(!el) return; const lines = estimateLines(); const total = estimateTotal(); const deposit = total * .5; const deductible = Number(document.getElementById('e-deductible')?.value || 0) || 0;
    el.innerHTML = '<div class="mfr-summary-lines">'+lines.map(l => '<div class="mfr-summary-line"><span>'+esc(l.item_name)+'<br><small>'+l.quantity+' '+esc(l.unit_label)+' × '+money(l.unit_price)+'</small></span><strong>'+money(l.total_price)+'</strong></div>').join('')+'</div><div class="mfr-total-big"><span>Total Quote</span><strong>'+money(total)+'</strong></div><div class="mfr-summary-lines" style="margin-top:12px"><div class="mfr-summary-line"><span>Deposit 50%</span><strong>'+money(deposit)+'</strong></div><div class="mfr-summary-line"><span>Balance</span><strong>'+money(total - deposit)+'</strong></div>'+(deductible?'<div class="mfr-summary-line"><span>Deductible entered</span><strong>'+money(deductible)+'</strong></div>':'')+'</div><div class="mfr-action-row"><button class="btn btn-outline" onclick="saveEstimate(\'draft\')">💾 Save Draft</button><button class="btn btn-primary" onclick="saveEstimate(\'sent\')">📤 Save & Send Quote</button><button class="btn btn-outline" onclick="window.print()">🖨️ Print</button></div>';
  };

  window.mfrEnsureCustomerForEstimate = async function(){
    const selected = document.getElementById('e-customer-select')?.value || ''; if(selected) return selected;
    const name = (document.getElementById('e-name')?.value || '').trim(); if(!name) throw new Error('Customer name is required.');
    const parts = name.split(/\s+/); const first = parts.shift() || name; const last = parts.join(' '); const addr = (document.getElementById('e-addr')?.value || '').trim();
    const res = await _sb.from('customers').insert({ first_name:first, last_name:last, address:addr || null, created_by:_user?.id || null, assigned_to:_user?.id || null }).select().single();
    if(res.error) throw res.error; return res.data.id;
  };
  window.mfrEnsureJobForEstimate = async function(customerId, total, sentMode){
    let jobId = document.getElementById('e-job-select')?.value || sessionStorage.getItem('current_job_id') || '';
    if(jobId){ const current = (window.mfrEstimateData2.jobs || []).find(j => j.id === jobId); return { id:jobId, oldStatus:current?.status || null, created:false }; }
    const status = sentMode ? 'estimate_sent' : 'lead';
    const res = await _sb.from('jobs').insert({ customer_id:customerId, assigned_to:_user?.id || null, status:status, contract_value:total || 0, quote_code: sentMode ? (window.mfrQuoteCode?mfrQuoteCode():('Q'+Date.now())) : null }).select().single();
    if(res.error) throw res.error; sessionStorage.setItem('current_job_id', res.data.id); return { id:res.data.id, oldStatus:null, created:true };
  };
  window.saveEstimate = async function(mode){
    mode = mode || 'draft'; const lines = estimateLines(); const total = estimateTotal(); if(!lines.length || total <= 0){ toast('Choose a roof option and enter roof squares first.', 'warn'); return; }
    try{
      const customerId = await mfrEnsureCustomerForEstimate(); const sent = mode === 'sent'; const jobPack = await mfrEnsureJobForEstimate(customerId, total, sent); const jobId = jobPack.id; const quoteCode = sent ? (window.mfrQuoteCode?mfrQuoteCode():('Q'+Date.now())) : null;
      const payload = { job_id:jobId, customer_id:customerId, estimate_number:(document.getElementById('e-number')?.value || (window.mfrRand?mfrRand('EST'):'EST-'+Date.now())).trim(), estimate_date:document.getElementById('e-date')?.value || (window.mfrDateOnly?mfrDateOnly():new Date().toISOString().slice(0,10)), status:sent?'sent':'draft', measured_squares:effectiveSquares(), waste_percent:0, billed_squares:effectiveSquares(), subtotal:total, discount_amount:0, tax_amount:0, total_amount:total, notes:document.getElementById('e-notes')?.value || '', terms:window.MFR_CURRENT_TERMS || '', quote_code:quoteCode, created_by:_user?.id || null };
      let estimateId = window.mfrCurrentEstimateId || '';
      let estRes = estimateId ? await _sb.from('estimates').update(payload).eq('id', estimateId).select().single() : await _sb.from('estimates').insert(payload).select().single();
      if(estRes.error) throw estRes.error; estimateId = estRes.data.id; window.mfrCurrentEstimateId = estimateId;
      let del = await _sb.from('estimate_line_items').delete().eq('estimate_id', estimateId); if(del.error && String(del.error.message||'').includes('estimate_id')) await _sb.from('estimate_line_items').delete().eq('job_id', jobId);
      let rows = lines.map(l => Object.assign({}, l, { estimate_id:estimateId, job_id:jobId }));
      let ins = await _sb.from('estimate_line_items').insert(rows);
      if(ins.error && String(ins.error.message||'').includes('estimate_id')){ rows = lines.map(l => Object.assign({}, l, { job_id:jobId })); ins = await _sb.from('estimate_line_items').insert(rows); }
      if(ins.error) throw ins.error;
      const jobUpdate = { contract_value:total, deductible:Number(document.getElementById('e-deductible')?.value||0)||0 }; if(sent){ jobUpdate.status='estimate_sent'; jobUpdate.quote_code=quoteCode; }
      const jobRes = await _sb.from('jobs').update(jobUpdate).eq('id', jobId); if(jobRes.error) throw jobRes.error;
      try{ await _sb.from('customer_notes').insert({ customer_id:customerId, job_id:jobId, created_by:_user?.id || null, note_type:'estimate', subject:sent?'Estimate sent':'Estimate saved', note_text:'Estimate '+payload.estimate_number+' saved for '+money(total)+'.' }); }catch(_e){}
      if(sent && jobPack.oldStatus !== 'estimate_sent' && typeof handleStatusChange === 'function'){ try{ await handleStatusChange(jobId, jobPack.oldStatus, 'estimate_sent'); }catch(_e){} }
      toast(sent?'Estimate saved and quote link created.':'Estimate draft saved.', 'success'); await mfrLoadEstimateData2(); await mfrRefreshEstimateSideLists(); if(sent) mfrShowQuoteLinks(jobId, quoteCode);
    }catch(e){ console.error('Estimate save failed', e); toast('Estimate save failed: '+(e.message||e), 'error'); }
  };

  async function getCustomersMap(ids){ ids = Array.from(new Set((ids||[]).filter(Boolean))); if(!ids.length) return new Map(); const res = await _sb.from('customers').select('id, first_name, last_name, address, city, state, zip, phone, email').in('id', ids); return new Map((res.data||[]).map(c => [c.id,c])); }
  window.mfrRefreshEstimateSideLists = async function(){
    const box = document.getElementById('est-saved-list'); if(!box) return; box.innerHTML = '<p style="color:var(--text3)">Loading...</p>';
    try{
      const [estRes, invRes] = await Promise.all([_sb.from('estimates').select('*').order('created_at',{ascending:false}).limit(6), _sb.from('invoices').select('*').order('created_at',{ascending:false}).limit(6)]);
      const est = estRes.data || []; const inv = invRes.data || []; const cmap = await getCustomersMap([].concat(est.map(e=>e.customer_id), inv.map(i=>i.customer_id)));
      box.innerHTML = '<div class="mfr-saved-list"><div style="font-weight:900;margin-bottom:4px">Recent Estimates</div>'+(est.length?est.map(e => '<button class="mfr-saved-row" onclick="viewEstimateModal(\''+e.id+'\')"><span><strong>'+esc(e.estimate_number||'Estimate')+'</strong><small>'+esc(customerName(cmap.get(e.customer_id)) || e.customer_name || 'Customer')+' · '+esc(e.status||'draft')+'</small></span><b>'+money(e.total_amount||e.subtotal||0)+'</b></button>').join(''):'<p style="color:var(--text3);font-size:13px">No saved estimates yet.</p>')+'<div style="font-weight:900;margin:10px 0 4px">Recent Invoices</div>'+(inv.length?inv.map(i => '<button class="mfr-saved-row" onclick="viewInvoiceModal(\''+i.id+'\')"><span><strong>'+esc(i.invoice_number||'Invoice')+'</strong><small>'+esc(customerName(cmap.get(i.customer_id)) || i.customer_name || 'Customer')+' · '+esc(i.status||'draft')+'</small></span><b>'+money((i.balance_due ?? i.total_amount) || 0)+'</b></button>').join(''):'<p style="color:var(--text3);font-size:13px">No invoices yet.</p>')+'</div>';
    }catch(e){ box.innerHTML = '<p style="color:#DC2626">Could not load saved estimates: '+esc(e.message||e)+'</p>'; }
  };
  window.pageEstimatesList = pageEstimatesList = async function(c){
    c.innerHTML = '<div class="page-wrap"><div class="page-hd"><div><div class="page-title">Estimates & Invoices</div><div class="page-sub">Saved quotes, invoice creation, and payment status.</div></div><button class="btn btn-primary" onclick="go(\'estimates\')">+ New Estimate</button></div><div class="card"><div class="card-hd"><div class="card-hd-title">Saved Estimates</div></div><div class="card-body" id="mfr-est-list">Loading...</div></div><div class="card"><div class="card-hd"><div class="card-hd-title">Invoices</div></div><div class="card-body" id="mfr-inv-list">Loading...</div></div></div>';
    const [estRes, invRes] = await Promise.all([_sb.from('estimates').select('*').order('created_at',{ascending:false}).limit(50), _sb.from('invoices').select('*').order('created_at',{ascending:false}).limit(50)]);
    const cmap = await getCustomersMap([].concat((estRes.data||[]).map(e=>e.customer_id),(invRes.data||[]).map(i=>i.customer_id)));
    document.getElementById('mfr-est-list').innerHTML = mfrRenderEstimateTable((estRes.data||[]).map(e => Object.assign({}, e, { customer_name:customerName(cmap.get(e.customer_id)) || e.customer_name })));
    document.getElementById('mfr-inv-list').innerHTML = mfrRenderInvoiceTable((invRes.data||[]).map(i => Object.assign({}, i, { customer_name:customerName(cmap.get(i.customer_id)) || i.customer_name })));
  };
  window.mfrRenderEstimateTable = function(rows){ if(!rows.length) return '<p style="color:var(--text3)">No saved estimates yet.</p>'; return '<table class="tbl"><thead><tr><th>Estimate</th><th>Customer</th><th>Status</th><th>Total</th><th>Date</th><th></th></tr></thead><tbody>'+rows.map(e => '<tr><td><strong>'+esc(e.estimate_number||'Estimate')+'</strong></td><td>'+esc(e.customer_name||'')+'</td><td><span class="badge badge-blue">'+esc(e.status||'draft')+'</span></td><td><strong>'+money(e.total_amount||0)+'</strong></td><td>'+(e.estimate_date?new Date(e.estimate_date).toLocaleDateString():'—')+'</td><td><button class="btn btn-sm btn-outline" onclick="viewEstimateModal(\''+e.id+'\')">View</button></td></tr>').join('')+'</tbody></table>'; };
  window.mfrRenderInvoiceTable = function(rows){ if(!rows.length) return '<p style="color:var(--text3)">No invoices yet.</p>'; return '<table class="tbl"><thead><tr><th>Invoice</th><th>Customer</th><th>Status</th><th>Total</th><th>Balance</th><th>Due</th><th></th></tr></thead><tbody>'+rows.map(i => '<tr><td><strong>'+esc(i.invoice_number||'Invoice')+'</strong></td><td>'+esc(i.customer_name||'')+'</td><td><span class="badge badge-'+(i.status==='paid'?'green':'blue')+'">'+esc(i.status||'draft')+'</span></td><td><strong>'+money(i.total_amount||0)+'</strong></td><td><strong>'+money((i.balance_due ?? i.total_amount)||0)+'</strong></td><td>'+(i.due_date?new Date(i.due_date).toLocaleDateString():'—')+'</td><td><button class="btn btn-sm btn-outline" onclick="viewInvoiceModal(\''+i.id+'\')">View</button></td></tr>').join('')+'</tbody></table>'; };
  window.viewEstimateModal = async function(id){
    try{
      const estRes = await _sb.from('estimates').select('*').eq('id', id).single(); if(estRes.error) throw estRes.error; const e = estRes.data;
      const cmap = await getCustomersMap([e.customer_id]); const cust = cmap.get(e.customer_id);
      let lineRes = await _sb.from('estimate_line_items').select('*').eq('estimate_id', id).order('display_order',{ascending:true});
      if(lineRes.error && String(lineRes.error.message||'').includes('estimate_id')) lineRes = await _sb.from('estimate_line_items').select('*').eq('job_id', e.job_id).order('display_order',{ascending:true});
      const lines = lineRes.data || [];
      const body = '<div class="mfr-quote-modal-head"><h3>My Family Roofer Quote</h3><div>'+esc(customerName(cust)||e.customer_name||'Customer')+' · '+money(e.total_amount||e.subtotal||0)+'</div></div>'
        + '<div class="mfr-summary-lines"><div class="mfr-summary-line"><span>Estimate #</span><strong>'+esc(e.estimate_number||'—')+'</strong></div><div class="mfr-summary-line"><span>Status</span><strong>'+esc(e.status||'draft')+'</strong></div><div class="mfr-summary-line"><span>Date</span><strong>'+(e.estimate_date?new Date(e.estimate_date).toLocaleDateString():'—')+'</strong></div></div>'
        + '<table class="mfr-line-table"><thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead><tbody>'+(lines.length?lines.map(l => '<tr><td><strong>'+esc(l.item_name||'Item')+'</strong><br><small>'+esc(l.item_type||'')+'</small></td><td>'+Number(l.quantity||0)+' '+esc(l.unit_label||'')+'</td><td>'+money(l.unit_price||0)+'</td><td><strong>'+money(l.total_price||0)+'</strong></td></tr>').join(''):'<tr><td colspan="4" style="text-align:center;color:#64748B">No line items found.</td></tr>')+'</tbody></table>'
        + '<div class="mfr-total-big"><span>Total</span><strong>'+money(e.total_amount||e.subtotal||0)+'</strong></div>'
        + '<div class="mfr-action-row"><button class="btn btn-primary" onclick="mfrShowQuoteLinks(\''+(e.job_id||'')+'\',\''+(e.quote_code||'')+'\')">Quote Link</button><button class="btn btn-success" onclick="convertEstimateToInvoice(\''+e.id+'\')">Convert to Invoice</button><button class="btn btn-outline" onclick="window.print()">Print</button></div>';
      mfrModal('Estimate '+esc(e.estimate_number||''), body, '980px');
    }catch(err){ console.error('View estimate failed', err); toast('Could not load estimate: '+(err.message||err), 'error'); }
  };
  window.convertEstimateToInvoice = async function(estimateId){
    try{
      const existing = await _sb.from('invoices').select('*').eq('estimate_id', estimateId).limit(1);
      if(existing.data && existing.data.length){ toast('Invoice already exists for this estimate.', 'warn'); viewInvoiceModal(existing.data[0].id); return; }
      const estRes = await _sb.from('estimates').select('*').eq('id', estimateId).single(); if(estRes.error) throw estRes.error; const e = estRes.data; const due = new Date(); due.setDate(due.getDate()+30);
      const invRes = await _sb.from('invoices').insert({ estimate_id:e.id, job_id:e.job_id, customer_id:e.customer_id, invoice_number:(window.mfrRand?mfrRand('INV'):'INV-'+Date.now()), invoice_date:(window.mfrDateOnly?mfrDateOnly():new Date().toISOString().slice(0,10)), due_date:(window.mfrDateOnly?mfrDateOnly(due):due.toISOString().slice(0,10)), status:'sent', subtotal:e.subtotal || e.total_amount || 0, discount_amount:e.discount_amount || 0, tax_amount:e.tax_amount || 0, total_amount:e.total_amount || e.subtotal || 0, amount_paid:0, balance_due:e.total_amount || e.subtotal || 0, notes:e.notes || '', created_by:_user?.id || null }).select().single();
      if(invRes.error) throw invRes.error; try{ await _sb.from('estimate_line_items').update({ invoice_id:invRes.data.id }).eq('estimate_id', estimateId); }catch(_e){}
      if(e.job_id){ const oldJob = await _sb.from('jobs').select('status').eq('id', e.job_id).single(); await _sb.from('jobs').update({ status:'invoiced', contract_value:e.total_amount || e.subtotal || 0 }).eq('id', e.job_id); if(typeof handleStatusChange === 'function') try{ await handleStatusChange(e.job_id, oldJob.data?.status || null, 'invoiced'); }catch(_e){} }
      toast('Invoice created.', 'success'); viewInvoiceModal(invRes.data.id);
    }catch(err){ console.error('Invoice create failed', err); toast('Could not create invoice: '+(err.message||err), 'error'); }
  };
  window.viewInvoiceModal = async function(id){
    try{ const invRes = await _sb.from('invoices').select('*').eq('id', id).single(); if(invRes.error) throw invRes.error; const i = invRes.data; const cmap = await getCustomersMap([i.customer_id]); const body = '<div class="mfr-quote-modal-head"><h3>Invoice '+esc(i.invoice_number||'')+'</h3><div>'+esc(customerName(cmap.get(i.customer_id))||'Customer')+'</div></div><div class="mfr-summary-lines"><div class="mfr-summary-line"><span>Invoice Date</span><strong>'+(i.invoice_date?new Date(i.invoice_date).toLocaleDateString():'—')+'</strong></div><div class="mfr-summary-line"><span>Due Date</span><strong>'+(i.due_date?new Date(i.due_date).toLocaleDateString():'—')+'</strong></div><div class="mfr-summary-line"><span>Status</span><strong>'+esc(i.status||'sent')+'</strong></div><div class="mfr-summary-line"><span>Total</span><strong>'+money(i.total_amount||0)+'</strong></div><div class="mfr-summary-line"><span>Balance</span><strong>'+money((i.balance_due ?? i.total_amount)||0)+'</strong></div></div><div class="mfr-action-row"><button class="btn btn-success" onclick="markInvoicePaid(\''+i.id+'\')">Mark Paid</button><button class="btn btn-outline" onclick="window.print()">Print</button></div>'; mfrModal('Invoice '+esc(i.invoice_number||''), body, '820px'); }catch(err){ toast('Could not load invoice: '+(err.message||err), 'error'); }
  };
  window.markInvoicePaid = async function(id){
    try{ const invRes = await _sb.from('invoices').select('*').eq('id', id).single(); if(invRes.error) throw invRes.error; const i = invRes.data; const upd = await _sb.from('invoices').update({ status:'paid', amount_paid:i.total_amount||0, balance_due:0, paid_at:new Date().toISOString() }).eq('id', id); if(upd.error) throw upd.error; if(i.job_id) await _sb.from('jobs').update({ status:'paid' }).eq('id', i.job_id); toast('Invoice marked paid.', 'success'); document.querySelector('.modal-overlay')?.remove(); await mfrRefreshEstimateSideLists(); }catch(err){ toast('Could not mark paid: '+(err.message||err), 'error'); }
  };
  window.mfrShowQuoteLinks = function(jobId, quoteCode){ if(!quoteCode){ toast('No quote link yet. Use Save & Send Quote first.', 'warn'); return; } const origin = location.origin; const quote = origin + '/quote.html?code=' + encodeURIComponent(quoteCode); const track = origin + '/track.html?code=' + encodeURIComponent(quoteCode); mfrModal('Quote Link', '<div class="form-grid"><div class="fg fg-full"><label class="fl">Customer signing link</label><input class="fi" readonly value="'+esc(quote)+'"></div><div class="fg fg-full"><label class="fl">Customer tracker link</label><input class="fi" readonly value="'+esc(track)+'"></div></div><div class="mfr-action-row"><button class="btn btn-primary" onclick="navigator.clipboard.writeText(\''+quote+'\');toast(\'Quote link copied\',\'success\')">Copy Quote Link</button><button class="btn btn-outline" onclick="navigator.clipboard.writeText(\''+track+'\');toast(\'Tracking link copied\',\'success\')">Copy Tracker Link</button></div>', '760px'); };
})();

