import { describe, expect, it } from 'vitest';

import { appCtx, describeIdentity, describeIdentities } from './harness.js';
import { buildTree, type MountIndex, scan } from '../index.js';

/*
 * Incremental re-analysis: given a prior tree and the paths that changed, buildTree
 * re-walks only the subtrees enclosing those paths (from the nearest $ref boundary)
 * and reuses the rest. Every test's fidelity gate is the same: the incremental result
 * must be identical to a full analysis of the new document. The reuse assertions prove
 * work was actually skipped (untouched mounts are the same object reference).
 *
 * The edits run deep in a tiny app (pages -> blocks -> resolver-supplied parameters), so the
 * boundaries fall on real app paths and the resolver participates in every re-walk.
 */
const home = (...blocks: unknown[]): unknown => ({
  name: 'Shop',
  defaultPage: 'Home',
  pages: [{ name: 'Home', blocks }],
});
const widgetBlock = (parameters: unknown): unknown => ({
  type: 'widget-block',
  version: '0.0.0',
  parameters,
});
const badgeBlock = (parameters: unknown): unknown => ({
  type: 'badge-list',
  version: '0.0.0',
  parameters,
});
// The parameters pointer for the block at `index` on the first page.
const params = (index: number, ...rest: (number | string)[]): (number | string)[] => [
  'pages',
  0,
  'blocks',
  index,
  'parameters',
  ...rest,
];

const objects = describeIdentities;

function byPath(tree: MountIndex): MountIndex['mounts'] {
  return tree.mounts;
}

