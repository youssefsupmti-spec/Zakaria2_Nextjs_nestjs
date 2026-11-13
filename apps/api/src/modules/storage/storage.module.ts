import { Global, Inject, Injectable, Module } from '@nestjs/common';
import { LocalDiskStorageAdapter } from './local-disk-storage.adapter';
import {
  STORAGE_ADAPTER,
  type PutObjectInput,
  type StorageAdapter,
  type StoredObjectMeta,
} from './storage.types';

/**
 * Façade métier unique pour la persistance des médias légers (avatars, logos, justificatifs).
 * Note : les PDF (bons, étiquettes, factures) sont générés à la volée (on-the-fly) sans disque.
 */
@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE_ADAPTER) private readonly adapter: StorageAdapter) {}

  putObject(input: PutObjectInput): Promise<StoredObjectMeta> {
    return this.adapter.putObject(input);
  }

  readObject(key: string): Promise<Buffer> {
    return this.adapter.readObject(key);
  }

  deleteObject(key: string): Promise<void> {
    return this.adapter.deleteObject(key);
  }

  exists(key: string): Promise<boolean> {
    return this.adapter.exists(key);
  }
}

@Global()
@Module({
  providers: [
    LocalDiskStorageAdapter,
    {
      provide: STORAGE_ADAPTER,
      useExisting: LocalDiskStorageAdapter,
    },
    StorageService,
  ],
  exports: [STORAGE_ADAPTER, StorageService],
})
export class StorageModule {}

