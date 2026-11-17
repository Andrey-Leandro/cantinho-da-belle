/* Meu Cantinho 2.0 — código-fonte TypeScript. Compile com `tsc` no diretório do projeto. */
type Category = 'pessoal'|'ideias'|'trabalho'|'outros';
type AppScreen = 'home'|'notes'|'tasks'|'settings';
type Theme = 'rosa'|'bege'|'lilas'|'azul'|'verde'|'pessego';
type Paper = 'white'|'rosa'|'quadrinhos'|'lilas'|'nuvens'|'coracoes'|'bege';
interface Note {id:string;title:string;content:string;category:Category;pinned:boolean;createdAt:number;updatedAt:number}
interface Task {id:string;title:string;category:Category;due:string;done:boolean;createdAt:number;updatedAt:number}
interface AppData {version:1;notes:Note[];tasks:Task[];settings:{name:string;lastBackup:number|null}}
interface Wall {kind:'preset'|'image';value:string}
interface Extras {theme:Theme;backgrounds:Record<string,Wall>;avatar:string}
interface PromptEvent extends Event {prompt():Promise<void>}
(() => {
'use strict';
const KEY='meu-cantinho-dados-v1'; // Mesma chave da versão 1.0: não alterar.
const EXTRA_KEY='meu-cantinho-extras-v2';
const SNAPSHOT_KEY='meu-cantinho-snapshot-antes-v2';
const DRAFT_KEY='meu-cantinho-rascunho-v2';
const cats:Record<Category,string>={pessoal:'Pessoal',ideias:'Ideias',trabalho:'Trabalho',outros:'Outros'};
const themes:Record<Theme,{label:string;bg:string;accent:string}>={
 rosa:{label:'Rosa',bg:'#fbe3e8',accent:'#d7829a'},bege:{label:'Bege',bg:'#f5e6d5',accent:'#c39c7d'},
 lilas:{label:'Lilás',bg:'#eee2f8',accent:'#a58cc9'},azul:{label:'Azul',bg:'#dceefa',accent:'#82b4d2'},
 verde:{label:'Verde',bg:'#e1efdf',accent:'#9ebba2'},pessego:{label:'Pêssego',bg:'#f9e3d7',accent:'#d9a08e'}
};
const papers:Record<Paper,string>={white:'Simples',rosa:'Poás rosa',quadrinhos:'Quadriculado',lilas:'Lavanda',nuvens:'Nuvens',coracoes:'Corações',bege:'Baunilha'};
const icons:Record<string,string>={
 home:'<path d="m3 10 9-7 9 7v10H4V10z"/><path d="M9 21v-7h6v7"/>',
 book:'<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1zM12 6v14"/>',
 check:'<rect x="3" y="3" width="18" height="18" rx="4"/><path d="m7 12 3.4 3.5L17.5 8"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.5 1.5m11.2 11.2 1.5 1.5M19.1 4.9l-1.5 1.5M6.4 17.6l-1.5 1.5"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 edit:'<path d="m16 5 3 3M4 20l4.5-.8L20 7.7 16.3 4 4.8 15.5 4 20z"/>',
 arrow:'<path d="m14 5-7 7 7 7M7 12h14"/>',close:'<path d="m5 5 14 14M19 5 5 19"/>',
 pin:'<path d="m16 3 5 5-3 1-3 5v4l-2 1-3-6-4-3 1-2h4l4-3zM10 14 3 21"/>',
 trash:'<path d="M4 7h16M9 4h6M6 7l1 14h10l1-14M10 11v6M14 11v6"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="2"/><path d="m3 16 5-5 4 4 3-3 6 6"/>',
 music:'<path d="M9 18V5l12-2v12M9 7l12-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="18" cy="15" rx="3" ry="2"/>',
 play:'<path d="m9 5 11 7-11 7z"/>',download:'<path d="M12 3v13m-4-4 4 4 4-4M4 18v3h16v-3"/>',
 upload:'<path d="M12 16V3m-4 4 4-4 4 4M4 18v3h16v-3"/>',tag:'<path d="M3 3h9l9 9-9 9-9-9V3z"/><circle cx="8" cy="8" r="1.5"/>',
 tick:'<path d="m5 12 5 5L19 7"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>'
};
const $=<T extends HTMLElement=HTMLElement>(id:string):T=>{const e=document.getElementById(id);if(!e)throw new Error('Elemento ausente: '+id);return e as T};
const el=<K extends keyof HTMLElementTagNameMap>(tag:K,cl?:string,txt?:string):HTMLElementTagNameMap[K]=>{const e=document.createElement(tag);if(cl)e.className=cl;if(txt!==undefined)e.textContent=txt;return e};
const svg=(name:string)=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.book}</svg>`;
document.querySelectorAll<HTMLElement>('[data-icon]').forEach(e=>e.innerHTML=svg(e.dataset.icon||'book'));
const validCategory=(x:unknown):x is Category=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(cats,x);
const validTheme=(x:unknown):x is Theme=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(themes,x);
const validPaper=(x:unknown):x is Paper=>typeof x==='string'&&Object.prototype.hasOwnProperty.call(papers,x);
const safeText=(x:unknown,max:number):string=>typeof x==='string'?x.slice(0,max):'';
const safeDate=(x:unknown):number=>typeof x==='number'&&Number.isFinite(x)&&x>0&&x<4102444800000?x:Date.now();
const uid=():string=>typeof crypto!=='undefined'&&typeof crypto.randomUUID==='function'?crypto.randomUUID():`mc_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const emptyData=():AppData=>({version:1,notes:[],tasks:[],settings:{name:'',lastBackup:null}});
const emptyExtras=():Extras=>({theme:'rosa',backgrounds:{},avatar:''});
function parseData(raw:unknown):AppData {
 if(!raw||typeof raw!=='object')throw Error('Dados incompatíveis');
 const d=raw as Record<string,unknown>;
 if(d.version!==1||!Array.isArray(d.notes)||!Array.isArray(d.tasks)||d.notes.length>5000||d.tasks.length>10000)throw Error('Dados incompatíveis');
 const ids=new Set<string>();
 function uniqueId(x:unknown):string{let id=typeof x==='string'&&/^[a-zA-Z0-9_-]{5,100}$/.test(x)?x:uid();if(ids.has(id))id=uid();ids.add(id);return id;}
 const notes:Note[]=d.notes.filter(x=>x&&typeof x==='object').map(x=>{const n=x as Record<string,unknown>;return {id:uniqueId(n.id),title:safeText(n.title,130),content:safeText(n.content,60000),category:validCategory(n.category)?n.category:'pessoal',pinned:n.pinned===true,createdAt:safeDate(n.createdAt),updatedAt:safeDate(n.updatedAt)}});
 const tasks:Task[]=d.tasks.filter(x=>x&&typeof x==='object').map(x=>{const t=x as Record<string,unknown>;const due=safeText(t.due,10);return {id:uniqueId(t.id),title:safeText(t.title,180),category:validCategory(t.category)?t.category:'pessoal',due:/^\d{4}-\d{2}-\d{2}$/.test(due)?due:'',done:t.done===true,createdAt:safeDate(t.createdAt),updatedAt:safeDate(t.updatedAt)}});
 const s=d.settings&&typeof d.settings==='object'?d.settings as Record<string,unknown>:{};
 return {version:1,notes,tasks,settings:{name:safeText(s.name,32),lastBackup:typeof s.lastBackup==='number'?safeDate(s.lastBackup):null}};
}
function parseExtras(x:unknown):Extras {
 const e=x&&typeof x==='object'?x as Record<string,unknown>:{};
 const backgrounds:Record<string,Wall>={};
 if(e.backgrounds&&typeof e.backgrounds==='object')for(const [id,w] of Object.entries(e.backgrounds as Record<string,unknown>)){
  if(!/^[a-zA-Z0-9_-]{5,100}$/.test(id)||!w||typeof w!=='object')continue;
  const a=w as Record<string,unknown>;
  if(a.kind==='preset'&&validPaper(a.value))backgrounds[id]={kind:'preset',value:a.value};
  else if(a.kind==='image'&&typeof a.value==='string'&&/^[a-zA-Z0-9_-]{5,100}$/.test(a.value))backgrounds[id]={kind:'image',value:a.value};
 }
 return {theme:validTheme(e.theme)?e.theme:'rosa',backgrounds,avatar:typeof e.avatar==='string'&&/^[a-zA-Z0-9_-]{5,100}$/.test(e.avatar)?e.avatar:''};
}
let data:AppData=emptyData();let extras:Extras=emptyExtras();let rawV1:string|null=null;let storageOK=true;let initialDraft:string|null=null;
try {rawV1=localStorage.getItem(KEY);data=rawV1?parseData(JSON.parse(rawV1)):emptyData();}catch(e){storageOK=false;console.error('Não sobrescrever dados existentes:',e);}
try {const raw=localStorage.getItem(EXTRA_KEY);if(raw)extras=parseExtras(JSON.parse(raw));initialDraft=localStorage.getItem(DRAFT_KEY);}catch(e){console.warn('Preferências v2 não carregadas:',e);}
// Copia exatamente o JSON da versão 1.0 antes de qualquer alteração; não apaga a chave original.
if(storageOK&&rawV1){try{if(!localStorage.getItem(SNAPSHOT_KEY))localStorage.setItem(SNAPSHOT_KEY,rawV1);}catch(e){console.warn('Não foi possível criar cópia local:',e);}}
let current:AppScreen='home';let noteFilter='all';let taskFilter='all';let activeNote:string|null=null;let editingNote:string|null=null;let taskId:string|null=null;let editFromRead=false;let timer:number|undefined;let toastTimer:number|undefined;let confirmAction:(()=>void)|null=null;let awaitingBackground=false;
let dbPromise:Promise<IDBDatabase>|null=null;
const objectUrls=new Map<string,string>();
function db():Promise<IDBDatabase>{if(!('indexedDB' in window))return Promise.reject(new Error('Armazenamento de imagens indisponível'));
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('meu-cantinho-imagens-v2',1);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('files'))request.result.createObjectStore('files');};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});return dbPromise;}
async function putImage(id:string,blob:Blob):Promise<void>{const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(blob,id);tx.oncomplete=()=>{const old=objectUrls.get(id);if(old)URL.revokeObjectURL(old);objectUrls.delete(id);resolve();};tx.onerror=()=>reject(tx.error);});}
async function getImage(id:string):Promise<Blob|null>{const d=await db();return new Promise((resolve,reject)=>{const request=d.transaction('files','readonly').objectStore('files').get(id);request.onsuccess=()=>resolve(request.result instanceof Blob?request.result:null);request.onerror=()=>reject(request.error);});}
async function imageURL(id:string):Promise<string>{if(objectUrls.has(id))return objectUrls.get(id)!;const blob=await getImage(id);if(!blob)return '';const url=URL.createObjectURL(blob);objectUrls.set(id,url);return url;}
function saveMain():boolean{if(!storageOK)return false;try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch(e){toast('Sem espaço para salvar. Faça um backup.');console.error(e);return false;}}
function saveExtra():boolean{try{localStorage.setItem(EXTRA_KEY,JSON.stringify(extras));return true;}catch(e){toast('Sem espaço para personalização.');console.error(e);return false;}}
function toast(msg:string):void {const n=$('toast');n.textContent=msg;n.hidden=false;if(toastTimer)clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>n.hidden=true,3600);}
const short=(d:number)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(d)).replace('.','');
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const sortNotes=()=>[...data.notes].sort((a,b)=>Number(b.pinned)-Number(a.pinned)||b.updatedAt-a.updatedAt);
const sortTasks=()=>[...data.tasks].sort((a,b)=>Number(a.done)-Number(b.done)||(a.due||'9999').localeCompare(b.due||'9999')||b.createdAt-a.createdAt);
function setPaper(node:HTMLElement,noteId:string):void {
 const wall=extras.backgrounds[noteId];node.classList.remove(...['paper-white',...Object.keys(papers).filter(k=>k!=='white').map(k=>'paper-'+k),'paper-image']);node.style.backgroundImage='';
 if(!wall){node.classList.add('paper-white');return;}
 if(wall.kind==='preset'){node.classList.add('paper-'+(validPaper(wall.value)?wall.value:'white'));return;}
 node.classList.add('paper-image');const captured=wall.value;
 void imageURL(captured).then(url=>{if(url&&node.isConnected&&extras.backgrounds[noteId]?.value===captured){node.style.backgroundImage=`linear-gradient(0deg,rgba(255,250,247,.78),rgba(255,250,247,.78)),url("${url}")`;}}).catch(()=>{});
}
async function paintProfile():Promise<void>{let url='./assets/perfil.webp';if(extras.avatar){try{url=await imageURL(extras.avatar)||url;}catch{}}for(const id of ['avatar-settings','avatar-header'])$(id).setAttribute('src',url);}
function applyTheme():void{document.body.dataset.theme=extras.theme;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',themes[extras.theme].bg);renderThemeGrid();}
function renderThemeGrid():void{const node=$('theme-grid');node.replaceChildren();for(const [id,t]of Object.entries(themes) as [Theme,typeof themes[Theme]][]){const b=el('button','theme-choice'+(extras.theme===id?' active':''));b.type='button';b.setAttribute('aria-label','Tema '+t.label);b.setAttribute('aria-pressed',String(extras.theme===id));const s=el('span','theme-swatch');s.style.setProperty('--swatch',t.bg);s.style.setProperty('--swatch-accent',t.accent);b.append(s,el('span',undefined,t.label));b.addEventListener('click',()=>{extras.theme=id;if(saveExtra()){applyTheme();toast('Tema atualizado ♡');}});node.append(b);}}
function go(screen:AppScreen):void{current=screen;for(const s of ['home','notes','tasks','settings'] as AppScreen[])$('screen-'+s).hidden=screen!==s;document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b=>{if(b.dataset.nav===screen)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});window.scrollTo(0,0);renderScreen(screen);}
function renderScreen(screen:AppScreen):void{if(screen==='home')renderHome();else if(screen==='notes')renderNotes();else if(screen==='tasks')renderTasks();else renderSettings();}
function renderHome():void{
 $('display-name').textContent=data.settings.name.trim()||'meu bem';
 const hr=new Date().getHours();$('greeting-time').textContent=hr<12?'BOM DIA ♡':hr<18?'BOA TARDE ♡':'BOA NOITE ♡';
 $('home-note-counter').textContent=`${data.notes.length} ${data.notes.length===1?'nota':'notas'}`;
 const p=data.tasks.filter(x=>!x.done).length;$('home-task-counter').textContent=`${p} ${p===1?'pendente':'pendentes'}`;
 const box=$('recent-notes');box.replaceChildren();const list=sortNotes().slice(0,3);
 if(!list.length){box.append(el('div','empty-small','Suas anotações vão aparecer aqui ♡'));return;}
 for(const n of list){const b=el('button','recent-button');b.type='button';const thumb=el('span','recent-thumb');setPaper(thumb,n.id);const text=el('span','recent-details');text.append(el('strong',undefined,n.title||'Nota sem título'),el('small',undefined,short(n.updatedAt)));b.append(thumb,text,el('span','recent-arrow','›'));b.addEventListener('click',()=>openRead(n.id));box.append(b);}
}
function chip(txt:string,active:boolean,callback:()=>void):HTMLButtonElement{const b=el('button','chip'+(active?' active':''),txt);b.type='button';b.setAttribute('aria-pressed',String(active));b.addEventListener('click',callback);return b;}
function renderNotes():void{
 const f=$('notes-filters');f.replaceChildren();for(const [id,label] of [['all','Todas'],['pinned','Fixadas'],['pessoal','Pessoal'],['ideias','Ideias'],['trabalho','Trabalho'],['outros','Outros']])f.append(chip(label,noteFilter===id,()=>{noteFilter=id;renderNotes();}));
 const q=$<HTMLInputElement>('note-search').value.trim().toLocaleLowerCase('pt-BR');const matching=sortNotes().filter(n=>(noteFilter==='all'||(noteFilter==='pinned'?n.pinned:n.category===noteFilter))&&(!q||`${n.title} ${n.content} ${cats[n.category]}`.toLocaleLowerCase('pt-BR').includes(q)));
 const box=$('notes-list');box.replaceChildren();if(!matching.length){const div=el('div','no-results');div.append(el('span',undefined,'♡'),el('h3',undefined,q?'Nada encontrado':'Seu cantinho está tranquilo'),el('p',undefined,q?'Tente outra palavra.':'Toque no + para criar uma nota.'));box.append(div);return;}
 for(const n of matching){const row=el('div','note-row');const button=el('button','note-open');button.type='button';button.setAttribute('aria-label','Ler nota '+(n.title||'sem título'));
 const thumb=el('span','note-thumb');setPaper(thumb,n.id);const info=el('span','note-info');info.append(el('strong',undefined,n.title||'Nota sem título'),el('span','preview',n.content.replace(/\s+/g,' ').trim()||'Sem texto'),el('span','date',`${n.pinned?'⌁ Fixada · ':''}${short(n.updatedAt)}`));button.append(thumb,info);
 let hold:number|undefined;let longOpened=false;const cancel=()=>{if(hold){clearTimeout(hold);hold=undefined;}};
 button.addEventListener('pointerdown',event=>{if(event.pointerType==='mouse'&&event.button!==0)return;cancel();longOpened=false;hold=window.setTimeout(()=>{longOpened=true;openEdit(n.id,false);},650);});for(const evt of ['pointerup','pointercancel','pointerleave','contextmenu'])button.addEventListener(evt,cancel);button.addEventListener('contextmenu',e=>e.preventDefault());
 button.addEventListener('click',e=>{if(longOpened){e.preventDefault();longOpened=false;return;}openRead(n.id);});
 const pin=el('button','note-pin'+(n.pinned?' active':''),n.pinned?'♥':'♡');pin.type='button';pin.setAttribute('aria-label',n.pinned?'Desafixar nota':'Fixar nota');pin.addEventListener('click',()=>{n.pinned=!n.pinned;n.updatedAt=Date.now();if(saveMain()){renderNotes();renderHome();}});row.append(button,pin);box.append(row);}
}
function renderTasks():void{
 const filters=$('tasks-filters');filters.replaceChildren();for(const [id,txt] of [['all','Todas'],['pending','Pendentes'],['done','Concluídas']])filters.append(chip(txt,taskFilter===id,()=>{taskFilter=id;renderTasks();}));
 const list=sortTasks().filter(t=>taskFilter==='all'||(taskFilter==='pending'?!t.done:t.done));const node=$('tasks-list');node.replaceChildren();if(!list.length){const box=el('div','no-results');box.append(el('span',undefined,'♡'),el('h3',undefined,'Sem tarefas por aqui'),el('p',undefined,'Adicione o que precisa fazer, sem pressa.'));node.append(box);return;}
 for(const t of list){const row=el('div','task-row'+(t.done?' completed':''));const check=el('button','task-check'+(t.done?' checked':''));check.type='button';check.setAttribute('role','checkbox');check.setAttribute('aria-label',(t.done?'Desmarcar':'Concluir')+' tarefa '+t.title);check.setAttribute('aria-checked',String(t.done));if(t.done)check.innerHTML=svg('tick');check.addEventListener('click',()=>{t.done=!t.done;t.updatedAt=Date.now();if(saveMain()){renderTasks();renderHome();}});
 const label=el('button','task-label');label.type='button';label.append(el('strong',undefined,t.title),el('small',undefined,(t.due?t.due.split('-').reverse().join('/')+' · ':'')+cats[t.category]));label.addEventListener('click',()=>openTask(t.id));const more=el('button','task-more');more.type='button';more.innerHTML=svg('more');more.setAttribute('aria-label','Editar tarefa');more.addEventListener('click',()=>openTask(t.id));row.append(check,label,more);node.append(row);}
}
function renderSettings():void{const name=$<HTMLInputElement>('settings-name');if(document.activeElement!==name)name.value=data.settings.name;const dt=data.settings.lastBackup;$('last-backup').textContent=dt?'Último backup: '+new Date(dt).toLocaleDateString('pt-BR')+' · As notas ficam neste aparelho.':'As notas ficam neste aparelho. Faça backups de tempos em tempos.';}
function renderAll():void{renderHome();renderNotes();renderTasks();renderSettings();}
function fullVisible(id:'read-screen'|'editor-screen'):void {$(id).hidden=false;document.body.classList.add('modal-open');setViewport();}
function setViewport():void {const vv=window.visualViewport;document.documentElement.style.setProperty('--visible-height',`${vv?.height||window.innerHeight}px`);document.documentElement.style.setProperty('--visible-top',`${vv?.offsetTop||0}px`);}
window.visualViewport?.addEventListener('resize',setViewport);window.visualViewport?.addEventListener('scroll',setViewport);window.addEventListener('resize',setViewport);
function closeRead():void{$('read-screen').hidden=true;activeNote=null;document.body.classList.remove('modal-open');go('notes');}
function openRead(id:string):void{
 const n=data.notes.find(v=>v.id===id);if(!n)return;activeNote=id;editingNote=null;
 $('editor-screen').hidden=true;$('read-title').textContent=n.title||'Nota sem título';$('read-content').textContent=n.content||'Esta nota ainda não tem texto.';$('read-category').textContent=cats[n.category];$('read-date').textContent='Atualizada em '+short(n.updatedAt);
 setPaper($('read-paper'),id);fullVisible('read-screen');minimizeMusic();
}
function recoverDraft():void{try {const text=initialDraft;if(!text||!$('editor-screen').hidden)return;const d=JSON.parse(text) as Record<string,unknown>;
 if(typeof d.timestamp!=='number'||Date.now()-d.timestamp>7*86400_000||typeof d.title!=='string'||typeof d.content!=='string'){localStorage.removeItem(DRAFT_KEY);return;}
 const note=typeof d.id==='string'?data.notes.find(n=>n.id===d.id):undefined;if(note&&note.updatedAt>=d.timestamp){localStorage.removeItem(DRAFT_KEY);return;}
 if(!d.title.trim()&&!d.content.trim()){localStorage.removeItem(DRAFT_KEY);return;}
 confirmBox('Rascunho encontrado ♡','Você tinha uma nota em andamento. Deseja continuar de onde parou?','Recuperar',()=>{openEdit(note?.id||null,false);$<HTMLInputElement>('editor-title').value=String(d.title).slice(0,130);$<HTMLTextAreaElement>('editor-content').value=String(d.content).slice(0,60000);persistNote();});
 }catch(e){console.warn('Rascunho inválido:',e);}}
