import { json, options, auth, clean } from './_utils.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return options();
  const user=await auth(context.request); if(!user) return json({error:'Unauthorized'},401);
  const db=context.env.DB;
  if(context.request.method==='GET'){
    let sql=`SELECT w.*,u.name AS editor_name FROM works w JOIN users u ON u.id=w.editor_id`;
    const params=[]; const clauses=[];
    if(user.role==='editor'){clauses.push('w.editor_id=?');params.push(user.id);}
    const url=new URL(context.request.url); const month=url.searchParams.get('month');
    if(month && /^\d{4}-\d{2}$/.test(month)){clauses.push('substr(w.work_date,1,7)=?');params.push(month);}
    if(clauses.length) sql+=' WHERE '+clauses.join(' AND ');
    sql+=' ORDER BY w.work_date DESC,w.created_at DESC';
    const stmt=db.prepare(sql); const {results}=await stmt.bind(...params).all();
    return json({works:results});
  }
  if(context.request.method==='POST'){
    const b=await context.request.json().catch(()=>null);
    const date=clean(b?.date,10), studio=clean(b?.studio,120), project=clean(b?.project,160), type=clean(b?.type,80), status=clean(b?.status,30);
    const price=Number(b?.price||0); const editorId=user.role==='editor'?user.id:clean(b?.editor,50);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!studio||!project||!type||!editorId||!['Pending','In Progress','Completed'].includes(status)||!Number.isFinite(price)||price<0) return json({error:'Please provide valid work details'},400);
    const ed=await db.prepare('SELECT id FROM users WHERE id=? AND role="editor" AND active=1').bind(editorId).first();
    if(!ed) return json({error:'Editor not found or inactive'},400);
    const id=crypto.randomUUID();
    await db.prepare('INSERT INTO works(id,work_date,editor_id,studio,project,work_type,price,status) VALUES(?,?,?,?,?,?,?,?)').bind(id,date,editorId,studio,project,type,price,status).run();
    return json({ok:true,id});
  }
  if(user.role!=='admin') return json({error:'Only admin can modify/delete work'},403);
  const b=await context.request.json().catch(()=>null);
  if(context.request.method==='DELETE'){
    const id=clean(b?.id,80); await db.prepare('DELETE FROM works WHERE id=?').bind(id).run(); return json({ok:true});
  }
  if(context.request.method==='PUT'){
    const id=clean(b?.id,80), date=clean(b?.date,10), studio=clean(b?.studio,120), project=clean(b?.project,160), type=clean(b?.type,80), status=clean(b?.status,30), editor=clean(b?.editor,50); const price=Number(b?.price||0);
    if(!id||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!studio||!project||!type||!editor||!['Pending','In Progress','Completed'].includes(status)||!Number.isFinite(price)||price<0) return json({error:'Invalid work data'},400);
    await db.prepare('UPDATE works SET work_date=?,editor_id=?,studio=?,project=?,work_type=?,price=?,status=? WHERE id=?').bind(date,editor,studio,project,type,price,status,id).run();
    return json({ok:true});
  }
  return json({error:'Method not allowed'},405);
}
