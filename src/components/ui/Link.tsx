import { type InternalHref } from '@/config/navigation';
import { Link } from '@/i18n/navigation';
import { cn } from '@/utilities/cn';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

type AllowedHref = InternalHref | `http${string}` | (string & {});

export interface CustomLinkProps extends Omit<
  ComponentPropsWithoutRef<'a'>,
  'href'
> {
  href: AllowedHref;
  label?: string;
}

export const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>(
  ({ href, label, className, children, ...props }, ref) => {
    const renderContent = children ?? label ?? href;

    const isChildrenText = typeof children === 'string';
    const automaticAriaLabel = children && !isChildrenText ? label : undefined;

    const isExternal =
      typeof href === 'string' &&
      (/^https?:\/\//.test(href) || href.startsWith('//'));

    const commonClasses = cn('cursor-pointer', className);
    const finalAriaLabel = props['aria-label'] ?? automaticAriaLabel;

    if (isExternal) {
      return (
        <a
          ref={ref}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={commonClasses}
          {...props}
          aria-label={finalAriaLabel}
        >
          {renderContent}
        </a>
      );
    }

    return (
      <Link
        ref={ref}
        href={href}
        className={commonClasses}
        {...props}
        aria-label={finalAriaLabel}
      >
        {renderContent}
      </Link>
    );
  },
);

CustomLink.displayName = 'CustomLink';
