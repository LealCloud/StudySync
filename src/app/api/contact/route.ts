import { apiError, apiOk } from '@/lib/apiResponse';
import { BackendOperationError } from '@/lib/backend/errors';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { getClientIp } from '@/lib/clientIp';
import { submitContact } from '@/lib/domain/contact';
import { contactSchema } from '@/lib/schemas/contact/contact.schema';
import { checkRateLimit } from '@/lib/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRateLimitResult = await checkRateLimit(
      `contact-ip:${getClientIp(request)}`,
      5,
      '15 m',
    );
    if (!ipRateLimitResult.success) return apiError(429, 'rateLimited');

    const body = await request.json().catch(() => null);
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return apiError(400, 'invalidData', {
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.message,
        })),
      });
    }

    await submitContact(result.data);
    return apiOk();
  } catch (error) {
    if (error instanceof BackendOperationError) {
      switch (error.code) {
        case 'VALIDATION_ERROR':
          return apiError(422, 'invalidData');
        case 'INTERNAL_ERROR':
          return apiError(500, 'sendFailed');
        default:
          return backendRouteError(error, 'contacto');
      }
    }
    return backendRouteError(error, 'contacto');
  }
}
