import { type Schema } from 'jsonschema';

import { LanguageComponent } from '../index.js';

// The obj/combinator builders delegate tagging to LanguageComponent.define rather than inlining an
// `appsembleLanguageComponent` literal, so there is a single tagging path. The mode is inferred from
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

export const CursedA = combinator('CursedA', 'oneOf', refs('ButtonWidget', 'TextAndIcon'));

export const ButtonOrText = combinator('ButtonOrText', 'oneOf', refs('ButtonWidget', 'TextWidget'));

export const IconOrTrackable = combinator(
  'IconOrTrackable',
  'anyOf',
  refs('IconWidget', 'Trackable'),
);

export const CursedB = combinator('CursedB', 'allOf', refs('ButtonOrText', 'IconOrTrackable'));

export const StrictButtonOrText = combinator('StrictButtonOrText', 'oneOf', [
  obj('StrictButton', ['kind', 'text'], { kind: { const: 'button' }, text: { type: 'string' } }),
  obj('StrictText', ['kind', 'text'], { kind: { const: 'text' }, text: { type: 'string' } }),
]);

export const StrictIconOrTrackable = combinator(
  'StrictIconOrTrackable',
  'anyOf',
  refs('IconWidget', 'Trackable'),
);

export const CursedValid = combinator('CursedValid', 'allOf', [
  StrictButtonOrText,
  StrictIconOrTrackable,
]);

// StandardGhostButton and ExperimentalGhostButton are byte-identical on purpose (an
// indistinguishable oneOf) — generated from one builder so their sameness is by
// construction, not by hand-copied literals.
const ghostButton = (name: string): Schema =>
  obj(name, ['type'], { type: { const: 'button' } }, { additionalProperties: false });

export const StandardGhostButton = ghostButton('StandardGhostButton');
export const ExperimentalGhostButton = ghostButton('ExperimentalGhostButton');

export const GhostWidget = combinator('GhostWidget', 'oneOf', [
  StandardGhostButton,
  ExperimentalGhostButton,
]);

export const ScaryWidget = combinator(
  'ScaryWidget',
  'oneOf',
  refs('StandardButton', 'ExperimentalButton'),
);

// --- Gap repro schemas (drive the deliberately-failing tests) ---

// #1 ghost: an annotated child living inside a oneOf branch that loses.
export const GhostAction = obj('GhostAction', ['kind'], { kind: { type: 'string' } });

export const FancyBranch = obj('FancyBranch', ['type'], {
  type: { const: 'fancy' },
  action: ref('GhostAction'),
});

export const PlainBranch = obj('PlainBranch', ['type'], { type: { const: 'plain' } });

export const GhostHost = combinator('GhostHost', 'oneOf', refs('FancyBranch', 'PlainBranch'));

// #4 ancestor errors: a valid inner object under a container that fails locally.
export const InnerThing = obj('InnerThing', ['ok'], { ok: { type: 'boolean' } });

export const Container = obj('Container', ['inner', 'label'], {
  inner: ref('InnerThing'),
  label: { type: 'string' },
});

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
  appsembleLanguageComponent: { name: 'Gallery', mode: 'single' },
  type: 'array',
  items: ref('Badge'),
} satisfies Schema;

// Map descent: an open object whose values are language components. Exercises the walk
// descending arbitrary keys via `additionalProperties`, and its ref-cutoff strip.
export const Registry = {
  appsembleLanguageComponent: { name: 'Registry', mode: 'single' },
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

export const Root = {
  type: 'object',
  properties: {
    environment: { enum: ['development', 'production'] },
    widget: ref('Widget'),
    flexible: ref('FlexibleThing'),
    composed: ref('StoredText'),
    cursedA: ref('CursedA'),
    cursedB: ref('CursedB'),
    cursedValid: ref('CursedValid'),
    ghostWidget: ref('GhostWidget'),
    scaryWidget: ref('ScaryWidget'),
    // #1 ghost interpretation from a losing branch.
    ghostHost: ref('GhostHost'),
    // #2 untagged combinator composing two tagged wrappers.
    untaggedComposite: { allOf: [ref('StrictButtonOrText'), ref('StrictIconOrTrackable')] },
    // #4 ancestor error over-attachment.
    container: ref('Container'),
    // AnyOf short-circuit divergence between hits and walk.
    host: ref('Host'),
    // Array and map descent: language components mounted at indices / arbitrary keys.
    gallery: ref('Gallery'),
    registry: ref('Registry'),
    // Inline array of holders: an array index (numeric) is the boundary, and each
    // holder owns an optional nested language component that an edit can add or drop.
    holders: { type: 'array', items: ref('BadgeHolder') },
    // Conditional-applicator placement the structural walk cannot reach.
    condHost: ref('ConditionalHost'),
  },
  if: {
    properties: { environment: { const: 'production' } },
  },
  then: {
    properties: {
      scaryWidget: {
        properties: {
          experimental: { const: false },
        },
      },
    },
  },
} satisfies Schema;

export const miniSchemas = {
  Badge,
  BadgeHolder,
  ButtonOrText,
  ButtonWidget,
  ConditionalHost,
  Container,
  CursedA,
  CursedB,
  CursedValid,
  ExperimentalButton,
  ExperimentalGhostButton,
  FancyBranch,
  FlexibleThing,
  Gallery,
  GhostAction,
  GhostHost,
  GhostWidget,
  Host,
  IconOrTrackable,
  IconWidget,
  Identified,
  InnerThing,
  PlainBranch,
  Registry,
  Root,
  ScaryWidget,
  StandardButton,
  StandardGhostButton,
  StoredText,
  StrictButtonOrText,
  StrictIconOrTrackable,
  TextAndIcon,
  TextWidget,
  Timestamped,
  Trackable,
  Trinket,
  Widget,
} satisfies Record<string, Schema>;
