
/* MFR Hail report print/PDF final layout override: keep desktop-style report in print window */
(function(){
  function mfrHailReportPrintCssFinal(){
    return `<style>
      :root{--mfr-blue:#2563eb;--mfr-navy:#0f172a;--mfr-text:#111827;--mfr-muted:#64748b;--mfr-line:#e2e8f0;--mfr-soft:#f3f6fb;}
      *{box-sizing:border-box!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;}
      html,body{margin:0!important;padding:0!important;background:#eef3f8!important;color:var(--mfr-text)!important;font-family:Inter,Arial,sans-serif!important;font-size:13px!important;line-height:1.35!important;}
      .mfr-hail-print-page{width:100%!important;max-width:1120px!important;margin:0 auto!important;padding:22px!important;background:#eef3f8!important;}
      .mfr-hail-print-doc{width:100%!important;max-width:none!important;margin:0!important;padding:0!important;background:transparent!important;color:var(--mfr-text)!important;}
      .mfr-hail-print-head{display:grid!important;grid-template-columns:1fr auto!important;align-items:start!important;gap:18px!important;border:1px solid var(--mfr-line)!important;border-radius:22px!important;background:linear-gradient(135deg,#ffffff,#f8fbff)!important;padding:22px!important;margin:0 0 14px!important;box-shadow:0 8px 20px rgba(15,23,42,.05)!important;break-inside:avoid!important;page-break-inside:avoid!important;}
      .kicker,.mfr-hail-print-head .kicker{display:block!important;font-size:10px!important;line-height:1!important;letter-spacing:.20em!important;text-transform:uppercase!important;color:var(--mfr-blue)!important;font-weight:950!important;margin:0 0 8px!important;}
      .mfr-hail-print-head h1{font-size:32px!important;line-height:1.02!important;margin:0 0 7px!important;color:var(--mfr-navy)!important;font-weight:950!important;letter-spacing:-.03em!important;}
      .mfr-hail-print-head p{margin:0!important;color:var(--mfr-muted)!important;font-size:14px!important;font-weight:800!important;}
      .brand{display:flex!important;align-items:center!important;justify-content:flex-end!important;gap:9px!important;white-space:nowrap!important;color:var(--mfr-navy)!important;font-weight:950!important;}
      .brand b{display:inline-flex!important;align-items:center!important;justify-content:center!important;background:#0f2b63!important;color:#fff!important;border-radius:8px!important;padding:6px 10px!important;font-size:14px!important;line-height:1!important;}
      .brand span{font-size:17px!important;font-weight:950!important;}
      .mfr-hail-print-stats{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:10px!important;margin:0 0 14px!important;break-inside:avoid!important;page-break-inside:avoid!important;}
      .mfr-hail-print-stats div{background:#fff!important;border:1px solid var(--mfr-line)!important;border-top:3px solid var(--mfr-blue)!important;border-radius:16px!important;padding:14px!important;min-height:74px!important;box-shadow:0 6px 16px rgba(15,23,42,.04)!important;}
      .mfr-hail-print-stats span{display:block!important;color:var(--mfr-muted)!important;font-size:10px!important;text-transform:uppercase!important;letter-spacing:.16em!important;font-weight:950!important;margin:0 0 6px!important;}
      .mfr-hail-print-stats strong{display:block!important;font-size:25px!important;line-height:1!important;color:var(--mfr-navy)!important;font-weight:950!important;}
      .mfr-hail-print-grid{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:12px!important;margin:0!important;align-items:start!important;}
      .mfr-hail-print-panel{background:#fff!important;border:1px solid var(--mfr-line)!important;border-radius:18px!important;padding:16px!important;margin:0 0 12px!important;box-shadow:0 6px 16px rgba(15,23,42,.035)!important;break-inside:avoid!important;page-break-inside:avoid!important;overflow:hidden!important;}
      .mfr-hail-print-panel.wide{grid-column:1 / -1!important;}
      .mfr-hail-print-panel h2{font-size:18px!important;line-height:1.15!important;margin:0 0 10px!important;color:var(--mfr-navy)!important;font-weight:950!important;letter-spacing:-.02em!important;}
      .mfr-hail-print-panel p{color:#334155!important;font-size:13px!important;line-height:1.45!important;margin:0!important;}
      .mfr-hail-county-list{margin:0!important;padding-left:18px!important;}
      .mfr-hail-county-list li{margin:0 0 8px!important;font-weight:900!important;color:var(--mfr-navy)!important;}
      .mfr-hail-county-list span{display:block!important;color:var(--mfr-muted)!important;font-size:12px!important;margin-top:1px!important;font-weight:700!important;}
      .mfr-hail-area-tags{display:flex!important;flex-wrap:wrap!important;gap:6px!important;align-items:flex-start!important;}
      .mfr-hail-area-tags span{display:inline-flex!important;align-items:center!important;max-width:100%!important;background:#eff6ff!important;border:1px solid #bfdbfe!important;color:#1e3a8a!important;border-radius:999px!important;padding:6px 9px!important;font-size:12px!important;font-weight:900!important;line-height:1!important;white-space:nowrap!important;}
      .mfr-hail-area-tags b{display:inline-flex!important;align-items:center!important;justify-content:center!important;background:var(--mfr-blue)!important;color:#fff!important;border-radius:999px!important;min-width:18px!important;height:18px!important;padding:0 5px!important;margin-left:5px!important;font-size:11px!important;line-height:1!important;}
      .mfr-table-scroll{overflow:visible!important;width:100%!important;}
      .mfr-hail-report-table{width:100%!important;border-collapse:collapse!important;table-layout:fixed!important;background:#fff!important;font-size:12.5px!important;}
      .mfr-hail-report-table th{text-align:left!important;color:var(--mfr-muted)!important;font-size:9.5px!important;letter-spacing:.14em!important;text-transform:uppercase!important;border-bottom:1px solid var(--mfr-line)!important;padding:8px 7px!important;font-weight:950!important;white-space:nowrap!important;}
      .mfr-hail-report-table td{border-bottom:1px solid #eef2f7!important;padding:8px 7px!important;vertical-align:top!important;color:#1f2937!important;overflow-wrap:anywhere!important;}
      .mfr-hail-report-table th:nth-child(1),.mfr-hail-report-table td:nth-child(1){width:13%!important;}
      .mfr-hail-report-table th:nth-child(2),.mfr-hail-report-table td:nth-child(2){width:27%!important;}
      .mfr-hail-report-table th:nth-child(3),.mfr-hail-report-table td:nth-child(3){width:22%!important;}
      .mfr-hail-report-table th:nth-child(4),.mfr-hail-report-table td:nth-child(4){width:15%!important;}
      .mfr-hail-report-table th:nth-child(5),.mfr-hail-report-table td:nth-child(5){width:23%!important;}
      .mfr-hail-report-table tr:last-child td{border-bottom:0!important;}
      .mfr-hail-report-table small{display:block!important;color:var(--mfr-muted)!important;font-size:11px!important;margin-top:2px!important;line-height:1.25!important;}
      .mfr-hail-report-table b{font-weight:950!important;color:var(--mfr-navy)!important;}
      .mfr-hail-response-list{margin:0!important;padding-left:18px!important;color:#334155!important;font-size:13px!important;line-height:1.42!important;}
      .mfr-hail-response-list li{margin-bottom:5px!important;}
      .mfr-hail-print-foot{font-size:11px!important;color:var(--mfr-muted)!important;margin-top:0!important;padding-top:9px!important;border-top:1px solid var(--mfr-line)!important;}
      .mfr-hail-report-toolbar,.mfr-hail-report-actions,.modal-drag,.btn{display:none!important;}
      @page{size:letter;margin:.32in;}
      @media print{
        html,body{background:#fff!important;}
        .mfr-hail-print-page{max-width:none!important;padding:0!important;background:#fff!important;}
        .mfr-hail-print-doc{width:100%!important;}
        .mfr-hail-print-head,.mfr-hail-print-stats div,.mfr-hail-print-panel{box-shadow:none!important;}
        .mfr-hail-print-head{padding:16px!important;margin-bottom:10px!important;border-radius:16px!important;}
        .mfr-hail-print-head h1{font-size:26px!important;}
        .mfr-hail-print-stats{grid-template-columns:repeat(4,1fr)!important;gap:8px!important;margin-bottom:10px!important;}
        .mfr-hail-print-stats div{padding:10px!important;min-height:58px!important;border-radius:13px!important;}
        .mfr-hail-print-stats strong{font-size:20px!important;}
        .mfr-hail-print-grid{grid-template-columns:1fr 1fr!important;gap:10px!important;}
        .mfr-hail-print-panel{padding:12px!important;margin-bottom:9px!important;border-radius:14px!important;}
        .mfr-hail-print-panel h2{font-size:16px!important;margin-bottom:7px!important;}
        .mfr-hail-area-tags{gap:5px!important;}
        .mfr-hail-area-tags span{font-size:11px!important;padding:5px 7px!important;}
        .mfr-hail-report-table{font-size:11.5px!important;table-layout:fixed!important;}
        .mfr-hail-report-table thead{display:table-header-group!important;}
        .mfr-hail-report-table tbody{display:table-row-group!important;}
        .mfr-hail-report-table tr{display:table-row!important;border:0!important;margin:0!important;padding:0!important;background:transparent!important;}
        .mfr-hail-report-table th,.mfr-hail-report-table td{display:table-cell!important;}
        .mfr-hail-report-table td:before{display:none!important;content:none!important;}
        .mfr-hail-response-list{font-size:11.5px!important;line-height:1.3!important;}
        .mfr-hail-print-foot{font-size:9.5px!important;padding-top:6px!important;}
      }
      @media screen and (max-width:760px){
        .mfr-hail-print-page{padding:12px!important;}
        .mfr-hail-print-head{display:block!important;padding:18px!important;}
        .brand{justify-content:flex-start!important;margin-top:14px!important;}
        .mfr-hail-print-head h1{font-size:28px!important;}
        .mfr-hail-print-stats,.mfr-hail-print-grid{grid-template-columns:1fr!important;}
        .mfr-hail-report-table thead{display:none!important;}
        .mfr-hail-report-table,.mfr-hail-report-table tbody,.mfr-hail-report-table tr,.mfr-hail-report-table td{display:block!important;width:100%!important;}
        .mfr-hail-report-table tr{border:1px solid #e2e8f0!important;border-radius:16px!important;padding:10px!important;margin-bottom:10px!important;background:#fff!important;}
        .mfr-hail-report-table td{border:0!important;padding:5px 2px!important;}
        .mfr-hail-report-table td:before{content:attr(data-label)!important;display:block!important;font-size:10px!important;letter-spacing:.12em!important;text-transform:uppercase!important;color:#64748b!important;font-weight:900!important;margin-bottom:2px!important;}
      }
    </style>`;
  }
  function findCurrentHailReportNode(){
    return document.querySelector('#mfr-hail-report-overlay .mfr-hail-print-doc') ||
      document.querySelector('#mfr-hail-report-modal .mfr-hail-print-doc') ||
      document.querySelector('.mfr-hail-report-shell .mfr-hail-print-doc') ||
      document.querySelector('#mfr-hail-report-overlay .mfr-hail-report-sheet') ||
      document.querySelector('#mfr-hail-report-modal .mfr-hail-report-sheet');
  }
  window.mfrHailPrintCss = mfrHailReportPrintCssFinal;
  window.mfrPrintHailReport = function(){
    var node = findCurrentHailReportNode();
    if(!node && typeof window.mfrOpenHailReport === 'function'){
      window.mfrOpenHailReport();
      node = findCurrentHailReportNode();
    }
    if(!node){ alert('Open the hail report before printing.'); return; }
    var cloned = node.cloneNode(true);
    cloned.querySelectorAll('button,.mfr-hail-report-actions,.mfr-hail-report-toolbar,.modal-drag').forEach(function(el){ el.remove(); });
    if(!cloned.classList.contains('mfr-hail-print-doc')) cloned.classList.add('mfr-hail-print-doc');
    var html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hail Intelligence Report</title>'+mfrHailReportPrintCssFinal()+'</head><body><div class="mfr-hail-print-page">'+cloned.outerHTML+'</div><script>window.onload=function(){setTimeout(function(){window.focus();window.print();},450)};<\/script></body></html>';
    var w = window.open('', '_blank');
    if(!w){ alert('Popup blocked. Allow popups to print/save PDF.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };
})();
