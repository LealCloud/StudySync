import { prisma } from '@/lib/db/prisma';
import type { BackendCourseEnrollment } from '@/lib/backend/types';

export async function getCourseEnrollments(
  userId: string,
): Promise<BackendCourseEnrollment[]> {
  const rows = await prisma.courseEnrollment.findMany({ where: { userId } });
  return rows.map(({ courseId, title, progress, status, enrolledAt, completedAt }) => ({
    courseId,
    title,
    progress,
    status,
    enrolledAt: enrolledAt.toISOString(),
    completedAt: completedAt?.toISOString() ?? null,
  }));
}
