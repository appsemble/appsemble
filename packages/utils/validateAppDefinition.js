import Ajv from 'ajv';

import getAppBlocks from './getAppBlocks';

const ajv = new Ajv();
ajv.addFormat('fontawesome', () => true);

/**
 * Used for throwing known Appsemble validation errors.
 */
export class AppsembleValidationError extends Error {
  /**
   * @param {string} message The error message to show to the user.
   * @param {any} data Additional data that can be passed to convey additional info about the error.
   */
  constructor(message, data) {
    super(message);
    this.name = 'AppsembleError';
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

async function checkBlocks(blocks, blockVersions) {
  const blockVersionMap = new Map();
  blockVersions.forEach(version => {
    if (!blockVersionMap.has(version.name)) {
      blockVersionMap.set(version.name, new Map());
    }
    blockVersionMap.get(version.name).set(version.version, version);
  });
  const errors = Object.entries(blocks).reduce((acc, [loc, block]) => {
    const type = block.type.startsWith('@') ? block.type : `@appsemble/${block.type}`;
    const versions = blockVersionMap.get(type);
    if (!versions) {
      return { ...acc, [loc]: `Unknown block type “${type}”` };
    }
    if (!versions.has(block.version)) {
      return { ...acc, [loc]: `Unknown block version “${type}@${block.version}”` };
    }
    const version = versions.get(block.version);
    if (version.parameters) {
      const validate = ajv.compile(version.parameters);
      const valid = validate(block.parameters || {});
      if (!valid) {
        return validate.errors.reduce(
          (accumulator, error) => ({
            ...accumulator,
            [`${loc}.parameters${error.dataPath}`]: error,
          }),
          acc,
        );
      }
    }
    return acc;
  }, null);
  if (errors) {
    throw new AppsembleValidationError('Block validation failed', errors);
  }
}

/**
 * Check if the security roles are valid.
 *
 * @param securityDefinition The security definition to use for checking the role.
 * @param role The role the user is checked against.
 * @param userRole The role the user has.
 * @param checkedRoles Array containing the roles already checked.
 */
export function validateSecurityRoles(securityDefinition, role, checkedRoles = []) {
  if (checkedRoles.includes(role)) {
    throw new AppsembleValidationError(`Cyclic inheritance found for role ‘${role}’.`);
  }

  const securityRole = securityDefinition.roles[role];

  if (!securityRole) {
    throw new AppsembleValidationError(`Role ‘${role}’ not found in security definition.`);
  }

  if (securityRole.inherits) {
    checkedRoles.push(role);
    securityRole.inherits.forEach(inheritedRole =>
      validateSecurityRoles(securityDefinition, inheritedRole, checkedRoles),
    );
  }
}

/**
 * Validates security-related definitions within the app definition.
 *
 * @param {AppDefinition} definition The definition of the app
 */
export function validateSecurity(definition) {
  const { pages, roles, security } = definition;

  if (!Object.keys(security.roles).includes(security.default.role)) {
    throw new AppsembleValidationError(
      `Default role ‘${security.default.role}’ does not exist in list of roles.`,
    );
  }

  Object.keys(security.roles).forEach(role => validateSecurityRoles(security, role, []));

  if (roles) {
    roles.forEach(role => {
      if (!Object.keys(security.roles).includes(role)) {
        throw new AppsembleValidationError(`Role ‘${role}’ in App roles does not exist.`);
      }
    });
  }

  pages.forEach(page => {
    if (page.roles && page.roles.length) {
      page.roles.forEach(role => {
        if (!Object.keys(security.roles).includes(role)) {
          throw new AppsembleValidationError(
            `Role ‘${role}’ in page ‘${page.name}’ roles does not exist.`,
          );
        }
      });
    }
  });

  const blocks = getAppBlocks(definition);

  Object.entries(blocks).forEach(([key, block]) => {
    if (block.roles && block.roles.length) {
      block.roles.forEach(role => {
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
 * @param {} definition The definition of the app
 */
export function validateHooks(definition) {
  const filter = ['create', 'update', 'delete'];
  Object.entries(definition.resources).forEach(([resourceKey, resource]) => {
    Object.entries(resource)
      .filter(([key]) => filter.includes(key))
      .forEach(([actionKey, action]) => {
        const { hooks } = action;
        if (hooks && hooks.notification && hooks.notification.to) {
          hooks.notification.to.forEach(to => {
            if (
              to !== '$author' &&
              !Object.prototype.hasOwnProperty.call(definition.security.roles, to)
            ) {
              throw new AppsembleValidationError(
                `Role ‘${to}’ in resources.${resourceKey}.${actionKey}.hooks.notification.to does not exist.`,
              );
            }
          });
        }
      });
  });
}

export default async function validateAppDefinition(definition, getBlockVersions) {
  const blocks = getAppBlocks(definition);
  const blockVersions = await getBlockVersions(blocks);

  if (definition.security) {
    validateSecurity(definition);
  }

  if (definition.resources) {
    validateHooks(definition);
  }

  await checkBlocks(blocks, blockVersions);
}
