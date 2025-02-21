import { type Token } from '@odata/parser';

export enum Edm {
  null = 'null',
  Boolean = 'Edm.Boolean',
  Byte = 'Edm.Byte',
  Date = 'Edm.Date',
  DateTimeOffset = 'Edm.DateTimeOffset',
  Decimal = 'Edm.Decimal',
  Double = 'Edm.Double',
  Guid = 'Edm.Guid',
  Int16 = 'Edm.Int16',
  Int32 = 'Edm.Int32',
  Int64 = 'Edm.Int64',
  SByte = 'Edm.SByte',
  Single = 'Edm.Single',
  String = 'Edm.String',
}

export function processLiteral(token: Token): Date | boolean | number | string {
  switch (token.value) {
    case Edm.Boolean:
      return token.raw === 'true';
    case Edm.String:
      return JSON.parse(`"${token.raw.slice(1, -1).replaceAll('"', '\\"').replaceAll("''", "'")}"`);
    case Edm.Byte:
    case Edm.Decimal:
    case Edm.Double:
    case Edm.Int16:
    case Edm.Int32:
    case Edm.Int64:
    case Edm.SByte:
    case Edm.Single:
      return Number(token.raw);
    case Edm.Date:
    case Edm.DateTimeOffset:
      // The Date constructor will convert it to UTC.
      return new Date(token.raw);
    case Edm.Guid:
      return token.raw;
    case Edm.null:
      return null;
    default:
      throw new TypeError(`${token.position}: Unhandled OData literal type: ${token.value}`);
  }
}
