import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const URL=env.NEXT_PUBLIC_SUPABASE_URL, ANON=env.NEXT_PUBLIC_SUPABASE_ANON_KEY, SR=env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(URL, SR, {auth:{persistSession:false}});

const ok=(c,m)=>console.log(`${c?'  OK  ':' FALLA'} ${m}`);

// 1. anon no ve productos
const anon = createClient(URL, ANON, {auth:{persistSession:false}});
const { data: p1 } = await anon.from('products').select('id');
ok((p1?.length??0)===0, 'anonimo NO puede listar productos');

// 2. anon no puede insertar
const { error: e2 } = await anon.from('products').insert({name:'Hackeado', normalized_name:'hackeado'});
ok(!!e2, 'anonimo NO puede crear productos');

// 3. crear empleado temporal y probar sus permisos
const email = `empleado.prueba.${Date.now()}@ejemplo.test`;
const pass = 'ClaveDePrueba123!';
const { data: created, error: ec } = await admin.auth.admin.createUser({email, password:pass, email_confirm:true});
if (ec) { console.log('no se pudo crear usuario de prueba:', ec.message); process.exit(0); }

const emp = createClient(URL, ANON, {auth:{persistSession:false}});
const { error: el } = await emp.auth.signInWithPassword({email, password:pass});
ok(!el, 'empleado puede iniciar sesion');

const { data: prof } = await emp.from('profiles').select('role').eq('id', created.user.id).maybeSingle();
ok(prof?.role==='EMPLOYEE', `perfil creado automaticamente con rol EMPLOYEE (fue: ${prof?.role})`);

const { error: e5 } = await emp.from('products').insert({name:'Pan del empleado', normalized_name:'x'});
ok(!!e5, 'empleado NO puede crear productos');

const { error: e6 } = await emp.from('profiles').update({role:'ADMIN'}).eq('id', created.user.id);
const { data: after } = await admin.from('profiles').select('role').eq('id', created.user.id).maybeSingle();
ok(after?.role==='EMPLOYEE', `empleado NO puede autoascenderse a ADMIN (quedo: ${after?.role})`);

const { data: others } = await emp.from('profiles').select('id');
ok((others?.length??0)<=1, `empleado solo ve su propio perfil (vio ${others?.length??0})`);

const { data: audit } = await emp.from('audit_logs').select('id');
ok((audit?.length??0)===0, 'empleado NO puede leer auditoria');

await admin.auth.admin.deleteUser(created.user.id);
console.log('\nusuario de prueba eliminado');
