"use client";
import { forwardRef, InputHTMLAttributes, ReactNode, useId } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helper, error, leadingIcon, trailingIcon, className, id, ...props }, ref) => {
    const uid = useId();
    const inputId = id ?? uid;
    const hasError = Boolean(error);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-t1"
          >
            {label}
            {props.required && <span className="text-[var(--danger)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {leadingIcon && (
            <span className="absolute left-3 text-t2 pointer-events-none">{leadingIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined}
            aria-invalid={hasError}
            className={cn(
              "w-full h-11 rounded-xl bg-[var(--surface-2)] border font-sans text-sm text-t1",
              "placeholder:text-t3 transition-all duration-150",
              "focus:outline-none focus:border-violet focus:ring-1 focus:ring-violet",
              hasError
                ? "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]"
                : "border-[var(--border)]",
              leadingIcon  ? "pl-10" : "pl-3.5",
              trailingIcon ? "pr-10" : "pr-3.5",
              className,
            )}
            {...props}
          />
          {trailingIcon && (
            <span className="absolute right-3 text-t2">{trailingIcon}</span>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[var(--danger)]">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={`${inputId}-helper`} className="text-xs text-t2">
            {helper}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
