type MapperFunction = (data: any) => any;

interface Context {
  intl: {
    formatDate: (data: string) => string;
    formatTime: (data: string) => string;
  };
}

export function compileFilters(mapperString: string, context: Context): MapperFunction;

export function remapData(mapperData: any, inputData: any, context: Context): any;
