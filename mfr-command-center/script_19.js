
(function(){
  window.MFR_HAIL_WORKER_URL = window.MFR_HAIL_WORKER_URL || 'https://mfr-hail-intelligence-api.steve-722.workers.dev';
  const HAIL_DEFAULT_CENTER = [40.5853, -105.0844];
  let hailMap = null;
  let hailLayers = [];
  let hailLastPayload = null;

  function e(v){ return String(v ?? '').replace(/[&<>"']/g, function(s){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]); }); }
  function fmtDate(v){ try{return v?new Date(v).toLocaleDateString():'';}catch(_){return '';} }
  function fmtDateTime(v){ try{return v?new Date(v).toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'}):'';}catch(_){return '';} }
  function num(v, fallback=0){ const n=Number(v); return Number.isFinite(n)?n:fallback; }
  function getHailWorkerUrl(){ return String(localStorage.getItem('mfr_hail_worker_url') || window.MFR_HAIL_WORKER_URL || '').trim().replace(/\/$/,''); }

  const MFR_HAIL_DEFAULT_STATES = [
    {code:'CO', label:'Colorado'},
    {code:'WY', label:'Wyoming'},
    {code:'NE', label:'Nebraska'},
    {code:'KS', label:'Kansas'},
    {code:'OK', label:'Oklahoma'},
    {code:'TX', label:'Texas'}
  ];
  function mfrNormalizeStateCode(v){ return String(v||'').trim().toUpperCase().replace(/[^A-Z]/g,'').slice(0,2); }
  function mfrStateLabel(code){
    const map={AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'};
    return map[code] || code;
  }
  function getHailStates(){
    try{
      const saved=JSON.parse(localStorage.getItem('mfr_hail_states')||'null');
      if(Array.isArray(saved) && saved.length) return saved.map(function(x){ const code=mfrNormalizeStateCode(x.code||x); return code?{code:code,label:x.label||mfrStateLabel(code)}:null; }).filter(Boolean);
    }catch(_){}
    return MFR_HAIL_DEFAULT_STATES.slice();
  }
  function saveHailStates(states){
    const clean=[]; const seen={};
    (states||[]).forEach(function(x){ const code=mfrNormalizeStateCode(x.code||x); if(code && !seen[code]){ seen[code]=true; clean.push({code:code,label:x.label||mfrStateLabel(code)}); } });
    localStorage.setItem('mfr_hail_states', JSON.stringify(clean.length?clean:MFR_HAIL_DEFAULT_STATES));
    return clean.length?clean:MFR_HAIL_DEFAULT_STATES.slice();
  }
  function hailStateOptions(selected){
    const states=getHailStates();
    return states.map(function(st){ return '<option value="'+e(st.code)+'" '+(String(selected||'CO')===st.code?'selected':'')+'>'+e(st.label)+' ('+e(st.code)+')</option>'; }).join('') + '<option value="" '+(selected===''?'selected':'')+'>All Tracked States</option>';
  }
  function renderHailStateChips(){
    const wrap=document.getElementById('mfr-hail-state-chips'); if(!wrap) return;
    const states=getHailStates();
    wrap.innerHTML=states.map(function(st){ return '<span class="mfr-hail-state-chip">'+e(st.label)+' ('+e(st.code)+') <button type="button" title="Remove state" onclick="mfrRemoveHailState(\''+e(st.code)+'\')">×</button></span>'; }).join('');
    const sel=document.getElementById('hail-state');
    if(sel){ const current=sel.value; sel.innerHTML=hailStateOptions(current); if(current && !getHailStates().some(function(st){return st.code===current;})) sel.value=''; }
  }
  window.mfrHailStateChanged = function(){
    const sel=document.getElementById('hail-state');
    if(sel) localStorage.setItem('mfr_hail_selected_state', sel.value || '');
    mfrLoadHailData();
  };
  window.mfrAddHailState = function(){
    const code=mfrNormalizeStateCode(document.getElementById('mfr-hail-state-code')?.value);
    if(!code || code.length!==2){ toast('Enter a 2-letter state code like CO, WY, NE, or TX.', 'warn'); return; }
    const states=getHailStates();
    if(!states.some(function(st){return st.code===code;})) states.push({code:code,label:mfrStateLabel(code)});
    saveHailStates(states);
    const input=document.getElementById('mfr-hail-state-code'); if(input) input.value='';
    renderHailStateChips();
    const sel=document.getElementById('hail-state'); if(sel) sel.value=code;
    toast('Added '+code+' to Hail Intelligence states');
    mfrLoadHailData();
  };
  window.mfrRemoveHailState = function(code){
    code=mfrNormalizeStateCode(code);
    const states=getHailStates().filter(function(st){return st.code!==code;});
    saveHailStates(states);
    renderHailStateChips();
    const sel=document.getElementById('hail-state');
    if(sel && sel.value===code) sel.value=states[0]?.code || '';
    toast('Removed '+code+' from tracked states', 'warn');
    mfrLoadHailData();
  };
  function setStatus(msg, warn){ const el=document.getElementById('mfr-hail-status'); if(el) el.innerHTML = '<span'+(warn?' style="color:#b45309;font-weight:800"':'')+'>'+e(msg)+'</span>'; }
  function colorForMag(m){ m=num(m,0); if(m>=2) return '#dc2626'; if(m>=1.25) return '#f97316'; if(m>=.75) return '#2563eb'; return '#64748b'; }
  function radiusForMag(m){ m=num(m,0); return Math.max(6, Math.min(18, 6 + m*5)); }

  window.pageHailIntelligence = async function(c){
    c.innerHTML = '<div class="page-wrap mfr-hail-page">'
      + '<div class="mfr-hail-hero"><div><div class="mfr-hail-kicker">Storm Response</div><h1 class="mfr-hail-title">Hail Intelligence</h1><p class="mfr-hail-sub">Live hail reports, radar hail signatures, severe thunderstorm polygons, and simulated hail swaths for Northern Colorado and Wyoming roofing response.</p></div><div class="mfr-hail-actions"><button class="btn btn-primary" onclick="mfrLoadHailData()">Refresh Map</button><button class="btn btn-outline" onclick="mfrHailManualSync()">Run Sync</button><button class="btn btn-outline" onclick="mfrToggleHailConfig()">API Settings</button></div></div>'
      + '<div class="mfr-hail-config" id="mfr-hail-config"><b>Cloudflare Worker URL</b><div style="font-size:13px;margin-top:4px">Paste your deployed Worker URL here after deployment. Example: https://mfr-hail-intelligence-api.YOUR-SUBDOMAIN.workers.dev</div><div class="mfr-hail-config-grid"><input class="fi" id="mfr-hail-worker-url" placeholder="https://your-worker.workers.dev" value="'+e(getHailWorkerUrl())+'"><button class="btn btn-primary" onclick="mfrSaveHailWorkerUrl()">Save URL</button></div><div class="mfr-hail-state-manager"><b>Tracked States</b><div style="font-size:13px;margin-top:4px">Add or remove states from the Hail Intelligence filter. Use 2-letter state codes.</div><div class="mfr-hail-state-row"><input class="fi" id="mfr-hail-state-code" placeholder="CO" maxlength="2"><button class="btn btn-outline" onclick="mfrAddHailState()">Add State</button><button class="btn btn-outline" onclick="localStorage.removeItem(\'mfr_hail_states\');renderHailStateChips();mfrLoadHailData();">Reset Defaults</button></div><div id="mfr-hail-state-chips" class="mfr-hail-state-chips"></div></div></div>'
      + '<div class="mfr-hail-stats"><div class="mfr-hail-stat"><span>Hail Reports</span><strong id="hail-stat-events">—</strong></div><div class="mfr-hail-stat orange"><span>Active Alerts</span><strong id="hail-stat-alerts">—</strong></div><div class="mfr-hail-stat green"><span>Swaths</span><strong id="hail-stat-swaths">—</strong></div><div class="mfr-hail-stat purple"><span>Max Size</span><strong id="hail-stat-max">—</strong></div></div>'
      + '<div class="card" style="margin-bottom:14px"><div class="card-body"><div class="mfr-hail-toolbar"><select class="fs" id="hail-state" onchange="mfrHailStateChanged()">'+hailStateOptions(localStorage.getItem('mfr_hail_selected_state') || 'CO')+'</select><select class="fs" id="hail-days" onchange="mfrLoadHailData()"><option value="1">Last 24 hours</option><option value="3">Last 3 days</option><option value="7" selected>Last 7 days</option><option value="14">Last 14 days</option><option value="30">Last 30 days</option></select><select class="fs" id="hail-min" onchange="mfrLoadHailData()"><option value="0">Any size</option><option value="0.75">0.75\"+</option><option value="1" selected>1.00\"+</option><option value="1.5">1.50\"+</option><option value="2">2.00\"+</option></select><input class="fi" id="hail-search" placeholder="Filter county/source..." oninput="mfrRenderHailSideList()"></div></div></div>'
      + '<div class="mfr-hail-layout"><div class="mfr-hail-map-card"><div id="mfr-hail-map"></div><div class="mfr-hail-map-status"><div id="mfr-hail-status">Loading hail intelligence...</div><div class="mfr-hail-legend"><span><i class="mfr-hail-dot" style="background:#2563eb"></i>1\"+</span><span><i class="mfr-hail-dot" style="background:#f97316"></i>1.25\"+</span><span><i class="mfr-hail-dot" style="background:#dc2626"></i>2\"+</span></div></div></div><div class="mfr-hail-side-card"><div class="mfr-hail-side-head"><h3>Recent Hail Signals</h3><button class="btn btn-xs btn-outline" onclick="mfrCopyHailBrief()">Copy Brief</button></div><div class="mfr-hail-response-box"><strong>Roofing workflow tie-in</strong><p>Use this page to identify storm dates, build response campaigns, and connect hail activity back to leads, inspections, estimates, and customer follow-up.</p></div><div id="mfr-hail-list" class="mfr-hail-list"><div class="mfr-hail-empty"><div class="icon">🧊</div>Loading reports...</div></div></div></div>'
      + '</div>';
    renderHailStateChips();
    try{ await mfrLoadHailData(); }catch(err){ console.error(err); setStatus('Could not load hail map: '+(err.message||err), true); }
  };

  window.mfrToggleHailConfig = function(){ document.getElementById('mfr-hail-config')?.classList.toggle('show'); };
  window.mfrSaveHailWorkerUrl = function(){ const v=document.getElementById('mfr-hail-worker-url')?.value?.trim().replace(/\/$/,'')||''; localStorage.setItem('mfr_hail_worker_url', v); toast(v?'Hail API URL saved':'Hail API URL cleared', v?'ok':'warn'); mfrLoadHailData(); };

  async function loadLeaflet(){
    if(window.L) return;
    if(!document.querySelector('link[data-mfr-leaflet]')){ const link=document.createElement('link'); link.rel='stylesheet'; link.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; link.dataset.mfrLeaflet='true'; document.head.appendChild(link); }
    await new Promise(function(resolve,reject){ const existing=document.querySelector('script[data-mfr-leaflet]'); if(existing){ existing.addEventListener('load',resolve,{once:true}); existing.addEventListener('error',reject,{once:true}); return; } const script=document.createElement('script'); script.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'; script.dataset.mfrLeaflet='true'; script.onload=resolve; script.onerror=reject; document.head.appendChild(script); });
  }

  window.mfrLoadHailData = async function(){
    const state=(document.getElementById('hail-state')?.value ?? localStorage.getItem('mfr_hail_selected_state') ?? 'CO');
    const days=document.getElementById('hail-days')?.value || '7';
    const min=document.getElementById('hail-min')?.value || '1';
    setStatus('Loading hail intelligence...');
    await loadLeaflet();
    const payload = await mfrFetchHailPayload({state,days,minMagnitude:min});
    hailLastPayload = payload;
    mfrUpdateHailStats(payload);
    await mfrRenderHailMap(payload);
    mfrRenderHailSideList();
    const source = getHailWorkerUrl() ? 'Cloudflare Worker' : 'Supabase direct read';
    setStatus('Updated '+fmtDateTime(payload.generatedAt || new Date())+' · '+source+' · '+((payload.hailEvents||[]).length)+' reports · '+(state||'All tracked states'));
  };

  window.mfrFetchHailPayload = async function({state='CO',days='7',minMagnitude='1'}={}){
    const api=getHailWorkerUrl();
    if(api){
      const url=api + '/api/hail?days=' + encodeURIComponent(days) + '&minMagnitude=' + encodeURIComponent(minMagnitude) + (state?'&state='+encodeURIComponent(state):'');
      const res=await fetch(url);
      if(!res.ok) throw new Error('Hail API failed: '+res.status+' '+await res.text());
      return await res.json();
    }
    if(!window._sb) return {generatedAt:new Date().toISOString(), filters:{state,days,minMagnitude}, hailEvents:[], stormAlerts:[], hailSwaths:[]};
    const end=new Date(); const start=new Date(); start.setDate(end.getDate()-Number(days||7)); const startDate=start.toISOString().slice(0,10); const endDate=end.toISOString().slice(0,10);
    let q=_sb.from('hail_events').select('*').gte('event_date',startDate).lte('event_date',endDate).gte('magnitude',Number(minMagnitude||0)).order('event_date',{ascending:false}).limit(1000);
    if(state) q=q.eq('state',state);
    let sq=_sb.from('hail_swaths').select('*').gte('swath_date',startDate).lte('swath_date',endDate).order('swath_date',{ascending:false}).limit(200);
    if(state) sq=sq.contains('states',[state]);
    let aq=_sb.from('storm_alerts').select('*').gte('expires',new Date().toISOString()).order('expires',{ascending:true}).limit(100);
    if(state) aq=aq.contains('states',[state]);
    const [ev,sw,al]=await Promise.all([q,sq,aq]);
    if(ev.error && /does not exist|schema/i.test(ev.error.message||'')) throw new Error('Hail tables are missing. Run mfr_hail_schema.sql first.');
    if(ev.error) throw ev.error;
    return {generatedAt:new Date().toISOString(), filters:{state,days,minMagnitude}, hailEvents:ev.data||[], stormAlerts:(al.error?[]:(al.data||[])), hailSwaths:(sw.error?[]:(sw.data||[]))};
  };

  function mfrUpdateHailStats(payload){
    const events=payload.hailEvents||[], alerts=payload.stormAlerts||[], swaths=payload.hailSwaths||[];
    const max=events.reduce((m,x)=>Math.max(m,num(x.magnitude,0)),0);
    const set=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    set('hail-stat-events', events.length);
    set('hail-stat-alerts', alerts.length);
    set('hail-stat-swaths', swaths.length);
    set('hail-stat-max', max ? max.toFixed(2)+'\"' : '—');
  }

  async function mfrRenderHailMap(payload){
    const el=document.getElementById('mfr-hail-map'); if(!el || !window.L) return;
    if(hailMap){ try{ hailMap.remove(); }catch(_){} hailMap=null; }
    hailMap=L.map(el,{scrollWheelZoom:false}).setView(HAIL_DEFAULT_CENTER, 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}).addTo(hailMap);
    hailLayers=[];
    const bounds=[];
    (payload.hailSwaths||[]).forEach(function(sw){ if(!sw.polygon_geojson) return; try{ const layer=L.geoJSON(sw.polygon_geojson,{style:{color:'#f97316',weight:2,fillColor:'#f97316',fillOpacity:.13}}).bindPopup('<b>Hail swath</b><br>Date: '+e(sw.swath_date)+'<br>Reports: '+e(sw.report_count)+'<br>Max: '+e(sw.max_magnitude||'—')+'\"'); layer.addTo(hailMap); hailLayers.push(layer); layer.getBounds && bounds.push(layer.getBounds()); }catch(err){ console.warn('swath render skipped',err); } });
    (payload.stormAlerts||[]).forEach(function(a){ if(!a.polygon_geojson) return; try{ const layer=L.geoJSON(a.polygon_geojson,{style:{color:'#7c3aed',weight:2,fillColor:'#7c3aed',fillOpacity:.09}}).bindPopup('<b>'+e(a.event_type||'Storm Alert')+'</b><br>Expires: '+e(fmtDateTime(a.expires))+'<br>States: '+e((a.states||[]).join(', '))); layer.addTo(hailMap); hailLayers.push(layer); layer.getBounds && bounds.push(layer.getBounds()); }catch(err){ console.warn('alert render skipped',err); } });
    (payload.hailEvents||[]).forEach(function(h){ const lat=num(h.lat,NaN), lng=num(h.lng,NaN); if(!Number.isFinite(lat)||!Number.isFinite(lng)) return; const m=num(h.magnitude,0); const marker=L.circleMarker([lat,lng],{radius:radiusForMag(m),color:colorForMag(m),fillColor:colorForMag(m),fillOpacity:.6,weight:2}).bindPopup('<b>'+e(m?m.toFixed(2)+'\" hail':'Hail report')+'</b><br>'+e(h.county||'Unknown county')+', '+e(h.state||'')+'<br>'+e(fmtDate(h.event_date))+' · '+e(h.source||'')+'<br><br><button class="btn btn-primary btn-sm" onclick="mfrHailCreateLeadFromEvent(\''+e(h.id||'')+'\')">Create Lead</button> <button class="btn btn-outline btn-sm" onclick="mfrCopyHailEventBrief(\''+e(h.id||'')+'\')">Copy Brief</button>'); marker.addTo(hailMap); hailLayers.push(marker); bounds.push([lat,lng]); });
    setTimeout(function(){ try{ hailMap.invalidateSize(); if(bounds.length){ const b=L.latLngBounds(bounds); if(b.isValid()) hailMap.fitBounds(b.pad(.18)); } }catch(_){} },120);
  }

  window.mfrRenderHailSideList = function(){
    const wrap=document.getElementById('mfr-hail-list'); if(!wrap) return;
    const q=String(document.getElementById('hail-search')?.value||'').toLowerCase();
    const events=(hailLastPayload?.hailEvents||[]).filter(function(h){ return !q || [h.county,h.state,h.source,h.event_date,h.magnitude].join(' ').toLowerCase().includes(q); }).slice(0,12);
    if(!events.length){ wrap.innerHTML='<div class="mfr-hail-empty"><div class="icon">🧊</div><h3>No hail records yet</h3><p>Run the schema, deploy the Worker, then run a sync to populate NOAA/SPC hail data.</p></div>'; return; }
    wrap.innerHTML=events.map(function(h){ const m=num(h.magnitude,0); return '<div class="mfr-hail-event-card"><strong>'+e(m?m.toFixed(2)+'\" hail signal':'Hail signal')+'</strong><p>'+e(h.county||'Unknown county')+', '+e(h.state||'')+' · '+e(fmtDate(h.event_date))+' · '+e(h.source||'NOAA')+'</p><span class="mfr-hail-pill">'+e(h.lat)+', '+e(h.lng)+'</span><div class="mfr-hail-card-actions"><button class="btn btn-sm btn-primary" onclick="mfrHailCreateLeadFromEvent(\''+e(h.id||'')+'\')">Create Lead</button><button class="btn btn-sm btn-outline" onclick="mfrCopyHailEventBrief(\''+e(h.id||'')+'\')">Copy Brief</button><button class="btn btn-sm btn-outline" onclick="go(\'customers\')">Open Customers</button></div></div>'; }).join('');
  };

  function findEvent(id){ return (hailLastPayload?.hailEvents||[]).find(h=>String(h.id)===String(id)); }
  window.mfrCopyHailEventBrief = function(id){ const h=findEvent(id); if(!h){ toast('Hail event not found','error'); return; } const text='Hail lead opportunity: '+(h.magnitude?Number(h.magnitude).toFixed(2)+' inch hail':'hail signal')+' reported near '+(h.county||'unknown county')+', '+(h.state||'')+' on '+fmtDate(h.event_date)+'. Source: '+(h.source||'NOAA')+'. Coordinates: '+h.lat+', '+h.lng+'. Suggested action: filter nearby customers, schedule inspections, and start storm follow-up.'; navigator.clipboard.writeText(text).then(()=>toast('Hail brief copied')); };
  window.mfrCopyHailBrief = function(){ const events=hailLastPayload?.hailEvents||[]; const alerts=hailLastPayload?.stormAlerts||[]; const swaths=hailLastPayload?.hailSwaths||[]; const max=events.reduce((m,x)=>Math.max(m,num(x.magnitude,0)),0); const state=document.getElementById('hail-state')?.value||'CO'; const text='MFR Hail Intelligence Brief\nState/Area: '+state+'\nReports: '+events.length+'\nActive alerts: '+alerts.length+'\nSwaths: '+swaths.length+'\nMax hail size: '+(max?max.toFixed(2)+' inches':'N/A')+'\nAction: review impacted customers, prioritize hot leads and claims, and schedule inspections.'; navigator.clipboard.writeText(text).then(()=>toast('Storm response brief copied')); };
  window.mfrHailCreateLeadFromEvent = function(id){ const h=findEvent(id); if(!h){ toast('Hail event not found','error'); return; } try{ localStorage.setItem('mfr_hail_lead_context', JSON.stringify(h)); }catch(_){} toast('Hail context saved. Create or tag the customer from Customers.', 'ok'); go('customers'); };
  window.mfrHailManualSync = async function(){ const api=getHailWorkerUrl(); if(!api){ document.getElementById('mfr-hail-config')?.classList.add('show'); toast('Save your Worker URL first.', 'warn'); return; } const secret=prompt('Enter your Cloudflare Worker SYNC_SECRET to run ingestion now.'); if(!secret) return; try{ toast('Running hail sync...', 'ok'); const res=await fetch(api+'/api/sync',{method:'POST',headers:{'x-sync-secret':secret}}); const data=await res.json().catch(()=>({})); if(!res.ok) throw new Error(data.error || ('Sync failed: '+res.status)); toast('Hail sync complete'); setTimeout(mfrLoadHailData, 700); }catch(err){ console.error(err); toast('Sync failed: '+(err.message||err), 'error'); } };

  const navItem={id:'hail-intelligence', label:'Hail Intelligence', icon:'🧊', top_section:'sales', group_label:'In the Field', display_order:65, description:'Live hail map, NOAA/SPC hail reports, storm alerts, and swath intelligence', visible:true};
  function registerHailNav(){
    try{ if(Array.isArray(window.MFR_NAV_DEFAULTS) && !MFR_NAV_DEFAULTS.some(i=>i.id==='hail-intelligence')) MFR_NAV_DEFAULTS.push(navItem); }catch(_){}
    try{ PAGE_SECTION['hail-intelligence']='sales'; }catch(_){}
    try{ if(window.MFR_NAV_ITEMS && !MFR_NAV_ITEMS.some(i=>i.id==='hail-intelligence')){ MFR_NAV_ITEMS.push(Object.assign({},navItem)); MFR_NAV_ITEMS.sort(mfrSortNav); } }catch(_){}
    try{ if(SECTIONS?.sales?.nav && !SECTIONS.sales.nav.some(i=>i.id==='hail-intelligence')){ const idx=SECTIONS.sales.nav.findIndex(i=>i.id==='storm'); SECTIONS.sales.nav.splice(idx>=0?idx+1:SECTIONS.sales.nav.length,0,{id:'hail-intelligence',ic:'🧊',label:'Hail Intelligence'}); } }catch(_){}
  }
  registerHailNav();
  const oldRender = window.renderPage || (typeof renderPage !== 'undefined' ? renderPage : null);
  if(typeof oldRender === 'function' && !oldRender.__mfrHailWrapped){
    const wrapped = async function(id){ if(String(id)==='hail-intelligence') return await window.pageHailIntelligence(document.getElementById('content')); return await oldRender.apply(this, arguments); };
    wrapped.__mfrHailWrapped = true;
    window.renderPage = wrapped;
    try{ renderPage = wrapped; }catch(_){}
  }
  document.addEventListener('DOMContentLoaded', function(){ setTimeout(function(){ registerHailNav(); try{ if(window._section) buildSB(); }catch(_){} }, 900); });
})();
