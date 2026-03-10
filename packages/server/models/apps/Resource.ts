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
  declare id: number;

  declare type: string;

  declare data: any;

  /**
   * If true, the resource will be transferred when cloning an app
   */
  declare clonable: boolean;

  /**
   * If true, the resource will be used for creating ephemeral resources in demo apps
   */

  declare seed: boolean;

  /**
   * If true, the resource is cleaned up regularly
   */

  declare ephemeral: boolean;

  declare expires?: Date;

  declare Position?: number;

  declare created: Date;

  declare updated: Date;

  declare deleted?: Date;

  declare GroupId?: number;

  declare AuthorId?: string;

  declare EditorId?: string;

  declare Group?: Awaited<Group>;

  declare Author?: Awaited<AppMember>;

  declare Editor?: Awaited<AppMember>;

  declare Assets: Asset[];

  declare ResourceSubscriptions: ResourceSubscription[];

  declare ResourceVersions: ResourceVersion[];

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
    declare id: number;

    @AllowNull(false)
    @Index({ name: 'resourceTypeComposite' })
    @Column(DataType.STRING)
    declare type: string;

    @AllowNull(false)
    @Column(DataType.JSONB)
    @Index({ name: 'resourceDataIndex' })
    declare data: any;

    /**
     * If true, the resource will be transferred when cloning an app
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare clonable: boolean;

    /**
     * If true, the resource will be used for creating ephemeral resources in demo apps
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare seed: boolean;

    /**
     * If true, the resource is cleaned up regularly
     */
    @AllowNull(false)
    @Default(false)
    @Column(DataType.BOOLEAN)
    declare ephemeral: boolean;

    @Column(DataType.DATE)
    @Index({ name: 'resourceTypeComposite' })
    declare expires?: Date;

    @AllowNull(true)
    @Column(DataTypes.DECIMAL)
    declare Position?: number;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @DeletedAt
    declare deleted?: Date;

    @Index({ name: 'resourceTypeComposite' })
    @AllowNull(true)
    @Column(DataType.INTEGER)
    declare GroupId?: number;

    @Column(DataType.UUID)
    declare AuthorId?: string;

    @Column(DataType.UUID)
    declare EditorId?: string;

    static associate(models: AppModels): void {
      Resource.belongsTo(models.Group, {
        foreignKey: 'GroupId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      Resource.belongsTo(models.AppMember, {
        foreignKey: { name: 'AuthorId', allowNull: true },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        as: 'Author',
      });
      Resource.belongsTo(models.AppMember, {
        foreignKey: { name: 'EditorId', allowNull: true },
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
