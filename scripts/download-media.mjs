// Downloads owner-approved media listed in scripts/media-manifest.json into public/media/.
// Usage: node scripts/download-media.mjs
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(await readFile(path.join(root, "scripts", "media-manifest.json"), "utf8"));

async function get(url, dest) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (media import)" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const type = res.headers.get("content-type") || "";
  if (!/^image\//.test(type)) throw new Error(`unexpected content-type ${type}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, buf);
  return buf.length;
}

let ok = 0, failed = 0;
for (const [name, url] of manifest.instagram) {
  const dest = path.join(root, "public", "media", "instagram", `${name}.jpg`);
  try { const n = await get(url, dest); ok++; console.log(`ok   ${name}.jpg ${(n / 1024).toFixed(0)} KB`); }
  catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
}
for (const [name, url] of manifest.web) {
  const dest = path.join(root, "public", "media", "brand", `${name}${path.extname(new URL(url).pathname)}`);
  try { const n = await get(url, dest); ok++; console.log(`ok   ${path.basename(dest)} ${(n / 1024).toFixed(0)} KB`); }
  catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
}
console.log(`\n${ok} downloaded, ${failed} failed`);
process.exit(failed ? 1 : 0);
