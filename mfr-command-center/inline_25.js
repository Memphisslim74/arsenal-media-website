
/* MFR PATCH: Hail report professional modal + clean print window + confirmed-first lists */
(function(){
  const $ = (id)=>document.getElementById(id);
  const safe = (v)=>String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]));
  const n = (v,d=0)=>{ const x=Number(v); return Number.isFinite(x)?x:d; };
  const title = (v)=>String(v||'').trim().toLowerCase().replace(/\b\w/g, c=>c.toUpperCase());
  const fmtDate = (v)=>{ if(!v) return '—'; try{return new Date(v).toLocaleDateString();}catch(e){return String(v);} };
  const sourceCode = (h)=>String(h && h.source || '').toUpperCase();
  const isConfirmed = (h)=>/IEM|LSR|SPC/.test(sourceCode(h));
  const isRadar = (h)=>/SWDI|RADAR/.test(sourceCode(h)) || !isConfirmed(h);
  const payload = ()=> window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {hailEvents:[],stormAlerts:[],hailSwaths:[]};
  const coord = (h)=>{ const lat=n(h && h.lat, NaN), lng=n(h && h.lng, NaN); return (Number.isFinite(lat)&&Number.isFinite(lng)) ? lat.toFixed(2)+', '+lng.toFixed(2) : ''; };
  const bad = (v)=>!String(v||'').trim() || /^unknown/i.test(String(v||'').trim()) || /^null$/i.test(String(v||'').trim());
  const areaName = (h)=>{
    const values=[h?.location,h?.nearest_city,h?.city,h?.town,h?.place,h?.area];
    for(const v of values){ if(!bad(v)) return title(v); }
    const c=coord(h); return c ? 'Near '+c : 'Area not listed';
  };
  const countyName = (h)=>{
    const values=[h?.county,h?.county_name];
    for(const v of values){ if(!bad(v) && String(v).trim().toUpperCase() !== String(h?.state||'').toUpperCase()) return title(v).replace(/\s+County$/i,'') + ' County'; }
    return h?.state ? String(h.state).toUpperCase()+' area' : 'County not listed';
  };
  const sourceLabel = (h)=>{ const s=sourceCode(h); if(/IEM|LSR/.test(s)) return 'IEM/NWS Local Storm Report'; if(/SPC/.test(s)) return 'SPC Confirmed Storm Report'; if(/SWDI/.test(s)) return 'SWDI Radar-Indicated Signal'; return h?.source || 'NOAA Report'; };
  const qualityLabel = (h)=> isConfirmed(h) ? 'Confirmed report' : 'Radar signal';
  const currentFilter = ()=>{
    const state=$('hail-state'), days=$('hail-days'), min=$('hail-min');
    const parts=[];
    if(state) parts.push(state.selectedOptions?.[0]?.textContent || state.value || 'All tracked states');
    if(days) parts.push(days.selectedOptions?.[0]?.textContent || days.value || 'Current range');
    if(min) parts.push(min.selectedOptions?.[0]?.textContent || min.value || 'All sizes');
    return parts.filter(Boolean).join(' · ');
  };
  const sortedEvents = ()=>{
    const q=String($('hail-search')?.value||'').toLowerCase().trim();
    const ev=(payload().hailEvents||[]).filter(h=>{
      if(!q) return true;
      return [areaName(h), countyName(h), h?.state, h?.source, h?.event_date, h?.magnitude, coord(h)].join(' ').toLowerCase().includes(q);
    });
    return ev.sort((a,b)=>{
      const qa=(isConfirmed(a)?0:1), qb=(isConfirmed(b)?0:1);
      if(qa!==qb) return qa-qb;
      return n(b.magnitude)-n(a.magnitude) || String(b.event_date||'').localeCompare(String(a.event_date||''));
    });
  };
  const topCounts = (events, getter, max=8)=>{
    const map=new Map();
    for(const h of events){ const k=getter(h); if(!k || /^County not listed|Area not listed/i.test(k)) continue; const cur=map.get(k)||{name:k,count:0,max:0}; cur.count++; cur.max=Math.max(cur.max,n(h.magnitude)); map.set(k,cur); }
    return [...map.values()].sort((a,b)=>b.count-a.count || b.max-a.max).slice(0,max);
  };
  function insights(){
    const all=sortedEvents();
    const confirmed=all.filter(isConfirmed);
    const radar=all.filter(isRadar);
    const basis=confirmed.length ? confirmed : all;
    const max=all.reduce((m,h)=>Math.max(m,n(h.magnitude)),0);
    return {all, confirmed, radar, basis, max, alerts:payload().stormAlerts||[], swaths:payload().hailSwaths||[], counties:topCounts(basis, countyName, 6), areas:topCounts(basis, areaName, 14), largest:basis.slice().sort((a,b)=>n(b.magnitude)-n(a.magnitude)).slice(0,10)};
  }
  function briefText(){
    const x=insights();
    const lines=[];
    lines.push('MFR Hail Intelligence Brief');
    lines.push('Filter: '+currentFilter());
    lines.push('Confirmed reports: '+x.confirmed.length);
    lines.push('Radar-indicated signals: '+x.radar.length);
    lines.push('Active alerts: '+x.alerts.length);
    lines.push('Max hail size: '+(x.max?x.max.toFixed(2)+' inches':'N/A'));
    lines.push('');
    lines.push('Most Affected Counties:');
    if(x.counties.length) x.counties.slice(0,5).forEach((c,i)=>lines.push((i+1)+'. '+c.name+' — '+c.count+' report(s), max '+c.max.toFixed(2)+'"'));
    else lines.push('No county-level confirmed reports found for this filter.');
    lines.push('');
    lines.push('Affected Towns / Areas:');
    if(x.areas.length) lines.push(x.areas.slice(0,10).map(a=>a.name).join(', '));
    else lines.push('No town/area names found yet.');
    lines.push('');
    lines.push('Largest Reports:');
    if(x.largest.length) x.largest.slice(0,6).forEach(h=>lines.push('• '+(n(h.magnitude)?n(h.magnitude).toFixed(2)+'"':'Hail')+' near '+areaName(h)+', '+countyName(h)+' — '+fmtDate(h.event_date)+' — '+sourceLabel(h)));
    else lines.push('No hail reports for this filter.');
    lines.push('');
    lines.push('Recommended Roofing Response: prioritize confirmed report areas first, use radar-indicated signals as supporting lead intelligence, filter customers/leads by the towns and counties above, and schedule inspection blocks over the next 3 to 5 days.');
    return lines.join('\n');
  }
  function reportInner(printMode=false){
    const x=insights();
    const sourceNote = x.confirmed.length ? 'This report prioritizes confirmed IEM/NWS Local Storm Reports and SPC storm reports. SWDI radar-indicated points are used as supporting evidence.' : 'No confirmed IEM/SPC reports were found for this filter. Radar-indicated SWDI points are shown as supporting intelligence only.';
    const countyHtml = x.counties.length ? x.counties.map(c=>'<li><strong>'+safe(c.name)+'</strong><span>'+c.count+' report(s) · max '+c.max.toFixed(2)+'”</span></li>').join('') : '<li><strong>No county summary yet</strong><span>Try a wider date range or run sync.</span></li>';
    const areaHtml = x.areas.length ? x.areas.map(a=>'<span>'+safe(a.name)+' <b>'+a.count+'</b></span>').join('') : '<em>No affected towns/areas found yet.</em>';
    const rows = x.largest.length ? x.largest.map(h=>'<tr><td data-label="Size">'+safe(n(h.magnitude)?n(h.magnitude).toFixed(2)+'”':'—')+'</td><td data-label="Area">'+safe(areaName(h))+'</td><td data-label="County">'+safe(countyName(h))+'</td><td data-label="Date">'+safe(fmtDate(h.event_date))+'</td><td data-label="Source"><b>'+safe(qualityLabel(h))+'</b><br><small>'+safe(sourceLabel(h))+'</small></td></tr>').join('') : '<tr><td colspan="5">No hail reports for this filter.</td></tr>';
    return '<main class="mfr-hail-print-doc">'
      + '<header class="mfr-hail-print-head"><div><div class="kicker">Storm Response Brief</div><h1>Hail Intelligence Report</h1><p>'+safe(currentFilter())+'</p></div><div class="brand"><b>MFR</b><span>Command Center</span></div></header>'
      + '<section class="mfr-hail-print-stats"><div><span>Confirmed</span><strong>'+x.confirmed.length+'</strong></div><div><span>Radar Signals</span><strong>'+x.radar.length+'</strong></div><div><span>Max Size</span><strong>'+(x.max?x.max.toFixed(2)+'”':'—')+'</strong></div><div><span>Alerts</span><strong>'+x.alerts.length+'</strong></div></section>'
      + '<section class="mfr-hail-print-panel wide"><h2>Report Basis</h2><p>'+safe(sourceNote)+'</p></section>'
      + '<section class="mfr-hail-print-grid"><div class="mfr-hail-print-panel"><h2>Most Affected Counties</h2><ol class="mfr-hail-county-list">'+countyHtml+'</ol></div><div class="mfr-hail-print-panel"><h2>Affected Towns / Areas</h2><div class="mfr-hail-area-tags">'+areaHtml+'</div></div></section>'
      + '<section class="mfr-hail-print-panel wide"><h2>Largest Hail Reports</h2><table class="mfr-hail-report-table"><thead><tr><th>Size</th><th>Area</th><th>County</th><th>Date</th><th>Source</th></tr></thead><tbody>'+rows+'</tbody></table></section>'
      + '<section class="mfr-hail-print-panel wide"><h2>Recommended Roofing Response</h2><ul class="mfr-hail-response-list"><li>Prioritize confirmed report areas first, then use radar-indicated clusters as secondary lead indicators.</li><li>Filter customers and open leads in the affected towns/counties.</li><li>Tag likely homes as Potential Hail Lead and schedule inspection blocks over the next 3 to 5 days.</li><li>Use claim-aware messaging for homeowners with older roofs, prior claims, or active storm exposure.</li></ul></section>'
      + '<footer class="mfr-hail-print-foot">Generated '+safe(new Date().toLocaleString())+' · MFR Command Center · arsenalmediaco.com</footer>'
      + '</main>';
  }
  function printStyles(){ return '<style>'+
    'body{margin:0;background:#f3f6fb;color:#111827;font-family:Inter,Arial,sans-serif}.mfr-hail-print-doc{max-width:1040px;margin:0 auto;padding:22px}.mfr-hail-print-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid #dbe4f0;border-radius:24px;background:linear-gradient(135deg,#fff,#f8fbff);padding:24px;margin-bottom:16px}.mfr-hail-print-head .kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#2563eb;font-weight:900}.mfr-hail-print-head h1{font-size:34px;line-height:1.05;margin:6px 0;color:#0f172a}.mfr-hail-print-head p{margin:0;color:#64748b;font-weight:700}.brand{display:flex;align-items:center;justify-content:flex-end;gap:8px;color:#0f172a;white-space:nowrap}.brand b{display:inline-block;background:#0f2b63;color:#fff;border-radius:8px;padding:5px 8px}.brand span{font-weight:900}.mfr-hail-print-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.mfr-hail-print-stats div{background:#fff;border:1px solid #dbe4f0;border-top:3px solid #2563eb;border-radius:18px;padding:16px}.mfr-hail-print-stats span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:900}.mfr-hail-print-stats strong{display:block;font-size:28px;margin-top:6px}.mfr-hail-print-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.mfr-hail-print-panel{background:#fff;border:1px solid #dbe4f0;border-radius:22px;padding:20px;margin-bottom:16px;break-inside:avoid}.mfr-hail-print-panel h2{font-size:20px;margin:0 0 12px;color:#0f172a}.mfr-hail-print-panel p{color:#334155;line-height:1.45;margin:0}.mfr-hail-county-list{margin:0;padding-left:20px}.mfr-hail-county-list li{margin:0 0 10px}.mfr-hail-county-list span{display:block;color:#64748b;font-size:13px;margin-top:2px}.mfr-hail-area-tags{display:flex;flex-wrap:wrap;gap:8px}.mfr-hail-area-tags span{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:999px;padding:8px 10px;font-weight:800}.mfr-hail-area-tags b{background:#2563eb;color:#fff;border-radius:999px;padding:2px 6px;margin-left:5px}.mfr-hail-report-table{width:100%;border-collapse:collapse}.mfr-hail-report-table th{text-align:left;color:#64748b;font-size:11px;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding:10px}.mfr-hail-report-table td{border-bottom:1px solid #eef2f7;padding:11px 10px;vertical-align:top}.mfr-hail-report-table small{color:#64748b}.mfr-hail-response-list{margin:0;padding-left:20px;color:#334155;line-height:1.5}.mfr-hail-print-foot{font-size:12px;color:#64748b;margin-top:10px;padding-top:12px;border-top:1px solid #e2e8f0}@media print{@page{size:letter;margin:.35in}body{background:#fff}.mfr-hail-print-doc{padding:0;max-width:none}.mfr-hail-print-head,.mfr-hail-print-stats div,.mfr-hail-print-panel{box-shadow:none}.mfr-hail-print-panel{break-inside:avoid}.mfr-hail-print-grid{grid-template-columns:1fr 1fr}}@media(max-width:760px){.mfr-hail-print-doc{padding:14px}.mfr-hail-print-head{display:block}.brand{text-align:left;margin-top:12px}.mfr-hail-print-stats,.mfr-hail-print-grid{grid-template-columns:1fr}.mfr-hail-print-head h1{font-size:28px}}'
    + '</style>'; }
  window.mfrCopyHailBrief = function(){ navigator.clipboard.writeText(briefText()).then(()=>{ if(typeof toast==='function') toast('Detailed hail brief copied'); }); };
  window.mfrOpenHailReport = function(){ const old=$('mfr-hail-report-overlay')||$('mfr-hail-report-modal'); if(old) old.remove(); const div=document.createElement('div'); div.id='mfr-hail-report-overlay'; div.className='modal-overlay mfr-hail-report-modal'; div.innerHTML='<div class="mfr-hail-report-shell"><div class="mfr-hail-report-toolbar"><button class="btn btn-outline" onclick="mfrCloseHailReport()">Close</button><button class="btn btn-primary" onclick="mfrPrintHailReport()">Print / Save PDF</button></div>'+reportInner()+'</div>'; document.body.appendChild(div); };
  window.mfrCloseHailReport = function(){ const el=$('mfr-hail-report-overlay')||$('mfr-hail-report-modal'); if(el) el.remove(); };
  window.mfrPrintHailReport = function(){ const html='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hail Intelligence Report</title>'+printStyles()+'</head><body>'+reportInner(true)+'<script>window.onload=function(){setTimeout(function(){window.focus();window.print();},350)};<\/script></body></html>'; const w=window.open('','_blank'); if(!w){ alert('Popup blocked. Allow popups to print/save PDF.'); return; } w.document.open(); w.document.write(html); w.document.close(); };
  window.mfrRenderHailSideList = function(){
    const wrap=$('mfr-hail-list'); if(!wrap) return; const events=sortedEvents().slice(0,28);
    if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records for this filter yet</h3><p>Try a wider date range, All Tracked States, or run sync.</p></div>'; return; }
    wrap.innerHTML=events.map(h=>'<div class="mfr-hail-event-card '+(isConfirmed(h)?'confirmed':'radar')+'"><strong>'+safe((n(h.magnitude)?n(h.magnitude).toFixed(2)+'&quot;':'Hail')+' near '+areaName(h))+'</strong><p>'+safe(countyName(h))+', '+safe(h.state||'')+' · '+safe(fmtDate(h.event_date))+'</p><span class="mfr-hail-pill '+(isConfirmed(h)?'ok':'warn')+'">'+safe(qualityLabel(h))+'</span><span class="mfr-hail-pill">'+safe(sourceLabel(h))+'</span>'+(coord(h)?'<span class="mfr-hail-pill">'+safe(coord(h))+'</span>':'')+'<div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+safe(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+safe(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>').join('');
    const head=document.querySelector('.mfr-hail-side-head'); if(head && !$('mfr-hail-pdf-btn')) head.insertAdjacentHTML('beforeend','<button id="mfr-hail-pdf-btn" class="btn btn-xs btn-primary" onclick="mfrOpenHailReport()">PDF Report</button>');
  };
  const st=document.createElement('style'); st.textContent=`
  .mfr-hail-report-modal{align-items:flex-start!important;overflow:auto!important;padding:24px!important;background:rgba(15,23,42,.62)!important}
  .mfr-hail-report-shell{width:min(1180px,96vw);margin:auto;background:#f3f6fb;border-radius:28px;padding:18px;box-shadow:0 28px 90px rgba(15,23,42,.32)}
  .mfr-hail-report-toolbar{display:flex;justify-content:flex-end;gap:8px;margin-bottom:12px;position:sticky;top:0;z-index:3;background:linear-gradient(180deg,#f3f6fb 75%,rgba(243,246,251,0));padding-bottom:8px}
  .mfr-hail-report-shell .mfr-hail-print-doc{padding:0;max-width:none;margin:0;background:transparent;color:#111827;font-family:Inter,Arial,sans-serif}
  .mfr-hail-report-shell .mfr-hail-print-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;border:1px solid #dbe4f0;border-radius:24px;background:linear-gradient(135deg,#fff,#f8fbff);padding:24px;margin-bottom:16px;box-shadow:0 10px 26px rgba(15,23,42,.04)}
  .mfr-hail-report-shell .kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#2563eb;font-weight:950}
  .mfr-hail-report-shell h1{font-size:34px;line-height:1.05;margin:6px 0;color:#0f172a;font-weight:950}
  .mfr-hail-report-shell .mfr-hail-print-head p{margin:0;color:#64748b;font-weight:800}
  .mfr-hail-report-shell .brand{display:flex;align-items:center;justify-content:flex-end;gap:8px;color:#0f172a;white-space:nowrap;font-weight:950}.mfr-hail-report-shell .brand b{display:inline-block;background:#0f2b63;color:#fff;border-radius:8px;padding:5px 8px}.mfr-hail-report-shell .brand span{font-weight:950}
  .mfr-hail-report-shell .mfr-hail-print-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px}.mfr-hail-report-shell .mfr-hail-print-stats div{background:#fff;border:1px solid #dbe4f0;border-top:3px solid #2563eb;border-radius:18px;padding:16px;box-shadow:0 8px 20px rgba(15,23,42,.035)}.mfr-hail-report-shell .mfr-hail-print-stats span{display:block;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.16em;font-weight:950}.mfr-hail-report-shell .mfr-hail-print-stats strong{display:block;font-size:28px;margin-top:6px;color:#0f172a}
  .mfr-hail-report-shell .mfr-hail-print-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.mfr-hail-report-shell .mfr-hail-print-panel{background:#fff;border:1px solid #dbe4f0;border-radius:22px;padding:20px;margin-bottom:16px;box-shadow:0 8px 20px rgba(15,23,42,.035)}.mfr-hail-report-shell .mfr-hail-print-panel h2{font-size:20px;margin:0 0 12px;color:#0f172a;font-weight:950}.mfr-hail-report-shell .mfr-hail-print-panel p{color:#334155;line-height:1.45;margin:0}.mfr-hail-report-shell .mfr-hail-county-list{margin:0;padding-left:20px}.mfr-hail-report-shell .mfr-hail-county-list li{margin:0 0 10px;font-weight:850}.mfr-hail-report-shell .mfr-hail-county-list span{display:block;color:#64748b;font-size:13px;margin-top:2px;font-weight:700}.mfr-hail-report-shell .mfr-hail-area-tags{display:flex;flex-wrap:wrap;gap:8px}.mfr-hail-report-shell .mfr-hail-area-tags span{background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;border-radius:999px;padding:8px 10px;font-weight:900}.mfr-hail-report-shell .mfr-hail-area-tags b{background:#2563eb;color:#fff;border-radius:999px;padding:2px 6px;margin-left:5px}.mfr-hail-report-shell .mfr-hail-report-table{width:100%;border-collapse:collapse}.mfr-hail-report-shell .mfr-hail-report-table th{text-align:left;color:#64748b;font-size:11px;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid #e2e8f0;padding:10px}.mfr-hail-report-shell .mfr-hail-report-table td{border-bottom:1px solid #eef2f7;padding:11px 10px;vertical-align:top}.mfr-hail-report-shell .mfr-hail-report-table small{color:#64748b}.mfr-hail-report-shell .mfr-hail-response-list{margin:0;padding-left:20px;color:#334155;line-height:1.55}.mfr-hail-report-shell .mfr-hail-response-list li{margin-bottom:8px}.mfr-hail-report-shell .mfr-hail-print-foot{font-size:12px;color:#64748b;margin-top:10px;padding-top:12px;border-top:1px solid #e2e8f0}
  .mfr-hail-side-card{max-height:calc(100vh - 210px)!important;display:flex!important;flex-direction:column!important}.mfr-hail-list{overflow:auto!important;min-height:0!important;padding-right:4px}.mfr-hail-event-card.confirmed{border-left:4px solid #16a34a}.mfr-hail-event-card.radar{border-left:4px solid #f59e0b}.mfr-hail-pill.ok{background:#dcfce7!important;color:#166534!important}.mfr-hail-pill.warn{background:#fef3c7!important;color:#92400e!important}
  @media(max-width:860px){.mfr-hail-side-card{max-height:none!important}.mfr-hail-report-modal{padding:0!important}.mfr-hail-report-shell{width:100%;min-height:100vh;padding:12px;border-radius:0}.mfr-hail-report-toolbar{display:grid;grid-template-columns:1fr 1fr}.mfr-hail-report-toolbar .btn{width:100%;justify-content:center}.mfr-hail-report-shell .mfr-hail-print-head{display:block;padding:18px}.mfr-hail-report-shell .brand{justify-content:flex-start;margin-top:14px}.mfr-hail-report-shell h1{font-size:28px}.mfr-hail-report-shell .mfr-hail-print-stats,.mfr-hail-report-shell .mfr-hail-print-grid{grid-template-columns:1fr}.mfr-hail-report-shell .mfr-hail-report-table thead{display:none}.mfr-hail-report-shell .mfr-hail-report-table,.mfr-hail-report-shell .mfr-hail-report-table tbody,.mfr-hail-report-shell .mfr-hail-report-table tr,.mfr-hail-report-shell .mfr-hail-report-table td{display:block;width:100%}.mfr-hail-report-shell .mfr-hail-report-table tr{border:1px solid #e2e8f0;border-radius:16px;padding:10px;margin-bottom:10px;background:#fff}.mfr-hail-report-shell .mfr-hail-report-table td{border:0;padding:5px 2px}.mfr-hail-report-shell .mfr-hail-report-table td:before{content:attr(data-label);display:block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;font-weight:900}}
`; document.head.appendChild(st);
})();
