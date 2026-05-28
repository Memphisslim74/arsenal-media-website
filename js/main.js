
(function(){
  const hash = (window.location.hash || '').replace('#','').toLowerCase();
  const path = window.location.pathname.replace(/\/$/, '');
  const oldHome = path === '' || path === '/index.html' || path === '/';
  const map = { services: '/services/', portfolio: '/portfolio/', work: '/portfolio/', contact: '/contact.html' };
  if (oldHome && map[hash]) window.location.replace(map[hash]);
})();


(function(){
  const btn=document.querySelector('[data-menu]');
  const nav=document.querySelector('[data-nav]');
  if(btn&&nav){btn.addEventListener('click',()=>{const open=nav.classList.toggle('open');btn.setAttribute('aria-expanded',String(open));});}
  document.querySelectorAll('[data-demo-form]').forEach(form=>{
    form.addEventListener('submit',e=>{e.preventDefault();const msg=form.querySelector('[data-form-message]'); if(msg){msg.style.display='block';msg.textContent='Thanks. This mockup form is ready to connect to your form handler.';} form.reset();});
  });
})();
