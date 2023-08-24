import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import globalCacheDir from 'global-cache-dir';

import { Methods, setAppName } from './methods.js';

const appName = 'testApp';

setAppName(appName);
const cacheDir = await globalCacheDir('appsemble');
const dbDir = join(cacheDir, appName);
const dbPath = join(dbDir, 'db.json');

describe('methods', () => {
  afterAll(async () => {
    await rm(dbDir, { recursive: true, force: true });
  });

  describe('create', () => {
    it('should create a new record and return it', async () => {
      const result = await Methods.create({ name: 'testInstance' }, '/testModel');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'testInstance');
    });

    it('should add default values to the record', async () => {
      const result = await Methods.create({ name: 'testInstance' }, '/testModel');
      expect(result).toHaveProperty('$created');
      expect(result).toHaveProperty('$updated');
      expect(result).toHaveProperty('AppId');
      expect(result).toHaveProperty('AuthorId');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple new records and return them', async () => {
      const result = await Methods.bulkCreate(
        [{ name: 'testInstance2' }, { name: 'testInstance3' }],
        '/testModel',
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name', 'testInstance2');
      expect(result[1]).toHaveProperty('id');
      expect(result[1]).toHaveProperty('name', 'testInstance3');
    });

    it('should add default values to the records', async () => {
      const result = await Methods.bulkCreate(
        [{ name: 'testInstance2' }, { name: 'testInstance3' }],
        '/testModel',
      );
      expect(result[0]).toHaveProperty('$created');
      expect(result[0]).toHaveProperty('$updated');
      expect(result[0]).toHaveProperty('AppId');
      expect(result[0]).toHaveProperty('AuthorId');
      expect(result[1]).toHaveProperty('$created');
      expect(result[1]).toHaveProperty('$updated');
      expect(result[1]).toHaveProperty('AppId');
      expect(result[1]).toHaveProperty('AuthorId');
    });
  });

  describe('findById', () => {
    it('should return a record by id', async () => {
      await writeFile(dbPath, '{"testModel":[{"id":1,"name":"testInstance1"}]}');
      const result = await Methods.findById(1, '/testModel');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', 1);
    });

    it('should return null if no record exists with the given id', async () => {
      const result = await Methods.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a record that matches the query', async () => {
      await writeFile(dbPath, '{"testModel":[{"id":1,"name":"testInstance1"}]}');
      const result = await Methods.findOne({ where: { name: 'testInstance1' } }, '/testModel');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('name', 'testInstance1');
    });

    it('should return null if no record matches the query', async () => {
      const result = await Methods.findOne({ where: { name: 'nonexistent' } }, '/testModel');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an empty array when no entities exist', async () => {
      const entities = await Methods.findAll({}, '/');
      expect(entities).toStrictEqual([]);
    });

    it('should return all entities when no query is provided', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      const entities = await Methods.findAll({}, '/person');
      expect(entities).toStrictEqual([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ]);
    });

    it('should return all entities with only the specified attributes', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      const entities = await Methods.findAll({ attributes: ['name', 'age'] }, '/person');
      expect(entities).toStrictEqual([
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ]);
    });

    describe('should filter entities using where clauses', () => {
      it('that contain and', async () => {
        await writeFile(
          dbPath,
          '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
        );
        const entities = await Methods.findAll(
          {
            where: {
              and: [{ name: { eq: 'Alice' } }, { age: { gt: 20 } }],
            },
          },
          '/person',
        );
        expect(entities).toStrictEqual([{ id: 1, name: 'Alice', age: 30 }]);
      });

      it('that contain or', async () => {
        await writeFile(
          dbPath,
          '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
        );
        const entities = await Methods.findAll(
          {
            where: {
              or: [{ name: { eq: 'Alice' } }, { age: { gt: 20 } }],
            },
          },
          '/person',
        );
        expect(entities).toStrictEqual([
          { id: 1, name: 'Alice', age: 30 },
          { id: 2, name: 'Alice', age: 20 },
          { id: 3, name: 'Bob', age: 25 },
          { id: 4, name: 'Charlie', age: 35 },
        ]);
      });

      describe('that contain a comparison', () => {
        describe('for greater than', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ age: { gt: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', age: 30 },
              { id: 4, name: 'Charlie', age: 35 },
            ]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { gt: '2023-07-04T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', birthDate: new Date('2023-07-05T13:18:26.870Z') },
            ]);
          });
        });

        describe('for greater than or equal', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesGte = await Methods.findAll(
              {
                where: {
                  or: [{ age: { gte: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesGte).toStrictEqual([
              { id: 1, name: 'Alice', age: 30 },
              { id: 3, name: 'Bob', age: 25 },
              { id: 4, name: 'Charlie', age: 35 },
            ]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"},{"id":2,"name":"Bob","birthDate":"2023-07-04T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { gte: '2023-07-04T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', birthDate: new Date('2023-07-05T13:18:26.870Z') },
              { id: 2, name: 'Bob', birthDate: new Date('2023-07-04T13:18:26.870Z') },
            ]);
          });
        });

        describe('for less than', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesLt = await Methods.findAll(
              {
                where: {
                  or: [{ age: { lt: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesLt).toStrictEqual([{ id: 2, name: 'Alice', age: 20 }]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { lt: '2023-07-06T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', birthDate: new Date('2023-07-05T13:18:26.870Z') },
            ]);
          });
        });

        describe('for less than or equal', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesLt = await Methods.findAll(
              {
                where: {
                  or: [{ age: { lte: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesLt).toStrictEqual([
              { id: 2, name: 'Alice', age: 20 },
              { id: 3, name: 'Bob', age: 25 },
            ]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"},{"id":2,"name":"Bob","birthDate":"2023-07-04T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { lte: '2023-07-05T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', birthDate: new Date('2023-07-05T13:18:26.870Z') },
              { id: 2, name: 'Bob', birthDate: new Date('2023-07-04T13:18:26.870Z') },
            ]);
          });
        });

        describe('for equal', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesEq = await Methods.findAll(
              {
                where: {
                  or: [{ age: { eq: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesEq).toStrictEqual([{ id: 3, name: 'Bob', age: 25 }]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"},{"id":2,"name":"Bob","birthDate":"2023-07-04T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { eq: '2023-07-04T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 2, name: 'Bob', birthDate: new Date('2023-07-04T13:18:26.870Z') },
            ]);
          });

          it('for boolean values', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","married":false},{"id":2,"name":"Bob","married":true}]}',
            );
            const entitiesEq = await Methods.findAll(
              {
                where: {
                  or: [{ married: { eq: true } }],
                },
              },
              '/person',
            );
            expect(entitiesEq).toStrictEqual([{ id: 2, name: 'Bob', married: true }]);
          });

          it('for strings', async () => {
            await writeFile(dbPath, '{"person":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}');
            const entitiesEq = await Methods.findAll(
              {
                where: {
                  or: [{ name: { eq: 'Alice' } }],
                },
              },
              '/person',
            );
            expect(entitiesEq).toStrictEqual([{ id: 1, name: 'Alice' }]);
          });
        });

        describe('for not equal', () => {
          it('for numbers', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}',
            );
            const entitiesNe = await Methods.findAll(
              {
                where: {
                  or: [{ age: { ne: 25 } }],
                },
              },
              '/person',
            );
            expect(entitiesNe).toStrictEqual([
              { id: 1, name: 'Alice', age: 30 },
              { id: 2, name: 'Alice', age: 20 },
              { id: 4, name: 'Charlie', age: 35 },
            ]);
          });

          it('for dates', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","birthDate":"2023-07-05T13:18:26.870Z"},{"id":2,"name":"Bob","birthDate":"2023-07-04T13:18:26.870Z"}]}',
            );
            const entitiesGt = await Methods.findAll(
              {
                where: {
                  or: [{ birthDate: { ne: '2023-07-04T13:18:26.870Z' } }],
                },
              },
              '/person',
            );
            expect(entitiesGt).toStrictEqual([
              { id: 1, name: 'Alice', birthDate: new Date('2023-07-05T13:18:26.870Z') },
            ]);
          });

          it('for boolean values', async () => {
            await writeFile(
              dbPath,
              '{"person":[{"id":1,"name":"Alice","married":false},{"id":2,"name":"Bob","married":true}]}',
            );
            const entitiesEq = await Methods.findAll(
              {
                where: {
                  or: [{ married: { ne: true } }],
                },
              },
              '/person',
            );
            expect(entitiesEq).toStrictEqual([{ id: 1, name: 'Alice', married: false }]);
          });

          it('for strings', async () => {
            await writeFile(dbPath, '{"person":[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]}');
            const entitiesEq = await Methods.findAll(
              {
                where: {
                  or: [{ name: { ne: 'Alice' } }],
                },
              },
              '/person',
            );
            expect(entitiesEq).toStrictEqual([{ id: 2, name: 'Bob' }]);
          });
        });
      });
    });

    describe('should sort entities using order clauses', () => {
      it('in ascending order', async () => {
        await writeFile(
          dbPath,
          '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
        );
        const entities = await Methods.findAll(
          {
            order: [['age', 'ASC']],
          },
          '/person',
        );
        expect(entities).toStrictEqual([
          { id: 2, name: 'Bob', age: 25 },
          { id: 1, name: 'Alice', age: 30 },
          { id: 3, name: 'Charlie', age: 35 },
        ]);
      });

      it('in descending order', async () => {
        await writeFile(
          dbPath,
          '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
        );
        const entities = await Methods.findAll(
          {
            order: [['age', 'DESC']],
          },
          '/person',
        );
        expect(entities).toStrictEqual([
          { id: 3, name: 'Charlie', age: 35 },
          { id: 1, name: 'Alice', age: 30 },
          { id: 2, name: 'Bob', age: 25 },
        ]);
      });
    });

    it('limits the number of entities returned using the limit option', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      const entities = await Methods.findAll({ limit: 2 }, '/person');
      expect(entities).toStrictEqual([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ]);
    });

    it('skips the specified number of entities using the offset option', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      const entities = await Methods.findAll({ offset: 1 }, '/person');
      expect(entities).toStrictEqual([
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ]);
    });
  });

  describe('updateOne', () => {
    it('should update an existing record', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      const result = await Methods.updateOne(1, { name: 'Jane' }, '/person');
      expect(result).toStrictEqual({
        id: 1,
        name: 'Jane',
        age: 30,
      });
    });
  });

  describe('deleteOne', () => {
    it('should delete an entity', async () => {
      await writeFile(
        dbPath,
        '{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}',
      );
      await Methods.deleteOne(1, '/person');
      const entities = await Methods.findAll({}, '/person');
      expect(entities).toStrictEqual([
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ]);
    });
  });
});
