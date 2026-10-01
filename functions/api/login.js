import { hashPassword, verifyPassword, json, options, tokenFor, clean } from './_utils.js';

export async function onRequest(context) {
  if (context.request.method==='OPTIONS') return options();
  if (context.request.method!=='POST') return json({error:'Method not allowed'},405);
  const body=await context.request.json().catch(()=>null);
  const id=clean(body?.id,50), password=String(body?.password||'');
  if(!id||!password) return json({error:'User ID and password are required'},400);
  let user=await context.env.DB.prepare('SELECT id,name,password_hash,role,active FROM users WHERE id=?').bind(id).first();
  if(!user){
    const count=await context.env.DB.prepare('SELECT COUNT(*) AS c FROM users').first();
    if(Number(count?.c)===0 && id==='admin' && password==='admin123'){
      const hash=await hashPassword(password);
      await context.env.DB.prepare('INSERT INTO users(id,name,password_hash,role,active) VALUES(?,?,?,?,1)').bind('admin','Administrator',hash,'admin').run();
      user={id:'admin',name:'Administrator',password_hash:hash,role:'admin',active:1};
    }
  }
  if(!user || !user.active || !(await verifyPassword(password,user.password_hash))) return json({error:'Invalid login details'},401);
  const token=await tokenFor(user);
  return json({ok:true,token,user:{id:user.id,name:user.name,role:user.role}});
}
