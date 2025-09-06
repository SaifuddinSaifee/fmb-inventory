"use client";

import { useEffect, useRef, useState } from "react";

type EditableTextProps = {
  value: string | number;
  onSave: (nextValue: string | number) => void | Promise<void>;
  type?: "text" | "number";
  className?: string;
  inputClassName?: string;
  displayFormatter?: (value: string | number) => React.ReactNode;
  min?: number;
  max?: number;
  step?: number;
};

export default function EditableText({
  value,
  onSave,
  type = "text",
  className,
  inputClassName,
  displayFormatter,
  min,
  max,
  step,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<string>(() => String(value ?? ""));
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setDraft(String(value ?? ""));
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      try {
        const nextValue = type === "number" ? Number(draft) : draft;
        await onSave(nextValue);
        setIsEditing(false);
      } catch {
        // Keep editing if save fails; parent can handle errors via onSave
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setDraft(String(value ?? ""));
      setIsEditing(false);
    }
  };

  if (!isEditing) {
    return (
      <button
        type="button"
        className={"text-left " + (className ?? "")}
        onClick={() => setIsEditing(true)}
        aria-label="Edit value"
      >
        {displayFormatter ? displayFormatter(value) : String(value ?? "")}      
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={() => {
        setDraft(String(value ?? ""));
        setIsEditing(false);
      }}
      min={type === "number" ? min : undefined}
      max={type === "number" ? max : undefined}
      step={type === "number" ? step : undefined}
      className={inputClassName}
      aria-label="Editable input"
    />
  );
}


