import { cn } from '@/utilities/cn';
import { ChangeEvent, cloneElement, isValidElement, ReactNode } from 'react';

export interface InputFieldProps {
  label: string;
  name?: string;
  type?: string;
  value: string | number | boolean | null | undefined;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  icon?: ReactNode;
  rightElement?: ReactNode;
  isSelect?: boolean;
  options?: Array<{ value: string; label: string }>;
  error?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  id?: string;
}

// Type helper para props de iconos
interface IconProps {
  size?: number;
  className?: string;
}

// Type helper para props de elementos derecho
interface RightElementProps {
  className?: string;
}

export const InputField = ({
  label,
  name,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  icon,
  rightElement,
  isSelect = false,
  options = [],
  error,
  disabled = false,
  className = '',
  containerClassName = '',
  size = 'md',
  variant = 'default',
}: InputFieldProps) => {
  // Mapeo de tamaños consistente con el sistema de diseño
  const sizeClasses = {
    sm: 'min-h-9 text-xs px-2.5 gap-2',
    md: 'min-h-11 text-sm px-3.5 gap-3',
    lg: 'min-h-12 text-base px-4 gap-3.5',
  };

  // Mapeo de variantes actualizado con tokens -hover
  const variantClasses = {
    default: cn(
      'border-border bg-surface text-foreground-muted',
      'hover:border-primary-hover hover:bg-surface-hover',
      'focus-within:border-border-focus focus-within:bg-surface-active',
    ),
    filled: cn(
      'border-transparent bg-surface text-foreground-muted',
      'hover:bg-surface-hover',
      'focus-within:border-border-focus focus-within:bg-surface-active',
    ),
    outlined: cn(
      'border-border bg-transparent text-foreground-muted border-2',
      'hover:border-primary-hover',
      'focus-within:border-border-focus',
    ),
  };

  const iconSizeMap = {
    sm: 16,
    md: 18,
    lg: 20,
  };

  const fieldId = id || name;

  const baseInputClasses = cn(
    'text-foreground',
    'placeholder:text-foreground-subtle',
    'w-full min-w-0 border-0 bg-transparent outline-0',
    disabled && 'cursor-not-allowed text-disabled-text',
    className,
  );

  const baseContainerClasses = cn(
    'flex items-center rounded-xl border shadow-sm',
    'transition-all duration-200',
    'focus-within:-translate-y-0.5 focus-within:shadow-md',
    'hover:-translate-y-0.5',
    sizeClasses[size],
    variantClasses[variant],
    error && 'border-danger focus-within:border-danger',
    disabled &&
      'bg-disabled text-disabled-text cursor-not-allowed hover:border-border hover:bg-disabled hover:shadow-none hover:translate-y-0 focus-within:translate-y-0 focus-within:shadow-none focus-within:border-border',
    containerClassName,
  );

  // ✅ Función segura para renderizar iconos - SIN ANY
  const renderIcon = (iconElement: ReactNode) => {
    if (!iconElement) return null;

    if (isValidElement<IconProps>(iconElement)) {
      const existingProps = iconElement.props;
      const iconSize = iconSizeMap[size];

      return (
        <span className={cn('shrink-0', existingProps.className)}>
          {cloneElement(iconElement, {
            size: iconSize,
          } as Partial<IconProps>)}
        </span>
      );
    }

    return <span className="shrink-0">{iconElement}</span>;
  };

  // ✅ Función segura para renderizar elementos derecho - SIN ANY
  const renderRightElement = (element: ReactNode) => {
    if (!element) return null;

    if (isValidElement<RightElementProps>(element)) {
      const existingProps = element.props;

      const isCustomComponent =
        typeof element.type === 'function' ||
        (typeof element.type === 'object' && element.type !== null);

      if (isCustomComponent) {
        return cloneElement(element, {
          className: cn(
            'text-foreground-muted hover:text-primary-hover',
            'grid cursor-pointer place-items-center',
            'border-0 bg-transparent p-1 transition-colors',
            existingProps.className,
          ),
        } as Partial<RightElementProps>);
      }
    }

    return <span className="shrink-0">{element}</span>;
  };

  // Estilos para opciones del select
  const selectOptionClasses = cn(
    'bg-background text-foreground',
    'hover:bg-surface-hover',
    'focus:bg-surface-active',
  );

  const errorId = fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={fieldId} className="grid gap-1.5">
        <span
          className={cn(
            'text-sm font-semibold',
            disabled ? 'text-disabled-text' : 'text-foreground',
          )}
        >
          {label}
          {required && <span className="text-danger ml-0.5">*</span>}
        </span>
        <div className={baseContainerClasses}>
          {icon && renderIcon(icon)}

          {isSelect ? (
            <select
              id={fieldId}
              name={name}
              value={String(value)}
              onChange={onChange}
              className={baseInputClasses}
              required={required}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={errorId}
            >
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className={selectOptionClasses}
                >
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              id={fieldId}
              type={type}
              name={name}
              value={String(value)}
              onChange={onChange}
              placeholder={placeholder}
              autoComplete={autoComplete}
              required={required}
              disabled={disabled}
              className={baseInputClasses}
              aria-invalid={!!error}
              aria-describedby={errorId}
            />
          )}

          {rightElement && renderRightElement(rightElement)}
        </div>
      </label>
      {error && errorId && (
        <p
          id={errorId}
          className={cn(
            'text-danger text-xs leading-relaxed',
            'animate-in fade-in duration-200',
          )}
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
};

export default InputField;
