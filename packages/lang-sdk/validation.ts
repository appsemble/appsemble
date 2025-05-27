import cronParser from 'cron-parser';
import { type Schema, ValidationError, Validator, type ValidatorResult } from 'jsonschema';
import languageTags from 'language-tags';
import { type Promisable } from 'type-fest';

import {
  getAppInheritedRoles,
  getAppPossibleGuestPermissions,
  getAppPossiblePermissions,
  getAppRolePermissions,
} from './authorization.js';
import { getAppBlocks, type IdentifiableBlock, normalizeBlockName } from './blockUtils.js';
import { findPageByName } from './findPageByName.js';
import { BlockParamInstanceValidator, normalize, partialNormalized } from './index.js';
import { iterApp, type Prefix } from './iterApp.js';
import { has } from './miscellaneous.js';
import { type ServerActionName, serverActions } from './serverActions.js';
import {
  type AppDefinition,
  type AppMemberCurrentPatchAction,
  type AppMemberPropertiesPatchAction,
  type AppMemberRegisterAction,
  type BlockManifest,
  type CustomAppPermission,
  type PageDefinition,
  PredefinedAppRole,
  predefinedAppRolePermissions,
  type ProjectImplementations,
  type Remapper,
  type ResourceGetActionDefinition,
  type RoleDefinition,
} from './types/index.js';

type Report = (instance: unknown, message: string, path: (number | string)[]) => void;

const allResourcePermissionPattern =
  /^\$resource:all:(get|history:get|query|create|delete|patch|update)$/;

const resourcePermissionPattern =
  /^\$resource:[^:]+:(get|history:get|query|create|delete|patch|update)$/;

const allOwnResourcePermissionPattern = /^\$resource:all:own:(get|query|delete|patch|update)$/;

const ownResourcePermissionPattern = /^\$resource:[^:]+:own:(get|query|delete|patch|update)$/;

const allResourceViewPermissionPattern = /^\$resource:all:(get|query):[^:]+$/;

const resourceViewPermissionPattern = /^\$resource:[^:]+:(get|query):[^:]+$/;

/**
 * Check whether or not the given link represents a link related to the Appsemble core.
 *
 * @param link The link to check
 * @returns Whether or not the given link represents a link related to the Appsemble core.
 */
export function isAppLink(link: Remapper | string[] | string): boolean {
  return link === '/Login' || link === '/Settings';
}

function validateJSONSchema(schema: Schema, prefix: Prefix, report: Report): void {
  // TODO: bad nesting
  if (schema.type === 'object') {
    if ('properties' in schema) {
      if (Array.isArray(schema.required)) {
        for (const [index, name] of schema.required.entries()) {
          if (!has(schema.properties, name)) {
            report(name, 'is not defined in properties', [...prefix, 'required', index]);
          }
        }
      }
      for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
        validateJSONSchema(propertySchema, [...prefix, 'properties', key], report);
      }
    } else {
      report(schema, 'is missing properties', prefix);
    }
  }
}

/**
 * Validates the pages in the app definition to ensure there are no duplicate page names.
 *
 * @param definition The definition of the app
 * @param report A function used to report a value.
 */
function validateUniquePageNames(definition: AppDefinition, report: Report): void {
  if (!definition.pages) {
    return;
  }

  const pageNames = new Map<string, string[][]>();

  function checkPages(pages: PageDefinition[], parentPath: string[] = []): void {
    for (const page of pages) {
      const pageName = page.name;
      const normalizedPageName = normalize(page.name);
      const pagePath = [...parentPath, pageName];

      if (pageNames.has(normalizedPageName)) {
        const paths = pageNames.get(normalizedPageName)!;
        paths.push(pagePath);
        report(pageName, 'is a duplicate page name', pagePath);
      } else {
        pageNames.set(normalizedPageName, [pagePath]);
      }

      if (page.type === 'container') {
        checkPages(page.pages, pagePath);
      }
    }
  }
  checkPages(definition.pages);
}

function validateMembersSchema(definition: AppDefinition, report: Report): void {
  if (!definition.members) {
    return;
  }

  for (const [propertyName, propertyDefinition] of Object.entries(definition.members.properties)) {
    // Handled by schema validation
    if (!propertyDefinition?.schema) {
      continue;
    }

    const { schema } = propertyDefinition;
    const prefix = ['members', 'properties', propertyName, 'schema'];

    validateJSONSchema(schema, prefix, report);

    if (!('type' in schema) && !('enum' in schema)) {
      report(schema, 'must define type or enum', prefix);
    }

    if ('reference' in propertyDefinition && propertyDefinition.reference) {
      const { resource: resourceName } = propertyDefinition.reference;

      const resourceDefinition = definition.resources?.[resourceName];

      if (!resourceDefinition) {
        report(resourceName, 'refers to a resource that doesn’t exist', [
          'members',
          'properties',
          propertyName,
          'reference',
          resourceName,
        ]);
      }
    }
  }
}

