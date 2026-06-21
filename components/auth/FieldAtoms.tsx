import { cn } from '@/lib/utils'

export function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs text-destructive mt-1 leading-relaxed">
      {message}
    </p>
  )
}

export function FieldWarning({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p role="status" className="text-xs text-amber-500 dark:text-amber-400 mt-1 leading-relaxed">
      {message}
    </p>
  )
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <div
      role="alert"
      className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive leading-relaxed"
    >
      {message}
    </div>
  )
}

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  errorId?: string
}

export function InputField({ label, error, hint, errorId, className, ...props }: InputFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-foreground/80">
        {label}
        {props.required && <span className="ml-0.5 text-destructive" aria-hidden="true">*</span>}
      </label>
      <input
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'w-full rounded-lg border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground',
          'transition-colors outline-none',
          'focus:border-ring focus:bg-background focus:ring-2 focus:ring-ring/30',
          error && 'border-destructive focus:border-destructive focus:ring-destructive/25',
          !error && 'border-border',
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      <FieldError message={error} id={errorId} />
    </div>
  )
}
