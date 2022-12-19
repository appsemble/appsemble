export class AppStorage {
  private data: Record<string, unknown>;
  constructor() {
    this.data = {};
  }
  get(key: string): unknown {
    return this.data[key];
  }
  set(key: string, value: unknown): void {
    this.data[key] = value;
  }
  remove(key: string): void {
    delete this.data[key];
  }
  clear(): void {
    this.data = {};
  }
}
