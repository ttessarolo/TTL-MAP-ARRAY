// Funzioni di utilità comuni per TTLMap, TTLArray, TTLMapArray

// Genera un UUID v4 random
function randomUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Gestisce la scadenza di un elemento con timeout
function setupTimeout({ ttl, onExpire, value, key, onDelete }) {
  if (!ttl) return null;
  return setTimeout(() => {
    if (onExpire) onExpire(value, key);
    if (onDelete) onDelete(key);
  }, ttl).unref();
}

export { randomUUID, setupTimeout };
