import { type AppMemberPropertyDefinition, type AppRole } from '@appsemble/lang-sdk';
import {
  AppMemberPropertiesError,
  AppsembleError,
  PhoneNumberValidationError,
} from '@appsemble/node-utils';
import { type App } from '@appsemble/types';
import { Validator } from 'jsonschema';
import { isValidPhoneNumber } from 'libphonenumber-js';
import { parsePhoneNumber } from 'libphonenumber-js/min';
import { has } from 'lodash-es';
import { type OpenAPIV3 } from 'openapi-types';
import { Op, type Transaction } from 'sequelize';
import {
  AllowNull,
  AfterBulkCreate,
  AfterCreate,
  AfterFind,
  AfterUpdate,
  BeforeBulkCreate,
  BeforeCreate,
  BeforeUpdate,
  Column,
  CreatedAt,
  DataType,
  Default,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  type Repository,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type ResourceGlobal } from './Resource.js';
import {
  type AppMemberEmailAuthorization,
  type AppMemberAssignedRole,
  type AppModels,
  type AppOAuth2Authorization,
  type AppSamlAuthorization,
  type GroupMember,
  type OAuth2AuthorizationCode,
} from '../index.js';

export class AppMemberGlobal extends Model {
  declare id: string;

  declare role: AppRole | null;

  declare roles: AppRole[];

  declare email: string;

  declare emailVerified?: boolean;

  declare name?: string;

  declare password?: string;

  declare emailKey?: string;

  declare resetKey?: string;

  declare consent?: Date;

  declare picture?: Buffer | null;

  declare properties?: Record<string, any>;

  declare scimExternalId?: string;

  declare scimActive: boolean;

  declare locale?: string;

  declare timezone?: string;

  declare phoneNumber?: string;

  declare demo: boolean;

  declare ephemeral: boolean;

  declare seed: boolean;

  declare totpSecret?: Buffer | null;

  declare totpEnabled: boolean;

  declare userId?: string;

  declare created: Date;

  declare updated: Date;

  declare GroupMembers: GroupMember[];

  declare AppOAuth2Authorizations: AppOAuth2Authorization[];

  declare OAuth2AuthorizationCodes: OAuth2AuthorizationCode[];

  declare AppSamlAuthorizations: AppSamlAuthorization[];

  declare AppMemberEmailAuthorizations: AppMemberEmailAuthorization[];

  declare AppMemberAssignedRoles: AppMemberAssignedRole[];

  get hasPicture(): boolean {
    return this.get('hasPicture');
  }
}

function normalizeAppMemberRoles(roles: AppRole[]): AppRole[] {
  return Array.from(new Set((roles ?? []).filter(Boolean)));
}

function getAppMemberRoles(instance: AppMemberGlobal): AppRole[] {
  const roles = instance.getDataValue('roles');

  if (roles) {
    return normalizeAppMemberRoles(roles);
  }

  const assignedRoles = instance.AppMemberAssignedRoles?.map((assignedRole) => assignedRole.role);

  if (assignedRoles?.length) {
    return normalizeAppMemberRoles(assignedRoles);
  }

  const role = instance.getDataValue('role');

  return normalizeAppMemberRoles(role ? [role] : []);
}

function getDefaultValue(
  propertyDefinition: AppMemberPropertyDefinition | OpenAPIV3.SchemaObject,
): Record<string, any> | boolean | number | [] | null {
  const pdSchema = has(propertyDefinition, 'schema')
    ? (propertyDefinition as AppMemberPropertyDefinition).schema
    : (propertyDefinition as OpenAPIV3.SchemaObject);

  const { default: pdDefault, enum: pdEnum, type: pdType } = pdSchema;

  if (pdDefault) {
    return pdDefault;
  }

  if (pdEnum) {
    return pdEnum[0];
  }

  const objectDefaultValue = {} as Record<string, any>;
  switch (pdType) {
    case 'array':
      return [];
    case 'object':
      for (const [subPropertyName, subPropertyDefinition] of Object.entries(
        pdSchema.properties as Record<string, OpenAPIV3.SchemaObject>,
      )) {
        objectDefaultValue[subPropertyName] = getDefaultValue(subPropertyDefinition);
      }
      return objectDefaultValue;
    case 'boolean':
      return false;
    case 'number':
    case 'integer':
      return 0;
    default:
      return null;
  }
}

