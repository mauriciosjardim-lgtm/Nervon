/**
 * check-schema — guarda de deploy contra divergência código ↔ banco.
 *
 * Cruza cada `from("tabela").insert/upsert/update({ coluna: ... })` e cada
 * `.rpc("funcao")` do código com o schema real do Supabase (via RPC
 * schema_snapshot). Sai com código 1 se achar coluna/função inexistente.
 *
 * Rodar:  bun run check:schema     (precisa de SUPABASE_URL e
 *         SUPABASE_SERVICE_ROLE_KEY no .env)
 *
 * Limite conhecido: só valida colunas escritas de forma explícita
 * (`coluna: valor`). Shorthand (`empresa_id`) e spread (`...input`) não são
 * checados — são, na prática, colunas-base que já existem.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { createClient } from "@supabase/supabase-js";

const URL = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error("❌ Faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no .env");
  process.exit(2);
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

// corpo do objeto que começa em src[i] === "{"
function objBody(src: string, i: number): string | null {
  if (src[i] !== "{") return null;
  let depth = 0, inStr: string | null = null;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (inStr) { if (c === inStr && src[j - 1] !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return src.slice(i + 1, j); }
  }
  return null;
}

// chaves top-level escritas como `coluna:` (ignora nested, strings, spread, shorthand)
function explicitKeys(body: string): string[] {
  const keys: string[] = [];
  let depth = 0, inStr: string | null = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (inStr) { if (c === inStr && body[i - 1] !== "\\") inStr = null; continue; }
    if (c === '"' || c === "'" || c === "`") { inStr = c; continue; }
    if ("{[(".includes(c)) { depth++; continue; }
    if ("}])".includes(c)) { depth--; continue; }
    if (depth !== 0) continue;
    const m = /^([A-Za-z_]\w*)\s*:/.exec(body.slice(i));
    const prev = body[i - 1] ?? ",";
    if (m && /[,{\s]/.test(prev) && prev !== ".") { keys.push(m[1]); i += m[0].length - 1; }
  }
  return keys;
}

const files = walk("src");
const problems: string[] = [];

const sb = createClient(URL, KEY);
const { data: snap, error } = await sb.rpc("schema_snapshot");
if (error || !snap) { console.error("❌ Falha ao ler schema_snapshot:", error?.message); process.exit(2); }
const tables: Record<string, string[]> = snap.tables ?? {};
const funcs = new Set<string>(snap.functions ?? []);

const writeRe = /\.from\(\s*["'`]([a-z_]+)["'`]\s*\)\s*\.(insert|upsert|update)\s*\(/g;
const rpcRe   = /\.rpc\(\s*["'`]([a-z_]+)["'`]/g;

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const rel = relative(".", file);

  let m: RegExpExecArray | null;
  while ((m = writeRe.exec(src))) {
    const table = m[1];
    let k = writeRe.lastIndex;
    while (k < src.length && /\s/.test(src[k])) k++;
    if (src[k] !== "{") continue; // objeto não-literal (ex: .update(payload)) → não checável
    const body = objBody(src, k);
    if (!body) continue;
    if (!tables[table]) { problems.push(`${rel}: tabela "${table}" não existe no banco`); continue; }
    for (const col of explicitKeys(body)) {
      if (!tables[table].includes(col)) problems.push(`${rel}: coluna "${table}.${col}" não existe no banco`);
    }
  }

  while ((m = rpcRe.exec(src))) {
    if (!funcs.has(m[1])) problems.push(`${rel}: RPC "${m[1]}" não existe no banco`);
  }
}

if (problems.length) {
  console.error(`\n❌ ${problems.length} divergência(s) código ↔ banco:\n`);
  for (const p of [...new Set(problems)]) console.error("  • " + p);
  console.error("\nCorrija a migration/coluna antes de fazer deploy.\n");
  process.exit(1);
}

console.log(`✅ Schema OK — ${files.length} arquivos, ${Object.keys(tables).length} tabelas, ${funcs.size} funções. Nenhuma divergência.`);
