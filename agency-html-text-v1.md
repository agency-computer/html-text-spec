# agency.html-text.v1 — a byte-deterministic HTML→text projection

| | |
|---|---|
| **Recipe id** | `agency.html-text.v1` |
| **Status** | Stable / Published — this repo is the canonical home; the id is immutable (see §5) |
| **Authors** | agency.computer, principal engineering |
| **Domain** | agency.computer (the recipe catalog is the consumer's; the protocol carries the id opaquely) |
| **Reference implementation** | [`reference/projection.ts`](./reference/projection.ts) (`projectHtmlText`) |
| **Conformance vectors** | [`agency-html-text-v1.json`](./agency-html-text-v1.json) |
| **Protocol** | the `projection` slot of `@motebit/protocol` `EvidenceProvenance` ([motebit](https://github.com/motebit/motebit); verifiable-locality co-design, 2026-06) |

## 1. Purpose

A retrieved primary document (e.g. an SEC filing) is HTML. The evidence a verdict
rests on is a **verbatim span** of that document's *text*, not its tag soup. The
motebit evidence-provenance protocol re-verifies presence — "is this claim backed by
the primary record?" — by re-applying a named projection recipe over the raw bytes
and confirming the span is an exact substring of the result
(`@motebit/crypto` `verifyEvidenceProvenance`). The recipe id travels **opaquely** in
the protocol's `projection` slot; motebit never owns this algorithm (a projection is
document-domain authority, which stays with the consumer). A re-verifier injects an
implementation of this recipe via `resolveProjection`.

The property that makes evidence *independently* re-verifiable — not merely
agency-re-verifiable — is **byte-determinism**: an independent implementer working
**only from this document** MUST produce, for the same input bytes, the byte-identical
output string. If two correct implementations can diverge, a span located by one is
not reliably confirmable by another, and the locality property dies. This document is
the **authority**; the reference implementation must agree with it (enforced by
[`reference/conformance.ts`](./reference/conformance.ts) in CI).

## 2. Normative algorithm (foundation law)

**Input:** the raw document bytes, decoded as **UTF-8**.
**Output:** a string.

Apply the following steps **in order**. Each step is total (defined on every input).

1. **Remove `<script>` and `<style>` blocks** — tag **and** content. Match
   case-insensitively, non-greedy to the first matching close tag
   (`<script>…</script>`, `<style>…</style>`). Replace each whole block with one
   U+0020 space.
2. **Strip remaining tags.** Replace every remaining HTML tag — a `<` through the
   next `>` — with one U+0020 space.
3. **Decode entities in a SINGLE left-to-right pass** over the fixed enumerated table
   in §2.1. Each matched entity is replaced **once**; the replacement is **NOT
   re-scanned**. Any entity not in the table is left **verbatim**. *(This single-pass
   rule is the determinism crux — see §3.)*
4. **Collapse ASCII whitespace.** Replace every run of ASCII whitespace — the bytes
   `[ \t\n\r\f\v]` (U+0020, U+0009, U+000A, U+000D, U+000C, U+000B) — with one U+0020
   space. Non-ASCII whitespace (e.g. U+00A0 that did not arrive as an entity) is **not**
   collapsed; it passes through verbatim.
5. **Trim** leading and trailing U+0020.

### 2.1 The enumerated entity table

The recipe decodes **only** these entities (named, and the numeric forms a filing
actually emits). Every other entity passes through verbatim (step 3).

| Entities | Decodes to |
|---|---|
| `&nbsp;` `&#160;` `&#xa0;` `&#xA0;` | U+0020 space |
| `&amp;` `&#38;` | `&` |
| `&lt;` `&#60;` | `<` |
| `&gt;` `&#62;` | `>` |
| `&quot;` `&#34;` | `"` |
| `&apos;` `&#39;` | `'` |

## 3. Why single-pass decode is load-bearing

Step 3 decodes in one pass with **no re-scan**. Consider input `a&amp;lt;b`:

- **Single pass (correct):** `&amp;` → `&` once, not re-scanned → `a&lt;b`.
- **Sequential per-entity replace (WRONG):** replace `&amp;`→`&` yielding `a&lt;b`,
  then replace `&lt;`→`<` yielding `a<b`.

The two diverge. A spec that said only "decode HTML entities" would admit both, so a
span located against one implementation would fail against the other. The single-pass
rule removes that ambiguity — this is the case that must reproduce byte-for-byte
across implementations (the **canary** in the conformance fixture).

Step ordering matters for the same reason: tags are stripped (step 2) **before**
entities are decoded (step 3), so a decoded `<` (from `&lt;`) is **text**, never
re-interpreted as a tag.

## 4. Conformance

The committed fixture [`agency-html-text-v1.json`](./agency-html-text-v1.json) is the
canonical vector set. Each case is `{ name, html, text }`: `html` is the input
(decoded UTF-8), `text` is the **exact** required output.

**Cross-implementation projection-divergence procedure** — a second implementation,
built only from §2, MUST satisfy:

```
for each case in fixture.cases:
    assert impl(case.html) === case.text   # byte-for-byte, no normalization
```

Byte-identity, never "looks the same": no trailing-space tolerance, no Unicode
normalization, no case folding. The fixture intentionally includes:

- the **single-pass canary** (`a&amp;lt;b` → `a&lt;b`, §3),
- a **non-table entity** passthrough (`&copy;` stays `&copy;`),
- the **tag-strip-before-decode** ordering case,
- a **filing table** flattening to the line a real verbatim span is located in.

A divergence on any case is a spec or implementation defect, never a tolerance to
widen. [`reference/conformance.ts`](./reference/conformance.ts) runs this procedure
against the reference implementation on every push.

## 5. Versioning — the id is immutable

`agency.html-text.v1` and its output are frozen. **Any change that alters the output
for any input is a NEW recipe id** (`agency.html-text.v2`, …), never an edit to v1.
Evidence provenance signs the recipe **id** alongside the span; mutating v1 would
silently invalidate every span ever located against it. New table entries, new steps,
different whitespace handling — all are a new version. v1 may only ever receive
clarifying prose that does not change any output (and such a change must keep every
fixture vector byte-identical). **Pin a commit SHA of this repo** to be certain of the
exact bytes you reimplemented against.
