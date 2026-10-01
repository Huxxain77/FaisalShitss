// يخلي التطبيق يفتح حتى بدون نت (البيانات نفسها تتزامن عن طريق Firebase)
const CACHE='hesabat-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const req=e.request,url=new URL(req.url);
  if(req.method!=='GET')return;
  const ok=url.origin===location.origin||url.hostname==='www.gstatic.com'||url.hostname.endsWith('googleapis.com')&&url.pathname.startsWith('/css')||url.hostname==='fonts.gstatic.com';
  if(!ok)return;
  e.respondWith(fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return res;
  }).catch(()=>caches.match(req).then(r=>r||caches.match('./'))));
});
