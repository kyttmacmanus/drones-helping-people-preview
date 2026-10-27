(() => {
  const mode=(new URLSearchParams(location.search).get('edition')||window.DRONE_DEFAULT_EDITION)==='efpl'?'efpl':'personal';
  const brand=window.DRONE_BRANDING?.[mode];
  if(brand){document.querySelector('#brand-name').textContent=brand.name;document.querySelector('#footer-brand').textContent=brand.footer;}
  document.querySelectorAll('a[href$=".html"]').forEach(a=>{if(mode==='efpl')a.href=a.getAttribute('href')+'?edition=efpl';});
  if(mode==='efpl'){document.querySelector('#edition-link').href='?edition=personal';document.querySelector('#edition-link').textContent='Preview personal edition';}
  const views={
    'village-ortho':{alt:'Village and school-area orthomosaic preview',caption:'Village and school-area orthomosaic: examine the spatial relationships among buildings, paths, cleared land, and vegetation.',prompt:'Which paths and cultivated areas appear close to one another, and what would a local resident add to this interpretation?'},
    'village-terrain':{alt:'Digital terrain model preview of the selected village and school area with relative elevation colors',caption:'Village DTM display: relative terrain patterns in a processed product. Vegetation, structures, gaps, and positional uncertainty affect interpretation.',prompt:'Which areas appear relatively lower? What would you need to check before linking a low area to runoff, flooding, or access after rain?'},
    'crop-ortho':{alt:'Orthomosaic preview of one selected agricultural mapping area',caption:'Agricultural-area orthomosaic from the June campaign. Interpretation of crop condition, seasonality, ownership, or land-use decisions requires additional evidence.',prompt:'What field or path pattern is visible? List at least two possible explanations before choosing one to investigate.'},
    'river-ortho':{alt:'Orthomosaic preview of a selected river corridor',caption:'Selected river corridor at the time of capture. Coverage is limited to this reach; water quality and catchment processes require separate measurements.',prompt:'How are the river, nearby vegetation, access paths, and cultivated land related in this image? Which relationship deserves a field check?'},
    'village-mesh':{alt:'Composite textured 3D mesh views of the village and school area',caption:'Textured mesh views from local companion products. Possible vertical exaggeration and perspective must be considered when interpreting apparent dimensions.',prompt:'What does an oblique view make easier to see, and where might perspective or exaggeration change your impression?'}
  };
  document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.view,view=views[key];
    document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b===button?'true':'false'));
    const image=document.querySelector('#lesson-image');image.src='assets/learning/'+key+'.jpg';image.alt=view.alt;
    document.querySelector('#lesson-image-link').href=image.src;
    document.querySelector('#lesson-image-caption').textContent=view.caption;document.querySelector('#view-prompt').textContent=view.prompt;
  }));
  document.querySelector('#inventory-form').addEventListener('submit',event=>{
    event.preventDefault();const form=event.currentTarget,answers={image:'source',terrain:'derived',report:'documentation'};
    const values=Object.keys(answers).map(name=>form.elements[name].value);
    const result=document.querySelector('#inventory-result');
    if(values.some(v=>!v)){result.textContent='Choose a category for all three items, then check again.';return;}
    const score=Object.keys(answers).filter(name=>form.elements[name].value===answers[name]).length;
    result.textContent=score===3?'All three are correct. Preserve the camera image as source data, trace the terrain model to its processing, and keep the report with the package.':`${score} of 3 are correct. The unedited camera JPEG is source data; the terrain model is a derived product; the processing report is documentation. Try the inventory again with that distinction in mind.`;
  });
  const workflows={
    hybrid:{title:'Hybrid archive and selected sharing',text:'Keep the complete source archive under local or institutional control. Use an approved online workspace for selected products and collaboration.',items:['Specify which files are authoritative and where they live.','Maintain backups and a link between shared products and source records.','Limit shared detail to what the work needs; access decisions remain with the project and partners.']},
    desktop:{title:'Local control and backup',text:'A desktop or institutional-storage workflow can fit unreliable internet or sensitive material, but a single computer is not a preservation strategy.',items:['Document folder structure and original filenames.','Back up to a separate approved location.','Plan how collaborators will receive the selected products and their documentation.']},
    cloud:{title:'Cloud processing and collaboration',text:'An online platform can help a distributed team work together, but upload speed, processing costs, permissions, and exportability still matter.',items:['Check upload capacity and the cost of retaining full-resolution data.','Review who can access or change the files.','Keep a documented source archive and an exit path for products and metadata.']}
  };
  function showWorkflow(){const w=workflows[document.querySelector('#workflow-choice').value],target=document.querySelector('#workflow-description');target.replaceChildren();const h=document.createElement('h3');h.textContent=w.title;const p=document.createElement('p');p.textContent=w.text;const ul=document.createElement('ul');w.items.forEach(text=>{const li=document.createElement('li');li.textContent=text;ul.append(li);});target.append(h,p,ul);}
  document.querySelector('#workflow-choice').addEventListener('change',showWorkflow);showWorkflow();
  document.querySelector('#observation-form').addEventListener('submit',event=>{
    event.preventDefault();
    const fields=[['Local question','question'],['Visible observation','observation'],['Tentative interpretation','interpretation'],['Limits of the evidence','limits'],['Local follow-up','followup']];
    const text=['MTUKUZI OBSERVATION NOTE','Practice record accompanying the working module by Raphael Sutiono and Kytt MacManus.','Record observations, tentative interpretation, evidence limits, and proposed field checks.','',...fields.map(([label,id])=>label+'\n'+(document.getElementById(id).value.trim()||'[not entered]')+'\n')].join('\n');
    const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='mtukuzi-observation-note.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.querySelector('#observation-status').textContent='Your observation note has been prepared as a text download. No answers were uploaded.';
  });
})();
