import type * as compose from 'koa-compose';

declare class Grant {
  static koa(): (options: any) => compose.Middleware<any>;
}

export = Grant;
