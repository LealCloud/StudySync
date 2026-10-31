'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { CustomLink } from '@/components/ui/Link';
import { useRouter } from '@/i18n/navigation';
import { readErrorCode } from '@/lib/errors/api-errors';
import { RESET_PASSWORD_ERROR_CODES } from '@/lib/errors/auth-errors';
import { IconMap } from '@/lib/iconMap';
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from '@/lib/schemas/auth/reset-password.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

interface ResetPasswordFormProps {
  token: string;
  messages: ResetPasswordMessages;
  validation: ValidationDict;
}

interface ResetPasswordMessages {
  successTitle: string;
  success: string;
  successButton: string;
  eyebrow: string;
  title: string;
  description: string;
  legend: string;
  requestLink: string;
  fields: {
    password: {
      label: string;
      placeholder: string;
      show: string;
      hide: string;
    };
    confirmPassword: { label: string; placeholder: string };
  };
  actions: { submit: string; submitting: string };
  footer: { prompt: string; link: string };
  validating: string;
  validationError: string;
  retryValidation: string;
  apiErrors: Record<(typeof RESET_PASSWORD_ERROR_CODES)[number], string>;
}

const DEFAULT_VALUES: ResetPasswordInput = {
  password: '',
  confirmPassword: '',
};

/* ====================================================
   Envío
   ==================================================== */

async function submitNewPassword(
  token: string,
  password: string,
): Promise<string> {
  const response = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      readErrorCode(data, RESET_PASSWORD_ERROR_CODES) ?? 'serverError',
    );
  }

  return 'success';
}

async function validateResetToken(token: string): Promise<void> {
  const response = await fetch('/api/auth/validate-reset-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });

  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      readErrorCode(data, RESET_PASSWORD_ERROR_CODES) ?? 'serverError',
    );
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('valid' in data) ||
    data.valid !== true
  ) {
    throw new Error('serverError');
  }
}

// Ref estable: al mostrar el estado de éxito el foco pasa a su título.
const focusOnMount = (node: HTMLHeadingElement | null) => node?.focus();

/* ====================================================
   Formulario
   ==================================================== */