function saveDraft():void{if(!storageOK)return;try{localStorage.setItem(DRAFT_KEY,JSON.stringify({id:editingNote,title:$<HTMLInputElement>('editor-title').value,content:$<HTMLTextAreaElement>('editor-content').value,timestamp:Date.now()}));}catch{}}
function persistNote():void {
 if(!storageOK)return;
 const title=$<HTMLInputElement>('editor-title').value.slice(0,130);
 const content=$<HTMLTextAreaElement>('editor-content').value.slice(0,60000);
 const cat=$<HTMLSelectElement>('editor-category').value;
 const pin=$<HTMLButtonElement>('editor-pin').getAttribute('aria-pressed')==='true';
 let n=editingNote?data.notes.find(v=>v.id===editingNote):undefined;
 if(!n&&!title.trim()&&!content.trim())return;
 if(!n){n={id:uid(),title,content,category:validCategory(cat)?cat:'pessoal',pinned:pin,createdAt:Date.now(),updatedAt:Date.now()};data.notes.unshift(n);editingNote=n.id;$('editor-delete').hidden=false;}
 else {n.title=title;n.content=content;n.category=validCategory(cat)?cat:'pessoal';n.pinned=pin;n.updatedAt=Date.now();}
 if(saveMain()){try{localStorage.removeItem(DRAFT_KEY);}catch{}$('save-status').textContent='✓ Salvo';renderHome();renderNotes();}
 else $('save-status').textContent='Não salvo';
}
function scheduleNote():void{$('save-status').textContent='Salvando...';saveDraft();if(timer)clearTimeout(timer);timer=window.setTimeout(()=>{timer=undefined;persistNote();},180);}
function flushNote():void{if(timer){clearTimeout(timer);timer=undefined;}if(!$('editor-screen').hidden)persistNote();}
function openEdit(id:string|null,fromRead:boolean):void{
 const n=id?data.notes.find(v=>v.id===id):undefined;editingNote=n?.id||null;editFromRead=fromRead;
 $<HTMLInputElement>('editor-title').value=n?.title||'';$<HTMLTextAreaElement>('editor-content').value=n?.content||'';
 $<HTMLSelectElement>('editor-category').value=n?.category||'pessoal';
 $<HTMLButtonElement>('editor-pin').setAttribute('aria-pressed',String(!!n?.pinned));$('editor-pin').classList.toggle('active',!!n?.pinned);
 $('editor-heading').textContent=n?'Editar nota ♡':'Nova nota ♡';$('save-status').textContent=n?'✓ Salvo':'♡ Nova';$('editor-delete').hidden=!n;
 if(n)setPaper($('editor-paper'),n.id);else{const p=$('editor-paper');p.className='editor-paper';p.style.backgroundImage='';}
 $('read-screen').hidden=true;fullVisible('editor-screen');minimizeMusic();$('music-reopen').hidden=true;
 // Nota existente não exibe teclado automaticamente: ela escolhe onde começar.
 if(!n){window.setTimeout(()=>$<HTMLInputElement>('editor-title').focus(),100);}
}
function finishEdit():void{flushNote();$('editor-screen').hidden=true;document.body.classList.remove('modal-open');const id=editingNote;editingNote=null;$('music-reopen').hidden=!musicActive||!$('music-panel').classList.contains('minimized');
 if(id&&editFromRead){openRead(id);}else{go('notes');if(id)toast('Nota guardadinha ♡');}}
