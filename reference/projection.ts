// agency.html-text.v1 — the DECLARED, byte-deterministic HTML→text projection
// recipe for primary-retrieval evidence (the motebit evidence-provenance protocol,
// guardrail 3). A retrieved filing's verbatim span is located in THIS projection's
// output; the protocol's verifyEvidenceProvenance re-applies the recipe (by its
// opaque id) over the raw bytes and confirms the span. So the recipe MUST be
// reproducible to byte-identity by an independent implementer working ONLY from
// the spec — or the evidence is agency-re-verifiable, not independently, and the
// property dies. The recipe catalog is agency's (a projection is document-domain);
// the protocol carries `agency.html-text.v1` opaquely and never owns this code.
//
// CANONICAL PUBLISHED SPEC: ../agency-html-text-v1.md (this repo) — that document is
// the AUTHORITY a third party reimplements from; this file is the reference
// implementation (agency.computer's production code, vendored here verbatim) and MUST
// agree with it. The inline spec block below is a verbatim convenience copy; if it
// ever drifts from the doc, the doc wins (reference/conformance.ts guards impl↔fixture).
//
// ── THE SPEC (agency.html-text.v1) — apply IN ORDER, each step total ──────────
// Input: the raw document bytes, decoded as UTF-8. Output: a string.
//   1. Remove every <script>…</script> and <style>…</style> block, tag AND content,
//      case-insensitive, non-greedy to the first matching close tag.
//   2. Replace every remaining HTML tag — a "<" through the next ">" — with one
//      U+0020 space.
//   3. Decode HTML entities in a SINGLE left-to-right pass over a FIXED enumerated
//      table (below). Each matched entity is replaced once; the replacement is NOT
//      re-scanned (so "&amp;lt;" → "&lt;", never "<"). Any entity NOT in the table
//      is left verbatim. This single-pass rule is the determinism crux — sequential
//      per-entity replaces would diverge on nested entities.
//   4. Collapse every run of ASCII whitespace [ \t\n\r\f\v] to one U+0020 space.
//      (Non-ASCII whitespace is NOT collapsed — it passes through verbatim.)
//   5. Trim leading/trailing U+0020.
//
// The enumerated entity table (named + the numeric forms a filing actually emits):
//   &nbsp; &#160; &#xa0; &#xA0; → space
//   &amp;  &#38;               → &
//   &lt;   &#60;               → <
//   &gt;   &#62;               → >
//   &quot; &#34;               → "
//   &apos; &#39;               → '
// ──────────────────────────────────────────────────────────────────────────────

/** The opaque recipe id the evidence provenance carries (motebit's protocol slot). */
export const HTML_TEXT_RECIPE = "agency.html-text.v1";

/** The enumerated table — the ONLY entities the recipe decodes; all else verbatim. */
const ENTITY_TABLE: Readonly<Record<string, string>> = {
  "&nbsp;": " ", "&#160;": " ", "&#xa0;": " ", "&#xA0;": " ",
  "&amp;": "&", "&#38;": "&",
  "&lt;": "<", "&#60;": "<",
  "&gt;": ">", "&#62;": ">",
  "&quot;": '"', "&#34;": '"',
  "&apos;": "'", "&#39;": "'"
};
// One alternation over the exact table — a single global pass, no re-scan (step 3).
const ENTITY_RE = /&(?:nbsp|amp|lt|gt|quot|apos|#160|#xa0|#xA0|#38|#60|#62|#34|#39);/g;

/** Apply agency.html-text.v1 to a raw HTML string. Pure, total, deterministic —
 *  the same bytes always yield the same string, and an independent implementation
 *  of the spec above yields the identical string (proven by the committed fixture,
 *  projection.test.ts). This is the reference implementation, NOT the authority —
 *  the prose spec is; this function must agree with it. */
export function projectHtmlText(html: string): string {
  return html
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(ENTITY_RE, (m) => ENTITY_TABLE[m] ?? m)
    .replace(/[ \t\n\r\f\v]+/g, " ")
    .trim();
}
