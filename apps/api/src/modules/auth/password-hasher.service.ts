import { Injectable } from '@nestjs/common';
import { hash as argon2Hash, verify as argon2Verify } from '@node-rs/argon2';
import bcrypt from 'bcryptjs';
import type { PasswordVerifyResult } from './auth.types';

const ARGON2_OPTIONS = {
  algorithm: 2, // Algorithm.Argon2id (const enum évité pour isolatedModules)
  memoryCost: 19_456, // 19 MiB (recommandation OWASP 2025/2026)
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Service de hachage bi-algorithme (Argon2id cible + Bcrypt $2y$12$ legacy Laravel).
 * Assure la migration transparente des mots de passe lors de la première connexion réussie.
 */
@Injectable()
export class PasswordHasherService {
  async hashArgon2(plainPassword: string): Promise<string> {
    return argon2Hash(plainPassword, ARGON2_OPTIONS);
  }

  async verifyAndCheckRehash(
    plainPassword: string,
    storedHash: string,
  ): Promise<PasswordVerifyResult> {
    if (!plainPassword || !storedHash) {
      return { valid: false, needsRehash: false };
    }

    if (storedHash.startsWith('$argon2id$') || storedHash.startsWith('$argon2i$')) {
      try {
        const valid = await argon2Verify(storedHash, plainPassword);
        return {
          valid,
          needsRehash: valid && !storedHash.startsWith('$argon2id$'),
        };
      } catch {
        return { valid: false, needsRehash: false };
      }
    }

    if (
      storedHash.startsWith('$2y$') ||
      storedHash.startsWith('$2a$') ||
      storedHash.startsWith('$2b$')
    ) {
      try {
        // Laravel génère des empreintes $2y$ : normalisation en $2b$ pour compatibilité bcryptjs
        const normalizedBcryptHash = storedHash.replace(/^\$2[ya]\$/, '$2b$');
        const valid = await bcrypt.compare(plainPassword, normalizedBcryptHash);
        return { valid, needsRehash: valid };
      } catch {
        return { valid: false, needsRehash: false };
      }
    }

    return { valid: false, needsRehash: false };
  }
}
