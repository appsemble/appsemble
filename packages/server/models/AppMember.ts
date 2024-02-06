import { AppsembleError, UserPropertiesError } from '@appsemble/node-utils';
import { type UserPropertyDefinition } from '@appsemble/types';
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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  App,
  AppOAuth2Authorization,
  AppSamlAuthorization,
  Resource,
  TeamMember,
  User,
} from './index.js';

function getDefaultValue(
  propertyDefinition: OpenAPIV3.SchemaObject | UserPropertyDefinition,
): Record<string, any> | boolean | number | [] | null {
  const pdSchema = has(propertyDefinition, 'schema')
    ? (propertyDefinition as UserPropertyDefinition).schema
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

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  role: string;

  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column(DataType.STRING)
  email: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  emailVerified: boolean;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  emailKey: string;

  @Column(DataType.STRING)
  resetKey: string;

  @Column(DataType.DATE)
  consent: Date;

  @Column(DataType.BLOB)
  picture?: Buffer;

  @Column(DataType.JSON)
  properties?: Record<string, any>;

  @Column(DataType.STRING)
  scimExternalId?: string;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  scimActive?: boolean;

  @Column(DataType.STRING)
  locale?: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Unique('UniqueAppMemberIndex')
  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => User)
  @Unique('UniqueAppMemberIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @HasMany(() => TeamMember)
  TeamMembers: TeamMember[];

  @HasMany(() => AppOAuth2Authorization)
  AppOAuth2Authorizations: AppOAuth2Authorization[];

  @HasMany(() => AppSamlAuthorization)
  AppSamlAuthorizations: AppSamlAuthorization[];

  get hasPicture(): boolean {
    return this.get('hasPicture');
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

    const userPropertiesDefinition = appDefinition.users?.properties;
    const resourcesDefinition = appDefinition.resources;

    const parsedProperties: Record<string, any> = instance.properties || {};
    if (userPropertiesDefinition) {
      const validator = new Validator();

      if (instance.properties) {
        for (const propertyName of Object.keys(instance.properties)) {
          if (!userPropertiesDefinition[propertyName]) {
            throw new UserPropertiesError(`User property ${propertyName} is not allowed`);
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
            throw new UserPropertiesError(
              `Invalid reference to ${referencedResource} resource. This app has no resources definition`,
            );
          }

          if (!resourcesDefinition[referencedResource]) {
            throw new UserPropertiesError(
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
            throw new UserPropertiesError(
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
                throw new UserPropertiesError(
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
                  throw new UserPropertiesError(
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
                throw new UserPropertiesError(
                  `Invalid value ${propertyValue} for property id in ${referencedResource} resource reference. No ${referencedResource} resource exists with this id`,
                );
              }
            } else {
              throw new UserPropertiesError(
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
}
