
(function(){
  function openHailPageSafe(){
    var content = document.getElementById('content');
    if (!content) return Promise.resolve();
    if (typeof window.pageHailIntelligence === 'function') {
      return Promise.resolve(window.pageHailIntelligence(content)).then(function(){
        try { if (typeof enhanceRouteChrome === 'function') enhanceRouteChrome('hail-intelligence'); } catch(_) {}
      });
    }
    content.innerHTML = '<div class="page-wrap"><div class="empty-state"><div class="icon">🧊</div><h3>Hail Intelligence did not load</h3><p>Hard refresh the app and try again.</p></div></div>';
    return Promise.resolve();
  }

  function registerHailSafe(){
    try { if (typeof PAGE_SECTION !== 'undefined') PAGE_SECTION['hail-intelligence'] = 'sales'; } catch(_) {}
    try {
      var item = {id:'hail-intelligence', label:'Hail Intelligence', icon:'🧊', top_section:'sales', group_label:'In the Field', display_order:65, description:'Live hail map, NOAA/SPC hail reports, storm alerts, and swath intelligence', visible:true};
      if (Array.isArray(window.MFR_NAV_DEFAULTS) && !window.MFR_NAV_DEFAULTS.some(function(i){ return i.id === 'hail-intelligence'; })) window.MFR_NAV_DEFAULTS.push(item);
      if (Array.isArray(window.MFR_NAV_ITEMS) && !window.MFR_NAV_ITEMS.some(function(i){ return i.id === 'hail-intelligence'; })) {
        window.MFR_NAV_ITEMS.push(Object.assign({}, item));
        if (typeof mfrSortNav === 'function') window.MFR_NAV_ITEMS.sort(mfrSortNav);
      }
    } catch(_) {}

    var currentGo = window.go || (typeof go !== 'undefined' ? go : null);
    if (typeof currentGo === 'function' && !currentGo.__mfrHailSafeRouteFix) {
      var oldGo = currentGo;
      var fixedGo = function(id){
        if (String(id) === 'hail-intelligence') {
          try { _page = 'hail-intelligence'; _section = 'sales'; _lastPageBySection.sales = 'hail-intelligence'; localStorage.setItem('mfr_last_page','hail-intelligence'); } catch(_) {}
          try { if (typeof syncSectionButtons === 'function') syncSectionButtons(); } catch(_) {}
          try { if (typeof buildSB === 'function') buildSB(); } catch(_) {}
          return openHailPageSafe();
        }
        return oldGo.apply(this, arguments);
      };
      fixedGo.__mfrHailSafeRouteFix = true;
      window.go = fixedGo;
      try { go = fixedGo; } catch(_) {}
    }
  }

  registerHailSafe();
  document.addEventListener('DOMContentLoaded', function(){
    registerHailSafe();
    setTimeout(function(){
      registerHailSafe();
      try { if (typeof buildSB === 'function') buildSB(); } catch(_) {}
      try { if ((window._page || (typeof _page !== 'undefined' ? _page : '')) === 'hail-intelligence') openHailPageSafe(); } catch(_) {}
    }, 700);
  });
})();
