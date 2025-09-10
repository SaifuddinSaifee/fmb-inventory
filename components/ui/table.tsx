import { ReactNode } from "react";

type WithClassName = { className?: string };

export function Table({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return (
    <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
      {children}
    </table>
  );
}

export function THead({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return <thead className={`bg-gray-50 ${className}`}>{children}</thead>;
}

export function TBody({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return (
    <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
      {children}
    </tbody>
  );
}

export function TR({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return <tr className={className}>{children}</tr>;
}

export function TH({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return (
    <th
      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className = "",
}: { children: ReactNode } & WithClassName) {
  return (
    <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
      {children}
    </td>
  );
}
