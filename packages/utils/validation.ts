import {
  AppDefinition,
  BlockManifest,
  ResourceGetActionDefinition,
  RoleDefinition,
} from '@appsemble/types';
import { parseExpression } from 'cron-parser';
import { Schema, ValidationError, Validator, ValidatorResult } from 'jsonschema';
import languageTags from 'language-tags';
import { Promisable } from 'type-fest';

import { partialNormalized } from '.';
import { getAppBlocks, IdentifiableBlock, normalizeBlockName } from './blockUtils';
import { has } from './has';
import { iterApp, Prefix } from './iterApp';

type Report = (instance: unknown, message: string, path: (number | string)[]) => void;

/**
 * Check whether or not the given link represents a link related to the Appsemble core.
 *
 * @param link The link to check
 * @returns Whether or not the given link represents a link related to the Appsemble core.
 */
export function isAppLink(link: string[] | string): boolean {
  return link === '/Login' || link === '/Settings';
}

function validateJSONSchema(schema: Schema, prefix: Prefix, report: Report): void {
  if (schema.type === 'object') {
    if ('properties' in schema) {
      if (Array.isArray(schema.required)) {
        for (const [index, name] of schema.required.entries()) {
          if (!has(schema.properties, name)) {
            report(name, 'is not defined in properties', [...prefix, 'required', index]);
          }
        }
      }
      for (const [key, propertySchema] of Object.entries(schema.properties)) {
        validateJSONSchema(propertySchema, [...prefix, 'properties', key], report);
      }
    } else {
      report(schema, 'is missing properties', prefix);
    }
  }
}