describe('incremental re-analysis', () => {
  it('should re-walk only the changed subtree and match a full analysis', () => {
    const v1 = home(badgeBlock({ gallery: [{ label: 'gold' }, { label: 'silver' }] }));
    const treeV1 = buildTree(appCtx, v1);

    const v2 = home(badgeBlock({ gallery: [{ label: 'platinum' }, { label: 'silver' }] }));
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'gallery', 0, 'label')],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));

    // The untouched sibling is reused verbatim; the edited badge is re-walked fresh.
    const before = byPath(treeV1);
    const after = byPath(incremental);
    expect(after.get('/pages/0/blocks/0/parameters/gallery/1')).toBe(
      before.get('/pages/0/blocks/0/parameters/gallery/1'),
    );
    expect(after.get('/pages/0/blocks/0/parameters/gallery/0')).not.toBe(
      before.get('/pages/0/blocks/0/parameters/gallery/0'),
    );
  });

  it('should capture an identity change inside the re-walked boundary', () => {
    const v1 = home(widgetBlock({ widget: { icon: 'save' } }));
    const treeV1 = buildTree(appCtx, v1);
    expect(
      describeIdentity(treeV1.mounts.get('/pages/0/blocks/0/parameters/widget')!.identity),
    ).toBe('Widget:oneOf(IconWidget)');

    const v2 = home(widgetBlock({ widget: { text: 'hi' } }));
    const incremental = buildTree(appCtx, v2, { previous: treeV1, changed: [params(0, 'widget')] });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));
    expect(
      describeIdentity(incremental.mounts.get('/pages/0/blocks/0/parameters/widget')!.identity),
    ).toBe('Widget:oneOf(TextWidget)');
  });

  it('should add and drop children as the changed subtree grows and shrinks', () => {
    const one = home(badgeBlock({ gallery: [{ label: 'gold' }] }));
    const two = home(badgeBlock({ gallery: [{ label: 'gold' }, { label: 'silver' }] }));

    const treeOne = buildTree(appCtx, one);
    const grown = buildTree(appCtx, two, { previous: treeOne, changed: [params(0, 'gallery')] });
    expect(objects(grown)).toStrictEqual(objects(buildTree(appCtx, two)));
    expect(grown.mounts.has('/pages/0/blocks/0/parameters/gallery/1')).toBe(true);

    const shrunk = buildTree(appCtx, one, { previous: grown, changed: [params(0, 'gallery')] });
    expect(objects(shrunk)).toStrictEqual(objects(buildTree(appCtx, one)));
    // The stale second badge must not survive the shrink.
    expect(shrunk.mounts.has('/pages/0/blocks/0/parameters/gallery/1')).toBe(false);
  });

  it('should read fresh values for reused ancestors above the edit', () => {
    const v1 = home(badgeBlock({ gallery: [{ label: 'gold' }, { label: 'silver' }] }));
    const treeV1 = buildTree(appCtx, v1);

    const v2 = home(badgeBlock({ gallery: [{ label: 'platinum' }, { label: 'silver' }] }));
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'gallery', 0, 'label')],
    });

    // The gallery mount is reused (identity unchanged) but its value subtree changed; values are
    // derived through the tree, so the read must reflect v2, not the previous document.
    const galleryPath = params(0, 'gallery');
    expect(byPath(incremental).get('/pages/0/blocks/0/parameters/gallery')).toBeDefined();
    expect(incremental.valueAt(galleryPath)).toStrictEqual([
      { label: 'platinum' },
      { label: 'silver' },
    ]);
    expect(treeV1.valueAt(galleryPath)).toStrictEqual([{ label: 'gold' }, { label: 'silver' }]);
  });

  it('should handle multiple changed paths and reuse everything else', () => {
    const v1 = home(
      widgetBlock({
        widget: { icon: 'save' },
        composed: { id: 'a', createdAt: '2026-06-26', text: 'y' },
      }),
      badgeBlock({ gallery: [{ label: 'gold' }] }),
    );
    const treeV1 = buildTree(appCtx, v1);

    const v2 = home(
      widgetBlock({
        widget: { text: 'now' },
        composed: { id: 'a', createdAt: '2026-06-26', text: 'y' },
      }),
      badgeBlock({ gallery: [{ label: 'silver' }] }),
    );
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'widget'), params(1, 'gallery', 0, 'label')],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));
    // The untouched composed subtree is reused verbatim.
    expect(byPath(incremental).get('/pages/0/blocks/0/parameters/composed')).toBe(
      byPath(treeV1).get('/pages/0/blocks/0/parameters/composed'),
    );
  });

  it('should collapse overlapping changed paths to the outer boundary', () => {
    const v1 = home(badgeBlock({ gallery: [{ label: 'gold' }, { label: 'silver' }] }));
    const treeV1 = buildTree(appCtx, v1);

    const v2 = home(badgeBlock({ gallery: [{ label: 'bronze' }] }));
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'gallery'), params(0, 'gallery', 0, 'label')],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));
  });

  // Regression: array indices arrive as numbers from a caller's diff but strings from
  // the walk; a removed nested language component under a numeric-index boundary must still be
  // dropped (path containment compares by value, not JS type).
  it('should drop a nested language component removed under an array-index boundary', () => {
    const v1 = home(badgeBlock({ holders: [{ text: 'a', badge: { label: 'x' } }] }));
    const treeV1 = buildTree(appCtx, v1);
    expect(treeV1.mounts.has('/pages/0/blocks/0/parameters/holders/0/badge')).toBe(true);

    const v2 = home(badgeBlock({ holders: [{ text: 'a' }] }));
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'holders', 0, 'badge')],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));
    expect(incremental.mounts.has('/pages/0/blocks/0/parameters/holders/0/badge')).toBe(false);
  });

  // Regression: a changed path pointing at a removed array element must not re-emit a
  // phantom language component; the boundary stops at the enclosing array.
  it('should not re-emit a phantom language component for a removed array element', () => {
    const v1 = home(badgeBlock({ gallery: [{ label: 'a' }, { label: 'b' }] }));
    const treeV1 = buildTree(appCtx, v1);

    const v2 = home(badgeBlock({ gallery: [{ label: 'a' }] }));
    const incremental = buildTree(appCtx, v2, {
      previous: treeV1,
      changed: [params(0, 'gallery', 1)],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(appCtx, v2)));
    expect(incremental.mounts.has('/pages/0/blocks/0/parameters/gallery/1')).toBe(false);
  });

  it('should match a full analyze() through the combined result too', () => {
    const v1 = home(widgetBlock({ widget: { icon: 'save' } }));
    const full1 = scan(appCtx, v1);

    const v2 = home(widgetBlock({ widget: { text: 'hi' } }));
    const incremental = scan(appCtx, v2, { previous: full1, changed: [params(0, 'widget')] });
    const full2 = scan(appCtx, v2);

    expect(objects(incremental)).toStrictEqual(objects(full2));
    expect(incremental.documentValid).toBe(full2.documentValid);
  });
});
