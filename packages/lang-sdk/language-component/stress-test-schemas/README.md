# Stress-test schemas

This folder is a stress-test suite for the parent `language-component` engine.

It defines a tiny annotated JSON Schema DSL (`schemas.ts`) plus sample documents that exercise normal
objects, `oneOf`/`anyOf`/`allOf`, nested same-path algebra, invalid local matches, local-vs-document
validity, losing-branch ghosts, and conditional placement the walk cannot navigate.

It consumes the engine **only through the parent barrel** (`../index.js`), never a deep import into
an internal module, so it exercises the same public surface a real consumer sees.

Run the suite with:

```sh
npx vitest run packages/lang-sdk/language-component/stress-test-schemas
```

## Where the scenarios live

`scenarios.ts` is the single source of truth. Each entry pairs a document with the identity mounted
at every JSON Pointer and whether the document validates, and carries a one-line `doc` of what it
proves. `baseline.test.ts` asserts that whole table, so the expected output sits next to the input
that produces it and cannot drift from a separate description.

The other test files add what an identity map alone does not show:

- `edge-cases.test.ts`: ref-cutoff local validation, untagged combinators with no annotated parts,
  incremental boundaries, and cursor navigation.
- `capabilities.test.ts`: walk behavior the validator diverges from — a child mounted under a
  short-circuited `anyOf` branch, and a component behind `if`/`then` the walk cannot reach.
- `incremental.test.ts`: an incremental `buildTree` matches a full build after each change, and
  reuses untouched mounts by reference.

## Nested composite identity

A single value can resolve to one nested composite identity — the algebra of the `allOf` / `oneOf` /
`anyOf` at that path, not a tree of separately mounted nodes. The `cursedValid` scenario resolves to:

```mermaid
graph TD
  CV["CursedValid : allOf"] --> SBT["StrictButtonOrText : oneOf"]
  CV --> SIT["StrictIconOrTrackable : anyOf"]
  SBT --> SB["StrictButton"]
  SIT --> IW["IconWidget"]
  SIT --> TR["Trackable"]
```
