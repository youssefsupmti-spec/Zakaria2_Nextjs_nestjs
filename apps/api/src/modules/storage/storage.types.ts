export interface PutObjectInput {
  /** Sous-dossier métier (ex: avatars, logos, justificatifs) */
  folder: string;
  /** Nom ou extension d'origine (ex: avatar.png) */
  originalFilename: string;
  /** Contenu binaire du fichier */
  content: Buffer;
  /** Type MIME optionnel */
  mimeType?: string;
}

export interface StoredObjectMeta {
  /** Clé relative stockée en BDD (ex: avatars/2026-11/uuid.png) */
  key: string;
  /** Taille en octets */
  sizeBytes: number;
  mimeType: string;
}

export const STORAGE_ADAPTER = Symbol('G4D_STORAGE_ADAPTER');

export interface StorageAdapter {
  putObject(input: PutObjectInput): Promise<StoredObjectMeta>;
  readObject(key: string): Promise<Buffer>;
  deleteObject(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