function deleteNote():void{const id=editingNote;if(!id)return;confirmBox('Excluir esta nota?','Ela será apagada deste aparelho. Faça um backup se quiser guardá-la.','Excluir',()=>{
 data.notes=data.notes.filter(n=>n.id!==id);if(saveMain()){delete extras.backgrounds[id];saveExtra();$('editor-screen').hidden=true;$('read-screen').hidden=true;editingNote=null;activeNote=null;document.body.classList.remove('modal-open');renderAll();go('notes');toast('Nota excluída.');}
 });}
function openTask(id?:string):void{const t=id?data.tasks.find(v=>v.id===id):undefined;taskId=t?.id||null;$('task-dialog-title').textContent=t?'Editar tarefa ♡':'Nova tarefa ♡';$<HTMLInputElement>('task-title').value=t?.title||'';$<HTMLInputElement>('task-date').value=t?.due||'';$<HTMLSelectElement>('task-category').value=t?.category||'pessoal';$('task-delete').hidden=!t;$('task-dialog').hidden=false;document.body.classList.add('modal-open');}
function closeTask():void{$('task-dialog').hidden=true;taskId=null;document.body.classList.remove('modal-open');}
function addTask(title:string,due='',category:Category='pessoal'):boolean{const clean=title.trim();if(!clean)return false;data.tasks.unshift({id:uid(),title:clean.slice(0,180),due,category,done:false,createdAt:Date.now(),updatedAt:Date.now()});if(saveMain()){renderTasks();renderHome();return true;}return false;}
function storeTask():void{const title=$<HTMLInputElement>('task-title').value.trim();const due=$<HTMLInputElement>('task-date').value;const cat=$<HTMLSelectElement>('task-category').value;if(!title){toast('Escreva o título da tarefa.');return;}if(taskId){const t=data.tasks.find(v=>v.id===taskId);if(t){t.title=title.slice(0,180);t.due=due;t.category=validCategory(cat)?cat:'pessoal';t.updatedAt=Date.now();if(saveMain()){renderTasks();renderHome();}}}else addTask(title,due,validCategory(cat)?cat:'pessoal');closeTask();}
function deleteTask():void{const id=taskId;if(!id)return;confirmBox('Excluir tarefa?','Ela será removida da lista.','Excluir',()=>{data.tasks=data.tasks.filter(t=>t.id!==id);if(saveMain()){renderHome();renderTasks();closeTask();toast('Tarefa excluída.');}});}
function confirmBox(title:string,desc:string,button:string,callback:()=>void):void {$('confirm-title').textContent=title;$('confirm-desc').textContent=desc;$('confirm-ok').textContent=button;confirmAction=callback;$('confirm-dialog').hidden=false;}
function dismissConfirm():void{$('confirm-dialog').hidden=true;confirmAction=null;}
function closeBackground():void{$('background-dialog').hidden=true;awaitingBackground=false;}
function openBackground(fromRead:boolean):void {
 // Se for uma nota recém-criada, exige conteúdo para manter um ID estável.
 if(!fromRead){flushNote();if(!editingNote){toast('Escreva algo na nota antes de escolher o fundo.');return;}}
 if(fromRead&&!activeNote)return;awaitingBackground=fromRead;
 const id=fromRead?activeNote:editingNote;if(!id)return;
 const wall=extras.backgrounds[id];const chosen=wall?.kind==='preset'?wall.value:'white';const box=$('background-options');box.replaceChildren();
 for(const [pid,label] of Object.entries(papers) as [Paper,string][]){const btn=el('button','background-option'+(chosen===pid?' active':''));btn.type='button';const sw=el('span','background-option-swatch paper-'+pid);btn.append(sw,el('span',undefined,label));btn.addEventListener('click',()=>{extras.backgrounds[id]={kind:'preset',value:pid};if(saveExtra()){updateWallpaper(id);closeBackground();toast('Fundo atualizado ♡');}});box.append(btn);}
 $('background-dialog').hidden=false;
}
function updateWallpaper(id:string):void{if(activeNote===id)setPaper($('read-paper'),id);if(editingNote===id)setPaper($('editor-paper'),id);renderNotes();renderHome();}
async function compressImage(file:File,maxSide:number):Promise<Blob>{if(file.size>18*1024*1024)throw Error('Imagem acima de 18 MB. Escolha outra.');if(!file.type.startsWith('image/'))throw Error('Arquivo não é uma imagem.');
 const bitmap=await createImageBitmap(file);const ratio=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));const ctx=canvas.getContext('2d');if(!ctx)throw Error('Falha no tratamento da imagem.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',0.72));if(!blob)throw Error('Não foi possível processar a imagem.');return blob;}
