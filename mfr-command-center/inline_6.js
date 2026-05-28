
(function(){
  window.closeModal = window.closeModal || function(){
    try { if (typeof window.closeMfrModal === 'function') return window.closeMfrModal(); } catch(e){}
    try { if (typeof window.mfrCloseModal === 'function') return window.mfrCloseModal(); } catch(e){}
    try { const m=document.getElementById('modal'); if(m) m.remove(); } catch(e){}
    try { document.querySelectorAll('.modal-overlay,.mfr-modal-overlay').forEach(el=>el.remove()); } catch(e){}
  };
})();
