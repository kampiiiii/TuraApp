"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type SubmitButtonProps = Omit<ComponentProps<"button">, "type"> & {
  pendingLabel?: string;
};

export function SubmitButton({
  children,
  className,
  disabled,
  pendingLabel = "Wird gespeichert",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      {...props}
      className={["submit-button", className].filter(Boolean).join(" ")}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      aria-label={pending ? pendingLabel : props["aria-label"]}
    >
      <span className={pending ? "submit-button-content pending" : "submit-button-content"}>{children}</span>
      {pending ? <LoaderCircle className="submit-spinner" size={17} aria-hidden="true" /> : null}
    </button>
  );
}