async function changeBackground(file:File):Promise<void>{const id=awaitingBackground?activeNote:editingNote;if(!id)return;try{const blob=await compressImage(file,900);const assetId='note_'+uid().replace(/-/g,'_');await putImage(assetId,blob);extras.backgrounds[id]={kind:'image',value:assetId};if(saveExtra()){updateWallpaper(id);closeBackground();toast('Foto aplicada na nota ♡');}}catch(e){toast(e instanceof Error?e.message:'Não foi possível adicionar a imagem.');}}
async function changeAvatar(file:File):Promise<void>{try{const blob=await compressImage(file,480);const assetId='perfil_v2';await putImage(assetId,blob);extras.avatar=assetId;if(saveExtra()){await paintProfile();toast('Foto atualizada ♡');}}catch(e){toast(e instanceof Error?e.message:'Não foi possível trocar a foto.');}}
function downloadFile(text:string,fileName:string,mime='application/json;charset=utf-8'):void{const u=URL.createObjectURL(new Blob([text],{type:mime}));const a=el('a');a.href=u;a.download=fileName;document.body.append(a);a.click();a.remove();window.setTimeout(()=>URL.revokeObjectURL(u),10000);}
function blobDataURL(blob:Blob):Promise<string>{return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(Error('Não foi possível ler imagem'));r.readAsDataURL(blob);});}
async function exportBackup():Promise<void>{const media:Record<string,string>={};const ids=new Set<string>();if(extras.avatar)ids.add(extras.avatar);for(const bg of Object.values(extras.backgrounds))if(bg.kind==='image')ids.add(bg.value);
 try{for(const id of ids){const img=await getImage(id);if(img)media[id]=await blobDataURL(img);}}catch(e){toast('Imagens não foram lidas. Confira o backup.');console.warn(e);return;}
 const stamp=new Date();const backup={app:'Meu Cantinho',format:'meu-cantinho-backup',exportedAt:stamp.toISOString(),version:1,notes:data.notes,tasks:data.tasks,settings:{...data.settings,lastBackup:stamp.getTime()},extras,media};
 downloadFile(JSON.stringify(backup,null,2),`meu-cantinho-backup-${today()}.json`);data.settings.lastBackup=stamp.getTime();saveMain();renderSettings();toast('Backup pronto para salvar ♡');}
