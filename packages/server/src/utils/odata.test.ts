import { and, col, fn, json, Op, or, Order, where, WhereOptions } from 'sequelize';

import { odataFilterToSequelize, odataOrderbyToSequelize } from './odata';

describe('odataFilterToSequelize', () => {
  const cases: { [key: string]: WhereOptions } = {
    //
    // 5.1.1.1 Logical Operators
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_LogicalOperators
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360958
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq true': where(col('Model.foo'), '=', true),
    'foo eq 01234567-89ab-cdef-0123-456789abcdef': where(
      col('Model.foo'),
      '=',
      '01234567-89ab-cdef-0123-456789abcdef',
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq 1999-12-31': where(col('Model.foo'), '=', new Date('1999-12-31T00:00:00Z')),
    'foo eq 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '=',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq 12': where(col('Model.foo'), '=', 12),
    "foo eq 'bar'": where(col('Model.foo'), '=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360959
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne true': where(col('Model.foo'), '!=', true),
    'foo ne 01234567-89ab-cdef-0123-456789abcdef': where(
      col('Model.foo'),
      '!=',
      '01234567-89ab-cdef-0123-456789abcdef',
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne 1999-12-31': where(col('Model.foo'), '!=', new Date('1999-12-31T00:00:00Z')),
    'foo ne 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '!=',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne 12': where(col('Model.foo'), '!=', 12),
    "foo ne 'bar'": where(col('Model.foo'), '!=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360960
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo gt 1999-12-31': where(col('Model.foo'), '>', new Date('1999-12-31T00:00:00Z')),
    'foo gt 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '>',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo gt 12': where(col('Model.foo'), '>', 12),
    "foo gt 'bar'": where(col('Model.foo'), '>', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360961
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ge 1999-12-31': where(col('Model.foo'), '>=', new Date('1999-12-31T00:00:00Z')),
    'foo ge 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '>=',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ge 12': where(col('Model.foo'), '>=', 12),
    "foo ge 'bar'": where(col('Model.foo'), '>=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360962
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo lt 1999-12-31': where(col('Model.foo'), '<', new Date('1999-12-31T00:00:00Z')),
    'foo lt 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '<',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo lt 12': where(col('Model.foo'), '<', 12),
    "foo lt 'bar'": where(col('Model.foo'), '<', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360963
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo le 1999-12-31': where(col('Model.foo'), '<=', new Date('1999-12-31T00:00:00Z')),
    'foo le 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '<=',
      // @ts-expect-error This is a bug in the Sequelize types.
      new Date('1999-12-31T10:00:00Z'),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo le 12': where(col('Model.foo'), '<=', 12),
    "foo le 'bar'": where(col('Model.foo'), '<=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360964
    'foo eq 12 and bar eq 14': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
    ),
    'foo eq 12 and bar eq 14 and baz eq 8': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.baz'), '=', 8),
    ),
    'foo eq 12 and (bar eq 14 and baz eq 8)': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.baz'), '=', 8),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360965
    'foo eq 12 or bar eq 14': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
    ),
    'foo eq 12 or bar eq 14 or baz eq 8': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.baz'), '=', 8),
    ),
    'foo eq 12 or (bar eq 14 or baz eq 8)': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.bar'), '=', 14),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.baz'), '=', 8),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Not
    // @ts-expect-error This is a bug in the Sequelize types.
    'not foo eq 12': { [Op.not]: where(col('Model.foo'), '=', 12) },

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Has
    // XXX

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_In
    // XXX

    //
    // 5.1.1.2 Arithmetic Operators
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_ArithmeticOperators
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Addition
    // @ts-expect-error This is a bug in the Sequelize types
    'foo add 1 eq 3': where(where(col('Model.foo'), '+', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Subtraction
    // @ts-expect-error This is a bug in the Sequelize types
    'foo sub 1 eq 3': where(where(col('Model.foo'), '-', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Negation
    // XXX

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Multiplication
    // @ts-expect-error This is a bug in the Sequelize types
    'foo mul 1 eq 3': where(where(col('Model.foo'), '*', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Divisionmul
    // @ts-expect-error This is a bug in the Sequelize types
    'foo div 1 eq 3': where(where(col('Model.foo'), '/', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Modulo
    // @ts-expect-error This is a bug in the Sequelize types
    'foo mod 1 eq 3': where(where(col('Model.foo'), '%', 1), '=', 3),

    //
    // String and Collection Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_StringandCollectionFunctions
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_concat
    "concat(foo, 'r') eq 'bar'": where(fn('concat', col('Model.foo'), 'r'), '=', 'bar'),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_contains
    "contains(foo, 'bar')": where(col('Model.foo'), { [Op.substring]: 'bar' }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_endswith
    "endswith(foo, 'bar')": where(col('Model.foo'), { [Op.endsWith]: 'bar' }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_indexof
    // @ts-expect-error This is a bug in the Sequelize types
    "indexof(foo, 'bar') eq 3": where(fn('strpos', col('Model.foo'), 'bar'), '=', 3),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length
    // @ts-expect-error This is a bug in the Sequelize types
    'length(foo) eq 42': where(fn('length', col('Model.foo')), '=', 42),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_startswith
    "startswith(foo, 'bar')": where(col('Model.foo'), { [Op.startsWith]: 'bar' }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_substring
    "substring(foo, 1, 2) eq 'b'": where(fn('substring', col('Model.foo'), 1, 2), '=', 'b'),
    // XXX implement for collections

    //
    // Collection Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_CollectionFunctions
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_hassubset
    // XXX

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_hassubsequence
    // XXX

    //
    // String Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_StringFunctions
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_matchesPattern

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_tolower
    "tolower(foo) eq 'bar'": where(fn('lower', col('Model.foo')), '=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_toupper
    "toupper(foo) eq 'bar'": where(fn('upper', col('Model.foo')), '=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_trim
    "trim(foo) eq 'bar'": where(fn('trim', col('Model.foo')), '=', 'bar'),

    //
    // Date and Time Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_DateandTimeFunctions
    //

    // Nested properties
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo/bar/baz eq 42': where(json('foo.bar.baz'), '=', 42),

    // Nested functions
    "contains(tolower(foo), 'bar')": where(fn('lower', col('Model.foo')), {
      [Op.substring]: 'bar',
    }),

    // Combine boolean logical expressions
    'foo eq 12 or (bar eq 14 and baz eq 8)': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      and(where(col('Model.bar'), '=', 14), where(col('Model.baz'), '=', 8)),
    ),
    'foo eq 12 and (bar eq 14 or baz eq 8)': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('Model.foo'), '=', 12),
      // @ts-expect-error This is a bug in the Sequelize types.
      or(where(col('Model.bar'), '=', 14), where(col('Model.baz'), '=', 8)),
    ),
    'not (foo eq 12 and bar eq 14)': {
      [Op.not]: and(
        // @ts-expect-error This is a bug in the Sequelize types.
        where(col('Model.foo'), '=', 12),
        // @ts-expect-error This is a bug in the Sequelize types.
        where(col('Model.bar'), '=', 14),
      ),
    },
  };

  it.each(Object.entries(cases))('%s', (filter, expected) => {
    const result = odataFilterToSequelize(filter, { tableName: 'Model' });
    expect(result).toStrictEqual(expected);
  });

  const empty = ['', null, undefined];

  it.each(empty)('%p', (filter) => {
    const result = odataFilterToSequelize(filter, { tableName: 'Model' });
    expect(result).toStrictEqual({});
  });
});

describe('odataOrderbyToSequelize', () => {
  const cases: { [orderby: string]: Order } = {
    foo: [['foo', 'ASC']],
    'foo asc': [['foo', 'ASC']],
    'foo desc': [['foo', 'DESC']],
    'foo desc,bar': [
      ['foo', 'DESC'],
      ['bar', 'ASC'],
    ],
  };

  it.each(Object.entries(cases))('%s', (filter, expected) => {
    const result = odataOrderbyToSequelize(filter);
    expect(result).toStrictEqual(expected);
  });

  const empty = ['', null, undefined];

  it.each(empty)('%p', (filter) => {
    const result = odataOrderbyToSequelize(filter);
    expect(result).toStrictEqual([]);
  });
});
