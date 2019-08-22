interface JSONPointer {
  /**
   * Looks up a JSON pointer in an object
   */
  get(object: object): any;

  /**
   * Set a value for a JSON pointer on object
   */
  set(object: object, value: any): void;
}

declare namespace JSONPointer {
  /**
   * Looks up a JSON pointer in an object
   */
  function get(object: object, pointer: string): any;

  /**
   * Set a value for a JSON pointer on object
   */
  function set(object: object, pointer: string, value: any): void;

  /**
   *  Builds a JSONPointer instance from a pointer value.
   */
  function compile(pointer: string): JSONPointer;
}

export = JSONPointer;

// export function get(object: Record<string, any>, pointer: string): any;
// export function set(object: Record<string, any>, pointer: string, value: any): any;
// export function compile(
//   pointer: string,
// ): {
//   get: (object: Record<string, any>) => ReturnType<typeof get>;
//   set: (object: Record<string, any>, value: any) => ReturnType<typeof set>;
// };
