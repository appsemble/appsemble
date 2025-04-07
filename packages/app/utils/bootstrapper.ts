import { normalizeBlockName, prefixBlockURL } from '@appsemble/lang-sdk';
import {
  type AppsembleBootstrapEvent,
  type AppsembleControllerEvent,
  type BootstrapFunction,
  type BootstrapParams,
  type ControllerFunction,
  type EventParams,
  type HandlerFunction,
} from '@appsemble/sdk';
import { type BlockManifest } from '@appsemble/types';
import { type Promisable } from 'type-fest';

import { appControllerCode } from './settings.js';

const bootstrapFunctions = new Map<string, BootstrapFunction>();
const controllerFunctions = new Map<string, ControllerFunction>();
const handlerFunctions = new Map<string, HandlerFunction>();

const bootstrapResolvers = new Map<string, ((fn: BootstrapFunction) => void)[]>();
const controllerResolvers = new Map<string, ((fn: ControllerFunction) => void)[]>();

const loadedBlocks = new Set<string>();
const loadedControllers = new Set<string>();

/**
 * Register a bootstrap function for a block.
 *
 * @param scriptNode The script node on which to register the bootstrap function.
 * @param event the event that was used to register the bootstrap function.
 * @param blockDefId The id of the block definition for which a boostrap function is being
 *   registered.
 */
export function registerBlock(
  scriptNode: HTMLScriptElement,
  event: AppsembleBootstrapEvent,
  blockDefId: string,
): void {
  const { document, fn } = event.detail;
  if (scriptNode !== event.currentTarget || scriptNode !== document.currentScript) {
    throw new Error(
      'Block bootstrapper was registered from within an unhandled node. What’s going on?',
    );
  }
  if (bootstrapFunctions.has(blockDefId)) {
    throw new Error(
      'It appears this block has already been mounted. Did you call bootstrap twice?',
    );
  }
  if (!(fn instanceof Function)) {
    throw new TypeError(
      'No function was passed to bootstrap function. It takes a function as its first argument.',
    );
  }
  bootstrapFunctions.set(blockDefId, fn);
  const callbacks = bootstrapResolvers.get(blockDefId);
  bootstrapResolvers.delete(blockDefId);
  if (!callbacks) {
    throw new Error('This block shouldn’t have been loaded. What’s going on?');
  }
  for (const resolve of callbacks) {
    resolve(fn);
  }
}

export function registerController(
  scriptNode: HTMLScriptElement,
  event: AppsembleControllerEvent,
): void {
  const { document, fn } = event.detail;
  if (scriptNode !== event.currentTarget || scriptNode !== document.currentScript) {
    throw new Error(
      'Controller mount was registered from within an unhandled node. What’s going on?',
    );
  }
  if (controllerFunctions.has('app-controller')) {
    throw new Error(
      'It appears this controller has already been mounted. Did you call controller twice?',
    );
  }
  if (!(fn instanceof Function)) {
    throw new TypeError(
      'No function was passed to controller function. It takes a function as its first argument.',
    );
  }
  controllerFunctions.set('app-controller', fn);
  const callbacks = controllerResolvers.get('app-controller') ?? [];
  controllerResolvers.delete('app-controller');
  for (const resolve of callbacks) {
    resolve(fn);
  }
}

function getBootstrapFunction(blockDefId: string): Promisable<BootstrapFunction> {
  if (bootstrapFunctions.has(blockDefId)) {
    return bootstrapFunctions.get(blockDefId)!;
  }
  if (!bootstrapResolvers.has(blockDefId)) {
    bootstrapResolvers.set(blockDefId, []);
  }
  const waiting = bootstrapResolvers.get(blockDefId)!;
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

function getControllerFunction(): Promisable<ControllerFunction> {
  if (controllerFunctions.has('app-controller')) {
    return controllerFunctions.get('app-controller')!;
  }
  if (!controllerResolvers.has('app-controller')) {
    controllerResolvers.set('app-controller', []);
  }
  const waiting = controllerResolvers.get('app-controller')!;
  return new Promise((resolve) => {
    waiting.push(resolve);
  });
}

export function getHandlerFunction(handler: string): HandlerFunction {
  // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
  return handlerFunctions.get(handler);
}

/**
 * Call the bootstrap function for a block definition
 *
 * @param manifest The block manifest whose bootstrap function to call.
 * @param params any named parameters that will be passed to the block boostrap function.
 */
export async function callBootstrap(
  manifest: BlockManifest,
  params: BootstrapParams,
): Promise<void> {
  const name = normalizeBlockName(manifest.name);
  const blockNameVersion = `${name}@${manifest.version}`;

  if (!loadedBlocks.has(blockNameVersion)) {
    for (const url of manifest.files) {
      if (url.endsWith('.js')) {
        const script = document.createElement('script');

        script.src = prefixBlockURL({ type: manifest.name, version: manifest.version }, url);

        // @ts-expect-error Not a default event
        script.addEventListener('AppsembleBootstrap', (event: AppsembleBootstrapEvent) => {
          event.stopImmediatePropagation();
          event.preventDefault();
          registerBlock(script, event, blockNameVersion);
        });
        document.head.append(script);
      }
    }
    loadedBlocks.add(blockNameVersion);
  }
  const bootstrap = await getBootstrapFunction(blockNameVersion);
  const result = await bootstrap(params);
  if (result instanceof Element) {
    params.shadowRoot.append(result);
  }
}

/**
 * Call the controller function for a controller definition
 *
 * @param params any named parameters that will be passed to the controller function.
 */
export async function callController(params: EventParams): Promise<void> {
  if (!loadedControllers.has('app-controller')) {
    const script = document.getElementById('app-controller') as HTMLScriptElement;

    if (!script || !appControllerCode) {
      return;
    }

    const blob = new Blob([appControllerCode], { type: 'application/javascript' });
    script.src = URL.createObjectURL(blob);

    // @ts-expect-error Not a default event
    script.addEventListener('AppsembleController', (event: AppsembleControllerEvent) => {
      event.stopImmediatePropagation();
      event.preventDefault();
      registerController(script, event);
    });

    loadedControllers.add('app-controller');
  }
  const controller = await getControllerFunction();
  const actions = await controller(params);

  for (const [name, handlerFunction] of Object.entries(actions)) {
    handlerFunctions.set(name, handlerFunction);
  }
}