async function validateAppMemberProperties(
  instance: AppMemberGlobal,
  app: App,
  resourceRepository: Repository<ResourceGlobal>,
): Promise<void> {
  if (!app) {
    throw new AppsembleError('App not found for this app member');
  }

  const { definition: appDefinition, demoMode } = app;

  const userPropertiesDefinition = appDefinition.members?.properties;
  const resourcesDefinition = appDefinition.resources;

  const parsedProperties: Record<string, any> = instance.properties || {};
  if (userPropertiesDefinition) {
    const validator = new Validator();

    if (instance.properties) {
      for (const propertyName of Object.keys(instance.properties)) {
        if (!userPropertiesDefinition[propertyName]) {
          throw new AppMemberPropertiesError(`User property ${propertyName} is not allowed`);
        }
      }
    }

    for (const [propertyName, propertyDefinition] of Object.entries(userPropertiesDefinition)) {
      const propertyValue = instance.properties?.[propertyName];

      const propertyType = propertyDefinition.schema.type;

      const { resource: referencedResource } = propertyDefinition.reference ?? {
        resource: undefined,
      };

      if (referencedResource) {
        if (!resourcesDefinition) {
          throw new AppMemberPropertiesError(
            `Invalid reference to ${referencedResource} resource. This app has no resources definition`,
          );
        }

        if (!resourcesDefinition[referencedResource]) {
          throw new AppMemberPropertiesError(
            `Invalid reference to ${referencedResource} resource. Resource ${referencedResource} does not exist in this app`,
          );
        }
      }

      if (propertyValue) {
        const propertyValueValidationResult = validator.validate(
          propertyValue,
          propertyDefinition.schema,
        );

        if (propertyValueValidationResult.errors.length) {
          throw new AppMemberPropertiesError(
            `Invalid ${typeof propertyValue} value ${JSON.stringify(propertyValue)} for property ${propertyName}`,
          );
        }

        if (referencedResource) {
          if (propertyType === 'array') {
            const validationResult = validator.validate(propertyValue, {
              type: 'array',
              items: { type: 'integer' },
            });

            if (validationResult.errors.length) {
              throw new AppMemberPropertiesError(
                `Invalid value ${
                  propertyValue[validationResult.errors[0].path[0] as number]
                } for property id in ${referencedResource} resource reference`,
              );
            }

            for (const entry of propertyValue) {
              const existingResource = await resourceRepository.findOne({
                attributes: ['id'],
                where: {
                  id: entry,
                  type: referencedResource,
                  ...(demoMode ? { ephemeral: true, seed: false } : {}),
                },
              });
              if (!existingResource) {
                throw new AppMemberPropertiesError(
                  `Invalid value ${entry} for property id in ${referencedResource} resource reference. No ${referencedResource} resource exists with this id`,
                );
              }
            }
          } else if (propertyType === 'integer') {
            const existingResource = await resourceRepository.findOne({
              attributes: ['id'],
              where: {
                id: propertyValue,
                type: referencedResource,
                ...(demoMode ? { ephemeral: true, seed: false } : {}),
              },
            });
            if (!existingResource) {
              throw new AppMemberPropertiesError(
                `Invalid value ${propertyValue} for property id in ${referencedResource} resource reference. No ${referencedResource} resource exists with this id`,
              );
            }
          } else {
            throw new AppMemberPropertiesError(
              `Invalid ${
                propertyType || 'string'
              } value ${propertyValue} for property id in ${referencedResource} resource reference`,
            );
          }
        }

        if (propertyType === 'object') {
          for (const [subPropertyName, subPropertyDefinition] of Object.entries(
            propertyDefinition.schema.properties as Record<string, OpenAPIV3.SchemaObject>,
          )) {
            if (propertyValue[subPropertyName]) {
              continue;
            }

            propertyValue[subPropertyName] = getDefaultValue(subPropertyDefinition);
          }
        }

        parsedProperties[propertyName] = propertyValue;
      } else {
        parsedProperties[propertyName] = getDefaultValue(propertyDefinition);
      }
    }
  }
  // eslint-disable-next-line no-param-reassign
  instance.properties = parsedProperties;
}

function markAppMemberRolesDirty(instance: AppMemberGlobal, dirty: boolean): void {
  Object.assign(instance as AppMemberGlobal & { appMemberRolesDirty?: boolean }, {
    appMemberRolesDirty: dirty,
  });
}

function areAppMemberRolesDirty(instance: AppMemberGlobal): boolean {
  return Boolean(
    (instance as AppMemberGlobal & { appMemberRolesDirty?: boolean }).appMemberRolesDirty,
  );
}

