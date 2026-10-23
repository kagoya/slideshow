import {encrypt,decrypt,b64} from './crypto.js';

// Only an encrypted password is persisted, scoped to this site's album.
export function patternKey(points){return 'photo-slide-pattern-v1:'+points.join('-');}
export function storageKey(pathname){return 'ps-pattern-v1:'+pathname.replace(/[^/]*$/,'');}

export function initPattern({validatePassword,openPassword,lockPhotos}){
 const $=id=>document.getElementById(id),pad=$('patternPad'),ns='http://www.w3.org/2000/svg';
 const scope=storageKey(location.pathname);
 let saved=null,mode='unlock',first='',secret='',working=false,active=null,points=[],last=null;
 try{saved=JSON.parse(localStorage.getItem(scope));if(saved?.version!==1||typeof saved.data!=='string')saved=null;}catch{}
 const coords=Array.from({length:9},(_,i)=>({x:60+(i%3)*100,y:60+Math.floor(i/3)*100}));
 function clear(){points=[];last=null;$('patternLine').setAttribute('points','');for(const c of pad.querySelectorAll('circle'))c.classList.remove('selected');}
 function render(){
  $('patternLine').setAttribute('points',points.map(i=>coords[i].x+','+coords[i].y).join(' '));
  for(const c of pad.querySelectorAll('circle'))c.classList.toggle('selected',points.includes(Number(c.dataset.dot)));
 }
 function add(i){
  if(points.includes(i))return;
  if(points.length){
   const a=points[points.length-1],ax=a%3,ay=Math.floor(a/3),bx=i%3,by=Math.floor(i/3);
   if((ax+bx)%2===0&&(ay+by)%2===0){
    const mid=((ay+by)/2)*3+(ax+bx)/2;
    if(mid!==a&&mid!==i&&!points.includes(mid))points.push(mid);
   }
  }
  points.push(i);render();
 }
 function at(p){return coords.findIndex(c=>Math.hypot(p.x-c.x,p.y-c.y)<29);}
 function position(e){const r=pad.getBoundingClientRect();return {x:(e.clientX-r.left)*320/r.width,y:(e.clientY-r.top)*320/r.height};}
 function message(s){$('patternMessage').textContent=s;}
 function show(next){
  mode=next;clear();$('patternModal').hidden=false;
  $('patternTitle').textContent=next==='unlock'?'パターンで写真を開く':next==='confirm'?'もう一度、同じパターンをなぞる':'解除パターンを登録';
  message(next==='unlock'?'登録した順番で点をなぞってください。':'6個以上の点を、一筆でつないでください。');
  $('patternFallback').textContent=next==='unlock'?'パスワードで開く':'登録をやめる';
  pad.focus();
 }
 function close(){active=null;first='';secret='';clear();$('patternModal').hidden=true;}
 async function finish(){
  if(working)return;
  if(points.length<6){message('6個以上の点をつないでください。');clear();return;}
  const key=patternKey(points);clear();
  if(mode==='register'){first=key;show('confirm');return;}
  if(mode==='confirm'&&key!==first){first='';show('register');message('パターンが一致しません。最初から登録してください。');return;}
  working=true;pad.setAttribute('aria-busy','true');$('patternFallback').disabled=true;message('処理しています…');
  try{
   if(mode==='confirm'){
    const bytes=await encrypt(new TextEncoder().encode(JSON.stringify({scope,password:secret})),key);
    const record={version:1,data:b64(bytes)};
    localStorage.setItem(scope,JSON.stringify(record));saved=record;
    close();$('status').textContent='このブラウザーにパターンを登録しました。次回からパターンで開けます。';
    $('patternLock').hidden=false;$('patternForget').hidden=false;
   }else{
    const bytes=Uint8Array.from(atob(saved.data),c=>c.charCodeAt(0));
    const payload=JSON.parse(new TextDecoder().decode(await decrypt(bytes,key)));
    if(payload.scope!==scope||typeof payload.password!=='string')throw Error('invalid');
    if(await openPassword(payload.password))close();
    else message('写真を開けませんでした。パスワードが変更された場合は登録し直してください。');
   }
  }catch(e){message(mode==='confirm'?'登録できません。ブラウザーの保存設定を確認してください。':'パターンが違うか、保存情報を読み込めません。もう一度なぞってください。');}
  finally{working=false;pad.setAttribute('aria-busy','false');$('patternFallback').disabled=false;}
 }
 for(let i=0;i<coords.length;i++){
  const c=document.createElementNS(ns,'circle');c.setAttribute('cx',coords[i].x);c.setAttribute('cy',coords[i].y);c.setAttribute('r','16');c.dataset.dot=i;pad.append(c);
 }
 pad.addEventListener('pointerdown',e=>{
  if(working||active!==null)return;const p=position(e),i=at(p);if(i<0)return;
  e.preventDefault();clear();active=e.pointerId;last=p;pad.setPointerCapture(active);add(i);
 });
 pad.addEventListener('pointermove',e=>{
  if(e.pointerId!==active)return;e.preventDefault();const p=position(e);
  const n=Math.max(1,Math.ceil(Math.hypot(p.x-last.x,p.y-last.y)/8));
  for(let j=1;j<=n;j++){const i=at({x:last.x+(p.x-last.x)*j/n,y:last.y+(p.y-last.y)*j/n});if(i>=0)add(i);}
  last=p;
 });
 pad.addEventListener('pointerup',e=>{if(e.pointerId!==active)return;active=null;void finish();});
 pad.addEventListener('pointercancel',()=>{active=null;clear();message('操作を中断しました。もう一度なぞってください。');});
 $('patternFallback').onclick=()=>{if(working)return;close();$('password').focus();};
 $('patternSetup').onclick=async()=>{
  if(working)return;
  $('patternSetup').disabled=true;
  try{const value=await validatePassword();if(value){secret=value;first='';show('register');}}
  finally{$('patternSetup').disabled=false;}
 };
 $('patternLock').onclick=()=>{if(!working&&lockPhotos())show('unlock');};
 $('patternForget').onclick=()=>{
  if(working)return;
  try{localStorage.removeItem(scope);saved=null;close();$('patternLock').hidden=true;$('patternForget').hidden=true;$('status').textContent='このブラウザーのパターン登録を解除しました。写真のパスワードは変わりません。';}
  catch{ $('status').textContent='登録を解除できませんでした。'; }
 };
 if(saved){$('patternLock').hidden=false;$('patternForget').hidden=false;show('unlock');}
}
