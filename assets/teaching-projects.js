(() => {
  const target=document.querySelector('#teaching-project-list');
  if(!target)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const edition=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
  // UNZA has a full, static teaching panel above this project grid.
  const cases=(window.DRONE_CASE_STUDIES||[]).filter(c=>(c.program_areas||[]).includes('teaching')&&c.id!=='hot-unza');
  const priority=['black-rock-forest','william-paterson','hemlock-hill','callicoon','lamont-instruction'];
  cases.sort((a,b)=>(priority.indexOf(a.id)<0?99:priority.indexOf(a.id))-(priority.indexOf(b.id)<0?99:priority.indexOf(b.id)));
  const link=(name,params={},hash='')=>{
    const url=new URL(name,location.href);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    if(edition==='efpl')url.searchParams.set('edition','efpl');url.hash=hash;return url.href;
  };
  target.innerHTML=cases.map(c=>`<article class="teaching-project" id="teaching-${esc(c.id)}">${c.cover?`<a href="${link('explore.html',{plate:c.cover.id},'catalog')}"><img src="${esc(DRONE_ASSET_URL(c.cover.thumb||c.cover.image))}" alt="${esc(c.cover.alt_text||c.cover.alt||c.cover.title)}" ${DRONE_IMAGE_ATTRS(c.cover.image)} loading="lazy"></a>`:''}<div><p class="eyebrow">${esc(c.period)}</p><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><p class="small">${esc(c.credit)}</p><a href="${link('index.html',{},c.id)}">Project question and contribution →</a>${c.cover?`<p><a href="${link('explore.html',{plate:c.cover.id},'catalog')}">Imagery and source metadata →</a></p>`:''}</div></article>`).join('');
  fetch('assets/data/visual-catalog.json?v=6h-20261029').then(response=>{
    if(!response.ok)throw Error('Catalog unavailable');return response.json();
  }).then(catalog=>{
    const plates=new Map(catalog.map(plate=>[plate.id,plate]));
    document.querySelectorAll('.teaching-unza figure[data-plate]').forEach(figure=>{
      const plate=plates.get(figure.dataset.plate);if(!plate)return;
      const credit=figure.querySelector('[data-plate-credit]'),meta=figure.querySelector('[data-plate-meta]');
      if(credit)credit.textContent=plate.credit||'';
      const role=String(plate.date_role||'').replace('_','-');
      const label=role==='mission-record'?'Mission record':role==='underlying-fieldwork'?'Fieldwork record':role==='fieldwork-period'?'Fieldwork period':plate.capture_date?'Camera capture':'Collection date';
      if(meta)meta.textContent=` · ${label}: ${plate.capture_date||plate.date||'see atlas date basis'} · ${plate.product_type||plate.kind}`;
      const img=figure.querySelector('img');
      if(img&&plate.width&&plate.height){img.width=plate.width;img.height=plate.height;}
    });
  }).catch(()=>{/* Static figures preserve captions, credits and source links. */});
})();
