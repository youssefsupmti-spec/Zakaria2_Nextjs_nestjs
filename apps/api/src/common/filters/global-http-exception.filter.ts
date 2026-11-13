import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@zakaria/backend-database';
import type { FastifyReply, FastifyRequest } from 'fastify';

function mapPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  status: number;
  message: string;
} {
  switch (error.code) {
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: 'Une ressource avec cet identifiant ou code unique existe déjà.',
      };
    case 'P2003':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Référence liée introuvable ou contrainte relationnelle violée.',
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'Ressource demandée introuvable.',
      };
    default:
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Erreur de persistance des données.',
      };
  }
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Une erreur interne est survenue.';
    let errorName = 'InternalServerError';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorName = exception.name;
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else if (typeof response === 'object' && response !== null) {
        const resObj = response as Record<string, unknown>;
        if (typeof resObj.message === 'string' || Array.isArray(resObj.message)) {
          message = resObj.message as string | string[];
        }
        if (resObj.details !== undefined) {
          details = resObj.details;
        }
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      const mapped = mapPrismaError(exception);
      status = mapped.status;
      message = mapped.message;
      errorName = `PrismaError_${exception.code}`;
    } else if (exception instanceof Error) {
      this.logger.error(
        `Exception non gérée sur ${request.method} ${request.url}: ${exception.message}`,
        exception.stack,
      );
    } else {
      this.logger.error(`Exception inconnue sur ${request.method} ${request.url}`);
    }

    const requestId =
      typeof request.id === 'string' || typeof request.id === 'number'
        ? String(request.id)
        : undefined;

    void reply.status(status).send({
      statusCode: status,
      error: errorName,
      message,
      ...(details !== undefined ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(requestId ? { requestId } : {}),
    });
  }
}
