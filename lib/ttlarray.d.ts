export interface TTLArrayOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
}

export interface TTLArrayItemOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
}

declare class TTLArray<T = any> {
  constructor(options?: TTLArrayOptions);

  // Core methods
  push(value: T, options?: TTLArrayItemOptions): number;
  pop(): T | undefined;
  shift(): T | undefined;
  at(index: number): T | undefined;

  // Iteration methods
  forEach(
    callback: (value: T, index: number, array: TTLArray<T>) => void,
    thisArg?: any
  ): void;
  map<U>(
    callback: (value: T, index: number, array: TTLArray<T>) => U,
    thisArg?: any
  ): U[];
  filter(
    callback: (value: T, index: number, array: TTLArray<T>) => boolean,
    thisArg?: any
  ): TTLArray<T>;
  find(
    callback: (value: T, index: number, array: TTLArray<T>) => boolean,
    thisArg?: any
  ): T | undefined;
  findIndex(
    callback: (value: T, index: number, array: TTLArray<T>) => boolean,
    thisArg?: any
  ): number;
  some(
    callback: (value: T, index: number, array: TTLArray<T>) => boolean,
    thisArg?: any
  ): boolean;
  every(
    callback: (value: T, index: number, array: TTLArray<T>) => boolean,
    thisArg?: any
  ): boolean;

  // Utility methods
  includes(value: T): boolean;
  indexOf(value: T): number;
  clear(): void;
  toArray(): T[];
  deleteByKey(key: string): void;

  // Properties
  readonly length: number;

  // Iterator
  [Symbol.iterator](): Iterator<T>;
}

declare function createTTLArrayProxy<T = any>(
  options?: TTLArrayOptions
): TTLArray<T> & {
  [index: number]: T;
};

declare const TTLArrayConstructor: {
  new <T = any>(options?: TTLArrayOptions): TTLArray<T> & {
    [index: number]: T;
  };
};

export default TTLArrayConstructor;
