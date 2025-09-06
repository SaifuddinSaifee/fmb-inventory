import { z } from "zod";

// Centralized units catalogue. Update this list to add/remove units.
export const UNITS = [
  { unit: "Kilograms", abbreviation: "kg" },
  { unit: "Grams", abbreviation: "g" },
  { unit: "Liters", abbreviation: "L" },
  { unit: "Milliliters", abbreviation: "ml" },
  { unit: "Pieces", abbreviation: "pcs" },
] as const;

export type UnitAbbreviation = (typeof UNITS)[number]["abbreviation"];

export type Unit = Readonly<{
  unit: string;
  abbreviation: UnitAbbreviation;
}>;

// Map for quick lookups by abbreviation
export const UNIT_MAP: Record<UnitAbbreviation, Unit> = UNITS.reduce(
  (acc, u) => {
    acc[u.abbreviation as UnitAbbreviation] = u as Unit;
    return acc;
  },
  {} as Record<UnitAbbreviation, Unit>
);

// Zod enum for validation, derived from the catalogue above
const abbreviations = UNITS.map((u) => u.abbreviation) as UnitAbbreviation[];
export const unitEnum = z.enum(
  abbreviations as [UnitAbbreviation, ...UnitAbbreviation[]]
);

// Utilities
export function getAllUnits(): ReadonlyArray<Unit> {
  return UNITS as unknown as ReadonlyArray<Unit>;
}

export function getUnitLabel(abbreviation: UnitAbbreviation): string {
  const def = UNIT_MAP[abbreviation];
  return `${def.unit} (${def.abbreviation})`;
}

export function getUnitOptions(): ReadonlyArray<{
  value: UnitAbbreviation;
  label: string;
}> {
  return UNITS.map((u) => ({
    value: u.abbreviation as UnitAbbreviation,
    label: `${u.unit} (${u.abbreviation})`,
  }));
}
