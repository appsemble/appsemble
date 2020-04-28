import type { QueryOptions, Sequelize } from 'sequelize';

declare function parseOData(queri: string, sequelize: Sequelize): QueryOptions;

export = parseOData;
