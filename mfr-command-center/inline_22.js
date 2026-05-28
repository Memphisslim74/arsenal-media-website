
/* MFR PATCH: Hail report location enrichment display override */
(function(){
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch];}); }
  function num(v,d){ var n=Number(v); return Number.isFinite(n)?n:(d||0); }
  function fmtDate(v){ try{ if(!v) return '—'; return new Date(String(v).slice(0,10)+'T00:00:00').toLocaleDateString(); }catch(_){ return String(v||'—'); } }
  function titleCase(s){ return String(s||'').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function isUnknown(v){ return !v || /^unknown(\s+(area|county))?$/i.test(String(v).trim()) || /^null$/i.test(String(v).trim()); }
  function coordLabel(h){ var lat=num(h && h.lat,NaN), lng=num(h && h.lng,NaN); return Number.isFinite(lat)&&Number.isFinite(lng) ? 'Near '+lat.toFixed(2)+', '+lng.toFixed(2) : 'Mapped Point'; }
  function cleanCounty(c){ c=String(c||'').trim(); if(isUnknown(c)) return ''; return titleCase(c.replace(/\s+county$/i,'')); }
  function areaName(h){
    h=h||{};
    var loc = h.location || h.nearest_city || h.city || h.town || h.place || h.area || '';
    loc = String(loc || '').trim();
    if(!isUnknown(loc)) return titleCase(loc);
    var county = cleanCounty(h.county);
    if(county) return county + ' County Area';
    return coordLabel(h);
  }
  function countyName(h){
    h=h||{}; var c = cleanCounty(h.county);
    if(c) return c + ' County';
    if(h.state) return String(h.state).toUpperCase() + ' County Pending';
    return 'County Pending';
  }
  function locationSource(h){
    h=h||{};
    if(!isUnknown(h.location)) return h.source === 'SPC' ? 'SPC reported location' : 'NWS point lookup';
    if(!isUnknown(h.county)) return 'County from source/lookup';
    return 'Coordinate fallback';
  }
  function groupStats(events, keyFn){
    var map={};
    (events||[]).forEach(function(h){
      var key = keyFn(h);
      if(!key || /^unknown/i.test(key)) return;
      if(!map[key]) map[key]={name:key,count:0,max:0,dates:{},examples:[]};
      map[key].count++; map[key].max=Math.max(map[key].max,num(h.magnitude,0)); if(h.event_date) map[key].dates[h.event_date]=true; if(map[key].examples.length<3) map[key].examples.push(h);
    });
    return Object.values(map).sort(function(a,b){ return (b.count-a.count)||(b.max-a.max)||a.name.localeCompare(b.name); });
  }
  function eventDateRange(events){
    if(!events.length) return 'No events in current filter';
    var times=events.map(function(e){return new Date(e.event_date||e.created_at||Date.now()).getTime();}).filter(Number.isFinite).sort(function(a,b){return a-b;});
    if(!times.length) return 'Current filter';
    var a=new Date(times[0]).toLocaleDateString(), b=new Date(times[times.length-1]).toLocaleDateString(); return a===b?a:a+' – '+b;
  }
  function getFilter(){
    var s=document.getElementById('hail-state'), d=document.getElementById('hail-days'), m=document.getElementById('hail-min');
    return { state:s?(s.options[s.selectedIndex]?.text||s.value||'All Tracked States'):'Current Area', days:d?(d.options[d.selectedIndex]?.text||d.value+' days'):'Current Range', min:m?(m.options[m.selectedIndex]?.text||m.value+'+'):'Current Minimum' };
  }
  function buildInsight(){
    var payload=window.hailLastPayload || (typeof hailLastPayload!=='undefined'?hailLastPayload:null) || {};
    var events=(payload.hailEvents||[]).slice().filter(Boolean);
    var alerts=payload.stormAlerts||[], swaths=payload.hailSwaths||[];
    var max=events.reduce(function(m,h){return Math.max(m,num(h.magnitude,0));},0);
    var counties=groupStats(events, countyName).slice(0,8);
    var areas=groupStats(events, areaName).slice(0,14);
    var largest=events.slice().sort(function(a,b){ return num(b.magnitude,0)-num(a.magnitude,0) || String(b.event_date||'').localeCompare(String(a.event_date||'')); }).slice(0,10);
    var topCounty=counties[0], topArea=areas[0];
    var response=[];
    if(events.length){
      if(topCounty) response.push('Prioritize '+topCounty.name+' first. It has '+topCounty.count+' report(s) in this filter with a max hail size of '+(topCounty.max?topCounty.max.toFixed(2)+' inches':'unknown size')+'.');
      if(topArea) response.push('Start call blocks around '+topArea.name+' and nearby neighborhoods, then work outward by customer density and claim activity.');
      if(max>=2) response.push('Two-inch-plus hail is a high-priority roofing response event. Lead with inspection urgency and documentation for possible insurance claims.');
      else if(max>=1.5) response.push('One-and-a-half-inch hail can damage shingles, vents, gutters, flashing, and soft metals. Use inspection-focused outreach.');
      else if(max>=1) response.push('One-inch hail can still create claim-worthy damage depending on roof age, material, and storm duration. Use awareness and inspection messaging.');
      response.push('Filter customers and open leads by the affected towns/counties, tag likely prospects as Potential Hail Lead, and schedule inspection blocks for the next 3 to 5 days.');
    } else response.push('No hail reports are stored for this exact filter. Try All Tracked States, a wider date range, a smaller hail-size threshold, then run sync again.');
    return {payload:payload,events:events,alerts:alerts,swaths:swaths,max:max,counties:counties,areas:areas,largest:largest,dates:eventDateRange(events),filter:getFilter(),response:response};
  }
  function briefText(ins){
    var lines=[]; lines.push('MFR Hail Intelligence Brief','');
    lines.push('State/Area: '+ins.filter.state); lines.push('Date Range: '+ins.filter.days+' ('+ins.dates+')'); lines.push('Minimum Hail Size: '+ins.filter.min); lines.push('Total Hail Reports: '+ins.events.length); lines.push('Active Alerts: '+ins.alerts.length); lines.push('Swaths: '+ins.swaths.length); lines.push('Max Hail Size: '+(ins.max?ins.max.toFixed(2)+' inches':'N/A'), '');
    lines.push('Most Affected Counties:'); if(ins.counties.length) ins.counties.slice(0,5).forEach(function(c,i){lines.push((i+1)+'. '+c.name+' — '+c.count+' report(s), max '+(c.max?c.max.toFixed(2)+'"':'N/A'));}); else lines.push('County names are still pending for this filter. Run the latest Worker sync to enrich SWDI points.');
    lines.push('', 'Affected Towns / Areas:'); if(ins.areas.length) lines.push(ins.areas.slice(0,12).map(function(a){return a.name;}).join(', ')); else lines.push('Town names are still pending for this filter. Coordinate fallback is available in the largest reports section.');
    lines.push('', 'Largest Hail Reports:'); if(ins.largest.length) ins.largest.slice(0,8).forEach(function(h){lines.push('• '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'"':'Size unknown')+' near '+areaName(h)+', '+countyName(h)+' on '+fmtDate(h.event_date)+' ('+(h.source||'NOAA/SPC')+', '+locationSource(h)+')');}); else lines.push('No hail reports for the current filter.');
    lines.push('', 'Recommended Roofing Response:'); ins.response.forEach(function(r){ lines.push('• '+r); });
    return lines.join('\n');
  }
  function svgMap(ins){
    var events=ins.events.filter(function(h){return Number.isFinite(num(h.lat,NaN))&&Number.isFinite(num(h.lng,NaN));}); var w=900,h=420,p=46;
    if(!events.length) return '<div class="mfr-hail-report-map-empty">No mapped hail points for this filter.</div>';
    var lats=events.map(function(e){return num(e.lat,0);}), lngs=events.map(function(e){return num(e.lng,0);}); var minLat=Math.min.apply(null,lats), maxLat=Math.max.apply(null,lats), minLng=Math.min.apply(null,lngs), maxLng=Math.max.apply(null,lngs); if(minLat===maxLat){minLat-=.4;maxLat+=.4;} if(minLng===maxLng){minLng-=.4;maxLng+=.4;}
    function x(lng){return p+((lng-minLng)/(maxLng-minLng))*(w-p*2);} function y(lat){return h-p-((lat-minLat)/(maxLat-minLat))*(h-p*2);}
    var points=events.slice(0,500).map(function(e){var m=num(e.magnitude,0), r=Math.max(4,Math.min(16,4+m*5)), color=m>=2?'#dc2626':m>=1.25?'#f97316':'#2563eb'; return '<circle cx="'+x(num(e.lng,0)).toFixed(1)+'" cy="'+y(num(e.lat,0)).toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+color+'" fill-opacity="0.55" stroke="'+color+'" stroke-width="2" />';}).join('');
    var labels=ins.areas.slice(0,7).map(function(a){var ex=a.examples&&a.examples[0]; if(!ex) return ''; return '<text x="'+x(num(ex.lng,0)).toFixed(1)+'" y="'+(y(num(ex.lat,0))-14).toFixed(1)+'" font-size="18" font-weight="900" fill="#0f172a">'+esc(a.name)+'</text>';}).join('');
    return '<svg class="mfr-hail-report-map-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Hail activity map"><defs><linearGradient id="mfrHailMapBg2" x1="0" x2="1"><stop offset="0" stop-color="#eff6ff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs><rect x="0" y="0" width="'+w+'" height="'+h+'" rx="26" fill="url(#mfrHailMapBg2)"/><path d="M80 310 C210 230 300 300 420 210 S680 170 830 90" fill="none" stroke="#bfdbfe" stroke-width="16" stroke-linecap="round" opacity=".9"/><g opacity=".24"><path d="M90 80 H820 M90 160 H820 M90 240 H820 M90 320 H820 M180 50 V370 M340 50 V370 M500 50 V370 M660 50 V370" stroke="#94a3b8" stroke-width="1"/></g>'+points+labels+'<text x="46" y="46" font-size="20" font-weight="900" fill="#1e3a8a">Storm activity snapshot</text><text x="46" y="74" font-size="14" fill="#475569">Generated from the same filtered hail points displayed on the map.</text></svg>';
  }
  function reportHtml(ins){
    var counties=ins.counties.slice(0,6).map(function(c){return '<li><strong>'+esc(c.name)+'</strong><span>'+c.count+' report(s) · max '+(c.max?c.max.toFixed(2)+'”':'N/A')+'</span></li>';}).join('') || '<li><strong>County enrichment pending</strong><span>Run the latest Worker sync to enrich radar points from coordinates.</span></li>';
    var areas=ins.areas.slice(0,14).map(function(a){return '<span>'+esc(a.name)+'</span>';}).join('') || '<span>Town enrichment pending</span>';
    var largest=ins.largest.slice(0,8).map(function(h){return '<tr><td>'+esc(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'”':'—')+'</td><td>'+esc(areaName(h))+'</td><td>'+esc(countyName(h))+'</td><td>'+esc(fmtDate(h.event_date))+'</td><td>'+esc((h.source||'NOAA/SPC')+' · '+locationSource(h))+'</td></tr>';}).join('') || '<tr><td colspan="5">No hail reports for this filter.</td></tr>';
    return '<div class="mfr-hail-report-sheet"><div class="mfr-hail-report-head"><div><div class="mfr-hail-kicker">Storm Response Brief</div><h2>Hail Intelligence Report</h2><p>'+esc(ins.filter.state)+' · '+esc(ins.filter.days)+' · '+esc(ins.filter.min)+' · '+esc(ins.dates)+'</p></div><div class="mfr-hail-report-actions"><button class="btn btn-outline" onclick="mfrCloseHailReport()">Close</button><button class="btn btn-primary" onclick="mfrPrintHailReport()">Print / Save PDF</button></div></div><div class="mfr-hail-report-stats"><div><span>Reports</span><strong>'+ins.events.length+'</strong></div><div><span>Max Size</span><strong>'+(ins.max?ins.max.toFixed(2)+'”':'—')+'</strong></div><div><span>Active Alerts</span><strong>'+ins.alerts.length+'</strong></div><div><span>Swaths</span><strong>'+ins.swaths.length+'</strong></div></div><div class="mfr-hail-report-grid"><div class="mfr-hail-report-panel wide">'+svgMap(ins)+'</div><div class="mfr-hail-report-panel"><h3>Most Affected Counties</h3><ol class="mfr-hail-report-list">'+counties+'</ol></div><div class="mfr-hail-report-panel"><h3>Affected Towns / Areas</h3><div class="mfr-hail-area-cloud">'+areas+'</div></div><div class="mfr-hail-report-panel wide"><h3>Largest Hail Reports</h3><div class="mfr-table-scroll"><table class="mfr-hail-report-table"><thead><tr><th>Size</th><th>Area</th><th>County</th><th>Date</th><th>Source</th></tr></thead><tbody>'+largest+'</tbody></table></div></div><div class="mfr-hail-report-panel wide"><h3>Recommended Roofing Response</h3><ul class="mfr-hail-response-list">'+ins.response.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ul></div></div><div class="mfr-hail-report-foot">Generated '+esc(new Date().toLocaleString())+' · MFR Command Center · arsenalmediaco.com</div></div>';
  }
  window.mfrBuildHailInsight = buildInsight;
  window.mfrCopyHailBrief = function(){ var ins=buildInsight(); navigator.clipboard.writeText(briefText(ins)).then(function(){ if(typeof toast==='function') toast('Detailed hail brief copied'); }); };
  window.mfrOpenHailReport = function(){ var existing=document.getElementById('mfr-hail-report-overlay'); if(existing) existing.remove(); var div=document.createElement('div'); div.id='mfr-hail-report-overlay'; div.className='mfr-hail-report-overlay'; div.innerHTML=reportHtml(buildInsight()); document.body.appendChild(div); };
  window.mfrCopyHailEventBrief = function(id){ var payload=window.hailLastPayload || (typeof hailLastPayload!=='undefined'?hailLastPayload:null) || {}; var h=(payload.hailEvents||[]).find(function(x){return String(x.id)===String(id);}); if(!h){ if(typeof toast==='function') toast('Hail event not found','error'); return; } var text='Hail Lead Opportunity\n\nArea: '+areaName(h)+', '+countyName(h)+', '+(h.state||'')+'\nDate: '+fmtDate(h.event_date)+'\nHail Size: '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+' inches':'Unknown')+'\nSource: '+(h.source||'NOAA/SPC')+'\nLocation Method: '+locationSource(h)+'\nCoordinates: '+h.lat+', '+h.lng+'\n\nRecommended action: check customers and open leads near this area, tag likely properties as Potential Hail Lead, and schedule roof inspections within the next 3 to 5 days.'; navigator.clipboard.writeText(text).then(function(){ if(typeof toast==='function') toast('Hail event brief copied'); }); };
  window.mfrRenderHailSideList = function(){ var wrap=document.getElementById('mfr-hail-list'); if(!wrap) return; var q=String(document.getElementById('hail-search')?.value||'').toLowerCase(); var payload=window.hailLastPayload || (typeof hailLastPayload!=='undefined'?hailLastPayload:null) || {}; var events=(payload.hailEvents||[]).filter(function(h){ return !q || [h.location,h.nearest_city,h.city,h.town,h.county,h.state,h.source,h.event_date,h.magnitude,areaName(h),countyName(h)].join(' ').toLowerCase().includes(q); }).slice(0,12); if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records for this filter yet</h3><p>Try All Tracked States, a wider date range, a smaller hail size, or run sync.</p></div>'; return; } wrap.innerHTML=events.map(function(h){ var m=num(h.magnitude,0); return '<div class="mfr-hail-event-card"><strong>'+esc(m?m.toFixed(2)+'" hail near '+areaName(h):'Hail signal near '+areaName(h))+'</strong><p>'+esc(countyName(h))+', '+esc(h.state||'')+' · '+esc(fmtDate(h.event_date))+' · '+esc(h.source||'NOAA/SPC')+'</p><span class="mfr-hail-pill">'+esc(locationSource(h))+'</span><div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+esc(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+esc(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>'; }).join(''); };
})();