// TODO: Very not good nesting
function validateResourceSchemas(definition: AppDefinition, report: Report): void {
  if (!definition.resources) {
    return;
  }

  for (const [resourceName, resource] of Object.entries(definition.resources)) {
    // Handled by schema validation
    if (!resource?.schema) {
      continue;
    }

    const { enforceOrderingGroupByFields, positioning, schema } = resource;
    const prefix = ['resources', resourceName, 'schema'];

    if (!positioning && enforceOrderingGroupByFields?.length) {
      report(enforceOrderingGroupByFields, 'must set positioning to true', [
        'resources',
        resourceName,
        'enforceOrderingGroupByFields',
      ]);
    }
    if (enforceOrderingGroupByFields?.some((item) => !item.match('^[a-zA-Z0-9]*$'))) {
      report(enforceOrderingGroupByFields, 'must be alphanumeric', [
        'resources',
        resourceName,
        'enforceOrderingGroupByFields',
      ]);
    }

    const reservedKeywords = new Set([
      'created',
      'updated',
      'author',
      'editor',
      'seed',
      'ephemeral',
      'clonable',
      'expires',
      // XXX: is position reserved?
    ]);

    if (reservedKeywords.has(resourceName)) {
      report(schema, 'is a reserved keyword', ['resources', resourceName]);
    }

    validateJSONSchema(schema, prefix, report);
    if (!('type' in schema)) {
      report(schema, 'must define type object', prefix);
    } else if (schema.type !== 'object') {
      report(schema.type, 'must define type object', [...prefix, 'type']);
    }
    if ('properties' in schema) {
      for (const [propertyName, propertySchema] of Object.entries(schema.properties ?? {})) {
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

function validateController(
  definition: AppDefinition,
  controllerImplementations: ProjectImplementations,
  report: Report,
): void {
  if (!definition.controller || !controllerImplementations) {
    return;
  }

  iterApp(definition, {
    onController(controller, path) {
      // TODO: Google what an early return/guard statement is. Never ever forget it.
      const actionParameters = new Set<string>();

      if (controller.actions) {
        if (controllerImplementations.actions) {
          for (const [key, action] of Object.entries(controller.actions)) {
            if (
              action.type in
              // TODO: What is this doing here? Hardcoded? Make a central place for FE-only actions,
              // like we have for server actions
              [
                'link',
                'link.back',
                'link.next',
                'dialog',
                'dialog.ok',
                'dialog.error',
                'flow.back',
                'flow.cancel',
                'flow.finish',
                'flow.next',
                'flow.to',
              ]
            ) {
              report(action, 'cannot be used in controllers', [...path, 'actions', key]);
            }

            if (controllerImplementations.actions.$any) {
              if (actionParameters.has(key)) {
                continue;
              }

              if (!has(controllerImplementations.actions, key)) {
                report(action, 'is unused', [...path, 'actions', key]);
              }
            } else if (!has(controllerImplementations.actions, key)) {
              report(action, 'is an unknown action for this controller', [...path, 'actions', key]);
            }
          }
        } else {
          report(controller.actions, 'is not allowed on this controller', [...path, 'actions']);
        }
      }

      if (!controller.events) {
        return;
      }

      if (controller.events.emit) {
        for (const [key, value] of Object.entries(controller.events.emit)) {
          if (
            !controllerImplementations.events?.emit?.$any &&
            !has(controllerImplementations.events?.emit, key)
          ) {
            report(value, 'is an unknown event emitter', [...path, 'events', 'emit', key]);
          }
        }
      }

      if (controller.events.listen) {
        for (const [key, value] of Object.entries(controller.events.listen)) {
          if (
            !controllerImplementations.events?.listen?.$any &&
            !has(controllerImplementations.events?.listen, key)
          ) {
            report(value, 'is an unknown event listener', [...path, 'events', 'listen', key]);
          }
        }
      }
    },
  });
}

function validateBlocks(
  definition: AppDefinition,
  blockVersions: Map<string, Map<string, BlockManifest>>,
  report: Report,
): void {
  iterApp(definition, {
    onBlock(block, path) {
      const type = normalizeBlockName(block.type);
      const versions = blockVersions.get(type);
      if (!versions) {
        report(block.type, 'is not a known block type', [...path, 'type']);
        return;
      }
      const version = versions.get(block.version);
      if (!version) {
        report(block.version, 'is not a known version for this block type', [...path, 'version']);
        return;
      }

      const validateBlockParams = (): { actionsReferenced: Set<string> } => {
        if (!version.parameters) {
          if (block.parameters) {
            report(block.parameters, 'is not allowed on this block type', [...path, 'parameters']);
          }
          return { actionsReferenced: new Set() };
        }
        const paramValidator = new BlockParamInstanceValidator({
          actions: Object.keys(block.actions ?? {}),
          emitters: Object.keys(block.events?.emit ?? {}),
          listeners: Object.keys(block.events?.listen ?? {}),
        });
        const [result, actionsReferenced] = paramValidator.validateParametersInstance(
          block.parameters || {},
          version.parameters,
        );
        if ('parameters' in block) {
          for (const error of result.errors) {
            report(error.instance, error.message, [...path, 'parameters', ...error.path]);
          }
        } else if (!result.valid) {
          report(block, 'requires property "parameters"', path);
        }
        return { actionsReferenced };
      };

      const validateBlockActions = (actionsReferenced: Set<string>): void => {
        if (!block.actions) {
          return;
        }
        if (!version.actions) {
          report(block.actions, 'is not allowed on this block', [...path, 'actions']);
          return;
        }
        for (const [key, action] of Object.entries(block.actions)) {
          if (!version.actions.$any) {
            if (!has(version.actions, key)) {
              report(action, 'is an unknown action for this block', [...path, 'actions', key]);
            }
            continue;
          }
          if (actionsReferenced.has(key)) {
            continue;
          }
          if (!has(version.actions, key) && !version.wildcardActions) {
            report(action, 'is unused', [...path, 'actions', key]);
          }
        }
      };

      const { actionsReferenced } = validateBlockParams();
      validateBlockActions(actionsReferenced);

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

// TODO: very redundant code
function validatePermissions(
  appDefinition: AppDefinition,
  permissions: CustomAppPermission[],
  inheritedPermissions: CustomAppPermission[],
  possiblePermissions: CustomAppPermission[],
  report: Report,
  path: Prefix,
): void {
  const checked: CustomAppPermission[] = [];
  for (const [index, permission] of permissions.entries()) {
    if (checked.includes(permission)) {
      report(appDefinition, 'duplicate permission declaration', [...path, 'permissions', index]);
      return;
    }

    if (!possiblePermissions.includes(permission)) {
      if (
        resourcePermissionPattern.test(permission) ||
        ownResourcePermissionPattern.test(permission)
      ) {
        const [, resourceName] = permission.split(':');

        if (resourceName && resourceName !== 'all' && !appDefinition.resources?.[resourceName]) {
          report(
            appDefinition,
            `resource ${resourceName} does not exist in the app's resources definition`,
            [...path, 'permissions', index],
          );
          return;
        }
      }

      if (resourceViewPermissionPattern.test(permission)) {
        const [, resourceName, , resourceView] = permission.split(':');

        if (resourceName === 'all') {
          for (const [rName, resourceDefinition] of Object.entries(appDefinition.resources ?? {})) {
            if (!resourceDefinition.views?.[resourceView]) {
              report(
                appDefinition,
                `resource ${rName} is missing a definition for the ${resourceView} view`,
                [...path, 'permissions', index],
              );
              return;
            }
          }
        } else {
          if (!appDefinition.resources?.[resourceName]?.views?.[resourceView]) {
            report(
              appDefinition,
              `resource ${resourceName} is missing a definition for the ${resourceView} view`,
              [...path, 'permissions', index],
            );
            return;
          }
        }
      }

      report(appDefinition, 'invalid permission', [...path, 'permissions', index]);
      return;
    }

    if (inheritedPermissions.includes(permission)) {
      report(appDefinition, 'permission is already inherited from another role', [
        ...path,
        'permissions',
        index,
      ]);
      return;
    }

    const otherPermissions = permissions.filter((p) => p !== permission);

    // XXX: very duplicated code below, not readable, not in english/human/functional terms.

    if (resourcePermissionPattern.test(permission)) {
      const [, , resourceAction] = permission.split(':');

      if (
        otherPermissions.some((p) => {
          if (allResourcePermissionPattern.test(p)) {
            const [, , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        inheritedPermissions.some((p) => {
          if (allResourcePermissionPattern.test(p)) {
            const [, , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }
    }

    if (ownResourcePermissionPattern.test(permission)) {
      const [, resourceName, , resourceAction] = permission.split(':');

      if (
        otherPermissions.some((p) => {
          if (resourcePermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return (
              resourceName !== 'all' &&
              otherResourceName === resourceName &&
              otherResourceAction === resourceAction
            );
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action on resource ${resourceName} is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        otherPermissions.some((p) => {
          if (allOwnResourcePermissionPattern.test(p)) {
            const [, , , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. An own permission for the ${resourceAction} resource action with scope all is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        otherPermissions.some((p) => {
          if (allResourcePermissionPattern.test(p)) {
            const [, , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        inheritedPermissions.some((p) => {
          if (resourcePermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return (
              resourceName !== 'all' &&
              otherResourceName === resourceName &&
              otherResourceAction === resourceAction
            );
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action on resource ${resourceName} is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        inheritedPermissions.some((p) => {
          if (allOwnResourcePermissionPattern.test(p)) {
            const [, , , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. An own permission for the ${resourceAction} resource action with scope all is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      if (
        inheritedPermissions.some((p) => {
          if (allResourcePermissionPattern.test(p)) {
            const [, , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }
    }

    if (resourceViewPermissionPattern.test(permission)) {
      const [, resourceName, resourceAction, resourceView] = permission.split(':');

      // $resource:type:query:public, $resource:type:query:private
      if (
        otherPermissions.some((p) => {
          if (resourceViewPermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return (
              otherResourceName !== 'all' &&
              otherResourceName === resourceName &&
              otherResourceAction === resourceAction
            );
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `a view permission for the ${resourceAction} action on resource ${resourceName} is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query:public, $resource:all:query:private
      if (
        otherPermissions.some((p) => {
          if (allResourceViewPermissionPattern.test(p)) {
            const [, , otherResourceAction, otherResourceView] = p.split(':');
            return otherResourceAction === resourceAction && otherResourceView !== resourceView;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `a view permission for the ${resourceAction} action with scope all is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query:public, $resource:type:query
      if (
        otherPermissions.some((p) => {
          if (resourcePermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return otherResourceName === resourceName && otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} action on resource ${resourceName} without a specific view is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query:public, $resource:all:query
      if (
        otherPermissions.some((p) => {
          if (resourcePermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return otherResourceName === 'all' && otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all without a specific view is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query:public, $resource:all:query:public
      if (
        otherPermissions.some((p) => {
          if (allResourceViewPermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction, otherResourceView] = p.split(':');
            return (
              otherResourceName === 'all' &&
              otherResourceAction === resourceAction &&
              otherResourceView === resourceView
            );
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all for this view is already declared`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query:private
      // $resource:type:query:public
      if (
        inheritedPermissions.some((p) => {
          if (resourceViewPermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return (
              otherResourceName !== 'all' &&
              otherResourceName === resourceName &&
              otherResourceAction === resourceAction
            );
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `a view permission for the ${resourceAction} action on resource ${resourceName} is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:all:query:private
      // $resource:type:query:public
      if (
        inheritedPermissions.some((p) => {
          if (allResourceViewPermissionPattern.test(p)) {
            const [, , otherResourceAction, otherResourceView] = p.split(':');
            return otherResourceAction === resourceAction && otherResourceView !== resourceView;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `a view permission for the ${resourceAction} action with scope all is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:type:query
      // $resource:type:query:public
      if (
        inheritedPermissions.some((p) => {
          if (resourcePermissionPattern.test(p)) {
            const [, otherResourceName, otherResourceAction] = p.split(':');
            return otherResourceName === resourceName && otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} action on resource ${resourceName} without a specific view is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:all:query
      // $resource:type:query:public
      if (
        inheritedPermissions.some((p) => {
          if (allResourcePermissionPattern.test(p)) {
            const [, , otherResourceAction] = p.split(':');
            return otherResourceAction === resourceAction;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all without a specific view is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }

      // $resource:all:query:public
      // $resource:type:query:public
      if (
        inheritedPermissions.some((p) => {
          if (allResourceViewPermissionPattern.test(p)) {
            const [, , otherResourceAction, otherResourceView] = p.split(':');
            return otherResourceAction === resourceAction && otherResourceView === resourceView;
          }
          return false;
        })
      ) {
        report(
          appDefinition,
          `redundant permission. A permission for the ${resourceAction} resource action with scope all for this view is already inherited from another role`,
          [...path, 'permissions', index],
        );
        return;
      }
    }

    checked.push(permission);
  }
}

function checkCyclicRoleInheritance(
  roles: Record<string, RoleDefinition>,
  name: string,
  report: Report,
): void {
  let lastChecked: string | undefined;
  const stack: string[] = [];

  const checkRoleRecursively = (role: string): boolean => {
    lastChecked = role;
    if (stack.includes(role)) {
      return true;
    }
    stack.push(role);
    return Boolean(roles[role]?.inherits?.some(checkRoleRecursively));
  };

  const duplicate = checkRoleRecursively(name);
  if (duplicate && lastChecked === name) {
    report(roles[name], 'cyclically inherits itself', ['security', 'roles', name]);
  }
}

/**
 * Validate security related definitions within the app definition.
 *
 * @param definition The definition of the app
 * @param report A function used to report a value.
 */
function validateSecurity(definition: AppDefinition, report: Report): void {
  const { notifications, security } = definition;
  const predefinedRoles = Object.keys(PredefinedAppRole);

  const checkRoleExists = (name: string, path: Prefix, roles = predefinedRoles): boolean => {
    if (!has(security?.roles, name) && !roles.includes(name)) {
      report(name, 'does not exist in this app’s roles', path);
      return false;
    }
    return true;
  };

  const checkRoles = (object: { roles?: string[] }, path: Prefix): void => {
    if (!object?.roles) {
      return;
    }
    for (const [index, role] of object.roles.entries()) {
      checkRoleExists(role, [...path, 'roles', index], ['$guest', ...predefinedRoles]);
    }
  };

  if (!security) {
    if (notifications === 'login') {
      report(notifications, 'only works if security is defined', ['notifications']);
    }
    return;
  }

  if ((!security.default || !security.roles) && !security.guest && !security.cron) {
    report(
      definition,
      'invalid security definition. Must define either guest or cron or roles and default',
      ['security'],
    );
    return;
  }

  if (security.guest) {
    if (security.guest.inherits && security.guest.inherits.length && !security.roles) {
      report(definition, 'guest can not inherit roles if the roles property is not defined', [
        'security',
        'guest',
        'inherits',
      ]);
      return;
    }

    const inheritedPermissions = getAppRolePermissions(security, security.guest.inherits || []);

    const possibleGuestPermissions = getAppPossibleGuestPermissions(definition);

    if (inheritedPermissions.some((ip) => !possibleGuestPermissions.includes(ip))) {
      report(
        definition,
        'invalid security definition. Guest cannot inherit roles that contain own resource permissions',
        ['security', 'guest', 'inherits'],
      );
      return;
    }

    if (security.guest.permissions) {
      validatePermissions(
        definition,
        security.guest.permissions,
        inheritedPermissions,
        possibleGuestPermissions,
        report,
        ['security', 'guest'],
      );
    }
  } else if (security.cron) {
    if (!definition.cron) {
      report(definition, 'can not define cron definition without a cron job', ['security', 'cron']);
      return;
    }
    if (security.cron.inherits && security.cron.inherits.length && !security.roles) {
      report(definition, 'cron can not inherit roles if the roles property is not defined', [
        'security',
        'cron',
        'inherits',
      ]);
      return;
    }

    const inheritedPermissions = getAppRolePermissions(security, security.cron.inherits || []);

    const possibleCronPermissions = getAppPossibleGuestPermissions(definition);

    if (inheritedPermissions.some((ip) => !possibleCronPermissions.includes(ip))) {
      report(
        definition,
        'invalid security definition. Guest cannot inherit roles that contain own resource permissions',
        ['security', 'cron', 'inherits'],
      );
      return;
    }

    if (security.cron.permissions) {
      validatePermissions(
        definition,
        security.cron.permissions,
        inheritedPermissions,
        possibleCronPermissions,
        report,
        ['security', 'cron'],
      );
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 18048 variable is possibly undefined (strictNullChecks)
    checkRoleExists(security.default.role, ['security', 'default', 'role']);
  }

  if (security.roles) {
    const possibleAppPermissions = getAppPossiblePermissions(definition);

    for (const [name, role] of Object.entries(security.roles)) {
      if ([...predefinedRoles, 'cron'].includes(name)) {
        report(definition, `not allowed to overwrite role ${name}`, ['security', 'roles', name]);
      }

      const inheritedPermissions: CustomAppPermission[] = [];

      if (role?.inherits) {
        let found = false;
        for (const [index, inherited] of (role.inherits || []).entries()) {
          found ||= checkRoleExists(inherited, ['security', 'roles', name, 'inherits', index]);
        }

        if (found) {
          checkCyclicRoleInheritance(security.roles, name, report);
        }

        const inheritedRoles = getAppInheritedRoles(security, [name]).filter((r) => r !== name);

        for (const inheritedRole of inheritedRoles) {
          const roleDefinition = security.roles[inheritedRole];

          if (roleDefinition) {
            const rolePermissions = roleDefinition.permissions;
            if (rolePermissions) {
              inheritedPermissions.push(...rolePermissions);
            }
          } else {
            const predefinedRolePermissions =
              predefinedAppRolePermissions[inheritedRole as PredefinedAppRole];
            if (predefinedRolePermissions) {
              inheritedPermissions.push(...predefinedRolePermissions);
            }
          }
        }
      }

      if (role.permissions) {
        validatePermissions(
          definition,
          role.permissions,
          inheritedPermissions,
          possibleAppPermissions,
          report,
          ['security', 'roles', name],
        );
      }
    }
  }

  iterApp(definition, { onBlock: checkRoles, onPage: checkRoles });
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
      const tos = resource[actionType]?.hooks?.notification?.to;
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
  const page = findPageByName(pages, defaultPage);
  if (!page) {
    report(defaultPage, 'does not refer to an existing page', ['defaultPage']);
    return;
  }

  if (page.parameters) {
    report(defaultPage, 'may not specify parameters', ['defaultPage']);
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
      cronParser.parseExpression(job.schedule);
    } catch {
      report(job.schedule, 'contains an invalid expression', ['cron', id, 'schedule']);
    }
  }
}

// TODO: horrible nesting
function validateActions(definition: AppDefinition, report: Report): void {
  const urlRegex = new RegExp(`^${partialNormalized.source}:`);

  iterApp(definition, {
    onAction(action, path) {
      // XXX: could we validate server-side actions differently
      if (path[0] === 'cron' && !serverActions.has(action.type as ServerActionName)) {
        report(action.type, 'action type is not supported for cron jobs', [...path, 'type']);
        return;
      }

      if (path[0] === 'webhooks' && !serverActions.has(action.type as ServerActionName)) {
        report(action.type, 'action type is not supported for webhooks', [...path, 'type']);
        return;
      }

      if (action.type.startsWith('app.member.') && !definition.security) {
        report(
          action.type,
          'refers to an app member action but the app doesn’t have a security definition',
          [...path, 'type'],
        );
        return;
      }

      if (
        ['app.member.register', 'app.member.properties.patch', 'app.member.current.patch'].includes(
          action.type,
        ) &&
        Object.values(
          (
            action as
              | AppMemberCurrentPatchAction
              | AppMemberPropertiesPatchAction
              | AppMemberRegisterAction
          ).properties ?? {},
        )[0] &&
        definition.members?.properties
      ) {
        for (const propertyName of Object.keys(
          Object.values(
            (
              action as
                | AppMemberCurrentPatchAction
                | AppMemberPropertiesPatchAction
                | AppMemberRegisterAction
            ).properties ?? {},
          )[0],
        )) {
          if (!definition.members?.properties[propertyName]) {
            report(action.type, 'contains a property that doesn’t exist in app member properties', [
              ...path,
              'properties',
            ]);
          }
        }
      }

      if (action.type.startsWith('resource.')) {
        // All of the actions starting with `resource.` contain a property called `resource`.
        const { resource: resourceName, view } = action as ResourceGetActionDefinition;
        const resource = definition.resources?.[resourceName];
        const [, resourceAction] = action.type.split('.');

        if (!resource) {
          report(action.type, 'refers to a resource that doesn’t exist', [...path, 'resource']);
          return;
        }

        if (!action.type.startsWith('resource.subscription.')) {
          if (!definition.security) {
            report(action.type, 'missing security definition', [...path, 'resource']);
            return;
          }

          const allPermissions = definition.security.guest?.permissions || [];

          if (definition.security.roles) {
            const allRolePermissions = getAppRolePermissions(
              definition.security,
              Object.keys(definition.security.roles),
            );

            allPermissions.push(...allRolePermissions);
          }

          // TODO: repeats way too much, code not self-explanatory at all
          if (
            !allPermissions.some((permission) => {
              if (resourcePermissionPattern.test(permission)) {
                const [, permissionResourceName, permissionResourceAction] = permission.split(':');
                return (
                  ['all', resourceName].includes(permissionResourceName) &&
                  (permissionResourceAction === resourceAction ||
                    (resourceAction === 'count' && permissionResourceAction === 'query'))
                );
              }

              if (ownResourcePermissionPattern.test(permission)) {
                const [, permissionResourceName, , permissionResourceAction] =
                  permission.split(':');
                return (
                  ['all', resourceName].includes(permissionResourceName) &&
                  (permissionResourceAction === resourceAction ||
                    (resourceAction === 'count' && permissionResourceAction === 'query'))
                );
              }

              return false;
            })
          ) {
            report(
              action.type,
              'there is no one in the app who has permissions to use this action',
              [...path, 'resource'],
            );
            return;
          }

          if (
            view &&
            !allPermissions.some((permission) => {
              if (resourceViewPermissionPattern.test(permission)) {
                const [, permissionResourceName, permissionResourceAction, permissionResourceView] =
                  permission.split(':');
                return (
                  ['all', resourceName].includes(permissionResourceName) &&
                  permissionResourceAction === resourceAction &&
                  (!permissionResourceView || permissionResourceView === view)
                );
              }
              return false;
            })
          ) {
            report(
              action.type,
              'there is no one in the app who has permissions to use this action',
              [...path, 'resource'],
            );
            return;
          }
        }
      }

      if (action.type.startsWith('flow.')) {
        // TODO: path indexes are not sane. Raw-dogging the prefix is not sane.
        const page = definition.pages?.[Number(path[1])];
        if (page.type !== 'flow' && page.type !== 'loop') {
          report(
            action.type,
            'flow actions can only be used on pages with the type ‘flow’ or ‘loop’',
            [...path, 'type'],
          );
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
          page.type === 'flow' &&
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

        if (
          page.type === 'flow' &&
          action.type === 'flow.to' &&
          !page.steps.some((step) => step.name === action.step)
        ) {
          report(action.type, 'refers to a step that doesn’t exist', [...path, 'step']);
          return;
        }
      }

      if (action.type === 'link') {
        const { to } = action;

        if (
          typeof to === 'object' &&
          (!Array.isArray(to) ||
            (Array.isArray(to) && to.every((entry) => typeof entry === 'object')))
        ) {
          return;
        }

        if (typeof to === 'string' && urlRegex.test(to)) {
          return;
        }

        if (isAppLink(to)) {
          return;
        }

        const [toBase, toSub] = ([] as unknown[]).concat(to);
        // @ts-expect-error 2345 argument of type is not assignable to parameter of type
        // (strictNullChecks) - Severe
        const toPage = findPageByName(definition.pages, toBase);

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

        if (toPage.type === 'tabs' && toSub && Array.isArray(toPage.tabs)) {
          const subPage = toPage.tabs.find(({ name }) => name === toSub);
          if (!subPage) {
            report(toSub, 'refers to a tab that doesn’t exist', [...path, 'to', 1]);
          }
        }
      }
    },
  });
}

function validateEvents(
  definition: AppDefinition,
  blockVersions: Map<string, Map<string, BlockManifest>>,
  report: Report,
): void {
  // XXX: what is this a map of?
  const indexMap = new Map<
    number | string,
    {
      emitters: Map<string, Prefix[]>;
      listeners: Map<string, Prefix[]>;
    }
  >();

  function collect(prefix: Prefix, name: string, isEmitter: boolean): void {
    const [firstKey, pageIndex] = prefix;

    let mapAtKey;

    // Ignore anything not part of controller or a page.
    // For example cron actions never support events.
    switch (firstKey) {
      case 'controller':
        if (!indexMap.has('controller')) {
          indexMap.set('controller', { emitters: new Map(), listeners: new Map() });
        }

        mapAtKey = indexMap.get('controller')!;

        break;
      case 'pages':
        if (typeof pageIndex !== 'number') {
          return;
        }

        if (!indexMap.has(pageIndex)) {
          indexMap.set(pageIndex, { emitters: new Map(), listeners: new Map() });
        }

        mapAtKey = indexMap.get(pageIndex)!;

        break;
      default:
        return;
    }

    const { emitters, listeners } = mapAtKey;

    const context = isEmitter ? emitters : listeners;

    if (!context.has(name)) {
      context.set(name, []);
    }

    const prefixes = context.get(name)!;
    prefixes.push(prefix);
  }

  iterApp(definition, {
    onController(controller, path) {
      if (!controller.events) {
        return;
      }

      if (controller.events.emit) {
        for (const [prefix, name] of Object.entries(controller.events.emit)) {
          collect([...path, 'events', 'emit', prefix], name, true);
        }
      }

      if (controller.events.listen) {
        for (const [prefix, name] of Object.entries(controller.events.listen)) {
          collect([...path, 'events', 'listen', prefix], name, false);
        }
      }
    },

    onAction(action, path) {
      // TODO: really doesn't belong here,at all
      if (action.type === 'dialog') {
        for (const block of action.blocks) {
          const versions = blockVersions.get(normalizeBlockName(block.type));
          const version = versions?.get(block.version);
          if (version?.layout === 'float') {
            report(
              block.version,
              'block with layout type: "'
                .concat(version.layout)
                .concat('" is not allowed in a dialog action'),
              [...path, 'type'],
            );
          }

          if (block.layout === 'float') {
            report(
              block,
              'block with layout type: "'
                .concat(block.layout)
                .concat('" is not allowed in a dialog action'),
              [...path, 'type'],
            );
          }
        }
        return;
      }
      if (action.type !== 'event') {
        return;
      }

      collect([...path, 'event'], action.event, true);
      if ('waitFor' in action && action.waitFor) {
        collect([...path, 'waitFor'], action.waitFor, false);
      }
    },

    onPage(page, path) {
      if (!(page.type === 'tabs') || page.tabs) {
        return;
      }

      if (page.definition?.events.emit) {
        for (const [prefix, name] of Object.entries(page.definition.events.emit)) {
          collect([...path, 'events', 'emit', prefix], name, true);
        }
      }

      if (page.definition?.events.listen) {
        for (const [prefix, name] of Object.entries(page.definition.events.listen)) {
          collect([...path, 'events', 'listen', prefix], name, false);
        }
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

  let controllerEvents = {
    emitters: new Map<string, Prefix[]>(),
    listeners: new Map<string, Prefix[]>(),
  };

  if (indexMap.has('controller')) {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2322 null is not assignable to type (strictNullChecks)
    controllerEvents = { ...indexMap.get('controller') };
  }

  indexMap.delete('controller');

  for (const [name, prefixes] of controllerEvents.emitters.entries()) {
    // TODO: you call this !Array.prototype.some
    let found = false;
    for (const { listeners } of indexMap.values()) {
      if (listeners.has(name)) {
        found = true;
      }
    }
    if (!found) {
      for (const prefix of prefixes) {
        report(name, 'does not match any listeners', prefix);
      }
    }
  }

  for (const [name, prefixes] of controllerEvents.listeners.entries()) {
    let found = false;
    for (const { emitters } of indexMap.values()) {
      if (emitters.has(name)) {
        found = true;
      }
    }
    if (!found) {
      for (const prefix of prefixes) {
        report(name, 'does not match any emitters', prefix);
      }
    }
  }

  for (const { emitters, listeners } of indexMap.values()) {
    for (const [name, prefixes] of listeners.entries()) {
      if (!emitters.has(name) && !controllerEvents.emitters.has(name)) {
        for (const prefix of prefixes) {
          report(name, 'does not match any event emitters', prefix);
        }
      }
    }
    for (const [name, prefixes] of emitters.entries()) {
      if (!listeners.has(name) && !controllerEvents.listeners.has(name)) {
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
 * @param controllerImplementations App controller implementations of interfaces.
 * @param validatorResult If specified, error messages will be applied to this existing validator
 *   result.
 * @returns A validator result which contains all app validation violations.
 */
export async function validateAppDefinition(
  definition: AppDefinition,
  getBlockVersions: BlockVersionsGetter,
  controllerImplementations?: ProjectImplementations,
  validatorResult?: ValidatorResult,
): Promise<ValidatorResult> {
  let result = validatorResult;
  if (!result) {
    const validator = new Validator();
    result = validator.validate(definition, {});
  }

  if (!definition) {
    result.addError('App definition can not be null');
    return result;
  }

  const blocks = getAppBlocks(definition);
  const blockVersions = await getBlockVersions(blocks);

  const blockVersionMap = new Map<string, Map<string, BlockManifest>>();
  for (const version of blockVersions) {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name)!.set(version.version, version);
  }

  const report: Report = (instance, message, path) => {
    result.errors.push(new ValidationError(message, instance, undefined, path));
  };

  try {
    // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
    // @ts-ignore 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    validateController(definition, controllerImplementations, report);
    validateCronJobs(definition, report);
    validateDefaultPage(definition, report);
    validateHooks(definition, report);
    validateLanguage(definition, report);
    validateResourceReferences(definition, report);
    validateMembersSchema(definition, report);
    validateResourceSchemas(definition, report);
    validateSecurity(definition, report);
    validateBlocks(definition, blockVersionMap, report);
    validateActions(definition, report);
    validateEvents(definition, blockVersionMap, report);
    validateUniquePageNames(definition, report);
  } catch (error) {
    report(null, `Unexpected error: ${error instanceof Error ? error.message : error}`, []);
  }

  return result;
}
