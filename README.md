# agency.html-text.v1

A **byte-deterministic HTML→text projection recipe** — the spec, its conformance
fixture, and a reference implementation.

## Why this is public

agency.computer produces signed evidence whose claims are **verbatim spans of a
primary document** (e.g. an SEC filing). The [motebit evidence-provenance
protocol](https://github.com/motebit/motebit/blob/main/spec/evidence-provenance-v1.md)
(`evidence-provenance-v1`) re-verifies such a claim by re-applying a named projection
recipe over the raw document bytes and confirming the span is an exact substring of the
result — so **anyone** can re-fetch the raw filing, re-apply this recipe, and check the
evidence, with no trust in agency's index.

That property only holds if the recipe is **byte-deterministic**: an independent
implementation, built only from the spec, must produce the byte-identical output for
the same input. This repo is that spec, published so it can be reimplemented, checked,
and pinned.

`agency.html-text.v1` is the worked exemplar named in the protocol's byte-determinism
conformance requirement
([evidence-provenance-v1 §7](https://github.com/motebit/motebit/blob/main/spec/evidence-provenance-v1.md)):
a projection recipe is a real protocol artifact only if it is world-public,
content-addressed, immutable under its id, and reproduced byte-for-byte by **two
independent implementations** against a committed fixture — this repo's reference
implementation and motebit's independent conformance test being the two.

## Contents

| File | Role |
|---|---|
| [`agency-html-text-v1.md`](./agency-html-text-v1.md) | **The spec — the authority.** Reimplement from this alone. |
| [`agency-html-text-v1.json`](./agency-html-text-v1.json) | **Conformance fixture.** `{ html → text }` vectors; check byte-for-byte. |
| [`reference/projection.ts`](./reference/projection.ts) | Reference implementation — non-authoritative (the spec is). agency.computer's production code, vendored verbatim. |
| [`reference/conformance.ts`](./reference/conformance.ts) | Runs the reference impl over the fixture, asserts byte-identity. CI runs it on every push. |

## Conforming an implementation

Reimplement the algorithm in [`agency-html-text-v1.md` §2](./agency-html-text-v1.md),
then for every case in the fixture assert `impl(case.html) === case.text` —
byte-for-byte, no normalization, no tolerance. The single-pass entity-decode canary
(`a&amp;lt;b` → `a&lt;b`, never `a<b`) is the case that most distinguishes a correct
implementation from a plausible-but-wrong one.

Check the bundled reference implementation yourself:

```sh
npx -y tsx reference/conformance.ts
```

## Immutability

`agency.html-text.v1` is **frozen**. Any change that alters the output for any input
is a **new** recipe id (`agency.html-text.v2`, …), never an edit — because signed
evidence references the recipe id. **Pin a commit SHA of this repo** to be certain of
the exact bytes you reimplemented against.

## License

[MIT](./LICENSE) — reimplement freely.
