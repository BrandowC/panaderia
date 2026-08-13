import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim()];}));
const { createClient } = await import('@supabase/supabase-js');
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth:{persistSession:false} });

const { data: settings, error: e1 } = await admin.from('bakery_settings').select('bakery_name, timezone, max_quantity');
console.log('bakery_settings:', e1 ? 'ERROR '+e1.message : JSON.stringify(settings));
const { data: profiles, error: e2 } = await admin.from('profiles').select('display_name, role, is_active');
console.log('profiles:', e2 ? 'ERROR '+e2.message : JSON.stringify(profiles));
const { error: e3 } = await admin.from('audit_logs').select('id').limit(1);
console.log('audit_logs:', e3 ? 'ERROR '+e3.message : 'existe');

const anon = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth:{persistSession:false} });
const { data: leak } = await anon.from('profiles').select('id');
console.log('RLS anon sobre profiles:', (leak?.length ?? 0) === 0 ? 'BLOQUEADO (correcto)' : 'FUGA: '+leak.length+' filas');