function dataUrlBlob(value:string):Blob{const match=/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(value);if(!match)throw Error('Imagem inválida no backup.');const bytes=atob(match[2]);if(bytes.length>3*1024*1024)throw Error('Imagem muito grande no backup.');const array=new Uint8Array(bytes.length);for(let i=0;i<bytes.length;i++)array[i]=bytes.charCodeAt(i);return new Blob([array],{type:match[1]});}
async function importBackup(file:File):Promise<void>{if(file.size>40*1024*1024){toast('Backup acima de 40 MB.');return;}try{const backup=JSON.parse(await file.text()) as Record<string,unknown>;
 if(backup.format!=='meu-cantinho-backup')throw Error('Este arquivo não é um backup do Meu Cantinho.');const parsed=parseData(backup);const extra=backup.extras?parseExtras(backup.extras):emptyExtras();const media=backup.media&&typeof backup.media==='object'?backup.media as Record<string,unknown>:{};
 confirmBox('Restaurar este backup?','Isso substituirá suas notas atuais. Recomendamos baixar um backup antes de continuar.','Restaurar',()=>{void (async()=>{try{
   for(const [id,value] of Object.entries(media)){if(!/^[a-zA-Z0-9_-]{5,100}$/.test(id)||typeof value!=='string')continue;await putImage(id,dataUrlBlob(value));}
   const previous=data,previousExtras=extras;data=parsed;extras=extra;
   if(!saveMain()||!saveExtra()){data=previous;extras=previousExtras;saveMain();saveExtra();throw Error('Não foi possível gravar o backup.');}
   applyTheme();await paintProfile();renderAll();go('home');toast('Backup restaurado ♡');
  }catch(e){toast(e instanceof Error?e.message:'Falha ao restaurar.');}})();});
 }catch(e){toast(e instanceof Error?e.message:'Não foi possível abrir o arquivo.');}}
