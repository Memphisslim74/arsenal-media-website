
/* ─────────────────────────────────────────────────────────────
   ROOF INSPECTOR PRO PATCH
   Guided checklist/templates/reporting workflow.
───────────────────────────────────────────────────────────── */
(function mfrRoofInspectorPro(){
  const STATUS = {
    good:      { label:'Good', color:'good', icon:'✓' },
    attention: { label:'Attention', color:'warn', icon:'!' },
    failed:    { label:'Failed', color:'bad', icon:'✕' },
    na:        { label:'N/A', color:'na', icon:'—' }
  };

  const TEMPLATES = {
    damage: {
      key:'damage',
      name:'Damage Inspection: Roofing',
      desc:'Storm damage inspection for hail, wind, water intrusion, gutters, penetrations, and supplement notes.',
      sections:[
        ['Property & Safety', ['Confirm property address and homeowner contact','Document weather/date/time and roof access conditions','Confirm ladder setup and ground hazards','Photograph each elevation before close inspection']],
        ['Roof Surface', ['Check overall shingle condition','Look for hail bruising/impact marks','Check wind creases, lifted tabs, missing shingles','Document granule loss and exposed mat','Inspect soft metals for collateral damage']],
        ['Edges, Flashing & Penetrations', ['Inspect drip edge, eaves, and rakes','Check step flashing and sidewalls','Check headwall flashing','Inspect pipe boots and neoprene collars','Inspect vents, furnace caps, skylights, and chimney flashing']],
        ['Gutters & Exterior', ['Inspect gutters for dents and impact marks','Inspect downspouts, screens, and leaf guards','Check fascia/soffit damage','Check siding, windows, screens, fence, deck, and HVAC collateral']],
        ['Interior / Leak Risk', ['Ask homeowner about leaks or stains','Check attic or ceiling stains if accessible','Document active leak risk areas','Note emergency tarp or temporary repair needs']],
        ['Insurance / Supplement Notes', ['Compare visible damage to insurance scope','Flag missing code items','Flag missing accessories or ventilation items','Document supplement opportunities with photos']]
      ]
    },
    replacement: {
      key:'replacement',
      name:'Roof Replacement',
      desc:'Pre-production roof replacement checklist for tear-off, materials, ventilation, code, and install readiness.',
      sections:[
        ['Pre-Job Verification', ['Confirm selected roof system and upgrades','Confirm roof squares/waste factor','Confirm color and material choice','Confirm HOA requirements if applicable','Confirm access, parking, and dumpster placement']],
        ['Code / System Requirements', ['Ice & water locations verified','Synthetic underlayment verified','Drip edge eaves/rakes verified','Starter strip requirements verified','Ventilation calculation reviewed','Required nails/fasteners verified']],
        ['Roof Components', ['Pipe boots counted','Ridge vent/box vents counted','Step flashing locations counted','Headwall/sidewall locations counted','Bathroom/kitchen/furnace vents counted','Skylights/chimneys/special penetrations documented']],
        ['Production Risk', ['Steep/high roof areas noted','Decking concerns noted','Landscaping/protection needs noted','Satellite/dish/solar concerns noted','Neighbor/property line concerns noted']],
        ['Customer Communication', ['Explain timeline and material delivery','Explain no-obligation/material delivery terms','Confirm best communication method','Confirm final walkthrough expectation']]
      ]
    },
    final: {
      key:'final',
      name:'Final Walkthrough',
      desc:'Closeout checklist for workmanship, cleanup, photos, warranty, and customer satisfaction.',
      sections:[
        ['Roof Finish', ['Roof field appears complete and clean','Ridge/hip caps installed correctly','Starter/edge detail clean','Valleys and transitions clean','Flashing and penetrations sealed correctly']],
        ['Ventilation & Accessories', ['Ridge vents/vents installed as planned','Pipe boots installed and sealed','Bathroom/furnace vents complete','Gutters/downspouts/leaf guards complete if included']],
        ['Cleanup', ['Ground cleanup complete','Magnet sweep completed','Driveway and walkways cleared','Leftover materials handled','Customer property restored']],
        ['Documentation', ['Final photos uploaded','Warranty items confirmed','Invoice status reviewed','Customer review request prepared','Outstanding punch list noted']]
      ]
    },
    supplement: {
      key:'supplement',
      name:'Supplement Review',
      desc:'Checklist to support insurance supplementing and missing scope documentation.',
      sections:[
        ['Scope Review', ['Insurance estimate uploaded/reviewed','Roofing line items compared','Accessories compared','Code requirements compared','Labor/access complexity reviewed']],
        ['Missing Items', ['Ice & water / underlayment missing or short','Drip edge missing or short','Starter/ridge/hip missing or short','Ventilation items missing','Flashing/pipe boots/vents missing','Gutters/exterior collateral missing']],
        ['Evidence Package', ['Photos attached by item','Measurements or report attached','Notes written in carrier-friendly language','Customer communication documented','Supplement tasks created if needed']]
      ]
    }
  };

  let state = { jobs:[], inspections:[], current:null, selectedJobId:'', templateKey:'damage', root:null };

  function h(v){ return String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
  function money(v){ return '$' + Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}); }
  function date(v){ if(!v) return '—'; try{return new Date(v).toLocaleDateString();}catch(e){return '—';} }
  function custName(job){
    const c = job?.customers || {};
    return c.name || [c.first_name,c.last_name].filter(Boolean).join(' ') || job?.customer_name || 'Unknown Customer';
  }
  function jobAddr(job){
    const c = job?.customers || {};
    return [c.address || job?.address, c.city, c.state, c.zip].filter(Boolean).join(', ') || 'No address';
  }
  async function safe(q, fallback){
    try { const r = await q; if(r.error) throw r.error; return r.data ?? fallback; }
    catch(e){ console.warn('Roof Inspector query skipped:', e.message || e); return fallback; }
  }

  function blankInspection(templateKey){
    const t = TEMPLATES[templateKey] || TEMPLATES.damage;
    return {
      id:null,
      template_key:t.key,
      template_name:t.name,
      status:'draft',
      overall_condition:'Needs Review',
      recommended_action:'Prepare inspection report',
      roof_squares:'',
      weather:'',
      summary:'',
      sections:t.sections.map(([title, items]) => ({
        title,
        items: items.map(label => ({ label, status:'na', note:'' }))
      }))
    };
  }

  function counts(cur){
    const all = (cur?.sections || []).flatMap(s => s.items || []);
    return {
      total: all.length,
      good: all.filter(i => i.status === 'good').length,
      attention: all.filter(i => i.status === 'attention').length,
      failed: all.filter(i => i.status === 'failed').length,
      na: all.filter(i => i.status === 'na').length
    };
  }

  function selectedJob(){ return state.jobs.find(j => String(j.id) === String(state.selectedJobId)) || null; }

  async function loadData(){
    state.jobs = await safe(_sb.from('jobs').select('*, customers(*)').order('updated_at',{ascending:false}).limit(300), []);
    state.inspections = await safe(_sb.from('roof_inspections').select('*').order('updated_at',{ascending:false}).limit(100), []);
    if(!state.current) state.current = blankInspection(state.templateKey);
  }

  function templateCard(key){
    const t = TEMPLATES[key];
    const active = state.templateKey === key ? 'active' : '';
    return `<button class="mfr-insp-template ${active}" onclick="mfrSelectInspectionTemplate('${key}')">
      <div class="mfr-insp-template-title">${h(t.name)}</div>
      <div class="mfr-insp-template-desc">${h(t.desc)}</div>
    </button>`;
  }

  function renderStatusButtons(si, ii, item){
    return Object.entries(STATUS).map(([key, s]) =>
      `<button class="mfr-insp-status ${s.color} ${item.status===key?'active':''}" onclick="mfrSetInspectionStatus(${si},${ii},'${key}')"><span>${s.icon}</span>${s.label}</button>`
    ).join('');
  }

  function renderChecklist(){
    const cur = state.current || blankInspection(state.templateKey);
    return (cur.sections || []).map((section, si) => `
      <div class="mfr-insp-section">
        <div class="mfr-insp-section-hd">
          <div><strong>${h(section.title)}</strong><span>${(section.items || []).length} checks</span></div>
        </div>
        ${(section.items || []).map((item, ii) => `
          <div class="mfr-insp-item">
            <div class="mfr-insp-item-main">
              <div class="mfr-insp-item-title">${h(item.label)}</div>
              <div class="mfr-insp-status-row">${renderStatusButtons(si, ii, item)}</div>
            </div>
            <textarea class="mfr-insp-note" placeholder="Notes, damage location, photo reference, supplement note..." oninput="mfrSetInspectionNote(${si},${ii},this.value)">${h(item.note || '')}</textarea>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  function renderSavedInspections(){
    if(!state.inspections.length) return '<div class="mfr-insp-empty-small">No saved inspections yet.</div>';
    return state.inspections.slice(0,8).map(i => {
      const j = state.jobs.find(x => String(x.id) === String(i.job_id)) || {};
      return `<div class="mfr-insp-saved" onclick="mfrLoadInspection('${h(i.id)}')">
        <div><strong>${h(i.template_name || i.template_key || 'Inspection')}</strong><span>${h(custName(j))}</span></div>
        <em>${h(i.status || 'draft')} · ${date(i.updated_at || i.created_at)}</em>
      </div>`;
    }).join('');
  }

  function buildSummaryText(){
    const cur = state.current || blankInspection(state.templateKey);
    const c = counts(cur);
    const concerns = [];
    (cur.sections || []).forEach(sec => (sec.items || []).forEach(item => {
      if(['attention','failed'].includes(item.status)) concerns.push(`${sec.title}: ${item.label}${item.note ? ' — ' + item.note : ''}`);
    }));
    const job = selectedJob();
    const line1 = `${cur.template_name || 'Roof Inspection'} for ${custName(job)} at ${jobAddr(job)}.`;
    const line2 = `Inspection completed with ${c.good} items marked good, ${c.attention} requiring attention, ${c.failed} failed, and ${c.na} marked N/A.`;
    const line3 = concerns.length ? `Primary findings: ${concerns.slice(0,6).join('; ')}.` : 'No major concerns were marked during this inspection.';
    const line4 = `Recommended action: ${cur.recommended_action || 'Review findings and determine next step.'}`;
    return [line1,line2,line3,line4].join('\n\n');
  }

  function render(){
    const cur = state.current || blankInspection(state.templateKey);
    const cts = counts(cur);
    const jobsOptions = ['<option value="">Choose project/job...</option>'].concat(state.jobs.map(j =>
      `<option value="${h(j.id)}" ${state.selectedJobId===j.id?'selected':''}>${h(custName(j))} — ${h(jobAddr(j))} — ${h(j.status || '')}</option>`
    )).join('');
    const templates = Object.keys(TEMPLATES).map(templateCard).join('');
    state.root.innerHTML = `<div class="page-wrap mfr-insp-page">
      <div class="page-hd mfr-insp-hd">
        <div>
          <div class="page-title">Roof Inspector Pro</div>
          <div class="page-sub">Guided templates, checklist status, notes, report generation, and job-ready documentation.</div>
        </div>
        <div class="mfr-insp-actions">
          <button class="btn btn-outline" onclick="mfrNewInspection()">+ New Inspection</button>
          <button class="btn btn-primary" onclick="mfrSaveInspection()">Save Inspection</button>
          <button class="btn btn-success" onclick="mfrPrintInspectionReport()">Print Report</button>
        </div>
      </div>

      <div class="mfr-insp-grid">
        <aside class="mfr-insp-left">
          <div class="card"><div class="card-hd"><div class="card-hd-title">Project</div></div><div class="card-body">
            <label class="fl">Attach inspection to project/job</label>
            <select class="fs" onchange="stateNotUsed=1;mfrSetInspectionJob(this.value)">${jobsOptions}</select>
            <div class="mfr-insp-job-card">${selectedJob() ? `<strong>${h(custName(selectedJob()))}</strong><span>${h(jobAddr(selectedJob()))}</span><em>Status: ${h(selectedJob().status || '—')}</em>` : '<span>Select a job to tie inspection notes/photos/report back to the project.</span>'}</div>
          </div></div>

          <div class="card"><div class="card-hd"><div class="card-hd-title">Templates</div></div><div class="card-body mfr-insp-template-list">${templates}</div></div>

          <div class="card"><div class="card-hd"><div class="card-hd-title">Saved Inspections</div></div><div class="card-body">${renderSavedInspections()}</div></div>
        </aside>

        <main class="mfr-insp-main">
          <div class="mfr-insp-hero">
            <div>
              <div class="mfr-insp-kicker">Current Template</div>
              <h2>${h(cur.template_name)}</h2>
              <p>${h((TEMPLATES[cur.template_key] || TEMPLATES.damage).desc)}</p>
            </div>
            <div class="mfr-insp-score">
              <strong>${cts.good}/${cts.total}</strong>
              <span>checks marked good</span>
            </div>
          </div>

          <div class="mfr-insp-stats">
            <div class="mfr-insp-stat"><span>Total Checks</span><strong>${cts.total}</strong></div>
            <div class="mfr-insp-stat good"><span>Good</span><strong>${cts.good}</strong></div>
            <div class="mfr-insp-stat warn"><span>Attention</span><strong>${cts.attention}</strong></div>
            <div class="mfr-insp-stat bad"><span>Failed</span><strong>${cts.failed}</strong></div>
          </div>

          <div class="card"><div class="card-hd"><div class="card-hd-title">Inspection Details</div></div><div class="card-body">
            <div class="form-grid">
              <div class="fg"><label class="fl">Inspection Status</label><select class="fs" onchange="mfrSetInspectionField('status',this.value)"><option value="draft" ${cur.status==='draft'?'selected':''}>Draft</option><option value="in_progress" ${cur.status==='in_progress'?'selected':''}>In Progress</option><option value="complete" ${cur.status==='complete'?'selected':''}>Complete</option></select></div>
              <div class="fg"><label class="fl">Overall Condition</label><select class="fs" onchange="mfrSetInspectionField('overall_condition',this.value)"><option ${cur.overall_condition==='Good'?'selected':''}>Good</option><option ${cur.overall_condition==='Needs Review'?'selected':''}>Needs Review</option><option ${cur.overall_condition==='Storm Damage Present'?'selected':''}>Storm Damage Present</option><option ${cur.overall_condition==='Replacement Recommended'?'selected':''}>Replacement Recommended</option><option ${cur.overall_condition==='Repair Recommended'?'selected':''}>Repair Recommended</option></select></div>
              <div class="fg"><label class="fl">Roof Squares</label><input class="fi" value="${h(cur.roof_squares || '')}" placeholder="21" oninput="mfrSetInspectionField('roof_squares',this.value)"></div>
              <div class="fg"><label class="fl">Weather / Conditions</label><input class="fi" value="${h(cur.weather || '')}" placeholder="Clear, dry, 72°F" oninput="mfrSetInspectionField('weather',this.value)"></div>
              <div class="fg fg-full"><label class="fl">Recommended Action</label><input class="fi" value="${h(cur.recommended_action || '')}" placeholder="Prepare estimate / supplement / repair recommendation" oninput="mfrSetInspectionField('recommended_action',this.value)"></div>
              <div class="fg fg-full"><label class="fl">Report Summary</label><textarea class="fi" rows="4" oninput="mfrSetInspectionField('summary',this.value)">${h(cur.summary || buildSummaryText())}</textarea></div>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">
              <button class="btn btn-outline" onclick="mfrGenerateInspectionSummary()">Generate Summary From Checklist</button>
              <button class="btn btn-outline" onclick="mfrCreateInspectionTasks()">Create Follow-Up Tasks</button>
              <button class="btn btn-outline" onclick="go('photos')">Open Photo Center</button>
            </div>
          </div></div>

          <div class="card"><div class="card-hd"><div class="card-hd-title">Guided Checklist</div><span style="font-size:12px;color:var(--text3)">Tap status and add notes/photos references</span></div><div class="card-body mfr-insp-checklist">${renderChecklist()}</div></div>
        </main>
      </div>
    </div>`;
  }

  window.pageInspection = async function(c){
    state.root = c;
    c.innerHTML = '<div class="page-wrap"><div class="loading">Loading Roof Inspector Pro...</div></div>';
    await loadData();
    render();
  };

  window.mfrSelectInspectionTemplate = function(key){
    state.templateKey = key;
    state.current = blankInspection(key);
    render();
  };

  window.mfrNewInspection = function(){
    state.current = blankInspection(state.templateKey);
    render();
  };

  window.mfrSetInspectionJob = function(jobId){
    state.selectedJobId = jobId || '';
    render();
  };

  window.mfrSetInspectionField = function(field, value){
    if(!state.current) state.current = blankInspection(state.templateKey);
    state.current[field] = value;
  };

  window.mfrSetInspectionStatus = function(si, ii, status){
    if(!state.current?.sections?.[si]?.items?.[ii]) return;
    state.current.sections[si].items[ii].status = status;
    render();
  };

  window.mfrSetInspectionNote = function(si, ii, value){
    if(!state.current?.sections?.[si]?.items?.[ii]) return;
    state.current.sections[si].items[ii].note = value;
  };

  window.mfrGenerateInspectionSummary = function(){
    if(!state.current) return;
    state.current.summary = buildSummaryText();
    render();
    toast('Inspection summary generated.', 'success');
  };

  window.mfrSaveInspection = async function(){
    if(!state.current) state.current = blankInspection(state.templateKey);
    const job = selectedJob();
    if(!job){ toast('Select a project/job first.', 'error'); return; }
    try{
      const cur = state.current;
      const payload = {
        job_id: job.id,
        customer_id: job.customer_id || null,
        template_key: cur.template_key,
        template_name: cur.template_name,
        status: cur.status || 'draft',
        overall_condition: cur.overall_condition || null,
        recommended_action: cur.recommended_action || null,
        roof_squares: cur.roof_squares ? Number(cur.roof_squares) : null,
        weather: cur.weather || null,
        findings: { sections: cur.sections, counts: counts(cur) },
        summary: cur.summary || buildSummaryText(),
        updated_at: new Date().toISOString()
      };
      if(cur.status === 'complete') payload.completed_at = new Date().toISOString();
      let res;
      if(cur.id){
        res = await _sb.from('roof_inspections').update(payload).eq('id', cur.id).select().single();
      } else {
        payload.created_by = _user?.id || null;
        res = await _sb.from('roof_inspections').insert(payload).select().single();
      }
      if(res.error) throw res.error;
      state.current.id = res.data.id;
      try{
        await _sb.from('customer_notes').insert({
          customer_id: job.customer_id || null,
          job_id: job.id,
          created_by: _user?.id || null,
          note_type:'inspection',
          subject:'Roof inspection saved',
          note_text:(cur.template_name || 'Roof inspection') + ' saved. ' + (payload.summary || '').slice(0,500)
        });
      }catch(e){}
      await loadData();
      render();
      toast('Roof inspection saved.', 'success');
    }catch(err){
      toast('Could not save inspection: ' + (err.message || err), 'error');
    }
  };

  window.mfrLoadInspection = async function(id){
    try{
      const r = await _sb.from('roof_inspections').select('*').eq('id', id).single();
      if(r.error) throw r.error;
      const i = r.data;
      state.selectedJobId = i.job_id || '';
      state.templateKey = i.template_key || 'damage';
      const base = blankInspection(state.templateKey);
      state.current = {
        ...base,
        id:i.id,
        template_key:i.template_key || base.template_key,
        template_name:i.template_name || base.template_name,
        status:i.status || 'draft',
        overall_condition:i.overall_condition || base.overall_condition,
        recommended_action:i.recommended_action || base.recommended_action,
        roof_squares:i.roof_squares || '',
        weather:i.weather || '',
        summary:i.summary || '',
        sections:i.findings?.sections || base.sections
      };
      render();
      toast('Inspection loaded.', 'success');
    }catch(err){ toast('Could not load inspection: ' + (err.message || err), 'error'); }
  };

  window.mfrCreateInspectionTasks = async function(){
    const job = selectedJob();
    if(!job || !state.current){ toast('Select a job and complete inspection notes first.', 'error'); return; }
    const issues = [];
    (state.current.sections || []).forEach(sec => (sec.items || []).forEach(item => {
      if(['attention','failed'].includes(item.status)) issues.push({sec:sec.title, item});
    }));
    if(!issues.length){ toast('No failed/attention items to turn into tasks.', 'info'); return; }
    try{
      const rows = issues.slice(0,8).map(x => ({
        job_id: job.id,
        customer_id: job.customer_id || null,
        assigned_to: job.assigned_to || _user?.id || null,
        created_by: _user?.id || null,
        task_type:'inspection-follow-up',
        title:x.item.status === 'failed' ? 'Resolve failed inspection item' : 'Review inspection item',
        description:x.sec + ': ' + x.item.label + (x.item.note ? '\n' + x.item.note : ''),
        due_date:new Date(Date.now()+2*86400000).toISOString().slice(0,10),
        priority:x.item.status === 'failed' ? 'high' : 'normal',
        status:'pending'
      }));
      const res = await _sb.from('tasks').insert(rows);
      if(res.error) throw res.error;
      toast(rows.length + ' inspection follow-up task(s) created.', 'success');
    }catch(err){ toast('Could not create tasks: ' + (err.message || err), 'error'); }
  };

  function reportHtml(){
    const cur = state.current || blankInspection(state.templateKey);
    const job = selectedJob();
    const c = counts(cur);
    const sections = (cur.sections || []).map(sec => `
      <section class="ri-section">
        <h3>${h(sec.title)}</h3>
        ${(sec.items || []).map(item => `
          <div class="ri-row ${h(item.status || 'na')}">
            <div><strong>${h(item.label)}</strong>${item.note ? `<p>${h(item.note)}</p>` : ''}</div>
            <span>${h(STATUS[item.status]?.label || 'N/A')}</span>
          </div>`).join('')}
      </section>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${h(cur.template_name)} Report</title>
      <style>
        @page{size:letter;margin:.42in}
        *{box-sizing:border-box}body{font-family:Arial,sans-serif;margin:0;color:#111827;background:white;font-size:12px}
        .ri-doc{max-width:8.1in;margin:0 auto}
        .ri-hero{background:linear-gradient(135deg,#06163d,#0b5ed7);color:#fff;border-radius:14px;padding:22px;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        .ri-hero h1{margin:0 0 6px;font-size:25px}.ri-hero p{margin:0;line-height:1.45;opacity:.95}
        .ri-badge{background:white;color:#0b5ed7;border-radius:999px;padding:7px 12px;font-weight:800;white-space:nowrap}
        .ri-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:14px 0}
        .ri-card{border:1px solid #e5e7eb;border-radius:10px;padding:12px}.ri-card h4{margin:0 0 8px;color:#64748b;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.ri-card strong{display:block;font-size:14px;margin-bottom:4px}.ri-card p{margin:0;color:#475569;line-height:1.4}
        .ri-score{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:14px 0}.ri-score div{border:1px solid #e5e7eb;border-radius:10px;padding:10px}.ri-score span{display:block;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:.1em}.ri-score strong{font-size:22px}
        .ri-summary{border-left:5px solid #0b5ed7;background:#f8fafc;padding:14px;border-radius:10px;white-space:pre-wrap;line-height:1.45;margin:14px 0}
        .ri-section{break-inside:avoid;margin-top:14px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}.ri-section h3{margin:0;background:#f1f5f9;padding:10px 12px;font-size:14px}
        .ri-row{display:grid;grid-template-columns:1fr 105px;gap:10px;padding:9px 12px;border-top:1px solid #eef2f7}.ri-row p{margin:4px 0 0;color:#475569;line-height:1.35}.ri-row span{text-align:center;border-radius:999px;padding:5px 8px;font-weight:700;font-size:11px;height:max-content}
        .ri-row.good span{background:#dcfce7;color:#166534}.ri-row.attention span{background:#fef3c7;color:#92400e}.ri-row.failed span{background:#fee2e2;color:#991b1b}.ri-row.na span{background:#f1f5f9;color:#64748b}
        .ri-footer{margin-top:18px;padding-top:12px;border-top:1px solid #e5e7eb;color:#64748b;display:flex;justify-content:space-between}
      </style></head><body><div class="ri-doc">
        <div class="ri-hero"><div><h1>My Family Roofer Inspection Report</h1><p>${h(cur.template_name)}<br>Protecting Your Home Like Family</p></div><div class="ri-badge">${h(cur.status || 'draft')}</div></div>
        <div class="ri-grid"><div class="ri-card"><h4>Customer</h4><strong>${h(custName(job))}</strong><p>${h(jobAddr(job))}</p></div><div class="ri-card"><h4>Inspection</h4><strong>${h(cur.overall_condition || 'Needs Review')}</strong><p>${h(cur.weather || 'Conditions not noted')}<br>${h(cur.roof_squares || '—')} squares</p></div><div class="ri-card"><h4>Recommended Action</h4><strong>${h(cur.recommended_action || 'Review findings')}</strong><p>${new Date().toLocaleDateString()}</p></div></div>
        <div class="ri-score"><div><span>Total</span><strong>${c.total}</strong></div><div><span>Good</span><strong>${c.good}</strong></div><div><span>Attention</span><strong>${c.attention}</strong></div><div><span>Failed</span><strong>${c.failed}</strong></div></div>
        <div class="ri-summary">${h(cur.summary || buildSummaryText())}</div>
        ${sections}
        <div class="ri-footer"><span>My Family Roofer · Brian Barnes · (970) 292-6927</span><span>Generated ${new Date().toLocaleDateString()}</span></div>
      </div><script>setTimeout(function(){window.print();},250);<\/script>
</body></html>`;
  }

  window.mfrPrintInspectionReport = function(){
    const w = window.open('', '_blank');
    if(!w){ toast('Popup blocked. Allow popups to print the report.', 'error'); return; }
    w.document.open(); w.document.write(reportHtml()); w.document.close();
  };

  const css = document.createElement('style');
  css.textContent = `
    .mfr-insp-page{max-width:1500px}
    .mfr-insp-hd{align-items:flex-start}
    .mfr-insp-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
    .mfr-insp-grid{display:grid;grid-template-columns:340px 1fr;gap:16px;align-items:start}
    .mfr-insp-left{display:flex;flex-direction:column;gap:14px;position:sticky;top:86px}
    .mfr-insp-template-list{display:flex;flex-direction:column;gap:10px}
    .mfr-insp-template{border:1px solid var(--border);background:#fff;border-radius:14px;text-align:left;padding:12px;cursor:pointer;transition:.15s}
    .mfr-insp-template:hover,.mfr-insp-template.active{border-color:var(--blue);box-shadow:0 10px 24px rgba(37,99,235,.10);transform:translateY(-1px)}
    .mfr-insp-template-title{font-weight:900;color:var(--text);font-size:13px}
    .mfr-insp-template-desc{font-size:12px;color:var(--text2);line-height:1.4;margin-top:4px}
    .mfr-insp-job-card{margin-top:10px;border:1px dashed var(--border);border-radius:12px;padding:12px;background:#f8fafc;display:flex;flex-direction:column;gap:3px}
    .mfr-insp-job-card strong{font-size:14px}.mfr-insp-job-card span{font-size:12px;color:var(--text2)}.mfr-insp-job-card em{font-size:11px;color:var(--text3);font-style:normal}
    .mfr-insp-saved{border:1px solid var(--border);border-radius:12px;padding:10px;cursor:pointer;display:flex;justify-content:space-between;gap:10px;margin-bottom:8px}
    .mfr-insp-saved:hover{background:#f8fafc;border-color:var(--blue)}.mfr-insp-saved strong{display:block;font-size:12px}.mfr-insp-saved span,.mfr-insp-saved em{font-size:11px;color:var(--text3);font-style:normal}
    .mfr-insp-empty-small{font-size:12px;color:var(--text3);padding:12px;border:1px dashed var(--border);border-radius:12px;text-align:center}
    .mfr-insp-hero{background:linear-gradient(135deg,#06163d,#0b5ed7);border-radius:24px;padding:24px;display:flex;justify-content:space-between;gap:24px;color:#fff;box-shadow:0 18px 38px rgba(13,27,62,.22);margin-bottom:16px}
    .mfr-insp-kicker{font-size:12px;text-transform:uppercase;letter-spacing:.18em;font-weight:900;color:#bfdbfe}.mfr-insp-hero h2{font-size:30px;margin:7px 0}.mfr-insp-hero p{color:#dbeafe;max-width:720px;line-height:1.5;margin:0}
    .mfr-insp-score{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.2);border-radius:18px;padding:18px;min-width:170px;text-align:center}.mfr-insp-score strong{display:block;font-size:34px}.mfr-insp-score span{font-size:12px;color:#dbeafe}
    .mfr-insp-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.mfr-insp-stat{border:1px solid var(--border);border-top:4px solid var(--blue);background:#fff;border-radius:18px;padding:16px}.mfr-insp-stat span{font-size:11px;text-transform:uppercase;letter-spacing:.14em;color:var(--text3);font-weight:900}.mfr-insp-stat strong{display:block;font-size:26px;margin-top:5px}.mfr-insp-stat.good{border-top-color:#16a34a}.mfr-insp-stat.warn{border-top-color:#f59e0b}.mfr-insp-stat.bad{border-top-color:#ef4444}
    .mfr-insp-section{border:1px solid var(--border);border-radius:18px;overflow:hidden;margin-bottom:14px;background:#fff}.mfr-insp-section-hd{padding:14px 16px;background:#f8fafc;border-bottom:1px solid var(--border)}.mfr-insp-section-hd strong{font-size:16px}.mfr-insp-section-hd span{display:block;color:var(--text3);font-size:12px;margin-top:2px}
    .mfr-insp-item{padding:14px 16px;border-bottom:1px solid #eef2f7}.mfr-insp-item:last-child{border-bottom:0}.mfr-insp-item-main{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center}.mfr-insp-item-title{font-weight:800;font-size:14px;color:var(--text)}
    .mfr-insp-status-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}.mfr-insp-status{border:1px solid var(--border);background:#fff;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer;color:var(--text2)}.mfr-insp-status span{margin-right:4px}.mfr-insp-status.good.active{background:#dcfce7;border-color:#86efac;color:#166534}.mfr-insp-status.warn.active{background:#fef3c7;border-color:#fcd34d;color:#92400e}.mfr-insp-status.bad.active{background:#fee2e2;border-color:#fca5a5;color:#991b1b}.mfr-insp-status.na.active{background:#f1f5f9;color:#475569}
    .mfr-insp-note{width:100%;min-height:52px;margin-top:10px;border:1px solid var(--border);border-radius:12px;padding:10px;font-family:inherit;font-size:13px;resize:vertical}
    @media(max-width:900px){.mfr-insp-grid{grid-template-columns:1fr}.mfr-insp-left{position:static}.mfr-insp-hero{flex-direction:column}.mfr-insp-stats{grid-template-columns:1fr 1fr}.mfr-insp-item-main{grid-template-columns:1fr}.mfr-insp-status-row{justify-content:flex-start}.mfr-insp-actions{justify-content:flex-start}.mfr-insp-hero h2{font-size:24px}}
  `;
  document.head.appendChild(css);
})();

