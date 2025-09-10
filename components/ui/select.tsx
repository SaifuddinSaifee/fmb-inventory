import { SelectHTMLAttributes, forwardRef } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  className?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => {
    const base =
      "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500";
    return (
      <select ref={ref} className={`${base} ${className}`} {...props}>
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";
