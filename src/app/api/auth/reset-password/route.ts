import { apiError, apiOk } from '@/lib/apiResponse';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { resetPassword } from '@/lib/backend/services/auth';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';
import { resetPasswordRequestSchema } from '@/lib/schemas/auth/reset-password.schema';
import { NextRequest, NextResponse } from 'next/server';

const IP_RATE_LIMIT = { max: 10, window: '15 m' } as const;
const TOKEN_RATE_LIMIT = { max: 5, window: '15 m' } as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRateLimitResult = await checkRateLimit(
      `reset-password-ip:${getClientIp(request)}`,
      IP_RATE_LIMIT.max,
      IP_RATE_LIMIT.window,
    );
    if (!ipRateLimitResult.success) return apiError(429, 'rateLimited');

    const body = await request.json().catch(() => null);
    const result = resetPasswordRequestSchema.safeParse(body);
    if (!result.success) {
      return apiError(400, 'invalidData', {
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.message,
        })),
      });
    }

    const { token, password } = result.data;
    const tokenRateLimitResult = await checkRateLimit(
      `reset-password-token:${token}`,
      TOKEN_RATE_LIMIT.max,
      TOKEN_RATE_LIMIT.window,
    );
    if (!tokenRateLimitResult.success) return apiError(429, 'rateLimited');

    await resetPassword(token, password);
    return apiOk();
  } catch (error) {
    return backendRouteError(error, 'reset-password');
  }
}
