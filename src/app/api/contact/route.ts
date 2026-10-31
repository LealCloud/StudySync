import { apiError, apiOk } from '@/lib/apiResponse';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { submitContact } from '@/lib/backend/services/contact';
import { getClientIp } from '@/lib/clientIp';
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
    return backendRouteError(error, 'contacto');
  }
}
