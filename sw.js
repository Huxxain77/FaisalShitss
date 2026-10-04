// يفتح التطبيق فورًا من النسخة المحفوظة، ويجيب التحديثات بالخلفية
const CACHE='hesabat-wesam-v4';
const FB='https://www.gstatic.com/firebasejs/10.12.2/';
const PRECACHE=['./',FB+'firebase-app.js',FB+'firebase-auth.js',FB+'firebase-firestore.js'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(PRECACHE.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'cors':'same-origin'})).catch(()=>{})))));
});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==CACHE)await caches.delete(k);
  await self.clients.claim();
})()));

const put=(key,res)=>{if(res&&(res.ok||res.type==='opaque')){const c=res.clone();caches.open(CACHE).then(x=>x.put(key,c))}return res};
const cacheFirst=req=>caches.match(req).then(r=>r||fetch(req).then(res=>put(req,res)));
const staleRevalidate=req=>caches.match(req).then(r=>{const f=fetch(req).then(res=>put(req,res)).catch(()=>r);return r||f});

// نبلغ الصفحة إن فيه نسخة أحدث (ننتظرها لين تفتح)
async function notify(id){
  for(let i=0;i<30;i++){const c=id&&await self.clients.get(id);if(c){c.postMessage({type:'app-updated'});return}await new Promise(r=>setTimeout(r,300))}
  (await self.clients.matchAll({type:'window'})).forEach(c=>c.postMessage({type:'app-updated'}));
}
// صفحة التطبيق: تفتح من الجهاز على طول، ولو فيه نسخة أحدث على النت نحفظها ونبلغ التطبيق
async function appPage(e){
  const key='./',cache=await caches.open(CACHE),cached=await cache.match(key);
  const old=cached?await cached.clone().text():null;   // نقرأ النسخة القديمة قبل ما نرسلها
  const net=fetch(e.request.url,{cache:'no-cache',credentials:'same-origin'}).then(async res=>{
    if(!res||!res.ok)return res;
    const fresh=await res.clone().text();
    await cache.put(key,res.clone());
    if(old!==null&&old!==fresh)await notify(e.resultingClientId||e.clientId);
    return res;
  }).catch(()=>cached);
  if(cached){e.waitUntil(net);return cached}
  return net;
}

self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(req.mode==='navigate'&&url.origin===location.origin){e.respondWith(appPage(e));return}
  if(url.hostname==='www.gstatic.com'||url.hostname==='fonts.gstatic.com'||url.hostname==='cdnjs.cloudflare.com'){e.respondWith(cacheFirst(req));return}
  if(url.hostname==='fonts.googleapis.com'||url.origin===location.origin){e.respondWith(staleRevalidate(req));return}
});
