
(function(){
  function esc(v){return String(v ?? '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
  function short(v,n){v=String(v||''); return v.length>n ? v.slice(0,n)+'…' : v;}
  function fmtDate(v){try{return v ? new Date(v).toLocaleDateString() : '—';}catch(e){return '—';}}
  function badgeClass(map, val){return map[val] || 'gray';}
  async function mobileFriendlyLoadTasksList(){
    const filterView = sessionStorage.getItem('tasks_view') || 'team';
    const statusFilter = document.getElementById('task-filter-status')?.value;
    const priorityFilter = document.getElementById('task-filter-priority')?.value;
    const typeFilter = document.getElementById('task-filter-type')?.value;
    const listEl = document.getElementById('tasks-list');
    if(!listEl) return;
    try{
      let query = _sb.from('v_tasks_full').select('*');
      if(filterView === 'my' && window._user?.id) query = query.eq('assigned_to', _user.id);
      if(statusFilter) query = query.eq('status', statusFilter);
      if(priorityFilter) query = query.eq('priority', priorityFilter);
      if(typeFilter) query = query.eq('task_type', typeFilter);
      query = query.order('due_date', { ascending:true, nullsFirst:false });
      const { data:tasks, error } = await query;
      if(error) throw error;
      if(!tasks || !tasks.length){
        listEl.innerHTML = '<div class="empty-state" style="padding:40px"><div class="icon">✅</div><h3>No Tasks</h3></div>';
        return;
      }
      const priorityColors={urgent:'red',high:'orange',normal:'blue',low:'gray'};
      const statusColors={pending:'blue','in-progress':'orange',complete:'green',completed:'green',cancelled:'gray'};
      const desktopRows = tasks.map(t=>{
        const isOverdue = t.due_date && new Date(t.due_date) < new Date() && String(t.status||'') === 'pending';
        const assigned = t.assigned_to_name || t.assignee_name || t.assigned_user_name || t.assigned_to || '—';
        return `<tr style="${isOverdue ? 'background:#FEE2E2' : ''}">
          <td><div style="font-weight:700;font-size:13px">${esc(t.title)}</div>${t.description ? `<div style="font-size:11px;color:var(--text3);margin-top:2px">${esc(short(t.description,60))}</div>` : ''}</td>
          <td style="font-size:12px">${esc(t.customer_name || '—')}</td>
          <td style="font-size:12px">${esc(assigned)}</td>
          <td><span class="badge badge-blue" style="font-size:10px">${esc(t.task_type || 'task')}</span></td>
          <td><span class="badge badge-${badgeClass(priorityColors,t.priority)}" style="font-size:10px">${esc(t.priority || 'normal')}</span></td>
          <td style="font-size:12px;color:${isOverdue ? 'var(--red)' : 'var(--text2)'}">${fmtDate(t.due_date)}</td>
          <td><span class="badge badge-${badgeClass(statusColors,t.status)}" style="font-size:10px">${esc(t.status || 'pending')}</span></td>
          <td style="white-space:nowrap">${String(t.status||'') === 'pending' ? `<button class="btn btn-sm btn-primary" onclick="completeTask('${esc(t.id)}')">✓ Complete</button>` : ''} <button class="btn btn-sm btn-outline" onclick="viewTaskDetail('${esc(t.id)}')">View</button></td>
        </tr>`;
      }).join('');
      const mobileCards = tasks.map(t=>{
        const isOverdue = t.due_date && new Date(t.due_date) < new Date() && String(t.status||'') === 'pending';
        const assigned = t.assigned_to_name || t.assignee_name || t.assigned_user_name || t.assigned_to || '—';
        return `<article class="mfr-task-card ${isOverdue ? 'overdue' : ''}">
          <div class="mfr-task-card-head">
            <div><div class="mfr-task-title">${esc(t.title || 'Task')}</div>${t.description ? `<div class="mfr-task-desc">${esc(short(t.description,140))}</div>` : ''}</div>
            <span class="badge badge-${badgeClass(statusColors,t.status)}">${esc(t.status || 'pending')}</span>
          </div>
          <div class="mfr-task-grid">
            <div class="mfr-task-meta"><span>Customer</span><strong>${esc(t.customer_name || '—')}</strong></div>
            <div class="mfr-task-meta"><span>Assigned To</span><strong>${esc(assigned)}</strong></div>
            <div class="mfr-task-meta"><span>Type</span><strong>${esc(t.task_type || 'task')}</strong></div>
            <div class="mfr-task-meta"><span>Due Date</span><strong style="${isOverdue ? 'color:#dc2626' : ''}">${fmtDate(t.due_date)}</strong></div>
            <div class="mfr-task-meta"><span>Priority</span><strong>${esc(t.priority || 'normal')}</strong></div>
          </div>
          <div class="mfr-task-actions">
            ${String(t.status||'') === 'pending' ? `<button class="btn btn-primary" onclick="completeTask('${esc(t.id)}')">✓ Complete</button>` : ''}
            <button class="btn btn-outline" onclick="viewTaskDetail('${esc(t.id)}')">View Task</button>
          </div>
        </article>`;
      }).join('');
      listEl.innerHTML = `<table class="tbl mfr-task-desktop"><thead><tr><th>Task</th><th>Customer</th><th>Assigned To</th><th>Type</th><th>Priority</th><th>Due Date</th><th>Status</th><th></th></tr></thead><tbody>${desktopRows}</tbody></table><div class="mfr-task-mobile-cards">${mobileCards}</div>`;
    }catch(e){
      console.error('Load tasks error:', e);
      listEl.innerHTML = '<div style="padding:40px;text-align:center;color:red">Error loading tasks</div>';
    }
  }
  window.loadTasksList = mobileFriendlyLoadTasksList;
  try{ loadTasksList = mobileFriendlyLoadTasksList; }catch(e){}
})();
