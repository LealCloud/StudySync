'use client';

import { IconMap, type SocialIconName, type UiIconName } from '@/lib/iconMap';
import { cn } from '@/utilities/cn';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from 'react';
import { CustomLink, type CustomLinkProps } from './Link';

export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonVariant =
  'primary' | 'secondary' | 'accent' | 'social' | 'ghost' | 'disabled';

interface WithTextContent {
  children: React.ReactNode;
  'aria-label'?: string;
}
interface OnlyIconContent {
  children?: never;
  'aria-label': string;
  icon: SocialIconName | UiIconName;
}
type ButtonContentProps = WithTextContent | OnlyIconContent;

interface BaseProps {
  variant: ButtonVariant;
  icon?: SocialIconName | UiIconName;
  iconPosition?: 'left' | 'right';
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

type ButtonAsLink = BaseProps &
  ButtonContentProps &
  Omit<CustomLinkProps, 'children' | 'className' | 'aria-label'> & {
    href: CustomLinkProps['href'];
    type?: never;
  };
type ButtonAsButton = BaseProps &
  ButtonContentProps &
  Omit<
    ComponentPropsWithoutRef<'button'>,
    'children' | 'className' | 'aria-label'
  > & {
    href?: never;
  };
export type ButtonProps = ButtonAsLink | ButtonAsButton;

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: cn(
    'border border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/25',
    'hover:bg-primary-hover active:brightness-95',
    'focus-visible:ring-primary',
  ),
  secondary: cn(
    'border border-transparent bg-secondary text-secondary-foreground shadow-lg shadow-secondary/25',
    'hover:bg-secondary-hover active:brightness-95',
    'focus-visible:ring-secondary',
  ),
  accent: cn(
    'border border-transparent bg-accent text-accent-foreground shadow-lg shadow-accent/25',
    'hover:bg-accent-hover active:brightness-95',
    'focus-visible:ring-accent',
  ),
  social: cn(
    'border border-border bg-surface text-foreground',
    'hover:bg-surface-hover hover:border-border-focus/40',
    'focus-visible:ring-primary',
  ),
  ghost: cn(
    'border border-transparent bg-transparent text-foreground-muted',
    'hover:bg-surface-hover hover:text-foreground',
    'active:bg-surface-active',
    'focus-visible:ring-primary',
  ),
  disabled:
    'border border-transparent bg-disabled text-disabled-text pointer-events-none shadow-none active:scale-100',
};

const BUTTON_SIZES: Record<ButtonSize, { default: string; iconOnly: string }> =
  {
    sm: {
      default: 'h-9 gap-1.5 rounded-xl px-4 text-xs',
      iconOnly: 'size-9 rounded-xl',
    },
    md: {
      default: 'h-11 gap-2 rounded-xl px-5 text-sm',
      iconOnly: 'size-11 rounded-xl',
    },
    lg: {
      default: 'h-12 gap-2.5 rounded-2xl px-7 text-base',
      iconOnly: 'size-12 rounded-2xl',
    },
  };

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-5',
};

function resolveIcon(
  icon: SocialIconName | UiIconName,
  size: ButtonSize,
): ReactNode {
  const IconComponent =
    IconMap.social[icon as SocialIconName] ?? IconMap.ui[icon as UiIconName];
  if (!IconComponent) return null;
  return (
    <IconComponent
      className={cn(ICON_SIZES[size], 'shrink-0')}
      aria-hidden="true"
    />
  );
}

function isLinkProps(props: ButtonProps): props is ButtonAsLink {
  return 'href' in props && props.href !== undefined;
}

export const Button = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(function Button(props, ref) {
  const {
    variant,
    icon,
    iconPosition = 'left',
    size = 'md',
    fullWidth = false,
    className,
    children,
    'aria-label': ariaLabel,
  } = props;

  const isActuallyDisabled =
    variant === 'disabled' || ('disabled' in props && !!props.disabled);
  const resolvedVariant: ButtonVariant = isActuallyDisabled
    ? 'disabled'
    : variant;
  const isIconOnly = !children && !!icon;
  const sizeClasses = BUTTON_SIZES[size];

  const finalClasses = cn(
    'inline-flex items-center justify-center font-medium',
    'transition-[color,background-color,border-color,box-shadow,transform] duration-200 select-none active:scale-95',
    'motion-reduce:transition-none motion-reduce:active:scale-100',
    '[&>svg]:shrink-0',
    'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
    BUTTON_VARIANTS[resolvedVariant],
    isIconOnly ? sizeClasses.iconOnly : sizeClasses.default,
    fullWidth && 'w-full',
    className,
  );

  const iconEl = icon ? resolveIcon(icon, size) : null;
  const content = isIconOnly ? (
    iconEl
  ) : (
    <>
      {iconPosition === 'left' && iconEl}
      {children}
      {iconPosition === 'right' && iconEl}
    </>
  );

  if (isLinkProps(props)) {
    const {
      href,
      variant: _variant,
      icon: _icon,
      iconPosition: _iconPosition,
      size: _size,
      fullWidth: _fullWidth,
      className: _className,
      children: _children,
      'aria-label': _ariaLabel,
      onClick,
      ...linkRest
    } = props;

    return (
      <CustomLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        {...linkRest}
        href={href}
        className={finalClasses}
        aria-label={ariaLabel}
        {...(isActuallyDisabled ? { 'aria-disabled': true, tabIndex: -1 } : {})}
        onClick={(e) => {
          if (isActuallyDisabled) {
            e.preventDefault();
            return;
          }
          onClick?.(e);
        }}
      >
        {content}
      </CustomLink>
    );
  }

  const {
    variant: _variant,
    icon: _icon,
    iconPosition: _iconPosition,
    size: _size,
    fullWidth: _fullWidth,
    className: _className,
    children: _children,
    'aria-label': _ariaLabel,
    disabled: _disabled,
    type = 'button',
    ...buttonRest
  } = props;

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={type}
      className={finalClasses}
      aria-label={ariaLabel}
      disabled={isActuallyDisabled}
      {...buttonRest}
    >
      {content}
    </button>
  );
});
Button.displayName = 'Button';
