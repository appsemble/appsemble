import { describe, expect, it } from 'vitest';

import { describeIdentity, describeIdentities } from './harness.js';
import { miniSchemas, Root } from './schemas.js';
import { Scanner, type MountTree } from '../index.js';

/*
 * Incremental re-analysis: given a prior tree and the paths that changed, buildTree
 * re-walks only the subtrees enclosing those paths (from the nearest $ref boundary)
 * and reuses the rest. Every test's fidelity gate is the same: the incremental result
 * must be identical to a full analysis of the new document. The reuse assertions prove
 * work was actually skipped (untouched interpretations are the same object reference).
 */
const analyzer = new Scanner(miniSchemas);

const objects = describeIdentities;

function byPath(tree: MountTree): MountTree['interpretations'] {
  return tree.interpretations;
}

describe('incremental re-analysis', () => {
  it('should re-walk only the changed subtree and match a full analysis', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = {
      environment: 'development',
      gallery: [{ label: 'platinum' }, { label: 'silver' }],
    };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));

    // The untouched sibling is reused verbatim; the edited badge is re-walked fresh.
    const before = byPath(treeV1);
    const after = byPath(incremental);
    expect(after.get('/gallery/1')).toBe(before.get('/gallery/1'));
    expect(after.get('/gallery/0')).not.toBe(before.get('/gallery/0'));
  });

  it('should capture an identity change inside the re-walked boundary', () => {
    const v1 = { environment: 'development', widget: { icon: 'save' } };
    const treeV1 = analyzer.buildTree(v1, Root);
    expect(describeIdentity(treeV1.interpretations.get('/widget')!.identity)).toBe(
      'Widget:oneOf(IconWidget)',
    );

    const v2 = { environment: 'development', widget: { text: 'hi' } };
    const incremental = analyzer.buildTree(v2, Root, { previous: treeV1, changed: [['widget']] });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));
    expect(describeIdentity(incremental.interpretations.get('/widget')!.identity)).toBe(
      'Widget:oneOf(TextWidget)',
    );
  });

  it('should add and drop children as the changed subtree grows and shrinks', () => {
    const one = { environment: 'development', gallery: [{ label: 'gold' }] };
    const two = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };

    const treeOne = analyzer.buildTree(one, Root);
    const grown = analyzer.buildTree(two, Root, { previous: treeOne, changed: [['gallery']] });
    expect(objects(grown)).toStrictEqual(objects(analyzer.buildTree(two, Root)));
    expect(grown.interpretations.has('/gallery/1')).toBe(true);

    const shrunk = analyzer.buildTree(one, Root, { previous: grown, changed: [['gallery']] });
    expect(objects(shrunk)).toStrictEqual(objects(analyzer.buildTree(one, Root)));
    // The stale second badge must not survive the shrink.
    expect(shrunk.interpretations.has('/gallery/1')).toBe(false);
  });

  it('should refresh the value of reused ancestors above the edit', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = {
      environment: 'development',
      gallery: [{ label: 'platinum' }, { label: 'silver' }],
    };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['gallery', 0, 'label']],
    });

    // /gallery is reused (identity unchanged) but its value subtree changed, so its
    // value must reflect v2, not the previous document.
    const gallery = byPath(incremental).get('/gallery')!;
    expect(gallery.value).toStrictEqual(v2.gallery);
  });

  it('should handle multiple changed paths and reuse everything else', () => {
    const v1 = {
      environment: 'development',
      widget: { icon: 'save' },
      gallery: [{ label: 'gold' }],
      composed: { id: 'a', createdAt: '2026-06-26', text: 'y' },
    };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = { ...v1, widget: { text: 'now' }, gallery: [{ label: 'silver' }] };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['widget'], ['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));
    // The untouched composed subtree is reused verbatim.
    expect(byPath(incremental).get('/composed')).toBe(byPath(treeV1).get('/composed'));
  });

  it('should collapse overlapping changed paths to the outer boundary', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'gold' }, { label: 'silver' }] };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = { environment: 'development', gallery: [{ label: 'bronze' }] };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['gallery'], ['gallery', 0, 'label']],
    });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));
  });

  // Regression: array indices arrive as numbers from a caller's diff but strings from
  // the walk; a removed nested language component under a numeric-index boundary must still be
  // dropped (path containment compares by value, not JS type).
  it('should drop a nested language component removed under an array-index boundary', () => {
    const v1 = { environment: 'development', holders: [{ text: 'a', badge: { label: 'x' } }] };
    const treeV1 = analyzer.buildTree(v1, Root);
    expect(treeV1.interpretations.has('/holders/0/badge')).toBe(true);

    const v2 = { environment: 'development', holders: [{ text: 'a' }] };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['holders', 0, 'badge']],
    });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));
    expect(incremental.interpretations.has('/holders/0/badge')).toBe(false);
  });

  // Regression: a changed path pointing at a removed array element must not re-emit a
  // phantom language component; the boundary stops at the enclosing array.
  it('should not re-emit a phantom language component for a removed array element', () => {
    const v1 = { environment: 'development', gallery: [{ label: 'a' }, { label: 'b' }] };
    const treeV1 = analyzer.buildTree(v1, Root);

    const v2 = { environment: 'development', gallery: [{ label: 'a' }] };
    const incremental = analyzer.buildTree(v2, Root, {
      previous: treeV1,
      changed: [['gallery', 1]],
    });

    expect(objects(incremental)).toStrictEqual(objects(analyzer.buildTree(v2, Root)));
    expect(incremental.interpretations.has('/gallery/1')).toBe(false);
  });

  it('should match a full analyze() through the combined result too', () => {
    const v1 = { environment: 'development', widget: { icon: 'save' } };
    const full1 = analyzer.scan(v1, Root);

    const v2 = { environment: 'development', widget: { text: 'hi' } };
    const incremental = analyzer.scan(v2, Root, { previous: full1, changed: [['widget']] });
    const full2 = analyzer.scan(v2, Root);

    expect(objects(incremental)).toStrictEqual(objects(full2));
    expect(incremental.documentValid).toBe(full2.documentValid);
  });
});
