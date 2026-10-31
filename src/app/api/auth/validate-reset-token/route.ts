import { apiError, apiOk } from '@/lib/apiResponse';
import { backendRouteError } from '@/lib/backend/routeErrors';
import { validateResetToken } from '@/lib/backend/services/auth';
import { getClientIp } from '@/lib/clientIp';
import { checkRateLimit } from '@/lib/ratelimit';
import { resetPasswordTokenSchema } from '@/lib/schemas/auth/reset-password.schema';
import { NextRequest, NextResponse } from 'next/server';

const IP_RATE_LIMIT = { max: 10, window: '15 m' } as const;
const TOKEN_RATE_LIMIT = { max: 10, window: '15 m' } as const;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const ipRateLimitResult = await checkRateLimit(
      `validate-reset-token-ip:${getClientIp(request)}`,
      IP_RATE_LIMIT.max,
      IP_RATE_LIMIT.window,
    );
    if (!ipRateLimitResult.success) return apiError(429, 'rateLimited');

    const body = await request.json().catch(() => null);
    const result = resetPasswordTokenSchema.safeParse(body);
    if (!result.success) {
      return apiError(400, 'invalidData', {
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          code: issue.message,
        })),
      });
    }

    const { token } = result.data;
    const tokenRateLimitResult = await checkRateLimit(
      `validate-reset-token:${token}`,
      TOKEN_RATE_LIMIT.max,
      TOKEN_RATE_LIMIT.window,
    );
    if (!tokenRateLimitResult.success) return apiError(429, 'rateLimited');

    const data = await validateResetToken(token);
    return apiOk(data);
  } catch (error) {
    return backendRouteError(error, 'validate-reset-token');
  }
}
