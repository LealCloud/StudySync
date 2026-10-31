import { apiError, apiOk } from '@/lib/apiResponse';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { requestPasswordReset } from '@/lib/backend/services/auth';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';
import { forgotPasswordSchema } from '@/lib/schemas/auth/forgot-password.schema';
import { NextRequest, NextResponse } from 'next/server';

const IP_RATE_LIMIT = { max: 5, window: '15 m' } as const;
const EMAIL_RATE_LIMIT = { max: 3, window: '15 m' } as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRateLimitResult = await checkRateLimit(
      `forgot-password-ip:${getClientIp(request)}`,
      IP_RATE_LIMIT.max,
      IP_RATE_LIMIT.window,
    );
    if (!ipRateLimitResult.success) return apiError(429, 'rateLimited');

    const body = await request.json().catch(() => null);
    const result = forgotPasswordSchema.safeParse(body);
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
      `forgot-password-email:${email}`,
      EMAIL_RATE_LIMIT.max,
      EMAIL_RATE_LIMIT.window,
    );
    if (!emailRateLimitResult.success) return apiError(429, 'rateLimited');

    await requestPasswordReset(email);
    return apiOk();
  } catch (error) {
    return backendRouteError(error, 'forgot-password');
  }
}
