// Native dialogs retain browser semantics, with an explicit keyboard boundary
// and return target for programmatic deep links and image controls.
(() => {
 let opener=null;
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-visual],[data-plate]');
  if(control)opener=control;
 },true);
 document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.addEventListener('close',()=>{
   if(opener?.isConnected)opener.focus({preventScroll:true});
   else document.querySelector('#catalog-search,#present,main')?.focus({preventScroll:true});
  });
  dialog.addEventListener('keydown',event=>{
   if(event.key!=='Tab')return;
   const controls=[...dialog.querySelectorAll('button:not([disabled]),a[href]:not([hidden]),input:not([disabled]),select:not([disabled]),summary,[tabindex="0"]')].filter(node=>node.getClientRects().length);
   if(!controls.length){event.preventDefault();return;}
   const first=controls[0],last=controls[controls.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
 });
})();
