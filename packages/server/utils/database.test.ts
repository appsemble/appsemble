import { User } from '../models/index.js';
import { iterTable } from './database.js';
import { useTestDatabase } from './test/testSchema.js';

useTestDatabase('apps');

describe('iterTable', () => {
  it('should iterate if the length is not divisible by chunk size', async () => {
    jest.spyOn(User, 'findAll');
    const created = await User.bulkCreate(
      Array.from({ length: 5 }, () => ({ timezone: 'Europe/Amsterdam' })),
    );
    const retrieved: User[] = [];
    // This should fetch fhe following chunks:
    // [{ id: 0}, { id: 1 }]
    // [{ id: 2}, { id: 3 }]
    // [{ id: 4}]
    // Because the chunk size is 2
    for await (const user of iterTable(User, { chunkSize: 2, raw: true })) {
      retrieved.push(user);
    }
    // Causing findAll to have been called thrice
    expect(User.findAll).toHaveBeenCalledTimes(3);
    expect(User.findAll).toHaveBeenCalledWith({ limit: 2, offset: 0, raw: true });
    expect(User.findAll).toHaveBeenCalledWith({ limit: 2, offset: 2, raw: true });
    expect(User.findAll).toHaveBeenLastCalledWith({ limit: 2, offset: 4, raw: true });
    // Raw values are needed for comparison
    expect(created.map((user) => user.toJSON())).toStrictEqual(retrieved);
  });

  it('should iterate if the length is divisible by chunk size', async () => {
    jest.spyOn(User, 'findAll');
    const created = await User.bulkCreate(
      Array.from({ length: 6 }, () => ({ timezone: 'Europe/Amsterdam' })),
    );
    const retrieved: User[] = [];
    // This should fetch fhe following chunks:
    // [{ id: 0}, { id: 1 }]
    // [{ id: 2}, { id: 3 }]
    // [{ id: 4}, { id: 5 }]
    // []
    // The last query is needed, because it can’t tell from the second last it should be the last
    // one.
    for await (const user of iterTable(User, { chunkSize: 2, raw: true })) {
      retrieved.push(user);
    }
    // Causing findAll to have been called thrice
    expect(User.findAll).toHaveBeenCalledTimes(4);
    // Raw values are needed for comparison
    expect(created.map((user) => user.toJSON())).toStrictEqual(retrieved);
  });
});
