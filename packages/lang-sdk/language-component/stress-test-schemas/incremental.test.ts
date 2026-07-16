import { describe, expect, it } from 'vitest';

import { describeIdentity, describeIdentities } from './harness.js';
import { miniSchemas } from './schemas.js';
import { buildTree, LanguageCtx, type MountIndex, scan } from '../index.js';

/*
 * Incremental re-analysis: given a prior tree and the paths that changed, buildTree
 * re-walks only the subtrees enclosing those paths (from the nearest $ref boundary)
 * and reuses the rest. Every test's fidelity gate is the same: the incremental result
 * must be identical to a full analysis of the new document. The reuse assertions prove
 * work was actually skipped (untouched mounts are the same object reference).
 */
const ctx = LanguageCtx.compile(miniSchemas, 'Root');

const objects = describeIdentities;

function byPath(tree: MountIndex): MountIndex['mounts'] {
  return tree.mounts;
}

describe('incremental re-analysis', () => {
  it('should re-walk only the changed subtree and match a full analysis', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = buildTree(ctx, v1);

    const v2 = {
      environment: 'development',
      gallery: [{ label: 'platinum' }, { label: 'silver' }],
    };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));

    // The untouched sibling is reused verbatim; the edited badge is re-walked fresh.
    const before = byPath(treeV1);
    const after = byPath(incremental);
    expect(after.get('/gallery/1')).toBe(before.get('/gallery/1'));
    expect(after.get('/gallery/0')).not.toBe(before.get('/gallery/0'));
  });

  it('should capture an identity change inside the re-walked boundary', () => {
    const v1 = { environment: 'development', widget: { icon: 'save' } };
    const treeV1 = buildTree(ctx, v1);
    expect(describeIdentity(treeV1.mounts.get('/widget')!.identity)).toBe(
      'Widget:oneOf(IconWidget)',
    );

    const v2 = { environment: 'development', widget: { text: 'hi' } };
    const incremental = buildTree(ctx, v2, { previous: treeV1, changed: [['widget']] });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));
    expect(describeIdentity(incremental.mounts.get('/widget')!.identity)).toBe(
      'Widget:oneOf(TextWidget)',
    );
  });

  it('should add and drop children as the changed subtree grows and shrinks', () => {
    const one = { environment: 'development', gallery: [{ label: 'gold' }] };
    const two = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };

    const treeOne = buildTree(ctx, one);
    const grown = buildTree(ctx, two, { previous: treeOne, changed: [['gallery']] });
    expect(objects(grown)).toStrictEqual(objects(buildTree(ctx, two)));
    expect(grown.mounts.has('/gallery/1')).toBe(true);

    const shrunk = buildTree(ctx, one, { previous: grown, changed: [['gallery']] });
    expect(objects(shrunk)).toStrictEqual(objects(buildTree(ctx, one)));
    // The stale second badge must not survive the shrink.
    expect(shrunk.mounts.has('/gallery/1')).toBe(false);
  });

  it('should read fresh values for reused ancestors above the edit', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = buildTree(ctx, v1);

    const v2 = {
      environment: 'development',
      gallery: [{ label: 'platinum' }, { label: 'silver' }],
    };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['gallery', 0, 'label']],
    });

    // /gallery is reused (identity unchanged) but its value subtree changed; values are
    // derived through the tree, so the read must reflect v2, not the previous document.
    expect(byPath(incremental).get('/gallery')).toBeDefined();
    expect(incremental.valueAt(['gallery'])).toStrictEqual(v2.gallery);
    expect(treeV1.valueAt(['gallery'])).toStrictEqual(v1.gallery);
  });

  it('should handle multiple changed paths and reuse everything else', () => {
    const v1 = {
      environment: 'development',
      widget: { icon: 'save' },
      gallery: [{ label: 'gold' }],
      composed: { id: 'a', createdAt: '2026-06-26', text: 'y' },
    };
    const treeV1 = buildTree(ctx, v1);

    const v2 = { ...v1, widget: { text: 'now' }, gallery: [{ label: 'silver' }] };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['widget'], ['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));
    // The untouched composed subtree is reused verbatim.
    expect(byPath(incremental).get('/composed')).toBe(byPath(treeV1).get('/composed'));
  });

  it('should collapse overlapping changed paths to the outer boundary', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = buildTree(ctx, v1);

    const v2 = { environment: 'development', gallery: [{ label: 'bronze' }] };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['gallery'], ['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));
  });

  // Regression: array indices arrive as numbers from a caller's diff but strings from
  // the walk; a removed nested language component under a numeric-index boundary must still be
  // dropped (path containment compares by value, not JS type).
  it('should drop a nested language component removed under an array-index boundary', () => {
    const v1 = { environment: 'development', holders: [{ text: 'a', badge: { label: 'x' } }] };
    const treeV1 = buildTree(ctx, v1);
    expect(treeV1.mounts.has('/holders/0/badge')).toBe(true);

    const v2 = { environment: 'development', holders: [{ text: 'a' }] };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['holders', 0, 'badge']],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));
    expect(incremental.mounts.has('/holders/0/badge')).toBe(false);
  });

  // Regression: a changed path pointing at a removed array element must not re-emit a
  // phantom language component; the boundary stops at the enclosing array.
  it('should not re-emit a phantom language component for a removed array element', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'a' }, { label: 'b' }] };
    const treeV1 = buildTree(ctx, v1);

    const v2 = { environment: 'development', gallery: [{ label: 'a' }] };
    const incremental = buildTree(ctx, v2, {
      previous: treeV1,
      changed: [['gallery', 1]],
    });

    expect(objects(incremental)).toStrictEqual(objects(buildTree(ctx, v2)));
    expect(incremental.mounts.has('/gallery/1')).toBe(false);
  });

  it('should match a full analyze() through the combined result too', () => {
    const v1 = { environment: 'development', widget: { icon: 'save' } };
    const full1 = scan(ctx, v1);

    const v2 = { environment: 'development', widget: { text: 'hi' } };
    const incremental = scan(ctx, v2, { previous: full1, changed: [['widget']] });
    const full2 = scan(ctx, v2);

    expect(objects(incremental)).toStrictEqual(objects(full2));
    expect(incremental.documentValid).toBe(full2.documentValid);
  });
});
