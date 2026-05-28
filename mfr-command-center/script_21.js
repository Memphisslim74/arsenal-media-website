
/* MFR PATCH: Hail Intelligence Pro Brief + PDF Report */
(function(){
  function esc(v){
    return String(v == null ? '' : v).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch];});
  }
  function num(v,d){ var n=Number(v); return Number.isFinite(n)?n:(d||0); }
  function fmtDate(v){ try{ if(!v) return '—'; return new Date(v+'T00:00:00').toLocaleDateString(); }catch(_){ return String(v||'—'); } }
  function titleCase(s){ return String(s||'').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function areaName(h){
    var loc = h.location || h.city || h.town || h.place || '';
    loc = String(loc || '').trim();
    if(loc && !/^unknown$/i.test(loc)) return titleCase(loc);
    var county = String(h.county || '').replace(/\s+county$/i,'').trim();
    return county ? titleCase(county) + ' County' : 'Unknown Area';
  }
  function countyName(h){
    var c = String(h.county || '').trim();
    if(!c) return 'Unknown County';
    c = c.replace(/\s+county$/i,'');
    return titleCase(c) + ' County';
  }
  function eventDateRange(events){
    if(!events.length) return 'No events in current filter';
    var times = events.map(function(e){return new Date(e.event_date || e.created_at || Date.now()).getTime();}).filter(Number.isFinite).sort(function(a,b){return a-b;});
    if(!times.length) return 'Current filter';
    var a = new Date(times[0]).toLocaleDateString();
    var b = new Date(times[times.length-1]).toLocaleDateString();
    return a === b ? a : a + ' – ' + b;
  }
  function groupStats(events, keyFn){
    var map = {};
    events.forEach(function(h){
      var key = keyFn(h);
      if(!map[key]) map[key] = { name:key, count:0, max:0, dates:{}, examples:[] };
      map[key].count++;
      map[key].max = Math.max(map[key].max, num(h.magnitude,0));
      if(h.event_date) map[key].dates[h.event_date] = true;
      if(map[key].examples.length < 3) map[key].examples.push(h);
    });
    return Object.values(map).sort(function(a,b){ return (b.count-a.count) || (b.max-a.max) || a.name.localeCompare(b.name); });
  }
  function getCurrentHailFilterLabel(){
    var stateSel = document.getElementById('hail-state');
    var daysSel = document.getElementById('hail-days');
    var minSel = document.getElementById('hail-min');
    return {
      state: stateSel ? (stateSel.options[stateSel.selectedIndex]?.text || stateSel.value || 'All Tracked States') : 'Current Area',
      days: daysSel ? (daysSel.options[daysSel.selectedIndex]?.text || (daysSel.value + ' days')) : 'Current Range',
      min: minSel ? (minSel.options[minSel.selectedIndex]?.text || (minSel.value + '+')) : 'Current Minimum'
    };
  }
  function buildInsight(){
    var payload = window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {};
    var events = (payload.hailEvents || []).slice().filter(function(h){return h;});
    var alerts = payload.stormAlerts || [];
    var swaths = payload.hailSwaths || [];
    var max = events.reduce(function(m,h){ return Math.max(m,num(h.magnitude,0)); },0);
    var counties = groupStats(events, countyName).slice(0,6);
    var areas = groupStats(events, areaName).filter(function(x){return x.name && x.name !== 'Unknown Area';}).slice(0,12);
    var largest = events.slice().sort(function(a,b){ return num(b.magnitude,0)-num(a.magnitude,0) || String(b.event_date||'').localeCompare(String(a.event_date||'')); }).slice(0,8);
    var dates = eventDateRange(events);
    var filter = getCurrentHailFilterLabel();
    var topCounty = counties[0];
    var response = [];
    if(events.length){
      if(topCounty) response.push('Prioritize outreach in ' + topCounty.name + ' first. It has the highest concentration in the current filter with ' + topCounty.count + ' reports and max hail of ' + (topCounty.max?topCounty.max.toFixed(2)+' inches':'unknown size') + '.');
      if(max >= 2) response.push('Treat this as a high-priority storm response area. Two-inch-plus hail is strong justification for urgent inspection outreach.');
      else if(max >= 1.5) response.push('Use inspection-focused messaging. 1.50 inch hail can be enough to create roof, vent, gutter, and soft-metal damage worth documenting.');
      else if(max >= 1) response.push('Use awareness and inspection messaging. One-inch hail can still create claim-worthy damage depending on roof age, material, and storm duration.');
      response.push('Filter customers/leads by the affected towns and counties, tag likely prospects as Potential Hail Lead, then schedule inspection blocks for the next 3 to 5 days.');
    } else {
      response.push('No hail reports are stored for this exact filter. Try All Tracked States, a wider date range, or a smaller hail-size threshold, then run sync again.');
    }
    return { payload:payload, events:events, alerts:alerts, swaths:swaths, max:max, counties:counties, areas:areas, largest:largest, dates:dates, filter:filter, response:response };
  }
  function briefText(ins){
    var lines = [];
    lines.push('MFR Hail Intelligence Brief');
    lines.push('');
    lines.push('State/Area: ' + ins.filter.state);
    lines.push('Date Range: ' + ins.filter.days + ' (' + ins.dates + ')');
    lines.push('Minimum Hail Size: ' + ins.filter.min);
    lines.push('Total Hail Reports: ' + ins.events.length);
    lines.push('Active Alerts: ' + ins.alerts.length);
    lines.push('Swaths: ' + ins.swaths.length);
    lines.push('Max Hail Size: ' + (ins.max ? ins.max.toFixed(2) + ' inches' : 'N/A'));
    lines.push('');
    lines.push('Most Affected Counties:');
    if(ins.counties.length) ins.counties.slice(0,5).forEach(function(c,i){ lines.push((i+1)+'. '+c.name+' — '+c.count+' reports, max '+(c.max?c.max.toFixed(2)+'"':'N/A')); });
    else lines.push('No county data available for this filter.');
    lines.push('');
    lines.push('Affected Towns / Areas:');
    if(ins.areas.length) lines.push(ins.areas.slice(0,10).map(function(a){ return a.name; }).join(', '));
    else lines.push('No town/location data available yet. Run the latest Worker sync to enrich SPC location names.');
    lines.push('');
    lines.push('Largest Hail Reports:');
    if(ins.largest.length) ins.largest.slice(0,5).forEach(function(h){ lines.push('• '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'"':'Size unknown')+' near '+areaName(h)+', '+countyName(h)+' on '+fmtDate(h.event_date)+' ('+(h.source||'NOAA/SPC')+')'); });
    else lines.push('No hail reports for the current filter.');
    lines.push('');
    lines.push('Recommended Roofing Response:');
    ins.response.forEach(function(r){ lines.push('• '+r); });
    return lines.join('\n');
  }
  function svgMap(ins){
    var events = ins.events.filter(function(h){return Number.isFinite(num(h.lat,NaN)) && Number.isFinite(num(h.lng,NaN));});
    var w=900,h=420,p=46;
    if(!events.length){
      return '<div class="mfr-hail-report-map-empty">No mapped hail points for this filter.</div>';
    }
    var lats=events.map(function(e){return num(e.lat,0);}), lngs=events.map(function(e){return num(e.lng,0);});
    var minLat=Math.min.apply(null,lats), maxLat=Math.max.apply(null,lats), minLng=Math.min.apply(null,lngs), maxLng=Math.max.apply(null,lngs);
    if(minLat===maxLat){minLat-=.4;maxLat+=.4;} if(minLng===maxLng){minLng-=.4;maxLng+=.4;}
    function x(lng){ return p + ((lng-minLng)/(maxLng-minLng))*(w-p*2); }
    function y(lat){ return h-p - ((lat-minLat)/(maxLat-minLat))*(h-p*2); }
    var points = events.slice(0,350).map(function(e){
      var m=num(e.magnitude,0); var r=Math.max(4, Math.min(15, 4+m*5)); var color=m>=2?'#dc2626':m>=1.25?'#f97316':'#2563eb';
      return '<circle cx="'+x(num(e.lng,0)).toFixed(1)+'" cy="'+y(num(e.lat,0)).toFixed(1)+'" r="'+r.toFixed(1)+'" fill="'+color+'" fill-opacity="0.55" stroke="'+color+'" stroke-width="2" />';
    }).join('');
    var labels = ins.areas.slice(0,6).map(function(a){
      var ex=a.examples && a.examples[0]; if(!ex) return '';
      return '<text x="'+x(num(ex.lng,0)).toFixed(1)+'" y="'+(y(num(ex.lat,0))-14).toFixed(1)+'" font-size="18" font-weight="800" fill="#0f172a">'+esc(a.name)+'</text>';
    }).join('');
    return '<svg class="mfr-hail-report-map-svg" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="Hail activity map">'
      + '<defs><linearGradient id="mfrHailMapBg" x1="0" x2="1"><stop offset="0" stop-color="#eff6ff"/><stop offset="1" stop-color="#f8fafc"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="'+w+'" height="'+h+'" rx="26" fill="url(#mfrHailMapBg)"/>'
      + '<path d="M80 310 C210 230 300 300 420 210 S680 170 830 90" fill="none" stroke="#bfdbfe" stroke-width="16" stroke-linecap="round" opacity=".9"/>'
      + '<g opacity=".24"><path d="M90 80 H820 M90 160 H820 M90 240 H820 M90 320 H820 M180 50 V370 M340 50 V370 M500 50 V370 M660 50 V370" stroke="#94a3b8" stroke-width="1"/></g>'
      + points + labels
      + '<text x="46" y="46" font-size="20" font-weight="900" fill="#1e3a8a">Storm activity snapshot</text>'
      + '<text x="46" y="74" font-size="14" fill="#475569">Point locations from filtered SPC/NOAA hail records. Not a survey map.</text>'
      + '</svg>';
  }
  function reportHtml(ins){
    var counties = ins.counties.slice(0,5).map(function(c,i){return '<li><strong>'+esc(c.name)+'</strong><span>'+c.count+' reports · max '+(c.max?c.max.toFixed(2)+'”':'N/A')+'</span></li>';}).join('') || '<li><strong>No county records</strong><span>Try a wider filter or run sync.</span></li>';
    var areas = ins.areas.slice(0,12).map(function(a){return '<span>'+esc(a.name)+'</span>';}).join('') || '<span>No towns loaded yet</span>';
    var largest = ins.largest.slice(0,6).map(function(h){return '<tr><td>'+esc(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+'”':'—')+'</td><td>'+esc(areaName(h))+'</td><td>'+esc(countyName(h))+'</td><td>'+esc(fmtDate(h.event_date))+'</td><td>'+esc(h.source||'NOAA/SPC')+'</td></tr>';}).join('') || '<tr><td colspan="5">No hail reports for this filter.</td></tr>';
    var response = ins.response.map(function(r){return '<li>'+esc(r)+'</li>';}).join('');
    return '<div class="mfr-hail-report-sheet">'
      + '<div class="mfr-hail-report-head"><div><div class="mfr-hail-kicker">Storm Response Brief</div><h2>Hail Intelligence Report</h2><p>'+esc(ins.filter.state)+' · '+esc(ins.filter.days)+' · '+esc(ins.filter.min)+' · '+esc(ins.dates)+'</p></div><div class="mfr-hail-report-actions"><button class="btn btn-outline" onclick="mfrCloseHailReport()">Close</button><button class="btn btn-primary" onclick="mfrPrintHailReport()">Print / Save PDF</button></div></div>'
      + '<div class="mfr-hail-report-stats"><div><span>Reports</span><strong>'+ins.events.length+'</strong></div><div><span>Max Size</span><strong>'+(ins.max?ins.max.toFixed(2)+'”':'—')+'</strong></div><div><span>Active Alerts</span><strong>'+ins.alerts.length+'</strong></div><div><span>Swaths</span><strong>'+ins.swaths.length+'</strong></div></div>'
      + '<div class="mfr-hail-report-grid"><div class="mfr-hail-report-panel wide">'+svgMap(ins)+'</div><div class="mfr-hail-report-panel"><h3>Most Affected Counties</h3><ol class="mfr-hail-report-list">'+counties+'</ol></div><div class="mfr-hail-report-panel"><h3>Affected Towns / Areas</h3><div class="mfr-hail-area-cloud">'+areas+'</div></div><div class="mfr-hail-report-panel wide"><h3>Largest Hail Reports</h3><div class="mfr-table-scroll"><table class="mfr-hail-report-table"><thead><tr><th>Size</th><th>Area</th><th>County</th><th>Date</th><th>Source</th></tr></thead><tbody>'+largest+'</tbody></table></div></div><div class="mfr-hail-report-panel wide"><h3>Recommended Roofing Response</h3><ul class="mfr-hail-response-list">'+response+'</ul></div></div>'
      + '<div class="mfr-hail-report-foot">Generated '+esc(new Date().toLocaleString())+' · MFR Command Center · arsenalmediaco.com</div>'
      + '</div>';
  }
  window.mfrBuildHailInsight = buildInsight;
  window.mfrCopyHailBrief = function(){
    var ins = buildInsight();
    navigator.clipboard.writeText(briefText(ins)).then(function(){ if(typeof toast==='function') toast('Detailed storm response brief copied'); });
  };
  window.mfrOpenHailReport = function(){
    var existing=document.getElementById('mfr-hail-report-overlay'); if(existing) existing.remove();
    var div=document.createElement('div'); div.id='mfr-hail-report-overlay'; div.className='mfr-hail-report-overlay'; div.innerHTML=reportHtml(buildInsight()); document.body.appendChild(div);
  };
  window.mfrCloseHailReport = function(){ document.getElementById('mfr-hail-report-overlay')?.remove(); };
  window.mfrPrintHailReport = function(){ window.print(); };
  window.mfrCopyHailEventBrief = function(id){
    var payload = window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {};
    var h = (payload.hailEvents||[]).find(function(x){return String(x.id)===String(id);});
    if(!h){ if(typeof toast==='function') toast('Hail event not found','error'); return; }
    var text = 'Hail Lead Opportunity\n\nArea: '+areaName(h)+', '+countyName(h)+', '+(h.state||'')+'\nDate: '+fmtDate(h.event_date)+'\nHail Size: '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+' inches':'Unknown')+'\nSource: '+(h.source||'NOAA/SPC')+'\nCoordinates: '+h.lat+', '+h.lng+'\n\nRecommended action: check customers and open leads near this area, tag likely properties as Potential Hail Lead, and schedule roof inspections within the next 3 to 5 days.';
    navigator.clipboard.writeText(text).then(function(){ if(typeof toast==='function') toast('Hail event brief copied'); });
  };
  window.mfrRenderHailSideList = function(){
    var wrap=document.getElementById('mfr-hail-list'); if(!wrap) return;
    var q=String(document.getElementById('hail-search')?.value||'').toLowerCase();
    var payload = window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {};
    var events=(payload.hailEvents||[]).filter(function(h){ return !q || [h.location,h.city,h.town,h.county,h.state,h.source,h.event_date,h.magnitude].join(' ').toLowerCase().includes(q); }).slice(0,12);
    if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records for this filter yet</h3><p>Try All Tracked States, a wider date range, a smaller hail size, or run sync. The map will still move to the selected state even when there are no reports.</p></div>'; return; }
    wrap.innerHTML=events.map(function(h){ var m=num(h.magnitude,0); return '<div class="mfr-hail-event-card"><strong>'+esc(m?m.toFixed(2)+'\" hail near '+areaName(h):'Hail signal near '+areaName(h))+'</strong><p>'+esc(countyName(h))+', '+esc(h.state||'')+' · '+esc(fmtDate(h.event_date))+' · '+esc(h.source||'NOAA/SPC')+'</p><span class="mfr-hail-pill">'+esc(h.location?titleCase(h.location):'Location from '+(h.source||'NOAA'))+'</span><div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+esc(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+esc(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>'; }).join('');
  };
  function addReportButton(){
    var head=document.querySelector('.mfr-hail-side-head');
    if(head && !head.querySelector('[data-mfr-hail-report-btn]')){
      var btn=document.createElement('button'); btn.className='btn btn-xs btn-primary'; btn.setAttribute('data-mfr-hail-report-btn','1'); btn.textContent='PDF Report'; btn.onclick=window.mfrOpenHailReport; head.appendChild(btn);
    }
  }
  var oldFetch = window.mfrFetchHailPayload;
  if(typeof oldFetch === 'function' && !oldFetch.__mfrReportPayloadWrapped){
    var fetchWrapped = async function(){ var payload = await oldFetch.apply(this, arguments); window.hailLastPayload = payload; return payload; };
    fetchWrapped.__mfrReportPayloadWrapped = true; window.mfrFetchHailPayload = fetchWrapped;
  }
  var oldLoad = window.mfrLoadHailData;
  if(typeof oldLoad === 'function' && !oldLoad.__mfrReportWrapped){
    var wrapped = async function(){ var r=await oldLoad.apply(this, arguments); try{ window.hailLastPayload = hailLastPayload; }catch(_){} addReportButton(); return r; };
    wrapped.__mfrReportWrapped = true; window.mfrLoadHailData = wrapped;
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(addReportButton,1000); });
})();

