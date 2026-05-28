
(function(){
  function gPayload(){ return window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {hailEvents:[],stormAlerts:[],hailSwaths:[]}; }
  function byId(id){ return document.getElementById(id); }
  function esc(v){ return String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function num(v,d){ var n=Number(v); return Number.isFinite(n)?n:(d||0); }
  function fmtDate(d){ try { return d ? new Date(d).toLocaleDateString() : '—'; } catch(e){ return d || '—'; } }
  function titleCase(v){ return String(v||'').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function isUnknown(v){ return !String(v||'').trim() || /^unknown(\s+(area|county))?$/i.test(String(v||'').trim()) || /^null$/i.test(String(v||'').trim()); }
  function cleanCounty(v){ var c=String(v||'').trim(); if(isUnknown(c)) return ''; return c.replace(/\s+county$/i,''); }
  function sourceCode(h){ return String(h && h.source || '').toUpperCase(); }
  function isConfirmed(h){ var s=sourceCode(h); return s.indexOf('IEM') >= 0 || s === 'SPC' || s.indexOf('LSR') >= 0; }
  function sourceLabel(h){ var s=sourceCode(h); if(s.indexOf('IEM') >= 0 || s.indexOf('LSR') >= 0) return 'IEM/NWS Local Storm Report'; if(s === 'SPC') return 'SPC Storm Report'; if(s.indexOf('SWDI') >= 0) return 'SWDI Radar-Indicated'; return h.source || 'NOAA'; }
  function coordText(h){ var lat=num(h.lat,NaN), lng=num(h.lng,NaN); return Number.isFinite(lat)&&Number.isFinite(lng) ? lat.toFixed(2)+', '+lng.toFixed(2) : ''; }
  function areaName(h){
    var candidates=[h.location,h.nearest_city,h.city,h.town,h.place,h.display_area];
    for(var i=0;i<candidates.length;i++){ if(!isUnknown(candidates[i])) return titleCase(candidates[i]); }
    var county=cleanCounty(h.county); if(county) return county+' County Area';
    var coords=coordText(h); return coords ? 'Near '+coords : 'Unknown Area';
  }
  function countyName(h){ var c=cleanCounty(h.county); if(c) return c+' County'; return h.state ? h.state : 'County unavailable'; }
  function eventSort(a,b){
    var rankA=isConfirmed(a)?0:1, rankB=isConfirmed(b)?0:1;
    if(rankA!==rankB) return rankA-rankB;
    return num(b.magnitude,0)-num(a.magnitude,0) || new Date(b.event_date||0)-new Date(a.event_date||0);
  }
  function currentEvents(){ var p=gPayload(); return (p.hailEvents||[]).slice().filter(Boolean).sort(eventSort); }
  function groupStats(events, getter){
    var map={};
    events.forEach(function(h){ var k=getter(h); if(!k || isUnknown(k)) return; map[k] = map[k] || {name:k,count:0,max:0,confirmed:0}; map[k].count++; map[k].max=Math.max(map[k].max,num(h.magnitude,0)); if(isConfirmed(h)) map[k].confirmed++; });
    return Object.values(map).sort(function(a,b){ return b.confirmed-a.confirmed || b.count-a.count || b.max-a.max; });
  }
  function buildInsights(){
    var p=gPayload(); var events=currentEvents(); var confirmed=events.filter(isConfirmed); var radar=events.filter(function(h){return !isConfirmed(h);});
    var basis=confirmed.length ? confirmed : events;
    var max=events.reduce(function(m,h){return Math.max(m,num(h.magnitude,0));},0);
    var counties=groupStats(basis,function(h){return cleanCounty(h.county);}).slice(0,6);
    var areas=groupStats(basis,function(h){return areaName(h);}).slice(0,12);
    var largest=basis.slice().sort(function(a,b){ return num(b.magnitude,0)-num(a.magnitude,0); }).slice(0,10);
    return {payload:p, events:events, confirmed:confirmed, radar:radar, basis:basis, max:max, counties:counties, areas:areas, largest:largest, alerts:p.stormAlerts||[], swaths:p.hailSwaths||[]};
  }
  function reportRows(rows){
    if(!rows.length) return '<tr><td colspan="5">No confirmed hail reports for this filter yet. Try a wider date range or run sync.</td></tr>';
    return rows.map(function(h){ return '<tr><td>'+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'”':'—')+'</td><td>'+esc(areaName(h))+'</td><td>'+esc(countyName(h))+'</td><td>'+esc(fmtDate(h.event_date))+'</td><td>'+esc(sourceLabel(h))+'</td></tr>'; }).join('');
  }
  function briefText(ins){
    var stateText=byId('hail-state')?.selectedOptions?.[0]?.textContent || 'Current filter';
    var daysText=byId('hail-days')?.selectedOptions?.[0]?.textContent || '';
    var lines=['MFR Hail Intelligence Brief','', 'Area: '+stateText, 'Date Range: '+daysText, 'Confirmed Hail Reports: '+ins.confirmed.length, 'Radar-Indicated Signals: '+ins.radar.length, 'Active Alerts: '+ins.alerts.length, 'Swaths: '+ins.swaths.length, 'Max Hail Size: '+(ins.max?ins.max.toFixed(2)+' inches':'N/A'), ''];
    if(ins.counties.length){ lines.push('Most Affected Counties:'); ins.counties.slice(0,5).forEach(function(c,i){ lines.push((i+1)+'. '+c.name+' County — '+c.count+' report(s), max '+(c.max?c.max.toFixed(2)+'”':'N/A')); }); lines.push(''); }
    if(ins.areas.length){ lines.push('Affected Towns / Areas:'); lines.push(ins.areas.slice(0,10).map(function(a){return a.name;}).join(', ')); lines.push(''); }
    if(ins.largest.length){ lines.push('Largest Confirmed Hail Reports:'); ins.largest.slice(0,6).forEach(function(h){ lines.push('• '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'”':'Hail')+' near '+areaName(h)+', '+countyName(h)+' — '+fmtDate(h.event_date)+' — '+sourceLabel(h)); }); lines.push(''); }
    if(!ins.confirmed.length && ins.radar.length){ lines.push('Note: this filter currently has radar-indicated hail signals but no confirmed IEM/SPC local storm reports. Use these as lead indicators, not final damage confirmation.',''); }
    lines.push('Recommended Roofing Response:');
    if(ins.counties.length) lines.push('Prioritize outreach in '+ins.counties.slice(0,2).map(function(c){return c.name+' County';}).join(' and ')+'.');
    lines.push('Filter customers and open leads in affected towns, tag likely properties as Potential Hail Lead, and schedule inspection blocks over the next 3 to 5 days.');
    return lines.join('\n');
  }
  window.mfrCopyHailBrief = function(){ var ins=buildInsights(); navigator.clipboard.writeText(briefText(ins)).then(function(){ if(typeof toast==='function') toast('Detailed hail brief copied'); }); };
  window.mfrCopyHailEventBrief = function(id){
    var h=currentEvents().find(function(x){return String(x.id)===String(id);}); if(!h){ if(typeof toast==='function') toast('Hail event not found','error'); return; }
    var text=(isConfirmed(h)?'Confirmed Hail Lead Opportunity':'Radar-Indicated Hail Lead Opportunity')+'\n\nArea: '+areaName(h)+', '+countyName(h)+', '+(h.state||'')+'\nDate: '+fmtDate(h.event_date)+'\nHail Size: '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+' inches':'Unknown')+'\nSource: '+sourceLabel(h)+'\nCoordinates: '+coordText(h)+'\n\nRecommended action: check customers and open leads near this area, tag likely properties as Potential Hail Lead, and schedule inspections within the next 3 to 5 days.';
    navigator.clipboard.writeText(text).then(function(){ if(typeof toast==='function') toast('Hail event brief copied'); });
  };
  window.mfrRenderHailSideList = function(){
    var wrap=byId('mfr-hail-list'); if(!wrap) return; var q=String(byId('hail-search')?.value||'').toLowerCase();
    var events=currentEvents().filter(function(h){ return !q || [areaName(h),countyName(h),h.state,h.source,h.event_date,h.magnitude,coordText(h)].join(' ').toLowerCase().includes(q); }).slice(0,18);
    if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records for this filter yet</h3><p>Try All Tracked States, a wider date range, a smaller hail size, or run sync.</p></div>'; return; }
    wrap.innerHTML=events.map(function(h){ var m=num(h.magnitude,0); var label=isConfirmed(h)?'Confirmed report':'Radar signal'; return '<div class="mfr-hail-event-card"><strong>'+esc(m?m.toFixed(2)+'&quot; hail near '+areaName(h):'Hail near '+areaName(h))+'</strong><p>'+esc(countyName(h))+', '+esc(h.state||'')+' · '+esc(fmtDate(h.event_date))+'</p><span class="mfr-hail-pill">'+esc(label)+'</span><span class="mfr-hail-pill">'+esc(sourceLabel(h))+'</span>'+(coordText(h)?'<span class="mfr-hail-pill">'+esc(coordText(h))+'</span>':'')+'<div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+esc(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+esc(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>'; }).join('');
    var head=document.querySelector('.mfr-hail-side-head'); if(head && !byId('mfr-hail-pdf-btn')) head.insertAdjacentHTML('beforeend','<button id="mfr-hail-pdf-btn" class="btn btn-xs btn-primary" onclick="mfrOpenHailReport()">PDF Report</button>');
  };
  window.mfrOpenHailReport = function(){
    var ins=buildInsights(); var rows=reportRows(ins.largest); var countyList=ins.counties.length?ins.counties.map(function(c){return '<li><strong>'+esc(c.name)+' County</strong><span>'+c.count+' report(s) · max '+(c.max?c.max.toFixed(2)+'”':'N/A')+'</span></li>';}).join(''):'<li>No confirmed county data yet.</li>';
    var areaCloud=ins.areas.length?ins.areas.map(function(a){return '<span>'+esc(a.name)+'</span>';}).join(''):'<span>No named areas yet</span>';
    var sourceNote=ins.confirmed.length ? 'Prioritizing confirmed IEM/NWS Local Storm Reports and SPC reports. Radar signals are used as supporting evidence.' : 'No confirmed local storm reports found for this filter yet. Showing radar-indicated hail signals as lead indicators only.';
    var html='<div class="modal-overlay mfr-hail-report-modal" id="mfr-hail-report-modal"><div class="mfr-hail-report-sheet"><div class="mfr-hail-report-head"><div><div class="mfr-hail-kicker">Storm Response Brief</div><h2>Hail Intelligence Report</h2><p>'+esc(byId('hail-state')?.selectedOptions?.[0]?.textContent||'Current filter')+' · '+esc(byId('hail-days')?.selectedOptions?.[0]?.textContent||'')+' · '+esc(byId('hail-min')?.selectedOptions?.[0]?.textContent||'')+'</p></div><div class="mfr-hail-report-actions"><button class="btn btn-outline" onclick="mfrCloseHailReport()">Close</button><button class="btn btn-primary" onclick="mfrPrintHailReport()">Print / Save PDF</button></div></div><div class="mfr-hail-report-stats"><div><span>Confirmed</span><strong>'+ins.confirmed.length+'</strong></div><div><span>Radar Signals</span><strong>'+ins.radar.length+'</strong></div><div><span>Max Size</span><strong>'+(ins.max?ins.max.toFixed(2)+'”':'—')+'</strong></div><div><span>Alerts</span><strong>'+ins.alerts.length+'</strong></div></div><div class="mfr-hail-report-grid"><div class="mfr-hail-report-panel wide"><h3>Report Basis</h3><p>'+esc(sourceNote)+'</p></div><div class="mfr-hail-report-panel"><h3>Most Affected Counties</h3><ol class="mfr-hail-report-list">'+countyList+'</ol></div><div class="mfr-hail-report-panel"><h3>Affected Towns / Areas</h3><div class="mfr-hail-area-cloud">'+areaCloud+'</div></div><div class="mfr-hail-report-panel wide"><h3>Largest Confirmed Hail Reports</h3><div class="mfr-table-scroll"><table class="mfr-hail-report-table"><thead><tr><th>Size</th><th>Area</th><th>County</th><th>Date</th><th>Source</th></tr></thead><tbody>'+rows+'</tbody></table></div></div><div class="mfr-hail-report-panel wide"><h3>Recommended Roofing Response</h3><ul class="mfr-hail-response-list"><li>Prioritize confirmed report areas first, then use radar-indicated clusters as secondary lead indicators.</li><li>Filter customers and open leads in the affected towns/counties.</li><li>Tag likely homes as Potential Hail Lead and schedule inspection blocks over the next 3 to 5 days.</li><li>Use claim-aware messaging for homeowners with older roofs, prior claims, or active storm exposure.</li></ul></div></div><div class="mfr-hail-report-foot">Generated '+esc(new Date().toLocaleString())+' · MFR Command Center · arsenalmediaco.com</div></div></div>';
    document.body.insertAdjacentHTML('beforeend', html);
  };
  window.mfrCloseHailReport = function(){ byId('mfr-hail-report-modal')?.remove(); };
  window.mfrPrintHailReport = function(){ window.print(); };
})();
