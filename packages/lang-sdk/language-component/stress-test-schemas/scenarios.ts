/**
 * Two scenario tables, each a self-contained proof: a document and the identity mounted at every
 * JSON Pointer (as `describeIdentities` renders it). `baseline.test.ts` asserts both tables, so the
 * scenarios are the single source of truth for what the engine does — there is no prose mirror to
 * drift. Cases needing more than an identity map (error text, mount-level validity) keep a focused
 * test alongside, reading the same `data`.
 *
 * `appScenarios` walk a tiny Appsemble app end to end (pages -> blocks -> resolver-supplied
 * parameters). `componentScenarios` isolate one component as its own root — the ambiguous, duplicate,
 * losing-branch, ancestor-error, conditional, and production-gate probes, each proved on the smallest
 * schema that exhibits it rather than buried in the app shape.
 */
interface AppScenario {
  // One-line statement of what this document proves; used as the test name.
  doc: string;
  // Whether the whole document validates against the root (app) schema.
  documentValid: boolean;
  // The app document analyzed as its own input.
  data: unknown;
  // Expected `describeIdentities` projection: JSON Pointer -> rendered identity.
  identities: Record<string, string>;
}

interface ComponentScenario extends AppScenario {
  // The registry key compiled as this probe's root, in place of the whole app.
  root: string;
}

export const appScenarios = {
  app: {
    doc: 'a tiny app resolves every algebra kind and every descent shape through pages and blocks',
    documentValid: true,
    data: {
      name: 'Tiny Shop',
      defaultPage: 'Home',
      pages: [
        {
          name: 'Home',
          blocks: [
            {
              type: 'widget-block',
              version: '0.0.0',
              parameters: {
                widget: { icon: 'save' },
                flexible: { text: 'hello', icon: 'star' },
                composed: { id: 'abc', createdAt: '2026-06-26', text: 'hello' },
              },
            },
            {
              type: 'badge-list',
              version: '0.0.0',
              parameters: {
                gallery: [{ label: 'gold' }, { label: 'silver' }],
                registry: { primary: { label: 'gold' } },
                holders: [{ text: 'a', badge: { label: 'x' } }],
              },
            },
          ],
        },
      ],
    },
    identities: {
      '/': 'AppDefinition',
      '/pages/0': 'PageDefinition',
      '/pages/0/blocks/0': 'BlockDefinition',
      '/pages/0/blocks/0/parameters': 'WidgetBlockParams',
      '/pages/0/blocks/0/parameters/composed':
        'StoredText:allOf(Identified, Timestamped, TextWidget)',
      '/pages/0/blocks/0/parameters/flexible': 'FlexibleThing:anyOf(TextWidget, IconWidget)',
      '/pages/0/blocks/0/parameters/widget': 'Widget:oneOf(IconWidget)',
      '/pages/0/blocks/1': 'BlockDefinition',
      '/pages/0/blocks/1/parameters': 'BadgeListBlockParams',
      '/pages/0/blocks/1/parameters/gallery': 'Gallery',
      '/pages/0/blocks/1/parameters/gallery/0': 'Badge',
      '/pages/0/blocks/1/parameters/gallery/1': 'Badge',
      '/pages/0/blocks/1/parameters/holders/0': 'BadgeHolder',
      '/pages/0/blocks/1/parameters/holders/0/badge': 'Badge',
      '/pages/0/blocks/1/parameters/registry': 'Registry',
      '/pages/0/blocks/1/parameters/registry/primary': 'Badge',
    },
  },
  unknownBlock: {
    doc: 'a block whose type+version is not in the manifest mounts nothing under its parameters',
    documentValid: true,
    data: {
      name: 'Tiny Shop',
      defaultPage: 'Home',
      pages: [
        {
          name: 'Home',
          // Parameters are present but the resolver recognizes no schema for this type+version, so
          // nothing mounts beneath them — a stray block cannot smuggle in a mounted component.
          blocks: [{ type: 'missing-block', version: '9.9.9', parameters: { widget: {} } }],
        },
      ],
    },
    identities: {
      '/': 'AppDefinition',
      '/pages/0': 'PageDefinition',
      '/pages/0/blocks/0': 'BlockDefinition',
    },
  },
} satisfies Record<string, AppScenario>;

