import { type Schema } from 'jsonschema';

import { LanguageComponent } from '../index.js';

// The obj/combinator builders delegate tagging to LanguageComponent.define rather than inlining an
// `x-appsemble-language-component` literal, so there is a single tagging path. The mode is inferred from
// the shape each builder constructs (object vs a single oneOf/anyOf/allOf), which is
// unambiguous; LanguageComponent.define's inference is covered directly in language-component/binding.test.ts.

function ref(name: string): Schema {
  return { $ref: `#/components/schemas/${name}` };
}

function refs(...names: string[]): Schema[] {
  return names.map(ref);
}

// A tagged object language component: `obj(name, required, properties, extra?)`. `extra` carries
// the occasional `additionalProperties: false`.
function obj(
  name: string,
  required: string[],
  properties: Record<string, Schema>,
  extra: Partial<Schema> = {},
): Schema {
  return LanguageComponent.define(name, { type: 'object', ...extra, required, properties }, {})
    .schema;
}

// A tagged combinator language component: `combinator(name, 'oneOf' | 'anyOf' | 'allOf', members)`.
function combinator(name: string, mode: 'oneOf' | 'anyOf' | 'allOf', members: Schema[]): Schema {
  return LanguageComponent.define(name, { [mode]: members }, {}).schema;
}

export const TextWidget = obj('TextWidget', ['text'], { text: { type: 'string' } });

export const IconWidget = obj('IconWidget', ['icon'], { icon: { type: 'string' } });

export const ButtonWidget = obj('ButtonWidget', ['type', 'text'], {
  type: { const: 'button' },
  text: { type: 'string' },
  color: { enum: ['primary', 'danger'] },
});

export const Trackable = obj('Trackable', ['analytics'], { analytics: { type: 'boolean' } });

export const Identified = obj('Identified', ['id'], { id: { type: 'string' } });

export const Timestamped = obj('Timestamped', ['createdAt'], { createdAt: { type: 'string' } });

// StandardButton and ExperimentalButton are identical but for the `experimental`
// discriminator — generated from one builder so the only difference is the const.
const variantButton = (name: string, experimental: boolean): Schema =>
  obj(
    name,
    ['type', 'experimental'],
    { type: { const: 'button' }, experimental: { const: experimental } },
    { additionalProperties: false },
  );

export const StandardButton = variantButton('StandardButton', false);
export const ExperimentalButton = variantButton('ExperimentalButton', true);

export const Widget = combinator(
  'Widget',
  'oneOf',
  refs('ButtonWidget', 'TextWidget', 'IconWidget'),
);

export const FlexibleThing = combinator(
  'FlexibleThing',
  'anyOf',
  refs('TextWidget', 'IconWidget', 'Trackable'),
);

export const StoredText = combinator(
  'StoredText',
  'allOf',
  refs('Identified', 'Timestamped', 'TextWidget'),
);

export const TextAndIcon = combinator('TextAndIcon', 'allOf', refs('TextWidget', 'IconWidget'));

export const AmbiguousButton = combinator(
  'AmbiguousButton',
  'oneOf',
  refs('ButtonWidget', 'TextAndIcon'),
);

export const ButtonOrText = combinator('ButtonOrText', 'oneOf', refs('ButtonWidget', 'TextWidget'));

export const IconOrTrackable = combinator(
  'IconOrTrackable',
  'anyOf',
  refs('IconWidget', 'Trackable'),
);

export const AmbiguousControl = combinator(
  'AmbiguousControl',
  'allOf',
  refs('ButtonOrText', 'IconOrTrackable'),
);

export const StrictButtonOrText = combinator('StrictButtonOrText', 'oneOf', [
  obj('StrictButton', ['kind', 'text'], { kind: { const: 'button' }, text: { type: 'string' } }),
  obj('StrictText', ['kind', 'text'], { kind: { const: 'text' }, text: { type: 'string' } }),
]);

export const StrictIconOrTrackable = combinator(
  'StrictIconOrTrackable',
  'anyOf',
  refs('IconWidget', 'Trackable'),
);

export const ResolvedComposite = combinator('ResolvedComposite', 'allOf', [
  StrictButtonOrText,
  StrictIconOrTrackable,
]);

