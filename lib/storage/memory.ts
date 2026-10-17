import type { ObjectStorage, StoredObject } from "./types";

/** In-memory storage for tests and local development without R2. */
export class MemoryStorage implements ObjectStorage {
  readonly objects = new Map<
    string,
    { body: Uint8Array; contentType: string; lastModified: Date }
  >();

  constructor(
    private readonly baseUrl = "https://images.test",
    private readonly now: () => Date = () => new Date(),
  ) {}

  async put(key: string, body: Uint8Array, contentType: string): Promise<void> {
    this.objects.set(key, { body, contentType, lastModified: this.now() });
  }

  async delete(key: string): Promise<void> {
    this.objects.delete(key);
  }

  async list(prefix: string): Promise<StoredObject[]> {
    return [...this.objects.entries()]
      .filter(([key]) => key.startsWith(prefix))
      .map(([key, o]) => ({ key, lastModified: o.lastModified }));
  }

  publicUrl(key: string): string {
    return `${this.baseUrl}/${key}`;
  }
}