export const componentScenarios = {
  ambiguousButton: {
    doc: 'a oneOf with two matching branches stays unresolved instead of guessing',
    root: 'AmbiguousButton',
    documentValid: false,
    data: { type: 'button', text: 'hello', icon: 'star' },
    identities: {
      '/': 'unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextAndIcon:allOf(TextWidget, IconWidget)]',
    },
  },
  ambiguousControl: {
    doc: 'an allOf stays unresolved when one of its parts is itself ambiguous',
    root: 'AmbiguousControl',
    documentValid: false,
    data: { type: 'button', text: 'hello', icon: 'star', analytics: true },
    identities: {
      '/': 'unresolved(allOf did not fully match) [unresolved(oneOf expected exactly one match, got 2) [ButtonWidget, TextWidget], IconOrTrackable:anyOf(IconWidget, Trackable)]',
    },
  },
  resolvedComposite: {
    doc: 'nested same-path algebra resolves when every branch is distinguishable',
    root: 'ResolvedComposite',
    documentValid: true,
    data: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
    identities: {
      '/': 'ResolvedComposite:allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    },
  },
  indistinguishableOneOf: {
    doc: 'indistinguishable oneOf candidates stay unresolved',
    root: 'DuplicateVariant',
    documentValid: false,
    data: { type: 'button' },
    identities: {
      '/': 'unresolved(oneOf expected exactly one match, got 2) [DuplicateButtonA, DuplicateButtonB]',
    },
  },
  invalidLocal: {
    doc: 'a value matching no oneOf branch stays unresolved',
    root: 'Widget',
    documentValid: false,
    data: { type: 'button' },
    identities: {
      '/': 'unresolved(oneOf expected exactly one match, got 0) []',
    },
  },
  untaggedComposite: {
    doc: 'an untagged allOf is transparent, surfacing its tagged parts as a composite',
    root: 'UntaggedComposite',
    documentValid: true,
    data: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
    identities: {
      '/': 'allOf(StrictButtonOrText:oneOf(StrictButton), StrictIconOrTrackable:anyOf(IconWidget, Trackable))',
    },
  },
  ancestorError: {
    doc: 'a container failing locally keeps its identity while its valid child carries no error',
    root: 'Container',
    documentValid: false,
    data: { inner: { ok: true } },
    identities: {
      '/': 'Container',
      '/inner': 'InnerThing',
    },
  },
  emptyAnyOf: {
    doc: 'a tagged anyOf whose value matches no branch is unresolved',
    root: 'FlexibleThing',
    documentValid: false,
    data: {},
    identities: {
      '/': 'unresolved(anyOf matched nothing) []',
    },
  },
  experimentalVariantInProduction: {
    doc: 'a valid local identity is kept when an outer constraint invalidates the document',
    root: 'ProductionVariantHost',
    documentValid: false,
    data: { environment: 'production', buttonVariant: { type: 'button', experimental: true } },
    identities: {
      '/buttonVariant': 'ButtonVariant:oneOf(ExperimentalButton)',
    },
  },
  standardVariantInProduction: {
    doc: 'the production-compliant variant resolves to its branch',
    root: 'ProductionVariantHost',
    documentValid: true,
    data: { environment: 'production', buttonVariant: { type: 'button', experimental: false } },
    identities: {
      '/buttonVariant': 'ButtonVariant:oneOf(StandardButton)',
    },
  },
  losingBranchChild: {
    doc: 'an annotated child inside a losing oneOf branch does not mount',
    root: 'ActionBranchHost',
    documentValid: true,
    data: { type: 'plain', action: { kind: 'noop' } },
    identities: {
      '/': 'ActionBranchHost:oneOf(PlainBranch)',
    },
  },
  conditionalPlacement: {
    doc: 'a component placed only behind if/then is not mounted (the walk cannot navigate it)',
    root: 'ConditionalHost',
    documentValid: true,
    data: { mode: 'fancy', trinket: { gem: 'ruby' } },
    identities: {},
  },
} satisfies Record<string, ComponentScenario>;
