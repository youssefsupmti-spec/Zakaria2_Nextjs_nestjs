import { randomUUID } from 'node:crypto';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { loadBackendEnv } from '@zakaria/backend-config';
import type { PutObjectInput, StorageAdapter, StoredObjectMeta } from './storage.types';

const ALLOWED_EXTENSION_RE = /^[a-z0-9]{1,10}$/;
const SAFE_SEGMENT_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/**
 * Adaptateur de stockage local sur disque VPS (/app/storage/uploads en production).
 * Protégé contre les traversées de chemin (path traversal) ; remplaçable par Cloudflare R2.
 */
@Injectable()
export class LocalDiskStorageAdapter implements StorageAdapter {
  private readonly baseDir = path.resolve(loadBackendEnv().STORAGE_LOCAL_PATH);

  private resolveSafePath(relativeKey: string): string {
    const normalized = relativeKey.replaceAll('\\', '/').replace(/^\/+/, '');
    if (!normalized || normalized.includes('..')) {
      throw new BadRequestException('Clé de fichier invalide.');
    }

    const resolved = path.resolve(this.baseDir, normalized);
    const baseWithSep = this.baseDir.endsWith(path.sep) ? this.baseDir : `${this.baseDir}${path.sep}`;
    if (!resolved.startsWith(baseWithSep)) {
      throw new BadRequestException('Chemin de stockage hors périmètre autorisé.');
    }
    return resolved;
  }

  async putObject(input: PutObjectInput): Promise<StoredObjectMeta> {
    if (!SAFE_SEGMENT_RE.test(input.folder)) {
      throw new BadRequestException('Dossier de stockage invalide.');
    }

    const rawExt = path.extname(input.originalFilename).replace('.', '').toLowerCase();
    const ext = ALLOWED_EXTENSION_RE.test(rawExt) ? `.${rawExt}` : '';
    const datePrefix = new Date().toISOString().slice(0, 7);
    const key = `${input.folder}/${datePrefix}/${randomUUID()}${ext}`;
    const fullPath = this.resolveSafePath(key);

    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, input.content);

    return {
      key,
      sizeBytes: input.content.byteLength,
      mimeType: input.mimeType ?? 'application/octet-stream',
    };
  }

  async readObject(key: string): Promise<Buffer> {
    const fullPath = this.resolveSafePath(key);
    try {
      return await readFile(fullPath);
    } catch {
      throw new NotFoundException('Fichier introuvable sur le stockage local.');
    }
  }

  async deleteObject(key: string): Promise<void> {
    const fullPath = this.resolveSafePath(key);
    await unlink(fullPath).catch(() => undefined);
  }

  async exists(key: string): Promise<boolean> {
    try {
      const fullPath = this.resolveSafePath(key);
      await stat(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}

