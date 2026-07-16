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
      widget: { icon: 'save' },
      flexible: { text: 'hello', icon: 'star' },
      composed: { id: 'abc', createdAt: '2026-06-26', text: 'hello' },
      buttonVariant: { type: 'button', experimental: true },
    },
    identities: {
      '/composed': 'StoredText:allOf(Identified, Timestamped, TextWidget)',
      '/flexible': 'FlexibleThing:anyOf(TextWidget, IconWidget)',
      '/buttonVariant': 'ButtonVariant:oneOf(ExperimentalButton)',
      '/widget': 'Widget:oneOf(IconWidget)',
    },
  },
  experimentalVariantInProduction: {
    doc: 'a valid local identity is kept when an outer constraint invalidates the document',
    documentValid: false,
    data: {
      productionVariantHost: {
        environment: 'production',
        buttonVariant: { type: 'button', experimental: true },
      },
    },
    identities: {
      '/productionVariantHost/buttonVariant': 'ButtonVariant:oneOf(ExperimentalButton)',
    },
  },
  standardVariantInProduction: {
    doc: 'the production-compliant variant resolves to its branch',
    documentValid: true,
    data: {
      productionVariantHost: {
        environment: 'production',
        buttonVariant: { type: 'button', experimental: false },
      },
    },
    identities: {
      '/productionVariantHost/buttonVariant': 'ButtonVariant:oneOf(StandardButton)',
    },
  },
  ambiguousButton: {
    doc: 'a oneOf with two matching branches stays unresolved instead of guessing',
    documentValid: false,
    data: {
      ambiguousButton: { type: 'button', text: 'hello', icon: 'star' },
    },
    identities: {
      '/ambiguousButton':
        'unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextAndIcon:allOf(TextWidget, IconWidget)]',
    },
  },
  ambiguousControl: {
    doc: 'an allOf stays unresolved when one of its parts is itself ambiguous',
    documentValid: false,
    data: {
      ambiguousControl: { type: 'button', text: 'hello', icon: 'star', analytics: true },
    },
    identities: {
      '/ambiguousControl':
        'unresolved(allOf did not fully match) [unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextWidget], IconOrTrackable:anyOf(IconWidget, Trackable)]',
    },
  },
  resolvedComposite: {
    doc: 'nested same-path algebra resolves when every branch is distinguishable',
    documentValid: true,
    data: {
      resolvedComposite: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
    },
    identities: {
      '/resolvedComposite':
        'ResolvedComposite:allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    },
  },
  indistinguishableOneOf: {
    doc: 'indistinguishable oneOf candidates stay unresolved',
    documentValid: false,
    data: {
      duplicateVariant: { type: 'button' },
    },
    identities: {
      '/duplicateVariant':
        'unresolved(oneOf expected exactly one match, got 2) [DuplicateButtonA, DuplicateButtonB]',
    },
  },
  invalidLocal: {
    doc: 'a value matching no oneOf branch stays unresolved',
    documentValid: false,
    data: {
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
      flexible: {},
    },
    identities: {
      '/flexible': 'unresolved(anyOf matched nothing) []',
    },
  },
} satisfies Record<string, Scenario>;
