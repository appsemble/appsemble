import { describe, expect, it } from 'vitest';

import { appDefinitionValidationDef } from './appsembleDialect.js';
import { type AppDefinition } from './types/core.js';

/*
 * The AppDefinition binding wraps the shipped `validateAppDefinition` (untouched, still the source of
 * truth for server/CLI/studio) so the GUI editor can dispatch it as an async node binding. The binding
 * reads only `node.val`, so it is exercised directly here without compiling the full real dialect.
 * Each returned Diagnostic keeps the vAD error's own path, so the consumer places it on the right node.
 */

const def = appDefinitionValidationDef();

// An otherwise-fine app whose defaultPage names a page that does not exist — a semantic error only
// `validateAppDefinition` catches (JSON schema alone cannot), pinned to `defaultPage` by the reporter.
const app = {
  name: 'Test',
  defaultPage: 'Missing',
  pages: [{ name: 'Home', blocks: [] }],
} as unknown as AppDefinition;

describe('AppDefinition binding wraps validateAppDefinition', () => {
  it('awaits vAD and returns path-bearing diagnostics for a semantic error', async () => {
    const diagnostics = await def.binding.validate!({ val: app } as never, {
      getBlockVersions: () => [],
    });

    expect(diagnostics).toContainEqual({
      message: 'does not refer to an existing page',
      path: ['defaultPage'],
    });
  });

  it('reaches block manifests through the injected context getter', async () => {
    let asked = false;
    await def.binding.validate!({ val: app } as never, {
      getBlockVersions(blocks) {
        asked = true;
        expect(Array.isArray(blocks)).toBe(true);
        return [];
      },
    });

    expect(asked).toBe(true);
  });
});
