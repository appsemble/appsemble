import { Op } from 'sequelize';

import { odataFilterToSequelize } from './odata';

describe('odataFilterToSequelize', () => {
  it('should parse boolean equality', () => {
    const result = odataFilterToSequelize('foo eq true');
    expect(result).toStrictEqual({ foo: { [Op.eq]: true } });
  });

  it('should parse date equality', () => {
    const result = odataFilterToSequelize('foo eq 1999-12-31');
    expect(result).toStrictEqual({ foo: { [Op.eq]: new Date('1999-12-31T00:00:00.000Z') } });
  });

  it('should parse number equality', () => {
    const result = odataFilterToSequelize('foo eq 12');
    expect(result).toStrictEqual({ foo: { [Op.eq]: 12 } });
  });

  it('should parse string equality', () => {
    const result = odataFilterToSequelize("foo eq 'bar'");
    expect(result).toStrictEqual({ foo: { [Op.eq]: 'bar' } });
  });

  it('should parse nestedboolean equality', () => {
    const result = odataFilterToSequelize('foo/bar/baz eq true');
    expect(result).toStrictEqual({ 'foo.bar.baz': { [Op.eq]: true } });
  });

  it('should parse nested date equality', () => {
    const result = odataFilterToSequelize('foo/bar/baz eq 1999-12-31');
    expect(result).toStrictEqual({ 'foo.bar.baz': { [Op.eq]: '1999-12-31' } });
  });

  it('should parse nested number equality', () => {
    const result = odataFilterToSequelize('foo/bar/baz eq 12');
    expect(result).toStrictEqual({ 'foo.bar.baz': { [Op.eq]: 12 } });
  });

  it('should parse nested string equality', () => {
    const result = odataFilterToSequelize('foo/bar/baz eq 42');
    expect(result).toStrictEqual({ 'foo.bar.baz': { [Op.eq]: 42 } });
  });

  it('should parse and expressions', () => {
    const result = odataFilterToSequelize('foo eq 12 and bar eq 14');
    expect(result).toStrictEqual({
      [Op.and]: [{ foo: { [Op.eq]: 12 } }, { bar: { [Op.eq]: 14 } }],
    });
  });

  it('should parse nested and expressions', () => {
    const result = odataFilterToSequelize('foo eq 12 and bar eq 14 and baz eq 8');
    expect(result).toStrictEqual({
      [Op.and]: [
        { foo: { [Op.eq]: 12 } },
        { [Op.and]: [{ bar: { [Op.eq]: 14 } }, { baz: { [Op.eq]: 8 } }] },
      ],
    });
  });

  it('should parse or expressions', () => {
    const result = odataFilterToSequelize('foo eq 12 or bar eq 14');
    expect(result).toStrictEqual({
      [Op.or]: [{ foo: { [Op.eq]: 12 } }, { bar: { [Op.eq]: 14 } }],
    });
  });

  it('should parse nested or expressions', () => {
    const result = odataFilterToSequelize('foo eq 12 or bar eq 14 or baz eq 8');
    expect(result).toStrictEqual({
      [Op.or]: [
        { foo: { [Op.eq]: 12 } },
        { [Op.or]: [{ bar: { [Op.eq]: 14 } }, { baz: { [Op.eq]: 8 } }] },
      ],
    });
  });
});
