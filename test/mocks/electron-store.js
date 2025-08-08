/**
 * Mock for electron-store module in tests
 */

class MockStore {
  constructor(options) {
    this.data = options?.defaults || {};
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
  }

  has(key) {
    return key in this.data;
  }

  delete(key) {
    delete this.data[key];
  }

  clear() {
    this.data = {};
  }
}

// Export as default for ES6 imports and as a CommonJS export
module.exports = MockStore;
module.exports.default = MockStore;
