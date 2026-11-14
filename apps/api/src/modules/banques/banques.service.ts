import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '@zakaria/backend-database';
import {
  CreateBanqueSchema,
  UpdateBanqueSchema,
  type AuthUserDto,
} from '@zakaria/shared-contracts';
import { parseOrThrowZod } from '../../common/validation/zod-validation';
import { PolicyService } from '../access-control/policy.service';

/** Normalise et déduplique une liste de codes RIB à 3 chiffres. */
export function normalizeUniqueBankCodes(codes: string[] | undefined): string[] {
  if (!codes || codes.length === 0) {
    return [];
  }
  return [...new Set(codes.map((c) => c.trim()))];
}

@Injectable()
export class BanquesService {
  constructor(
    private readonly database: DatabaseService,
    private readonly policy: PolicyService,
  ) {}

  private assertPermission(actor: AuthUserDto, permission: string): void {
    if (this.policy.isPlatformAdmin(actor)) {
      return;
    }
    if (!this.policy.hasPermission(actor, permission)) {
      throw new ForbiddenException(`Accès refusé : permission '${permission}' requise.`);
    }
  }

  private async assertCodesAvailable(codes: string[], excludeBankId?: number): Promise<void> {
    if (codes.length === 0) {
      return;
    }

    const conflicts = await this.database.prisma.banqueCode.findMany({
      where: {
        code: { in: codes },
        ...(excludeBankId ? { bankId: { not: excludeBankId } } : {}),
      },
      include: {
        banque: { select: { id: true, name: true } },
      },
    });

    if (conflicts.length > 0) {
      const first = conflicts[0];
      throw new ConflictException(
        `Le code RIB « ${first.code} » est déjà attribué à la banque ${first.banque.name}.`,
      );
    }
  }

  /** Liste les banques marocaines non supprimées avec leurs codes RIB à 3 chiffres. */
  async list(actor: AuthUserDto, search?: string) {
    this.assertPermission(actor, 'ViewAny:Banque');
    const q = search?.trim();

    const banques = await this.database.prisma.banque.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { swiftCode: { contains: q, mode: 'insensitive' } },
                { codes: { some: { code: { contains: q } } } },
              ],
            }
          : {}),
      },
      include: {
        codes: {
          select: { id: true, code: true },
          orderBy: { code: 'asc' },
        },
        _count: {
          select: {
            comptesBancaires: { where: { deletedAt: null } },
          },
        },
      },
      orderBy: [{ status: 'asc' }, { name: 'asc' }],
    });

    return {
      canCreate:
        this.policy.isPlatformAdmin(actor) || this.policy.hasPermission(actor, 'Create:Banque'),
      canUpdate:
        this.policy.isPlatformAdmin(actor) || this.policy.hasPermission(actor, 'Update:Banque'),
      canDelete:
        this.policy.isPlatformAdmin(actor) || this.policy.hasPermission(actor, 'Delete:Banque'),
      items: banques.map((b) => ({
        id: b.id,
        name: b.name,
        swiftCode: b.swiftCode,
        logo: b.logo,
        status: b.status,
        createdAt: b.createdAt,
        codes: b.codes.map((c) => c.code),
        comptesCount: b._count.comptesBancaires,
      })),
    };
  }

  /** Crée une banque et ses préfixes RIB à 3 chiffres dans une transaction. */
  async create(actor: AuthUserDto, rawPayload: unknown) {
    this.assertPermission(actor, 'Create:Banque');
    const dto = parseOrThrowZod(
      CreateBanqueSchema,
      rawPayload,
      'Données de création de banque invalides.',
    );
    const codes = normalizeUniqueBankCodes(dto.codes);

    await this.assertCodesAvailable(codes);

    const created = await this.database.prisma.$transaction(async (tx) => {
      const bank = await tx.banque.create({
        data: {
          name: dto.name.trim(),
          swiftCode: dto.swiftCode?.trim().toUpperCase() || null,
          logo: dto.logo?.trim() || null,
          status: dto.status ?? 'active',
        },
      });

      if (codes.length > 0) {
        await tx.banqueCode.createMany({
          data: codes.map((code) => ({ bankId: bank.id, code })),
        });
      }

      return bank;
    });

    return { ok: true, banque: { ...created, codes } };
  }

  /** Met à jour une banque et remplace atomiquement ses codes RIB à 3 chiffres si fournis. */
  async update(actor: AuthUserDto, banqueId: number, rawPayload: unknown) {
    this.assertPermission(actor, 'Update:Banque');
    const existing = await this.database.prisma.banque.findFirst({
      where: { id: banqueId, deletedAt: null },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Banque introuvable.');
    }

    const dto = parseOrThrowZod(
      UpdateBanqueSchema,
      rawPayload,
      'Données de mise à jour de banque invalides.',
    );
    const codes = dto.codes !== undefined ? normalizeUniqueBankCodes(dto.codes) : undefined;

    if (codes) {
      await this.assertCodesAvailable(codes, banqueId);
    }

    const updated = await this.database.prisma.$transaction(async (tx) => {
      const bank = await tx.banque.update({
        where: { id: banqueId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.swiftCode !== undefined
            ? { swiftCode: dto.swiftCode?.trim().toUpperCase() || null }
            : {}),
          ...(dto.logo !== undefined ? { logo: dto.logo?.trim() || null } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
      });

      if (codes !== undefined) {
        await tx.banqueCode.deleteMany({ where: { bankId: banqueId } });
        if (codes.length > 0) {
          await tx.banqueCode.createMany({
            data: codes.map((code) => ({ bankId: banqueId, code })),
          });
        }
      }

      return bank;
    });

    return { ok: true, banque: { ...updated, ...(codes !== undefined ? { codes } : {}) } };
  }

  /** Supprime (soft delete) une banque si aucun compte bancaire actif n'y est rattaché. */
  async softDelete(actor: AuthUserDto, banqueId: number) {
    this.assertPermission(actor, 'Delete:Banque');
    const existing = await this.database.prisma.banque.findFirst({
      where: { id: banqueId, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!existing) {
      throw new NotFoundException('Banque introuvable.');
    }

    const linkedComptes = await this.database.prisma.compteBancaire.count({
      where: { banqueId, deletedAt: null },
    });
    if (linkedComptes > 0) {
      throw new ConflictException(
        `Impossible de supprimer ${existing.name} : ${linkedComptes} compte(s) bancaire(s) actif(s) y sont rattaché(s).`,
      );
    }

    await this.database.prisma.$transaction([
      this.database.prisma.banqueCode.deleteMany({ where: { bankId: banqueId } }),
      this.database.prisma.banque.update({
        where: { id: banqueId },
        data: { status: 'inactive', deletedAt: new Date() },
      }),
    ]);

    return { ok: true, id: banqueId };
  }
}
