export const scenarios = {
  normal: {
    environment: 'development',
    widget: { icon: 'save' },
    flexible: { text: 'hello', icon: 'star' },
    composed: { id: 'abc', createdAt: '2026-06-26', text: 'hello' },
    scaryWidget: { type: 'button', experimental: true },
  },
  scaryProduction: {
    environment: 'production',
    scaryWidget: { type: 'button', experimental: true },
  },
  scaryProductionFixed: {
    environment: 'production',
    scaryWidget: { type: 'button', experimental: false },
  },
  cursedA: {
    environment: 'development',
    cursedA: { type: 'button', text: 'hello', icon: 'star' },
  },
  cursedB: {
    environment: 'development',
    cursedB: { type: 'button', text: 'hello', icon: 'star', analytics: true },
  },
  cursedValid: {
    environment: 'development',
    cursedValid: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
  },
  ghost: {
    environment: 'development',
    ghostWidget: { type: 'button' },
  },
  invalidLocal: {
    environment: 'development',
    widget: { type: 'button' },
  },
  // #1: PlainBranch wins, but FancyBranch's annotated `action` child still fires a hit.
  ghostChild: {
    environment: 'development',
    ghostHost: { type: 'plain', action: { kind: 'noop' } },
  },
  // #2: untagged allOf composing two tagged wrappers.
  untaggedComposite: {
    environment: 'development',
    untaggedComposite: { kind: 'button', text: 'hello', icon: 'star', analytics: true },
  },
  // #4: container fails locally (missing `label`) while `inner` is valid.
  ancestorError: {
    environment: 'development',
    container: { inner: { ok: true } },
  },
  // Array descent: each gallery item is a Badge mounted at its index.
  arrayItems: {
    environment: 'development',
    gallery: [{ label: 'gold' }, { label: 'silver' }],
  },
  // Map descent: each registry value is a Badge mounted at its key.
  mapValues: {
    environment: 'development',
    registry: { primary: { label: 'gold' }, secondary: { label: 'silver' } },
  },
  // Empty anyOf: a tagged anyOf wrapper whose value matches no branch.
  emptyAnyOf: {
    environment: 'development',
    flexible: {},
  },
} as const;
