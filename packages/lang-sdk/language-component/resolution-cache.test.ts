import { describe, expect, it } from 'vitest';

import { compileAppsembleDialect } from '../appsembleDialect.js';

const app = {
  name: 'T',
  defaultPage: 'P',
  pages: [{ name: 'P', blocks: [{ type: 'action-button', version: '0.0.0', parameters: {} }] }],
};

describe('resolution cache (3a)', () => {
  it('a fresh cursor over the same value reuses the cached Resolution', () => {
    const ctx = compileAppsembleDialect();
    const r1 = ctx.root(app).child('pages')!.child(0)!.resolve();
    // A brand-new cursor tree over the SAME value object (as a re-render would mint).
    const r2 = ctx.root(app).child('pages')!.child(0)!.resolve();
    expect(r2).toBe(r1); // same object identity → served from the ctx cache, not re-resolved
  });

  it('an edit elsewhere still reuses a structurally-shared subtree', () => {
    const ctx = compileAppsembleDialect();
    const page = app.pages[0];
    const before = ctx.root(app).child('pages')!.child(0)!.resolve();
    // Edit a sibling (name) immutably, sharing the pages array/object references.
    const edited = { ...app, name: 'T2' };
    const after = ctx.root(edited).child('pages')!.child(0)!.resolve();
    expect(after).toBe(before); // shared page object → cache hit despite the edit
    expect(edited.pages[0]).toBe(page);
  });
});
