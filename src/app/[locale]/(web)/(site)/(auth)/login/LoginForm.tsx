'use client';

import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { CustomLink } from '@/components/ui/Link';
import { IconMap } from '@/lib/iconMap';
import { loginSchema, type LoginInput } from '@/lib/schemas/auth/login.schema';
import { resolveError, type ValidationDict } from '@/lib/validation';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import ForgotPasswordModal, {
  type ForgotPasswordMessages,
} from './ForgotPasswordModal';

type MessageType = 'success' | 'error' | '';

export interface LoginFormMessages {
  eyebrow: string;
  title: string;
  description: string;
  fields: {
    email: { label: string; placeholder: string };
    password: {
      label: string;
      placeholder: string;
      show: string;
      hide: string;
    };
  };
  forgotPassword: string;
  actions: { submit: string; submitting: string };
  success: string;
  errors: {
    invalidCredentials: string;
    unexpected: string;
    rateLimited: string;
    unavailable: string;
  };
  footer: { prompt: string; link: string };
}

interface LoginFormProps {
  messages: LoginFormMessages;
  forgotMessages: ForgotPasswordMessages;
  validation: ValidationDict;
}

export default function LoginForm({
  messages,
  forgotMessages,
  validation,
}: LoginFormProps) {
  const locale = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<MessageType>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const {
    lock: LockKeyhole,
    mail: Mail,
    graduationCap: GraduationCap,
  } = IconMap.ui;

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
    reset,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginInput) => {
    setMessage('');
    setMessageType('');
    setIsSubmitting(true);

    try {
      const response = await signIn('credentials', {
        ...data,
        redirect: false,
        redirectTo: `/${locale}/dashboard`,
      });

      if (!response || response.error) {
        const code = (response as { code?: string } | undefined)?.code;
        setMessage(
          code === 'rateLimited'
            ? messages.errors.rateLimited
            : code === 'unavailable'
              ? messages.errors.unavailable
              : messages.errors.invalidCredentials,
        );
        setMessageType('error');
        return;
      }

      setMessage(messages.success);
      setMessageType('success');
      reset({ email: '', password: '' });

      window.location.assign(response.url ?? '/dashboard');
    } catch {
      // Fallo de red u otro error no controlado
      setMessage(messages.errors.unexpected);
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
                autoComplete="current-password"
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

          <div className="flex justify-end">
            <Button
              type="button"
              variant="ghost"
              className="text-primary hover:text-primary-hover text-xs font-semibold no-underline transition-colors"
              onClick={() => setIsForgotPasswordOpen(true)}
            >
              {messages.forgotPassword}
            </Button>
          </div>

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
            href="/register"
            className="text-primary hover:text-primary-hover ml-1.5 font-semibold no-underline transition-colors"
          >
            {messages.footer.link}
          </CustomLink>
        </p>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        setIsOpen={setIsForgotPasswordOpen}
        validation={validation}
        messages={forgotMessages}
      />
    </section>
  );
}
