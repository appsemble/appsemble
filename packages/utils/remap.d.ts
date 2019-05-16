type MapperFunction = (data: any) => any;

export function compileFilters(mapperString: string): MapperFunction;

export function remapData(mapperData: any, inputData: any): any;
