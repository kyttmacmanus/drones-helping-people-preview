(() => {
  const target=document.querySelector('#teaching-project-list');
  if(!target)return;
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const edition=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
  const cases=(window.DRONE_CASE_STUDIES||[]).filter(c=>(c.topics||[]).includes('teaching'));
  const priority=['black-rock-forest','william-paterson','hemlock-hill','callicoon','lamont-instruction'];
  cases.sort((a,b)=>(priority.indexOf(a.id)<0?99:priority.indexOf(a.id))-(priority.indexOf(b.id)<0?99:priority.indexOf(b.id)));
  const link=(name,params={},hash='')=>{
    const url=new URL(name,location.href);Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
    if(edition==='efpl')url.searchParams.set('edition','efpl');url.hash=hash;return url.href;
  };
  target.innerHTML=cases.map(c=>`<article class="teaching-project" id="teaching-${esc(c.id)}">${c.cover?`<a href="${link('explore.html',{plate:c.cover.id},'catalog')}"><img src="${esc(DRONE_ASSET_URL(c.cover.thumb||c.cover.image))}" alt="${esc(c.cover.title)}" loading="lazy"></a>`:''}<div><p class="eyebrow">${esc(c.period)}</p><h3>${esc(c.title)}</h3><p>${esc(c.summary)}</p><p class="small">${esc(c.credit)}</p><a href="${link('index.html',{},c.id)}">Project question and contribution →</a>${c.cover?`<p><a href="${link('explore.html',{plate:c.cover.id},'catalog')}">Imagery and source metadata →</a></p>`:''}</div></article>`).join('');
})();