export default function ResetPasswordForm({
  token,
  messages,
  validation,
}: ResetPasswordFormProps) {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [tokenStatus, setTokenStatus] = useState<
    'validating' | 'valid' | 'invalid' | 'error'
  >('validating');
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;
    // TODO(fase-hardening): sustituir esta máquina de estados por un guard
    // basado en `useReducer` (acciones VALIDATE_START / VALIDATE_SUCCESS /
    // VALIDATE_ERROR) o `useSyncExternalStore`. El `setState` síncrono es
    // intencional aquí para reflejar el reinicio de la validación, pero
    // React Compiler lo marca porque provoca cascading renders.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- transición a "validating" antes de la promesa, intencional
    setTokenStatus('validating');

    validateResetToken(token)
      .then(() => {
        if (isCurrent) setTokenStatus('valid');
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;

        const code =
          error instanceof Error &&
          RESET_PASSWORD_ERROR_CODES.includes(
            error.message as (typeof RESET_PASSWORD_ERROR_CODES)[number],
          )
            ? error.message
            : 'serverError';
        setTokenStatus(code === 'invalidToken' ? 'invalid' : 'error');
      });

    return () => {
      isCurrent = false;
    };
  }, [token, validationAttempt]);

  const { lock: LockKeyhole, graduationCap: GraduationCap } = IconMap.ui;

  const {
    handleSubmit,
    control,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_VALUES,
  });

  const motionProps = {
    initial: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: shouldReduceMotion ? 0 : -8 },
    transition: { duration: shouldReduceMotion ? 0 : 0.25 },
  };

  const onSubmit = async (data: ResetPasswordInput) => {
    setFeedback(null);
    try {
      // TODO(fase-hardening): `submitNewPassword` devuelve un string que hoy
      // no se usa (el mensaje viene de `messages.success`). Se marca con
      // `void` para evitar el warning; si en el futuro el backend devuelve
      // un mensaje distinto por caso, consumirlo aquí.
      void (await submitNewPassword(token, data.password));
      setFeedback(messages.success);
      setStatus('success');
      setTimeout(() => router.push('/login'), 1600);
    } catch (error) {
      const code =
        error instanceof Error &&
        RESET_PASSWORD_ERROR_CODES.includes(
          error.message as (typeof RESET_PASSWORD_ERROR_CODES)[number],
        )
          ? error.message
          : 'serverError';
      setFeedback(
        messages.apiErrors[code as keyof ResetPasswordMessages['apiErrors']],
      );
      setStatus('error');
    }
  };

  const isInvalidLink =
    status === 'error' &&
    !!feedback &&
    feedback === messages.apiErrors.invalidToken;

  return (
    <section className="bg-background grid place-items-center p-6 lg:p-8">
      <div className="border-border bg-surface w-full max-w-122.5 rounded-3xl border p-7 shadow-xl lg:p-[30px_34px]">
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <span className="border-primary from-primary to-primary-hover text-primary-foreground grid h-10 w-10 place-items-center rounded-xl border bg-linear-to-br">
            <GraduationCap size={24} />
          </span>
          <strong className="text-foreground text-lg">StudySync</strong>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {tokenStatus === 'validating' ? (
            <motion.div
              key="validating"
              role="status"
              className="py-8 text-center"
              {...motionProps}
            >
              <p className="text-foreground-muted text-sm">
                {messages.validating}
              </p>
            </motion.div>
          ) : tokenStatus === 'invalid' || tokenStatus === 'error' ? (
            <motion.div
              key="validation-error"
              role="alert"
              className="grid gap-4 py-6 text-center"
              {...motionProps}
            >
              <p className="text-danger m-0 text-sm leading-relaxed">
                {tokenStatus === 'invalid'
                  ? messages.apiErrors.invalidToken
                  : messages.validationError}
              </p>
              {tokenStatus === 'invalid' ? (
                <CustomLink
                  href="/login"
                  className="text-danger font-semibold underline underline-offset-2"
                >
                  {messages.requestLink}
                </CustomLink>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setValidationAttempt((attempt) => attempt + 1)}
                >
                  {messages.retryValidation}
                </Button>
              )}
            </motion.div>
          ) : status === 'success' ? (
            <motion.div
              key="success"
              role="status"
              className="flex flex-col items-center py-8 text-center"
              {...motionProps}
            >
              <span
                aria-hidden="true"
                className="bg-success/10 text-success flex size-14 items-center justify-center rounded-full"
              >
                <IconMap.ui.checkCircle className="size-8" />
              </span>
              <h2
                ref={focusOnMount}
                tabIndex={-1}
                className="text-foreground mt-5 text-2xl font-semibold tracking-[-0.03em] focus:outline-none"
              >
                {messages.successTitle}
              </h2>
              <p className="text-foreground-muted mt-2 max-w-sm text-sm leading-relaxed">
                {messages.success}
              </p>
              <Button
                variant="primary"
                fullWidth
                className="mt-6"
                onClick={() => router.push('/login')}
              >
                {messages.successButton}
              </Button>
            </motion.div>
          ) : (
            <motion.div key="form" {...motionProps}>
              <header className="mb-6">
                <span className="text-primary text-xs font-extrabold tracking-[0.13em] uppercase">
                  {messages.eyebrow}
                </span>
                <h2 className="text-foreground my-2.5 text-4xl tracking-[-0.045em]">
                  {messages.title}
                </h2>
                <p className="text-foreground-muted m-0 text-sm leading-relaxed">
                  {messages.description}
                </p>
              </header>

              <form
                className="grid gap-3.5"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                aria-busy={isSubmitting}
              >
                <fieldset disabled={isSubmitting} className="grid gap-3.5">
                  <legend className="sr-only">{messages.legend}</legend>

                  {/* Nueva contraseña */}
                  <Controller
                    name="password"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        label={messages.fields.password.label}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={messages.fields.password.placeholder}
                        autoComplete="new-password"
                        icon={<LockKeyhole />}
                        error={resolveError(
                          validation,
                          errors.password?.message,
                        )}
                        required
                        disabled={isSubmitting}
                        size="md"
                        variant="default"
                        rightElement={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={showPassword ? 'eyeOff' : 'eye'}
                            aria-label={
                              showPassword
                                ? messages.fields.password.hide
                                : messages.fields.password.show
                            }
                            onClick={() => setShowPassword((prev) => !prev)}
                          />
                        }
                      />
                    )}
                  />

                  {/* Confirmar contraseña */}
                  <Controller
                    name="confirmPassword"
                    control={control}
                    render={({ field }) => (
                      <InputField
                        label={messages.fields.confirmPassword.label}
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={
                          messages.fields.confirmPassword.placeholder
                        }
                        autoComplete="new-password"
                        icon={<LockKeyhole />}
                        error={resolveError(
                          validation,
                          errors.confirmPassword?.message,
                        )}
                        required
                        disabled={isSubmitting}
                        size="md"
                        variant="default"
                        rightElement={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={showConfirmPassword ? 'eyeOff' : 'eye'}
                            aria-label={
                              showConfirmPassword
                                ? messages.fields.password.hide
                                : messages.fields.password.show
                            }
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                          />
                        }
                      />
                    )}
                  />

                  {/* Mensaje de error */}
                  {status === 'error' && feedback && (
                    <div
                      role="alert"
                      className="border-danger/30 bg-danger/10 text-danger m-0 grid gap-2 rounded-xl border p-2.5 text-sm leading-relaxed"
                    >
                      <p className="m-0">{feedback}</p>
                      {isInvalidLink && (
                        <CustomLink
                          href="/login"
                          className="text-danger font-semibold underline underline-offset-2"
                        >
                          {messages.requestLink}
                        </CustomLink>
                      )}
                    </div>
                  )}

                  {/* Botón de envío */}
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    icon="arrowRight"
                    iconPosition="right"
                    type="submit"
                    disabled={isSubmitting || !isValid}
                  >
                    {isSubmitting
                      ? messages.actions.submitting
                      : messages.actions.submit}
                  </Button>
                </fieldset>
              </form>

              <p className="text-foreground-muted mt-5 text-center text-sm">
                {messages.footer.prompt}
                <CustomLink
                  href="/login"
                  className="text-primary hover:text-primary-hover ml-1.5 font-semibold no-underline transition-colors"
                >
                  {messages.footer.link}
                </CustomLink>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
