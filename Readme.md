# TTLMapArray

`TTLMapArray` is a JavaScript class that combines the features of both an Array and a Map, with built-in support for Time-To-Live (TTL) expiration of items. Each item can have an optional TTL after which it is automatically removed from the collection, and an optional callback can be triggered on expiration.

## Features

- Use as an Array (FIFO/LIFO operations, index access, iteration)
- Use as a Map (key-value storage, lookup, deletion)
- Per-item or global TTL (Time-To-Live) expiration
- Optional expiration callback (`onExpire`)
- Utility methods for iteration, mapping, and more

## Installation

Copy `index.js` into your project and import the class:

```js
import TTLMapArray from "@ttessarolo/ttl-map-array";
```

## Usage

### As an Array

```js
const arr = new TTLMapArray({ ttl: 5000 }); // 5 seconds TTL for all items

const key1 = arr.push("apple");
const key2 = arr.push("banana");

console.log(arr.shift()); // 'apple'
console.log(arr.pop()); // 'banana'
console.log(arr.isEmpty()); // true
```

### As a Map

```js
const map = new TTLMapArray({});

map.set("foo", 123, { ttl: 2000 }); // 2 seconds TTL for this item
map.set("bar", 456);

console.log(map.get("foo")); // 123
console.log(map.has("bar")); // true

setTimeout(() => {
  console.log(map.get("foo")); // null (expired)
}, 2500);

map.delete("bar");
console.log(map.has("bar")); // false
```

## Example: Using the onExpire Callback

You can provide an `onExpire` callback to execute custom logic when an item expires. The callback receives the expired value and its key.

```js
const map = new TTLMapArray();

map.set("session", "user123", {
  ttl: 1000, // 1 second
  onExpire: (value, key) => {
    console.log(`Item with key '${key}' and value '${value}' has expired.`);
  }
});

// After 1 second, the callback will log:
// Item with key 'session' and value 'user123' has expired.
```

## Example: Global onExpire Callback on Instantiation

You can set a global `onExpire` callback when instantiating the class. This callback will be triggered for every item that expires, unless an item-specific callback is provided.

```js
const arr = new TTLMapArray({
  ttl: 1000, // 1 second TTL for all items
  onExpire: (value, key) => {
    console.log(`Global expire: key='${key}', value='${value}'`);
  }
});

arr.push("apple");
arr.set("foo", "bar");

// After 1 second, the callback will log for both items:
// Global expire: key='0', value='apple'
// Global expire: key='foo', value='bar'
```

## APIs compatible with Array and Map

TTLMapArray implements many of the native Array and Map APIs, including:

- Properties: `length`, `size`
- Methods: `concat`, `slice`, `includes`, `indexOf`, `find`, `findIndex`, `some`, `every`, `filter`, `reduce`, `toString`, `toLocaleString`
- Iterability: supports `for...of` and the spread operator `[...obj]`

## Advanced Example: Array and Map Compatibility

```js
const arr = new TTLMapArray({});
arr.push("a");
arr.push("b");
arr.push("c");

console.log(arr.length); // 3
console.log(arr.size); // 3

// Array-like methods
const arr2 = arr.slice(1, 3);
console.log(arr2.values()); // ["b", "c"]
console.log(arr.includes("b")); // true
console.log(arr.indexOf("c")); // 2
console.log(arr.find((v) => v === "b")); // "b"
console.log(arr.findIndex((v) => v === "c")); // 2
console.log(arr.some((v) => v === "a")); // true
console.log(arr.every((v) => typeof v === "string")); // true
console.log(arr.filter((v) => v !== "a").values()); // ["b", "c"]
console.log(arr.reduce((acc, v) => acc + v, "")); // "abc"

// Map-like methods
arr.set("customKey", "z");
console.log(arr.get("customKey")); // "z"

// Iterability
for (const [key, value] of arr) {
  console.log(key, value);
}

const spread = [...arr];
console.log(spread); // array of [key, value]
```

## API Reference

| Method/Property            | Description                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `push(value, options)`     | Adds a value with optional TTL, returns generated key.                                 |
| `set(key, value, options)` | Sets a value for a key with optional TTL and onExpire callback.                        |
| `get(key)`                 | Retrieves the value for a given key, or `null` if not found.                           |
| `shift()`                  | Removes and returns the first value (FIFO).                                            |
| `pop()`                    | Removes and returns the last value (LIFO).                                             |
| `delete(key)`              | Removes the item with the given key.                                                   |
| `has(key)`                 | Returns `true` if the key exists, otherwise `false`.                                   |
| `at(index)`                | Returns the value at the given index, or `null` if out of bounds.                      |
| `forEach(cb)`              | Iterates over all items, calling `cb(value, key, queue)` for each.                     |
| `map(cb)`                  | Returns a new array with the results of calling `cb(value, key, queue)` on every item. |
| `values()`                 | Returns an array of all values.                                                        |
| `keys()`                   | Returns an array of all keys.                                                          |
| `entries()`                | Returns an array of `[key, value]` pairs.                                              |
| `clear()`                  | Removes all items and clears all timeouts.                                             |
| `isEmpty()`                | Returns `true` if the collection is empty.                                             |
| `size()`                   | Returns the number of items in the collection.                                         |
| `first()`                  | Returns the first value, or `null` if empty.                                           |
| `last()`                   | Returns the last value, or `null` if empty.                                            |
| `next()`                   | Alias for `first()`.                                                                   |
| `length`                   | Number of elements (like Array).                                                       |
| `size`                     | Number of elements (like Map).                                                         |
| `concat(...arrays)`        | Returns a new TTLMapArray by concatenating other arrays/maps.                          |
| `slice(start, end)`        | Returns a partial copy as a new TTLMapArray.                                           |
| `includes(value)`          | Checks if a value is present.                                                          |
| `indexOf(value)`           | Returns the index of the value, or -1 if not found.                                    |
| `find(cb)`                 | Returns the first value that satisfies the callback.                                   |
| `findIndex(cb)`            | Returns the index of the first value that satisfies the callback.                      |
| `some(cb)`                 | Returns true if at least one value satisfies the callback.                             |
| `every(cb)`                | Returns true if all values satisfy the callback.                                       |
| `filter(cb)`               | Returns a new filtered TTLMapArray.                                                    |
| `reduce(cb, init)`         | Reduces the values to a single result.                                                 |
| `toString()`               | Returns a string representation of the structure.                                      |
| `toLocaleString()`         | As above, but localized.                                                               |
| `[Symbol.iterator]`        | Allows iteration with for...of and spread operator.                                    |

## License

MIT License

Copyright (c) 2025 Tommaso Tessarolo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
