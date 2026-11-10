import { apiCreated, apiError } from '@/lib/apiResponse';
import { BackendOperationError } from '@/lib/backend/errors';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { getClientIp } from '@/lib/clientIp';
import { registerUser } from '@/lib/domain/auth';
import { checkRateLimit } from '@/lib/ratelimit';
import { registerSchema } from '@/lib/schemas/auth/register.schema';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRateLimitResult = await checkRateLimit(
      `register-ip:${getClientIp(request)}`,
      5,
      '30 m',
    );
    if (!ipRateLimitResult.success) return apiError(429, 'rateLimited');

    const body = await request.json().catch(() => null);
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return apiError(400, 'invalidData', {
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.message,
        })),
      });
    }

    const email = result.data.email.toLowerCase();
    const emailRateLimitResult = await checkRateLimit(
      `register-email:${email}`,
      3,
      '30 m',
    );
    if (!emailRateLimitResult.success) return apiError(429, 'rateLimited');

    await registerUser({
      firstName: result.data.firstName,
      lastName: result.data.lastName,
      email,
      password: result.data.password,
    });

    return apiCreated();
  } catch (error) {
    if (error instanceof BackendOperationError) {
      switch (error.code) {
        case 'CONFLICT':
          return apiError(409, 'emailTaken');
        case 'VALIDATION_ERROR':
          return apiError(422, 'invalidData');
        default:
          return backendRouteError(error, 'registro');
      }
    }
    return backendRouteError(error, 'registro');
  }
}
