import { rm, writeFile } from 'node:fs/promises';

import { Config, JsonDB } from 'node-json-db';

import { setAppDir } from './app.js';
import { Methods } from './methods.js';

const dbPath = 'packages/cli/server/db/test-data.json';
const config = new Config(dbPath, true, true, '/');

describe('methods', () => {
  let db: JsonDB;

  beforeEach(() => {
    db = new JsonDB(config);
    setAppDir('testApp');
  });

  afterEach(async () => {
    await rm(dbPath);
  });

  describe('create', () => {
    it('should create a new record and return it', async () => {
      const result = await Methods.create(db, { name: 'testInstance' }, 'testModel');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name', 'testInstance');
    });

    it('should add default values to the record', async () => {
      const result = await Methods.create(db, { name: 'testInstance' }, 'testModel');
      expect(result).toHaveProperty('AppId', 1);
      expect(result).toHaveProperty('$created');
      expect(result).toHaveProperty('$updated');
      expect(result).toHaveProperty('expires', null);
    });

    it('should add record type', async () => {
      const result = await Methods.create(db, { name: 'testInstance' }, 'testModel');
      expect(result).toHaveProperty('type', 'testModel');
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple new records and return them', async () => {
      const result = await Methods.bulkCreate(
        db,
        [{ name: 'testInstance2' }, { name: 'testInstance3' }],
        'testModel',
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name', 'testInstance2');
      expect(result[1]).toHaveProperty('id');
      expect(result[1]).toHaveProperty('name', 'testInstance3');
    });

    it('should add default values to the records', async () => {
      const result = await Methods.bulkCreate(
        db,
        [{ name: 'testInstance2' }, { name: 'testInstance3' }],
        'testModel',
      );
      expect(result[0]).toHaveProperty('AppId', 1);
      expect(result[0]).toHaveProperty('$created');
      expect(result[0]).toHaveProperty('$updated');
      expect(result[0]).toHaveProperty('expires', null);
      expect(result[1]).toHaveProperty('AppId', 1);
      expect(result[1]).toHaveProperty('$created');
      expect(result[1]).toHaveProperty('$updated');
      expect(result[1]).toHaveProperty('expires', null);
    });

    it('should add records type', async () => {
      const result = await Methods.bulkCreate(
        db,
        [{ name: 'testInstance2' }, { name: 'testInstance3' }],
        'testModel',
      );
      expect(result[0]).toHaveProperty('type', 'testModel');
      expect(result[1]).toHaveProperty('type', 'testModel');
    });
  });

  describe('findById', () => {
    it('should return a record by id', async () => {
      await writeFile(dbPath, '{"testApp":{"testModel":[{"id":1,"name":"testInstance1"}]}}');
      const result = await Methods.findById(db, 1, 'testModel');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('id', 1);
    });

    it('should return null if no record exists with the given id', async () => {
      const result = await Methods.findById(db, 999);
      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a record that matches the query', async () => {
      await writeFile(dbPath, '{"testApp":{"testModel":[{"id":1,"name":"testInstance1"}]}}');
      const result = await Methods.findOne(db, { where: { name: 'testInstance1' } }, 'testModel');
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('name', 'testInstance1');
    });

    it('should return null if no record matches the query', async () => {
      const result = await Methods.findOne(db, { where: { name: 'nonexistent' } }, 'testModel');
      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return an empty array when no entities exist', async () => {
      const entities = await Methods.findAll(db, {}, '/');
      expect(entities).toStrictEqual([]);
    });

    it('should return all entities when no query is provided', async () => {
      await writeFile(
        dbPath,
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      const entities = await Methods.findAll(db, {}, 'person');
      expect(entities).toStrictEqual([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ]);
    });

    it('should return all entities with only the specified attributes', async () => {
      await writeFile(
        dbPath,
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      const entities = await Methods.findAll(db, { attributes: ['name', 'age'] }, 'person');
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
          '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
        );
        const entities = await Methods.findAll(
          db,
          {
            where: {
              and: [{ name: { eq: 'Alice' } }, { age: { gt: 20 } }],
            },
          },
          'person',
        );
        expect(entities).toStrictEqual([{ id: 1, name: 'Alice', age: 30 }]);
      });

      it('that contain or', async () => {
        await writeFile(
          dbPath,
          '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
        );
        const entities = await Methods.findAll(
          db,
          {
            where: {
              or: [{ name: { eq: 'Alice' } }, { age: { gt: 20 } }],
            },
          },
          'person',
        );
        expect(entities).toStrictEqual([
          { id: 1, name: 'Alice', age: 30 },
          { id: 2, name: 'Alice', age: 20 },
          { id: 3, name: 'Bob', age: 25 },
          { id: 4, name: 'Charlie', age: 35 },
        ]);
      });

      describe('that contain a comparison', () => {
        it('for greater than', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesGt = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { gt: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesGt).toStrictEqual([
            { id: 1, name: 'Alice', age: 30 },
            { id: 4, name: 'Charlie', age: 35 },
          ]);
        });

        it('for greater than or equal', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesGte = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { gte: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesGte).toStrictEqual([
            { id: 1, name: 'Alice', age: 30 },
            { id: 3, name: 'Bob', age: 25 },
            { id: 4, name: 'Charlie', age: 35 },
          ]);
        });

        it('for less than', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesLt = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { lt: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesLt).toStrictEqual([{ id: 2, name: 'Alice', age: 20 }]);
        });

        it('for less than or equal', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesLt = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { lte: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesLt).toStrictEqual([
            { id: 2, name: 'Alice', age: 20 },
            { id: 3, name: 'Bob', age: 25 },
          ]);
        });

        it('for equal', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesEq = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { eq: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesEq).toStrictEqual([{ id: 3, name: 'Bob', age: 25 }]);
        });

        it('for not equal', async () => {
          await writeFile(
            dbPath,
            '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Alice","age":20},{"id":3,"name":"Bob","age":25},{"id":4,"name":"Charlie","age":35}]}}',
          );
          const entitiesNe = await Methods.findAll(
            db,
            {
              where: {
                or: [{ age: { ne: 25 } }],
              },
            },
            'person',
          );
          expect(entitiesNe).toStrictEqual([
            { id: 1, name: 'Alice', age: 30 },
            { id: 2, name: 'Alice', age: 20 },
            { id: 4, name: 'Charlie', age: 35 },
          ]);
        });
      });
    });

    describe('should sort entities using order clauses', () => {
      it('in ascending order', async () => {
        await writeFile(
          dbPath,
          '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
        );
        const entities = await Methods.findAll(
          db,
          {
            order: [['age', 'ASC']],
          },
          'person',
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
          '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
        );
        const entities = await Methods.findAll(
          db,
          {
            order: [['age', 'DESC']],
          },
          'person',
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
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      const entities = await Methods.findAll(db, { limit: 2 }, 'person');
      expect(entities).toStrictEqual([
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 },
      ]);
    });

    it('skips the specified number of entities using the offset option', async () => {
      await writeFile(
        dbPath,
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      const entities = await Methods.findAll(db, { offset: 1 }, 'person');
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
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      const result = await Methods.updateOne(db, 1, { name: 'Jane' }, 'person');
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
        '{"testApp":{"person":[{"id":1,"name":"Alice","age":30},{"id":2,"name":"Bob","age":25},{"id":3,"name":"Charlie","age":35}]}}',
      );
      await Methods.deleteOne(db, 1, 'person');
      const entities = await Methods.findAll(db, {}, 'person');
      expect(entities).toStrictEqual([
        { id: 2, name: 'Bob', age: 25 },
        { id: 3, name: 'Charlie', age: 35 },
      ]);
    });
  });
});
