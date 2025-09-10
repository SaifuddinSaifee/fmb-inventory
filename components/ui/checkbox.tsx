import { InputHTMLAttributes, forwardRef } from "react";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  label?: string;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", label, ...props }, ref) => {
    return (
      <label className={`inline-flex items-center gap-2 ${className}`}>
        <input ref={ref} type="checkbox" {...props} />
        {label}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";


