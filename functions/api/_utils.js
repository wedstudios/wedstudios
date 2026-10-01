const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]);
  return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function unb64url(s) {
  s = s.replace(/-/g,'+').replace(/_/g,'/');
  while (s.length % 4) s += '=';
  const bin = atob(s); const out = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
export async function hashPassword(password) {
  const data = enc.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return b64url(hash);
}
export async function verifyPassword(password, hash) {
  const actual = await hashPassword(password);
  const a = enc.encode(actual), b = enc.encode(hash);
  if (a.length !== b.length) return false;
  let diff = 0; for (let i=0;i<a.length;i++) diff |= a[i]^b[i];
  return diff === 0;
}
export function json(data, status=200, extra={}) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', ...extra }});
}
export function options() { return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization'}}); }
export function getBearer(request) { const h=request.headers.get('Authorization')||''; return h.startsWith('Bearer ')?h.slice(7):null; }
export async function tokenFor(user) {
  const payload = { id:user.id, name:user.name, role:user.role, exp:Date.now()+1000*60*60*24*7 };
  const raw = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.digest('SHA-256', enc.encode(raw + ':' + (globalThis.SECRET||'wed-studios-change-secret')));
  return raw+'.'+b64url(sig);
}
export async function auth(request) {
  const token=getBearer(request); if(!token) return null;
  const [raw,sig]=token.split('.'); if(!raw||!sig) return null;
  const expected=await crypto.subtle.digest('SHA-256',enc.encode(raw+':' + (globalThis.SECRET||'wed-studios-change-secret')));
  if(b64url(expected)!==sig) return null;
  let p; try { p=JSON.parse(new TextDecoder().decode(unb64url(raw))); } catch { return null; }
  if(!p.exp || p.exp<Date.now()) return null;
  return p;
}
export function requireRole(user, role) { return user && user.role===role; }
export function safeId(id) { return typeof id==='string' && /^[A-Za-z0-9._-]{2,50}$/.test(id); }
export function clean(v,max=200) { return String(v??'').trim().slice(0,max); }
