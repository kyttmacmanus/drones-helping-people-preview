const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mode=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
$('#brand-name').textContent=DRONE_BRANDING[mode].name;$('#footer-brand').textContent=DRONE_BRANDING[mode].footer;
document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(a.id!=='edition-link'&&mode==='efpl'&&/^[a-z-]+\.html(?:[?#]|$)/.test(h)){const u=new URL(h,location.href);u.searchParams.set('edition','efpl');a.href=u.href;}});
$('#edition-link').href='explore.html?edition='+(mode==='efpl'?'personal':'efpl');$('#edition-link').textContent=mode==='efpl'?'View Kytt MacManus perspective':'View EFPL perspective';
let catalog=[],visible=[],active=0;
const params=new URLSearchParams(location.search);
const areaIDs=new Set(['teaching','communities','parks','research']);
let theme=areaIDs.has(params.get('area')||params.get('theme'))?(params.get('area')||params.get('theme')):'all';
const legacyPlace={zambia:'Zambia',international:'Zambia','staten-island':'Staten Island',lamont:'Lamont'};
const requestedPlace=params.get('place')||legacyPlace[params.get('theme')];
function render(){
 const place=$('#place-filter').value,kind=$('#kind-filter').value,q=$('#catalog-search').value.trim().toLowerCase();
 visible=catalog.filter(p=>(theme==='all'||(p.program_areas||[]).includes(theme))&&(place==='all'||(p.place_groups||[p.place]).includes(place))&&(kind==='all'||p.kind===kind)&&(!q||[p.title,p.caption,p.place,p.kind,p.credit,p.event,p.project,p.program_or_course,p.photographer,p.creator,p.camera_make,p.camera_model,p.sensor,p.product_type,(p.people_depicted||[]).join(' '),p.source_platform].filter(Boolean).join(' ').toLowerCase().includes(q)));
 $('#catalog-status').textContent=`${visible.length} of ${catalog.length} curated plates shown`;
 $('#catalog-empty').hidden=visible.length>0;
 $('#catalog-grid').innerHTML=visible.map(p=>`<article class="plate-card"><button data-plate="${p.id}" aria-label="Examine ${esc(p.title)}"><img src="${DRONE_ASSET_URL(p.thumb||p.image)}" alt="${esc(p.title)}" loading="lazy"><span class="plate-action">Examine plate ↗</span></button><p class="eyebrow">${esc(p.place)} / ${esc(p.kind)}</p><h3>${esc(p.title)}</h3><p>${esc(p.caption)}</p><p class="small">${esc(p.date||'Date in source notes')} · ${esc(p.credit)}</p></article>`).join('');
 document.querySelectorAll('[data-plate]').forEach(b=>b.onclick=()=>openPlate(b.dataset.plate));
}
function openPlate(id){
 active=visible.findIndex(p=>p.id===id);if(active<0)return;
 showPlate();$('#plate-dialog').showModal();
}
function showPlate(){
 const p=visible[active];$('#plate-image').src=DRONE_ASSET_URL(p.image);$('#plate-image').alt=p.title;
 $('#plate-title').textContent=p.title;$('#plate-kind').textContent=p.kind+' / '+p.place;
 $('#plate-caption').textContent=p.caption;$('#plate-position').textContent=`${active+1} / ${visible.length}`;
 $('#plate-meta').innerHTML=DRONE_META.metadataHTML(p);
 $('#plate-provenance').innerHTML=DRONE_META.provenanceHTML(p);
 const original=p.source_url||p.mission_url||(/^https:\/\//.test(p.source)?p.source:null);const sourceLink=$('#plate-source-link');sourceLink.hidden=!original;if(original)sourceLink.href=original;
 $('#plate-download').href=DRONE_ASSET_URL(p.image);$('#plate-prev').disabled=active===0;$('#plate-next').disabled=active===visible.length-1;
}
$('#plate-close').onclick=()=>$('#plate-dialog').close();
$('#plate-prev').onclick=()=>{if(active>0){active--;showPlate();}};$('#plate-next').onclick=()=>{if(active<visible.length-1){active++;showPlate();}};
$('#plate-dialog').addEventListener('click',e=>{if(e.target===$('#plate-dialog'))e.target.close();});
document.addEventListener('keydown',e=>{if(!$('#plate-dialog').open)return;if(e.key==='ArrowRight')$('#plate-next').click();if(e.key==='ArrowLeft')$('#plate-prev').click();});
function compare(side){const p=catalog.find(p=>p.id===$('#compare-'+side).value);if(!p)return;$('#compare-'+side+'-figure').innerHTML=`<img src="${DRONE_ASSET_URL(p.image)}" alt="${esc(p.title)}"><figcaption><b>${esc(p.title)}</b> · ${esc(p.place)}<br>${esc(p.caption)}<br>${esc(p.credit)}</figcaption>`;}
async function init(){
 try{
  const response=await fetch('assets/data/visual-catalog.json?v=6');if(!response.ok)throw Error('Could not load the visual source catalog');
  catalog=await response.json();
  ['place','kind'].forEach(key=>{const sel=$('#'+key+'-filter');[...new Set(key==='place'?catalog.flatMap(p=>p.place_groups||[p.place]):catalog.map(p=>p[key]))].sort().forEach(v=>sel.add(new Option(v,v)));sel.onchange=render;});
  $('#catalog-search').oninput=render;$('#reset-filters').onclick=()=>{theme='all';document.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.theme==='all'?'true':'false'));$('#place-filter').value='all';$('#kind-filter').value='all';$('#catalog-search').value='';render();};
  document.querySelectorAll('[data-theme]').forEach(b=>{b.setAttribute('aria-pressed',b.dataset.theme===theme?'true':'false');b.onclick=()=>{theme=b.dataset.theme;document.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));$('#place-filter').value='all';$('#kind-filter').value='all';render();};});
  if(requestedPlace&&[...$('#place-filter').options].some(o=>o.value===requestedPlace))$('#place-filter').value=requestedPlace;
  render();
  if(params.has('plate')){
   theme='all';$('#place-filter').value='all';$('#kind-filter').value='all';render();openPlate(params.get('plate'));
  }
  ['left','right'].forEach(side=>{const sel=$('#compare-'+side);catalog.forEach(p=>sel.add(new Option(p.place+' / '+p.title,p.id)));sel.onchange=()=>compare(side);});
  $('#compare-left').value='northshore';$('#compare-right').value='northshore-dtm';compare('left');compare('right');
 }catch(e){$('#catalog-status').textContent=e.message;$('#catalog-grid').innerHTML='<p class="atlas-error">The catalog could not be loaded. Reload this page to try again.</p>';}
}
init();
// Draw a deterministic source-data sample with a simple orthographic camera.
async function pointViewer(){
 try{
  const response=await fetch('assets/data/lamont-sample.json');if(!response.ok)throw Error('Point sample unavailable');const data=await response.json();
  const canvas=$('#point-canvas'),ctx=canvas.getContext('2d');let yaw=-0.5,pitch=0.65,zoom=1,drag=null;
  const ext=data.extent_xyz,maxSpan=Math.max(ext[0],ext[1],ext[2]),points=data.points,colorMax=data.color_max||65535;
  $('#point-metadata').innerHTML=[['SOURCE',data.source_file],['DISPLAYED',data.sample_point_count.toLocaleString()+' sampled points'],['SOURCE ARCHIVE',data.source_point_count.toLocaleString()+' points'],['EXTENT',ext.map(x=>x.toFixed(1)).join(' × ')+' m'],['SAMPLING',data.sampling],['COORDINATES',data.horizontal_crs]].map(([a,b])=>`<dt>${a}</dt><dd>${esc(b)}</dd>`).join('');
  function draw(){
   const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.fillStyle='#112539';ctx.fillRect(0,0,w,h);
   const size=Math.min(w,h)*0.82/maxSpan*zoom,cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),color=$('#point-color').value;
   for(const q of points){let x=q[0]-ext[0]/2,y=q[1]-ext[1]/2,z=q[2]-ext[2]/2;let xx=x*cy-y*sy,yy=x*sy+y*cy,py=yy*sp-z*cp;
    if(color==='height'){let t=Math.max(0,Math.min(1,q[2]/ext[2]));ctx.fillStyle=`hsl(${205-t*170} 65% ${43+t*22}%)`;}
    else ctx.fillStyle=`rgb(${q[3]/colorMax*255},${q[4]/colorMax*255},${q[5]/colorMax*255})`;
    ctx.fillRect(w/2+xx*size,h/2+py*size,1.8,1.8);
   }
   ctx.fillStyle='#d9e5ef';ctx.font='11px Arial';ctx.fillText('LAMONT / SOURCE POINT SAMPLE',18,25);ctx.fillText('Drag to rotate · source RGB or relative height',18,h-17);
  }
  let scheduled=false;function redraw(){if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;draw();});}}
  canvas.onpointerdown=e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*0.01;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag[1])*0.008));drag=[e.clientX,e.clientY];redraw();};canvas.onpointerup=()=>drag=null;canvas.onpointercancel=()=>drag=null;
  $('#point-color').onchange=redraw;$('#point-zoom').oninput=e=>{zoom=Number(e.target.value);redraw();};$('#point-reset').onclick=()=>{yaw=-0.5;pitch=0.65;zoom=1;$('#point-zoom').value=1;redraw();};
  canvas.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key))return;e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.4,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(-1.4,pitch-.1);if(e.key==='+'||e.key==='=')zoom=Math.min(3,zoom+.1);if(e.key==='-')zoom=Math.max(.5,zoom-.1);$('#point-zoom').value=zoom;redraw();};
  new ResizeObserver(redraw).observe(canvas);redraw();
 }catch(e){$('#point-metadata').textContent=e.message;}
}
pointViewer();
