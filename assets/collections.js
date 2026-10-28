(() => {
 const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const mode=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal',kind=document.body.dataset.collection;
 $('#brand-name').textContent=DRONE_BRANDING[mode].name;$('#footer-brand').textContent=DRONE_BRANDING[mode].footer;
 document.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(a.id!=='edition-link'&&/^[a-z-]+\.html(?:[?#]|$)/.test(h)&&mode==='efpl'){const u=new URL(h,location.href);u.searchParams.set('edition','efpl');a.href=u.href;}});
 $('#edition-link').href=kind==='teaching'?'teaching.html':'staten-island.html';$('#edition-link').href+='?edition='+(mode==='efpl'?'personal':'efpl');$('#edition-link').textContent=mode==='efpl'?'View Kytt MacManus perspective':'View EFPL perspective';
 function atlasLink(p){const u=new URL('explore.html',location.href);u.searchParams.set('plate',p.id);if(mode==='efpl')u.searchParams.set('edition','efpl');u.hash='catalog';return u.href;}
 function figure(p,feature=false){return `<figure><a href="${atlasLink(p)}"><img src="${esc(DRONE_ASSET_URL(p.image))}" alt="${esc(p.alt||p.title)}" ${feature?'':'loading="lazy"'}></a><figcaption><strong>${esc(p.title)}</strong>${esc(p.caption)}<br>${esc(p.credit)} · ${esc(p.date||'Field imagery')}</figcaption></figure>`;}
 async function init(){try{
  const [catalogResponse,eventResponse]=await Promise.all([fetch('assets/data/visual-catalog.json?v=5'),fetch('assets/data/collection-events.json?v=5')]);
  if(!catalogResponse.ok||!eventResponse.ok)throw Error('Collection data unavailable');const catalog=await catalogResponse.json(),events=await eventResponse.json();
  const related=catalog.filter(p=>(p.topics||[]).includes(kind));
  const preferred=kind==='teaching'?['drive-lamont-jan2023-overhead','nyesta-2025-visible']:['staten-island-2023-rooftop','northshore-controller-session'];
  const featured=preferred.map(id=>catalog.find(p=>p.id===id)).filter(Boolean);
  if(featured.length<2)featured.push(...related.filter(p=>/Field photograph|Workshop photograph/.test(p.kind)&&!featured.includes(p)).slice(0,2-featured.length));
  $('#collection-feature').innerHTML=featured.map(p=>figure(p,true)).join('');
  const selected=events.filter(e=>e.collections.includes(kind));
  $('#event-list').innerHTML=selected.map(e=>{const plates=e.plates.map(id=>catalog.find(p=>p.id===id)).filter(Boolean);return `<article class="event" id="${esc(e.id)}"><div class="event-head"><time>${esc(e.dateLabel)}</time><div><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p></div></div><div class="event-gallery">${plates.map(p=>figure(p)).join('')}</div><p class="event-source">${esc(e.sourceNote)}</p></article>`;}).join('')||'<p class="collection-empty">Related plates can be explored in the field atlas.</p>';
  const products=catalog.filter(p=>((p.topics||[]).includes(kind)||(kind==='teaching'&&(p.topics||[]).includes('lamont')))&&/orthomosaic|model|cloud|3d|render|survey view|thermal display/i.test(p.kind)).slice(0,6);$('#collection-products').innerHTML=products.map(p=>figure(p)).join('');
 }catch(e){$('#event-list').textContent=e.message;}}
 init();
})();

