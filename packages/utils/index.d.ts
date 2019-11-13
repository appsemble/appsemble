import { Theme } from '@appsemble/types';
import { OpenAPIV3 } from 'openapi-types';

type MapperFunction = (data: any) => any;

interface Context {
  intl: {
    formatDate: (data: string) => string;
    formatTime: (data: string) => string;
  };
}

export function compileFilters(mapperString: string, context?: Context): MapperFunction;

export function remapData(mapperData: any, inputData: any, context?: Context): any;

export function normalize(input: string): string;
export const normalized: RegExp;
export const partialNormalized: RegExp;

export function validate(schema: OpenAPIV3.SchemaObject, data: any): Promise<void>;
export class SchemaValidationError extends Error {}

export function validateStyle(css: string): string;
export class StyleValidationError extends Error {}

export const baseTheme: Theme;
