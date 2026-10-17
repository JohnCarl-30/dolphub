export interface StoredObject {
  key: string;
  lastModified: Date;
}

/** Where image bytes live. R2 in production, memory in tests. */
export interface ObjectStorage {
  put(key: string, body: Uint8Array, contentType: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<StoredObject[]>;
  publicUrl(key: string): string;
}
