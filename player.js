import {decrypt} from './crypto.js';
const $=id=>document.getElementById(id);let list=[],index=0,password='',timer=null,url=null,busy=false;
async function refresh(){const r=await fetch('manifest.json?t='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('写真一覧を取得できません');list=(await r.json()).items;}
async function show(step=0){if(busy||!password)return false;busy=true;$('status').textContent='写真を読み込み・復号しています…';try{if(!list.length)throw Error('写真がありません');index=(index+step+list.length)%list.length;const path=list[index];if(!/^photos\/[a-zA-Z0-9_-]+\.enc$/.test(path))throw Error('不正な写真パス');const r=await fetch(path);if(!r.ok)throw Error('写真を取得できません');const raw=await decrypt(await r.arrayBuffer(),password);const next=URL.createObjectURL(new Blob([raw],{type:'image/jpeg'}));const img=new Image();img.alt='スライド写真';img.src=next;try{await img.decode();}catch(e){URL.revokeObjectURL(next);throw Error('画像形式を表示できません');}if(url)URL.revokeObjectURL(url);url=next;$('stage').replaceChildren(img);$('status').textContent=`${index+1} / ${list.length}`;return true;}catch(e){stop();$('status').textContent='表示失敗：パスワード・通信を確認してください。 '+(e.message||'');return false;}finally{busy=false;}}
function stop(){clearInterval(timer);timer=null;$('play').textContent='再生';}function start(){stop();$('play').textContent='一時停止';timer=setInterval(()=>show(1),Number($('interval').value)*1000);}
async function unlock(){
 if(busy)return false;
 const entered=$('password').value;
 if(!entered&&!password){$('status').textContent='写真のパスワードを入力してください。';$('password').focus();return false;}
 if(!window.isSecureContext||!globalThis.crypto?.subtle){$('status').textContent='このブラウザーでは暗号の復号を利用できません。HTTPSで開いてください。';return false;}
 if(entered){password=entered;$('password').value='';}
 stop();$('unlock').disabled=true;$('status').textContent='写真一覧を読み込んでいます…';
 try{await refresh();index=0;return await show();}catch(e){$('status').textContent='読み込み失敗：'+e.message;return false;}finally{$('unlock').disabled=false;}
}
$('unlock').onclick=async()=>{if(await unlock())start();};
$('password').addEventListener('keydown',e=>{if(e.key==='Enter'){$('unlock').click();}});
$('next').onclick=async()=>{if(!url||$('password').value){await unlock();}else await show(1);};
$('prev').onclick=async()=>{if(!url||$('password').value){await unlock();}else await show(-1);};
$('play').onclick=async()=>{if(timer){stop();return;}if(!url||$('password').value){if(!await unlock())return;}start();};
$('interval').onchange=()=>{if(timer)start();};$('full').onclick=()=>document.documentElement.requestFullscreen?.().catch(()=>{});
$('add').onclick=()=>{const u=new URL('upload.html',location.href);const q=new URLSearchParams(location.search);for(const k of ['owner','repo','branch'])if(q.has(k))u.searchParams.set(k,q.get(k));$('uploadLink').href=u.href;$('share').hidden=false;try{const code=qrcode(0,'M');code.addData(u.href);code.make();$('qr').innerHTML=code.createImgTag(4,8,'アップロードページのQRコード');}catch(e){$('qr').textContent='QR生成失敗。リンクを使用してください。';}};
setInterval(()=>{if(password)refresh().catch(()=>{});},60000);

$('status').textContent='パスワードを入力し、「写真を開いて再生」または「再生」を押してください。';
