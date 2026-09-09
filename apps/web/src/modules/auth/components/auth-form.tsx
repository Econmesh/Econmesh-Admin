"use client";

import { Button } from "@econmesh-admin/ui/components/button";
import { Input } from "@econmesh-admin/ui/components/input";
import { Label } from "@econmesh-admin/ui/components/label";
import { cn } from "@econmesh-admin/ui/lib/utils";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, type ComponentProps, type FormEvent, type ReactNode } from "react";

export function AuthForm({
  onSubmit,
  children,
  submitLabel,
  loading,
  footer,
}: {
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  children: ReactNode;
  submitLabel: string;
  loading?: boolean;
  footer?: ReactNode;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit(e);
      }}
      className="space-y-4 rounded-xl border border-border/80 bg-card/80 p-6 shadow-lg backdrop-blur-sm"
      noValidate
    >
      {children}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Aguarde…
          </>
        ) : (
          submitLabel
        )}
      </Button>
      {footer}
    </form>
  );
}

export function FormField({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function FormInput(props: ComponentProps<typeof Input> & { id: string }) {
  const { id, "aria-invalid": ariaInvalid, type, className, ...rest } = props;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  const input = (
    <Input
      id={id}
      type={isPassword && visible ? "text" : type}
      aria-invalid={ariaInvalid}
      aria-describedby={ariaInvalid ? `${id}-error` : undefined}
      className={cn(isPassword && "pr-9", className)}
      {...rest}
    />
  );

  if (!isPassword) {
    return input;
  }

  return (
    <div className="relative">
      {input}
      <button
        type="button"
        className="absolute inset-y-0 right-0 flex items-center px-2.5 text-muted-foreground hover:text-foreground"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
      </button>
    </div>
  );
}

export function useFormErrors<T extends string>() {
  const [errors, setErrors] = useState<Partial<Record<T, string>>>({});
  return { errors, setErrors, clear: () => setErrors({}) };
}
