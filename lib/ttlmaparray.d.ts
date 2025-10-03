export interface TTLMapArrayOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
  signal?: AbortSignal;
}

export interface TTLMapArrayItemOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
}

export interface TTLMapArrayEntry<T = any> {
  key: string;
  value: T;
}

declare class TTLMapArray<T = any> {
  constructor(options?: TTLMapArrayOptions);

  // Core methods
  push(value: T, options?: TTLMapArrayItemOptions): string;
  set(key: string, value: T, options?: TTLMapArrayItemOptions): this;
  get(key: string): T | null;
  has(key: string): boolean;
  delete(key: string): boolean;

  // Array-like methods
  shift(): T | null;
  pop(): T | null;
  at(index: number): T | null;
  extract(index: number): T | null;
  extractKey(key: string): T | null;

  // Iteration methods
  forEach(
    callback: (value: T, key: string, array: TTLMapArray<T>) => void
  ): void;
  map<U>(callback: (value: T, key: string, array: TTLMapArray<T>) => U): U[];
  filter(
    callback: (value: T, key: string, array: TTLMapArray<T>) => boolean
  ): TTLMapArray<T>;
  find(
    callback: (value: T, index: number, array: TTLMapArray<T>) => boolean
  ): T | undefined;
  findIndex(
    callback: (value: T, index: number, array: TTLMapArray<T>) => boolean
  ): number;
  some(
    callback: (value: T, index: number, array: TTLMapArray<T>) => boolean
  ): boolean;
  every(
    callback: (value: T, index: number, array: TTLMapArray<T>) => boolean
  ): boolean;
  reduce<U>(
    callback: (
      accumulator: U,
      value: T,
      index: number,
      array: TTLMapArray<T>
    ) => U,
    initialValue: U
  ): U;
  reduce(
    callback: (
      accumulator: T,
      value: T,
      index: number,
      array: TTLMapArray<T>
    ) => T
  ): T;

  // Collection methods
  values(): T[];
  keys(): string[];
  entries(): [string, T][];

  // Utility methods
  clear(): void;
  isEmpty(): boolean;
  size(): number;
  first(): T | null;
  last(): T | null;
  next(): T | null;

  // Array methods
  concat(...arrays: TTLMapArray<T>[]): TTLMapArray<T>;
  slice(start?: number, end?: number): TTLMapArray<T>;
  includes(value: T): boolean;
  indexOf(value: T): number;

  // Properties
  readonly length: number;

  // Iterator
  [Symbol.iterator](): Iterator<[string, T]>;

  // String methods
  toString(): string;
  toLocaleString(): string;
}

declare function createTTLMapArrayProxy<T = any>(
  options?: TTLMapArrayOptions
): TTLMapArray<T> & {
  [index: number]: T;
};

declare const TTLMapArrayConstructor: {
  new <T = any>(options?: TTLMapArrayOptions): TTLMapArray<T> & {
    [index: number]: T;
  };
};

export default TTLMapArrayConstructor;
