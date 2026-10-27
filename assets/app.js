const mode=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
const brand=DRONE_BRANDING[mode];
document.querySelector('#brand-name').textContent=brand.name;
document.querySelector('#footer-brand').textContent=brand.footer;
if(mode==='efpl'){
 document.title='Drones Helping People | EFPL · Columbia';
 document.querySelector('#byline').textContent='An EFPL research story with Kytt MacManus and collaborators';
 document.querySelector('#edition-link').href='?edition=personal';
 document.querySelector('#edition-link').textContent='Preview personal edition';
}
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const schematic=id=>id==='lamont'?'<div class="diagram"><span>TERRAIN & SURFACE FEATURES</span><svg viewBox="0 0 600 180" role="img" aria-label="Conceptual terrain profile with airflow paths"><path d="M0 150L90 130 155 145 240 70 310 100 390 30 470 100 600 130" fill="none" stroke="currentColor" stroke-width="3"/><path d="M15 65 Q120 30 220 25 T580 20 M20 92 Q120 60 205 55 T580 50 M15 120 Q130 95 200 90 T350 70 T580 85" fill="none" stroke="#ad7f3a" stroke-width="2" stroke-dasharray="9 6"/></svg><span>MEASUREMENTS → INTERPRETATION → MODELING</span></div>':'<div class="diagram exchange"><span>CITY-TO-CITY EXCHANGE / FEBRUARY 2026</span><div><b>New York</b><i>↔</i><b>Lusaka</b><i>↔</i><b>Freetown</b></div><span>CITIZEN-ENGAGED DRONE MAPPING</span></div>';
const galleries={
 students:{place:'North Shore Esplanade',items:[['field/northshore-community-thumb.jpg','Community fieldwork'],['field/northshore-thumb.jpg','North Shore mapping']]},
 'four-sparrow':{place:'Four Sparrow Marsh',items:[['field/four-sparrow-december-thumb.jpg','December field imagery'],['field/four-sparrow-relief-thumb.jpg','Terrain shaded relief']]},
 'nyc-parks':{place:'Morningside Park',items:[['field/morningside-dtm-thumb.jpg','Terrain model'],['field/morningside-3d-thumb.jpg','3D reconstruction']]},
 lamont:{place:'Lamont',items:[['field/lamont-ortho-thumb.jpg','Orthomosaic'],['field/lamont-field-team-thumb.jpg','Field archive / 2024']]},
 lusaka:{place:'Mtukuzi',items:[['zambia/team-thumb.jpg','Field collaboration'],['zambia/equipment-thumb.jpg','Drone field equipment']]},
 mtukuzi:{place:'Mtukuzi',items:[['zambia/river-map-thumb.jpg','River corridor'],['zambia/well-mesh-thumb.jpg','Water structure in 3D']]}
};
function previewGallery(id){const g=galleries[id];return `<div class="project-gallery">${g.items.map(([image,label])=>`<a href="explore.html?place=${encodeURIComponent(g.place)}#catalog"><img src="assets/${image}" alt="${esc(label)}" loading="lazy"><span>${esc(label)} ↗</span></a>`).join('')}</div><a class="project-atlas-link" href="explore.html?place=${encodeURIComponent(g.place)}#catalog">Explore this evidence in the atlas →</a>`;}
document.querySelector('#projects').innerHTML=DRONE_PROJECTS.map((p,i)=>`<article class="project" id="${p.id}" data-group="${p.group}"><figure>${p.image?`<button class="image-open" data-image="${p.image}" data-alt="${esc(p.alt)}" data-caption="${esc(p.caption)}" aria-label="Enlarge ${esc(p.alt)}"><img src="assets/${p.image}" alt="${esc(p.alt)}" loading="lazy"><span class="enlarge">Enlarge ↗</span></button>`:schematic(p.id)}<figcaption>${esc(p.caption)}</figcaption></figure><div class="project-copy"><p class="eyebrow">${String(i+1).padStart(2,'0')} / ${p.label}</p><div class="project-meta">${p.year} · ${p.place}</div><h3>${p.title}</h3><p>${p.body}</p><p class="credit">${p.credit}</p><dl><dt>THE QUESTION</dt><dd>${p.question}</dd><dt>THE CONTRIBUTION</dt><dd>${p.output}</dd></dl>${previewGallery(p.id)}<details><summary>Field notes & sources</summary><p>${p.detail}</p><p class="small">${p.sources}</p></details></div></article>`).join('');
const projects=[...document.querySelectorAll('.project')];
document.querySelector('#results').textContent='6 connected chapters';
function filter(value){
 document.querySelectorAll('[data-filter]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.filter===value?'true':'false'));
 let count=0;projects.forEach(p=>{p.hidden=value!=='all'&&p.dataset.group!==value;if(!p.hidden)count++;});
 document.querySelector('#results').textContent=count+' chapters shown';
}
document.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>filter(b.dataset.filter));
// Timeline links must still work after a visitor has filtered the projects.
document.querySelectorAll('.timeline a').forEach(a=>a.addEventListener('click',()=>filter('all')));
const dialog=document.querySelector('#image-dialog');
document.querySelectorAll('[data-image]').forEach(b=>b.onclick=()=>{
 dialog.querySelector('img').src='assets/'+b.dataset.image;dialog.querySelector('img').alt=b.dataset.alt;
 dialog.querySelector('p').textContent=b.dataset.caption;dialog.showModal();
});
document.querySelector('#close-image').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
document.querySelector('#present').onclick=()=>{
 filter('all');document.body.classList.toggle('presenting');
 document.querySelector('#present').textContent=document.body.classList.contains('presenting')?'Exit presentation ×':'Present ↗';
};
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){document.body.classList.remove('presenting');document.querySelector('#present').textContent='Present ↗';}
 if(document.body.classList.contains('presenting')&&['ArrowRight','ArrowLeft'].includes(e.key)&&!dialog.open){
  const sections=[...document.querySelectorAll('.hero,.band,#story,.project:not([hidden]),.quote,#next,#people')];
  let idx=0,distance=Infinity;sections.forEach((s,i)=>{let d=Math.abs(s.getBoundingClientRect().top-110);if(d<distance){idx=i;distance=d;}});
  sections[Math.max(0,Math.min(sections.length-1,idx+(e.key==='ArrowRight'?1:-1)))].scrollIntoView();e.preventDefault();
 }
});

// Keep host branding when moving between local pages, including filtered atlas links.
if(mode==='efpl')document.querySelectorAll('a[href]').forEach(a=>{const href=a.getAttribute('href');if(a.id!=='edition-link' && /^[a-z-]+\.html(?:[?#]|$)/.test(href)){const url=new URL(href,location.href);url.searchParams.set('edition','efpl');a.href=url.href;}});
