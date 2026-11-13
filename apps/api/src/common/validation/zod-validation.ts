import { BadRequestException } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Valide un payload inconnu avec un schéma Zod et lève une BadRequestException lisible en français.
 */
export function parseOrThrowZod<T>(
  schema: ZodType<T>,
  payload: unknown,
  fallbackMessage = 'Données de requête invalides.',
): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new BadRequestException({
      message: firstIssue?.message ?? fallbackMessage,
      details: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}
