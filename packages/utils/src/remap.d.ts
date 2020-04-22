export type MapperFunction = (data: any) => any;

export interface RemapperContext {
  intl: {
    formatDate: (data: string) => string;
    formatTime: (data: string) => string;
  };
}

export function compileFilters(mapperString: string, context?: RemapperContext): MapperFunction;

export function remapData(mapperData: any, inputData: any, context?: RemapperContext): any;
