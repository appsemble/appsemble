import { logger } from '@appsemble/node-utils';
import { type App, type Resource as ResourceType } from '@appsemble/types';
import { DataTypes, type DestroyOptions, type FindOptions } from 'sequelize';
import {
  AfterDestroy,
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Index,
  Model,
  PrimaryKey,
  type Repository,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  type AppMember,
  type AppModels,
  type Asset,
  type Group,
  type ResourceSubscription,
  type ResourceVersion,
} from '../index.js';

interface ResourceToJsonOptions {
  /**
   * Properties to exclude from the result.
   *
   * @default ['$clonable', '$seed']
   */
  exclude?: string[];

  /**
   * If specified, only include these properties.
   */
  include?: string[];
}

export class ResourceGlobal extends Model {
  id!: number;

  type!: string;

  data!: any;

  /**
   * If true, the resource will be transferred when cloning an app
   */
  clonable!: boolean;

  /**
   * If true, the resource will be used for creating ephemeral resources in demo apps
   */

  seed!: boolean;

  /**
   * If true, the resource is cleaned up regularly
   */

  ephemeral!: boolean;

  expires?: Date;

  Position?: number;

  created!: Date;

  updated!: Date;

  deleted?: Date;

  GroupId?: number;

  AuthorId?: string;

  EditorId?: string;

  Group?: Awaited<Group>;

  Author?: Awaited<AppMember>;

  Editor?: Awaited<AppMember>;

  Assets!: Asset[];

  ResourceSubscriptions!: ResourceSubscription[];

  ResourceVersions!: ResourceVersion[];

  /**
   * Represent a resource as JSON output
   *
   * @param options Serialization options.
   * @returns A JSON representation of the resource.
   */
  toJSON({ exclude = ['$clonable', '$seed'], include }: ResourceToJsonOptions = {}): ResourceType {
    const result: ResourceType = {
      ...this.data,
      id: this.id,
      ...(this.Position == null ? {} : { Position: this.Position }),
      $created: this.created.toJSON(),
      $updated: this.updated.toJSON(),
    };

    if (this.Author) {
      result.$author = { id: this.Author.id, name: this.Author.name };
    }

    if (this.Editor) {
      result.$editor = { id: this.Editor.id, name: this.Editor.name };
    }

    if (this.Group) {
      result.$group = { id: this.Group.id, name: this.Group.name };
    }

    if (this.clonable != null) {
      result.$clonable = this.clonable;
    }

    if (this.seed != null) {
      result.$seed = this.seed;
    }

    if (this.ephemeral) {
      result.$ephemeral = this.ephemeral;
    }

    if (this.expires) {
      result.$expires = this.expires.toJSON();
    }

    if (include) {
      for (const name of Object.keys(result)) {
        if (!include.includes(name)) {
          delete result[name];
        }
      }
    }

    if (exclude) {
      for (const name of exclude) {
        delete result[name];
      }
    }

    return result;
  }
}

async function beforeDestroyHook(
  instance: ResourceGlobal,
  app: App,
  resourceRepository: Repository<ResourceGlobal>,
  appMemberRepository: Repository<AppMember>,
): Promise<void> {
  const resource = await resourceRepository.findByPk(instance.id, { attributes: ['id', 'type'] });
  const appMembers = await appMemberRepository.findAll({ attributes: ['id', 'properties'] });

  if (!app || !resource || !appMembers.length) {
    return;
  }

  const appMembersToUpdate: Record<string, Record<string, number[] | number>> = {};

  const userPropertiesDefinition = app.definition.members?.properties;

  if (!userPropertiesDefinition) {
    return;
  }

  for (const appMember of appMembers) {
    if (!appMembersToUpdate[appMember.id]) {
      appMembersToUpdate[appMember.id] = {
        ...appMember.properties,
      };
    }

    const referencedProperties = Object.entries(userPropertiesDefinition).filter(
      ([, pd]) => pd.reference?.resource === resource.type,
    );

    for (const [propertyName, propertyDefinition] of referencedProperties) {
      let updatedValue;
      if (propertyDefinition.schema.type === 'integer') {
        updatedValue = 0;
      }

      if (propertyDefinition.schema.type === 'array') {
        updatedValue = appMember.properties?.[propertyName]?.filter(
          (entry: number) => entry !== resource.id,
        );
      }

      appMembersToUpdate[appMember.id] = {
        ...appMembersToUpdate[appMember.id],
        [propertyName]: updatedValue,
      };
    }
  }

  logger.info(`Updating user properties for ${resource.type} resource ${resource.id}.`);

  for (const [appMemberId, properties] of Object.entries(appMembersToUpdate)) {
    await appMemberRepository.update({ properties }, { where: { id: appMemberId } });
  }

  logger.info(
    `Updated ${Object.keys(appMembersToUpdate).length} users' properties for ${
      resource.type
    } resource ${resource.id}.`,
  );
}

