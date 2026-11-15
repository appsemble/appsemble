import { type Schema } from 'jsonschema';

import { type IdentifiableBlock } from './blockUtils.js';
import { type BlockManifest } from './types/index.js';

/**
 * The block-registry port: how a consumer resolves and discovers blocks, injected by the host (studio
 * from its store, vscode/CLI from the configured server, a demo from a static map). lang-sdk owns the
 * shape and the pure manifest→schema derivations below; the concrete fetch/cache/persistence adapter
 * is the consumer's — it does I/O, which lang-sdk stays free of. `resolve` covers the block's own
 * identity (`getManifest`); `discover` covers browsing what else is available (`listBlocks`/`listVersions`).
 */
export interface BlockRegistry {
  // Resolve one block's manifest, or null when it can't be found. Async: a real adapter fetches
  // `/api/blocks/{name}/versions/{version}`; a sync facade over its cache is what feeds `dynamicChild`.
  getManifest: (block: IdentifiableBlock) => Promise<BlockManifest | null>;
  // Discovery: the blocks a host offers (for suggesting/adding), and the versions of one block.
  listBlocks: () => Promise<IdentifiableBlock[]>;
  listVersions: (type: string) => Promise<readonly string[]>;
}

// A block's parameters schema, straight off the manifest (null when the block takes no parameters). The
// GUI edits a block's `parameters` against this via the `dynamicChild` hook.
export function blockParametersSchema(manifest: BlockManifest): Schema | null {
  return manifest.parameters ?? null;
}

/**
 * Synthesize the schema for a block's `actions` mapping from its manifest: an object whose keys are the
 * action names the block declares (each an object slot for an action definition). `$any` becomes an
 * open `additionalProperties` slot; otherwise the map is closed. Empty (`{}`) when the block declares no
 * actions. Pure — the manifest's declared action set drives it.
 *
 * @param manifest The block manifest whose declared actions drive the schema.
 * @returns The synthesized schema for the block's `actions` mapping.
 */
export function blockActionsSchema(manifest: BlockManifest): Schema {
  if (!manifest.actions) {
    return {};
  }
  const properties: Record<string, Schema> = {};
  let additionalProperties: Schema | boolean = false;
  for (const [name, action] of Object.entries(manifest.actions)) {
    const slot: Schema = { type: 'object', description: action.description ?? '' };
    if (name === '$any') {
      additionalProperties = { type: 'object', description: action.description ?? 'Any action' };
    } else {
      properties[name] = slot;
    }
  }
  return { type: 'object', properties, additionalProperties };
}

/**
 * Synthesize the schema for a block's `events` mapping (`emit`/`listen`) from its manifest: each declared
 * event name is a string slot bound to an app-level event. `listen.$any` opens `additionalProperties`.
 * Empty (`{}`) when the block declares no events. Pure.
 *
 * @param manifest The block manifest whose declared events drive the schema.
 * @returns The synthesized schema for the block's `events` mapping.
 */
export function blockEventsSchema(manifest: BlockManifest): Schema {
  if (!manifest.events) {
    return {};
  }
  const emit: Record<string, Schema> = {};
  const listen: Record<string, Schema> = {};
  let listenAdditional: Schema | boolean = false;
  for (const [name, event] of Object.entries(manifest.events.emit ?? {})) {
    emit[name] = { type: 'string', description: event.description ?? '' };
  }
  for (const [name, event] of Object.entries(manifest.events.listen ?? {})) {
    if (name === '$any') {
      listenAdditional = { type: 'string', description: event.description ?? 'Any event' };
    } else {
      listen[name] = { type: 'string', description: event.description ?? '' };
    }
  }
  return {
    type: 'object',
    properties: {
      emit: { type: 'object', properties: emit },
      listen: { type: 'object', properties: listen, additionalProperties: listenAdditional },
    },
  };
}