function downloadOriginal():void{
 try{
  const original=localStorage.getItem(SNAPSHOT_KEY)||localStorage.getItem(KEY);
  if(!original){toast('Nenhuma cópia anterior disponível.');return;}
  const old=parseData(JSON.parse(original));
  const archive={...old,app:'Meu Cantinho',format:'meu-cantinho-backup',exportedAt:new Date().toISOString()};
  downloadFile(JSON.stringify(archive,null,2),`meu-cantinho-copia-da-v1-${today()}.json`);
  toast('Cópia restaurável exportada ♡');
 }catch{toast('Não foi possível exportar a cópia.');}
}
let musicActive=false;
function musicOpen():void{
 const panel=$('music-panel');panel.hidden=false;panel.classList.remove('minimized');$('music-reopen').hidden=true;
 if(!musicActive){const frame=document.createElement('iframe');frame.title='Lo-fi escolhido para o Meu Cantinho';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';frame.src='https://www.youtube-nocookie.com/embed/PlgncUNp-80?autoplay=1&loop=1&playlist=PlgncUNp-80&playsinline=1&rel=0';frame.loading='eager';$('youtube-frame').replaceChildren(frame);musicActive=true;}
}
function minimizeMusic():void{if(!musicActive)return;$('music-panel').classList.add('minimized');$('music-reopen').hidden=!$('editor-screen').hidden;}
function musicStop():void{$('youtube-frame').replaceChildren();musicActive=false;$('music-panel').hidden=true;$('music-panel').classList.remove('minimized');$('music-reopen').hidden=true;}
function restoreMusicPanel():void{if(!musicActive)return;$('music-panel').hidden=false;$('music-panel').classList.remove('minimized');$('music-reopen').hidden=true;}
function bind():void{
 document.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.nav as AppScreen)));
 document.querySelectorAll<HTMLButtonElement>('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go as AppScreen)));
 $('header-avatar').addEventListener('click',()=>go('settings'));
 $('notes-add').addEventListener('click',()=>openEdit(null,false));
 $('note-search').addEventListener('input',renderNotes);
 $('read-back').addEventListener('click',closeRead);
 $('read-edit').addEventListener('click',()=>{if(activeNote)openEdit(activeNote,true);});
 $('read-edit-bottom').addEventListener('click',()=>{if(activeNote)openEdit(activeNote,true);});
 $('read-background').addEventListener('click',()=>openBackground(true));
 $('editor-back').addEventListener('click',finishEdit);$('editor-done').addEventListener('click',finishEdit);
 for(const id of ['editor-title','editor-content','editor-category'])$(id).addEventListener('input',scheduleNote);
 $('editor-pin').addEventListener('click',()=>{const b=$<HTMLButtonElement>('editor-pin');const active=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',String(active));b.classList.toggle('active',active);scheduleNote();});
 $('editor-background').addEventListener('click',()=>openBackground(false));$('editor-delete').addEventListener('click',deleteNote);
 $('task-quick-form').addEventListener('submit',e=>{e.preventDefault();const field=$<HTMLInputElement>('task-quick-input');if(addTask(field.value)){field.value='';toast('Tarefa adicionada ♡');}});
 $('task-dialog-close').addEventListener('click',closeTask);$('task-save').addEventListener('click',storeTask);$('task-delete').addEventListener('click',deleteTask);
 $('background-close').addEventListener('click',closeBackground);$('background-gallery').addEventListener('click',()=>$<HTMLInputElement>('background-file').click());
 $('background-file').addEventListener('change',e=>{const input=e.target as HTMLInputElement;const file=input.files?.[0];if(file)void changeBackground(file);input.value='';});
 $('profile-change').addEventListener('click',()=>$<HTMLInputElement>('profile-file').click());$('profile-file').addEventListener('change',e=>{const input=e.target as HTMLInputElement;const file=input.files?.[0];if(file)void changeAvatar(file);input.value='';});
 $('settings-name').addEventListener('input',e=>{data.settings.name=(e.target as HTMLInputElement).value.slice(0,32);if(saveMain())renderHome();});
 $('export-backup').addEventListener('click',()=>{void exportBackup();});$('import-backup').addEventListener('click',()=>$<HTMLInputElement>('import-file').click());$('import-file').addEventListener('change',e=>{const input=e.target as HTMLInputElement;const file=input.files?.[0];if(file)void importBackup(file);input.value='';});$('download-original').addEventListener('click',downloadOriginal);
 $('settings-lofi').addEventListener('click',musicOpen);$('home-music-button').addEventListener('click',musicOpen);$('music-minimize').addEventListener('click',minimizeMusic);$('music-stop').addEventListener('click',musicStop);$('music-reopen').addEventListener('click',restoreMusicPanel);
 $('confirm-cancel').addEventListener('click',dismissConfirm);$('confirm-ok').addEventListener('click',()=>{const callback=confirmAction;dismissConfirm();callback?.();});
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')flushNote();});window.addEventListener('pagehide',flushNote);
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;if(!$('confirm-dialog').hidden)dismissConfirm();else if(!$('background-dialog').hidden)closeBackground();else if(!$('task-dialog').hidden)closeTask();else if(!$('editor-screen').hidden)finishEdit();else if(!$('read-screen').hidden)closeRead();});
 $('raw-export').addEventListener('click',()=>{if(rawV1)downloadFile(rawV1,`meu-cantinho-dados-originais-${today()}.json`);});
}
bind();
if(!storageOK){$('data-error').hidden=false;}else{applyTheme();void paintProfile();renderAll();go('home');window.setTimeout(recoverDraft,450);}
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))window.addEventListener('load',()=>{void navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('Offline não ativado:',e));});
})();