function validateResourceSchemas(definition: AppDefinition, report: Report): void {
  if (!definition.resources) {
    return;
  }

  for (const [resourceName, resource] of Object.entries(definition.resources)) {
    // Handled by schema validation
    if (!resource?.schema) {
      continue;
    }

    const { schema } = resource;
    const prefix = ['resources', resourceName, 'schema'];

    validateJSONSchema(schema, prefix, report);
    if (!('type' in schema)) {
      report(schema, 'must define type object', prefix);
    } else if (schema.type !== 'object') {
      report(schema.type, 'must define type object', [...prefix, 'type']);
    }
    if ('properties' in schema) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
        if (propertyName === 'id') {
          for (const [validatorKey, value] of Object.entries(propertySchema)) {
            if (validatorKey === 'description' || validatorKey === 'title') {
              continue;
            }
            if (validatorKey === 'type') {
              if (value !== 'integer' && value !== 'number') {
                report(value, 'must be integer', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            report(value, 'does not support custom validators', [
              ...prefix,
              'properties',
              propertyName,
              validatorKey,
            ]);
          }
        } else if (propertyName === '$created' || propertyName === '$updated') {
          for (const [validatorKey, value] of Object.entries(propertySchema)) {
            if (validatorKey === 'description' || validatorKey === 'title') {
              continue;
            }
            if (validatorKey === 'type') {
              if (value !== 'string') {
                report(value, 'must be string', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            if (validatorKey === 'format') {
              if (value !== 'date-time') {
                report(value, 'must be date-time', [
                  ...prefix,
                  'properties',
                  propertyName,
                  validatorKey,
                ]);
              }
              continue;
            }
            report(value, 'does not support custom validators', [
              ...prefix,
              'properties',
              propertyName,
              validatorKey,
            ]);
          }
        } else if (propertyName.startsWith('$')) {
          report(propertySchema, 'may not start with $', [...prefix, 'properties', propertyName]);
        }
      }
    }
  }
}

function validateBlocks(
  definition: AppDefinition,
  blockVersions: BlockManifest[],
  report: Report,
): void {
  const blockVersionMap = new Map<string, Map<string, BlockManifest>>();
  for (const version of blockVersions) {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name).set(version.version, version);
  }
  iterApp(definition, {
    onBlock(block, path) {
      const type = normalizeBlockName(block.type);
      const versions = blockVersionMap.get(type);
      if (!versions) {
        report(block.type, 'is not a known block type', [...path, 'type']);
        return;
      }
      const actionParameters = new Set<string>();
      const version = versions.get(block.version);
      if (!version) {
        report(block.version, 'is not a known version for this block type', [...path, 'version']);
        return;
      }

      if (version.parameters) {
        const validator = new Validator();

        validator.customFormats.fontawesome = () => true;
        validator.customFormats.remapper = () => true;
        validator.customFormats.action = (property) => {
          actionParameters.add(property);
          return has(block.actions, property);
        };
        validator.customFormats['event-listener'] = (property) =>
          has(block.events?.listen, property);
        validator.customFormats['event-emitter'] = (property) => has(block.events?.emit, property);
        const result = validator.validate(block.parameters || {}, version.parameters, {
          nestedErrors: true,
        });
        if ('parameters' in block) {
          for (const error of result.errors) {
            report(error.instance, error.message, [...path, 'parameters', ...error.path]);
          }
        } else if (!result.valid) {
          report(block, 'requires property "parameters"', path);
        }
      } else if (block.parameters) {
        report(block.parameters, 'is not allowed on this block type', [...path, 'parameters']);
      }

      if (block.actions) {
        if (version.actions) {
          for (const [key, action] of Object.entries(block.actions)) {
            if (version.actions.$any) {
              if (actionParameters.has(key)) {
                continue;
              }

              if (!has(version.actions, key) && !version.wildcardActions) {
                report(action, 'is unused', [...path, 'actions', key]);
              }
            } else if (!has(version.actions, key)) {
              report(action, 'is an unknown action for this block', [...path, 'actions', key]);
            }
          }
        } else {
          report(block.actions, 'is not allowed on this block', [...path, 'actions']);
        }
      }

      if (!block.events) {
        return;
      }
      if (block.events.emit) {
        for (const [key, value] of Object.entries(block.events.emit)) {
          if (!version.events?.emit?.$any && !has(version.events?.emit, key)) {
            report(value, 'is an unknown event emitter', [...path, 'events', 'emit', key]);
          }
        }
      }
      if (block.events.listen) {
        for (const [key, value] of Object.entries(block.events.listen)) {
          if (!version.events?.listen?.$any && !has(version.events?.listen, key)) {
            report(value, 'is an unknown event listener', [...path, 'events', 'listen', key]);
          }
        }
      }
    },
  });
}

function checkCyclicRoleInheritance(
  roles: Record<string, RoleDefinition>,
  name: string,
  report: Report,
): void {
  let lastchecked: string;
  const stack: string[] = [];

  const checkRoleRecursively = (role: string): boolean => {
    lastchecked = role;
    if (stack.includes(role)) {
      return true;
    }
    stack.push(role);
    return roles[role]?.inherits?.some(checkRoleRecursively);
  };

  const duplicate = checkRoleRecursively(name);
  if (duplicate && lastchecked === name) {
    report(roles[name], 'cyclicly inherits itself', ['security', 'roles', name]);
  }
}

/**
 * Validate security related definitions within the app definition.
 *
 * @param definition The definition of the app
 * @param report A function used to report a value.
 */
function validateSecurity(definition: AppDefinition, report: Report): void {
  const { security } = definition;
  const defaultAllow = ['$none', '$public', '$team:member', '$team:manager'];
  if (!security) {
    return;
  }

  const checkRoleExists = (name: string, path: Prefix, allow = defaultAllow): boolean => {
    if (!has(security.roles, name) && !allow.includes(name)) {
      report(name, 'does not exist in this app’s roles', path);
      return false;
    }
    return true;
  };

  const checkRoles = (object: { roles?: string[] }, path: Prefix, allow = defaultAllow): void => {
    if (!object?.roles) {
      return;
    }
    for (const [index, role] of object.roles.entries()) {
      checkRoleExists(role, [...path, 'roles', index], allow);
    }
  };

  checkRoleExists(security.default.role, ['security', 'default', 'role']);
  checkRoles(definition, []);
  if (definition.resources) {
    for (const [resourceName, resource] of Object.entries(definition.resources)) {
      checkRoles(resource, ['resources', resourceName], [...defaultAllow, '$author']);
      checkRoles(
        resource.count,
        ['resources', resourceName, 'count'],
        [...defaultAllow, '$author'],
      );
      checkRoles(resource.create, ['resources', resourceName, 'create']);
      checkRoles(
        resource.delete,
        ['resources', resourceName, 'delete'],
        [...defaultAllow, '$author'],
      );
      checkRoles(resource.get, ['resources', resourceName, 'get'], [...defaultAllow, '$author']);
      checkRoles(
        resource.query,
        ['resources', resourceName, 'query'],
        [...defaultAllow, '$author'],
      );
      checkRoles(
        resource.update,
        ['resources', resourceName, 'update'],
        [...defaultAllow, '$author'],
      );

      if (resource.views) {
        for (const [viewName, view] of Object.entries(resource.views)) {
          checkRoles(
            view,
            ['resources', resourceName, 'views', viewName],
            [...defaultAllow, '$author'],
          );
        }
      }
    }
  }
  iterApp(definition, { onBlock: checkRoles, onPage: checkRoles });

  for (const [name, role] of Object.entries(security.roles)) {
    if (!role?.inherits) {
      continue;
    }
    let found = false;
    for (const [index, inheritee] of role.inherits.entries()) {
      found ||= checkRoleExists(inheritee, ['security', 'roles', name, 'inherits', index]);
    }
    if (found) {
      checkCyclicRoleInheritance(security.roles, name, report);
    }
  }
}

/**
 * Validates the hooks in resource definition to ensure its properties are valid.
 *
 * @param definition The definition of the app
 * @param report A function used to report a value.
 */
function validateHooks(definition: AppDefinition, report: Report): void {
  if (!definition.resources) {
    return;
  }
  const actionTypes = ['create', 'update', 'delete'] as const;
  for (const [resourceKey, resource] of Object.entries(definition.resources)) {
    for (const actionType of actionTypes) {
      if (!has(resource, actionType)) {
        continue;
      }
      const tos = resource[actionType].hooks?.notification?.to;
      if (tos) {
        for (const [index, to] of tos.entries()) {
          if (to !== '$author' && !has(definition.security?.roles, to)) {
            report(to, 'is an unknown role', [
              'resources',
              resourceKey,
              actionType,
              'hooks',
              'notifications',
              'to',
              index,
            ]);
          }
        }
      }
    }
  }
}

function validateResourceReferences(definition: AppDefinition, report: Report): void {
  if (!definition.resources) {
    return;
  }
  for (const [resourceType, resource] of Object.entries(definition.resources)) {
    if (!resource.references) {
      continue;
    }
    for (const [field, reference] of Object.entries(resource.references)) {
      if (!has(definition.resources, reference.resource)) {
        report(reference.resource, 'is not an existing resource', [
          'resources',
          resourceType,
          'references',
          field,
          'resource',
        ]);
        continue;
      }

      if (!has(resource.schema.properties, field)) {
        report(field, 'does not exist on this resource', [
          'resources',
          resourceType,
          'references',
          field,
        ]);
      }
    }
  }
}

function validateLanguage({ defaultLanguage }: AppDefinition, report: Report): void {
  if (defaultLanguage != null && !languageTags.check(defaultLanguage)) {
    report(defaultLanguage, 'is not a valid language code', ['defaultLanguage']);
  }
}

function validateDefaultPage({ defaultPage, pages }: AppDefinition, report: Report): void {
  const page = pages?.find((p) => p.name === defaultPage);

  if (!page) {
    report(defaultPage, 'does not refer to an existing page', ['defaultPage']);
    return;
  }

  if (page.parameters) {
    report(defaultPage, 'may not specifiy parameters', ['defaultPage']);
  }
}

function validateCronJobs({ cron }: AppDefinition, report: Report): void {
  if (!cron) {
    return;
  }
  for (const [id, job] of Object.entries(cron)) {
    if (typeof job?.schedule !== 'string') {
      continue;
    }
    try {
      parseExpression(job.schedule);
    } catch {
      report(job.schedule, 'contains an invalid expression', ['cron', id, 'schedule']);
    }
  }
}

function validateActions(definition: AppDefinition, report: Report): void {
  const urlRegex = new RegExp(`^${partialNormalized.source}:`);

  iterApp(definition, {
    onAction(action, path) {
      if (action.type.startsWith('user.') && !definition.security) {
        report(
          action.type,
          'refers to a user action but the app doesn’t have a security definition',
          [...path, 'type'],
        );
        return;
      }

      if (action.type.startsWith('resource.')) {
        // All of the actions starting with `resource.` contain a property called `resource`.
        const { resource: resourceName, view } = action as ResourceGetActionDefinition;
        const resource = definition.resources?.[resourceName];

        if (!resource) {
          report(action.type, 'refers to a resource that doesn’t exist', [...path, 'resource']);
          return;
        }

        if (!action.type.startsWith('resource.subscription.')) {
          const type = action.type.split('.')[1] as
            | 'count'
            | 'create'
            | 'delete'
            | 'get'
            | 'query'
            | 'update';
          const roles = resource?.[type]?.roles ?? resource?.roles;
          if (!roles) {
            report(action.type, 'refers to a resource action that is currently set to private', [
              ...path,
              'resource',
            ]);
            return;
          }

          if (roles && !roles.length && !definition.security) {
            report(
              action.type,
              'refers to a resource action that is accessible when logged in, but the app has no security definitions',
              [...path, 'resource'],
            );
            return;
          }

          if ((type === 'get' || type === 'query') && view) {
            if (!resource.views?.[view]) {
              report(action.type, 'refers to a view that doesn’t exist', [...path, 'view']);
              return;
            }

            const viewRoles = resource?.views?.[view].roles;
            if (!viewRoles?.length) {
              report(action.type, 'refers to a resource view that is currently set to private', [
                ...path,
                'view',
              ]);
              return;
            }

            if (viewRoles && !viewRoles.length && !definition.security) {
              report(
                action.type,
                'refers to a resource action that is accessible when logged in, but the app has no security definitions',
                [...path, 'view'],
              );
              return;
            }
          }
        }
      }

      if (action.type.startsWith('flow.')) {
        const page = definition.pages?.[Number(path[1])];
        if (page?.type !== 'flow') {
          report(action.type, 'flow actions can only be used on pages with the type ‘flow’', [
            ...path,
            'type',
          ]);
          return;
        }

        if (action.type === 'flow.cancel' && !page.actions?.onFlowCancel) {
          report(action.type, 'was defined but ‘onFlowCancel’ page action wasn’t defined', [
            ...path,
            'type',
          ]);
          return;
        }

        if (action.type === 'flow.finish' && !page.actions?.onFlowFinish) {
          report(action.type, 'was defined but ‘onFlowFinish’ page action wasn’t defined', [
            ...path,
            'type',
          ]);
          return;
        }

        if (action.type === 'flow.back' && path[3] === 0) {
          report(action.type, 'is not allowed on the first step in the flow', [...path, 'type']);
          return;
        }

        if (
          action.type === 'flow.next' &&
          Number(path[3]) === page.steps.length - 1 &&
          !page.actions?.onFlowFinish
        ) {
          report(
            action.type,
            'was defined on the last step but ‘onFlowFinish’ page action wasn’t defined',
            [...path, 'type'],
          );
          return;
        }

        if (action.type === 'flow.to' && !page.steps.some((step) => step.name === action.step)) {
          report(action.type, 'refers to a step that doesn’t exist', [...path, 'step']);
          return;
        }
      }

      if (action.type === 'link') {
        const { to } = action;
        if (typeof to === 'string' && urlRegex.test(to)) {
          return;
        }

        if (isAppLink(to)) {
          return;
        }

        const [toBase, toSub] = [].concat(to);
        const toPage = definition.pages.find(({ name }) => name === toBase);

        if (!toPage) {
          report(to, 'refers to a page that doesn’t exist', [...path, 'to']);
          return;
        }

        if (toPage.type !== 'tabs' && toSub) {
          report(toSub, 'refers to a sub page on a page that isn’t of type ‘tabs’ or ‘flow’', [
            ...path,
            'to',
            1,
          ]);
          return;
        }

        if (toPage.type === 'tabs' && toSub) {
          const subPage = toPage.tabs.find(({ name }) => name === toSub);
          if (!subPage) {
            report(toSub, 'refers to a tab that doesn’t exist', [...path, 'to', 1]);
          }
        }
      }
    },
  });
}

function validateEvents(definition: AppDefinition, report: Report): void {
  const indexMap = new Map<
    number,
    {
      emitters: Map<string, Prefix[]>;
      listeners: Map<string, Prefix[]>;
    }
  >();

  function collect(prefix: Prefix, name: string, isEmitter: boolean): void {
    const [firstKey, pageIndex] = prefix;

    // Ignore anything not part of a page. For example cron actions never support events.
    if (firstKey !== 'pages') {
      return;
    }

    if (typeof pageIndex !== 'number') {
      return;
    }
    if (!indexMap.has(pageIndex)) {
      indexMap.set(pageIndex, { emitters: new Map(), listeners: new Map() });
    }
    const { emitters, listeners } = indexMap.get(pageIndex)!;
    const context = isEmitter ? emitters : listeners;
    if (!context.has(name)) {
      context.set(name, []);
    }
    const prefixes = context.get(name)!;
    prefixes.push(prefix);
  }

  iterApp(definition, {
    onAction(action, path) {
      if (action.type !== 'event') {
        return;
      }

      collect([...path, 'event'], action.event, true);
      if ('waitFor' in action) {
        collect([...path, 'waitFor'], action.waitFor, false);
      }
    },

    onBlock(block, path) {
      if (!block.events) {
        return;
      }

      if (block.events.emit) {
        for (const [prefix, name] of Object.entries(block.events.emit)) {
          collect([...path, 'events', 'emit', prefix], name, true);
        }
      }

      if (block.events.listen) {
        for (const [prefix, name] of Object.entries(block.events.listen)) {
          collect([...path, 'events', 'listen', prefix], name, false);
        }
      }
    },
  });

  for (const { emitters, listeners } of indexMap.values()) {
    for (const [name, prefixes] of listeners.entries()) {
      if (!emitters.has(name)) {
        for (const prefix of prefixes) {
          report(name, 'does not match any event emitters', prefix);
        }
      }
    }
    for (const [name, prefixes] of emitters.entries()) {
      if (!listeners.has(name)) {
        for (const prefix of prefixes) {
          report(name, 'does not match any event listeners', prefix);
        }
      }
    }
  }
}

export type BlockVersionsGetter = (blockMap: IdentifiableBlock[]) => Promisable<BlockManifest[]>;

/**
 * Validate an app definition.
 *
 * This check various conditions which can’t be validated using basic JSON schema validation.
 *
 * @param definition The app validation to check.
 * @param getBlockVersions A function for getting block manifests from block versions.
 * @param validatorResult If specified, error messages will be applied to this existing validator
 * result.
 * @returns A validator result which contains all app validation violations.
 */
export async function validateAppDefinition(
  definition: AppDefinition,
  getBlockVersions: BlockVersionsGetter,
  validatorResult?: ValidatorResult,
): Promise<ValidatorResult> {
  let result = validatorResult;
  if (!result) {
    const validator = new Validator();
    result = validator.validate(definition, {});
  }

  if (!definition) {
    return result;
  }

  const blocks = getAppBlocks(definition);
  const blockVersions = await getBlockVersions(blocks);
  const report: Report = (instance, message, path) => {
    result.errors.push(new ValidationError(message, instance, undefined, path));
  };

  try {
    validateCronJobs(definition, report);
    validateDefaultPage(definition, report);
    validateHooks(definition, report);
    validateLanguage(definition, report);
    validateResourceReferences(definition, report);
    validateResourceSchemas(definition, report);
    validateSecurity(definition, report);
    validateBlocks(definition, blockVersions, report);
    validateActions(definition, report);
    validateEvents(definition, report);
  } catch (error) {
    report(null, `Unexpected error: ${error instanceof Error ? error.message : error}`, []);
  }

  return result;
}
