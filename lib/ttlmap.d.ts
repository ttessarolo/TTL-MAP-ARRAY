export interface TTLMapOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
}

export interface TTLMapItemOptions {
  ttl?: number;
  onExpire?: (value: any, key: string) => void;
}

declare class TTLMap<K = string, V = any> {
  constructor(options?: TTLMapOptions);

  // Core methods
  set(key: K, value: V, options?: TTLMapItemOptions): this;
  get(key: K): V | undefined;
  has(key: K): boolean;
  delete(key: K): boolean;
  extract(key: K): V | undefined;

  // Collection methods
  clear(): void;
  keys(): IterableIterator<K>;
  values(): V[];
  entries(): [K, V][];

  // Properties
  readonly size: number;

  // Iteration methods
  forEach(
    callback: (value: V, key: K, map: TTLMap<K, V>) => void,
    thisArg?: any
  ): void;

  // Iterator
  [Symbol.iterator](): Iterator<[K, V]>;
}

export default TTLMap;