// DuplicateButtonA and DuplicateButtonB are byte-identical on purpose (an
// indistinguishable oneOf) — generated from one builder so their sameness is by
// construction, not by hand-copied literals.
const duplicateButton = (name: string): Schema =>
  obj(name, ['type'], { type: { const: 'button' } }, { additionalProperties: false });

export const DuplicateButtonA = duplicateButton('DuplicateButtonA');
export const DuplicateButtonB = duplicateButton('DuplicateButtonB');

export const DuplicateVariant = combinator('DuplicateVariant', 'oneOf', [
  DuplicateButtonA,
  DuplicateButtonB,
]);

export const ButtonVariant = combinator(
  'ButtonVariant',
  'oneOf',
  refs('StandardButton', 'ExperimentalButton'),
);

// --- Gap repro schemas (drive the deliberately-failing tests) ---

// #1 losing-branch child: an annotated child inside a oneOf branch that loses (must not mount).
export const BranchAction = obj('BranchAction', ['kind'], { kind: { type: 'string' } });

export const FancyBranch = obj('FancyBranch', ['type'], {
  type: { const: 'fancy' },
  action: ref('BranchAction'),
});

export const PlainBranch = obj('PlainBranch', ['type'], { type: { const: 'plain' } });

export const ActionBranchHost = combinator(
  'ActionBranchHost',
  'oneOf',
  refs('FancyBranch', 'PlainBranch'),
);

// #4 ancestor errors: a valid inner object under a container that fails locally.
export const InnerThing = obj('InnerThing', ['ok'], { ok: { type: 'boolean' } });

export const Container = obj('Container', ['inner', 'label'], {
  inner: ref('InnerThing'),
  label: { type: 'string' },
});

// An untagged combinator composing two tagged wrappers: transparent, so it surfaces its parts as a
// composite instead of collapsing to the first wrapper.
export const UntaggedComposite = {
  allOf: [ref('StrictButtonOrText'), ref('StrictIconOrTrackable')],
} satisfies Schema;

// AnyOf short-circuit: a language component that only the SECOND branch introduces.
export const Badge = obj('Badge', ['label'], { label: { type: 'string' } });

export const BadgeHolder = obj('BadgeHolder', ['text', 'badge'], {
  text: { type: 'string' },
  badge: ref('Badge'),
});

// TextWidget matches first and the validator short-circuits, so BadgeHolder (and the
// Badge inside it) is never evaluated during hit collection.
export const Host = combinator('Host', 'anyOf', refs('TextWidget', 'BadgeHolder'));

// Array descent: a tagged array whose items are language components. Exercises the walk
// descending numeric keys via `items`, and the ref-cutoff's items strip.
export const Gallery = {
  'x-appsemble-language-component': { name: 'Gallery', mode: 'single' },
  type: 'array',
  items: ref('Badge'),
} satisfies Schema;

// Map descent: an open object whose values are language components. Exercises the walk
// descending arbitrary keys via `additionalProperties`, and its ref-cutoff strip.
export const Registry = {
  'x-appsemble-language-component': { name: 'Registry', mode: 'single' },
  type: 'object',
  additionalProperties: ref('Badge'),
} satisfies Schema;

// Conditional placement: Trinket only exists in the `then` branch, which the
// structural walk cannot navigate but the validator (and so a hit) reaches.
export const Trinket = obj('Trinket', ['gem'], { gem: { type: 'string' } });

export const ConditionalHost = {
  type: 'object',
  properties: {
    mode: { enum: ['fancy', 'plain'] },
  },
  if: {
    required: ['mode'],
    properties: { mode: { const: 'fancy' } },
  },
  then: {
    properties: { trinket: ref('Trinket') },
  },
} satisfies Schema;

// Production gate: environment=production forces the button variant non-experimental. Exercises the
// outer-if/then case (local identity kept while the document is invalid) as its own root component.
export const ProductionVariantHost = {
  type: 'object',
  properties: {
    environment: { enum: ['development', 'production'] },
    buttonVariant: ref('ButtonVariant'),
  },
  if: { properties: { environment: { const: 'production' } } },
  then: { properties: { buttonVariant: { properties: { experimental: { const: false } } } } },
} satisfies Schema;

