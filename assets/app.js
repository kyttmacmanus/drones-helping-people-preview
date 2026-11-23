(() => {
 const $=selector=>document.querySelector(selector);
 const esc=value=>String(value??'').replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
 const params=new URLSearchParams(location.search);
 const mode=(params.get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
 const brand=DRONE_BRANDING[mode];
 $('#brand-name').textContent=brand.name;
 $('#footer-brand').textContent=brand.footer;
 if(mode==='efpl'){
  $('#byline').textContent='Environmental Flow Physics Laboratory · Columbia University';
  document.title='Drones Helping People | EFPL · Columbia';
 }
 $('#edition-link').href='?edition='+(mode==='efpl'?'personal':'efpl');
 $('#edition-link').textContent=mode==='efpl'?'View Kytt MacManus perspective':'View EFPL perspective';
 const areas=new Map(DRONE_PROGRAM_AREAS.map(area=>[area.id,area]));
 const visuals=new Map();
 const remember=visual=>{if(visual)visuals.set(visual.id,visual);};
 DRONE_CASE_STUDIES.forEach(project=>{remember(project.cover);project.visuals.forEach(remember);});
 DRONE_SEQUENCES.forEach(sequence=>sequence.steps.forEach(step=>remember(step.visual)));
 remember(window.DRONE_FEATURED_MESH);
 function image(visual,role=''){
  return `<figure><button class="image-open" data-visual="${esc(visual.id)}" aria-label="View larger image: ${esc(visual.title)}"><img src="${esc(DRONE_ASSET_URL(visual.thumb||visual.image))}" alt="${esc(visual.alt_text||visual.alt||visual.title)}" ${DRONE_IMAGE_ATTRS(visual.image)} loading="lazy"><span class="enlarge">View image</span></button><figcaption>${role?`<b>${esc(role)}</b><br>`:''}${esc(visual.title)} · ${esc(visual.date||'Date not recorded')}</figcaption></figure>`;
 }
 function caseImage(visual){
  const source=esc(DRONE_ASSET_URL(visual.image));
  const dimensions=window.DRONE_RESPONSIVE_IMAGES?.[visual.image]?DRONE_IMAGE_ATTRS(visual.image):`width="${visual.width}" height="${visual.height}" decoding="async"`;
  return `<figure><a class="case-image-link" href="${source}" target="_blank" rel="noopener" aria-label="View full image: ${esc(visual.title)}"><img src="${source}" alt="${esc(visual.alt_text)}" ${dimensions} loading="lazy"></a><figcaption>${esc(visual.caption)}<br>${esc(visual.credit)}</figcaption></figure>`;
 }
 function caseProducts(project){
  if(!Array.isArray(project.case_products))return '';
  const products=project.case_products.filter(product=>product&&typeof product.image==='string'&&/^assets\/[A-Za-z0-9_./-]+\.(?:jpe?g|png|webp|avif)$/.test(product.image)&&!product.image.includes('..'));
  if(!products.length)return '';
  return `<section class="case-products" aria-label="Mapping products for ${esc(project.title)}"><h4>Mapping products</h4><div class="case-products-grid">${products.map(product=>{
   const source=esc(DRONE_ASSET_URL(product.image));
   const dimensions=window.DRONE_RESPONSIVE_IMAGES?.[product.image]?DRONE_IMAGE_ATTRS(product.image,'(max-width: 720px) calc(100vw - 70px), 28vw'):`width="${product.width}" height="${product.height}" decoding="async"`;
   const notes=[['Date',product.date],['Date note',product.date_basis],['Interpretation',product.uncertainty],['Image credit',product.credit]].filter(([,value])=>typeof value==='string'&&value.trim());
   const details=notes.length?`<details class="case-product-details"><summary>Image details</summary><dl>${notes.map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join('')}</dl></details>`:'';
   return `<figure data-product-type="${esc(product.type_key)}"><a href="${source}" target="_blank" rel="noopener" aria-label="View full image: ${esc(product.label)}"><img src="${source}" alt="${esc(product.alt_text)}" ${dimensions} loading="lazy"></a><figcaption><strong>${esc(product.label)}</strong><p>${esc(product.caption)}</p>${details}</figcaption></figure>`;
  }).join('')}</div></section>`;
 }
 function questions(project){return `<dl><dt>Question</dt><dd>${esc(project.question)}</dd><dt>Contribution</dt><dd>${esc(project.contribution)}</dd></dl>`;}
 function caseDetails(project){
  const facts=`<dl><dt>Topics</dt><dd>${esc(project.topics.join(' · '))}</dd>${project.acquisition_date?`<dt>Acquisition</dt><dd><time datetime="${esc(project.acquisition_date)}">${esc(project.period)}</time></dd>`:''}</dl>`;
  const credit=`<p class="credit">${esc(project.credit)}</p>`;
  const sources=project.public_sources.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)}</a></p>`).join('');
  const related=project.related_page?`<p><a href="${esc(project.related_page)}" aria-label="View related collection: ${esc(project.title)}">View related collection</a></p>`:'';
  const extraImages=project.visuals.length?`<div class="case-secondary">${project.visuals.slice(0,2).map(visual=>image(visual)).join('')}</div>`:'';
  if(project.narrative)return facts+credit+sources+related+extraImages;
  return `<details><summary>Question and project details</summary>${questions(project)}<p>${esc(project.details)}</p>${credit}${sources}${related}${extraImages}</details>`;
 }
 function projectDate(project){
  if(project.status_label)return `<span>${esc(project.status_label)}</span>${project.acquisition_date?'':' · '+esc(project.period)}`;
  return esc(project.period);
 }
 $('#projects').innerHTML=DRONE_CASE_STUDIES.map(project=>`<article class="case-study${project.homepage_treatment==='compact'?' case-study--compact':''}${project.narrative?' case-study--narrative':''}${Array.isArray(project.case_products)&&project.case_products.length?' case-study--products':''}" id="${project.id}" data-program-areas="${esc(project.program_areas.join(' '))}" data-status="${project.status}"><div class="case-visual">${project.cover?image(project.cover):project.case_image?caseImage(project.case_image):`<div class="case-placeholder"><h3>${esc(project.place)}</h3><p>Fieldwork and project context</p></div>`}</div><div class="case-copy"><p class="case-status">${projectDate(project)}</p><h3>${esc(project.title)}</h3><p>${esc(project.summary)}</p>${(project.narrative||[]).map(paragraph=>`<p>${esc(paragraph)}</p>`).join('')}${caseProducts(project)}<div class="topic-list">${project.program_areas.map(area=>`<a class="area-tag" data-area="${area}" data-program-filter="${area}" href="#area-${area}">${esc(areas.get(area).title)}</a>`).join('')}</div>${caseDetails(project)}</div></article>`).join('');
 function filter(area,reveal=false){
  document.querySelectorAll('[data-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.filter===area)));
  let count=0;
  document.querySelectorAll('.case-study').forEach(card=>{card.hidden=area!=='all'&&!card.dataset.programAreas.split(' ').includes(area);if(!card.hidden)count++;});
  $('#results').textContent=`${count} ${count===1?'selected case study':'selected case studies'}${area==='all'?'':' · '+areas.get(area).title}`;
  if(reveal)$('#all-projects').open=true;
 }
 const requestedArea=areas.has(params.get('area'))?params.get('area'):'all';
 filter(requestedArea,requestedArea!=='all');
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>filter(button.dataset.filter,true)));
 const selected=new Set(['callicoon','north-shore','mtukuzi','four-sparrow']);
 $('#evidence-sequences').innerHTML=DRONE_SEQUENCES.filter(sequence=>selected.has(sequence.case_study)&&sequence.homepage!==false).map(sequence=>`<article class="evidence-sequence"><h3>${esc(sequence.title)}</h3><p>${esc(sequence.summary)}</p><div class="sequence-grid">${sequence.steps.map(step=>image(step.visual,step.role)).join('')}</div><p><a href="#${sequence.case_study}" data-case-link>View project: ${esc(DRONE_CASE_STUDIES.find(project=>project.id===sequence.case_study).title)}</a></p></article>`).join('');
 const legacy={students:'area-teaching','nyc-parks':'area-parks',lamont:'lamont-research',lusaka:'hot-unza','chapter-teaching':'area-teaching','chapter-community':'area-communities','chapter-parks':'area-parks','chapter-international':'area-teaching','chapter-current':'area-research'};
 function revealTarget(identifier){
  const target=document.getElementById(legacy[identifier]||identifier);
  if(!target)return;
  if(target.closest('.case-study'))filter('all',true);
  for(let ancestor=target;ancestor;ancestor=ancestor.parentElement){if(ancestor.tagName==='DETAILS')ancestor.open=true;}
  return target;
 }
 document.querySelectorAll('[data-case-link]').forEach(link=>link.addEventListener('click',()=>{filter('all',true);revealTarget(decodeURIComponent(link.hash.slice(1)));}));
 document.querySelectorAll('[data-timeline-link]').forEach(link=>link.addEventListener('click',()=>revealTarget(decodeURIComponent(link.hash.slice(1)))));
 document.querySelectorAll('[data-program-filter]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();filter(link.dataset.programFilter,true);$('#places').scrollIntoView();}));
 function revealHash(){
  const target=revealTarget(decodeURIComponent(location.hash.slice(1)));
  if(target)requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));
 }
 window.addEventListener('hashchange',revealHash);
 if(location.hash)revealHash();
 $('#profile-name').textContent=DRONE_PROFILE.name;
 $('#profile-titles').innerHTML=DRONE_PROFILE.titles.map(title=>`<span>${esc(title)}</span>`).join('');
 const dialog=$('#image-dialog');
 document.querySelectorAll('[data-visual]').forEach(button=>button.addEventListener('click',()=>{
  const visual=visuals.get(button.dataset.visual);
  $('#dialog-image').src=DRONE_ASSET_URL(visual.image);
  $('#dialog-image').alt=visual.alt_text||visual.alt||visual.title;
  $('#dialog-metadata').innerHTML=DRONE_META.compactHTML(visual);
  $('#dialog-caption').textContent=[visual.caption,visual.credit,visual.uncertainty].filter(Boolean).join(' ');
  $('#dialog-atlas').href='explore.html?plate='+encodeURIComponent(visual.id)+(mode==='efpl'?'&edition=efpl':'')+'#catalog';
  dialog.showModal();
 }));
 $('#close-image').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
 function exitPresentation(){document.body.classList.remove('presenting');$('#present').textContent='View presentation';}
 $('#present').addEventListener('click',()=>{
  filter('all');
  document.body.classList.toggle('presenting');
  $('#present').textContent=document.body.classList.contains('presenting')?'Exit presentation':'View presentation';
 });
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape')exitPresentation();
  if(document.body.classList.contains('presenting')&&['ArrowRight','ArrowLeft'].includes(event.key)&&!dialog.open){
   const sections=[...document.querySelectorAll('.hero,#story,#selected-projects,#program-timeline,#atlas-entry,#people')];
   let nearest=0,distance=Infinity;
   sections.forEach((section,index)=>{const nextDistance=Math.abs(section.getBoundingClientRect().top-100);if(nextDistance<distance){distance=nextDistance;nearest=index;}});
   sections[Math.max(0,Math.min(sections.length-1,nearest+(event.key==='ArrowRight'?1:-1)))].scrollIntoView();
   event.preventDefault();
  }
 });
 if(mode==='efpl')document.querySelectorAll('a[href]').forEach(link=>{
  const href=link.getAttribute('href');
  if(link.id!=='edition-link'&&/^[a-z-]+\.html(?:[?#]|$)/.test(href)){const url=new URL(href,location.href);url.searchParams.set('edition','efpl');link.href=url.href;}
 });
})();
