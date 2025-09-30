import { and, col, fn, json, Op, or, type Order, where, type WhereOptions } from 'sequelize';
import { describe, expect, it } from 'vitest';

import { odataFilterToSequelize, odataOrderbyToSequelize } from './odata.js';

describe('odataFilterToSequelize', () => {
  const cases: Record<string, WhereOptions> = {
    //
    // 5.1.1.1 Logical Operators
    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_LogicalOperators
    //

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360958
    'foo eq true': where(col('Model.foo'), '=', true),
    'foo eq null': where(col('Model.foo'), '=', null),
    "foo eq 'null'": where(col('Model.foo'), '=', 'null'),
    'foo eq 01234567-89ab-cdef-0123-456789abcdef': where(
      col('Model.foo'),
      '=',
      '01234567-89ab-cdef-0123-456789abcdef',
    ),
    'foo eq 1999-12-31': where(col('Model.foo'), '=', new Date('1999-12-31T00:00:00Z')),
    'foo eq 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '=',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo eq 12': where(col('Model.foo'), '=', 12),
    "foo eq 'bar'": where(col('Model.foo'), '=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360959
    'foo ne true': where(col('Model.foo'), '!=', true),
    'foo ne 01234567-89ab-cdef-0123-456789abcdef': where(
      col('Model.foo'),
      '!=',
      '01234567-89ab-cdef-0123-456789abcdef',
    ),
    'foo ne 1999-12-31': where(col('Model.foo'), '!=', new Date('1999-12-31T00:00:00Z')),
    'foo ne 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '!=',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo ne 12': where(col('Model.foo'), '!=', 12),
    "foo ne 'bar'": where(col('Model.foo'), '!=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360960
    'foo gt 1999-12-31': where(col('Model.foo'), '>', new Date('1999-12-31T00:00:00Z')),
    'foo gt 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '>',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo gt 12': where(col('Model.foo'), '>', 12),
    "foo gt 'bar'": where(col('Model.foo'), '>', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360961
    'foo ge 1999-12-31': where(col('Model.foo'), '>=', new Date('1999-12-31T00:00:00Z')),
    'foo ge 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '>=',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo ge 12': where(col('Model.foo'), '>=', 12),
    "foo ge 'bar'": where(col('Model.foo'), '>=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360962
    'foo lt 1999-12-31': where(col('Model.foo'), '<', new Date('1999-12-31T00:00:00Z')),
    'foo lt 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '<',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo lt 12': where(col('Model.foo'), '<', 12),
    "foo lt 'bar'": where(col('Model.foo'), '<', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360963
    'foo le 1999-12-31': where(col('Model.foo'), '<=', new Date('1999-12-31T00:00:00Z')),
    'foo le 1999-12-31T12:00:00+02:00': where(
      col('Model.foo'),
      '<=',
      new Date('1999-12-31T10:00:00Z'),
    ),
    'foo le 12': where(col('Model.foo'), '<=', 12),
    "foo le 'bar'": where(col('Model.foo'), '<=', 'bar'),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360964
    'foo eq 12 and bar eq 14': and(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
    ),
    'foo eq 12 and bar eq 14 and baz eq 8': and(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
      where(col('Model.baz'), '=', 8),
    ),
    'foo eq 12 and (bar eq 14 and baz eq 8)': and(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
      where(col('Model.baz'), '=', 8),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#_Toc31360965
    'foo eq 12 or bar eq 14': or(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
    ),
    'foo eq 12 or bar eq 14 or baz eq 8': or(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
      where(col('Model.baz'), '=', 8),
    ),
    'foo eq 12 or (bar eq 14 or baz eq 8)': or(
      where(col('Model.foo'), '=', 12),
      where(col('Model.bar'), '=', 14),
      where(col('Model.baz'), '=', 8),
    ),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Not
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
    'foo add 1 eq 3': where(where(col('Model.foo'), '+', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Subtraction
    'foo sub 1 eq 3': where(where(col('Model.foo'), '-', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Negation
    // XXX

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Multiplication
    'foo mul 1 eq 3': where(where(col('Model.foo'), '*', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Divisionmul
    'foo div 1 eq 3': where(where(col('Model.foo'), '/', 1), '=', 3),

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_Modulo
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
    "indexof(foo, 'bar') eq 3": where(fn('strpos', col('Model.foo'), 'bar'), '=', 3),
    // XXX implement for collections

    // https://docs.oasis-open.org/odata/odata/v4.01/odata-v4.01-part2-url-conventions.html#sec_length
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
    'foo/bar/baz eq 42': where(json('foo.bar.baz'), '=', 42),

    // Nested functions
    "contains(tolower(foo), 'bar')": where(fn('lower', col('Model.foo')), {
      [Op.substring]: 'bar',
    }),

    // Combine boolean logical expressions
    'foo eq 12 or (bar eq 14 and baz eq 8)': or(
      where(col('Model.foo'), '=', 12),
      and(where(col('Model.bar'), '=', 14), where(col('Model.baz'), '=', 8)),
    ),
    'foo eq 12 and (bar eq 14 or baz eq 8)': and(
      where(col('Model.foo'), '=', 12),
      or(where(col('Model.bar'), '=', 14), where(col('Model.baz'), '=', 8)),
    ),
    'not (foo eq 12 and bar eq 14)': {
      [Op.not]: and(where(col('Model.foo'), '=', 12), where(col('Model.bar'), '=', 14)),
    },
  };

  it.each(Object.entries(cases))('%s', (filter, expected) => {
    const result = odataFilterToSequelize(filter, 'Model');
    expect(result).toStrictEqual(expected);
  });

  const empty = ['', null, undefined];

  it.each(empty)('%p', (filter) => {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const result = odataFilterToSequelize(filter, 'Model');
    expect(result).toStrictEqual({});
  });
});

describe('odataOrderbyToSequelize', () => {
  const cases: Record<string, Order> = {
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
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    const result = odataOrderbyToSequelize(filter);
    expect(result).toStrictEqual([]);
  });
});