async function hydrateAppMemberRoles(
  sequelize: Sequelize,
  result: AppMemberGlobal | AppMemberGlobal[] | null,
  transaction?: Transaction,
): Promise<void> {
  const instances = Array.isArray(result) ? result : result ? [result] : [];

  if (!instances.length) {
    return;
  }

  const appMemberAssignedRoleModel = sequelize.models
    .AppMemberAssignedRole as Repository<AppMemberAssignedRole>;
  const assignedRoles = await appMemberAssignedRoleModel.findAll({
    where: {
      AppMemberId: {
        [Op.in]: instances.map(({ id }) => id),
      },
    },
    order: [
      ['created', 'ASC'],
      ['role', 'ASC'],
    ],
    transaction,
  });
  const assignedRolesByMemberId = Object.groupBy(assignedRoles, ({ AppMemberId }) => AppMemberId);

  for (const instance of instances) {
    instance.AppMemberAssignedRoles = assignedRolesByMemberId[instance.id] ?? [];
    const roles = getAppMemberRoles(instance);
    instance.setDataValue('roles', roles);
    instance.setDataValue('role', roles[0] ?? null);
    markAppMemberRolesDirty(instance, false);
  }
}

async function syncAppMemberAssignedRoles(
  sequelize: Sequelize,
  result: AppMemberGlobal | AppMemberGlobal[],
  transaction?: Transaction,
): Promise<void> {
  const instances = Array.isArray(result) ? result : [result];
  const dirtyInstances = instances.filter(areAppMemberRolesDirty);

  if (!dirtyInstances.length) {
    return;
  }

  const appMemberAssignedRoleModel = sequelize.models
    .AppMemberAssignedRole as Repository<AppMemberAssignedRole>;
  await appMemberAssignedRoleModel.destroy({
    where: {
      AppMemberId: {
        [Op.in]: dirtyInstances.map(({ id }) => id),
      },
    },
    transaction,
  });

  const rows = dirtyInstances.flatMap(({ id, roles }) =>
    normalizeAppMemberRoles(roles).map((role) => ({
      AppMemberId: id,
      role,
      source: 'manual',
    })),
  );

  if (rows.length) {
    await appMemberAssignedRoleModel.bulkCreate(rows, { transaction });
  }

  await hydrateAppMemberRoles(sequelize, dirtyInstances, transaction);
}

