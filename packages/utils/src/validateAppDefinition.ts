import { AppDefinition, BlockManifest, Security } from '@appsemble/types';
import { parseExpression } from 'cron-parser';
import { Validator } from 'jsonschema';
import languageTags from 'language-tags';
import { Promisable } from 'type-fest';

import { BlockMap, getAppBlocks } from './getAppBlocks';
import { has } from './has';

/**
 * Used for throwing known Appsemble validation errors.
 */
export class AppsembleValidationError extends Error {
  data?: unknown;

  /**
   * @param message - The error message to show to the user.
   * @param data - Additional data that can be passed to convey additional info about the error.
   */
  constructor(message: string, data?: unknown) {
    super(message);
    this.name = 'AppsembleValidationError';
    this.data = data;
  }
}

export function checkBlocks(blocks: BlockMap, blockVersions: BlockManifest[]): void {
  const blockVersionMap = new Map<string, Map<string, BlockManifest>>();
  for (const version of blockVersions) {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name).set(version.version, version);
  }
  const errors: Record<string, string> = {};
  for (const [loc, block] of Object.entries(blocks)) {
    const type = block.type.startsWith('@') ? block.type : `@appsemble/${block.type}`;
    const versions = blockVersionMap.get(type);
    if (!versions) {
      errors[loc] = `Unknown block type “${type}”`;
      continue;
    }
    if (!versions.has(block.version)) {
      errors[loc] = `Unknown block version “${type}@${block.version}”`;
      continue;
    }

    const actionParameters = new Set<string>();
    const version = versions.get(block.version);
    if (version.parameters) {
      const validator = new Validator();

      validator.customFormats.fontawesome = () => true;
      validator.customFormats.remapper = () => true;
      validator.customFormats.action = (property) => {
        actionParameters.add(property);
        return has(block.actions, property);
      };
      validator.customFormats['event-listener'] = (property) => has(block.events?.listen, property);
      validator.customFormats['event-emitter'] = (property) => has(block.events?.emit, property);
      const result = validator.validate(block.parameters || {}, version.parameters);
      if (!result.valid) {
        for (const error of result.errors) {
          errors[`${loc}.parameters.${error.property.replace(/^instance\./, '')}`] = error.message;
        }
        continue;
      }
    }

    if (!version.actions && block.actions) {
      errors[`${loc}.actions`] = 'This block doesn’t support any actions';
      continue;
    }

    for (const key of Object.keys(block.actions || {})) {
      if (version.actions.$any) {
        if (actionParameters.has(key)) {
          continue;
        }

        if (!has(version.actions, key) && !version.wildcardActions) {
          errors[`${loc}.actions.${key}`] = `Custom action “${key}” is unused`;
        }
      } else if (!has(version.actions, key)) {
        errors[`${loc}.actions.${key}`] = 'Unknown action type';
      }
    }

    for (const key of Object.keys(block.events?.emit || {})) {
      if (!version.events?.emit?.$any && !has(version.events?.emit, key)) {
        errors[`${loc}.events.emit.${key}`] = 'Unknown event emitter';
      }
    }

    for (const key of Object.keys(block.events?.listen || {})) {
      if (!version.events?.listen?.$any && !has(version.events?.listen, key)) {
        errors[`${loc}.events.listen.${key}`] = 'Unknown event listener';
      }
    }
  }
  if (Object.keys(errors).length) {
    throw new AppsembleValidationError('Block validation failed', errors);
  }
}

/**
 * Check if the security roles are valid.
 *
 * @param securityDefinition - The security definition to use for checking the role.
 * @param role - The role the user is checked against.
 * @param checkedRoles - Array containing the roles already checked.
 */
function validateSecurityRoles(
  securityDefinition: Security,
  role: string,
  checkedRoles: string[] = [],
): void {
  if (checkedRoles.includes(role)) {
    throw new AppsembleValidationError(`Cyclic inheritance found for role ‘${role}’.`);
  }

  const securityRole = securityDefinition.roles[role];

  if (!securityRole) {
    throw new AppsembleValidationError(`Role ‘${role}’ not found in security definition.`);
  }

  if (securityRole.inherits) {
    checkedRoles.push(role);
    for (const inheritedRole of securityRole.inherits) {
      validateSecurityRoles(securityDefinition, inheritedRole, checkedRoles);
    }
  }
}

