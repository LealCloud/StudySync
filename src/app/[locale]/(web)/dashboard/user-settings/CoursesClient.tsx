'use client';

import { SettingsSkeleton } from '@/components/ui/SettingsSkeleton';
import { Link } from '@/i18n/navigation';
import {
  MyCoursesDocument,
  type CourseEnrollmentStatus,
  type MyCoursesQuery,
} from '@/graphql/generated/graphql';
import { useLocale } from 'next-intl';
import { useQuery } from 'urql';

type CourseEnrollmentRecord = MyCoursesQuery['myCourses'][number];

interface CoursesMessages {
  empty: string;
  statuses: {
    active: string;
    completed: string;
    paused: string;
  };
  progressLabel: string;
  enrolledAt: string;
  completedAt: string;
  errors: {
    FORBIDDEN: string;
    INTERNAL_ERROR: string;
  };
}

interface CoursesClientProps {
  messages: CoursesMessages;
}

/**
 * Formatea un `DateTime` (tipado como `unknown` por codegen).
 * Misma estrategia que `AccountClient` y `SessionsSection`.
 */
function formatDate(value: unknown, locale: string): string {
  if (typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const intlLocale = locale === 'en' ? 'en-US' : 'es-CO';

  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
  }).format(date);
}

const STATUS_STYLES: Record<CourseEnrollmentStatus, string> = {
  active: 'border-success/20 bg-success/10 text-success',
  completed: 'border-info/20 bg-info/10 text-info',
  paused: 'border-warning/20 bg-warning/10 text-warning',
};

export function CoursesClient({ messages }: CoursesClientProps) {
  const locale = useLocale();

  const [queryResult] = useQuery({
    query: MyCoursesDocument,
    requestPolicy: 'cache-and-network',
  });

  if (queryResult.fetching && !queryResult.data) {
    return <SettingsSkeleton rows={3} />;
  }

  const forbidden = queryResult.error?.graphQLErrors.some(
    (error) => error.extensions?.code === 'FORBIDDEN',
  );

  if (forbidden) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.FORBIDDEN}
      </p>
    );
  }

  if (!queryResult.data && queryResult.error) {
    return (
      <p role="alert" className="text-danger">
        {messages.errors.INTERNAL_ERROR}
      </p>
    );
  }

  if (!queryResult.data) return null;

  const courses = queryResult.data.myCourses;

  if (courses.length === 0) {
    return (
      <p role="status" className="text-foreground-muted text-sm">
        {messages.empty}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {courses.map((course) => (
        <CourseItem
          key={course.courseId}
          course={course}
          messages={messages}
          locale={locale}
        />
      ))}
    </ul>
  );
}

interface CourseItemProps {
  course: CourseEnrollmentRecord;
  messages: CoursesMessages;
  locale: string;
}

function CourseItem({ course, messages, locale }: CourseItemProps) {
  const progressPercent = Math.round(course.progress * 100);
  const statusLabel = messages.statuses[course.status];
  // `completedAt` llega como `unknown` desde codegen (DateTime no tipado).
  // Lo estrechamos aquí para que el `&&` del JSX funcione como type guard.
  const completedAt =
    typeof course.completedAt === 'string' ? course.completedAt : null;

  return (
    <li>
      <Link
        href={`/courses/${course.courseId}`}
        className="border-border bg-background hover:border-border-focus hover:bg-surface-hover focus-visible:ring-border-focus block rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:outline-none sm:p-5"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-foreground text-sm font-semibold">
            {course.title}
          </h3>
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[course.status]}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-3">
          <div className="text-foreground-muted flex items-center justify-between text-xs">
            <span>{messages.progressLabel}</span>
            <span className="text-foreground font-semibold">
              {progressPercent}%
            </span>
          </div>
          <progress
            value={progressPercent}
            max={100}
            aria-label={`${messages.progressLabel}: ${progressPercent}%`}
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-(--primary) [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-(--surface-hover) [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-(--primary)"
          />
        </div>

        <div className="text-foreground-subtle mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>
            {messages.enrolledAt.replace(
              '{date}',
              formatDate(course.enrolledAt, locale),
            )}
          </span>
          {completedAt && (
            <span>
              {messages.completedAt.replace(
                '{date}',
                formatDate(completedAt, locale),
              )}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