// --- The tiny Appsemble app (the walk's realistic happy path) ---
//
// A subset of the real app definition (packages/lang-sdk/schemas/{AppDefinition,PageDefinition,
// BlockDefinition}.ts): an app owns pages, a page owns blocks, a block names a type+version. A
// block's `parameters` schema is not in the definition — it is resolved per block from the block
// manifest by `type@version` (the `dynamicChild` hook in harness.ts), so no parameter union is ever
// walked. The two block manifests below stand in for fetched manifests.

// The widget-block parameters: the oneOf/anyOf/allOf trio under one block's `parameters`.
export const WidgetBlockParams = obj('WidgetBlockParams', [], {
  widget: ref('Widget'),
  flexible: ref('FlexibleThing'),
  composed: ref('StoredText'),
});

// The badge-list parameters: array, map, and inline-array descent under one block's `parameters`.
export const BadgeListBlockParams = obj('BadgeListBlockParams', [], {
  gallery: ref('Gallery'),
  registry: ref('Registry'),
  holders: { type: 'array', items: ref('BadgeHolder') },
});

// The real BlockDefinition keeps `parameters` as a free-form property; here the typed parameter
// schema is left out on purpose, so only the manifest resolver reaches it (see harness.ts).
export const BlockDefinition = obj('BlockDefinition', ['type', 'version'], {
  type: { type: 'string' },
  version: { type: 'string' },
  onClick: ref('ActionDefinition'),
});

export const LinkActionDefinition = obj('LinkActionDefinition', ['type', 'to'], {
  type: { const: 'link' },
  to: { type: 'string' },
});

export const DialogActionDefinition = obj('DialogActionDefinition', ['type'], {
  type: { const: 'dialog' },
});

// The real action shape: a tagged allOf of shared base properties and an anonymous discriminated
// union, so the kind of action sits below the node's own name.
export const ActionDefinition = LanguageComponent.define(
  'ActionDefinition',
  {
    allOf: [
      { type: 'object', properties: { remapBefore: { type: 'string' } } },
      {
        anyOf: refs('LinkActionDefinition', 'DialogActionDefinition'),
        discriminator: { propertyName: 'type' },
      } as Schema,
    ],
  },
  {},
).schema;

export const PageDefinition = obj('PageDefinition', ['name', 'blocks'], {
  name: { type: 'string' },
  blocks: { type: 'array', items: ref('BlockDefinition') },
});

export const FlowPageDefinition = obj('FlowPageDefinition', ['name', 'type', 'steps'], {
  name: { type: 'string' },
  type: { const: 'flow' },
  steps: { type: 'array', items: ref('PageDefinition') },
});

export const Root = obj('AppDefinition', ['name', 'defaultPage', 'pages'], {
  name: { type: 'string' },
  defaultPage: { type: 'string' },
  // The real page list: an anonymous union discriminated by `type`, where a basic page has none.
  pages: {
    type: 'array',
    items: {
      'x-appsemble-discriminator': {
        propertyNames: ['type'],
        default: 'basic',
        mapping: { basic: '#/components/schemas/PageDefinition' },
      },
      anyOf: refs('PageDefinition', 'FlowPageDefinition'),
    } as Schema,
  },
});

export const miniSchemas = {
  ActionBranchHost,
  ActionDefinition,
  AmbiguousButton,
  AmbiguousControl,
  Badge,
  BadgeHolder,
  BadgeListBlockParams,
  BlockDefinition,
  BranchAction,
  ButtonOrText,
  ButtonVariant,
  ButtonWidget,
  ConditionalHost,
  Container,
  DialogActionDefinition,
  DuplicateButtonA,
  DuplicateButtonB,
  DuplicateVariant,
  ExperimentalButton,
  FancyBranch,
  FlexibleThing,
  FlowPageDefinition,
  Gallery,
  Host,
  IconOrTrackable,
  IconWidget,
  Identified,
  InnerThing,
  LinkActionDefinition,
  PageDefinition,
  PlainBranch,
  ProductionVariantHost,
  Registry,
  ResolvedComposite,
  Root,
  StandardButton,
  StoredText,
  StrictButtonOrText,
  StrictIconOrTrackable,
  TextAndIcon,
  TextWidget,
  Timestamped,
  Trackable,
  Trinket,
  UntaggedComposite,
  Widget,
  WidgetBlockParams,
} satisfies Record<string, Schema>;
