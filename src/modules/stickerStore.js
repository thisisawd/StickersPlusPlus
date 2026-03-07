/* ============================================================
   Stickers++ — Sticker Pack Storage Module
   ============================================================
   Persists sticker packs to localStorage so they survive
   across sessions. Each pack has an id, name, prompt, and
   array of stickers.
   ============================================================ */

const STORAGE_KEY = "stickersplusplus_packs";

export class StickerPackStore {
  constructor() {
    this._packs = this._load();
  }

  /**
   * Get all saved sticker packs.
   * @returns {Array} Array of pack objects
   */
  getAllPacks() {
    return [...this._packs];
  }

  /**
   * Get a specific pack by ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getPack(id) {
    return this._packs.find((p) => p.id === id) || null;
  }

  /**
   * Add a new sticker pack.
   * @param {{name: string, prompt: string, stickers: Array}} packData
   * @returns {Object} The saved pack with generated ID
   */
  addPack(packData) {
    const pack = {
      id: `pack-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: packData.name,
      prompt: packData.prompt || "",
      stickers: packData.stickers || [],
      createdAt: new Date().toISOString(),
    };

    this._packs.push(pack);
    this._save();
    return pack;
  }

  /**
   * Update an existing pack.
   * @param {string} id
   * @param {Object} updates - Partial pack data to merge
   * @returns {Object|null} Updated pack or null if not found
   */
  updatePack(id, updates) {
    const index = this._packs.findIndex((p) => p.id === id);
    if (index === -1) return null;

    this._packs[index] = { ...this._packs[index], ...updates };
    this._save();
    return this._packs[index];
  }

  /**
   * Delete a pack by ID.
   * @param {string} id
   * @returns {boolean} Whether the pack was found and deleted
   */
  deletePack(id) {
    const index = this._packs.findIndex((p) => p.id === id);
    if (index === -1) return false;

    this._packs.splice(index, 1);
    this._save();
    return true;
  }

  /**
   * Clear all packs.
   */
  clearAll() {
    this._packs = [];
    this._save();
  }

  // ── Private ────────────────────────────────────────────
  _load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn("Failed to load sticker packs from storage:", e);
      return [];
    }
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._packs));
    } catch (e) {
      console.warn("Failed to save sticker packs to storage:", e);
    }
  }
}
