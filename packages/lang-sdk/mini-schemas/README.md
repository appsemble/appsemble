# Mini Schemas

This folder is a stress-test suite for the `../meta-object` engine.

It defines a tiny annotated JSON Schema DSL plus sample data that exercise normal objects,
`oneOf`/`anyOf`/`allOf`, nested same-path algebra, invalid local matches, local-vs-document
validity, losing-branch ghosts, and conditional placement the walk cannot navigate.

Run the human-readable report with:

```sh
npx tsx packages/lang-sdk/mini-schemas/report.ts
```

## What it proves

- identity comes from resolving the entry schema, not from hit order
- `oneOf`/`anyOf`/`allOf` resolve to single or composite objects
- ambiguous or unmatched algebra stays `unresolved` instead of guessing
- local object identity is kept separate from whole-document validity
- a child of a losing combinator branch is not mounted (no ghosts)
- a meta-object behind an applicator the walk cannot navigate (`if`/`then`) is not mounted

## Test files

- `mini-schemas.test.ts`: the baseline scenarios below.
- `gaps.test.ts`: the four design gaps (#1 ghost, #2 untagged combinator, #3 hit order, #4 ancestor
  errors), each now fixed, plus a catalog of latent ones.
- `capabilities.test.ts`: walk behavior for `anyOf` short-circuit children and `if`/`then`
  placement.

## Baseline scenarios

```text
normal               /widget      -> Widget:oneOf(IconWidget)
                     /flexible    -> FlexibleThing:anyOf(TextWidget, IconWidget)
                     /composed    -> StoredText:allOf(Identified, Timestamped, TextWidget)
                     /scaryWidget -> ScaryWidget:oneOf(ExperimentalButton)
scaryProduction      /scaryWidget -> ScaryWidget:oneOf(ExperimentalButton)   (documentValid: false)
scaryProductionFixed /scaryWidget -> ScaryWidget:oneOf(StandardButton)
cursedA              /cursedA     -> unresolved(oneOf ... got 2) [ButtonWidget, TextAndIcon:allOf(...)]
cursedB              /cursedB     -> unresolved(allOf did not fully match) [...]
cursedValid          /cursedValid -> CursedValid:allOf(StrictButtonOrText:oneOf(StrictButton),
                                                       StrictIconOrTrackable:anyOf(IconWidget, Trackable))
ghost                /ghostWidget -> unresolved(oneOf ... got 2)   (indistinguishable branches)
invalidLocal         /widget      -> unresolved(oneOf ... got 0)
```

`scaryProduction` is the local/document split: `/scaryWidget` keeps its local identity
(`ExperimentalButton`) while the document is invalid, and the node carries the error at
`/scaryWidget/experimental`. `cursedValid` shows nested same-path algebra resolving when the inner
branches are distinguishable; `ghost` shows it staying `unresolved` when they are not.

## Gap and capability cases

```text
ghostChild        /ghostHost   -> GhostHost:oneOf(PlainBranch)      (FancyBranch.action pruned)
untaggedComposite /untaggedComposite -> allOf(StrictButtonOrText:oneOf(StrictButton), ...)
ancestorError     /container/inner carries no error; /container holds the missing-label error
host              /host/badge  -> Badge        (mounted despite anyOf short-circuit)
condHost          /condHost/trinket not mounted (if/then is outside walk coverage)
```
