// prisma/seed.ts
//
// Seed de desarrollo para StudySync.
//
// Idempotente: se puede correr N veces seguidas y el resultado es el
// mismo (upsert por PK). No borra datos ajenos al seed.
//
// Crea 3 usuarios (student, teacher, admin) con password `ValidPass1!`.
// Solo el student tiene datos ricos (subscription, payment method,
// invoice, certificate, course enrollment). Los otros dos son mínimos.
//
// TODO(seed-via-domain): cuando la capa de dominio exista (Fase C),
// evaluar si este seed debe migrarse a llamar a `registerUser`,
// `updatePersonalData`, etc. Decisión: hoy no, porque el seed es carga
// de datos, no lógica de negocio, y la capa de dominio aún no existe.
//
// TODO(seed-shared-prisma): hoy este script crea su propio PrismaClient
// en lugar de usar el singleton de `src/lib/db/prisma.ts` (B.5). Es
// intencional: el seed es un script de un solo uso que corre en su
// propio proceso de Node, no en el runtime de Next.js. Compartir el
// singleton no aportaría nada y acoplaría dos contextos distintos.
// Reevaluar solo si en el futuro aparece duplicación real de lógica
// de cliente entre runtime y scripts.

import { PrismaClient, type UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const DEV_PASSWORD = 'ValidPass1!';
const BCRYPT_ROUNDS = 10;

// IDs fijos para que el seed sea determinista y re-ejecutable.
const USER_IDS = {
  student: 'usr_student',
  teacher: 'usr_teacher',
  admin: 'usr_admin',
} as const;

// Fechas fijas (2026) para que la UI muestre datos predecibles.
const D = {
  userCreated: new Date('2026-01-01T00:00:00.000Z'),
  subscriptionStart: new Date('2026-01-15T00:00:00.000Z'),
  subscriptionPeriodEnd: new Date('2026-12-15T00:00:00.000Z'),
  enrollmentStart: new Date('2026-01-20T00:00:00.000Z'),
  certificateIssued: new Date('2026-02-01T00:00:00.000Z'),
  invoiceIssued: new Date('2026-02-01T00:00:00.000Z'),
} as const;

interface SeedUserInput {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

async function seedUser(
  passwordHash: string,
  input: SeedUserInput,
): Promise<void> {
  const { id, email, role, firstName, lastName } = input;

  // 1. User (raíz).
  await prisma.user.upsert({
    where: { id },
    update: { email, passwordHash, role },
    create: {
      id,
      email,
      passwordHash,
      role,
      createdAt: D.userCreated,
    },
  });

  // 2. PersonalData (1:1).
  await prisma.personalData.upsert({
    where: { userId: id },
    update: { firstName, lastName },
    create: {
      userId: id,
      firstName,
      lastName,
      documentType: 'dni',
      documentId: `${id}-doc`,
      phone: '+573001234567',
      country: 'CO',
      address: 'Calle 123 #45-67, Bogotá',
      identityLocked: false,
    },
  });

  // 3. Profile (1:1).
  await prisma.profile.upsert({
    where: { userId: id },
    update: {},
    create: {
      userId: id,
      image: null,
      bio: {
        title: 'Estudiante de prueba',
        description: 'Cuenta de desarrollo creada por el seed.',
      },
      interests: ['programming', 'technology'],
    },
  });

  // 4. PrivacySettings (1:1).
  await prisma.privacySettings.upsert({
    where: { userId: id },
    update: {},
    create: {
      userId: id,
      profileVisibility: 'everyone',
      emailVisibility: 'authenticated',
      phoneVisibility: 'nobody',
      allowDirectMessages: true,
    },
  });

  // 5. Preferences (1:1).
  await prisma.preferences.upsert({
    where: { userId: id },
    update: {},
    create: {
      userId: id,
      language: 'es',
      theme: 'system',
      timezone: 'America/Bogota',
      notifications: { email: true, push: true, inApp: true },
      accessibility: { reducedMotion: false, highContrast: false },
    },
  });

  // 6. SecuritySettings (1:1).
  await prisma.securitySettings.upsert({
    where: { userId: id },
    update: {},
    create: {
      userId: id,
      emailVerified: true,
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  // 7. Account (1:1).
  await prisma.account.upsert({
    where: { userId: id },
    update: {},
    create: {
      userId: id,
      status: 'active',
      deactivationScheduledAt: null,
    },
  });
}

async function seedStudentExtras(): Promise<void> {
  const userId = USER_IDS.student;

  // 8. Subscription (1:1, opcional).
  await prisma.subscription.upsert({
    where: { userId },
    update: {},
    create: {
      id: 'sub_student',
      userId,
      plan: 'premium',
      status: 'active',
      startedAt: D.subscriptionStart,
      currentPeriodEnd: D.subscriptionPeriodEnd,
      cancelAtPeriodEnd: false,
    },
  });

  // 9. PaymentMethod (1:N, id fijo).
  await prisma.paymentMethod.upsert({
    where: { id: 'pm_student_001' },
    update: {},
    create: {
      id: 'pm_student_001',
      userId,
      brand: 'Visa',
      last4: '4242',
      expirationMonth: 12,
      expirationYear: 2028,
    },
  });

  // 10. Invoice (1:N, id fijo).
  await prisma.invoice.upsert({
    where: { id: 'inv_student_001' },
    update: {},
    create: {
      id: 'inv_student_001',
      userId,
      number: 'INV-2026-001',
      amount: 4_990_000, // $49.900 COP en unidades menores.
      currency: 'COP',
      status: 'paid',
      issuedAt: D.invoiceIssued,
      downloadUrl: 'https://example.com/invoices/INV-2026-001.pdf',
    },
  });

  // 11. CourseEnrollment (1:N, id fijo). @@unique([userId, courseId]).
  await prisma.courseEnrollment.upsert({
    where: { id: 'enr_student_001' },
    update: {},
    create: {
      id: 'enr_student_001',
      userId,
      courseId: 'course_graphql_basico',
      title: 'GraphQL básico',
      progress: 0.65,
      status: 'active',
      enrolledAt: D.enrollmentStart,
      completedAt: null,
    },
  });

  // 12. Certificate (1:N, id fijo). @@unique([userId, certificateNumber]).
  await prisma.certificate.upsert({
    where: { id: 'cert_student_001' },
    update: {},
    create: {
      id: 'cert_student_001',
      userId,
      courseId: 'course_intro_programacion',
      courseTitle: 'Introducción a la programación',
      certificateNumber: 'CERT-2026-001',
      issuedAt: D.certificateIssued,
      downloadUrl: 'https://example.com/certificates/CERT-2026-001.pdf',
    },
  });
}

async function seedMessaging(): Promise<void> {
  const conversationId = 'conv_student_teacher';
  const directKey = [USER_IDS.student, USER_IDS.teacher].sort().join(':');
  await prisma.conversation.upsert({ where: { id: conversationId }, update: {}, create: { id: conversationId, type: 'direct', directKey } });
  for (const [userId, id] of [[USER_IDS.student, 'cp_student_teacher_student'], [USER_IDS.teacher, 'cp_student_teacher_teacher']] as const) {
    await prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId } }, update: {},
      create: { id, conversationId, userId },
    });
  }
  const now = Date.now();
  const messages = [
    { id: 'msg_001', senderId: USER_IDS.student, content: 'Hola profesor, ¿tiene un momento?', offsetMs: -180000 },
    { id: 'msg_002', senderId: USER_IDS.teacher, content: 'Claro, dime en qué puedo ayudarte.', offsetMs: -120000 },
    { id: 'msg_003', senderId: USER_IDS.student, content: 'Quería consultar sobre el próximo examen.', offsetMs: -60000 },
  ];
  for (const msg of messages) {
    await prisma.message.upsert({ where: { id: msg.id }, update: {}, create: { id: msg.id, conversationId, senderId: msg.senderId, content: msg.content, createdAt: new Date(now + msg.offsetMs) } });
  }
}

async function main(): Promise<void> {
  console.log('Seeding dev data…');

  const passwordHash = await hash(DEV_PASSWORD, BCRYPT_ROUNDS);

  // 3 usuarios. El student lleva datos ricos; teacher y admin, mínimos.
  await seedUser(passwordHash, {
    id: USER_IDS.student,
    email: 'student@example.com',
    role: 'student',
    firstName: 'Estudiante',
    lastName: 'Demo',
  });

  await seedUser(passwordHash, {
    id: USER_IDS.teacher,
    email: 'teacher@example.com',
    role: 'teacher',
    firstName: 'Profesor',
    lastName: 'Demo',
  });

  await seedUser(passwordHash, {
    id: USER_IDS.admin,
    email: 'admin@example.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Demo',
  });

  // Datos ricos solo para el student.
  await seedStudentExtras();
  await seedMessaging();

  console.log('Seed complete.');
  console.log('');
  console.log('Dev users (password: ValidPass1!):');
  console.log(`  student@example.com  (${USER_IDS.student})`);
  console.log(`  teacher@example.com  (${USER_IDS.teacher})`);
  console.log(`  admin@example.com    (${USER_IDS.admin})`);
}

main()
  .catch((error) => {
    console.error('Seed failed:');
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
