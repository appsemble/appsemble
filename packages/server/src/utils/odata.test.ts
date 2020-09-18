import { Op, WhereOptions } from 'sequelize';

import { odataFilterToSequelize } from './odata';

const cases: { [key: string]: WhereOptions } = {
  // Simple equal to
  'foo eq true': { foo: { [Op.eq]: true } },
  'foo eq 1999-12-31': { foo: { [Op.eq]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo eq 12': { foo: { [Op.eq]: 12 } },
  "foo eq 'bar'": { foo: { [Op.eq]: 'bar' } },

  // Simple not equal to
  'foo ne true': { foo: { [Op.ne]: true } },
  'foo ne 1999-12-31': { foo: { [Op.ne]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo ne 12': { foo: { [Op.ne]: 12 } },
  "foo ne 'bar'": { foo: { [Op.ne]: 'bar' } },

  // Simple lesser than
  'foo lt 1999-12-31': { foo: { [Op.lt]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo lt 12': { foo: { [Op.lt]: 12 } },
  "foo lt 'bar'": { foo: { [Op.lt]: 'bar' } },

  // Simple lesser than or equal to
  'foo le 1999-12-31': { foo: { [Op.lte]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo le 12': { foo: { [Op.lte]: 12 } },
  "foo le 'bar'": { foo: { [Op.lte]: 'bar' } },

  // Simple greater than
  'foo gt 1999-12-31': { foo: { [Op.gt]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo gt 12': { foo: { [Op.gt]: 12 } },
  "foo gt 'bar'": { foo: { [Op.gt]: 'bar' } },

  // Simple greater than or equal to
  'foo ge 1999-12-31': { foo: { [Op.gte]: new Date('1999-12-31T00:00:00.000Z') } },
  'foo ge 12': { foo: { [Op.gte]: 12 } },
  "foo ge 'bar'": { foo: { [Op.gte]: 'bar' } },

  // Functions
  "startswith(foo, 'bar')": { foo: { [Op.startsWith]: 'bar' } },
  "endsswith(foo, 'bar')": { foo: { [Op.endsWith]: 'bar' } },
  "substringof(foo, 'bar')": { foo: { [Op.substring]: 'bar' } },

  // Nested equal to
  'foo/bar/baz eq true': { 'foo.bar.baz': { [Op.eq]: true } },
  'foo/bar/baz eq 1999-12-31': { 'foo.bar.baz': { [Op.eq]: '1999-12-31' } },
  'foo/bar/baz eq 12': { 'foo.bar.baz': { [Op.eq]: 12 } },
  "foo/bar/baz eq 'bar'": { 'foo.bar.baz': { [Op.eq]: 'bar' } },

  // Nested not equal to
  'foo/bar/baz ne true': { 'foo.bar.baz': { [Op.ne]: true } },
  'foo/bar/baz ne 1999-12-31': { 'foo.bar.baz': { [Op.ne]: '1999-12-31' } },
  'foo/bar/baz ne 12': { 'foo.bar.baz': { [Op.ne]: 12 } },
  "foo/bar/baz ne 'bar'": { 'foo.bar.baz': { [Op.ne]: 'bar' } },

  // Nested lesser than
  'foo/bar/baz lt 1999-12-31': { 'foo.bar.baz': { [Op.lt]: '1999-12-31' } },
  'foo/bar/baz lt 12': { 'foo.bar.baz': { [Op.lt]: 12 } },
  "foo/bar/baz lt 'bar'": { 'foo.bar.baz': { [Op.lt]: 'bar' } },

  // Nested lesser than or equal to
  'foo/bar/baz le 1999-12-31': { 'foo.bar.baz': { [Op.lte]: '1999-12-31' } },
  'foo/bar/baz le 12': { 'foo.bar.baz': { [Op.lte]: 12 } },
  "foo/bar/baz le 'bar'": { 'foo.bar.baz': { [Op.lte]: 'bar' } },

  // Nested greater than
  'foo/bar/baz gt 1999-12-31': { 'foo.bar.baz': { [Op.gt]: '1999-12-31' } },
  'foo/bar/baz gt 12': { 'foo.bar.baz': { [Op.gt]: 12 } },
  "foo/bar/baz gt 'bar'": { 'foo.bar.baz': { [Op.gt]: 'bar' } },

  // Nested greater than or equal to
  'foo/bar/baz ge 1999-12-31': { 'foo.bar.baz': { [Op.gte]: '1999-12-31' } },
  'foo/bar/baz ge 12': { 'foo.bar.baz': { [Op.gte]: 12 } },
  "foo/bar/baz ge 'bar'": { 'foo.bar.baz': { [Op.gte]: 'bar' } },

  // Simple Functions
  "startswith(foo/bar/baz, 'bar')": { 'foo.bar.baz': { [Op.startsWith]: 'bar' } },
  "endsswith(foo/bar/baz, 'bar')": { 'foo.bar.baz': { [Op.endsWith]: 'bar' } },
  "substringof(foo/bar/baz, 'bar')": { 'foo.bar.baz': { [Op.substring]: 'bar' } },

  // Logical statements
  'foo eq 12 and bar eq 14': {
    [Op.and]: [{ foo: { [Op.eq]: 12 } }, { bar: { [Op.eq]: 14 } }],
  },
  'foo eq 12 and bar eq 14 and baz eq 8': {
    [Op.and]: [
      { foo: { [Op.eq]: 12 } },
      { [Op.and]: [{ bar: { [Op.eq]: 14 } }, { baz: { [Op.eq]: 8 } }] },
    ],
  },
  'foo eq 12 or bar eq 14': {
    [Op.or]: [{ foo: { [Op.eq]: 12 } }, { bar: { [Op.eq]: 14 } }],
  },
  'foo eq 12 or bar eq 14 or baz eq 8': {
    [Op.or]: [
      { foo: { [Op.eq]: 12 } },
      { [Op.or]: [{ bar: { [Op.eq]: 14 } }, { baz: { [Op.eq]: 8 } }] },
    ],
  },
};

describe('odataFilterToSequelize', () => {
  it.each(Object.entries(cases))('%s', (filter, expeced) => {
    if (!filter.startsWith('startswith')) {
      return;
    }
    const result = odataFilterToSequelize(filter);
    expect(result).toStrictEqual(expeced);
  });
});
