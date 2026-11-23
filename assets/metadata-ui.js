(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const known=value=>value!==undefined&&value!==null&&value!==''&&value!=='unknown'&&value!=='Unknown'&&(!Array.isArray(value)||value.length);
  const text=value=>Array.isArray(value)?value.map(v=>typeof v==='object'?(v.name||v.label||''):v).filter(Boolean).join(' · '):String(value??'');
  const unique=values=>[...new Set(values.filter(known).map(text))].join(' · ');
  function dateLabel(p){
    let value=p.capture_date||p.date||'See date notes';
    if(known(p.capture_time))value+=' · '+p.capture_time+(known(p.timezone)?' '+p.timezone:' (time zone not established)');
    return value;
  }
  function items(p){
    const result=[];
    const add=(label,value,wide=false,technical=false)=>{if(known(value))result.push({label,value:text(value),wide,technical});};
    add(String(p.date_role).replace('_','-')==='mission-record'?'Date: SiteScan mission record':p.date_role==='fieldwork-period'?'Fieldwork date':p.date_role==='underlying-fieldwork'?'Fieldwork date':p.capture_date?'Image capture date':'Image or product date',dateLabel(p));
    add('Place',p.place);
    const areaNames={teaching:'Teaching & Workshops',communities:'Communities',parks:'NYC Parks',research:'Research'};
    add('Program areas',(p.program_areas||[]).map(a=>areaNames[a]||a));
    add('Project / event',unique([p.project,p.event]),true);
    add('Course / program',p.program_or_course);
    add('Photographer or creator',unique([p.photographer,p.creator]));
    add('Image credit',p.credit,true);
    add('Camera / sensor',unique([p.camera_make,p.camera_model,p.sensor]),true,true);
    add('Lens',p.lens,false,true);
    add('Product',p.product_type||p.kind);
    add('Processing',p.processing_context,true);
    add('Image source',p.source_label||'Columbia University');
    add('Image size',p.width&&p.height?`${p.width} × ${p.height} pixels`:null,false,true);
    add('Notes and limitations',p.uncertainty,true);
    return result;
  }
  function metadataHTML(p){return items(p).map(i=>`<div class="metadata-item${i.wide?' metadata-wide':''}"><dt>${esc(i.label)}</dt><dd${i.technical?' class="metadata-technical"':''}>${esc(i.value)}</dd></div>`).join('');}
  function provenanceHTML(p){
    return `<details class="metadata-provenance"><summary>Date and image notes</summary>${p.date_basis?`<p><b>Date note</b><br>${esc(p.date_basis)}</p>`:''}<p><b>Image source</b><br>${esc(p.source_label||'Columbia University')}</p>${p.basemap_state?`<p><b>Map background</b><br>Basemap ${esc(p.basemap_state)}${p.display_background?' · '+esc(p.display_background):''}</p>`:''}<p>This image is for viewing. Analysis requires the original data and processing information.</p></details>`;
  }
  function compactHTML(p){
    const values=[dateLabel(p),p.place,p.event||p.project,p.photographer||p.creator,p.camera_model||p.sensor,p.product_type||p.kind].filter(known);
    return [...new Set(values.map(text))].map(value=>`<span>${esc(value)}</span>`).join('');
  }
  window.DRONE_META={items,metadataHTML,provenanceHTML,compactHTML,dateLabel};
})();
