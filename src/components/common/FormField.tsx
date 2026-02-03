import type { FieldValues, Path, Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  children?: (field: {
    value: unknown;
    onChange: (...event: unknown[]) => void;
    onBlur: () => void;
    name: string;
    ref: React.Ref<unknown>;
  }) => React.ReactNode;
}

export function FormField<TFieldValues extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  type = 'text',
  required,
  className,
  children,
}: FormFieldProps<TFieldValues>) {
  const { t } = useTranslation();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <div className={cn('space-y-2', className)}>
          <Label htmlFor={name} className={cn(required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
          {children ? (
            children(field)
          ) : (
            <Input
              id={name}
              type={type}
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              className={cn(error && 'border-destructive')}
            />
          )}
          {error?.message && (
            <p className="text-sm text-destructive">
              {t(error.message)}
            </p>
          )}
        </div>
      )}
    />
  );
}
