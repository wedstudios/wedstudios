import { hashPassword, json, options, auth, clean, safeId } from './_utils.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return options();
  const user=await auth(context.request);
  if(!user || user.role!=='admin') return json({error:'Unauthorized'},401);
  const db=context.env.DB;
  if(context.request.method==='GET'){
    const {results}=await db.prepare('SELECT id,name,role,active,created_at FROM users ORDER BY role,id').all();
    return json({users:results});
  }
  const body=await context.request.json().catch(()=>null);
  if(context.request.method==='POST'){
    const id=clean(body?.id,50), name=clean(body?.name,100), password=String(body?.password||'');
    if(!safeId(id)||!name||password.length<6) return json({error:'Use a valid ID, name and password of at least 6 characters'},400);
    const exists=await db.prepare('SELECT id FROM users WHERE id=?').bind(id).first();
    if(exists) return json({error:'User ID already exists'},409);
    await db.prepare('INSERT INTO users(id,name,password_hash,role,active) VALUES(?,?,?,?,?)').bind(id,name,await hashPassword(password),'editor',body?.active===false?0:1).run();
    return json({ok:true});
  }
  if(context.request.method==='PUT'){
    const id=clean(body?.id,50); if(!safeId(id)) return json({error:'Invalid user ID'},400);
    const active=body?.active?1:0;
    await db.prepare('UPDATE users SET active=? WHERE id=? AND role="editor"').bind(active,id).run();
    return json({ok:true});
  }
  if(context.request.method==='DELETE'){
    const id=clean(body?.id,50); if(id==='admin') return json({error:'Admin cannot be deleted'},400);
    await db.prepare('DELETE FROM users WHERE id=? AND role="editor"').bind(id).run();
    return json({ok:true});
  }
  return json({error:'Method not allowed'},405);
}
