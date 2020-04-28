declare function toIco(pngs: Buffer | Buffer[], ToIcoOptions?: toIco.ToIcoOptions): Promise<Buffer>;

// eslint-disable-next-line no-redeclare
declare namespace toIco {
  interface ToIcoOptions {
    resize: boolean;
    sizes?: number[];
  }
}

export = toIco;
