
(function(){
  function compactDashboardSchedule(){
    try{
      const schedule = document.getElementById('d-appt-list');
      if(!schedule) return;
      const scheduleCard = schedule.closest('.card');
      if(scheduleCard) scheduleCard.classList.add('mfr-dashboard-schedule-card');
      const grid = schedule.closest('.mfr-dashboard-bottom-grid');
      if(grid){
        grid.style.minHeight = '0';
        grid.style.height = 'auto';
        if(window.matchMedia && window.matchMedia('(max-width: 820px)').matches){
          grid.style.display = 'flex';
          grid.style.flexDirection = 'column';
          grid.style.alignItems = 'stretch';
        }
      }
      schedule.style.minHeight = '0';
      schedule.style.height = 'auto';
      schedule.style.maxHeight = 'none';
      if(scheduleCard){
        scheduleCard.style.minHeight = '0';
        scheduleCard.style.height = 'auto';
      }
    }catch(e){}
  }
  const oldLoad = window.mfrLoadDashboardAppointments;
  if(typeof oldLoad === 'function' && !oldLoad.__compactSchedulePatched){
    const wrapped = async function(){
      const out = await oldLoad.apply(this, arguments);
      setTimeout(compactDashboardSchedule, 30);
      setTimeout(compactDashboardSchedule, 250);
      return out;
    };
    wrapped.__compactSchedulePatched = true;
    window.mfrLoadDashboardAppointments = wrapped;
  }
  const oldGo = window.go;
  if(typeof oldGo === 'function' && !oldGo.__compactDashboardPatch){
    window.go = function(id){
      const out = oldGo.apply(this, arguments);
      if(String(id)==='dashboard') setTimeout(compactDashboardSchedule, 500);
      return out;
    };
    window.go.__compactDashboardPatch = true;
  }
  const oldRender = window.renderPage;
  if(typeof oldRender === 'function' && !oldRender.__compactDashboardPatch){
    window.renderPage = async function(id){
      const out = await oldRender.apply(this, arguments);
      if(String(id)==='dashboard') setTimeout(compactDashboardSchedule, 250);
      return out;
    };
    window.renderPage.__compactDashboardPatch = true;
  }
  document.addEventListener('DOMContentLoaded', function(){
    compactDashboardSchedule();
    const content = document.getElementById('content');
    if(content){
      new MutationObserver(function(){ setTimeout(compactDashboardSchedule, 80); }).observe(content,{childList:true,subtree:true});
    }
  });
  window.addEventListener('resize', compactDashboardSchedule);
})();
