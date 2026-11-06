import { prisma } from '@/lib/db/prisma';
import type { BackendCertificate } from '@/lib/backend/types';

export async function getCertificates(
  userId: string,
): Promise<BackendCertificate[]> {
  const rows = await prisma.certificate.findMany({ where: { userId } });
  return rows.map(
    ({ id, courseId, courseTitle, certificateNumber, issuedAt, downloadUrl }) => ({
      id,
      courseId,
      courseTitle,
      certificateNumber,
      issuedAt: issuedAt.toISOString(),
      downloadUrl,
    }),
  );
}
