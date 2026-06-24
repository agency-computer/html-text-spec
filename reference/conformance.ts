// Conformance — the reference implementation reproduces every fixture vector
// BYTE-FOR-BYTE. The published-side mirror of the producer's own guard: if a future
// edit to the recipe or the fixture diverges them, CI fails here. This is also the
// exact procedure an independent reimplementation must pass (swap projectHtmlText for
// your own). Run: `npx -y tsx reference/conformance.ts`.
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { projectHtmlText } from "./projection.ts";

// agency.html-text.v1 is FROZEN (spec §5). This is the immutability rule enforced on
// the AUTHORITY copy: the conformance vectors must hash to this value, identical to the
// pin in agency's monorepo (projection.test.ts). So v1 cannot drift on EITHER side —
// editing the cases here (even with a matching impl edit) fails CI, forcing a new
// recipe id (agency.html-text.v2 + a new fixture), never an in-place edit to v1.
const FROZEN_V1_CASES_SHA256 = "1976fb34cf9f9627ed415a22317c2d1a6654c7f1d1b3fb3905bff670f82036ff";

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

const vectorsHash = createHash("sha256").update(JSON.stringify(fixture.cases)).digest("hex");
if (vectorsHash !== FROZEN_V1_CASES_SHA256) {
  console.error(`IMMUTABILITY VIOLATED: v1 conformance vectors hash ${vectorsHash}, expected ${FROZEN_V1_CASES_SHA256}.`);
  console.error(`agency.html-text.v1 is frozen — a vector change is a NEW recipe id (v2 + a new fixture), never an edit to v1 (spec §5).`);
  process.exit(1);
}
console.log(`v1 vectors frozen-hash OK (${vectorsHash.slice(0, 12)}…)`);

