import { readFileSync, readdirSync } from 'node:fs';

/*
 * Verifica que el conjunto de migraciones pueda aplicarse de nuevo sobre una
 * base ya migrada. Un fallo aqui significa que pegar el archivo por segunda vez
 * en el editor de Supabase daria error.
 */
/*
 * Solo se revisan las migraciones que viajan en APLICAR_AHORA.sql. Las
 * anteriores ya estan aplicadas y no se vuelven a ejecutar.
 */
const FIRST_PENDING = '0006';

const dir = 'supabase/migrations';
const files = readdirSync(dir)
  .filter((f) => f.endsWith('.sql') && f >= FIRST_PENDING)
  .sort();

const errors = [];
const droppedSoFar = new Set();
const createdPolicies = new Map();
const definedFunctions = new Set();

for (const file of files) {
  const sql = readFileSync(`${dir}/${file}`, 'utf8');

  for (const m of sql.matchAll(/drop policy if exists "([^"]+)"/g)) {
    droppedSoFar.add(m[1]);
  }

  for (const m of sql.matchAll(/create policy "([^"]+)"/g)) {
    if (!droppedSoFar.has(m[1])) {
      errors.push(`politica sin drop previo (no es re-ejecutable): ${m[1]} (${file})`);
    }
    createdPolicies.set(m[1], file);
  }

  for (const m of sql.matchAll(/^create function public\.(\w+)/gm)) {
    errors.push(`usa "create function" sin "or replace": ${m[1]} (${file})`);
  }

  for (const m of sql.matchAll(/create or replace function public\.(\w+)/g)) {
    definedFunctions.add(m[1]);
  }

  // Ninguna migracion puede llamar a una funcion que otra ya retiro.
  for (const m of sql.matchAll(/public\.(is_active_admin|current_role)\(\)/g)) {
    if (!sql.includes(`drop function if exists public.${m[1]}()`)) {
      errors.push(`usa una funcion retirada: ${m[1]} (${file})`);
    }
  }
}

if (errors.length > 0) {
  console.log('PROBLEMAS:');
  for (const e of errors) console.log('  -', e);
  process.exit(1);
}

console.log(
  `OK: ${createdPolicies.size} politicas, ${droppedSoFar.size} drops, ` +
    `${definedFunctions.size} funciones, ${files.length} migraciones`,
);