async function beforeBulkDestroyHook(
  options: FindOptions,
  app: App,
  resourceRepository: Repository<ResourceGlobal>,
  appMemberRepository: Repository<AppMember>,
): Promise<void> {
  const resources = await resourceRepository.findAll({
    where: { ...options.where },
    attributes: ['id', 'type'],
  });

  const appMembers = await appMemberRepository.findAll({ attributes: ['id', 'properties'] });

  if (!app || !resources.length || !appMembers.length) {
    return;
  }

  const appMembersToUpdate: Record<string, Record<string, number[] | number>> = {};

  const userPropertiesDefinition = app.definition.members?.properties;

  if (!userPropertiesDefinition) {
    return;
  }

  for (const appMember of appMembers) {
    if (!appMembersToUpdate[appMember.id]) {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks) - Severe
      appMembersToUpdate[appMember.id] = appMember.properties;
    }

    for (const [propertyName, propertyDefinition] of Object.entries(userPropertiesDefinition)) {
      if (!propertyDefinition.reference) {
        return;
      }

      let updatedValue;

      if (propertyDefinition.schema.type === 'integer') {
        updatedValue = 0;
      }

      if (propertyDefinition.schema.type === 'array') {
        updatedValue = appMember.properties?.[propertyName].filter(
          (entry: number) =>
            !resources
              .filter((resource) => resource.type === propertyDefinition.reference?.resource)
              .map((resource) => resource.id)
              .includes(entry),
        );
      }

      appMembersToUpdate[appMember.id] = {
        ...appMembersToUpdate[appMember.id],
        [propertyName]: updatedValue,
      };
    }
  }

  for (const [appMemberId, properties] of Object.entries(appMembersToUpdate)) {
    await appMemberRepository.update({ properties }, { where: { id: appMemberId } });
  }

  logger.info(`Updated ${Object.keys(appMembersToUpdate).length} users' properties.`);
}

export function createResourceModel(sequelize: Sequelize): typeof ResourceGlobal {
  @Table({ tableName: 'Resource', paranoid: true })
  class Resource extends ResourceGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Index({ name: 'resourceTypeComposite' })
    @Column(DataType.STRING)
    type!: string;

    @AllowNull(false)
    @Column(DataType.JSONB)
    @Index({ name: 'resourceDataIndex' })
    data!: any;

    /**
     * If true, the resource will be transferred when cloning an app
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    clonable!: boolean;

    /**
     * If true, the resource will be used for creating ephemeral resources in demo apps
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    seed!: boolean;

    /**
     * If true, the resource is cleaned up regularly
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    ephemeral!: boolean;

    @Column(DataType.DATE)
    @Index({ name: 'resourceTypeComposite' })
    expires?: Date;

    @AllowNull(true)
    @Column(DataTypes.DECIMAL)
    Position?: number;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @DeletedAt
    deleted?: Date;

    @Index({ name: 'resourceTypeComposite' })
    @AllowNull(true)
    @Column(DataType.INTEGER)
    GroupId?: number;

    @Column(DataType.UUID)
    AuthorId?: string;

    @Column(DataType.UUID)
    EditorId?: string;

    static associate(models: AppModels): void {
      Resource.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      Resource.belongsTo(models.AppMember, {
        foreignKey: 'AuthorId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        as: 'Author',
      });
      Resource.belongsTo(models.AppMember, {
        foreignKey: 'EditorId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        as: 'Editor',
      });
      Resource.hasMany(models.Asset, { onDelete: 'CASCADE' });
      Resource.hasMany(models.ResourceSubscription, { onDelete: 'CASCADE' });
      Resource.hasMany(models.ResourceVersion, { onDelete: 'CASCADE' });
    }

    static addHooks(models: AppModels, app: App): void {
      Resource.addHook('beforeDestroy', (instance) =>
        beforeDestroyHook(instance as Resource, app, models.Resource, models.AppMember),
      );
      Resource.addHook('beforeBulkDestroy', (options) =>
        beforeBulkDestroyHook(options, app, models.Resource, models.AppMember),
      );
    }

    @AfterDestroy
    static async afterDestroyHook(instance: Resource, { force }: DestroyOptions): Promise<void> {
      if (force || !instance?.ephemeral) {
        return;
      }
      await instance?.destroy({ force: true });
    }
  }

  sequelize.addModels([Resource]);
  return Resource;
}
