/**
 * Each scenario is a self-contained proof: a document, whether it validates, and the identity
 * mounted at every JSON Pointer (as `describeIdentities` renders it). `baseline.test.ts` asserts
 * this table for all of them, so the scenarios are the single source of truth for what the engine
 * does — there is no prose mirror to drift. Cases needing more than an identity map (error text,
 * mount-level validity) keep a focused test alongside, reading the same `data`.
 */
interface Scenario {
  // One-line statement of what this document proves; used as the test name.
  doc: string;
  // Whether the whole document validates against the root schema.
  documentValid: boolean;
  // The document analyzed as its own input.
  data: unknown;
  // Expected `describeIdentities` projection: JSON Pointer -> rendered identity.
  identities: Record<string, string>;
}

export const scenarios = {
  normal: {
    doc: 'every algebra kind (oneOf, anyOf, allOf) resolves in one valid document',
    documentValid: true,
    data: {
      environment: 'development',
      widget: { icon: 'save' },
      flexible: { text: 'hello', icon: 'star' },
      composed: { id: 'abc', createdAt: '2026-06-26', text: 'hello' },
      scaryWidget: { type: 'button', experimental: true },
    },
    identities: {
      '/composed': 'StoredText:allOf(Identified, Timestamped, TextWidget)',
      '/flexible': 'FlexibleThing:anyOf(TextWidget, IconWidget)',
      '/scaryWidget': 'ScaryWidget:oneOf(ExperimentalButton)',
      '/widget': 'Widget:oneOf(IconWidget)',
    },
  },
  scaryProduction: {
    doc: 'a valid local identity is kept when an outer constraint invalidates the document',
    documentValid: false,
    data: {
      environment: 'production',
      scaryWidget: { type: 'button', experimental: true },
    },
    identities: {
      '/scaryWidget': 'ScaryWidget:oneOf(ExperimentalButton)',
    },
  },
  scaryProductionFixed: {
    doc: 'the production-compliant variant resolves to its branch',
    documentValid: true,
    data: {
      environment: 'production',
      scaryWidget: { type: 'button', experimental: false },
    },
    identities: {
      '/scaryWidget': 'ScaryWidget:oneOf(StandardButton)',
    },
  },
  cursedA: {
    doc: 'a oneOf with two matching branches stays unresolved instead of guessing',
    documentValid: false,
    data: {
      environment: 'development',
      cursedA: { type: 'button', text: 'hello', icon: 'star' },
    },
    identities: {
      '/cursedA':
        'unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextAndIcon:allOf(TextWidget, IconWidget)]',
    },
  },
  cursedB: {
    doc: 'an allOf stays unresolved when one of its parts is itself ambiguous',
    documentValid: false,
    data: {
      environment: 'development',
      cursedB: { type: 'button', text: 'hello', icon: 'star', analytics: true },
    },
    identities: {
      '/cursedB':
        'unresolved(allOf did not fully match) [unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextWidget], IconOrTrackable:anyOf(IconWidget, Trackable)]',
    },
  },
  cursedValid: {
    doc: 'nested same-path algebra resolves when every branch is distinguishable',
    documentValid: true,
    data: {
      environment: 'development',
      cursedValid: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
    },
    identities: {
      '/cursedValid':
        'CursedValid:allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    },
  },
  ghost: {
    doc: 'indistinguishable oneOf candidates stay unresolved',
    documentValid: false,
    data: {
      environment: 'development',
      ghostWidget: { type: 'button' },
    },
    identities: {
      '/ghostWidget':
        'unresolved(oneOf expected exactly one match, got 2) [StandardGhostButton, ExperimentalGhostButton]',
    },
  },
  invalidLocal: {
    doc: 'a value matching no oneOf branch stays unresolved',
    documentValid: false,
    data: {
      environment: 'development',
      widget: { type: 'button' },
    },
    identities: {
      '/widget': 'unresolved(oneOf expected exactly one match, got 0) []',
    },
  },
  untaggedComposite: {
    doc: 'an untagged allOf is transparent, surfacing its tagged parts as a composite',
    documentValid: true,
    data: {
      environment: 'development',
      untaggedComposite: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
    },
    identities: {
      '/untaggedComposite':
        'allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    },
  },
  ancestorError: {
    doc: 'a container failing locally keeps its identity while its valid child carries no error',
    documentValid: false,
    data: {
      environment: 'development',
      container: { inner: { ok: true } },
    },
    identities: {
      '/container': 'Container',
      '/container/inner': 'InnerThing',
    },
  },
  arrayItems: {
    doc: 'array descent mounts a language component at each item index',
    documentValid: true,
    data: {
      environment: 'development',
      gallery: [{ label: 'gold' }, { label: 'silver' }],
    },
    identities: {
      '/gallery': 'Gallery',
      '/gallery/0': 'Badge',
      '/gallery/1': 'Badge',
    },
  },
  mapValues: {
    doc: 'additionalProperties descent mounts a language component at each key',
    documentValid: true,
    data: {
      environment: 'development',
      registry: { primary: { label: 'gold' }, secondary: { label: 'silver' } },
    },
    identities: {
      '/registry': 'Registry',
      '/registry/primary': 'Badge',
      '/registry/secondary': 'Badge',
    },
  },
  emptyAnyOf: {
    doc: 'a tagged anyOf whose value matches no branch is unresolved',
    documentValid: false,
    data: {
      environment: 'development',
      flexible: {},
    },
    identities: {
      '/flexible': 'unresolved(anyOf matched nothing) []',
    },
  },
} satisfies Record<string, Scenario>;
