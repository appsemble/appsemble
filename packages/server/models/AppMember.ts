import { AppMemberPropertiesError, AppsembleError } from '@appsemble/node-utils';
import { type AppMemberPropertyDefinition } from '@appsemble/types';
import { Validator } from 'jsonschema';
import { has } from 'lodash-es';
import { type OpenAPIV3 } from 'openapi-types';
import {
  AllowNull,
  BeforeCreate,
  BeforeUpdate,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  App,
  AppOAuth2Authorization,
  AppSamlAuthorization,
  GroupMember,
  OAuth2AuthorizationCode,
  Resource,
  User,
} from './index.js';

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  role!: string;

  @AllowNull(false)
  @Index({ name: 'UniqueAppMemberEmailIndex', unique: true })
  @Column(DataType.STRING)
  email!: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  emailVerified?: boolean;

  @Column(DataType.STRING)
  name?: string;

  @Column(DataType.STRING)
  password?: string;

  @Column(DataType.STRING)
  emailKey?: string;

  @Column(DataType.STRING)
  resetKey?: string;

  @Column(DataType.DATE)
  consent?: Date;

  @Column(DataType.BLOB)
  picture?: Buffer | null;

  @Column(DataType.JSON)
  properties?: Record<string, any>;

  @Column(DataType.STRING)
  scimExternalId?: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  scimActive!: boolean;

  @Column(DataType.STRING)
  locale?: string;

  @Column(DataType.STRING)
  timezone?: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  demo!: boolean;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Index({ name: 'UniqueAppMemberEmailIndex', unique: true })
  @Index({ name: 'UniqueAppMemberIndex', unique: true })
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @ForeignKey(() => User)
  @Index({ name: 'UniqueAppMemberIndex', unique: true })
  @Column(DataType.UUID)
  UserId?: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User?: Awaited<User>;

  @HasMany(() => GroupMember)
  GroupMembers!: GroupMember[];

  @HasMany(() => AppOAuth2Authorization)
  AppOAuth2Authorizations!: AppOAuth2Authorization[];

  @HasMany(() => OAuth2AuthorizationCode, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  OAuth2AuthorizationCodes!: OAuth2AuthorizationCode[];

  @HasMany(() => AppSamlAuthorization)
  AppSamlAuthorizations!: AppSamlAuthorization[];

  get hasPicture(): boolean {
    return this.get('hasPicture');
  }

  private static getDefaultValue(
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
          objectDefaultValue[subPropertyName] = this.getDefaultValue(subPropertyDefinition);
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

  @BeforeCreate
  static async validateCronJobMember(instance: AppMember): Promise<void> {
    if (instance.role !== 'cron') {
      return;
    }
    const memberCount = await AppMember.count({
      where: {
        role: 'cron',
        AppId: instance.AppId,
      },
    });
    if (memberCount > 0) {
      throw new AppsembleError('App member with role `cron` already exists for this app');
    }
  }

  @BeforeCreate
  @BeforeUpdate
  static async validateUserProperties(instance: AppMember): Promise<void> {
    const app = await App.findOne({
      attributes: ['id', 'definition', 'demoMode'],
      ...(instance.AppId
        ? {
            where: {
              id: instance.AppId,
            },
          }
        : {
            ...(instance.id
              ? {
                  include: [
                    {
                      model: AppMember,
                      where: {
                        id: instance.id,
                      },
                      required: true,
                    },
                  ],
                }
              : {}),
          }),
    });

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
                const existingResource = await Resource.findOne({
                  attributes: ['id'],
                  where: {
                    id: entry,
                    type: referencedResource,
                    AppId: app.id,
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
              const existingResource = await Resource.findOne({
                attributes: ['id'],
                where: {
                  id: propertyValue,
                  type: referencedResource,
                  AppId: app.id,
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

              propertyValue[subPropertyName] = this.getDefaultValue(subPropertyDefinition);
            }
          }

          parsedProperties[propertyName] = propertyValue;
        } else {
          parsedProperties[propertyName] = this.getDefaultValue(propertyDefinition);
        }
      }
    }
    // eslint-disable-next-line no-param-reassign
    instance.properties = parsedProperties;
  }
}
