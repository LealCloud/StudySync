'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { CustomLink } from '@/components/ui/Link';
import { useRouter } from '@/i18n/navigation';
import { readErrorCode } from '@/lib/errors/api-errors';
import { REGISTER_ERROR_CODES } from '@/lib/errors/auth-errors';
import { IconMap } from '@/lib/iconMap';
import {
  registerWithConfirmSchema,
  toRegisterPayload,
  type RegisterWithConfirmInput,
} from '@/lib/schemas/auth/register.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

type MessageType = 'success' | 'error' | '';

type RegisterFormInput = RegisterWithConfirmInput;

interface RegisterFormMessages {
  eyebrow: string;
  title: string;
  description: string;
  terms: string;
  success: string;
  fields: {
    firstName: { label: string; placeholder: string };
    lastName: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    password: {
      label: string;
      placeholder: string;
      show: string;
      hide: string;
    };
    confirmPassword: { label: string; placeholder: string };
  };
  actions: { submit: string; submitting: string };
  errors: Record<(typeof REGISTER_ERROR_CODES)[number], string>;
  footer: { prompt: string; link: string };
}

interface RegisterFormProps {
  messages: RegisterFormMessages;
  validation: ValidationDict;
}

export default function RegisterForm({
  messages,
  validation,
}: RegisterFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    lock: LockKeyhole,
    mail: Mail,
    user: User,
    graduationCap: GraduationCap,
  } = IconMap.ui;

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerWithConfirmSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      acceptedTerms: false,
    },
    mode: 'onChange',
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setMessage('');
    setMessageType('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toRegisterPayload(data)),
      });

      if (!response.ok) {
        const errorData: unknown = await response.json().catch(() => null);
        const code = readErrorCode(errorData, REGISTER_ERROR_CODES);
        throw new Error(code ?? 'serverError');
      }

      setMessage(messages.success);
      setMessageType('success');

      reset({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        acceptedTerms: false,
      });

      setTimeout(() => router.push('/login'), 1200);
    } catch (error) {
      const code =
        error instanceof Error &&
        REGISTER_ERROR_CODES.includes(
          error.message as (typeof REGISTER_ERROR_CODES)[number],
        )
          ? error.message
          : 'serverError';
      const errorMessage =
        messages.errors[code as keyof RegisterFormMessages['errors']];
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-background grid place-items-center p-6 lg:p-8">
      <div className="border-border bg-surface w-full max-w-122.5 rounded-3xl border p-7 shadow-xl lg:p-[30px_34px]">
        <div className="mb-7 flex items-center gap-3 lg:hidden">
          <span className="border-primary from-primary to-primary-hover text-primary-foreground grid h-10 w-10 place-items-center rounded-xl border bg-linear-to-br">
            <GraduationCap size={24} />
          </span>
          <strong className="text-foreground text-lg">StudySync</strong>
        </div>

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

        <form className="grid gap-3.5" onSubmit={handleSubmit(onSubmit)}>
          {/* Campo Nombre */}
          <Controller
            name="firstName"
            control={control}
            render={({ field }) => (
              <InputField
                label={messages.fields.firstName.label}
                id="firstName"
                value={field.value}
                onChange={field.onChange}
                placeholder={messages.fields.firstName.placeholder}
                autoComplete="given-name"
                icon={<User />}
                error={resolveError(validation, errors.firstName?.message)}
                required
                disabled={isSubmitting}
                size="md"
                variant="default"
              />
            )}
          />

          {/* Campo Apellido */}
          <Controller
            name="lastName"
            control={control}
            render={({ field }) => (
              <InputField
                label={messages.fields.lastName.label}
                id="lastName"
                value={field.value}
                onChange={field.onChange}
                placeholder={messages.fields.lastName.placeholder}
                autoComplete="family-name"
                icon={<User />}
                error={resolveError(validation, errors.lastName?.message)}
                required
                disabled={isSubmitting}
                size="md"
                variant="default"
              />
            )}
          />

          {/* Campo Email */}
          <Controller
            name="email"
            control={control}
            render={({ field }) => (
              <InputField
                label={messages.fields.email.label}
                id="email"
                type="email"
                value={field.value}
                onChange={field.onChange}
                placeholder={messages.fields.email.placeholder}
                autoComplete="email"
                icon={<Mail />}
                error={resolveError(validation, errors.email?.message)}
                required
                disabled={isSubmitting}
                size="md"
                variant="default"
              />
            )}
          />

          {/* Campo Contraseña */}
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
                error={resolveError(validation, errors.password?.message)}
                required
                disabled={isSubmitting}
                size="md"
                variant="default"
                rightElement={
                  <Button
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

          {/* Campo Confirmar Contraseña */}
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
                placeholder={messages.fields.confirmPassword.placeholder}
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
                    variant="ghost"
                    size="sm"
                    icon={showConfirmPassword ? 'eyeOff' : 'eye'}
                    aria-label={
                      showConfirmPassword
                        ? messages.fields.password.hide
                        : messages.fields.password.show
                    }
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  />
                }
              />
            )}
          />

          {/* Checkbox Términos y Condiciones */}
          <Controller
            name="acceptedTerms"
            control={control}
            render={({ field }) => (
              <label className="text-foreground-muted inline-flex cursor-pointer items-start gap-2 text-xs leading-relaxed">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="accent-primary mt-0.5"
                  disabled={isSubmitting}
                />
                <span>{messages.terms}</span>
              </label>
            )}
          />
          {errors.acceptedTerms && (
            <p className="text-danger text-xs leading-relaxed">
              {resolveError(validation, errors.acceptedTerms.message)}
            </p>
          )}

          {/* Mensaje de estado */}
          {message && (
            <p
              className={`m-0 rounded-xl border p-2.5 text-sm leading-relaxed ${
                messageType === 'success'
                  ? 'border-success/30 bg-success/10 text-success'
                  : 'border-danger/30 bg-danger/10 text-danger'
              }`}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
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
      </div>
    </section>
  );
}
