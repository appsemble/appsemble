import { and, col, fn, json, literal, Op, or, Order, where, WhereOptions } from 'sequelize';

import { odataFilterToSequelize, odataOrderbyToSequelize } from './odata';

describe('odataFilterToSequelize', () => {
  const cases: { [key: string]: WhereOptions } = {
    //
    // 5.1.1.1 Logical Operators
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_LogicalOperators
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360958
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq true': where(col('foo'), Op.eq, literal('true')),
    'foo eq 01234567-89ab-cdef-0123-456789abcdef': where(
      col('foo'),
      // @ts-expect-error This is a bug in the Sequelize types.
      Op.eq,
      literal("'01234567-89ab-cdef-0123-456789abcdef'"),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq 1999-12-31': where(col('foo'), Op.eq, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq 1999-12-31T12:00:00+02:00': where(col('foo'), Op.eq, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo eq 12': where(col('foo'), Op.eq, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo eq 'bar'": where(col('foo'), Op.eq, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360959
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne true': where(col('foo'), Op.ne, literal('true')),
    'foo ne 01234567-89ab-cdef-0123-456789abcdef': where(
      col('foo'),
      // @ts-expect-error This is a bug in the Sequelize types.
      Op.ne,
      literal("'01234567-89ab-cdef-0123-456789abcdef'"),
    ),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne 1999-12-31': where(col('foo'), Op.ne, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne 1999-12-31T12:00:00+02:00': where(col('foo'), Op.ne, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ne 12': where(col('foo'), Op.ne, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo ne 'bar'": where(col('foo'), Op.ne, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360960
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo gt 1999-12-31': where(col('foo'), Op.gt, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo gt 1999-12-31T12:00:00+02:00': where(col('foo'), Op.gt, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo gt 12': where(col('foo'), Op.gt, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo gt 'bar'": where(col('foo'), Op.gt, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360961
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ge 1999-12-31': where(col('foo'), Op.gte, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ge 1999-12-31T12:00:00+02:00': where(col('foo'), Op.gte, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo ge 12': where(col('foo'), Op.gte, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo ge 'bar'": where(col('foo'), Op.gte, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360962
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo lt 1999-12-31': where(col('foo'), Op.lt, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo lt 1999-12-31T12:00:00+02:00': where(col('foo'), Op.lt, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo lt 12': where(col('foo'), Op.lt, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo lt 'bar'": where(col('foo'), Op.lt, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360963
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo le 1999-12-31': where(col('foo'), Op.lte, new Date('1999-12-31T00:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo le 1999-12-31T12:00:00+02:00': where(col('foo'), Op.lte, new Date('1999-12-31T10:00:00Z')),
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo le 12': where(col('foo'), Op.lte, literal('12')),
    // @ts-expect-error This is a bug in the Sequelize types.
    "foo le 'bar'": where(col('foo'), Op.lte, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360964
    'foo eq 12 and bar eq 14': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
    ),
    'foo eq 12 and bar eq 14 and baz eq 8': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('baz'), Op.eq, literal('8')),
    ),
    'foo eq 12 and (bar eq 14 and baz eq 8)': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('baz'), Op.eq, literal('8')),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360965
    'foo eq 12 or bar eq 14': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
    ),
    'foo eq 12 or bar eq 14 or baz eq 8': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('baz'), Op.eq, literal('8')),
    ),
    'foo eq 12 or (bar eq 14 or baz eq 8)': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('bar'), Op.eq, literal('14')),
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('baz'), Op.eq, literal('8')),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Not
    // @ts-expect-error This is a bug in the Sequelize types.
    'not foo eq 12': { [Op.not]: where(col('foo'), Op.eq, literal('12')) },

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
    'foo add 1 eq 3': where(where(col('foo'), '+', literal('1')), Op.eq, literal('3')),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Subtraction
    // @ts-expect-error This is a bug in the Sequelize types
    'foo sub 1 eq 3': where(where(col('foo'), '-', literal('1')), Op.eq, literal('3')),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Negation
    // XXX

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Multiplication
    // @ts-expect-error This is a bug in the Sequelize types
    'foo mul 1 eq 3': where(where(col('foo'), '*', literal('1')), Op.eq, literal('3')),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Divisionmul
    // @ts-expect-error This is a bug in the Sequelize types
    'foo div 1 eq 3': where(where(col('foo'), '/', literal('1')), Op.eq, literal('3')),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Modulo
    // @ts-expect-error This is a bug in the Sequelize types
    'foo mod 1 eq 3': where(where(col('foo'), '%', literal('1')), Op.eq, literal('3')),

    //
    // String and Collection Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_StringandCollectionFunctions
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_concat
    "concat(foo, 'r') eq 'bar'": where(
      fn('concat', col('foo'), literal("'r'")),
      // @ts-expect-error This is a bug in the Sequelize types
      Op.eq,
      literal("'bar'"),
    ),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_contains
    // @ts-expect-error This is a bug in the Sequelize types
    "contains(foo, 'bar')": where(col('foo'), { [Op.substring]: literal("'bar'") }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_endswith
    // @ts-expect-error This is a bug in the Sequelize types
    "endswith(foo, 'bar')": where(col('foo'), { [Op.endsWith]: literal("'bar'") }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_indexof
    "indexof(foo, 'bar') eq 3": where(
      fn('strpos', col('foo'), literal("'bar'")),
      // @ts-expect-error This is a bug in the Sequelize types
      Op.eq,
      literal('3'),
    ),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length
    // @ts-expect-error This is a bug in the Sequelize types
    'length(foo) eq 42': where(fn('length', col('foo')), Op.eq, literal('42')),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_startswith
    // @ts-expect-error This is a bug in the Sequelize types.
    "startswith(foo, 'bar')": where(col('foo'), { [Op.startsWith]: literal("'bar'") }),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_substring
    "substring(foo, 1, 2) eq 'b'": where(
      fn('substring', col('foo'), literal('1'), literal('2')),
      // @ts-expect-error This is a bug in the Sequelize types
      Op.eq,
      literal("'b'"),
    ),
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
    // @ts-expect-error This is a bug in the Sequelize types
    "tolower(foo) eq 'bar'": where(fn('lower', col('foo')), Op.eq, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_toupper
    // @ts-expect-error This is a bug in the Sequelize types
    "toupper(foo) eq 'bar'": where(fn('upper', col('foo')), Op.eq, literal("'bar'")),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_trim
    // @ts-expect-error This is a bug in the Sequelize types
    "trim(foo) eq 'bar'": where(fn('trim', col('foo')), Op.eq, literal("'bar'")),

    //
    // Date and Time Functions
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_DateandTimeFunctions
    //

    // Nested properties
    // @ts-expect-error This is a bug in the Sequelize types.
    'foo/bar/baz eq 42': where(json('foo.bar.baz'), Op.eq, literal('42')),

    // Nested functions
    "contains(tolower(foo), 'bar')": where(fn('lower', col('foo')), {
      // @ts-expect-error This is a bug in the Sequelize types.
      [Op.substring]: literal("'bar'"),
    }),

    // Combine boolean logical expressions
    'foo eq 12 or (bar eq 14 and baz eq 8)': or(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      and(where(col('bar'), Op.eq, literal('14')), where(col('baz'), Op.eq, literal('8'))),
    ),
    'foo eq 12 and (bar eq 14 or baz eq 8)': and(
      // @ts-expect-error This is a bug in the Sequelize types.
      where(col('foo'), Op.eq, literal('12')),
      // @ts-expect-error This is a bug in the Sequelize types.
      or(where(col('bar'), Op.eq, literal('14')), where(col('baz'), Op.eq, literal('8'))),
    ),
    'not (foo eq 12 and bar eq 14)': {
      [Op.not]: and(
        // @ts-expect-error This is a bug in the Sequelize types.
        where(col('foo'), Op.eq, literal('12')),
        // @ts-expect-error This is a bug in the Sequelize types.
        where(col('bar'), Op.eq, literal('14')),
      ),
    },
  };

  it.each(Object.entries(cases))('%s', (filter, expected) => {
    const result = odataFilterToSequelize(filter);
    expect(result).toStrictEqual(expected);
  });

  const empty = ['', null, undefined];

  it.each(empty)('%p', (filter) => {
    const result = odataFilterToSequelize(filter);
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
