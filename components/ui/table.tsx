import { ReactNode } from "react";

export function Table({ children }: { children: ReactNode }) {
  return (
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="bg-white divide-y divide-gray-200">{children}</tbody>;
}

export function TR({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function TH({ children }: { children: ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
      {children}
    </th>
  );
}

export function TD({ children }: { children: ReactNode }) {
  return <td className="px-6 py-4 whitespace-nowrap text-sm">{children}</td>;
}