/**
 * Validates security-related definitions within the app definition.
 *
 * @param definition - The definition of the app
 */
export function validateSecurity(definition: AppDefinition): void {
  const { pages, roles, security } = definition;

  if (!has(security.roles, security.default.role)) {
    throw new AppsembleValidationError(
      `Default role ‘${security.default.role}’ does not exist in list of roles.`,
    );
  }

  for (const role of Object.keys(security.roles)) {
    validateSecurityRoles(security, role, []);
  }

  if (roles) {
    for (const role of roles) {
      if (!has(security.roles, role)) {
        throw new AppsembleValidationError(`Role ‘${role}’ in App roles does not exist.`);
      }
    }
  }

  for (const page of pages) {
    if (page.roles?.length) {
      for (const role of page.roles) {
        if (!has(security.roles, role) && role !== '$team:member' && role !== '$team:manager') {
          throw new AppsembleValidationError(
            `Role ‘${role}’ in page ‘${page.name}’ roles does not exist.`,
          );
        }
      }
    }
  }

  const blocks = getAppBlocks(definition);

  for (const [key, block] of Object.entries(blocks)) {
    if (block.roles?.length) {
      for (const role of block.roles) {
        if (!has(security.roles, role)) {
          throw new AppsembleValidationError(`Role ‘${role}’ in ${key} roles does not exist.`);
        }
      }
    }
  }
}

/**
 * Validates the hooks in resource definition to ensure its properties are valid.
 *
 * @param {} definition - The definition of the app
 */
export function validateHooks(definition: AppDefinition): void {
  const filter = new Set(['create', 'update', 'delete']);
  for (const [resourceKey, resource] of Object.entries(definition.resources)) {
    for (const [actionKey, { hooks }] of Object.entries(resource)) {
      if (filter.has(actionKey) && hooks?.notification?.to) {
        for (const to of hooks.notification.to) {
          if (to !== '$author' && !has(definition.security.roles, to)) {
            throw new AppsembleValidationError(
              `Role ‘${to}’ in resources.${resourceKey}.${actionKey}.hooks.notification.to does not exist.`,
            );
          }
        }
      }
    }
  }
}

export function validateReferences(definition: AppDefinition): void {
  for (const [resourceType, resource] of Object.entries(definition.resources)) {
    if (resource.references) {
      for (const [field, reference] of Object.entries(resource.references)) {
        if (!definition.resources[reference.resource]) {
          throw new AppsembleValidationError(
            `Resource “${reference.resource}” referenced by “${resourceType}” does not exist.`,
          );
        }

        if (!resource.schema.properties[field]) {
          throw new AppsembleValidationError(
            `Property “${field}” referencing “${reference.resource}” does not exist in resource “${resourceType}”`,
          );
        }
      }
    }
  }
}

export function validateLanguage(language: string): void {
  if (!languageTags.check(language)) {
    throw new AppsembleValidationError(`Language code “${language}” is invalid.`);
  }
}

export function validateDefaultPage({ defaultPage, pages }: AppDefinition): void {
  const page = pages.find((p) => p.name === defaultPage);

  if (!page) {
    throw new AppsembleValidationError(
      `Page “${defaultPage}” as specified in defaultPage does not exist.`,
    );
  }

  if (page.parameters) {
    throw new AppsembleValidationError(
      `Default page “${defaultPage}” can not have page parameters.`,
    );
  }
}

export function validateCronJobs({ cron }: AppDefinition): void {
  for (const [id, job] of Object.entries(cron)) {
    try {
      parseExpression(job.schedule);
    } catch {
      throw new AppsembleValidationError(
        `Cronjob ${id} contains an invalid expression: ${job.schedule}`,
      );
    }
  }
}

export async function validateAppDefinition(
  definition: AppDefinition,
  getBlockVersions: (blockMap: BlockMap) => Promisable<BlockManifest[]>,
): Promise<void> {
  validateDefaultPage(definition);

  const blocks = getAppBlocks(definition);
  const blockVersions = await getBlockVersions(blocks);

  if (definition.defaultLanguage) {
    validateLanguage(definition.defaultLanguage);
  }

  if (definition.security) {
    validateSecurity(definition);
  }

  if (definition.resources) {
    validateReferences(definition);
    validateHooks(definition);
  }

  if (definition.cron) {
    validateCronJobs(definition);
  }

  checkBlocks(blocks, blockVersions);
}
