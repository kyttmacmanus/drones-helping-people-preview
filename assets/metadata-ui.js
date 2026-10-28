(() => {
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const known=value=>value!==undefined&&value!==null&&value!==''&&value!=='unknown'&&value!=='Unknown'&&(!Array.isArray(value)||value.length);
  const text=value=>Array.isArray(value)?value.map(v=>typeof v==='object'?(v.name||v.label||''):v).filter(Boolean).join(' · '):String(value??'');
  const unique=values=>[...new Set(values.filter(known).map(text))].join(' · ');
  function dateLabel(p){
    let value=p.capture_date||p.date||p.mission_date||'See source date basis';
    if(known(p.capture_time))value+=' · '+p.capture_time+(known(p.timezone)?' '+p.timezone:' (time zone not established)');
    return value;
  }
  function items(p){
    const result=[];
    const add=(label,value,wide=false,technical=false)=>{if(known(value))result.push({label,value:text(value),wide,technical});};
    add(String(p.date_role).replace('_','-')==='mission-record'?'Mission record date':p.date_role==='fieldwork-period'?'Fieldwork period':p.date_role==='underlying-fieldwork'?'Underlying fieldwork date':p.capture_date?'Capture date / time':'Image / product date',dateLabel(p));
    add('Place',p.place);
    add('Project / event',unique([p.project,p.event]),true);
    add('Course / program',p.program_or_course);
    add('Photographer / creator',unique([p.photographer,p.creator]));
    add('Credit',p.credit,true);
    add('Camera / sensor',unique([p.camera_make,p.camera_model,p.sensor]),true,true);
    add('Lens',p.lens,false,true);
    add('Product',p.product_type||p.kind);
    add('Processing context',p.processing_context,true);
    add('Source platform',p.source_platform||'Project archive');
    add('Source collection',p.source_collection&&!/^https:\/\//.test(p.source_collection)?p.source_collection:null,true);
    add('People identified by the source',p.people_depicted,true);
    add('Display dimensions',p.width&&p.height?`${p.width} × ${p.height} pixels · web derivative`:null,false,true);
    add('Interpretation / limits',p.uncertainty,true);
    return result;
  }
  function metadataHTML(p){return items(p).map(i=>`<div class="metadata-item${i.wide?' metadata-wide':''}"><dt>${esc(i.label)}</dt><dd${i.technical?' class="metadata-technical"':''}>${esc(i.value)}</dd></div>`).join('');}
  function provenanceHTML(p){
    const sources=(p.metadata_sources||[]).map(s=>{
      const url=s.url&&/^https:\/\//.test(s.url)?s.url:null;
      return `<p>${url?`<a href="${esc(url)}" target="_blank" rel="noopener">${esc(s.label||'Source record')} ↗</a>`:esc(s.label||'Source record')}</p>`;
    }).join('');
    const filename=p.source_filename||p.source_file||p.source;
    return `<details class="metadata-provenance"><summary>Date basis and source details</summary>${p.date_basis?`<p><b>Date basis</b><br>${esc(p.date_basis)}</p>`:''}${filename?`<p><b>Source record</b><br>${esc(filename)}</p>`:''}${p.source_collection&&/^https:\/\//.test(p.source_collection)?`<p><a href="${esc(p.source_collection)}" target="_blank" rel="noopener">Open source collection ↗</a></p>`:''}${p.mission_id?`<p><b>Mission identifier</b><br><span class="metadata-technical">${esc(p.mission_id)}</span></p>`:''}${p.basemap_state?`<p><b>Product display</b><br>Basemap ${esc(p.basemap_state)}${p.display_background?' · '+esc(p.display_background):''}</p>`:''}${sources}</details>`;
  }
  function compactHTML(p){
    const values=[dateLabel(p),p.place,p.event||p.project,p.photographer||p.creator,p.camera_model||p.sensor,p.product_type||p.kind].filter(known);
    return [...new Set(values.map(text))].map(value=>`<span>${esc(value)}</span>`).join('');
  }
  window.DRONE_META={items,metadataHTML,provenanceHTML,compactHTML,dateLabel};
})();
