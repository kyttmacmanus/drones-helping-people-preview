(() => {
 const $=s=>document.querySelector(s),escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const list=$('#chronology-list');if(!list)return;
 const labels={held:'Activity documented',scheduled:'Scheduled; completion unverified',cancelled:'Cancelled or rescheduled'};
 let records=[];
 function render(){
  const year=$('#chronology-year').value,status=$('#chronology-status').value,query=$('#chronology-search').value.trim().toLowerCase();
  const selected=records.filter(r=>(!year||r.date.startsWith(year))&&(!status||r.status===status)&&(!query||[r.title,r.place,r.program,r.description,r.contributors].join(' ').toLowerCase().includes(query)));
  $('#chronology-count').textContent=`${selected.length} of ${records.length} activity records`;
  list.innerHTML=selected.map(r=>`
   <article class="chronology-record" id="record-${escape(r.id)}">
    <div class="chronology-date"><time datetime="${escape(r.date)}">${escape(r.dateLabel||r.date)}</time><span class="record-status ${escape(r.status)}">${labels[r.status]}</span></div>
    <div><p class="chronology-program">${escape(r.program)} · ${escape(r.place)}</p><h3>${escape(r.title)}</h3><p>${escape(r.description)}</p>
     ${r.contributors?`<p class="chronology-credit">${escape(r.contributors)}<br>${escape(r.institution)}</p>`:''}
     <details><summary>Evidence and context</summary><p>${escape(r.evidenceSummary)}</p>
      ${(r.publicSources||[]).map(s=>`<a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)} ↗</a>`).join(' · ')}
      ${r.relatedCollection?`<p><a href="#${escape(r.relatedCollection)}">View the related photograph collection ↓</a></p>`:''}
     </details>
    </div>
   </article>`).join('')||'<p>No activity records match these filters.</p>';
 }
 async function init(){try{
  const response=await fetch('assets/data/teaching-event-register.json?v=3');if(!response.ok)throw Error('Activity chronology unavailable.');const data=await response.json();records=data.events;
  const years=[...new Set(records.map(r=>r.date.slice(0,4)))];$('#chronology-year').innerHTML='<option value="">All years</option>'+years.map(y=>`<option>${escape(y)}</option>`).join('');
  $('#chronology-scope').textContent=data.note;
  ['#chronology-year','#chronology-status','#chronology-search'].forEach(id=>$(id).addEventListener(id.includes('search')?'input':'change',render));
  render();
 }catch(e){list.textContent=e.message;}}
 init();
})();
