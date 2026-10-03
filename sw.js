// يسرّع فتح التطبيق ويخليه يفتح حتى بدون نت (البيانات نفسها تتزامن عن طريق Firebase)
const CACHE='hesabat-wesam-v2';
const FB='https://www.gstatic.com/firebasejs/10.12.2/';
const PRECACHE=['./',FB+'firebase-app-compat.js',FB+'firebase-auth-compat.js',FB+'firebase-firestore-compat.js'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRECACHE.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'cors':'same-origin'})).catch(()=>{})))));
});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);   // نمسح الكاش القديم
  await self.clients.claim();
})()));

const put=(req,res)=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(CACHE).then(x=>x.put(req,c))}return res};

// المكتبات والخطوط ما تتغير (رقم النسخة في الرابط): من الكاش على طول
const cacheFirst=req=>caches.match(req).then(r=>r||fetch(req).then(res=>put(req,res)));
// ملف الخطوط: من الكاش على طول، ويتحدث بالخلفية
const staleRevalidate=req=>caches.match(req).then(r=>{const f=fetch(req).then(res=>put(req,res)).catch(()=>r);return r||f});
// ملفات التطبيق: نجيب الأحدث من النت، ولو النت بطيء (أكثر من ثانيتين ونص) نفتح من الكاش
const networkFirst=req=>new Promise(resolve=>{
  let done=false;const finish=r=>{if(!done&&r){done=true;resolve(r)}};
  const t=setTimeout(()=>caches.match(req).then(r=>finish(r)),2500);
  fetch(req).then(res=>{clearTimeout(t);finish(put(req,res))})
    .catch(()=>caches.match(req).then(r=>finish(r||caches.match('./'))).then(()=>{if(!done)resolve(Response.error())}));
});

self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.hostname==='www.gstatic.com'||url.hostname==='fonts.gstatic.com'||url.hostname==='cdnjs.cloudflare.com'){e.respondWith(cacheFirst(req));return}
  if(url.hostname==='fonts.googleapis.com'){e.respondWith(staleRevalidate(req));return}
  if(url.origin===location.origin){e.respondWith(networkFirst(req));return}
  // Firebase نفسه (البيانات وتسجيل الدخول) ما نلمسه
});
