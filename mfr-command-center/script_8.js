

/* MFR Executive Reports Patch - owner/GM dashboard */
(function mfrExecutiveReportsPatch(){
  const REPORT_STATE = { rows: [], summary: {}, generatedAt: null };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const money = (v) => '$' + Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const money2 = (v) => '$' + Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (a,b) => b ? ((Number(a||0)/Number(b||0))*100).toFixed(1)+'%' : '0.0%';
  const label = (v) => String(v || 'unknown').replace(/_/g,' ').replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  const dateOnly = (v) => { if(!v) return '—'; const d = new Date(v); return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(); };
  const todayStart = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };
  const addDays = (n) => { const d = new Date(); d.setDate(d.getDate()+n); return d; };
  const isOverdue = (d) => d && new Date(d) < todayStart();
  const inNextDays = (d, days) => { if(!d) return false; const x = new Date(d); return x >= todayStart() && x <= addDays(days); };
  const custName = (c) => {
    if(!c) return 'Unknown';
    return [c.first_name, c.last_name].filter(Boolean).join(' ').trim() || c.name || c.customer_name || c.email || c.phone || 'Unknown';
  };

  async function safe(query, fallback){
    try {
      const r = await query;
      if (r.error) throw r.error;
      return r.data ?? fallback;
    } catch (e) {
      console.warn('Executive report query skipped:', e.message || e);
      return fallback;
    }
  }

  function sum(rows, field){
    return (rows || []).reduce((s,r) => s + Number(r?.[field] || 0), 0);
  }

  function countBy(rows, field){
    return (rows || []).reduce((acc,r) => {
      const key = r?.[field] || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  function getPeriodDays(){
    const el = document.getElementById('mfr-report-period');
    const v = el?.value || '30';
    if(v === 'mtd') {
      const d = new Date();
      return Math.max(1, Math.ceil((Date.now() - new Date(d.getFullYear(), d.getMonth(), 1).getTime()) / 86400000));
    }
    if(v === 'ytd') {
      const d = new Date();
      return Math.max(1, Math.ceil((Date.now() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400000));
    }
    return Number(v || 30);
  }

  async function loadExecData(){
    const days = getPeriodDays();
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const [jobs, tasks, appts, estimates, invoices, inspections, photos] = await Promise.all([
      safe(_sb.from('jobs').select('*').order('updated_at', {ascending:false}).limit(500), []),
      safe(_sb.from('tasks').select('*').order('created_at', {ascending:false}).limit(500), []),
      safe(_sb.from('appointments').select('*').order('scheduled_at', {ascending:true}).limit(500), []),
      safe(_sb.from('estimates').select('*').order('created_at', {ascending:false}).limit(500), []),
      safe(_sb.from('invoices').select('*').order('created_at', {ascending:false}).limit(500), []),
      safe(_sb.from('roof_inspections').select('*').order('updated_at', {ascending:false}).limit(500), []),
      safe(_sb.from('job_photos').select('*').order('created_at', {ascending:false}).limit(500), [])
    ]);

    const custIds = [...new Set([
      ...jobs.map(j=>j.customer_id),
      ...tasks.map(t=>t.customer_id),
      ...appts.map(a=>a.customer_id),
      ...estimates.map(e=>e.customer_id),
      ...invoices.map(i=>i.customer_id),
      ...inspections.map(i=>i.customer_id)
    ].filter(Boolean))];

    let customerMap = new Map();
    if(custIds.length){
      const customers = await safe(_sb.from('customers').select('*').in('id', custIds), []);
      customerMap = new Map(customers.map(c => [c.id, c]));
    }

    const periodJobs = jobs.filter(j => new Date(j.created_at || j.updated_at || 0) >= new Date(since));
    const periodEstimates = estimates.filter(e => new Date(e.created_at || 0) >= new Date(since));
    const periodInvoices = invoices.filter(i => new Date(i.created_at || i.invoice_date || 0) >= new Date(since));
    const statusCounts = countBy(jobs, 'status');
    const wonStatuses = ['contract_signed','claim_filed','claim_approved','in_production','complete','invoiced','paid'];
    const activeStatuses = ['lead','inspection_scheduled','inspected','estimate_sent','contract_signed','claim_filed','claim_approved','in_production'];
    const openTaskStatuses = ['pending','open','in-progress','in_progress'];
    const closedInvoiceStatuses = ['paid'];

    const openTasks = tasks.filter(t => openTaskStatuses.includes(String(t.status || '').toLowerCase()));
    const overdueTasks = openTasks.filter(t => isOverdue(t.due_date));
    const upcomingAppts = appts.filter(a => inNextDays(a.scheduled_at, 7) && !['cancelled','completed','no_show'].includes(String(a.status||'')));
    const todaysAppts = appts.filter(a => {
      if(!a.scheduled_at) return false;
      const d = new Date(a.scheduled_at);
      return d.toDateString() === new Date().toDateString();
    });
    const unpaidInvoices = invoices.filter(i => !closedInvoiceStatuses.includes(String(i.status || '').toLowerCase()) && Number(i.balance_due ?? i.total_amount ?? 0) > 0);
    const estimateFollowups = estimates.filter(e => {
      const st = String(e.status || '').toLowerCase();
      const dt = new Date(e.sent_at || e.updated_at || e.created_at || 0);
      return ['sent','estimate_sent','draft'].includes(st) && dt < addDays(-3);
    });

    const pipelineValue = jobs
      .filter(j => activeStatuses.includes(String(j.status || '').toLowerCase()))
      .reduce((s,j)=>s+Number(j.contract_value || j.estimated_value || j.total_amount || 0),0);

    const wonValue = jobs
      .filter(j => wonStatuses.includes(String(j.status || '').toLowerCase()))
      .reduce((s,j)=>s+Number(j.contract_value || j.estimated_value || j.total_amount || 0),0);

    const summary = {
      days,
      jobs, tasks, appts, estimates, invoices, inspections, photos, customerMap,
      periodJobs, periodEstimates, periodInvoices,
      totalLeads: periodJobs.length,
      inspectionsScheduled: jobs.filter(j => ['inspection_scheduled','inspected'].includes(String(j.status||''))).length,
      estimatesSent: jobs.filter(j => String(j.status||'') === 'estimate_sent').length,
      signedContracts: jobs.filter(j => String(j.status||'') === 'contract_signed').length,
      activeJobs: jobs.filter(j => activeStatuses.includes(String(j.status||'').toLowerCase())).length,
      inProduction: jobs.filter(j => String(j.status||'') === 'in_production').length,
      paidJobs: jobs.filter(j => String(j.status||'') === 'paid').length,
      pipelineValue,
      wonValue,
      estimatedTotal: sum(periodEstimates, 'total_amount'),
      invoicedTotal: sum(periodInvoices, 'total_amount'),
      collectedTotal: periodInvoices.reduce((s,i)=>s+Number(i.amount_paid || (String(i.status||'').toLowerCase()==='paid' ? i.total_amount : 0) || 0),0),
      outstandingTotal: unpaidInvoices.reduce((s,i)=>s+Number(i.balance_due ?? i.total_amount ?? 0),0),
      openTasks: openTasks.length,
      overdueTasks,
      upcomingAppts,
      todaysAppts,
      unpaidInvoices,
      estimateFollowups,
      statusCounts
    };

    REPORT_STATE.summary = summary;
    REPORT_STATE.generatedAt = new Date();

    return summary;
  }

  function statCard(labelText, value, sub, cls, onclick){
    return `<button class="mfr-report-stat ${cls||''}" ${onclick?`onclick="${onclick}"`:''}>
      <div class="mfr-report-stat-label">${esc(labelText)}</div>
      <div class="mfr-report-stat-value">${esc(value)}</div>
      ${sub ? `<div class="mfr-report-stat-sub">${esc(sub)}</div>` : ''}
    </button>`;
  }

  function stagePill(stage,count){
    return `<div class="mfr-stage-row"><span>${label(stage)}</span><strong>${count}</strong></div>`;
  }

  function actionList(s){
    const items = [];
    s.overdueTasks.slice(0,5).forEach(t => items.push({
      icon:'⚠️', title:t.title || 'Overdue task', meta:`Due ${dateOnly(t.due_date)} · ${label(t.priority || 'normal')}`, action:'go("tasks")'
    }));
    s.unpaidInvoices.slice(0,5).forEach(i => items.push({
      icon:'💵', title:`Invoice ${i.invoice_number || ''}`, meta:`${money2(i.balance_due ?? i.total_amount)} outstanding · due ${dateOnly(i.due_date)}`, action:'go("estimates-list")'
    }));
    s.estimateFollowups.slice(0,5).forEach(e => items.push({
      icon:'📞', title:`Follow up estimate ${e.estimate_number || ''}`, meta:`${money2(e.total_amount)} · ${dateOnly(e.created_at)}`, action:'go("tasks")'
    }));
    s.upcomingAppts.slice(0,5).forEach(a => items.push({
      icon:'📅', title:`${label(a.appt_type || a.appointment_type || 'appointment')}`, meta:`${new Date(a.scheduled_at).toLocaleString()} · ${label(a.status || 'scheduled')}`, action:'go("appointments")'
    }));

    if(!items.length) return `<div class="mfr-report-empty">No urgent items. Nothing needs immediate attention.</div>`;
    return items.slice(0,8).map(x => `<button class="mfr-action-row" onclick='${x.action}'>
      <span class="mfr-action-icon">${x.icon}</span>
      <span><strong>${esc(x.title)}</strong><small>${esc(x.meta)}</small></span>
    </button>`).join('');
  }

  function invoicesTable(s){
    const rows = s.unpaidInvoices.slice(0,6);
    if(!rows.length) return `<div class="mfr-report-empty">No unpaid invoices in the current view.</div>`;
    return `<table class="mfr-report-table"><thead><tr><th>Invoice</th><th>Status</th><th>Total</th><th>Balance</th><th>Due</th></tr></thead><tbody>`+
      rows.map(i => `<tr><td>${esc(i.invoice_number || 'Invoice')}</td><td><span class="mini-badge">${label(i.status||'sent')}</span></td><td>${money2(i.total_amount)}</td><td><strong>${money2(i.balance_due ?? i.total_amount)}</strong></td><td>${dateOnly(i.due_date)}</td></tr>`).join('')+
      `</tbody></table>`;
  }

  function marketingRows(s){
    const by = {};
    (s.jobs||[]).forEach(j => {
      const k = j.marketing_channel || j.lead_source || j.source || 'Unknown';
      by[k] = by[k] || { leads:0, estimates:0, won:0, revenue:0 };
      by[k].leads += 1;
      if(['estimate_sent','contract_signed','claim_filed','claim_approved','in_production','complete','invoiced','paid'].includes(String(j.status||''))) by[k].estimates += 1;
      if(['contract_signed','claim_filed','claim_approved','in_production','complete','invoiced','paid'].includes(String(j.status||''))) {
        by[k].won += 1; by[k].revenue += Number(j.contract_value || 0);
      }
    });
    const rows = Object.entries(by).sort((a,b)=>b[1].revenue-a[1].revenue).slice(0,8);
    if(!rows.length) return `<div class="mfr-report-empty">Marketing channel data will appear as jobs are added.</div>`;
    return `<table class="mfr-report-table"><thead><tr><th>Channel</th><th>Leads</th><th>Est.</th><th>Won</th><th>Lead → Won</th><th>Revenue</th></tr></thead><tbody>`+
      rows.map(([k,r]) => `<tr><td>${esc(k)}</td><td>${r.leads}</td><td>${r.estimates}</td><td>${r.won}</td><td>${pct(r.won,r.leads)}</td><td>${money(r.revenue)}</td></tr>`).join('')+
      `</tbody></table>`;
  }

  function renderExecReport(s){
    const statusOrder = ['lead','inspection_scheduled','inspected','estimate_sent','contract_signed','claim_filed','claim_approved','in_production','complete','invoiced','paid','lost'];
    const rangeLabel = s.days >= 360 ? 'Year to date' : s.days >= 28 && s.days <= 31 ? 'Last 30 days' : `Last ${s.days} days`;

    return `
      <div class="mfr-exec-reports">
        <div class="mfr-report-hero">
          <div>
            <div class="eyebrow">Owner / GM View</div>
            <h2>Executive Reports</h2>
            <p>High-level health of sales, production, invoices, team workload, and customer activity.</p>
          </div>
          <div class="mfr-report-controls">
            <select class="fi" id="mfr-report-period" onchange="mfrReloadExecutiveReports()">
              <option value="30" ${s.days===30?'selected':''}>Last 30 Days</option>
              <option value="90" ${s.days===90?'selected':''}>Last 90 Days</option>
              <option value="mtd">Month to Date</option>
              <option value="ytd">Year to Date</option>
            </select>
            <button class="btn btn-outline" onclick="mfrExportExecutiveReportCsv()">Export CSV</button>
            <button class="btn btn-primary" onclick="mfrPrintExecutiveReport()">Print Report</button>
          </div>
        </div>

        <div class="mfr-report-grid">
          ${statCard('Pipeline Value', money(s.pipelineValue), `${s.activeJobs} active jobs`, 'blue', 'go("pipeline")')}
          ${statCard('Won / Contracted', money(s.wonValue), `${s.signedContracts} signed contracts`, 'green', 'go("pipeline")')}
          ${statCard('Invoiced', money(s.invoicedTotal), `${s.periodInvoices.length} invoices · ${rangeLabel}`, 'purple', 'go("estimates-list")')}
          ${statCard('Outstanding', money(s.outstandingTotal), `${s.unpaidInvoices.length} unpaid invoices`, 'orange', 'go("estimates-list")')}
          ${statCard('Open Tasks', String(s.openTasks), `${s.overdueTasks.length} overdue`, s.overdueTasks.length?'red':'', 'go("tasks")')}
          ${statCard("Today's Appts", String(s.todaysAppts.length), `${s.upcomingAppts.length} next 7 days`, '', 'go("appointments")')}
        </div>

        <div class="mfr-report-layout">
          <div class="mfr-report-card wide">
            <div class="mfr-report-card-hd"><h3>Pipeline Health</h3><span>Current job stages</span></div>
            <div class="mfr-stage-list">${statusOrder.map(k => stagePill(k, s.statusCounts[k] || 0)).join('')}</div>
          </div>

          <div class="mfr-report-card">
            <div class="mfr-report-card-hd"><h3>Owner Attention</h3><span>What needs action</span></div>
            <div class="mfr-action-list">${actionList(s)}</div>
          </div>

          <div class="mfr-report-card wide">
            <div class="mfr-report-card-hd"><h3>Sales Conversion</h3><span>Lead → appointment → estimate → won</span></div>
            <div class="mfr-conversion-row">
              <div><strong>${s.totalLeads}</strong><span>New Leads</span></div>
              <div><strong>${s.todaysAppts.length + s.upcomingAppts.length}</strong><span>Scheduled Appts</span></div>
              <div><strong>${s.periodEstimates.length}</strong><span>Estimates</span></div>
              <div><strong>${s.signedContracts + s.inProduction + s.paidJobs}</strong><span>Won / Production</span></div>
            </div>
            ${marketingRows(s)}
          </div>

          <div class="mfr-report-card">
            <div class="mfr-report-card-hd"><h3>Invoices & Cash</h3><span>Outstanding balances</span></div>
            ${invoicesTable(s)}
          </div>

          <div class="mfr-report-card">
            <div class="mfr-report-card-hd"><h3>Field Operations</h3><span>Inspections, photos, production</span></div>
            <div class="mfr-mini-metrics">
              <div><span>Roof Inspections</span><strong>${s.inspections.length}</strong></div>
              <div><span>Job Photos</span><strong>${s.photos.length}</strong></div>
              <div><span>In Production</span><strong>${s.inProduction}</strong></div>
              <div><span>Completed/Paid</span><strong>${(s.statusCounts.complete||0)+(s.statusCounts.paid||0)}</strong></div>
            </div>
          </div>

          <div class="mfr-report-card">
            <div class="mfr-report-card-hd"><h3>Quick Links</h3><span>Drill into the details</span></div>
            <div class="mfr-report-links">
              <button onclick="go('sales-metrics')">Sales Metrics</button>
              <button onclick="go('marketing-roi')">Marketing ROI</button>
              <button onclick="go('pipeline')">Pipeline</button>
              <button onclick="go('tasks')">Tasks</button>
              <button onclick="go('inspection')">Roof Inspector</button>
              <button onclick="go('estimates-list')">Invoices</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  async function enhancedReports(c){
    c.innerHTML = `<div class="page-wrap"><div class="mfr-loading-card">Building executive report…</div></div>`;
    try {
      const s = await loadExecData();
      c.innerHTML = `<div class="page-wrap">${renderExecReport(s)}</div>`;
    } catch(err) {
      console.error(err);
      c.innerHTML = `<div class="page-wrap"><div class="empty-state"><div class="icon">⚠️</div><h3>Could not load reports</h3><p>${esc(err.message || err)}</p></div></div>`;
    }
  }

  window.mfrReloadExecutiveReports = async function(){
    const c = document.getElementById('content');
    if(c) await enhancedReports(c);
  };

  window.mfrExportExecutiveReportCsv = function(){
    const s = REPORT_STATE.summary || {};
    const lines = [
      ['Metric','Value'],
      ['Pipeline Value', s.pipelineValue || 0],
      ['Won / Contracted', s.wonValue || 0],
      ['Invoiced', s.invoicedTotal || 0],
      ['Collected', s.collectedTotal || 0],
      ['Outstanding', s.outstandingTotal || 0],
      ['Open Tasks', s.openTasks || 0],
      ['Overdue Tasks', (s.overdueTasks||[]).length],
      ['Upcoming Appointments', (s.upcomingAppts||[]).length],
      ['Roof Inspections', (s.inspections||[]).length],
      ['Job Photos', (s.photos||[]).length]
    ];
    const csv = lines.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'mfr-executive-report.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  window.mfrPrintExecutiveReport = function(){
    const s = REPORT_STATE.summary;
    if(!s){ if(typeof toast==='function') toast('Load the report first.', 'error'); return; }
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>MFR Executive Report</title>
      <style>
        body{font-family:Arial,sans-serif;color:#0f172a;margin:32px;background:#fff}
        h1{margin:0;color:#06163d;font-size:26px} .sub{color:#64748b;margin:6px 0 20px}
        .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px}
        .card{border:1px solid #dbe4f0;border-radius:12px;padding:14px} .label{font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:#64748b;font-weight:800}
        .val{font-size:25px;font-weight:900;margin-top:6px}.section{margin-top:24px}.row{display:flex;justify-content:space-between;border-bottom:1px solid #eef2f7;padding:8px 0}
        table{width:100%;border-collapse:collapse;margin-top:10px} th,td{text-align:left;border-bottom:1px solid #e5e7eb;padding:8px;font-size:12px} th{background:#f8fafc;text-transform:uppercase;letter-spacing:.08em}
        @page{size:letter;margin:.45in}
      </style></head><body>
      <h1>My Family Roofer Executive Report</h1><div class="sub">Generated ${new Date().toLocaleString()}</div>
      <div class="grid">
        <div class="card"><div class="label">Pipeline Value</div><div class="val">${money(s.pipelineValue)}</div></div>
        <div class="card"><div class="label">Won / Contracted</div><div class="val">${money(s.wonValue)}</div></div>
        <div class="card"><div class="label">Outstanding</div><div class="val">${money(s.outstandingTotal)}</div></div>
        <div class="card"><div class="label">Open Tasks</div><div class="val">${s.openTasks}</div></div>
        <div class="card"><div class="label">Overdue Tasks</div><div class="val">${s.overdueTasks.length}</div></div>
        <div class="card"><div class="label">Upcoming Appts</div><div class="val">${s.upcomingAppts.length}</div></div>
      </div>
      <div class="section"><h2>Pipeline Stages</h2>${Object.entries(s.statusCounts||{}).map(([k,v])=>`<div class="row"><span>${label(k)}</span><strong>${v}</strong></div>`).join('')}</div>
      <div class="section"><h2>Outstanding Invoices</h2>${invoicesTable(s)}</div>
      

</body></html>`;
    const w = window.open('', '_blank');
    if(!w){ if(typeof toast==='function') toast('Popup blocked.', 'error'); return; }
    w.document.open(); w.document.write(html); w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch(e){} }, 350);
  };

  const style = document.createElement('style');
  style.textContent = `
    .mfr-loading-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:28px;font-weight:800;color:#475569;box-shadow:0 8px 24px rgba(15,23,42,.06)}
    .mfr-report-hero{background:linear-gradient(135deg,#06163d,#0b5ed7);color:#fff;border-radius:24px;padding:26px;display:flex;justify-content:space-between;gap:18px;align-items:flex-end;box-shadow:0 20px 50px rgba(6,22,61,.18)}
    .mfr-report-hero .eyebrow{font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#93c5fd}.mfr-report-hero h2{font-size:34px;margin:8px 0 8px}.mfr-report-hero p{margin:0;max-width:720px;color:#dbeafe;line-height:1.5}
    .mfr-report-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mfr-report-controls .fi{background:#fff;min-width:150px}
    .mfr-report-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin:16px 0}.mfr-report-stat{text-align:left;background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:16px;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,.04);transition:.15s}.mfr-report-stat:hover{transform:translateY(-2px);box-shadow:0 14px 32px rgba(15,23,42,.08)}
    .mfr-report-stat.blue{border-top:4px solid #2563eb}.mfr-report-stat.green{border-top:4px solid #16a34a}.mfr-report-stat.orange{border-top:4px solid #f97316}.mfr-report-stat.purple{border-top:4px solid #7c3aed}.mfr-report-stat.red{border-top:4px solid #dc2626}
    .mfr-report-stat-label{font-size:11px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#64748b}.mfr-report-stat-value{font-size:26px;font-weight:950;margin:8px 0 4px;color:#0f172a}.mfr-report-stat-sub{font-size:12px;color:#64748b;font-weight:700}
    .mfr-report-layout{display:grid;grid-template-columns:1.2fr .8fr;gap:14px}.mfr-report-card{background:#fff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,.04)}.mfr-report-card.wide{min-height:280px}
    .mfr-report-card-hd{padding:16px 18px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;gap:10px;align-items:center}.mfr-report-card-hd h3{margin:0;font-size:18px}.mfr-report-card-hd span{font-size:12px;color:#64748b;font-weight:700}
    .mfr-stage-list{padding:12px 18px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.mfr-stage-row{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;background:#f8fafc;font-weight:800}.mfr-stage-row span{font-size:13px;color:#475569}
    .mfr-action-list{padding:12px 16px}.mfr-action-row{width:100%;display:flex;gap:10px;text-align:left;border:1px solid #e2e8f0;border-radius:14px;padding:10px;background:#fff;margin-bottom:8px;cursor:pointer}.mfr-action-row:hover{background:#f8fafc}.mfr-action-icon{width:34px;height:34px;border-radius:10px;background:#eef2ff;display:flex;align-items:center;justify-content:center}.mfr-action-row strong{display:block}.mfr-action-row small{display:block;color:#64748b;margin-top:3px}
    .mfr-conversion-row{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:16px 18px}.mfr-conversion-row div{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#f8fafc}.mfr-conversion-row strong{display:block;font-size:24px}.mfr-conversion-row span{font-size:12px;color:#64748b;font-weight:800}
    .mfr-report-table{width:100%;border-collapse:collapse}.mfr-report-table th,.mfr-report-table td{padding:10px 12px;border-bottom:1px solid #eef2f7;text-align:left;font-size:13px}.mfr-report-table th{background:#f8fafc;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.1em}.mini-badge{background:#eef2ff;color:#1d4ed8;border-radius:999px;padding:4px 8px;font-size:11px;font-weight:900}
    .mfr-mini-metrics{padding:14px 18px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mfr-mini-metrics div{background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px}.mfr-mini-metrics span{display:block;color:#64748b;font-size:12px;font-weight:800}.mfr-mini-metrics strong{display:block;font-size:24px;margin-top:5px}
    .mfr-report-links{padding:14px 18px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.mfr-report-links button{border:1px solid #dbe4f0;background:#fff;border-radius:12px;padding:11px;font-weight:900;cursor:pointer}.mfr-report-links button:hover{background:#f8fafc}
    .mfr-report-empty{padding:18px;color:#64748b;font-weight:700}
    @media(max-width:1100px){.mfr-report-grid{grid-template-columns:repeat(3,1fr)}.mfr-report-layout{grid-template-columns:1fr}.mfr-report-hero{align-items:flex-start;flex-direction:column}.mfr-stage-list{grid-template-columns:1fr}}
    @media(max-width:720px){.mfr-report-grid{grid-template-columns:repeat(2,1fr)}.mfr-conversion-row{grid-template-columns:repeat(2,1fr)}.mfr-report-hero h2{font-size:28px}.mfr-report-controls{width:100%}.mfr-report-controls .btn,.mfr-report-controls .fi{width:100%}}
  `;
  document.head.appendChild(style);

  try { pageReports = enhancedReports; } catch(e) {}
  window.pageReports = enhancedReports;
})();

