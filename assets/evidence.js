const mode=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
document.querySelector('#brand-name').textContent=DRONE_BRANDING[mode].name;
document.querySelector('#footer-brand').textContent=DRONE_BRANDING[mode].footer;
document.querySelectorAll('a[href$=".html"]').forEach(a=>{if(mode==='efpl')a.href=a.getAttribute('href')+'?edition=efpl';});
const link=document.querySelector('#edition-link');link.href='evidence.html?edition='+(mode==='efpl'?'personal':'efpl');link.textContent=mode==='efpl'?'Preview personal edition':'Preview EFPL edition';
fetch('assets/data/missions.json').then(r=>{if(!r.ok)throw Error('Mission metadata unavailable');return r.json();}).then(rows=>{
 const tbody=document.querySelector('#mission-table tbody');
 rows.forEach(row=>{const tr=document.createElement('tr');[row.mission,row.type,row.area_ha.toFixed(3),row.flight_minutes,row.reported_mapped_images,row.capture_gsd_cm.toFixed(3),row.processed_pixel_cm].forEach((v,i)=>{const cell=document.createElement(i===0?'th':'td');cell.textContent=v;tr.append(cell);});tbody.append(tr);});
}).catch(e=>{document.querySelector('#mission-table caption').textContent=e.message;});
