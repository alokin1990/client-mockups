const frame=document.getElementById('homepage-frame');
const stage=document.getElementById('review-stage');
const notes=[...document.querySelectorAll('.review-note')];
const svg=document.querySelector('.review-connectors');
const paths=document.getElementById('connector-paths');
const count=document.getElementById('note-count');
const toggle=document.getElementById('toggle-notes');
const compact=window.matchMedia('(max-width: 860px)');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
let current=0;
let ready=false;
let scheduled=false;
let previousHeight=0;
const namespace='http://www.w3.org/2000/svg';

function targetFor(note){return frame.contentDocument?.querySelector(note.dataset.focus)||frame.contentDocument?.querySelector(note.dataset.target);}
function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;layout();});}
function layout(){
  if(!ready)return;
  const doc=frame.contentDocument;
  const contentHeight=Math.ceil(doc.body.getBoundingClientRect().height);
  if(contentHeight!==previousHeight){frame.style.height=`${contentHeight}px`;previousHeight=contentHeight;}
  const stageRect=stage.getBoundingClientRect();
  const frameRect=frame.getBoundingClientRect();
  const mobile=compact.matches;
  let previousBottom=8;
  notes.forEach((note,index)=>{
    note.hidden=mobile&&index!==current;
    note.classList.toggle('is-current',index===current);
    note.setAttribute('aria-current',index===current?'step':'false');
    const target=targetFor(note);
    if(!target)return;
    const rect=target.getBoundingClientRect();
    if(!mobile){
      const desired=rect.top+Math.min(rect.height*.4,120)-note.offsetHeight/2+Number(note.dataset.offset||0);
      const top=Math.max(26,desired,previousBottom+36);
      note.style.top=`${Math.round(top)}px`;
      previousBottom=top+note.offsetHeight;
    } else note.style.removeProperty('top');
  });
  stage.style.minHeight=`${Math.max(contentHeight,mobile?0:previousBottom+30)}px`;
  const width=mobile?innerWidth:stage.clientWidth;
  const height=mobile?innerHeight:stage.offsetHeight;
  svg.setAttribute('width',width);svg.setAttribute('height',height);svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  paths.replaceChildren();
  notes.forEach((note,index)=>{
    if(note.hidden)return;
    const target=targetFor(note);if(!target)return;
    const targetRect=target.getBoundingClientRect();
    const bubbleRect=note.getBoundingClientRect();
    const pointY=frameRect.top+targetRect.top+Math.min(targetRect.height*.4,120);
    if(mobile&&(pointY<document.querySelector('.review-toolbar').offsetHeight+12||pointY>innerHeight-20))return;
    const onLeft=!mobile&&note.dataset.side==='left';
    const pointX=frameRect.left+targetRect.left+targetRect.width*(onLeft?.18:.65);
    const offsetX=mobile?0:stageRect.left;
    const offsetY=mobile?0:stageRect.top;
    const endX=pointX-offsetX;
    const endY=pointY-offsetY;
    const centerX=bubbleRect.left+bubbleRect.width/2-offsetX;
    const centerY=bubbleRect.top+bubbleRect.height/2-offsetY;
    const distance=Math.hypot(endX-centerX,endY-centerY)||1;
    const radius=note.offsetWidth/2+2;
    const startX=centerX+(endX-centerX)/distance*radius;
    const startY=centerY+(endY-centerY)/distance*radius;
    const dx=endX-startX;
    const dy=endY-startY;
    const lineLength=Math.hypot(dx,dy)||1;
    const bend=Math.min(42,lineLength*.2)*(onLeft?-1:1);
    const controlX=(startX+endX)/2-dy/lineLength*bend;
    const controlY=(startY+endY)/2+dx/lineLength*bend;
    const path=document.createElementNS(namespace,'path');
    path.setAttribute('d',`M ${startX} ${startY} Q ${controlX} ${controlY}, ${endX} ${endY}`);
    path.setAttribute('class',`connector${index===current?' is-current':''}`);
    path.setAttribute('marker-end','url(#note-arrow)');
    path.dataset.note=String(index+1);
    paths.append(path);
    const dot=document.createElementNS(namespace,'circle');dot.setAttribute('cx',endX);dot.setAttribute('cy',endY);dot.setAttribute('r','4');paths.append(dot);
  });
  count.textContent=`${String(current+1).padStart(2,'0')} / 08`;
}
function choose(index,jump=true){
  current=(index+notes.length)%notes.length;
  layout();
  if(jump&&ready){
    const target=targetFor(notes[current]);
    if(target){
      const targetTop=scrollY+frame.getBoundingClientRect().top+target.getBoundingClientRect().top;
      const noteTop=compact.matches?targetTop:scrollY+notes[current].getBoundingClientRect().top;
      const top=Math.min(targetTop,noteTop)-document.querySelector('.review-toolbar').offsetHeight-28;
      window.scrollTo({top:Math.max(0,top),behavior:reducedMotion.matches?'auto':'smooth'});
    }
  }
  layout();
}
notes.forEach((note,index)=>{
  note.addEventListener('click',()=>choose(index));
  const highlight=on=>{
    if(!ready)return;
    const target=frame.contentDocument.querySelector(note.dataset.target);
    target?.classList.toggle('review-highlight',on);
  };
  note.addEventListener('mouseenter',()=>highlight(true));note.addEventListener('mouseleave',()=>highlight(false));
  note.addEventListener('focus',()=>highlight(true));note.addEventListener('blur',()=>highlight(false));
});
document.getElementById('previous-note').addEventListener('click',()=>choose(current-1));
document.getElementById('next-note').addEventListener('click',()=>choose(current+1));
toggle.addEventListener('click',()=>{const hidden=document.body.classList.toggle('notes-hidden');toggle.setAttribute('aria-pressed',String(hidden));toggle.textContent=hidden?'Show notes':'Hide notes';});
frame.addEventListener('load',async()=>{
  const doc=frame.contentDocument;if(!doc?.body)return;
  const style=doc.createElement('style');
  style.textContent='.review-highlight{outline:3px solid #e14b26;outline-offset:-3px}.mobile-actions{display:none!important}.gallery-dialog{top:var(--review-scroll-top,40px);bottom:auto;max-height:calc(var(--review-viewport-height,850px) - 90px);margin:0 auto}.gallery-enlarged{max-height:calc(var(--review-viewport-height,850px) - 230px)}';
  doc.head.append(style);
  doc.addEventListener('click',event=>{
    const link=event.target.closest('a');if(!link)return;
    const raw=link.getAttribute('href');
    if(raw?.startsWith('#')){
      const target=doc.getElementById(raw.slice(1));if(!target)return;
      event.preventDefault();window.scrollTo({top:scrollY+frame.getBoundingClientRect().top+target.getBoundingClientRect().top-document.querySelector('.review-toolbar').offsetHeight-20,behavior:reducedMotion.matches?'auto':'smooth'});
    }else if(/^https?:/.test(link.href)&&new URL(link.href).origin!==location.origin){link.target='_blank';link.rel='noopener noreferrer';}
  },true);
  await doc.fonts.ready;
  ready=true;
  new ResizeObserver(schedule).observe(doc.body);
  doc.querySelectorAll('img').forEach(image=>{image.addEventListener('load',schedule);image.addEventListener('error',schedule);});
  const viewport=()=>{doc.documentElement.style.setProperty('--review-viewport-height',`${innerHeight}px`);doc.documentElement.style.setProperty('--review-scroll-top',`${Math.max(40,-frame.getBoundingClientRect().top+45)}px`);};
  window.addEventListener('scroll',viewport,{passive:true});viewport();
  layout();document.body.dataset.ready='true';
});
window.addEventListener('resize',schedule);window.addEventListener('scroll',()=>{if(compact.matches)schedule();},{passive:true});compact.addEventListener('change',schedule);
