// Conformance — the reference implementation reproduces every fixture vector
// BYTE-FOR-BYTE. The published-side mirror of the producer's own guard: if a future
// edit to the recipe or the fixture diverges them, CI fails here. This is also the
// exact procedure an independent reimplementation must pass (swap projectHtmlText for
// your own). Run: `npx -y tsx reference/conformance.ts`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { projectHtmlText } from "./projection.ts";

interface Case { name: string; html: string; text: string }
const here = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(here, "..", "agency-html-text-v1.json"), "utf8")) as { cases: Case[] };

let failed = 0;
for (const c of fixture.cases) {
  const got = projectHtmlText(c.html);
  const ok = got === c.text;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${c.name}`);
  if (!ok) {
    console.log(`        html:     ${JSON.stringify(c.html)}`);
    console.log(`        expected: ${JSON.stringify(c.text)}`);
    console.log(`        got:      ${JSON.stringify(got)}`);
  }
}
console.log(`\n${fixture.cases.length - failed}/${fixture.cases.length} cases byte-identical`);
if (failed > 0) {
  console.error(`CONFORMANCE FAILED: ${failed} case(s) diverged — a spec or implementation defect, never a tolerance to widen.`);
  process.exit(1);
}
