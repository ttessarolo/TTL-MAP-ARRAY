// Funzioni di utilità comuni per TTLMap, TTLArray, TTLMapArray

// Sostituisce un setTimeout per ogni elemento
// con un unico timer che scatta alla scadenza più vicina, rimuove tutti
// gli elementi expired in un solo passaggio, e ripianifica il prossimo sweep.
class SweepScheduler {
  constructor(onSweep) {
    this._timer = null;
    this._scheduledAt = Infinity;
    this._onSweep = onSweep;
  }

  schedule(expiresAt) {
    if (expiresAt < this._scheduledAt) {
      if (this._timer) clearTimeout(this._timer);
      this._scheduledAt = expiresAt;
      const delay = Math.max(expiresAt - Date.now(), 0);
      this._timer = setTimeout(() => {
        this._timer = null;
        this._scheduledAt = Infinity;
        const nextExpiry = this._onSweep();
        if (nextExpiry !== null) {
          this.schedule(nextExpiry);
        }
      }, delay).unref();
    }
  }

  clear() {
    if (this._timer) clearTimeout(this._timer);
    this._timer = null;
    this._scheduledAt = Infinity;
  }
}

export { SweepScheduler };