export function createAppMemberModel(sequelize: Sequelize): typeof AppMemberGlobal {
  @Table({ tableName: 'AppMember' })
  class AppMember extends AppMemberGlobal {
    @PrimaryKey
    @IsUUID(4)
    @Default(DataType.UUIDV4)
    @Column(DataType.UUID)
    declare id: string;

    @AllowNull(true)
    @Column({
      type: DataType.STRING,
      get(this: AppMember): AppRole | null {
        return this.getDataValue('role') ?? getAppMemberRoles(this)[0] ?? null;
      },
      set(this: AppMember, value: AppRole | null): void {
        this.setDataValue('role', value);
        this.setDataValue('roles', normalizeAppMemberRoles(value ? [value] : []));
        markAppMemberRolesDirty(this, true);
      },
    })
    declare role: AppRole | null;

    @Column({
      type: DataType.VIRTUAL,
      get(this: AppMember): AppRole[] {
        return getAppMemberRoles(this);
      },
      set(this: AppMember, value: AppRole[] | AppRole | null): void {
        this.setDataValue(
          'roles',
          normalizeAppMemberRoles(Array.isArray(value) ? value : value ? [value] : []),
        );
        markAppMemberRolesDirty(this, true);
      },
    })
    declare roles: AppRole[];

    @AllowNull(false)
    @Index({ name: 'UniqueAppMemberEmailIndex', unique: true })
    @Column(DataType.STRING)
    declare email: string;

    @Default(false)
    @Column(DataType.BOOLEAN)
    declare emailVerified?: boolean;

    @Column(DataType.STRING)
    declare name?: string;

    @Column(DataType.STRING)
    declare password?: string;

    @Column(DataType.STRING)
    declare emailKey?: string;

    @Column(DataType.STRING)
    declare resetKey?: string;

    @Column(DataType.DATE)
    declare consent?: Date;

    @Column(DataType.BLOB)
    declare picture?: Buffer | null;

    @Column(DataType.JSON)
    declare properties?: Record<string, any>;

    @Column(DataType.STRING)
    declare scimExternalId?: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare scimActive: boolean;

    @Column(DataType.STRING)
    declare locale?: string;

    @Column(DataType.STRING)
    declare timezone?: string;

    @AllowNull(true)
    @Column(DataType.STRING)
    @Index({ name: 'UniqueAppMemberPhoneNumberIndex', unique: true })
    declare phoneNumber?: string;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare demo: boolean;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare seed: boolean;

    @AllowNull(false)
    @Default(false)
    @Index({ name: 'UniqueAppMemberEmailIndex', unique: true })
    @Column(DataType.BOOLEAN)
    declare ephemeral: boolean;

    @Column(DataType.UUID)
    @Index({ name: 'UniqueAppMemberUserIndex', unique: true })
    declare userId?: string;

    @AllowNull(true)
    @Column(DataType.BLOB)
    declare totpSecret?: Buffer | null;

    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare totpEnabled: boolean;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    static associate(models: AppModels): void {
      AppMember.hasMany(models.AppMemberAssignedRole, {
        foreignKey: 'AppMemberId',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      AppMember.hasMany(models.GroupMember);
      AppMember.hasMany(models.AppOAuth2Authorization);
      AppMember.hasMany(models.AppMemberEmailAuthorization);
      AppMember.hasMany(models.OAuth2AuthorizationCode, {
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      });
      AppMember.hasMany(models.AppSamlAuthorization);
    }

    static addHooks(models: AppModels, app: App): void {
      AppMember.addHook('beforeCreate', 'validateAppMemberProperties', (instance: AppMember) =>
        validateAppMemberProperties(instance, app, models.Resource),
      );
      AppMember.addHook('beforeUpdate', 'validateAppMemberProperties', (instance: AppMember) =>
        validateAppMemberProperties(instance, app, models.Resource),
      );
    }

    @AfterFind
    static async loadAssignedRoles(instance: AppMember | AppMember[] | null): Promise<void> {
      if (!sequelize.models.AppMemberAssignedRole) {
        return;
      }

      await hydrateAppMemberRoles(sequelize, instance);
    }

    @AfterCreate
    @AfterUpdate
    static async updateAssignedRoles(
      instance: AppMember,
      options: { transaction?: Transaction },
    ): Promise<void> {
      await syncAppMemberAssignedRoles(sequelize, instance, options.transaction);
    }

    @AfterBulkCreate
    static async updateBulkAssignedRoles(
      instances: AppMember[],
      options: { transaction?: Transaction },
    ): Promise<void> {
      await syncAppMemberAssignedRoles(sequelize, instances, options.transaction);
    }

    @BeforeCreate
    @BeforeUpdate
    static async validateCronJobMember(instance: AppMember): Promise<void> {
      const roles = getAppMemberRoles(instance);

      if (!roles.includes('cron')) {
        return;
      }

      if (roles.length !== 1) {
        throw new AppsembleError('App member with role `cron` cannot have additional roles');
      }

      const appMemberAssignedRoleModel = sequelize.models
        .AppMemberAssignedRole as Repository<AppMemberAssignedRole>;
      const memberCount = await appMemberAssignedRoleModel.count({
        where: {
          AppMemberId: {
            [Op.ne]: instance.id,
          },
          role: 'cron',
        },
      });

      if (memberCount > 0) {
        throw new AppsembleError('App member with role `cron` already exists for this app');
      }
    }

    @BeforeCreate
    @BeforeUpdate
    static normalizeRoles(instance: AppMember): void {
      const roles = getAppMemberRoles(instance);
      instance.setDataValue('roles', roles);
      instance.setDataValue('role', roles[0] ?? null);
    }

    @BeforeBulkCreate
    static normalizeBulkRoles(instances: AppMember[]): void {
      for (const instance of instances) {
        AppMember.normalizeRoles(instance);
      }
    }

    @BeforeCreate
    @BeforeUpdate
    static validatePhoneNumber(instance: AppMember): void {
      if (!instance.phoneNumber) {
        return;
      }
      if (!isValidPhoneNumber(instance.phoneNumber, 'NL')) {
        throw new PhoneNumberValidationError('Invalid Phone Number');
      }
      Object.assign(instance, {
        phoneNumber: parsePhoneNumber(instance.phoneNumber, 'NL').format('INTERNATIONAL'),
      });
    }

    @BeforeCreate
    @BeforeUpdate
    static validateSeedAppMember(instance: AppMember): void {
      if (!instance.seed) {
        return;
      }

      if (instance.seed && !instance.demo) {
        throw new AppsembleError('Seed app members can only exist in demo apps');
      }
    }
  }

  sequelize.addModels([AppMember]);
  return AppMember;
}
