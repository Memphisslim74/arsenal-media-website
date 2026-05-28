
(function(){
  function esc(v){ return String(v == null ? '' : v).replace(/[&<>\"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch];}); }
  function num(v,d){ var n=Number(v); return Number.isFinite(n)?n:(d||0); }
  function titleCase(s){ return String(s||'').toLowerCase().replace(/\b\w/g,function(c){return c.toUpperCase();}); }
  function fmtDate(v){ try{ if(!v) return '—'; return new Date(String(v).includes('T')?v:(v+'T00:00:00')).toLocaleDateString(); }catch(_){ return String(v||'—'); } }
  function coordText(h){ var lat=num(h&&h.lat, NaN), lng=num(h&&h.lng, NaN); return (Number.isFinite(lat)&&Number.isFinite(lng)) ? (lat.toFixed(2)+', '+lng.toFixed(2)) : ''; }
  function smartArea(h){
    var loc = String((h&& (h.location || h.nearest_city || h.city || h.town || h.place)) || '').trim();
    if(loc && !/^unknown/i.test(loc)) return titleCase(loc);
    var county = String((h&&h.county)||'').replace(/\s+county$/i,'').trim();
    if(county && !/^unknown/i.test(county)) return titleCase(county) + ' County Area';
    var coords = coordText(h); return coords ? 'Near '+coords : 'Location Pending';
  }
  function smartCounty(h){
    var c = String((h&&h.county)||'').trim().replace(/\s+county$/i,'');
    return c && !/^unknown/i.test(c) ? titleCase(c)+' County' : ((h&&h.state)?String(h.state).toUpperCase():'County Pending');
  }
  function locMethod(h){
    if(h && h.location) return 'Location from source';
    if(h && (h.nearest_city || h.city || h.town)) return 'Nearest city from coordinates';
    if(h && h.county && !/^unknown/i.test(h.county)) return 'County from coordinates';
    if(coordText(h)) return 'Coordinate fallback';
    return 'Location pending';
  }
  function payload(){ return window.hailLastPayload || (typeof hailLastPayload !== 'undefined' ? hailLastPayload : null) || {}; }
  function filteredEvents(){
    var q = String(document.getElementById('hail-search')?.value || '').toLowerCase();
    return (payload().hailEvents || []).filter(function(h){
      return !q || [h.location,h.nearest_city,h.city,h.town,h.county,h.state,h.source,h.event_date,h.magnitude,smartArea(h),smartCounty(h),coordText(h)].join(' ').toLowerCase().includes(q);
    });
  }
  function getWorkerUrl(){ return String(localStorage.getItem('mfr_hail_worker_url') || window.MFR_HAIL_WORKER_URL || '').trim().replace(/\/$/,''); }
  function showToast(msg,type){ if(typeof toast === 'function') toast(msg,type||'ok'); }

  window.mfrEnhanceHailConfig = function(){
    var cfg = document.getElementById('mfr-hail-config'); if(!cfg || document.getElementById('mfr-hail-sync-secret')) return;
    var saved = localStorage.getItem('mfr_hail_sync_secret') || '';
    cfg.insertAdjacentHTML('beforeend', '<div class="mfr-hail-secret-manager"><b>Saved Sync Secret</b><div class="mfr-hail-secret-note">Save the Worker SYNC_SECRET here so Run Sync does not ask every time on this device. This is stored only in this browser.</div><div class="mfr-hail-secret-row"><input class="fi" id="mfr-hail-sync-secret" type="password" placeholder="SYNC_SECRET" value="'+esc(saved)+'"><button class="btn btn-primary" onclick="mfrSaveHailSyncSecret()">Save Secret</button><button class="btn btn-outline" onclick="mfrClearHailSyncSecret()">Clear</button></div><div id="mfr-hail-sync-secret-status" class="mfr-hail-secret-status">'+(saved?'Sync secret saved on this device':'No sync secret saved yet')+'</div></div>');
  };
  window.mfrSaveHailSyncSecret = function(){
    var v = String(document.getElementById('mfr-hail-sync-secret')?.value || '').trim();
    if(v){ localStorage.setItem('mfr_hail_sync_secret', v); showToast('Sync secret saved on this device'); }
    else { localStorage.removeItem('mfr_hail_sync_secret'); showToast('Sync secret cleared','warn'); }
    var st=document.getElementById('mfr-hail-sync-secret-status'); if(st) st.textContent = v ? 'Sync secret saved on this device' : 'No sync secret saved yet';
  };
  window.mfrClearHailSyncSecret = function(){ localStorage.removeItem('mfr_hail_sync_secret'); var el=document.getElementById('mfr-hail-sync-secret'); if(el) el.value=''; var st=document.getElementById('mfr-hail-sync-secret-status'); if(st) st.textContent='No sync secret saved yet'; showToast('Sync secret cleared','warn'); };

  var oldToggle = window.mfrToggleHailConfig;
  window.mfrToggleHailConfig = function(){ if(typeof oldToggle === 'function') oldToggle.apply(this, arguments); else document.getElementById('mfr-hail-config')?.classList.toggle('show'); setTimeout(window.mfrEnhanceHailConfig, 20); };

  window.mfrHailManualSync = async function(){
    var api = getWorkerUrl();
    if(!api){ document.getElementById('mfr-hail-config')?.classList.add('show'); window.mfrEnhanceHailConfig(); showToast('Save your Worker URL first.','warn'); return; }
    var secret = localStorage.getItem('mfr_hail_sync_secret') || '';
    if(!secret){
      secret = prompt('Enter your Cloudflare Worker SYNC_SECRET to run ingestion now. It will be saved on this device.');
      if(!secret) return;
      localStorage.setItem('mfr_hail_sync_secret', secret);
    }
    try{
      showToast('Running hail sync...');
      var res = await fetch(api + '/api/sync', { method:'POST', headers:{ 'x-sync-secret': secret } });
      var data = await res.json().catch(function(){return {};});
      if(!res.ok) throw new Error(data.error || ('Sync failed: '+res.status));
      showToast('Hail sync complete');
      setTimeout(function(){ if(typeof mfrLoadHailData === 'function') mfrLoadHailData(); }, 700);
    }catch(err){ console.error(err); showToast('Sync failed: '+(err.message||err), 'error'); }
  };

  window.mfrRenderHailSideList = function(){
    var wrap=document.getElementById('mfr-hail-list'); if(!wrap) return;
    var events=filteredEvents().slice(0,12);
    if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records for this filter yet</h3><p>Try All Tracked States, a wider date range, a smaller hail size, or run sync.</p></div>'; return; }
    wrap.innerHTML=events.map(function(h){ var m=num(h.magnitude,0); var coords=coordText(h); return '<div class="mfr-hail-event-card"><strong>'+esc(m?m.toFixed(2)+'&quot; hail near '+smartArea(h):'Hail signal near '+smartArea(h))+'</strong><p>'+esc(smartCounty(h))+', '+esc(h.state||'')+' · '+esc(fmtDate(h.event_date))+' · '+esc(h.source||'NOAA/SPC')+'</p><span class="mfr-hail-pill">'+esc(locMethod(h))+'</span>'+(coords?'<span class="mfr-hail-pill">'+esc(coords)+'</span>':'')+'<div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+esc(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+esc(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>'; }).join('');
    if(document.querySelector('.mfr-hail-side-head') && !document.getElementById('mfr-hail-pdf-btn')){
      document.querySelector('.mfr-hail-side-head').insertAdjacentHTML('beforeend','<button id="mfr-hail-pdf-btn" class="btn btn-xs btn-primary" onclick="mfrOpenHailReport()">PDF Report</button>');
    }
  };

  window.mfrCopyHailEventBrief = function(id){
    var h=(payload().hailEvents||[]).find(function(x){return String(x.id)===String(id);});
    if(!h){ showToast('Hail event not found','error'); return; }
    var text='Hail Lead Opportunity\n\nArea: '+smartArea(h)+', '+smartCounty(h)+', '+(h.state||'')+'\nDate: '+fmtDate(h.event_date)+'\nHail Size: '+(num(h.magnitude,0)?num(h.magnitude,0).toFixed(2)+' inches':'Unknown')+'\nSource: '+(h.source||'NOAA/SPC')+'\nLocation Method: '+locMethod(h)+'\nCoordinates: '+(coordText(h)||'Not available')+'\n\nRecommended action: check customers and open leads near this area, tag likely properties as Potential Hail Lead, and schedule roof inspections within the next 3 to 5 days.';
    navigator.clipboard.writeText(text).then(function(){ showToast('Hail event brief copied'); });
  };

  window.mfrCopyHailBrief = function(){
    var events=filteredEvents(); var max=events.reduce(function(m,h){return Math.max(m,num(h.magnitude,0));},0);
    var top=events.slice().sort(function(a,b){return num(b.magnitude,0)-num(a.magnitude,0);}).slice(0,8);
    var byArea={}; events.forEach(function(h){var a=smartArea(h); if(!byArea[a]) byArea[a]={name:a,count:0,max:0}; byArea[a].count++; byArea[a].max=Math.max(byArea[a].max,num(h.magnitude,0));});
    var areas=Object.values(byArea).sort(function(a,b){return b.count-a.count || b.max-a.max;}).slice(0,8);
    var lines=['MFR Hail Intelligence Brief','', 'State/Area: '+(document.getElementById('hail-state')?.selectedOptions?.[0]?.textContent||'Current filter'), 'Reports: '+events.length, 'Max hail size: '+(max?max.toFixed(2)+' inches':'N/A'), ''];
    lines.push('Affected Areas:'); if(areas.length) areas.forEach(function(a,i){lines.push((i+1)+'. '+a.name+' — '+a.count+' report(s), max '+a.max.toFixed(2)+'"');}); else lines.push('No hail reports in the current filter.');
    lines.push('', 'Largest Hail Reports:'); if(top.length) top.forEach(function(h){lines.push('• '+num(h.magnitude,0).toFixed(2)+'" near '+smartArea(h)+', '+smartCounty(h)+' on '+fmtDate(h.event_date)+' ('+(h.source||'NOAA/SPC')+')');}); else lines.push('No hail reports in the current filter.');
    lines.push('', 'Recommended Roofing Response:', '• Prioritize affected areas with repeated reports and 1.25 inch or larger hail.', '• Filter customers and leads by the affected towns/counties.', '• Tag likely properties as Potential Hail Lead and schedule inspection blocks.');
    navigator.clipboard.writeText(lines.join('\n')).then(function(){ showToast('Detailed hail brief copied'); });
  };

  function reportHtml(){
    var events=filteredEvents(); var max=events.reduce(function(m,h){return Math.max(m,num(h.magnitude,0));},0); var largest=events.slice().sort(function(a,b){return num(b.magnitude,0)-num(a.magnitude,0);}).slice(0,10);
    var byArea={}; events.forEach(function(h){var a=smartArea(h); if(!byArea[a]) byArea[a]={name:a,count:0,max:0}; byArea[a].count++; byArea[a].max=Math.max(byArea[a].max,num(h.magnitude,0));});
    var areas=Object.values(byArea).sort(function(a,b){return b.count-a.count || b.max-a.max;}).slice(0,10).map(function(a){return '<span>'+esc(a.name)+' · '+a.count+'</span>';}).join('') || '<span>No hail areas in this filter</span>';
    var rows=largest.map(function(h){return '<tr><td>'+esc(num(h.magnitude,0).toFixed(2)+'”')+'</td><td>'+esc(smartArea(h))+'</td><td>'+esc(smartCounty(h))+'</td><td>'+esc(fmtDate(h.event_date))+'</td><td>'+esc((h.source||'NOAA/SPC')+' · '+locMethod(h))+'</td></tr>';}).join('') || '<tr><td colspan="5">No hail reports for this filter.</td></tr>';
    return '<div class="mfr-hail-report-sheet"><div class="mfr-hail-report-head"><div><div class="mfr-hail-kicker">Storm Response Brief</div><h2>Hail Intelligence Report</h2><p>Generated from the same filtered hail points displayed on the map.</p></div><div class="mfr-hail-report-actions"><button class="btn btn-outline" onclick="mfrCloseHailReport()">Close</button><button class="btn btn-primary" onclick="mfrPrintHailReport()">Print / Save PDF</button></div></div><div class="mfr-hail-report-stats"><div><span>Reports</span><strong>'+events.length+'</strong></div><div><span>Max Size</span><strong>'+(max?max.toFixed(2)+'”':'—')+'</strong></div><div><span>Filter</span><strong>'+(document.getElementById('hail-state')?.value||'All')+'</strong></div><div><span>Minimum</span><strong>'+(document.getElementById('hail-min')?.value||'1')+'”+</strong></div></div><div class="mfr-hail-report-grid"><div class="mfr-hail-report-panel"><h3>Affected Areas</h3><div class="mfr-hail-area-cloud">'+areas+'</div></div><div class="mfr-hail-report-panel"><h3>Recommended Roofing Response</h3><ul class="mfr-hail-response-list"><li>Prioritize repeated hail areas and reports at 1.25 inches or larger.</li><li>Filter customers and leads by affected areas, then tag likely homes as Potential Hail Lead.</li><li>Schedule inspection blocks over the next 3 to 5 days and use claim-aware messaging.</li></ul></div><div class="mfr-hail-report-panel wide"><h3>Largest Hail Reports</h3><div class="mfr-table-scroll"><table class="mfr-hail-report-table"><thead><tr><th>Size</th><th>Area</th><th>County</th><th>Date</th><th>Source</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="mfr-hail-report-foot">Generated '+esc(new Date().toLocaleString())+' · MFR Command Center · arsenalmediaco.com</div></div>';
  }
  window.mfrOpenHailReport = function(){ var existing=document.getElementById('mfr-hail-report-overlay'); if(existing) existing.remove(); var div=document.createElement('div'); div.id='mfr-hail-report-overlay'; div.className='mfr-hail-report-overlay'; div.innerHTML=reportHtml(); document.body.appendChild(div); };

  function boot(){ try{ window.mfrEnhanceHailConfig(); if(typeof window.mfrRenderHailSideList === 'function' && document.getElementById('mfr-hail-list')) window.mfrRenderHailSideList(); }catch(e){ console.warn('hail ux patch skipped', e); } }
  document.addEventListener('DOMContentLoaded', boot); setTimeout(boot, 600); setTimeout(boot, 1400);
})();
