(() => {
  const edition=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
  const branding=(window.DRONE_BRANDING||{})[edition];
  if(branding){
    const name=document.querySelector('#brand-name'),footer=document.querySelector('#footer-brand');
    if(name)name.textContent=branding.name;
    if(footer)footer.textContent=branding.footer;
  }
  document.querySelectorAll('a[href]').forEach(anchor=>{
    const href=anchor.getAttribute('href');
    if(anchor.id==='edition-link'||!/^([a-z-]+\.html)(?:[?#]|$)/.test(href))return;
    if(edition==='efpl'){
      const url=new URL(href,location.href);url.searchParams.set('edition','efpl');anchor.href=url.href;
    }
  });
  const editionLink=document.querySelector('#edition-link');
  if(editionLink){
    const url=new URL('communities.html',location.href);url.searchParams.set('edition',edition==='efpl'?'personal':'efpl');url.hash=location.hash;
    editionLink.href=url.href;editionLink.textContent=edition==='efpl'?'View Kytt MacManus perspective':'View EFPL perspective';
  }
  const dateContext=plate=>{
    const role=String(plate.date_role||'').replace('_','-');
    const label=role==='mission-record'?'Mission record':role==='underlying-fieldwork'?'Fieldwork record':role==='fieldwork-period'?'Fieldwork period':plate.capture_date?'Camera capture':'Collection date';
    return `${label}: ${plate.capture_date||plate.date||'see atlas date basis'}`;
  };
  fetch('assets/data/visual-catalog.json?v=6h-20261029').then(response=>{
    if(!response.ok)throw Error('Catalog unavailable');return response.json();
  }).then(catalog=>{
    const plates=new Map(catalog.map(plate=>[plate.id,plate]));
    document.querySelectorAll('figure[data-plate]').forEach(figure=>{
      const plate=plates.get(figure.dataset.plate);if(!plate)return;
      const credit=figure.querySelector('[data-plate-credit]'),meta=figure.querySelector('[data-plate-meta]');
      if(credit)credit.textContent=plate.credit||'';
      if(meta)meta.textContent=` · ${dateContext(plate)} · ${plate.product_type||plate.kind}`;
      const img=figure.querySelector('img');
      if(img&&plate.width&&plate.height){img.width=plate.width;img.height=plate.height;}
    });
  }).catch(()=>{/* The static narrative, credits, imagery and atlas links remain available. */});
})();
