import { AppDefinition, BlockManifest, ResourceCall, Security } from '@appsemble/types';
import { parseExpression } from 'cron-parser';
import { Validator } from 'jsonschema';
import languageTags from 'language-tags';
import { Promisable } from 'type-fest';

import { BlockMap, getAppBlocks } from './getAppBlocks';

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
  blockVersions.forEach((version) => {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name).set(version.version, version);
  });
  const errors = Object.entries(blocks).reduce<Record<string, string>>((acc, [loc, block]) => {
    const type = block.type.startsWith('@') ? block.type : `@appsemble/${block.type}`;
    const versions = blockVersionMap.get(type);
    if (!versions) {
      return { ...acc, [loc]: `Unknown block type “${type}”` };
    }
    if (!versions.has(block.version)) {
      return { ...acc, [loc]: `Unknown block version “${type}@${block.version}”` };
    }

    const actionParameters = new Set<string>();
    const version = versions.get(block.version);
    if (version.parameters) {
      const validator = new Validator();

      validator.customFormats.fontawesome = () => true;
      validator.customFormats.remapper = () => true;
      validator.customFormats.action = (property) => {
        actionParameters.add(property);
        return block.actions && Object.hasOwnProperty.call(block.actions, property);
      };
      validator.customFormats['event-listener'] = (property) =>
        block.events?.listen && Object.hasOwnProperty.call(block.events.listen, property);
      validator.customFormats['event-emitter'] = (property) =>
        block.events?.emit && Object.hasOwnProperty.call(block.events.emit, property);
      const result = validator.validate(block.parameters || {}, version.parameters);
      if (!result.valid) {
        return result.errors.reduce(
          (accumulator, error) => ({
            ...accumulator,
            [`${loc}.parameters.${error.property.replace(/^instance\./, '')}`]: error.message,
          }),
          acc,
        );
      }
    }

    if (!version.actions) {
      if (block.actions) {
        return { ...acc, [`${loc}.actions`]: 'This block doesn’t support any actions' };
      }
      return acc;
    }

    Object.keys(block.actions || {}).forEach((key) => {
      if (version.actions.$any) {
        if (actionParameters.has(key)) {
          return;
        }

        if (!Object.keys(version.actions).includes(key)) {
          acc[`${loc}.actions.${key}`] = `Custom action “${key}” is unused`;
        }
      } else if (!Object.hasOwnProperty.call(version.actions, key)) {
        acc[`${loc}.actions.${key}`] = 'Unknown action type';
      }
    });

    Object.keys(block.events?.emit || {}).forEach((key) => {
      if (
        !version.events?.emit?.$any &&
        !Object.hasOwnProperty.call(version.events?.emit || {}, key)
      ) {
        acc[`${loc}.events.emit.${key}`] = 'Unknown event emitter';
      }
    });

    Object.keys(block.events?.listen || {}).forEach((key) => {
      if (
        !version.events?.listen?.$any &&
        !Object.hasOwnProperty.call(version.events?.listen || {}, key)
      ) {
        acc[`${loc}.events.listen.${key}`] = 'Unknown event listener';
      }
    });

    return acc;
  }, {});
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
    securityRole.inherits.forEach((inheritedRole) =>
      validateSecurityRoles(securityDefinition, inheritedRole, checkedRoles),
    );
  }
}

/**
 * Validates security-related definitions within the app definition.
 *
 * @param definition - The definition of the app
 */
export function validateSecurity(definition: AppDefinition): void {
  const { pages, roles, security } = definition;

  if (!Object.keys(security.roles).includes(security.default.role)) {
    throw new AppsembleValidationError(
      `Default role ‘${security.default.role}’ does not exist in list of roles.`,
    );
  }

  Object.keys(security.roles).forEach((role) => validateSecurityRoles(security, role, []));

  if (roles) {
    roles.forEach((role) => {
      if (!Object.keys(security.roles).includes(role)) {
        throw new AppsembleValidationError(`Role ‘${role}’ in App roles does not exist.`);
      }
    });
  }

  pages.forEach((page) => {
    if (page.roles?.length) {
      page.roles.forEach((role) => {
        if (
          !Object.keys(security.roles).includes(role) &&
          role !== '$team:member' &&
          role !== '$team:manager'
        ) {
          throw new AppsembleValidationError(
            `Role ‘${role}’ in page ‘${page.name}’ roles does not exist.`,
          );
        }
      });
    }
  });

  const blocks = getAppBlocks(definition);

  Object.entries(blocks).forEach(([key, block]) => {
    if (block.roles?.length) {
      block.roles.forEach((role) => {
        if (!Object.keys(security.roles).includes(role)) {
          throw new AppsembleValidationError(`Role ‘${role}’ in ${key} roles does not exist.`);
        }
      });
    }
  });
}

/**
 * Validates the hooks in resource definition to ensure its properties are valid.
 *
 * @param {} definition - The definition of the app
 */
export function validateHooks(definition: AppDefinition): void {
  const filter = new Set(['create', 'update', 'delete']);
  Object.entries(definition.resources).forEach(([resourceKey, resource]) => {
    Object.entries(resource)
      .filter(([key]) => filter.has(key))
      .forEach(([actionKey, action]: [string, ResourceCall]) => {
        const { hooks } = action;
        if (hooks?.notification?.to) {
          hooks.notification.to.forEach((to) => {
            if (to !== '$author' && !Object.hasOwnProperty.call(definition.security.roles, to)) {
              throw new AppsembleValidationError(
                `Role ‘${to}’ in resources.${resourceKey}.${actionKey}.hooks.notification.to does not exist.`,
              );
            }
          });
        }
      });
  });
}

export function validateReferences(definition: AppDefinition): void {
  Object.entries(definition.resources).forEach(([resourceType, resource]) => {
    if (resource.references) {
      Object.entries(resource.references).forEach(([field, reference]) => {
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
      });
    }
  });
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
  Object.entries(cron).forEach(([id, job]) => {
    try {
      parseExpression(job.schedule);
    } catch {
      throw new AppsembleValidationError(
        `Cronjob ${id} contains an invalid expression: ${job.schedule}`,
      );
    }
  });
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
